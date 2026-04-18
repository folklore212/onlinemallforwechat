import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShoppingCart } from './entities/shopping-cart.entity';
import { Product } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { ShoppingCartService } from './shopping-cart.service';
import { ShoppingCartController } from './shopping-cart.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShoppingCart, Product, User])],
  controllers: [ShoppingCartController],
  providers: [ShoppingCartService],
  exports: [ShoppingCartService, TypeOrmModule],
})
export class ShoppingCartModule {}