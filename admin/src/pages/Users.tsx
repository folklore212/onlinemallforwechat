import React, { useState, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import type { ProColumns, ActionType } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Tag, Space, Modal, message, Switch, Avatar, Input } from 'antd';
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

// 用户类型映射
const userTypeMap = {
  gov_enterprise: { text: '政企客户', color: 'blue' },
  clothing_factory: { text: '服装厂', color: 'green' },
  admin: { text: '管理员', color: 'red' },
};

// 用户状态映射
const userStatusMap = {
  active: { text: '正常', color: 'green' },
  inactive: { text: '禁用', color: 'red' },
};

// 用户接口
interface User {
  id: number;
  openid?: string;
  username?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  userType: keyof typeof userTypeMap;
  companyName?: string;
  companyAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const UserManagement: React.FC = () => {
  const [loading, setLoading] = useState(false);
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

  // 获取用户列表
  const fetchUsers = async (params: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams({
        page: params.current || '1',
        pageSize: params.pageSize || '10',
        ...(params.username && { username: params.username }),
        ...(params.phone && { phone: params.phone }),
        ...(params.userType && { userType: params.userType }),
        ...(params.companyName && { companyName: params.companyName }),
        ...(params.isActive && { isActive: params.isActive }),
      }).toString();

      const response = await fetch(`/api/admin/users?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data = await response.json();
      return {
        data: data.data || [],
        total: data.total || 0,
        success: true,
      };
    } catch (error) {
      message.error('获取用户列表失败');
      return {
        data: [],
        total: 0,
        success: false,
      };
    } finally {
      setLoading(false);
    }
  };

  // 更新用户状态
  const handleUpdateStatus = async (user: User, newStatus: boolean) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error('更新用户状态失败');
      }

      message.success(`用户已${newStatus ? '启用' : '禁用'}`);

      // 刷新表格
      if (actionRef.current) {
        actionRef.current.reload();
      }
    } catch (error) {
      message.error('更新用户状态失败');
    }
  };

  // 删除用户
  const handleDeleteUser = async (user: User) => {
    Modal.confirm({
      title: '删除用户',
      content: `确定要删除用户 "${user.username || user.companyName || '未知用户'}" 吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/users/${user.id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('删除用户失败');
          }

          message.success('用户删除成功');

          // 刷新表格
          if (actionRef.current) {
            actionRef.current.reload();
          }
        } catch (error) {
          message.error('删除用户失败');
        }
      },
    });
  };

  // 重置密码
  const handleResetPassword = async (user: User) => {
    Modal.confirm({
      title: '重置密码',
      content: `确定要重置用户 "${user.username || user.companyName || '未知用户'}" 的密码吗？`,
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/admin/users/${user.id}/reset-password`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            throw new Error('重置密码失败');
          }

          message.success('密码重置成功，新密码已发送至用户邮箱或手机');
        } catch (error) {
          message.error('重置密码失败');
        }
      },
    });
  };

  // 查看用户详情
  const handleViewDetail = (user: User) => {
    Modal.info({
      title: `用户详情 - ${user.username || user.companyName || '未知用户'}`,
      width: 500,
      content: (
        <div>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <Avatar
              src={user.avatarUrl}
              size={80}
              style={{ backgroundColor: user.avatarUrl ? 'transparent' : '#1890ff' }}
            >
              {user.username?.charAt(0) || user.companyName?.charAt(0) || 'U'}
            </Avatar>
          </div>
          <p><strong>用户名:</strong> {user.username || '未设置'}</p>
          <p><strong>用户类型:</strong> <Tag color={userTypeMap[user.userType].color}>
            {userTypeMap[user.userType].text}
          </Tag></p>
          <p><strong>手机号:</strong> {user.phone || '未设置'}</p>
          <p><strong>邮箱:</strong> {user.email || '未设置'}</p>
          <p><strong>公司名称:</strong> {user.companyName || '未设置'}</p>
          <p><strong>联系人:</strong> {user.contactPerson || '未设置'}</p>
          <p><strong>联系电话:</strong> {user.contactPhone || '未设置'}</p>
          <p><strong>公司地址:</strong> {user.companyAddress || '未设置'}</p>
          <p><strong>状态:</strong> <Tag color={user.isActive ? 'green' : 'red'}>
            {user.isActive ? '正常' : '禁用'}
          </Tag></p>
          <p><strong>注册时间:</strong> {formatDate(user.createdAt, 'YYYY-MM-DD HH:mm:ss')}</p>
          <p><strong>最后更新:</strong> {formatDate(user.updatedAt, 'YYYY-MM-DD HH:mm:ss')}</p>
        </div>
      ),
    });
  };

  // 列定义
  const columns: ProColumns<User>[] = [
    {
      title: '用户信息',
      dataIndex: 'username',
      key: 'userInfo',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={record.avatarUrl}
            size="small"
            style={{ marginRight: 8, backgroundColor: record.avatarUrl ? 'transparent' : '#1890ff' }}
          >
            {record.username?.charAt(0) || record.companyName?.charAt(0) || 'U'}
          </Avatar>
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.username || record.companyName || '未知用户'}</div>
            <div style={{ fontSize: '12px', color: '#999' }}>{record.phone || '无手机号'}</div>
          </div>
        </div>
      ),
    },
    {
      title: '用户类型',
      dataIndex: 'userType',
      key: 'userType',
      width: 100,
      render: (userType: keyof typeof userTypeMap) => (
        <Tag color={userTypeMap[userType].color}>
          {userTypeMap[userType].text}
        </Tag>
      ),
      filters: Object.entries(userTypeMap).map(([key, value]) => ({
        text: value.text,
        value: key,
      })),
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
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          checkedChildren="正常"
          unCheckedChildren="禁用"
          onChange={(checked) => handleUpdateStatus(record, checked)}
        />
      ),
      filters: [
        { text: '正常', value: true },
        { text: '禁用', value: false },
      ],
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (text) => formatDate(text, 'YYYY-MM-DD HH:mm'),
      sorter: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<LockOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<User>
        headerTitle="用户管理"
        actionRef={actionRef}
        columns={columns}
        request={fetchUsers}
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
            onClick={() => message.info('添加用户功能开发中')}
          >
            添加用户
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

export default UserManagement;