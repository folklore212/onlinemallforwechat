import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { ShoppingCart } from '../shopping-cart/entities/shopping-cart.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { FactoryOrdersController } from './factory-orders.controller';
import { AdminOrdersController } from './admin-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, User, Product, ShoppingCart]),
  ],
  controllers: [
    OrdersController,
    FactoryOrdersController,
    AdminOrdersController,
  ],
  providers: [OrdersService],
  exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule {}