import { useState, useEffect } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import { AtTabs, AtTabsPane, AtCard, AtButton, AtMessage } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import orderService from '../../services/order.service';
import authService from '../../services/auth.service';

export default function Order() {
  const [currentTab, setCurrentTab] = useState(0);
  const [orders, setOrders] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

  // 初始化数据
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 检查登录状态
  const checkLoginStatus = async () => {
    const isLoggedIn = authService.isLoggedIn();
    if (isLoggedIn) {
      const user = authService.getUserInfo();
      setUserInfo(user);
      await loadOrders();
    } else {
      setLoading(false);
      // 未登录，提示登录
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.switchTab({
              url: '/pages/my/index',
            });
          }
        },
      });
    }
  };

  // 加载订单数据
  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await orderService.getOrders();
      setOrders(ordersData);
    } catch (error) {
      console.error('加载订单失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 标签页配置
  const tabList = [
    { title: '全部' },
    { title: '待确认' },
    { title: '处理中' },
    { title: '已发货' },
    { title: '已完成' },
    { title: '已取消' },
  ];

  // 根据状态过滤订单
  const filteredOrders = () => {
    if (currentTab === 0) return orders;
    const statusMap = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const status = statusMap[currentTab];
    return orders.filter(order => order.orderStatus === status);
  };

  // 查看订单详情
  const viewOrderDetail = (orderId: number) => {
    Taro.navigateTo({
      url: `/pages/order/detail?id=${orderId}`,
    });
  };

  // 取消订单（仅限待确认状态）
  const cancelOrder = async (orderId: number) => {
    try {
      Taro.showModal({
        title: '取消订单',
        content: '确定要取消此订单吗？',
        async success(res) {
          if (res.confirm) {
            Taro.showLoading({ title: '取消中...' });
            await orderService.cancelOrder(orderId);
            // 重新加载订单
            await loadOrders();
            Taro.showToast({
              title: '订单已取消',
              icon: 'success',
            });
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

  // 确认收货
  const confirmReceipt = (orderId: number) => {
    Taro.showModal({
      title: '确认收货',
      content: '请确认您已收到商品',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({
            title: '功能开发中，请联系管理员',
            icon: 'none',
          });
        }
      },
    });
  };

  // 刷新订单列表
  const handleRefresh = async () => {
    if (userInfo) {
      await loadOrders();
      Taro.showToast({
        title: '刷新成功',
        icon: 'success',
      });
    }
  };

  if (!userInfo) {
    return (
      <View className='order'>
        <View className='empty'>
          <Text className='empty-text'>请先登录</Text>
          <AtButton type='primary' onClick={() => Taro.switchTab({ url: '/pages/my/index' })}>
            去登录
          </AtButton>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View className='order'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='order'>
      <AtMessage />

      <View className='header'>
        <Text className='title'>我的订单</Text>
        <AtButton size='small' type='secondary' onClick={handleRefresh}>
          刷新
        </AtButton>
      </View>

      <AtTabs current={currentTab} tabList={tabList} onClick={setCurrentTab}>
        {tabList.map((tab, index) => (
          <AtTabsPane current={currentTab} index={index} key={index}>
            <ScrollView className='order-list' scrollY>
              {filteredOrders().length === 0 ? (
                <View className='empty'>
                  <Text className='empty-text'>暂无订单</Text>
                  <AtButton type='primary' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
                    去逛逛
                  </AtButton>
                </View>
              ) : (
                filteredOrders().map(order => (
                  <AtCard
                    key={order.id}
                    title={`订单号: ${order.orderNo}`}
                    extra={orderService.getOrderStatusText(order.orderStatus)}
                    note={`下单时间: ${order.createdAt}`}
                    extraStyle={{ color: orderService.getOrderStatusColor(order.orderStatus) }}
                  >
                    <View className='order-items'>
                      {order.items && order.items.map((item, idx) => (
                        <View key={idx} className='order-item'>
                          <Text className='item-name'>{item.productName}</Text>
                          <Text className='item-quantity'>x{item.quantity}</Text>
                          <Text className='item-price'>¥{item.unitPrice.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>
                    <View className='order-footer'>
                      <Text className='total-amount'>合计: ¥{order.totalAmount.toFixed(2)}</Text>
                      <View className='actions'>
                        {order.orderStatus === 'pending' && (
                          <AtButton size='small' type='secondary' onClick={() => cancelOrder(order.id)}>
                            取消订单
                          </AtButton>
                        )}
                        {order.orderStatus === 'shipped' && (
                          <AtButton size='small' type='secondary' onClick={() => confirmReceipt(order.id)}>
                            确认收货
                          </AtButton>
                        )}
                        <AtButton size='small' type='secondary' onClick={() => viewOrderDetail(order.id)}>
                          查看详情
                        </AtButton>
                      </View>
                    </View>
                  </AtCard>
                ))
              )}
            </ScrollView>
          </AtTabsPane>
        ))}
      </AtTabs>
    </View>
  );
}