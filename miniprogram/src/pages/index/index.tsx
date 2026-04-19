import { useState, useEffect } from 'react';
import { View, Text, Image, Swiper, SwiperItem, ScrollView } from '@tarojs/components';
import { AtGrid, AtCard, AtTag, AtIcon } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import authService from '../../services/auth.service';
import productService from '../../services/product.service';
import cartService from '../../services/cart.service';

// 轮播图数据（暂时使用静态数据）
const banners = [
  { id: 1, image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDc1MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9Ijc1MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxODkwZmYiLz48dGV4dCB4PSIzNzUiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWcsOWFseW5v+aKlei9puiuqTwvdGV4dD48L3N2Zz4=', link: '' },
  { id: 2, image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDc1MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9Ijc1MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiM1MmM0MWEiLz48dGV4dCB4PSIzNzUiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPueUqOaXpeihjOaOpeW8gDwvdGV4dD48L3N2Zz4=', link: '' },
  { id: 3, image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzUwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDc1MCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9Ijc1MCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmYWFkMTQiLz48dGV4dCB4PSIzNzUiIHk9IjE1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPue7vOWQiOe1kOWFsyA8L3N2Zz4=', link: '' },
];

// 分类网格数据
const categoryGridItems = [
  { image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiMxODkwZmYiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7nlKg8L3RleHQ+PC9zdmc+', value: 'work', text: '工作服' },
  { image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM1MmM0MWEiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7mrKM8L3RleHQ+PC9zdmc+', value: 'uniform', text: '制服' },
  { image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiNmYWFkMTQiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7lnKg8L3RleHQ+PC9zdmc+', value: 'protective', text: '防护服' },
  { image: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIGZpbGw9IiM3MjJlZDEiLz48dGV4dCB4PSIzMCIgeT0iMzAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7kuow8L3RleHQ+PC9zdmc+', value: 'other', text: '其他' },
];

export default function Index() {
  console.log('页面加载，NODE_ENV:', process.env.NODE_ENV);
  console.log('是否开发环境:', process.env.NODE_ENV === 'development');

  const [userInfo, setUserInfo] = useState<any>(null);
  const [products, setProducts] = useState<Array<any>>([]);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // 初始化数据
  useEffect(() => {
    loadData();
    checkLoginStatus();
  }, []);

  // 检查登录状态
  const checkLoginStatus = async () => {
    const isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn) {
      const user = authService.getUserInfo();
      setUserInfo(user);
    }
  };

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      // 获取热门商品
      const hotProducts = await productService.getHotProducts(8);
      setProducts(hotProducts);

      // 获取分类
      const categoriesData = await productService.getCategories();
      setCategories(categoriesData.slice(0, 8));

      // 获取购物车数量
      const count = await cartService.getCartTotalCount();
      setCartCount(count);
    } catch (error) {
      console.error('加载数据失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 微信登录
  const handleLogin = async () => {
    try {
      Taro.showLoading({ title: '登录中...' });
      const res = await authService.wxLogin();
      setUserInfo(res.user);
      Taro.showToast({
        title: '登录成功',
        icon: 'success',
      });
      // 重新加载数据
      loadData();
    } catch (error) {
      console.error('登录失败:', error);
      Taro.showToast({
        title: '登录失败',
        icon: 'none',
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 跳转到分类页
  const navigateToCategory = (value: string) => {
    Taro.navigateTo({
      url: `/pages/category/index?type=${value}`,
    });
  };

  // 跳转到商品详情
  const navigateToProductDetail = (id: number) => {
    Taro.navigateTo({
      url: `/pages/product/index?id=${id}`,
    });
  };

  // 跳转到购物车
  const navigateToCart = () => {
    Taro.switchTab({
      url: '/pages/cart/index',
    });
  };

  // 跳转到搜索页
  const navigateToSearch = () => {
    Taro.navigateTo({
      url: '/pages/search/index',
    });
  };

  // 添加商品到购物车
  const handleAddToCart = async (product: any) => {
    if (!userInfo) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            handleLogin();
          }
        },
      });
      return;
    }

    try {
      Taro.showLoading({ title: '添加中...' });
      await cartService.addToCart({
        productId: product.id,
        quantity: 1,
      });

      // 更新购物车数量
      const count = await cartService.getCartTotalCount();
      setCartCount(count);

      Taro.showToast({
        title: '添加成功',
        icon: 'success',
      });
    } catch (error: any) {
      console.error('添加购物车失败:', error);
      Taro.showToast({
        title: error.message || '添加失败',
        icon: 'none',
      });
    } finally {
      Taro.hideLoading();
    }
  };

  return (
    <View className='index'>
      {/* 顶部搜索栏 */}
      <View className='search-bar'>
        <View className='search-input' onClick={navigateToSearch}>
          <AtIcon value='search' size='16' color='#999'></AtIcon>
          <Text className='search-text'>搜索商品</Text>
        </View>
        <View className='cart-icon' onClick={navigateToCart}>
          <AtIcon value='shopping-cart' size='20' color='#1890ff'></AtIcon>
          {cartCount > 0 && (
            <View className='cart-badge'>{cartCount}</View>
          )}
        </View>
      </View>

      {/* 轮播图 */}
      <Swiper
        className='banner-swiper'
        indicatorColor='#999'
        indicatorActiveColor='#1890ff'
        circular
        indicatorDots
        autoplay
      >
        {banners.map((banner) => (
          <SwiperItem key={banner.id}>
            <Image className='banner-image' src={banner.image} mode='aspectFill' />
          </SwiperItem>
        ))}
      </Swiper>

      {/* 分类网格 */}
      <View className='category-section'>
        <View className='section-header'>
          <Text className='section-title'>商品分类</Text>
          <Text className='section-more' onClick={() => Taro.switchTab({ url: '/pages/category/index' })}>
            更多
          </Text>
        </View>
        <AtGrid
          onClick={navigateToCategory}
          columnNum={4}
          data={categoryGridItems}
        />
      </View>

      {/* 热门推荐 */}
      <View className='product-section'>
        <View className='section-header'>
          <Text className='section-title'>热门推荐</Text>
          <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/category/index' })}>
            更多
          </Text>
        </View>

        {loading ? (
          <View className='loading'>加载中...</View>
        ) : products.length === 0 ? (
          <View className='empty'>暂无商品</View>
        ) : (
          <ScrollView className='product-list' scrollX enableFlex>
            {products.map((product) => (
              <View key={product.id} className='product-card'>
                <Image
                  className='product-image'
                  src={product.mainImageUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNlZWUiLz48dGV4dCB4PSIxMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+5bqU5L+h5ZCI8L3RleHQ+PC9zdmc+'}
                  mode='aspectFill'
                  onClick={() => navigateToProductDetail(product.id)}
                />
                <View className='product-info'>
                  <Text className='product-name' numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text className='product-price'>¥{product.unitPrice}</Text>
                  <View className='product-actions'>
                    <AtTag
                      size='small'
                      type='primary'
                      circle
                      onClick={() => handleAddToCart(product)}
                    >
                      加入购物车
                    </AtTag>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 用户信息展示 */}
      {!userInfo && (
        <View className='login-section'>
          <AtCard title='欢迎使用政企制服采购系统'>
            <Text>请登录后享受完整服务</Text>
            <View className='login-button'>
              <AtTag type='primary' circle onClick={handleLogin}>
                <AtIcon value='user' size='12'></AtIcon>
                微信登录
              </AtTag>
            </View>
          </AtCard>
        </View>
      )}

      {/* 底部提示 */}
      <View className='footer'>
        <Text className='footer-text'>政企制服采购平台 © 2026</Text>
      </View>
    </View>
  );
}