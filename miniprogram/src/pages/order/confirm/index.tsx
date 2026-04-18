import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { AtButton, AtIcon, AtMessage, AtInput, AtTextarea, AtCard } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import orderService from '../../../services/order.service';
import authService from '../../../services/auth.service';
import cartService from '../../../services/cart.service';

export default function OrderConfirm() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({
    companyName: '',
    contactPerson: '',
    contactPhone: '',
    deliveryAddress: '',
  });
  const [notes, setNotes] = useState('');

  // 获取路由参数
  const { type } = Taro.getCurrentInstance().router?.params || {};

  // 初始化数据
  useEffect(() => {
    checkLoginStatus();
    loadCartData();
  }, []);

  // 检查登录状态
  const checkLoginStatus = async () => {
    const isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn) {
      const user = authService.getUserInfo();
      setUserInfo(user);
      // 初始化配送信息
      setDeliveryInfo({
        companyName: user.companyName || '',
        contactPerson: user.contactPerson || '',
        contactPhone: user.contactPhone || '',
        deliveryAddress: user.companyAddress || '',
      });
    } else {
      // 未登录，提示登录
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({
              url: '/pages/my/index',
            });
          } else {
            Taro.navigateBack();
          }
        },
      });
    }
  };

  // 加载购物车数据
  const loadCartData = async () => {
    if (!authService.isLoggedIn()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const items = await cartService.getCart();
      setCartItems(items);
      calculateTotals(items);
    } catch (error) {
      console.error('加载购物车失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 计算总金额和总数量
  const calculateTotals = (items: any[]) => {
    let amount = 0;
    let quantity = 0;
    items.forEach((item) => {
      amount += (item.product?.unitPrice || 0) * item.quantity;
      quantity += item.quantity;
    });
    setTotalAmount(amount);
    setTotalQuantity(quantity);
  };

  // 处理输入框变化
  const handleInputChange = (field: string, value: string) => {
    setDeliveryInfo({
      ...deliveryInfo,
      [field]: value,
    });
  };

  // 验证表单
  const validateForm = (): boolean => {
    const { companyName, contactPerson, contactPhone, deliveryAddress } = deliveryInfo;

    if (!companyName.trim()) {
      Taro.showToast({
        title: '请填写公司名称',
        icon: 'none',
      });
      return false;
    }

    if (!contactPerson.trim()) {
      Taro.showToast({
        title: '请填写联系人',
        icon: 'none',
      });
      return false;
    }

    if (!contactPhone.trim()) {
      Taro.showToast({
        title: '请填写联系电话',
        icon: 'none',
      });
      return false;
    }

    // 简单的手机号验证
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(contactPhone)) {
      Taro.showToast({
        title: '请输入有效的手机号',
        icon: 'none',
      });
      return false;
    }

    if (!deliveryAddress.trim()) {
      Taro.showToast({
        title: '请填写配送地址',
        icon: 'none',
      });
      return false;
    }

    return true;
  };

  // 提交订单
  const handleSubmitOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (cartItems.length === 0) {
      Taro.showToast({
        title: '购物车为空',
        icon: 'none',
      });
      return;
    }

    // 检查库存
    const outOfStockItems = cartItems.filter(
      (item) => item.quantity > (item.product?.stockQuantity || 0)
    );

    if (outOfStockItems.length > 0) {
      Taro.showModal({
        title: '库存不足',
        content: '部分商品库存不足，请调整数量后重试',
        showCancel: false,
      });
      return;
    }

    try {
      Taro.showLoading({ title: '提交订单中...' });

      const orderData = {
        companyName: deliveryInfo.companyName,
        contactPerson: deliveryInfo.contactPerson,
        contactPhone: deliveryInfo.contactPhone,
        deliveryAddress: deliveryInfo.deliveryAddress,
        notes: notes.trim(),
      };

      const order = await orderService.createOrder(orderData);
      Taro.hideLoading();

      // 清空购物车
      await cartService.clearCart();

      // 跳转到订单详情页
      Taro.redirectTo({
        url: `/pages/order/detail?id=${order.id}`,
      });
    } catch (error: any) {
      console.error('提交订单失败:', error);
      Taro.hideLoading();
      Taro.showToast({
        title: error.message || '提交订单失败',
        icon: 'none',
      });
    }
  };

  // 返回购物车
  const goBackToCart = () => {
    Taro.navigateBack();
  };

  if (!userInfo) {
    return (
      <View className='order-confirm'>
        <View className='empty'>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className='order-confirm'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='order-confirm'>
      <AtMessage />

      {/* 头部 */}
      <View className='header'>
        <Text className='title'>确认订单</Text>
      </View>

      <ScrollView className='content' scrollY>
        {/* 配送信息 */}
        <AtCard title='配送信息'>
          <View className='form-section'>
            <View className='form-item'>
              <Text className='label'>公司名称</Text>
              <AtInput
                name='companyName'
                type='text'
                placeholder='请输入公司名称'
                value={deliveryInfo.companyName}
                onChange={(value) => handleInputChange('companyName', value as string)}
              />
            </View>

            <View className='form-item'>
              <Text className='label'>联系人</Text>
              <AtInput
                name='contactPerson'
                type='text'
                placeholder='请输入联系人姓名'
                value={deliveryInfo.contactPerson}
                onChange={(value) => handleInputChange('contactPerson', value as string)}
              />
            </View>

            <View className='form-item'>
              <Text className='label'>联系电话</Text>
              <AtInput
                name='contactPhone'
                type='phone'
                placeholder='请输入手机号码'
                value={deliveryInfo.contactPhone}
                onChange={(value) => handleInputChange('contactPhone', value as string)}
              />
            </View>

            <View className='form-item'>
              <Text className='label'>配送地址</Text>
              <AtTextarea
                placeholder='请输入详细配送地址'
                value={deliveryInfo.deliveryAddress}
                onChange={(value) => handleInputChange('deliveryAddress', value as string)}
                maxLength={200}
                height={80}
              />
            </View>

            <View className='form-item'>
              <Text className='label'>备注</Text>
              <AtTextarea
                placeholder='请输入订单备注（可选）'
                value={notes}
                onChange={setNotes}
                maxLength={500}
                height={60}
              />
            </View>
          </View>
        </AtCard>

        {/* 商品清单 */}
        <AtCard title='商品清单'>
          {cartItems.length === 0 ? (
            <View className='empty-items'>
              <Text>暂无商品</Text>
            </View>
          ) : (
            <View className='items-list'>
              {cartItems.map((item) => (
                <View key={item.id} className='order-item'>
                  <Image
                    className='item-image'
                    src={
                      item.product?.mainImageUrl ||
                      'https://via.placeholder.com/80x80/eee/999?text=商品图'
                    }
                    mode='aspectFill'
                  />
                  <View className='item-info'>
                    <Text className='item-name' numberOfLines={2}>
                      {item.product?.name || '未知商品'}
                    </Text>
                    <Text className='item-spec'>
                      {item.selectedSize && `尺码: ${item.selectedSize}`}
                      {item.selectedSize && item.selectedColor && ' '}
                      {item.selectedColor && `颜色: ${item.selectedColor}`}
                    </Text>
                    <View className='item-price-row'>
                      <Text className='item-price'>¥{item.product?.unitPrice || 0}</Text>
                      <Text className='item-quantity'>x{item.quantity}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </AtCard>

        {/* 订单摘要 */}
        <AtCard title='订单摘要'>
          <View className='summary'>
            <View className='summary-row'>
              <Text>商品总价</Text>
              <Text>¥{totalAmount.toFixed(2)}</Text>
            </View>
            <View className='summary-row'>
              <Text>配送费用</Text>
              <Text>¥0.00</Text>
            </View>
            <View className='summary-row total'>
              <Text>应付总额</Text>
              <Text className='total-amount'>¥{totalAmount.toFixed(2)}</Text>
            </View>
            <View className='summary-hint'>
              <Text>政企客户无需支付，下单后等待服装厂确认即可</Text>
            </View>
          </View>
        </AtCard>
      </ScrollView>

      {/* 底部操作栏 */}
      <View className='action-bar'>
        <View className='action-left'>
          <Text className='total-text'>
            合计: <Text className='total-amount'>¥{totalAmount.toFixed(2)}</Text>
          </Text>
          <Text className='total-hint'>共{totalQuantity}件商品</Text>
        </View>
        <View className='action-right'>
          <AtButton type='secondary' onClick={goBackToCart}>
            返回修改
          </AtButton>
          <AtButton type='primary' onClick={handleSubmitOrder}>
            提交订单
          </AtButton>
        </View>
      </View>
    </View>
  );
}