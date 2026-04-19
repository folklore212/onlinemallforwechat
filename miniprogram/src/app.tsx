import React, { Component } from 'react';
import './app.scss';
import 'taro-ui/dist/style/index.scss';

// 确保React在全局可用 - Taro运行时需要
if (typeof global !== 'undefined') {
  (global as any).React = React;
} else if (typeof window !== 'undefined') {
  (window as any).React = React;
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