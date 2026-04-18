import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FactoryGuard } from '../auth/guards/factory.guard';

@ApiTags('服装厂商品管理')
@Controller('factory/products')
@UseGuards(JwtAuthGuard, FactoryGuard)
@ApiBearerAuth()
export class FactoryProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '获取服装厂自己的商品列表' })
  @ApiResponse({ status: 200, description: '商品列表', type: [Product] })
  async getMyProducts(@Req() req): Promise<Product[]> {
    return this.productsService.findByCreatedBy(req.user.id);
  }

  @Post()
  @ApiOperation({ summary: '创建商品' })
  @ApiResponse({ status: 201, description: '商品创建成功', type: Product })
  async create(
    @Req() req,
    @Body() createProductDto: CreateProductDto,
  ): Promise<Product> {
    return this.productsService.create(createProductDto, req.user);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新商品' })
  @ApiResponse({ status: 200, description: '商品更新成功', type: Product })
  async update(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productsService.update(id, updateProductDto, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: '禁用商品' })
  @ApiResponse({ status: 200, description: '商品禁用成功' })
  async remove(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.productsService.remove(id, req.user);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: '启用商品' })
  @ApiResponse({ status: 200, description: '商品启用成功' })
  async activate(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.productsService.activate(id, req.user);
  }

  @Put(':id/stock')
  @ApiOperation({ summary: '更新商品库存' })
  @ApiResponse({ status: 200, description: '库存更新成功', type: Product })
  async updateStock(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('quantity') quantity: number,
  ): Promise<Product> {
    return this.productsService.updateStock(id, quantity, req.user);
  }
}