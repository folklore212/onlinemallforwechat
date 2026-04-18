import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: TreeRepository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);

    if (createCategoryDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });
      if (parent) {
        category.parent = parent;
      }
    }

    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findTree(): Promise<Category[]> {
    return this.categoryRepository.findTrees();
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, isActive: true },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`分类 #${id} 不存在`);
    }

    return category;
  }

  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.parentId !== undefined) {
      if (updateCategoryDto.parentId === null) {
        category.parent = null;
      } else {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateCategoryDto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(`父分类 #${updateCategoryDto.parentId} 不存在`);
        }
        category.parent = parent;
      }
    }

    Object.assign(category, updateCategoryDto);

    return this.categoryRepository.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    category.isActive = false;
    await this.categoryRepository.save(category);
  }

  async activate(id: number): Promise<void> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException(`分类 #${id} 不存在`);
    }
    category.isActive = true;
    await this.categoryRepository.save(category);
  }

  async findByParent(parentId?: number): Promise<Category[]> {
    if (parentId) {
      return this.categoryRepository.find({
        where: { parentId, isActive: true },
        order: { sortOrder: 'ASC' },
      });
    }

    // 获取根分类
    return this.categoryRepository.find({
      where: { parentId: null, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }
}