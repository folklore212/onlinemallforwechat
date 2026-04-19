import Taro from '@tarojs/taro';
import { post, get, put, setToken, clearToken } from '../utils/request';

// 用户信息接口
export interface UserInfo {
  id: number;
  username?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  userType: 'gov_enterprise' | 'clothing_factory' | 'admin';
  companyName?: string;
  companyAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
}

// 登录响应接口
export interface LoginResponse {
  accessToken: string;
  user: UserInfo;
}

class AuthService {
  // 微信登录
  async wxLogin(): Promise<LoginResponse> {
    try {
      // 获取微信登录code
      const loginRes = await Taro.login();
      const code = loginRes.code;

      // 发送code到后端进行登录
      const data = await post<LoginResponse>('/auth/wx-login', { code });

      // 存储token和用户信息
      setToken(data.accessToken);
      Taro.setStorageSync('userInfo', data.user);

      return data;
    } catch (error) {
      console.error('微信登录失败:', error);
      throw error;
    }
  }

  // 获取当前用户信息
  async getProfile(): Promise<UserInfo> {
    try {
      const data = await get<UserInfo>('/auth/profile');
      // 更新本地存储的用户信息
      Taro.setStorageSync('userInfo', data);
      return data;
    } catch (error) {
      console.error('获取用户信息失败:', error);
      throw error;
    }
  }

  // 获取本地存储的用户信息
  getUserInfo(): UserInfo | null {
    return Taro.getStorageSync('userInfo') || null;
  }

  // 获取本地存储的token
  getToken(): string | null {
    return Taro.getStorageSync('token') || null;
  }

  // 检查是否已登录
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // 退出登录
  logout(): void {
    clearToken();
    Taro.removeStorageSync('userInfo');
    // 跳转到登录页或其他页面
    Taro.reLaunch({
      url: '/pages/index/index',
    });
  }

  // 更新用户信息
  async updateProfile(profile: Partial<UserInfo>): Promise<UserInfo> {
    try {
      const data = await put<UserInfo>('/users/profile/me', profile);
      // 更新本地存储
      Taro.setStorageSync('userInfo', data);
      return data;
    } catch (error) {
      console.error('更新用户信息失败:', error);
      throw error;
    }
  }
}

export default new AuthService();