import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, Button } from '@tarojs/components';
import { AtCard, AtTag, AtButton, AtIcon, AtMessage } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import productService from '../../services/product.service';
import cartService from '../../services/cart.service';
import authService from '../../services/auth.service';

export default function ProductDetail() {
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isInCart, setIsInCart] = useState(false);

  // 获取路由参数
  const { id } = Taro.getCurrentInstance().router?.params || {};
  const productId = parseInt(id || '0');

  // 初始化数据
  useEffect(() => {
    if (productId) {
      loadProductDetail();
      checkLoginStatus();
    } else {
      Taro.showToast({
        title: '商品不存在',
        icon: 'none',
        complete: () => {
          Taro.navigateBack();
        },
      });
    }
  }, [productId]);

  // 检查登录状态
  const checkLoginStatus = async () => {
    const isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn) {
      const user = authService.getUserInfo();
      setUserInfo(user);
      // 检查商品是否在购物车中
      const inCart = await cartService.isProductInCart(productId);
      setIsInCart(inCart);
    }
  };

  // 加载商品详情
  const loadProductDetail = async () => {
    try {
      setLoading(true);
      const productData = await productService.getProductDetail(productId);
      setProduct(productData);

      // 设置默认尺码和颜色
      if (productData.sizeChart && productData.sizeChart.length > 0) {
        setSelectedSize(productData.sizeChart[0]);
      }
      if (productData.colorOptions && productData.colorOptions.length > 0) {
        setSelectedColor(productData.colorOptions[0]);
      }
    } catch (error) {
      console.error('加载商品详情失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
        complete: () => {
          Taro.navigateBack();
        },
      });
    } finally {
      setLoading(false);
    }
  };

  // 增加数量
  const increaseQuantity = () => {
    if (product) {
      const max = product.maxOrderQuantity || 999;
      if (quantity < max && quantity < product.stockQuantity) {
        setQuantity(quantity + 1);
      }
    }
  };

  // 减少数量
  const decreaseQuantity = () => {
    if (quantity > (product?.minOrderQuantity || 1)) {
      setQuantity(quantity - 1);
    }
  };

  // 加入购物车
  const handleAddToCart = async () => {
    if (!userInfo) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({
              url: '/pages/my/index',
            });
          }
        },
      });
      return;
    }

    try {
      Taro.showLoading({ title: '添加中...' });
      await cartService.addToCart({
        productId,
        quantity,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
      });
      setIsInCart(true);
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

  // 立即购买（跳转到订单确认页）
  const handleBuyNow = async () => {
    if (!userInfo) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({
              url: '/pages/my/index',
            });
          }
        },
      });
      return;
    }

    // 先加入购物车，然后跳转到订单确认
    try {
      Taro.showLoading({ title: '处理中...' });
      await cartService.addToCart({
        productId,
        quantity,
        selectedSize: selectedSize || undefined,
        selectedColor: selectedColor || undefined,
      });
      // 跳转到订单确认页
      Taro.navigateTo({
        url: '/pages/order/confirm?type=direct',
      });
    } catch (error: any) {
      console.error('立即购买失败:', error);
      Taro.showToast({
        title: error.message || '购买失败',
        icon: 'none',
      });
    } finally {
      Taro.hideLoading();
    }
  };

  // 跳转到购物车
  const navigateToCart = () => {
    Taro.switchTab({
      url: '/pages/cart/index',
    });
  };

  if (loading) {
    return (
      <View className='loading'>
        <Text>加载中...</Text>
      </View>
    );
  }

  if (!product) {
    return (
      <View className='empty'>
        <Text>商品不存在</Text>
      </View>
    );
  }

  return (
    <View className='product-detail'>
      <AtMessage />

      {/* 商品图片 */}
      <ScrollView className='image-gallery' scrollX>
        {product.imageGallery && product.imageGallery.length > 0 ? (
          product.imageGallery.map((url: string, index: number) => (
            <Image key={index} className='product-image' src={url} mode='aspectFill' />
          ))
        ) : (
          <Image
            className='product-image'
            src='https://via.placeholder.com/750x750/eee/999?text=商品图'
            mode='aspectFill'
          />
        )}
      </ScrollView>

      {/* 商品基本信息 */}
      <View className='basic-info'>
        <Text className='product-name'>{product.name}</Text>
        <View className='price-section'>
          <Text className='current-price'>¥{product.unitPrice}</Text>
          {product.costPrice && (
            <Text className='original-price'>¥{product.costPrice}</Text>
          )}
        </View>
        <View className='meta-info'>
          <Text className='stock'>库存: {product.stockQuantity}</Text>
          <Text className='sales'>已售: 0</Text>
        </View>
      </View>

      {/* 商品规格选择 */}
      <View className='specifications'>
        {/* 尺码选择 */}
        {product.sizeChart && product.sizeChart.length > 0 && (
          <View className='spec-section'>
            <Text className='spec-title'>尺码</Text>
            <View className='spec-options'>
              {product.sizeChart.map((size: string) => (
                <AtTag
                  key={size}
                  type={selectedSize === size ? 'primary' : undefined}
                  circle
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </AtTag>
              ))}
            </View>
          </View>
        )}

        {/* 颜色选择 */}
        {product.colorOptions && product.colorOptions.length > 0 && (
          <View className='spec-section'>
            <Text className='spec-title'>颜色</Text>
            <View className='spec-options'>
              {product.colorOptions.map((color: string) => (
                <AtTag
                  key={color}
                  type={selectedColor === color ? 'primary' : undefined}
                  circle
                  onClick={() => setSelectedColor(color)}
                >
                  {color}
                </AtTag>
              ))}
            </View>
          </View>
        )}

        {/* 数量选择 */}
        <View className='spec-section'>
          <Text className='spec-title'>数量</Text>
          <View className='quantity-selector'>
            <AtButton size='small' onClick={decreaseQuantity} disabled={quantity <= (product.minOrderQuantity || 1)}>
              <AtIcon value='subtract' size='12'></AtIcon>
            </AtButton>
            <Text className='quantity'>{quantity}</Text>
            <AtButton size='small' onClick={increaseQuantity} disabled={quantity >= (product.maxOrderQuantity || 999) || quantity >= product.stockQuantity}>
              <AtIcon value='add' size='12'></AtIcon>
            </AtButton>
            <Text className='quantity-hint'>
              起订量: {product.minOrderQuantity || 1}
              {product.maxOrderQuantity && `, 最大: ${product.maxOrderQuantity}`}
            </Text>
          </View>
        </View>
      </View>

      {/* 商品描述 */}
      {product.description && (
        <AtCard title='商品描述'>
          <Text className='description'>{product.description}</Text>
        </AtCard>
      )}

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-left'>
          <View className='action-item' onClick={navigateToCart}>
            <AtIcon value='shopping-cart' size='20'></AtIcon>
            <Text>购物车</Text>
            {isInCart && <View className='cart-indicator'></View>}
          </View>
        </View>
        <View className='action-right'>
          <AtButton
            type='secondary'
            size='small'
            className='add-cart-btn'
            onClick={handleAddToCart}
          >
            加入购物车
          </AtButton>
          <AtButton
            type='primary'
            size='small'
            className='buy-now-btn'
            onClick={handleBuyNow}
          >
            立即购买
          </AtButton>
        </View>
      </View>
    </View>
  );
}