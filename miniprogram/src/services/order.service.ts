import { get, post } from '../utils/request';

// 订单状态
export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

// 订单项接口
export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
  subtotal: number;
  createdAt: string;
}

// 订单接口
export interface Order {
  id: number;
  orderNo: string;
  userId: number;
  user?: any;
  companyName?: string;
  contactPerson?: string;
  contactPhone?: string;
  deliveryAddress?: string;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: 'not_required' | 'pending' | 'paid';
  notes?: string;
  adminNotes?: string;
  confirmedById?: number;
  confirmedBy?: any;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

class OrderService {
  // 从购物车创建订单
  async createOrder(params: {
    companyName?: string;
    contactPerson?: string;
    contactPhone?: string;
    deliveryAddress?: string;
    notes?: string;
  }): Promise<Order> {
    try {
      const data = await post<Order>('/orders', params);
      return data;
    } catch (error) {
      console.error('创建订单失败:', error);
      throw error;
    }
  }

  // 获取用户订单列表
  async getOrders(): Promise<Order[]> {
    try {
      const data = await get<Order[]>('/orders');
      return data;
    } catch (error) {
      console.error('获取订单列表失败:', error);
      throw error;
    }
  }

  // 获取订单详情
  async getOrderDetail(id: number): Promise<Order> {
    try {
      const data = await get<Order>(`/orders/${id}`);
      return data;
    } catch (error) {
      console.error('获取订单详情失败:', error);
      throw error;
    }
  }

  // 取消订单
  async cancelOrder(id: number): Promise<Order> {
    try {
      const data = await post<Order>(`/orders/${id}/cancel`);
      return data;
    } catch (error) {
      console.error('取消订单失败:', error);
      throw error;
    }
  }

  // 获取订单状态文本
  getOrderStatusText(status: OrderStatus): string {
    const statusMap = {
      [OrderStatus.PENDING]: '待确认',
      [OrderStatus.CONFIRMED]: '已确认',
      [OrderStatus.PROCESSING]: '处理中',
      [OrderStatus.SHIPPED]: '已发货',
      [OrderStatus.DELIVERED]: '已送达',
      [OrderStatus.CANCELLED]: '已取消',
    };
    return statusMap[status] || status;
  }

  // 获取订单状态颜色
  getOrderStatusColor(status: OrderStatus): string {
    const colorMap = {
      [OrderStatus.PENDING]: '#faad14', // 橙色
      [OrderStatus.CONFIRMED]: '#1890ff', // 蓝色
      [OrderStatus.PROCESSING]: '#722ed1', // 紫色
      [OrderStatus.SHIPPED]: '#13c2c2', // 青色
      [OrderStatus.DELIVERED]: '#52c41a', // 绿色
      [OrderStatus.CANCELLED]: '#f5222d', // 红色
    };
    return colorMap[status] || '#d9d9d9';
  }

  // 计算订单总数
  getTotalOrders(orders: Order[]): number {
    return orders.length;
  }

  // 计算订单总金额
  getTotalAmount(orders: Order[]): number {
    return orders.reduce((total, order) => total + order.totalAmount, 0);
  }

  // 根据状态筛选订单
  filterOrdersByStatus(orders: Order[], status: OrderStatus): Order[] {
    return orders.filter((order) => order.orderStatus === status);
  }
}

export default new OrderService();