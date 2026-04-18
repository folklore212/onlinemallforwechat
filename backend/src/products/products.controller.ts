import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';

@ApiTags('商品')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '获取商品列表' })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  @ApiQuery({ name: 'keyword', required: false, type: String })
  @ApiResponse({ status: 200, description: '商品列表', type: [Product] })
  async findAll(
    @Query('categoryId') categoryId?: number,
    @Query('keyword') keyword?: string,
  ): Promise<Product[]> {
    if (categoryId) {
      return this.productsService.findByCategory(categoryId);
    }

    if (keyword) {
      return this.productsService.search(keyword);
    }

    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取商品详情' })
  @ApiResponse({ status: 200, description: '商品详情', type: Product })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id);
  }
}