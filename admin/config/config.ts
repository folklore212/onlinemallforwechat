import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {},
  layout: {
    title: '政企制服采购管理后台',
  },
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      name: '仪表盘',
      path: '/dashboard',
      component: './Dashboard',
    },
    {
      name: '用户管理',
      path: '/users',
      component: './Users',
    },
    {
      name: '商品管理',
      path: '/products',
      component: './Products',
    },
    {
      name: '订单管理',
      path: '/orders',
      component: './Orders',
    },
    {
      name: '分类管理',
      path: '/categories',
      component: './Categories',
    },
    {
      name: '系统设置',
      path: '/settings',
      component: './Settings',
    },
  ],
  npmClient: 'npm',
});