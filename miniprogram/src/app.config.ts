export default {
  pages: [
    'pages/index/index',
    'pages/category/index',
    'pages/product/index',
    'pages/cart/index',
    'pages/order/index',
    'pages/my/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '政企制服采购',
    navigationBarTextStyle: 'black',
  },
  tabBar: {
    color: '#999',
    selectedColor: '#1890ff',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'assets/tab-home.png',
        selectedIconPath: 'assets/tab-home-active.png',
      },
      {
        pagePath: 'pages/category/index',
        text: '分类',
        iconPath: 'assets/tab-category.png',
        selectedIconPath: 'assets/tab-category-active.png',
      },
      {
        pagePath: 'pages/cart/index',
        text: '购物车',
        iconPath: 'assets/tab-cart.png',
        selectedIconPath: 'assets/tab-cart-active.png',
      },
      {
        pagePath: 'pages/my/index',
        text: '我的',
        iconPath: 'assets/tab-my.png',
        selectedIconPath: 'assets/tab-my-active.png',
      },
    ],
  },
};