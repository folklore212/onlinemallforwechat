import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserType } from '../users/entities/user.entity';
import { WxLoginDto } from './dto/wx-login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

interface WxSessionResponse {
  openid: string;
  session_key: string;
  unionid?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 微信小程序登录
   */
  async wxLogin(wxLoginDto: WxLoginDto): Promise<LoginResponseDto> {
    const { code } = wxLoginDto;

    // 1. 通过code获取openid
    const wxSession = await this.getWxSession(code);

    // 2. 查找或创建用户
    let user = await this.userRepository.findOne({
      where: { openid: wxSession.openid },
    });

    if (!user) {
      // 创建新用户（政企客户类型）
      user = this.userRepository.create({
        openid: wxSession.openid,
        unionid: wxSession.unionid,
        userType: UserType.GOV_ENTERPRISE, // 默认为政企客户
        isActive: true,
      });
      user = await this.userRepository.save(user);
      this.logger.log(`新用户创建: ${user.id}`);
    }

    // 3. 生成JWT令牌
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      openid: user.openid,
    };

    const accessToken = this.jwtService.sign(payload);

    // 4. 返回响应
    return {
      accessToken,
      user: {
        id: user.id,
        username: user.username,
        phone: user.phone,
        email: user.email,
        avatarUrl: user.avatarUrl,
        userType: user.userType,
        companyName: user.companyName,
        companyAddress: user.companyAddress,
        contactPerson: user.contactPerson,
        contactPhone: user.contactPhone,
      },
    };
  }

  /**
   * 通过code获取微信openid
   */
  private async getWxSession(code: string): Promise<WxSessionResponse> {
    const appid = this.configService.get<string>('WX_APPID');
    const secret = this.configService.get<string>('WX_SECRET');

    if (!appid || !secret) {
      throw new Error('微信小程序配置缺失，请配置WX_APPID和WX_SECRET');
    }

    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`;

    try {
      const response = await fetch(url);
      const data = await response.json() as any;

      if (data.errcode) {
        this.logger.error(`微信登录失败: ${JSON.stringify(data)}`);
        throw new UnauthorizedException('微信登录失败');
      }

      return {
        openid: data.openid,
        session_key: data.session_key,
        unionid: data.unionid,
      };
    } catch (error) {
      this.logger.error(`获取微信session失败: ${error.message}`);
      throw new UnauthorizedException('微信登录失败');
    }
  }

  /**
   * 验证JWT用户
   */
  async validateUser(payload: JwtPayload): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    return user;
  }

  /**
   * 获取用户信息
   */
  async getProfile(userId: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    return user;
  }
}