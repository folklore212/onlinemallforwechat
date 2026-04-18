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
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('订单')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: '从购物车创建订单' })
  @ApiResponse({ status: 201, description: '订单创建成功', type: Order })
  @ApiResponse({ status: 400, description: '参数错误或购物车为空' })
  async createOrder(
    @Req() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    return this.ordersService.createFromCart(req.user.id, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: '获取用户自己的订单列表' })
  @ApiResponse({ status: 200, description: '订单列表', type: [Order] })
  async getUserOrders(@Req() req): Promise<Order[]> {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取订单详情' })
  @ApiResponse({ status: 200, description: '订单详情', type: Order })
  @ApiResponse({ status: 404, description: '订单不存在' })
  async getOrder(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return this.ordersService.findOne(id, req.user.id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消订单（只能取消待确认的订单）' })
  @ApiResponse({ status: 200, description: '订单取消成功', type: Order })
  @ApiResponse({ status: 400, description: '无法取消该订单' })
  async cancelOrder(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<Order> {
    return this.ordersService.cancelOrder(id, req.user.id);
  }
}