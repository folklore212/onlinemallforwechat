import React, { Component } from 'react';
import './app.scss';
import 'taro-ui/dist/style/index.scss';

// 确保React在全局可用
declare const wx: any;
if (typeof wx !== 'undefined') {
  // 小程序环境
  wx.React = React;
} else if (typeof global !== 'undefined') {
  // Node.js或其他环境
  global.React = React;
} else if (typeof window !== 'undefined') {
  // 浏览器环境
  window.React = React;
}

class App extends Component {
  componentDidMount() {}

  componentDidShow() {}

  componentDidHide() {}

  componentDidCatchError() {}

  // 在 App 类中的 render() 函数没有实际作用
  // 请勿修改此函数
  render() {
    return this.props.children;
  }
}

export default App;