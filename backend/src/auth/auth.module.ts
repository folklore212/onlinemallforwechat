import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AdminGuard } from './guards/admin.guard';
import { FactoryGuard } from './guards/factory.guard';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN');
        // Convert string like '7d' to seconds, or default to 7 days
        let expiresInSeconds = 604800; // 7 days in seconds

        if (expiresIn) {
          if (expiresIn.endsWith('d')) {
            const days = parseInt(expiresIn.slice(0, -1));
            if (!isNaN(days)) {
              expiresInSeconds = days * 24 * 60 * 60;
            }
          } else if (expiresIn.endsWith('h')) {
            const hours = parseInt(expiresIn.slice(0, -1));
            if (!isNaN(hours)) {
              expiresInSeconds = hours * 60 * 60;
            }
          } else if (expiresIn.endsWith('m')) {
            const minutes = parseInt(expiresIn.slice(0, -1));
            if (!isNaN(minutes)) {
              expiresInSeconds = minutes * 60;
            }
          } else if (expiresIn.endsWith('s')) {
            const seconds = parseInt(expiresIn.slice(0, -1));
            if (!isNaN(seconds)) {
              expiresInSeconds = seconds;
            }
          } else {
            const num = parseInt(expiresIn);
            if (!isNaN(num)) {
              expiresInSeconds = num;
            }
          }
        }

        return {
          secret: configService.get<string>('JWT_SECRET') || 'secret',
          signOptions: {
            expiresIn: expiresInSeconds,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, AdminGuard, FactoryGuard],
  exports: [AuthService, JwtStrategy, AdminGuard, FactoryGuard, PassportModule, JwtModule],
})
export class AuthModule {}