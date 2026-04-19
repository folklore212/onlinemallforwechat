import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { ShoppingCartModule } from './shopping-cart/shopping-cart.module';
import { OrdersModule } from './orders/orders.module';
import { HealthModule } from './common/health/health.module';
import { UploadsModule } from './uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'mysql',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        username: process.env.DB_USERNAME || 'root',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_DATABASE || 'wechat_online_shop',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: process.env.NODE_ENV !== 'production', // 生产环境关闭
        logging: process.env.NODE_ENV !== 'production',
      }),
    }),
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    ShoppingCartModule,
    OrdersModule,
    HealthModule,
    UploadsModule,
  ],
})
export class AppModule {}