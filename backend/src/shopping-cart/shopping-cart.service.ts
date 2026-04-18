import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { CreateShoppingCartItemDto } from './dto/create-shopping-cart-item.dto';
import { UpdateShoppingCartItemDto } from './dto/update-shopping-cart-item.dto';

@Injectable()
export class ShoppingCartService {
  constructor(
    @InjectRepository(ShoppingCart)
    private readonly shoppingCartRepository: Repository<ShoppingCart>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 获取用户的购物车
   */
  async getCart(userId: number): Promise<ShoppingCart[]> {
    return this.shoppingCartRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 添加商品到购物车
   */
  async addToCart(
    userId: number,
    createShoppingCartItemDto: CreateShoppingCartItemDto,
  ): Promise<ShoppingCart> {
    const { productId, quantity, selectedSize, selectedColor, notes } =
      createShoppingCartItemDto;

    // 验证用户是否存在
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`用户 #${userId} 不存在`);
    }

    // 验证商品是否存在且有效
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`商品 #${productId} 不存在或已下架`);
    }

    // 验证库存
    if (product.stockQuantity < quantity) {
      throw new BadRequestException('库存不足');
    }

    // 验证最小起订量
    if (quantity < product.minOrderQuantity) {
      throw new BadRequestException(
        `最小起订量为 ${product.minOrderQuantity}`,
      );
    }

    // 验证最大订购量
    if (
      product.maxOrderQuantity &&
      quantity > product.maxOrderQuantity
    ) {
      throw new BadRequestException(
        `最大订购量为 ${product.maxOrderQuantity}`,
      );
    }

    // 检查是否已存在相同的购物车项（相同商品、尺码、颜色）
    const existingItem = await this.shoppingCartRepository.findOne({
      where: {
        userId,
        productId,
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
      },
    });

    if (existingItem) {
      // 如果已存在，则更新数量
      const newQuantity = existingItem.quantity + quantity;

      // 再次验证库存和订购限制
      if (product.stockQuantity < newQuantity) {
        throw new BadRequestException('库存不足');
      }

      if (
        product.maxOrderQuantity &&
        newQuantity > product.maxOrderQuantity
      ) {
        throw new BadRequestException(
          `最大订购量为 ${product.maxOrderQuantity}`,
        );
      }

      existingItem.quantity = newQuantity;
      existingItem.notes = notes || existingItem.notes;

      return this.shoppingCartRepository.save(existingItem);
    }

    // 创建新的购物车项
    const cartItem = this.shoppingCartRepository.create({
      userId,
      productId,
      quantity,
      selectedSize,
      selectedColor,
      notes,
    });

    return this.shoppingCartRepository.save(cartItem);
  }

  /**
   * 更新购物车项
   */
  async updateCartItem(
    userId: number,
    cartItemId: number,
    updateShoppingCartItemDto: UpdateShoppingCartItemDto,
  ): Promise<ShoppingCart> {
    const cartItem = await this.shoppingCartRepository.findOne({
      where: { id: cartItemId, userId },
      relations: ['product'],
    });

    if (!cartItem) {
      throw new NotFoundException(`购物车项 #${cartItemId} 不存在`);
    }

    // 如果更新数量，需要验证
    if (updateShoppingCartItemDto.quantity !== undefined) {
      const quantity = updateShoppingCartItemDto.quantity;
      const product = cartItem.product;

      if (quantity < product.minOrderQuantity) {
        throw new BadRequestException(
          `最小起订量为 ${product.minOrderQuantity}`,
        );
      }

      if (product.maxOrderQuantity && quantity > product.maxOrderQuantity) {
        throw new BadRequestException(
          `最大订购量为 ${product.maxOrderQuantity}`,
        );
      }

      if (product.stockQuantity < quantity) {
        throw new BadRequestException('库存不足');
      }

      cartItem.quantity = quantity;
    }

    // 更新其他字段
    if (updateShoppingCartItemDto.selectedSize !== undefined) {
      cartItem.selectedSize = updateShoppingCartItemDto.selectedSize;
    }

    if (updateShoppingCartItemDto.selectedColor !== undefined) {
      cartItem.selectedColor = updateShoppingCartItemDto.selectedColor;
    }

    if (updateShoppingCartItemDto.notes !== undefined) {
      cartItem.notes = updateShoppingCartItemDto.notes;
    }

    return this.shoppingCartRepository.save(cartItem);
  }

  /**
   * 删除购物车项
   */
  async removeCartItem(userId: number, cartItemId: number): Promise<void> {
    const result = await this.shoppingCartRepository.delete({
      id: cartItemId,
      userId,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`购物车项 #${cartItemId} 不存在`);
    }
  }

  /**
   * 清空购物车
   */
  async clearCart(userId: number): Promise<void> {
    await this.shoppingCartRepository.delete({ userId });
  }

  /**
   * 批量更新购物车项数量
   */
  async batchUpdate(
    userId: number,
    updates: Array<{ cartItemId: number; quantity: number }>,
  ): Promise<ShoppingCart[]> {
    const results: ShoppingCart[] = [];

    for (const update of updates) {
      try {
        const cartItem = await this.shoppingCartRepository.findOne({
          where: { id: update.cartItemId, userId },
          relations: ['product'],
        });

        if (!cartItem) {
          continue; // 跳过不存在的项
        }

        const product = cartItem.product;

        // 验证数量
        if (update.quantity < product.minOrderQuantity) {
          continue; // 跳过不符合最小起订量的项
        }

        if (
          product.maxOrderQuantity &&
          update.quantity > product.maxOrderQuantity
        ) {
          continue; // 跳过超过最大订购量的项
        }

        if (product.stockQuantity < update.quantity) {
          continue; // 跳过库存不足的项
        }

        cartItem.quantity = update.quantity;
        const savedItem = await this.shoppingCartRepository.save(cartItem);
        results.push(savedItem);
      } catch (error) {
        // 跳过错误的项
        continue;
      }
    }

    return results;
  }

  /**
   * 获取购物车商品总数和总金额
   */
  async getCartSummary(userId: number): Promise<{
    totalItems: number;
    totalAmount: number;
    items: ShoppingCart[];
  }> {
    const items = await this.getCart(userId);

    let totalItems = 0;
    let totalAmount = 0;

    for (const item of items) {
      totalItems += item.quantity;
      totalAmount += item.quantity * item.product.unitPrice;
    }

    return {
      totalItems,
      totalAmount,
      items,
    };
  }
}