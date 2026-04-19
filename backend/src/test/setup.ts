// 全局测试设置
import { Test } from '@nestjs/testing';

// 设置全局测试超时
jest.setTimeout(30000);

// 全局测试前钩子
beforeAll(async () => {
  // 可以在这里初始化全局测试资源
});

// 全局测试后钩子
afterAll(async () => {
  // 清理全局测试资源
});

// 全局 beforeEach 钩子
beforeEach(async () => {
  // 每个测试前的清理工作
});

// 全局 afterEach 钩子
afterEach(async () => {
  // 每个测试后的清理工作
  jest.clearAllMocks();
});