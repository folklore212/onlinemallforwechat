# 政企制服采购商城系统 - 部署指南

本文档提供政企制服采购商城系统的生产环境部署指南。系统包含三个主要组件：
1. **后端API服务** (NestJS + MySQL + Redis)
2. **微信小程序** (Taro + React)
3. **管理后台** (Ant Design Pro + React)

## 部署架构

```
用户访问 → 微信小程序 (微信平台) → HTTPS → Nginx (反向代理) → 后端API服务
                                                          ↓
                                               管理后台 (Web访问) → HTTPS → Nginx
```

## 环境要求

### 服务器要求
- **操作系统**: Ubuntu 20.04 LTS 或 CentOS 8+
- **CPU**: 2核以上
- **内存**: 4GB以上
- **硬盘**: 50GB以上可用空间
- **网络**: 公网IP，开放80/443端口

### 软件要求
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 16+ (仅用于构建)
- **Nginx**: 1.18+
- **MySQL**: 8.0+
- **Redis**: 6.0+

### 域名和证书
- 域名1: `api.yourdomain.com` (API服务)
- 域名2: `admin.yourdomain.com` (管理后台)
- SSL证书: Let's Encrypt 或商业证书

### 微信小程序要求
- 企业微信认证
- 微信小程序AppID和AppSecret
- 已配置服务器域名白名单

## 部署步骤

### 步骤1: 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要工具
sudo apt install -y curl wget git vim htop

# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
sudo systemctl start docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 安装Node.js (用于构建)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 步骤2: 获取代码

```bash
# 克隆代码库
git clone https://your-repository-url/wechat-online-shop.git
cd wechat-online-shop

# 切换到生产分支
git checkout main
```

### 步骤3: 配置环境变量

#### 后端服务配置 (`backend/.env.production`)

```env
# 应用配置
NODE_ENV=production
PORT=3000
APP_NAME=Wechat-Online-Shop
APP_VERSION=1.0.0

# 数据库配置
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=wechat_prod_user
DB_PASSWORD=your_strong_password_here
DB_DATABASE=wechat_online_shop_prod
DB_SYNCHRONIZE=false

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# JWT配置
JWT_SECRET=your_jwt_secret_key_here_change_me
JWT_EXPIRES_IN=7d

# 微信小程序配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret
WECHAT_LOGIN_URL=https://api.weixin.qq.com/sns/jscode2session

# 文件上传配置
UPLOAD_PATH=/var/uploads
MAX_FILE_SIZE=10mb
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif

# CORS配置
CORS_ORIGIN=https://admin.yourdomain.com,https://your-miniprogram-domain
CORS_CREDENTIALS=true

# 日志配置
LOG_LEVEL=info
LOG_FILE=/var/log/wechat-shop/app.log
```

#### 管理后台配置 (`admin/.env.production`)

```env
# API基础URL
API_BASE_URL=https://api.yourdomain.com

# 环境配置
NODE_ENV=production
UMI_ENV=production

# 构建配置
PUBLIC_PATH=/
BASE=/
```

### 步骤4: 创建生产环境Docker Compose配置

创建 `deployment/docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  # MySQL数据库
  mysql:
    image: mysql:8.0
    container_name: wechat-shop-mysql-prod
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
      MYSQL_DATABASE: wechat_online_shop_prod
      MYSQL_USER: wechat_prod_user
      MYSQL_PASSWORD: ${DB_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data_prod:/var/lib/mysql
      - ./deployment/init.sql:/docker-entrypoint-initdb.d/init.sql
      - ./deployment/mysql/my.cnf:/etc/mysql/conf.d/my.cnf
    command: 
      - --default-authentication-plugin=mysql_native_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    restart: unless-stopped
    networks:
      - wechat-network

  # Redis缓存
  redis:
    image: redis:7-alpine
    container_name: wechat-shop-redis-prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data_prod:/data
      - ./deployment/redis/redis.conf:/usr/local/etc/redis/redis.conf
    restart: unless-stopped
    networks:
      - wechat-network

  # 后端API服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    container_name: wechat-shop-backend-prod
    environment:
      - NODE_ENV=production
    ports:
      - "3000:3000"
    volumes:
      - uploads:/var/uploads
      - logs:/var/log/wechat-shop
      - ./backend/.env.production:/app/.env
    depends_on:
      - mysql
      - redis
    restart: unless-stopped
    networks:
      - wechat-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 管理后台 (Nginx服务)
  admin-nginx:
    image: nginx:alpine
    container_name: wechat-shop-admin-nginx-prod
    ports:
      - "8080:80"
    volumes:
      - ./admin/dist:/usr/share/nginx/html
      - ./deployment/nginx/admin.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - wechat-network

networks:
  wechat-network:
    driver: bridge

volumes:
  mysql_data_prod:
  redis_data_prod:
  uploads:
  logs:
```

### 步骤5: 创建Nginx反向代理配置

创建 `deployment/nginx/api.conf`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    
    # SSL优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # 代理到后端服务
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # API文档访问
    location /api/docs {
        proxy_pass http://backend:3000/api/docs;
        proxy_set_header Host $host;
    }

    # 健康检查
    location /health {
        proxy_pass http://backend:3000/api/health;
        access_log off;
    }

    # 静态文件访问
    location /uploads/ {
        proxy_pass http://backend:3000/uploads/;
        expires 30d;
        access_log off;
    }

    # 限制请求大小
    client_max_body_size 10m;
}
```

创建 `deployment/nginx/admin.conf`:

```nginx
server {
    listen 80;
    server_name admin.yourdomain.com;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.yourdomain.com;

    # SSL证书配置
    ssl_certificate /etc/letsencrypt/live/admin.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.yourdomain.com/privkey.pem;
    
    # SSL优化配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self' https://api.yourdomain.com;";

    # 根目录
    root /usr/share/nginx/html;
    index index.html;

    # 静态文件缓存
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 代理API请求
    location /api/ {
        proxy_pass https://api.yourdomain.com/;
        proxy_set_header Host api.yourdomain.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 不缓存HTML文件
    location ~* \.(html)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
    }

    # Gzip压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 步骤6: 创建后端Dockerfile

创建 `backend/Dockerfile.prod`:

```dockerfile
# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源码
COPY . .

# 构建应用
RUN npm run build

# 生产运行阶段
FROM node:18-alpine

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    mkdir -p /var/uploads /var/log/wechat-shop && \
    chown -R nodejs:nodejs /app /var/uploads /var/log/wechat-shop

# 从构建阶段复制文件
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# 切换用户
USER nodejs

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {if (r.statusCode !== 200) throw new Error()})"

# 启动命令
CMD ["node", "dist/main"]
```

### 步骤7: 构建和部署

```bash
# 1. 构建小程序
cd miniprogram
npm install
npm run build:weapp
# 将dist目录上传到微信开发者工具

# 2. 构建管理后台
cd ../admin
npm install
npm run build
# 构建产物在admin/dist目录

# 3. 启动生产环境服务
cd ..
docker-compose -f deployment/docker-compose.prod.yml up -d

# 4. 初始化数据库
docker-compose -f deployment/docker-compose.prod.yml exec mysql \
  mysql -u wechat_prod_user -p wechat_online_shop_prod < docs/数据库设计/schema.sql

# 5. 检查服务状态
docker-compose -f deployment/docker-compose.prod.yml ps
docker-compose -f deployment/docker-compose.prod.yml logs -f
```

### 步骤8: 配置SSL证书 (使用Let's Encrypt)

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d api.yourdomain.com -d admin.yourdomain.com

# 设置自动续期
sudo certbot renew --dry-run
```

### 步骤9: 配置系统服务 (可选)

创建系统服务文件 `/etc/systemd/system/wechat-shop.service`:

```ini
[Unit]
Description=WeChat Online Shop Backend
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/wechat-online-shop
ExecStart=/usr/local/bin/docker-compose -f deployment/docker-compose.prod.yml up -d
ExecStop=/usr/local/bin/docker-compose -f deployment/docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

启用服务:
```bash
sudo systemctl daemon-reload
sudo systemctl enable wechat-shop
sudo systemctl start wechat-shop
```

## 微信小程序配置

### 1. 服务器域名配置
登录微信公众平台，配置服务器域名：
- request合法域名: `https://api.yourdomain.com`
- uploadFile合法域名: `https://api.yourdomain.com`
- downloadFile合法域名: `https://api.yourdomain.com`
- socket合法域名: `wss://api.yourdomain.com` (如使用WebSocket)

### 2. 业务域名配置
配置业务域名用于web-view组件:
- `https://admin.yourdomain.com`

### 3. 小程序发布
1. 在微信开发者工具中上传代码
2. 提交审核
3. 审核通过后发布

## 监控和维护

### 日志查看

```bash
# 查看所有服务日志
docker-compose -f deployment/docker-compose.prod.yml logs -f

# 查看特定服务日志
docker-compose -f deployment/docker-compose.prod.yml logs -f backend

# 查看最近100行日志
docker-compose -f deployment/docker-compose.prod.yml logs --tail=100 backend
```

### 备份和恢复

#### 数据库备份
```bash
# 创建备份
docker-compose -f deployment/docker-compose.prod.yml exec mysql \
  mysqldump -u wechat_prod_user -p wechat_online_shop_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# 自动备份脚本 (添加到crontab)
0 2 * * * cd /path/to/wechat-online-shop && docker-compose -f deployment/docker-compose.prod.yml exec mysql mysqldump -u wechat_prod_user -pPASSWORD wechat_online_shop_prod > /backup/wechat-shop_$(date +\%Y\%m\%d).sql
```

#### Redis备份
```bash
# 创建Redis备份
docker-compose -f deployment/docker-compose.prod.yml exec redis redis-cli save
docker cp wechat-shop-redis-prod:/data/dump.rdb ./redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看服务状态
docker-compose -f deployment/docker-compose.prod.yml ps
docker-compose -f deployment/docker-compose.prod.yml top

# 健康检查
curl https://api.yourdomain.com/api/health
```

### 常见问题排查

#### 1. 服务无法启动
```bash
# 检查端口占用
netstat -tulpn | grep :3000
netstat -tulpn | grep :3306
netstat -tulpn | grep :6379

# 检查容器日志
docker-compose -f deployment/docker-compose.prod.yml logs backend
```

#### 2. 数据库连接问题
```bash
# 测试数据库连接
docker-compose -f deployment/docker-compose.prod.yml exec mysql mysql -u wechat_prod_user -p -e "SELECT 1;"
```

#### 3. Redis连接问题
```bash
# 测试Redis连接
docker-compose -f deployment/docker-compose.prod.yml exec redis redis-cli ping
```

#### 4. 内存不足
```bash
# 清理未使用的Docker资源
docker system prune -a

# 清理日志文件
find /var/lib/docker/containers -name "*.log" -size +100M -delete
```

## 安全配置

### 1. 防火墙配置
```bash
# 配置UFW防火墙
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2. SSH安全加固
```bash
# 修改SSH端口
sudo sed -i 's/#Port 22/Port 2222/g' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 禁用root登录
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
```

### 3. 定期安全更新
```bash
# 设置自动安全更新
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

## 升级流程

### 1. 后端服务升级
```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose -f deployment/docker-compose.prod.yml build backend

# 重启服务
docker-compose -f deployment/docker-compose.prod.yml up -d --force-recreate backend
```

### 2. 管理后台升级
```bash
# 构建新的管理后台
cd admin
npm run build

# 重启nginx容器
docker-compose -f deployment/docker-compose.prod.yml restart admin-nginx
```

### 3. 数据库迁移
```bash
# 执行数据库迁移
docker-compose -f deployment/docker-compose.prod.yml exec backend npm run migration:run
```

## 故障恢复

### 1. 数据库故障恢复
```bash
# 停止服务
docker-compose -f deployment/docker-compose.prod.yml stop backend

# 恢复数据库
docker-compose -f deployment/docker-compose.prod.yml exec mysql mysql -u wechat_prod_user -p wechat_online_shop_prod < backup_file.sql

# 重启服务
docker-compose -f deployment/docker-compose.prod.yml start backend
```

### 2. 完全恢复流程
```bash
# 1. 备份当前数据
# 2. 停止所有服务
docker-compose -f deployment/docker-compose.prod.yml down

# 3. 恢复数据文件
cp -r /backup/mysql_data/* /var/lib/docker/volumes/wechat-online-shop_mysql_data_prod/_data/

# 4. 重新启动服务
docker-compose -f deployment/docker-compose.prod.yml up -d
```

## 联系方式和支持

- **技术支持**: tech-support@yourdomain.com
- **紧急联络**: emergency@yourdomain.com
- **监控告警**: 配置告警到团队通信工具 (Slack/钉钉/企业微信)

---

**最后更新**: 2024年4月

**重要提示**: 生产环境部署前请务必进行充分测试，建议先在测试环境验证所有配置。