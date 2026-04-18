import { useState, useEffect } from 'react';
import { View, Text, Image } from '@tarojs/components';
import { AtButton, AtList, AtListItem, AtMessage } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import authService from '../../services/auth.service';

export default function My() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
    }
    setLoading(false);
  };

  // 处理登录
  const handleLogin = () => {
    Taro.showToast({
      title: '登录功能开发中',
      icon: 'none',
    });
  };

  // 处理退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authService.logout();
          Taro.showToast({
            title: '退出成功',
            icon: 'success',
          });
          setTimeout(() => {
            Taro.switchTab({
              url: '/pages/index/index',
            });
          }, 1500);
        }
      },
    });
  };

  // 跳转到我的订单
  const navigateToMyOrders = () => {
    Taro.navigateTo({
      url: '/pages/order/index',
    });
  };

  // 跳转到收货地址
  const navigateToAddress = () => {
    Taro.showToast({
      title: '地址管理功能开发中',
      icon: 'none',
    });
  };

  if (loading) {
    return (
      <View className='my'>
        <View className='loading'>
          <Text>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className='my'>
      <AtMessage />

      {/* 用户信息区域 */}
      <View className='user-info'>
        {userInfo ? (
          <>
            <Image
              className='avatar'
              src={userInfo.avatar || 'https://via.placeholder.com/80x80/1890ff/ffffff?text=用户'}
            />
            <View className='user-details'>
              <Text className='username'>{userInfo.username || '用户'}</Text>
              <Text className='user-id'>ID: {userInfo.id || '未知'}</Text>
            </View>
            <AtButton size='small' type='secondary' onClick={handleLogout}>
              退出登录
            </AtButton>
          </>
        ) : (
          <>
            <Image
              className='avatar'
              src='https://via.placeholder.com/80x80/ccc/fff?text=未登录'
            />
            <View className='user-details'>
              <Text className='username'>未登录</Text>
              <Text className='user-id'>请登录后查看个人信息</Text>
            </View>
            <AtButton size='small' type='primary' onClick={handleLogin}>
              登录
            </AtButton>
          </>
        )}
      </View>

      {/* 功能列表 */}
      <View className='function-list'>
        <AtList>
          <AtListItem
            title='我的订单'
            arrow='right'
            thumb='https://via.placeholder.com/30x30/1890ff/ffffff?text=📦'
            onClick={navigateToMyOrders}
          />
          <AtListItem
            title='收货地址'
            arrow='right'
            thumb='https://via.placeholder.com/30x30/52c41a/ffffff?text=📍'
            onClick={navigateToAddress}
          />
          <AtListItem
            title='关于我们'
            arrow='right'
            thumb='https://via.placeholder.com/30x30/faad14/ffffff?text=ℹ️'
            onClick={() => {
              Taro.showModal({
                title: '关于',
                content: '政企制服采购商城 v1.0.0\n为企业提供专业的制服采购服务',
                showCancel: false,
              });
            }}
          />
        </AtList>
      </View>
    </View>
  );
}