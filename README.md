# 政企制服采购商城系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![Platform](https://img.shields.io/badge/Platform-WeChat%20Mini%20Program-blue)
![Framework](https://img.shields.io/badge/Framework-NestJS%2FTaro%2FAnt%20Design%20Pro-green)

一个专为服装厂和政企客户设计的在线商城系统。政企客户可通过微信小程序登录，浏览和选择制服，加入购物车并下单，无需支付结算。订单由对应服装厂确认后生效，并在后台系统中展示和管理。

## 项目特色

- 🛒 **多角色协同**：支持政企客户、服装厂、管理员三种角色协同工作
- 📱 **微信小程序**：政企客户使用微信小程序，无需额外安装APP
- 🏭 **服装厂管理**：服装厂可管理自有商品和查看相关订单
- 👔 **政企采购流程**：专为政企制服采购优化的下单和确认流程
- 📊 **后台管理**：完整的管理后台，支持订单导出、用户管理、商品审核
- 🔒 **权限控制**：基于RBAC的角色权限管理，数据隔离安全

## 核心功能

### 微信小程序端
- **用户认证**：微信一键登录，自动注册
- **商品浏览**：分类导航、商品搜索、商品详情查看
- **购物车管理**：添加商品、修改数量、删除商品、清空购物车
- **订单流程**：填写配送信息、提交订单、查看订单状态、取消订单
- **个人中心**：用户信息查看、订单管理

### 服装厂功能
- **商品管理**：上传、编辑、上下架自有商品
- **订单确认**：查看相关订单，确认订单处理
- **库存管理**：实时更新商品库存信息

### 管理后台
- **用户管理**：查看、启用/禁用所有用户，重置密码
- **商品管理**：审核商品、上下架管理、商品信息编辑
- **订单管理**：查看所有订单、修改订单状态、导出Excel
- **分类管理**：商品分类树形结构管理
- **数据统计**：销售数据统计和报表

## 技术栈

### 后端
- **框架**：NestJS + TypeScript
- **数据库**：MySQL 8.0 + TypeORM
- **缓存**：Redis
- **认证**：JWT + 微信登录
- **API文档**：Swagger/OpenAPI

### 微信小程序
- **框架**：Taro 4.x + React + TypeScript
- **UI组件**：Taro UI
- **状态管理**：Zustand
- **网络请求**：Axios封装

### 管理后台
- **框架**：Ant Design Pro + React + TypeScript
- **开发框架**：UmiJS 4.x
- **UI组件**：Ant Design 5.x
- **表格组件**：ProTable

### 开发与部署
- **容器化**：Docker + Docker Compose
- **服务器**：阿里云ECS
- **反向代理**：Nginx
- **环境管理**：开发、测试、生产环境配置

## 项目结构

```
wechat-online-shop/
├── backend/                    # NestJS后端服务
│   ├── src/
│   │   ├── auth/              # 认证模块
│   │   ├── users/             # 用户管理
│   │   ├── products/          # 商品管理
│   │   ├── categories/        # 分类管理
│   │   ├── shopping-cart/     # 购物车
│   │   ├── orders/            # 订单管理
│   │   └── common/            # 通用模块
│   └── docker-compose.yml     # 开发环境配置
├── miniprogram/               # 微信小程序
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   ├── index/         # 首页
│   │   │   ├── category/      # 分类页
│   │   │   ├── product/       # 商品详情页
│   │   │   ├── cart/          # 购物车页
│   │   │   └── order/         # 订单相关页面
│   │   ├── services/          # 业务服务
│   │   └── utils/             # 工具函数
│   └── config/                # 小程序配置
├── admin/                     # 管理后台
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard.tsx  # 仪表盘
│   │   │   ├── Orders.tsx     # 订单管理
│   │   │   ├── Products.tsx   # 商品管理
│   │   │   └── Users.tsx      # 用户管理
│   │   └── config/            # 配置
│   └── dist/                  # 构建输出
├── docs/                      # 文档
│   ├── 数据库设计/             # 数据库设计文档
│   └── API文档/               # API接口文档
├── deployment/                # 部署配置
│   ├── docker-compose.yml     # 生产环境配置
│   └── nginx/                 # Nginx配置
└── README.md                  # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js 16+ 或 18+
- MySQL 8.0+
- Redis 6+
- Docker & Docker Compose（可选）

### 1. 后端服务启动

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑.env文件，配置数据库和Redis连接

# 启动开发环境
npm run start:dev

# 或者使用Docker Compose
docker-compose up -d
```

### 2. 微信小程序开发

```bash
# 进入小程序目录
cd miniprogram

# 安装依赖
npm install

# 开发模式
npm run dev:weapp

# 构建生产版本
npm run build:weapp
```

### 3. 管理后台开发

```bash
# 进入管理后台目录
cd admin

# 安装依赖
npm install

# 开发模式
npm start

# 构建生产版本
npm run build
```

### 4. 数据库初始化

```bash
# 执行数据库迁移
cd backend
npm run migration:run

# 或执行SQL脚本
mysql -u root -p < docs/数据库设计/schema.sql
```

## API文档

启动后端服务后，访问以下地址查看API文档：

- Swagger UI: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs-json

## 部署指南

详细部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 开发指南

### 代码规范

- 使用ESLint + Prettier进行代码格式化
- TypeScript严格模式
- 遵循各框架的官方最佳实践

### 提交规范

遵循Conventional Commits规范：
- feat: 新功能
- fix: 修复bug
- docs: 文档更新
- style: 代码格式调整
- refactor: 代码重构
- test: 测试相关
- chore: 构建过程或辅助工具变动

### 分支策略

- `main`: 生产环境分支
- `develop`: 开发分支
- `feature/*`: 功能分支
- `release/*`: 发布分支
- `hotfix/*`: 热修复分支

## 测试

```bash
# 后端测试
cd backend
npm test

# 小程序测试（需配置测试环境）
cd miniprogram
npm test
```

## 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](./LICENSE) 文件了解详情。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 邮件联系
- 项目讨论区

## 更新日志

查看 [CHANGELOG.md](./CHANGELOG.md) 了解详细更新记录。

---

**注意**: 本项目为企业内部系统，涉及微信小程序功能需企业微信认证，请确保具备相关资质。