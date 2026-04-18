import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { AtButton, AtIcon, AtMessage, AtSteps, AtCard, AtTag } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import orderService from '../../../services/order.service';
import authService from '../../../services/auth.service';

export default function OrderDetail() {
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [order, setOrder] = useState<any>(null);
  const [orderId, setOrderId] = useState(0);

  // 获取路由参数
  useEffect(() => {
    const params = Taro.getCurrentInstance().router?.params || {};
    const id = parseInt(params.id || '0');
    setOrderId(id);

    if (id) {
      checkLoginStatus();
    } else {
      Taro.showToast({
        title: '订单不存在',
        icon: 'none',
        complete: () => {
          Taro.navigateBack();
        },
      });
    }
  }, []);

  // 检查登录状态
  const checkLoginStatus = async () => {
    const isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn) {
      const user = authService.getUserInfo();
      setUserInfo(user);
      await loadOrderDetail();
    } else {
      setLoading(false);
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

  // 加载订单详情
  const loadOrderDetail = async () => {
    try {
      setLoading(true);
      const orderData = await orderService.getOrderDetail(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('加载订单详情失败:', error);
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

  // 取消订单
  const handleCancelOrder = async () => {
    if (!order || order.orderStatus !== 'pending') {
      Taro.showToast({
        title: '当前状态不可取消',
        icon: 'none',
      });
      return;
    }

    try {
      Taro.showModal({
        title: '取消订单',
        content: '确定要取消此订单吗？',
        async success(res) {
          if (res.confirm) {
            Taro.showLoading({ title: '取消中...' });
            await orderService.cancelOrder(orderId);
            Taro.showToast({
              title: '订单已取消',
              icon: 'success',
            });
            // 返回上一页
            setTimeout(() => {
              Taro.navigateBack();
            }, 1500);
          }
        },
      });
    } catch (error) {
      console.error('取消订单失败:', error);
      Taro.showToast({
        title: '取消失败',
        icon: 'none',
      });
    }
  };

  // 联系客服
  const handleContactService = () => {
    Taro.showToast({
      title: '功能开发中',
      icon: 'none',
    });
  };

  // 返回订单列表
  const goBackToOrders = () => {
    Taro.navigateBack();
  };

  // 获取订单状态步骤
  const getOrderSteps = () => {
    if (!order) return [];

    const steps = [
      { title: '已下单', description: '订单创建成功', status: 'success' },
      { title: '已确认', description: '服装厂已确认', status: 'process' },
      { title: '处理中', description: '正在备货', status: 'wait' },
      { title: '已发货', description: '商品已发出', status: 'wait' },
      { title: '已完成', description: '订单完成', status: 'wait' },
    ];

    // 根据订单状态更新步骤状态
    const statusIndexMap = {
      'pending': 0,
      'confirmed': 1,
      'processing': 2,
      'shipped': 3,
      'delivered': 4,
      'cancelled': -1,
    };

    const currentIndex = statusIndexMap[order.orderStatus] || 0;

    // 更新步骤状态
    steps.forEach((step, index) => {
      if (index < currentIndex) {
        step.status = 'success';
      } else if (index === currentIndex) {
        step.status = 'process';
      } else {
        step.status = 'wait';
      }
    });

    // 如果是已取消状态
    if (order.orderStatus === 'cancelled') {
      steps[0].status = 'error';
      steps[0].description = '订单已取消';
    }

    return steps;
  };

  if (!userInfo) {
    return (
      <View className='order-detail'>
        <View className='empty'>
          <Text>请先登录</Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className='order-detail'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View className='order-detail'>
        <View className='empty'>
          <Text>订单不存在</Text>
        </View>
      </View>
    );
  }

  const steps = getOrderSteps();

  return (
    <View className='order-detail'>
      <AtMessage />

      {/* 头部 */}
      <View className='header'>
        <AtIcon value='chevron-left' size='20' onClick={goBackToOrders}></AtIcon>
        <Text className='title'>订单详情</Text>
        <View style={{ width: '20px' }}></View>
      </View>

      <ScrollView className='content' scrollY>
        {/* 订单状态卡片 */}
        <View className='status-card'>
          <View className='status-header'>
            <Text className='order-no'>订单号: {order.orderNo}</Text>
            <AtTag
              type='primary'
              circle
              customStyle={{
                backgroundColor: orderService.getOrderStatusColor(order.orderStatus),
                color: '#fff',
              }}
            >
              {orderService.getOrderStatusText(order.orderStatus)}
            </AtTag>
          </View>

          {/* 订单状态步骤 */}
          <View className='status-steps'>
            <AtSteps
              items={steps}
              current={steps.findIndex(step => step.status === 'process')}
            />
          </View>

          <View className='status-info'>
            <Text className='info-item'>下单时间: {order.createdAt}</Text>
            {order.confirmedAt && (
              <Text className='info-item'>确认时间: {order.confirmedAt}</Text>
            )}
            {order.shippedAt && (
              <Text className='info-item'>发货时间: {order.shippedAt}</Text>
            )}
            {order.deliveredAt && (
              <Text className='info-item'>完成时间: {order.deliveredAt}</Text>
            )}
          </View>
        </View>

        {/* 配送信息 */}
        <AtCard title='配送信息'>
          <View className='delivery-info'>
            <View className='info-row'>
              <Text className='label'>公司名称:</Text>
              <Text className='value'>{order.companyName || '未填写'}</Text>
            </View>
            <View className='info-row'>
              <Text className='label'>联系人:</Text>
              <Text className='value'>{order.contactPerson || '未填写'}</Text>
            </View>
            <View className='info-row'>
              <Text className='label'>联系电话:</Text>
              <Text className='value'>{order.contactPhone || '未填写'}</Text>
            </View>
            <View className='info-row'>
              <Text className='label'>配送地址:</Text>
              <Text className='value'>{order.deliveryAddress || '未填写'}</Text>
            </View>
            {order.notes && (
              <View className='info-row'>
                <Text className='label'>订单备注:</Text>
                <Text className='value'>{order.notes}</Text>
              </View>
            )}
            {order.adminNotes && (
              <View className='info-row'>
                <Text className='label'>管理员备注:</Text>
                <Text className='value'>{order.adminNotes}</Text>
              </View>
            )}
          </View>
        </AtCard>

        {/* 商品清单 */}
        <AtCard title='商品清单'>
          {order.items && order.items.length > 0 ? (
            <View className='items-list'>
              {order.items.map((item, index) => (
                <View key={index} className='order-item'>
                  <Image
                    className='item-image'
                    src={
                      'https://via.placeholder.com/80x80/eee/999?text=商品图'
                    }
                    mode='aspectFill'
                  />
                  <View className='item-info'>
                    <Text className='item-name' numberOfLines={2}>
                      {item.productName}
                    </Text>
                    <Text className='item-spec'>
                      {item.selectedSize && `尺码: ${item.selectedSize}`}
                      {item.selectedSize && item.selectedColor && ' '}
                      {item.selectedColor && `颜色: ${item.selectedColor}`}
                    </Text>
                    <View className='item-price-row'>
                      <Text className='item-price'>¥{item.unitPrice.toFixed(2)}</Text>
                      <Text className='item-quantity'>x{item.quantity}</Text>
                    </View>
                  </View>
                  <View className='item-subtotal'>
                    <Text className='subtotal-text'>小计</Text>
                    <Text className='subtotal-amount'>¥{item.subtotal.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className='empty-items'>
              <Text>暂无商品</Text>
            </View>
          )}
        </AtCard>

        {/* 订单摘要 */}
        <AtCard title='订单摘要'>
          <View className='order-summary'>
            <View className='summary-row'>
              <Text>商品总价</Text>
              <Text>¥{order.totalAmount.toFixed(2)}</Text>
            </View>
            <View className='summary-row'>
              <Text>配送费用</Text>
              <Text>¥0.00</Text>
            </View>
            <View className='summary-row total'>
              <Text>应付总额</Text>
              <Text className='total-amount'>¥{order.totalAmount.toFixed(2)}</Text>
            </View>
            <View className='summary-hint'>
              <Text>政企客户无需支付，下单后等待服装厂确认即可</Text>
            </View>
          </View>
        </AtCard>
      </ScrollView>

      {/* 底部操作栏 */}
      {order.orderStatus === 'pending' && (
        <View className='action-bar'>
          <AtButton type='secondary' onClick={handleContactService}>
            联系客服
          </AtButton>
          <AtButton type='primary' onClick={handleCancelOrder}>
            取消订单
          </AtButton>
        </View>
      )}
    </View>
  );
}