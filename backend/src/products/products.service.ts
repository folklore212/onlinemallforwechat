import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { User, UserType } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, user: User): Promise<Product> {
    // 验证分类是否存在
    const category = await this.categoryRepository.findOne({
      where: { id: createProductDto.categoryId, isActive: true },
    });

    if (!category) {
      throw new NotFoundException(`分类 #${createProductDto.categoryId} 不存在或已禁用`);
    }

    const product = this.productRepository.create({
      ...createProductDto,
      category,
      createdBy: user,
      createdById: user.id,
    });

    return this.productRepository.save(product);
  }

  async findAll(includeInactive = false): Promise<Product[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    return this.productRepository.find({
      where,
      relations: ['category', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: number, includeInactive = false): Promise<Product> {
    const where: any = { id };
    if (!includeInactive) {
      where.isActive = true;
    }

    const product = await this.productRepository.findOne({
      where,
      relations: ['category', 'createdBy'],
    });

    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, user: User): Promise<Product> {
    const product = await this.findOne(id, true); // 包括已禁用的商品

    // 权限检查：服装厂只能更新自己的商品，管理员可以更新所有
    if (user.userType !== UserType.ADMIN && product.createdById !== user.id) {
      throw new ForbiddenException('无权更新此商品');
    }

    if (updateProductDto.categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: updateProductDto.categoryId, isActive: true },
      });

      if (!category) {
        throw new NotFoundException(`分类 #${updateProductDto.categoryId} 不存在或已禁用`);
      }

      product.category = category;
      product.categoryId = updateProductDto.categoryId;
    }

    Object.assign(product, updateProductDto);

    return this.productRepository.save(product);
  }

  async remove(id: number, user: User): Promise<void> {
    const product = await this.findOne(id, true);

    // 权限检查
    if (user.userType !== UserType.ADMIN && product.createdById !== user.id) {
      throw new ForbiddenException('无权删除此商品');
    }

    product.isActive = false;
    await this.productRepository.save(product);
  }

  async activate(id: number, user: User): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`商品 #${id} 不存在`);
    }

    // 权限检查
    if (user.userType !== UserType.ADMIN && product.createdById !== user.id) {
      throw new ForbiddenException('无权启用此商品');
    }

    product.isActive = true;
    await this.productRepository.save(product);
  }

  async findByCategory(categoryId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { categoryId, isActive: true },
      relations: ['category', 'createdBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCreatedBy(userId: number): Promise<Product[]> {
    return this.productRepository.find({
      where: { createdById: userId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async search(keyword: string): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('(product.name LIKE :keyword OR product.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      })
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async updateStock(id: number, quantity: number, user: User): Promise<Product> {
    const product = await this.findOne(id, true);

    // 权限检查：只有服装厂可以更新自己商品的库存
    if (user.userType !== UserType.ADMIN && product.createdById !== user.id) {
      throw new ForbiddenException('无权更新此商品库存');
    }

    product.stockQuantity = quantity;
    return this.productRepository.save(product);
  }
}