import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Modal, message, Select, Input, DatePicker } from 'antd';
import { DownloadOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

// 订单状态映射
const orderStatusMap = {
  pending: { text: '待确认', color: 'orange' },
  confirmed: { text: '已确认', color: 'blue' },
  processing: { text: '处理中', color: 'purple' },
  shipped: { text: '已发货', color: 'cyan' },
  delivered: { text: '已送达', color: 'green' },
  cancelled: { text: '已取消', color: 'red' },
};

// 订单接口
interface Order {
  id: number;
  orderNo: string;
  userId: number;
  user?: {
    username: string;
    companyName: string;
  };
  companyName: string;
  contactPerson: string;
  contactPhone: string;
  deliveryAddress: string;
  totalAmount: number;
  orderStatus: keyof typeof orderStatusMap;
  paymentStatus: string;
  notes?: string;
  adminNotes?: string;
  confirmedById?: number;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: Array<{
    id: number;
    productName: string;
    unitPrice: number;
    quantity: number;
    selectedSize?: string;
    selectedColor?: string;
    subtotal: number;
  }>;
}

// 日期格式化辅助函数
const formatDate = (dateString: string, format: string = 'YYYY-MM-DD HH:mm') => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year.toString())
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

const OrderManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState('');
  const actionRef = useRef<ActionType>();

  // 获取订单列表
  const fetchOrders = async (params: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: params.current || '1',
        pageSize: params.pageSize || '10',
        ...(params.orderNo && { orderNo: params.orderNo }),
        ...(params.companyName && { companyName: params.companyName }),
        ...(params.contactPhone && { contactPhone: params.contactPhone }),
        ...(params.orderStatus && { orderStatus: params.orderStatus }),
        ...(params.startDate && { startDate: params.startDate }),
        ...(params.endDate && { endDate: params.endDate }),
      }).toString();

      const response = await fetch(`/api/admin/orders?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取订单列表失败');
      }

      const data = await response.json();
      return {
        data: data.data || [],
        total: data.total || 0,
        success: true,
      };
    } catch (error) {
      message.error('获取订单列表失败');
      return {
        data: [],
        total: 0,
        success: false,
      };
    } finally {
      setLoading(false);
    }
  };

  // 更新订单状态
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          adminNotes: adminNotes.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('更新订单状态失败');
      }

      message.success('订单状态更新成功');
      setStatusModalVisible(false);
      setSelectedOrder(null);
      setNewStatus('');
      setAdminNotes('');

      // 刷新表格
      if (actionRef.current) {
        actionRef.current.reload();
      }
    } catch (error) {
      message.error('更新订单状态失败');
    }
  };

  // 导出订单
  const handleExportOrders = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/orders/export', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出订单失败');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      a.download = `orders_${timestamp}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      message.success('订单导出成功');
    } catch (error) {
      message.error('导出订单失败');
    } finally {
      setExportLoading(false);
    }
  };

  // 查看订单详情
  const handleViewDetail = (order: Order) => {
    Modal.info({
      title: `订单详情 - ${order.orderNo}`,
      width: 800,
      content: (
        <div>
          <p><strong>订单号:</strong> {order.orderNo}</p>
          <p><strong>公司名称:</strong> {order.companyName}</p>
          <p><strong>联系人:</strong> {order.contactPerson}</p>
          <p><strong>联系电话:</strong> {order.contactPhone}</p>
          <p><strong>配送地址:</strong> {order.deliveryAddress}</p>
          <p><strong>订单金额:</strong> ¥{order.totalAmount.toFixed(2)}</p>
          <p><strong>订单状态:</strong> <Tag color={orderStatusMap[order.orderStatus].color}>
            {orderStatusMap[order.orderStatus].text}
          </Tag></p>
          <p><strong>下单时间:</strong> {formatDate(order.createdAt, 'YYYY-MM-DD HH:mm:ss')}</p>
          {order.notes && <p><strong>订单备注:</strong> {order.notes}</p>}
          {order.adminNotes && <p><strong>管理员备注:</strong> {order.adminNotes}</p>}

          {order.items && order.items.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4>商品清单</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>商品名称</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>单价</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>数量</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>规格</th>
                    <th style={{ border: '1px solid #ddd', padding: 8 }}>小计</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.productName}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>¥{item.unitPrice.toFixed(2)}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{item.quantity}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        {item.selectedSize && `尺码: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' '}
                        {item.selectedColor && `颜色: ${item.selectedColor}`}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>¥{item.subtotal.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ),
    });
  };

  // 列定义
  const columns: ProColumns<Order>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
      width: 160,
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '公司名称',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 150,
      ellipsis: true,
    },
    {
      title: '联系人',
      dataIndex: 'contactPerson',
      key: 'contactPerson',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      key: 'contactPhone',
      width: 120,
    },
    {
      title: '订单金额',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      render: (text) => `¥${parseFloat(text).toFixed(2)}`,
      sorter: true,
    },
    {
      title: '订单状态',
      dataIndex: 'orderStatus',
      key: 'orderStatus',
      width: 100,
      render: (status: keyof typeof orderStatusMap) => (
        <Tag color={orderStatusMap[status].color}>
          {orderStatusMap[status].text}
        </Tag>
      ),
      filters: Object.entries(orderStatusMap).map(([key, value]) => ({
        text: value.text,
        value: key,
      })),
    },
    {
      title: '下单时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text) => formatDate(text, 'YYYY-MM-DD HH:mm'),
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setNewStatus(record.orderStatus);
              setAdminNotes(record.adminNotes || '');
              setStatusModalVisible(true);
            }}
          >
            修改状态
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<Order>
        headerTitle="订单管理"
        actionRef={actionRef}
        columns={columns}
        request={fetchOrders}
        rowKey="id"
        loading={loading}
        search={{
          labelWidth: 'auto',
          span: 8,
          defaultCollapsed: false,
        }}
        toolBarRender={() => [
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={handleExportOrders}
          >
            导出Excel
          </Button>,
        ]}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        dateFormatter="string"
      />

      {/* 修改订单状态弹窗 */}
      <Modal
        title="修改订单状态"
        open={statusModalVisible}
        onOk={handleUpdateStatus}
        onCancel={() => {
          setStatusModalVisible(false);
          setSelectedOrder(null);
          setNewStatus('');
          setAdminNotes('');
        }}
        okText="确认"
        cancelText="取消"
      >
        {selectedOrder && (
          <div>
            <p><strong>订单号:</strong> {selectedOrder.orderNo}</p>
            <p><strong>当前状态:</strong> <Tag color={orderStatusMap[selectedOrder.orderStatus].color}>
              {orderStatusMap[selectedOrder.orderStatus].text}
            </Tag></p>

            <div style={{ marginBottom: 16 }}>
              <label>新状态:</label>
              <Select
                value={newStatus}
                onChange={setNewStatus}
                style={{ width: '100%', marginTop: 8 }}
              >
                {Object.entries(orderStatusMap).map(([key, value]) => (
                  <Option key={key} value={key}>
                    <Tag color={value.color}>{value.text}</Tag>
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label>管理员备注:</label>
              <Input.TextArea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="请输入管理员备注"
                rows={4}
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default OrderManagement;