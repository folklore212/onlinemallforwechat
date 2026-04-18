import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User, UserType } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ShoppingCart)
    private readonly shoppingCartRepository: Repository<ShoppingCart>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 生成订单号（格式：年月日+6位随机数）
   */
  private generateOrderNo(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${year}${month}${day}${random}`;
  }

  /**
   * 从购物车创建订单
   */
  async createFromCart(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 获取用户信息
      const user = await queryRunner.manager.findOne(User, {
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`用户 #${userId} 不存在`);
      }

      // 获取用户的购物车
      const cartItems = await queryRunner.manager.find(ShoppingCart, {
        where: { userId },
        relations: ['product'],
      });

      if (cartItems.length === 0) {
        throw new BadRequestException('购物车为空');
      }

      // 计算总金额并验证库存
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const cartItem of cartItems) {
        const product = cartItem.product;

        // 验证库存
        if (product.stockQuantity < cartItem.quantity) {
          throw new BadRequestException(
            `商品 "${product.name}" 库存不足，库存: ${product.stockQuantity}`,
          );
        }

        // 验证最小起订量
        if (cartItem.quantity < product.minOrderQuantity) {
          throw new BadRequestException(
            `商品 "${product.name}" 最小起订量为 ${product.minOrderQuantity}`,
          );
        }

        // 验证最大订购量
        if (
          product.maxOrderQuantity &&
          cartItem.quantity > product.maxOrderQuantity
        ) {
          throw new BadRequestException(
            `商品 "${product.name}" 最大订购量为 ${product.maxOrderQuantity}`,
          );
        }

        // 扣减库存
        product.stockQuantity -= cartItem.quantity;
        await queryRunner.manager.save(product);

        // 创建订单明细
        const subtotal = cartItem.quantity * product.unitPrice;
        totalAmount += subtotal;

        const orderItem = this.orderItemRepository.create({
          productId: product.id,
          productName: product.name,
          unitPrice: product.unitPrice,
          quantity: cartItem.quantity,
          selectedSize: cartItem.selectedSize,
          selectedColor: cartItem.selectedColor,
          subtotal,
        });

        orderItems.push(orderItem);
      }

      // 创建订单
      const order = this.orderRepository.create({
        orderNo: this.generateOrderNo(),
        userId,
        companyName: createOrderDto.companyName || user.companyName,
        contactPerson: createOrderDto.contactPerson || user.contactPerson,
        contactPhone: createOrderDto.contactPhone || user.contactPhone,
        deliveryAddress: createOrderDto.deliveryAddress || user.companyAddress,
        totalAmount,
        orderStatus: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.NOT_REQUIRED, // 政企客户无需支付
        notes: createOrderDto.notes,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // 清空购物车
      await queryRunner.manager.delete(ShoppingCart, { userId });

      await queryRunner.commitTransaction();

      // 返回完整的订单信息
      return this.orderRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['user', 'items', 'items.product'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取用户自己的订单列表
   */
  async getUserOrders(userId: number): Promise<Order[]> {
    return this.orderRepository.find({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 获取订单详情
   */
  async findOne(id: number, userId?: number): Promise<Order> {
    const where: any = { id };
    if (userId) {
      where.userId = userId; // 用户只能查看自己的订单
    }

    const order = await this.orderRepository.findOne({
      where,
      relations: ['user', 'items', 'items.product', 'confirmedBy'],
    });

    if (!order) {
      throw new NotFoundException(`订单 #${id} 不存在`);
    }

    return order;
  }

  /**
   * 取消订单（只能取消待确认的订单）
   */
  async cancelOrder(id: number, userId: number): Promise<Order> {
    const order = await this.findOne(id, userId);

    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('只能取消待确认的订单');
    }

    order.orderStatus = OrderStatus.CANCELLED;

    // 恢复库存
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of order.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (product) {
          product.stockQuantity += item.quantity;
          await queryRunner.manager.save(product);
        }
      }

      await queryRunner.manager.save(order);
      await queryRunner.commitTransaction();

      return order;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取服装厂相关的订单（包含自己商品的订单）
   */
  async getFactoryOrders(userId: number): Promise<Order[]> {
    // 获取服装厂创建的商品
    const products = await this.productRepository.find({
      where: { createdById: userId },
      select: ['id'],
    });

    if (products.length === 0) {
      return [];
    }

    const productIds = products.map((p) => p.id);

    // 查找包含这些商品的订单
    const orders = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('order.user', 'user')
      .where('items.productId IN (:...productIds)', { productIds })
      .orderBy('order.createdAt', 'DESC')
      .getMany();

    return orders;
  }

  /**
   * 服装厂确认订单
   */
  async confirmOrder(orderId: number, factoryUserId: number): Promise<Order> {
    const order = await this.findOne(orderId);

    // 检查订单是否属于该服装厂（订单中包含该服装厂的商品）
    const factoryProducts = await this.productRepository.find({
      where: { createdById: factoryUserId },
      select: ['id'],
    });

    const factoryProductIds = factoryProducts.map((p) => p.id);
    const orderProductIds = order.items.map((item) => item.productId);

    const hasFactoryProduct = orderProductIds.some((id) =>
      factoryProductIds.includes(id),
    );

    if (!hasFactoryProduct) {
      throw new ForbiddenException('无权确认此订单');
    }

    if (order.orderStatus !== OrderStatus.PENDING) {
      throw new BadRequestException('只能确认待确认的订单');
    }

    order.orderStatus = OrderStatus.CONFIRMED;
    order.confirmedById = factoryUserId;
    order.confirmedAt = new Date();

    return this.orderRepository.save(order);
  }

  /**
   * 更新订单状态（管理员或服装厂）
   */
  async updateOrderStatus(
    orderId: number,
    status: OrderStatus,
    user: User,
    adminNotes?: string,
  ): Promise<Order> {
    const order = await this.findOne(orderId);

    // 权限检查
    if (user.userType === UserType.CLOTHING_FACTORY) {
      // 服装厂只能更新包含自己商品的订单
      const factoryProducts = await this.productRepository.find({
        where: { createdById: user.id },
        select: ['id'],
      });

      const factoryProductIds = factoryProducts.map((p) => p.id);
      const orderProductIds = order.items.map((item) => item.productId);

      const hasFactoryProduct = orderProductIds.some((id) =>
        factoryProductIds.includes(id),
      );

      if (!hasFactoryProduct) {
        throw new ForbiddenException('无权更新此订单状态');
      }

      // 服装厂只能确认订单
      if (status !== OrderStatus.CONFIRMED && order.orderStatus !== OrderStatus.PENDING) {
        throw new ForbiddenException('服装厂只能确认待确认的订单');
      }
    }

    // 状态流转验证
    this.validateStatusTransition(order.orderStatus, status, user.userType);

    // 更新状态和时间戳
    order.orderStatus = status;

    if (status === OrderStatus.SHIPPED) {
      order.shippedAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    return this.orderRepository.save(order);
  }

  /**
   * 验证订单状态流转是否合法
   */
  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userType: UserType,
  ): void {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `无法从 ${currentStatus} 状态转移到 ${newStatus} 状态`,
      );
    }

    // 特殊权限检查
    if (userType === UserType.CLOTHING_FACTORY && newStatus !== OrderStatus.CONFIRMED) {
      throw new ForbiddenException('服装厂只能确认订单');
    }
  }

  /**
   * 获取所有订单（管理员）
   */
  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据状态筛选订单
   */
  async findByStatus(status: OrderStatus): Promise<Order[]> {
    return this.orderRepository.find({
      where: { orderStatus: status },
      relations: ['user', 'items'],
      order: { createdAt: 'DESC' },
    });
  }
}