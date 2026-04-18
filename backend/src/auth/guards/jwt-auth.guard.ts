import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    // 在这里可以添加自定义认证逻辑
    return super.canActivate(context);
  }

  handleRequest(err, user, info) {
    // 可以在这里处理错误或用户信息
    if (err || !user) {
      throw err || new Error('未授权访问');
    }
    return user;
  }
}