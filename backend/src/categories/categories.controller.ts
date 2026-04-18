import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('商品分类')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: '获取所有分类列表' })
  @ApiResponse({ status: 200, description: '分类列表', type: [Category] })
  async findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: '获取分类树形结构' })
  @ApiResponse({ status: 200, description: '分类树', type: [Category] })
  async findTree(): Promise<Category[]> {
    return this.categoriesService.findTree();
  }

  @Get('by-parent')
  @ApiOperation({ summary: '根据父分类获取子分类' })
  @ApiQuery({ name: 'parentId', required: false, type: Number })
  @ApiResponse({ status: 200, description: '子分类列表', type: [Category] })
  async findByParent(@Query('parentId') parentId?: number): Promise<Category[]> {
    return this.categoriesService.findByParent(parentId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取分类详情' })
  @ApiResponse({ status: 200, description: '分类详情', type: Category })
  @ApiResponse({ status: 404, description: '分类不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Category> {
    return this.categoriesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建分类（仅管理员）' })
  @ApiResponse({ status: 201, description: '分类创建成功', type: Category })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新分类（仅管理员）' })
  @ApiResponse({ status: 200, description: '分类更新成功', type: Category })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '禁用分类（仅管理员）' })
  @ApiResponse({ status: 200, description: '分类禁用成功' })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.remove(id);
  }

  @Put(':id/activate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '启用分类（仅管理员）' })
  @ApiResponse({ status: 200, description: '分类启用成功' })
  async activate(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.categoriesService.activate(id);
  }
}