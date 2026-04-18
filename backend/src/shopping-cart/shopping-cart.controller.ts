import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
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
import { ShoppingCartService } from './shopping-cart.service';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { CreateShoppingCartItemDto } from './dto/create-shopping-cart-item.dto';
import { UpdateShoppingCartItemDto } from './dto/update-shopping-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('购物车')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShoppingCartController {
  constructor(private readonly shoppingCartService: ShoppingCartService) {}

  @Get()
  @ApiOperation({ summary: '获取购物车列表' })
  @ApiResponse({ status: 200, description: '购物车列表', type: [ShoppingCart] })
  async getCart(@Req() req): Promise<ShoppingCart[]> {
    return this.shoppingCartService.getCart(req.user.id);
  }

  @Get('summary')
  @ApiOperation({ summary: '获取购物车汇总信息' })
  @ApiResponse({
    status: 200,
    description: '购物车汇总',
    schema: {
      type: 'object',
      properties: {
        totalItems: { type: 'number', example: 5 },
        totalAmount: { type: 'number', example: 2999.5 },
        items: { type: 'array', items: { $ref: '#/components/schemas/ShoppingCart' } },
      },
    },
  })
  async getCartSummary(@Req() req) {
    return this.shoppingCartService.getCartSummary(req.user.id);
  }

  @Post('items')
  @ApiOperation({ summary: '添加商品到购物车' })
  @ApiResponse({ status: 201, description: '添加成功', type: ShoppingCart })
  @ApiResponse({ status: 400, description: '参数错误' })
  async addToCart(
    @Req() req,
    @Body() createShoppingCartItemDto: CreateShoppingCartItemDto,
  ): Promise<ShoppingCart> {
    return this.shoppingCartService.addToCart(
      req.user.id,
      createShoppingCartItemDto,
    );
  }

  @Put('items/:id')
  @ApiOperation({ summary: '更新购物车项' })
  @ApiResponse({ status: 200, description: '更新成功', type: ShoppingCart })
  @ApiResponse({ status: 404, description: '购物车项不存在' })
  async updateCartItem(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateShoppingCartItemDto: UpdateShoppingCartItemDto,
  ): Promise<ShoppingCart> {
    return this.shoppingCartService.updateCartItem(
      req.user.id,
      id,
      updateShoppingCartItemDto,
    );
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除购物车项' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '购物车项不存在' })
  async removeCartItem(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.shoppingCartService.removeCartItem(req.user.id, id);
  }

  @Delete('clear')
  @ApiOperation({ summary: '清空购物车' })
  @ApiResponse({ status: 200, description: '清空成功' })
  async clearCart(@Req() req): Promise<void> {
    return this.shoppingCartService.clearCart(req.user.id);
  }

  @Post('batch-update')
  @ApiOperation({ summary: '批量更新购物车项数量' })
  @ApiResponse({ status: 200, description: '批量更新成功', type: [ShoppingCart] })
  async batchUpdate(
    @Req() req,
    @Body() updates: Array<{ cartItemId: number; quantity: number }>,
  ): Promise<ShoppingCart[]> {
    return this.shoppingCartService.batchUpdate(req.user.id, updates);
  }
}