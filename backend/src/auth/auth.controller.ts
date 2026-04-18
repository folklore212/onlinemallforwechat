import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { WxLoginDto } from './dto/wx-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from '../users/entities/user.entity';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wx-login')
  @ApiOperation({ summary: '微信小程序登录' })
  @ApiResponse({ status: 200, description: '登录成功', type: LoginResponseDto })
  @ApiResponse({ status: 401, description: '登录失败' })
  async wxLogin(@Body() wxLoginDto: WxLoginDto): Promise<LoginResponseDto> {
    return this.authService.wxLogin(wxLoginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '获取成功', type: User })
  @ApiResponse({ status: 401, description: '未授权' })
  async getProfile(@Req() req): Promise<User> {
    return this.authService.getProfile(req.user.id);
  }
}