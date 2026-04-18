import { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import { AtGrid, AtTabs, AtTabsPane, AtCard, AtTag, AtIcon } from 'taro-ui';
import Taro from '@tarojs/taro';
import './index.scss';
import productService from '../../services/product.service';
import cartService from '../../services/cart.service';
import authService from '../../services/auth.service';

export default function Category() {
  const [currentTab, setCurrentTab] = useState(0);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [categoryTree, setCategoryTree] = useState<Array<any>>([]);
  const [products, setProducts] = useState<Array<any>>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState<any>(null);

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
      // 获取分类树
      const treeData = await productService.getCategoryTree();
      setCategoryTree(treeData);

      // 获取扁平分类列表
      const flatCategories = flattenCategories(treeData);
      setCategories(flatCategories);

      // 默认选择第一个分类
      if (flatCategories.length > 0 && !selectedCategory) {
        setSelectedCategory(flatCategories[0]);
        await loadProductsByCategory(flatCategories[0].id);
      }
    } catch (error) {
      console.error('加载分类数据失败:', error);
      Taro.showToast({
        title: '加载失败',
        icon: 'none',
      });
    } finally {
      setLoading(false);
    }
  };

  // 扁平化分类树
  const flattenCategories = (tree: Array<any>): Array<any> => {
    let result: Array<any> = [];
    tree.forEach((category) => {
      result.push(category);
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children));
      }
    });
    return result;
  };

  // 根据分类加载商品
  const loadProductsByCategory = async (categoryId: number) => {
    try {
      const productsData = await productService.getProducts({ categoryId });
      setProducts(productsData);
    } catch (error) {
      console.error('加载商品失败:', error);
      throw error;
    }
  };

  // 选择分类
  const handleSelectCategory = async (category: any) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      await loadProductsByCategory(category.id);
    } catch (error) {
      console.error('加载商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 跳转到商品详情
  const navigateToProductDetail = (id: number) => {
    Taro.navigateTo({
      url: `/pages/product/index?id=${id}`,
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
            // 跳转到登录或调用登录方法
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
        productId: product.id,
        quantity: 1,
      });
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

  // 分类网格数据
  const categoryGridItems = categories.map((category) => ({
    image: 'https://via.placeholder.com/60x60/1890ff/ffffff?text=' + category.name.charAt(0),
    value: category.id.toString(),
    text: category.name,
  }));

  // 选项卡数据
  const tabList = categoryTree.map((category) => ({ title: category.name }));

  return (
    <View className='category'>
      {/* 顶部标题 */}
      <View className='header'>
        <Text className='title'>商品分类</Text>
      </View>

      {/* 分类选项卡 */}
      {categoryTree.length > 0 && (
        <AtTabs
          current={currentTab}
          tabList={tabList}
          onClick={(index) => {
            setCurrentTab(index);
            const category = categoryTree[index];
            handleSelectCategory(category);
          }}
        >
          {categoryTree.map((category, index) => (
            <AtTabsPane current={currentTab} index={index} key={category.id}>
              <View className='tab-content'>
                {/* 子分类 */}
                {category.children && category.children.length > 0 && (
                  <View className='sub-categories'>
                    <ScrollView className='sub-category-list' scrollX>
                      {category.children.map((child: any) => (
                        <View
                          key={child.id}
                          className={`sub-category-item ${
                            selectedCategory?.id === child.id ? 'active' : ''
                          }`}
                          onClick={() => handleSelectCategory(child)}
                        >
                          <Text>{child.name}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* 商品列表 */}
                <View className='product-list'>
                  {loading ? (
                    <View className='loading'>加载中...</View>
                  ) : products.length === 0 ? (
                    <View className='empty'>该分类下暂无商品</View>
                  ) : (
                    products.map((product) => (
                      <View key={product.id} className='product-card'>
                        <Image
                          className='product-image'
                          src={
                            product.mainImageUrl ||
                            'https://via.placeholder.com/200x200/eee/999?text=商品图'
                          }
                          mode='aspectFill'
                          onClick={() => navigateToProductDetail(product.id)}
                        />
                        <View className='product-info'>
                          <Text className='product-name' numberOfLines={2}>
                            {product.name}
                          </Text>
                          <Text className='product-price'>¥{product.unitPrice}</Text>
                          <Text className='product-stock'>
                            库存: {product.stockQuantity}
                          </Text>
                          <View className='product-actions'>
                            <AtTag
                              size='small'
                              type='primary'
                              circle
                              onClick={() => handleAddToCart(product)}
                            >
                              <AtIcon value='shopping-cart' size='12'></AtIcon>
                              加入购物车
                            </AtTag>
                          </View>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </AtTabsPane>
          ))}
        </AtTabs>
      )}

      {/* 加载状态 */}
      {loading && categories.length === 0 && (
        <View className='loading'>加载分类数据...</View>
      )}

      {/* 无数据状态 */}
      {!loading && categories.length === 0 && (
        <View className='empty'>暂无分类数据</View>
      )}
    </View>
  );
}