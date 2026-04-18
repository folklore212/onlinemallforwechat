import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserType } from '../../users/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('未授权访问');
    }

    if (user.userType !== UserType.ADMIN) {
      throw new ForbiddenException('需要管理员权限');
    }

    return true;
  }
}