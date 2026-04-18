import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { Product } from './entities/product.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('管理员商品管理')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: '获取所有商品（包括已禁用的）' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: '商品列表', type: [Product] })
  async findAll(@Query('includeInactive') includeInactive?: boolean): Promise<Product[]> {
    return this.productsService.findAll(includeInactive === true);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取商品详情（包括已禁用的）' })
  @ApiResponse({ status: 200, description: '商品详情', type: Product })
  @ApiResponse({ status: 404, description: '商品不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Product> {
    return this.productsService.findOne(id, true);
  }

  @Delete(':id')
  @ApiOperation({ summary: '禁用商品' })
  @ApiResponse({ status: 200, description: '商品禁用成功' })
  async remove(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<void> {
    await this.productsService.remove(id, req.user);
  }

  @Put(':id/activate')
  @ApiOperation({ summary: '启用商品' })
  @ApiResponse({ status: 200, description: '商品启用成功' })
  async activate(@Param('id', ParseIntPipe) id: number, @Req() req): Promise<void> {
    await this.productsService.activate(id, req.user);
  }
}