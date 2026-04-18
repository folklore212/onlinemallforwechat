import { Component } from 'react';
import { View, Text } from '@tarojs/components';
import './index.scss';

export default class Index extends Component {
  render() {
    return (
      <View className='index'>
        <Text>首页 - 政企制服采购</Text>
      </View>
    );
  }
}