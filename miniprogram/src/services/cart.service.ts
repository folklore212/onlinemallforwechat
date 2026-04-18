import { get, post, put, del } from '../utils/request';

// 购物车项接口
export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  product: any; // Product接口
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 购物车汇总接口
export interface CartSummary {
  totalItems: number;
  totalAmount: number;
  items: CartItem[];
}

class CartService {
  // 获取购物车列表
  async getCart(): Promise<CartItem[]> {
    try {
      const data = await get<CartItem[]>('/cart');
      return data;
    } catch (error) {
      console.error('获取购物车失败:', error);
      throw error;
    }
  }

  // 获取购物车汇总
  async getCartSummary(): Promise<CartSummary> {
    try {
      const data = await get<CartSummary>('/cart/summary');
      return data;
    } catch (error) {
      console.error('获取购物车汇总失败:', error);
      throw error;
    }
  }

  // 添加商品到购物车
  async addToCart(params: {
    productId: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
    notes?: string;
  }): Promise<CartItem> {
    try {
      const data = await post<CartItem>('/cart/items', params);
      return data;
    } catch (error) {
      console.error('添加商品到购物车失败:', error);
      throw error;
    }
  }

  // 更新购物车项
  async updateCartItem(
    cartItemId: number,
    params: {
      quantity?: number;
      selectedSize?: string;
      selectedColor?: string;
      notes?: string;
    },
  ): Promise<CartItem> {
    try {
      const data = await put<CartItem>(`/cart/items/${cartItemId}`, params);
      return data;
    } catch (error) {
      console.error('更新购物车项失败:', error);
      throw error;
    }
  }

  // 删除购物车项
  async removeCartItem(cartItemId: number): Promise<void> {
    try {
      await del(`/cart/items/${cartItemId}`);
    } catch (error) {
      console.error('删除购物车项失败:', error);
      throw error;
    }
  }

  // 清空购物车
  async clearCart(): Promise<void> {
    try {
      await del('/cart/clear');
    } catch (error) {
      console.error('清空购物车失败:', error);
      throw error;
    }
  }

  // 批量更新购物车项数量
  async batchUpdate(updates: Array<{ cartItemId: number; quantity: number }>): Promise<CartItem[]> {
    try {
      const data = await post<CartItem[]>('/cart/batch-update', updates);
      return data;
    } catch (error) {
      console.error('批量更新购物车失败:', error);
      throw error;
    }
  }

  // 计算购物车商品总数
  async getCartTotalCount(): Promise<number> {
    try {
      const summary = await this.getCartSummary();
      return summary.totalItems;
    } catch (error) {
      console.error('计算购物车总数失败:', error);
      return 0;
    }
  }

  // 检查商品是否在购物车中
  async isProductInCart(productId: number): Promise<boolean> {
    try {
      const cart = await this.getCart();
      return cart.some((item) => item.productId === productId);
    } catch (error) {
      console.error('检查商品是否在购物车中失败:', error);
      return false;
    }
  }
}

export default new CartService();