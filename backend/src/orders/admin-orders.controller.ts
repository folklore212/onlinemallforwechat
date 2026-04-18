import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Order, OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('管理员订单管理')
@Controller('admin/orders')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '获取所有订单' })
  @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
  @ApiResponse({ status: 200, description: '订单列表', type: [Order] })
  async findAll(@Query('status') status?: OrderStatus): Promise<Order[]> {
    if (status) {
      return this.ordersService.findByStatus(status);
    }
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiResponse({ status: 200, description: '订单详情', type: Order })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '更新订单状态' })
  @ApiResponse({ status: 200, description: '状态更新成功', type: Order })
  @ApiResponse({ status: 400, description: '状态流转不合法' })
  async updateOrderStatus(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: OrderStatus,
    @Body('adminNotes') adminNotes?: string,
  ): Promise<Order> {
    return this.ordersService.updateOrderStatus(
      id,
      status,
      req.user,
      adminNotes,
    );
  }
}