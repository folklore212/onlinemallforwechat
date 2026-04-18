import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FactoryGuard } from '../auth/guards/factory.guard';

@ApiTags('服装厂订单管理')
@Controller('factory/orders')
@UseGuards(JwtAuthGuard, FactoryGuard)
@ApiBearerAuth()
export class FactoryOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: '获取服装厂相关的订单（包含自己商品的订单）' })
  @ApiResponse({ status: 200, description: '订单列表', type: [Order] })
  async getFactoryOrders(@Req() req): Promise<Order[]> {
    return this.ordersService.getFactoryOrders(req.user.id);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: '确认订单' })
  @ApiResponse({ status: 200, description: '订单确认成功', type: Order })
  @ApiResponse({ status: 403, description: '无权确认此订单' })
  @ApiResponse({ status: 400, description: '无法确认该订单' })
  async confirmOrder(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return this.ordersService.confirmOrder(id, req.user.id);
  }

  @Post(':id/status')
  @ApiOperation({ summary: '更新订单状态（服装厂只能确认订单）' })
  @ApiResponse({ status: 200, description: '状态更新成功', type: Order })
  @ApiResponse({ status: 403, description: '无权更新此订单' })
  async updateOrderStatus(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
    @Body('notes') notes?: string,
  ): Promise<Order> {
    // 服装厂只能确认订单，这里简化处理
    if (status !== 'confirmed') {
      throw new Error('服装厂只能确认订单');
    }

    return this.ordersService.confirmOrder(id, req.user.id);
  }
}