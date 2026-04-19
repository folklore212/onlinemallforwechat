import { get } from '../utils/request';

// 商品接口
export interface Product {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  category?: Category;
  sku?: string;
  unitPrice: number;
  costPrice?: number;
  stockQuantity: number;
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  sizeChart?: any;
  colorOptions?: string[];
  mainImageUrl?: string;
  imageGallery?: string[];
  isActive: boolean;
  createdById?: number;
  createdBy?: any;
  createdAt: string;
  updatedAt: string;
}

// 分类接口
export interface Category {
  id: number;
  name: string;
  description?: string;
  sortOrder: number;
  parentId?: number;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  createdAt: string;
}

class ProductService {
  // 获取商品列表
  async getProducts(params?: {
    categoryId?: number;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }): Promise<Product[]> {
    try {
      const data = await get<Product[]>('/products', params);
      return data;
    } catch (error) {
      console.error('获取商品列表失败:', error);
      throw error;
    }
  }

  // 获取商品详情
  async getProductDetail(id: number): Promise<Product> {
    try {
      const data = await get<Product>(`/products/${id}`);
      return data;
    } catch (error) {
      console.error('获取商品详情失败:', error);
      throw error;
    }
  }

  // 获取分类列表
  async getCategories(): Promise<Category[]> {
    try {
      const data = await get<Category[]>('/categories');
      return data;
    } catch (error) {
      console.error('获取分类列表失败:', error);
      throw error;
    }
  }

  // 获取分类树
  async getCategoryTree(): Promise<Category[]> {
    try {
      const data = await get<Category[]>('/categories/tree');
      return data;
    } catch (error) {
      console.error('获取分类树失败:', error);
      throw error;
    }
  }

  // 根据父分类获取子分类
  async getCategoriesByParent(parentId?: number): Promise<Category[]> {
    try {
      const params = parentId ? { parentId } : undefined;
      const data = await get<Category[]>('/categories/by-parent', params);
      return data;
    } catch (error) {
      console.error('获取子分类失败:', error);
      throw error;
    }
  }

  // 获取热门商品
  async getHotProducts(limit: number = 10): Promise<Product[]> {
    console.log('获取热门商品，限制:', limit);
    const products = await this.getProducts();
    return products.slice(0, limit);
  }

  // 搜索商品
  async searchProducts(keyword: string): Promise<Product[]> {
    try {
      const data = await get<Product[]>('/products', { keyword });
      return data;
    } catch (error) {
      console.error('搜索商品失败:', error);
      throw error;
    }
  }
}

export default new ProductService();