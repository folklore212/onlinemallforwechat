import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Modal, message, Switch, Image, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

// 商品状态映射
const productStatusMap = {
  active: { text: '上架', color: 'green' },
  inactive: { text: '下架', color: 'red' },
};

// 商品接口
interface Product {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  category?: {
    name: string;
  };
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
  createdBy?: {
    username: string;
    companyName: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ProductManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const actionRef = useRef<ActionType>();

  // 日期格式化辅助函数
  const formatDate = (dateString: string, format: string = 'YYYY-MM-DD HH:mm') => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return format
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes);
  };

  // 获取商品列表
  const fetchProducts = async (params: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: params.current || '1',
        pageSize: params.pageSize || '10',
        ...(params.name && { name: params.name }),
        ...(params.sku && { sku: params.sku }),
        ...(params.categoryId && { categoryId: params.categoryId }),
        ...(params.isActive && { isActive: params.isActive }),
      }).toString();

      const response = await fetch(`/api/admin/products?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取商品列表失败');
      }

      const data = await response.json();
      return {
        data: data.data || [],
        total: data.total || 0,
        success: true,
      };
    } catch (error) {
      message.error('获取商品列表失败');
      return {
        data: [],
        total: 0,
        success: false,
      };
    } finally {
      setLoading(false);
    }
  };

  // 更新商品状态
  const handleUpdateStatus = async (product: Product, newStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/products/${product.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error('更新商品状态失败');
      }

      message.success(`商品已${newStatus ? '上架' : '下架'}`);

      // 刷新表格
      if (actionRef.current) {
        actionRef.current.reload();
      }
    } catch (error) {
      message.error('更新商品状态失败');
    }
  };

  // 删除商品
  const handleDeleteProduct = async (product: Product) => {
    Modal.confirm({
      title: '删除商品',
      content: `确定要删除商品 "${product.name}" 吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/products/${product.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('删除商品失败');
          }

          message.success('商品删除成功');

          // 刷新表格
          if (actionRef.current) {
            actionRef.current.reload();
          }
        } catch (error) {
          message.error('删除商品失败');
        }
      },
    });
  };

  // 查看商品详情
  const handleViewDetail = (product: Product) => {
    Modal.info({
      title: `商品详情 - ${product.name}`,
      width: 600,
      content: (
        <div>
          {product.mainImageUrl && (
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <Image
                src={product.mainImageUrl}
                alt={product.name}
                style={{ maxWidth: '200px', maxHeight: '200px' }}
                preview={false}
              />
            </div>
          )}
          <p><strong>商品名称:</strong> {product.name}</p>
          <p><strong>SKU:</strong> {product.sku || '未设置'}</p>
          <p><strong>分类:</strong> {product.category?.name || '未分类'}</p>
          <p><strong>售价:</strong> ¥{product.unitPrice.toFixed(2)}</p>
          {product.costPrice && <p><strong>成本价:</strong> ¥{product.costPrice.toFixed(2)}</p>}
          <p><strong>库存:</strong> {product.stockQuantity}</p>
          <p><strong>起订量:</strong> {product.minOrderQuantity}</p>
          {product.maxOrderQuantity && <p><strong>最大订购量:</strong> {product.maxOrderQuantity}</p>}
          <p><strong>状态:</strong> <Tag color={product.isActive ? 'green' : 'red'}>
            {product.isActive ? '上架' : '下架'}
          </Tag></p>
          {product.description && <p><strong>描述:</strong> {product.description}</p>}
          {product.sizeChart && <p><strong>尺码表:</strong> {JSON.stringify(product.sizeChart)}</p>}
          {product.colorOptions && product.colorOptions.length > 0 && (
            <p><strong>颜色选项:</strong> {product.colorOptions.join(', ')}</p>
          )}
          <p><strong>创建时间:</strong> {formatDate(product.createdAt, 'YYYY-MM-DD HH:mm:ss')}</p>
          <p><strong>最后更新:</strong> {formatDate(product.updatedAt, 'YYYY-MM-DD HH:mm:ss')}</p>
          {product.createdBy && (
            <p><strong>创建者:</strong> {product.createdBy.companyName} ({product.createdBy.username})</p>
          )}
        </div>
      ),
    });
  };

  // 列定义
  const columns: ProColumns<Product>[] = [
    {
      title: '商品名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: true,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{text}</div>
          {record.sku && <div style={{ fontSize: '12px', color: '#999' }}>SKU: {record.sku}</div>}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (_, record) => record.category?.name || '未分类',
    },
    {
      title: '售价',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 100,
      render: (text) => `¥${parseFloat(text).toFixed(2)}`,
      sorter: true,
    },
    {
      title: '库存',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 80,
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          checkedChildren="上架"
          unCheckedChildren="下架"
          onChange={(checked) => handleUpdateStatus(record, checked)}
        />
      ),
      filters: [
        { text: '上架', value: true },
        { text: '下架', value: false },
      ],
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
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
            onClick={() => message.info('编辑功能开发中')}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteProduct(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<Product>
        headerTitle="商品管理"
        actionRef={actionRef}
        columns={columns}
        request={fetchProducts}
        rowKey="id"
        loading={loading}
        search={{
          labelWidth: 'auto',
          span: 8,
          defaultCollapsed: false,
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => message.info('添加商品功能开发中')}
          >
            添加商品
          </Button>,
        ]}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        dateFormatter="string"
      />
    </PageContainer>
  );
};

export default ProductManagement;