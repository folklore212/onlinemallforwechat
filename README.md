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

### 系统监控
- **健康检查**：实时监控数据库、Redis、内存等依赖服务状态
- **性能监控**：内存使用量、响应时间、服务可用性监控
- **版本信息**：应用版本和运行环境信息查询

## 技术栈

### 后端
- **框架**：NestJS + TypeScript
- **数据库**：MySQL 8.0 + TypeORM
- **缓存**：Redis
- **认证**：JWT + 微信登录
- **API文档**：Swagger/OpenAPI
- **健康检查**：@nestjs/terminus
- **图像处理**：sharp
- **测试框架**：Jest

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
│   │   ├── uploads/           # 文件上传模块
│   │   ├── test/              # 测试相关
│   │   └── common/            # 通用模块
│   │       └── health/        # 健康检查模块
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
│   ├── docker-compose.dev.yml    # 开发环境配置
│   ├── docker-compose.prod.yml   # 生产环境配置
│   ├── docker-compose.test.yml   # 测试环境配置
│   ├── init.sql                  # 数据库初始化脚本
│   └── nginx/                    # Nginx配置
└── README.md                  # 项目说明文档
```

## 快速开始

### 环境要求

- Node.js 16+ 或 18+
- MySQL 8.0+
- Redis 6+
- Docker & Docker Compose（可选）

### 环境配置详解

项目使用多层环境配置体系，支持开发、测试、生产三种环境：

#### 环境变量文件说明

| 文件 | 用途 | 说明 |
|------|------|------|
| `.env.development` | 开发环境 | 连接本地MySQL(3306)和Redis(6379)，适合本地开发 |
| `.env.test` | 测试环境 | 连接Docker测试服务MySQL(3307)和Redis(6380)，用于自动化测试 |
| `.env.production` | 生产环境 | **需从`.env.production.example`复制创建**，配置生产数据库 |
| `.env.example` | 配置模板 | 通用配置模板，可复制创建上述各环境配置文件 |
| `.env` | 当前环境 | **注意**：当前此文件配置的是测试环境（DB_PORT=3307） |

#### 配置优先级
1. **环境变量**：系统环境变量优先级最高
2. **环境文件**：根据`NODE_ENV`加载对应文件（如`NODE_ENV=development`加载`.env.development`）
3. **Docker挂载**：Docker容器通过卷挂载将环境文件映射为容器内的`.env`
4. **默认值**：代码中配置的默认值（如`app.module.ts`中的数据库配置）

#### 重要配置项
- **数据库连接**：`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- **Redis缓存**：`REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- **JWT认证**：`JWT_SECRET`, `JWT_EXPIRES_IN`（生产环境必须修改！）
- **微信小程序**：`WX_APP_ID`, `WX_APP_SECRET`（需要真实的小程序AppID）
- **文件上传**：`UPLOAD_PATH`, `MAX_FILE_SIZE`, `ALLOWED_FILE_TYPES`

#### 创建环境配置文件
```bash
# 开发环境
cp backend/.env.example backend/.env.development

# 测试环境（已存在，包含测试配置）
# backend/.env.test 已配置为测试环境

# 生产环境
cp backend/.env.production.example backend/.env.production
# 编辑 backend/.env.production，配置真实的生产数据库和Redis信息
```

### 1. 后端服务启动

项目提供多种启动方式，可根据需求选择：

#### 开发环境启动

**方式一：本地开发模式（推荐）**
```bash
# 进入后端目录
cd backend

# 使用现有开发环境配置（如不存在则创建）
cp .env.example .env.development  # 仅第一次需要
# 编辑 .env.development 文件（默认配置已适合本地开发）

# 安装依赖
npm install

# 启动开发服务器（支持热重载）
npm run start:dev

# 验证服务运行
curl http://localhost:3000/api/health
```

**方式二：Docker辅助开发**
```bash
# 启动开发数据库和Redis
cd deployment
docker-compose -f docker-compose.dev.yml up -d

# 本地运行后端服务（连接到Docker中的数据库）
cd ../backend
npm run start:dev
```

**方式三：使用示例图片库（可选）**
```bash
# 下载开发用示例图片
./scripts/download-images.sh
# 图片将保存到 public/uploads/ 目录
```

#### 测试环境启动

**方式一：自动化测试套件（推荐，完整流程）**
```bash
# 运行完整的测试流程：设置环境 → 运行测试 → 清理环境
./scripts/test/run-tests.sh
# 包含单元测试、集成测试、端到端测试和健康检查
```

**方式二：手动测试环境管理**
```bash
# 设置测试环境
./scripts/test/setup-test-env.sh
# 运行健康检查
./scripts/test/health-check.sh
# 清理测试环境
./scripts/test/cleanup-test-env.sh
```

**方式三：简单测试运行**
```bash
cd backend
# 运行Jest测试（需要测试环境正在运行）
npm test

# 查看测试覆盖率
npm run test:cov
```

#### 生产环境部署

**方式一：Docker Compose生产部署**
```bash
# 创建生产环境配置
cd backend
cp .env.production.example .env.production
# 编辑 .env.production 文件，配置真实的生产数据库和Redis信息

# 启动生产环境
cd ../deployment
docker-compose -f docker-compose.prod.yml up -d
# 包含MySQL、Redis、后端API和Nginx反向代理
```

**方式二：手动生产部署**
```bash
cd backend

# 安装生产依赖（忽略开发依赖）
npm install --production

# 构建项目
npm run build

# 配置生产环境
cp .env.production.example .env.production
# 编辑 .env.production 文件

# 启动生产服务
npm run start:prod
```

**方式三：使用生产Docker镜像**
```bash
# 构建生产镜像
docker build -f backend/Dockerfile.prod -t wechat-shop-backend:latest .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -v $(pwd)/backend/.env.production:/app/.env \
  -v uploads:/var/uploads \
  --name wechat-shop-backend \
  wechat-shop-backend:latest
```

#### 端口说明
- **开发环境**：后端API运行在 `http://localhost:3000`
- **测试环境**：后端API运行在 `http://localhost:3001`
- **生产环境**：默认运行在 `http://localhost:3000`（可通过Nginx配置域名）

#### 数据库初始化
- **开发环境**：TypeORM自动同步（`synchronize: true`）
- **测试环境**：Docker Compose自动执行 `docs/database/schema.sql`
- **生产环境**：
  ```bash
  # 首次部署执行SQL脚本
  mysql -h <host> -u <user> -p < docs/database/schema.sql
  
  # 后续更新使用迁移
  npm run migration:generate -- -n <迁移名称>
  npm run migration:run
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

### 5. 测试

```bash
# 运行后端测试
cd backend
npm test

# 运行测试并生成覆盖率报告
npm run test:cov

# 使用Docker Compose运行测试环境
cd deployment
docker-compose -f docker-compose.test.yml up -d
```

### 6. 健康检查

启动后端服务后，可以通过以下端点检查系统健康状态：

- **完整健康检查**：`GET http://localhost:3000/health`
  - 检查数据库、Redis、内存等依赖服务状态
- **简单状态检查**：`GET http://localhost:3000/health/simple`
  - 返回应用基本状态信息
- **版本信息**：`GET http://localhost:3000/health/version`
  - 返回应用版本和运行环境信息

## API文档

启动后端服务后，访问以下地址查看API文档：

- Swagger UI: http://localhost:3000/api/docs
- OpenAPI JSON: http://localhost:3000/api/docs-json

健康检查端点（`/health`、`/health/simple`、`/health/version`）已集成到Swagger文档中。

## 脚本工具参考

项目提供了丰富的自动化脚本，位于 `scripts/` 目录下，可大幅提升开发和测试效率：

### 测试环境脚本 (`scripts/test/`)

| 脚本文件 | 功能描述 | 使用场景 |
|----------|----------|----------|
| `run-tests.sh` | **完整测试套件**：设置环境 → 运行测试 → 清理环境 | 自动化测试、CI/CD流水线 |
| `setup-test-env.sh` | 设置完整的测试环境（MySQL、Redis、后端服务） | 手动测试环境搭建 |
| `cleanup-test-env.sh` | 清理测试环境和所有数据卷 | 测试完成后资源清理 |
| `health-check.sh` | 全面的健康检查：服务状态、端口、API端点、系统资源 | 环境验证和故障排查 |

**使用示例**：
```bash
# 运行完整测试套件（推荐）
./scripts/test/run-tests.sh

# 仅设置测试环境
./scripts/test/setup-test-env.sh

# 运行健康检查
./scripts/test/health-check.sh
```

### 开发工具脚本

| 脚本文件 | 功能描述 | 使用场景 |
|----------|----------|----------|
| `download-images.sh` | 下载开发用示例图片到 `public/uploads/` 目录 | 本地开发、演示环境 |
| `.claude/commands/test-command.sh` | Claude Code测试命令 | 开发工具集成 |

**使用示例**：
```bash
# 下载示例图片库
./scripts/download-images.sh
# 包含商品图片、分类图标、用户头像、轮播图等
```

### 脚本输出说明
- **日志文件**：脚本运行日志保存在 `scripts/test/logs/` 目录
- **测试报告**：测试结果保存在 `scripts/test/reports/` 目录
- **环境信息**：测试环境信息保存在 `scripts/test/env-info.txt`

### 环境变量要求
部分脚本需要设置 `DOCKER_HOST` 环境变量：
```bash
export DOCKER_HOST=unix:///var/run/docker.sock
```

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