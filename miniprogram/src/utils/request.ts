import Taro from '@tarojs/taro';

// 基础URL，根据环境配置
const BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:3000/api'
  : 'https://your-production-domain.com/api';

// 获取token
const getToken = () => {
  return Taro.getStorageSync('token');
};

// 设置token
export const setToken = (token: string) => {
  Taro.setStorageSync('token', token);
};

// 清除token
export const clearToken = () => {
  Taro.removeStorageSync('token');
};

// 封装请求
export const request = <T = any>(
  options: Taro.request.Option,
): Promise<T> => {
  const token = getToken();

  const header = {
    ...options.header,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return new Promise((resolve, reject) => {
    Taro.request({
      ...options,
      url: BASE_URL + options.url,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          // 处理HTTP错误
          reject(new Error(`HTTP错误: ${res.statusCode}`));
        }
      },
      fail: (error) => {
        reject(error);
      },
    });
  });
};

// GET请求
export const get = <T = any>(url: string, params?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'GET',
    data: params,
  });
};

// POST请求
export const post = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'POST',
    data,
  });
};

// PUT请求
export const put = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'PUT',
    data,
  });
};

// DELETE请求
export const del = <T = any>(url: string, data?: any): Promise<T> => {
  return request<T>({
    url,
    method: 'DELETE',
    data,
  });
};