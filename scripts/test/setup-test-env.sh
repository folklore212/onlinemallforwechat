#!/bin/bash

# 设置测试环境脚本
# 启动测试Docker Compose环境，运行数据库迁移，加载测试数据

set -e

# 设置Docker连接使用Unix socket
export DOCKER_HOST=unix:///var/run/docker.sock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
LOG_FILE="${PROJECT_ROOT}/scripts/test/setup-test-env.log"

echo "=========================================="
echo "设置微信在线商城测试环境"
echo "时间: $(date)"
echo "项目根目录: ${PROJECT_ROOT}"
echo "==========================================" | tee -a "${LOG_FILE}"

# 清理旧日志
> "${LOG_FILE}"

# 检查Docker和Docker Compose
echo "检查Docker和Docker Compose..." | tee -a "${LOG_FILE}"
if ! command -v docker &> /dev/null; then
    echo "错误: Docker未安装" | tee -a "${LOG_FILE}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "错误: Docker Compose未安装" | tee -a "${LOG_FILE}"
    exit 1
fi

echo "✓ Docker和Docker Compose已安装" | tee -a "${LOG_FILE}"

# 停止并清理可能存在的旧测试环境
echo "清理旧测试环境..." | tee -a "${LOG_FILE}"
cd "${DEPLOYMENT_DIR}"
docker-compose -f docker-compose.test.yml down -v --remove-orphans 2>/dev/null || true

# 构建测试镜像
echo "构建测试镜像..." | tee -a "${LOG_FILE}"
cd "${BACKEND_DIR}"
docker build -f Dockerfile.test -t wechat-shop-backend-test . | tee -a "${LOG_FILE}"

# 启动测试环境
echo "启动测试环境..." | tee -a "${LOG_FILE}"
cd "${DEPLOYMENT_DIR}"
docker-compose -f docker-compose.test.yml up -d | tee -a "${LOG_FILE}"

# 等待服务启动
echo "等待服务启动..." | tee -a "${LOG_FILE}"
for i in {1..30}; do
    if docker-compose -f docker-compose.test.yml ps | grep -q "Up"; then
        echo "服务已启动" | tee -a "${LOG_FILE}"
        break
    fi
    echo "等待服务启动... ($i/30)" | tee -a "${LOG_FILE}"
    sleep 2
done

# 检查服务健康状态
echo "检查服务健康状态..." | tee -a "${LOG_FILE}"
MYSQL_HEALTHY=false
REDIS_HEALTHY=false
BACKEND_HEALTHY=false

for i in {1..20}; do
    # 检查MySQL
    if docker-compose -f docker-compose.test.yml exec -T mysql-test mysqladmin ping -h localhost -u test_user -ptest_password 2>/dev/null | grep -q "mysqld is alive"; then
        MYSQL_HEALTHY=true
        echo "✓ MySQL健康检查通过" | tee -a "${LOG_FILE}"
    fi

    # 检查Redis
    if docker-compose -f docker-compose.test.yml exec -T redis-test redis-cli -a test_redis_password ping 2>/dev/null | grep -q "PONG"; then
        REDIS_HEALTHY=true
        echo "✓ Redis健康检查通过" | tee -a "${LOG_FILE}"
    fi

    # 检查后端
    if curl -s -f http://localhost:3001/api/health/simple > /dev/null 2>&1; then
        BACKEND_HEALTHY=true
        echo "✓ 后端服务健康检查通过" | tee -a "${LOG_FILE}"
    fi

    if [ "$MYSQL_HEALTHY" = true ] && [ "$REDIS_HEALTHY" = true ] && [ "$BACKEND_HEALTHY" = true ]; then
        echo "所有服务健康检查通过!" | tee -a "${LOG_FILE}"
        break
    fi

    echo "等待所有服务就绪... ($i/20)" | tee -a "${LOG_FILE}"
    sleep 3
done

if [ "$MYSQL_HEALTHY" != true ] || [ "$REDIS_HEALTHY" != true ] || [ "$BACKEND_HEALTHY" != true ]; then
    echo "错误: 服务健康检查失败" | tee -a "${LOG_FILE}"
    echo "MySQL健康: $MYSQL_HEALTHY" | tee -a "${LOG_FILE}"
    echo "Redis健康: $REDIS_HEALTHY" | tee -a "${LOG_FILE}"
    echo "后端健康: $BACKEND_HEALTHY" | tee -a "${LOG_FILE}"

    # 显示容器日志
    echo "容器日志:" | tee -a "${LOG_FILE}"
    docker-compose -f docker-compose.test.yml logs --tail=50 | tee -a "${LOG_FILE}"

    exit 1
fi

# 运行数据库迁移
echo "运行数据库迁移..." | tee -a "${LOG_FILE}"
cd "${BACKEND_DIR}"
docker-compose -f "${DEPLOYMENT_DIR}/docker-compose.test.yml" exec -T backend-test npm run migration:run 2>&1 | tee -a "${LOG_FILE}"

# 加载测试数据种子
echo "加载测试数据种子..." | tee -a "${LOG_FILE}"
if [ -f "${BACKEND_DIR}/src/test/seeds/run-seeds.ts" ]; then
    docker-compose -f "${DEPLOYMENT_DIR}/docker-compose.test.yml" exec -T backend-test npm run seed:run 2>&1 | tee -a "${LOG_FILE}"
else
    echo "未找到测试数据种子文件，跳过" | tee -a "${LOG_FILE}"
fi

# 验证API端点
echo "验证API端点..." | tee -a "${LOG_FILE}"
API_CHECK_URLS=(
    "http://localhost:3001/api/health"
    "http://localhost:3001/api/health/simple"
    "http://localhost:3001/api/health/version"
    "http://localhost:3001/api/docs"
)

for url in "${API_CHECK_URLS[@]}"; do
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "✓ API端点可达: $url" | tee -a "${LOG_FILE}"
    else
        echo "⚠️ API端点不可达: $url" | tee -a "${LOG_FILE}"
    fi
done

echo "==========================================" | tee -a "${LOG_FILE}"
echo "测试环境设置完成!" | tee -a "${LOG_FILE}"
echo "服务状态:" | tee -a "${LOG_FILE}"
docker-compose -f docker-compose.test.yml ps | tee -a "${LOG_FILE}"
echo "==========================================" | tee -a "${LOG_FILE}"

# 显示访问信息
echo "访问信息:" | tee -a "${LOG_FILE}"
echo "后端API: http://localhost:3001" | tee -a "${LOG_FILE}"
echo "健康检查: http://localhost:3001/api/health" | tee -a "${LOG_FILE}"
echo "API文档: http://localhost:3001/api/docs" | tee -a "${LOG_FILE}"
echo "MySQL: localhost:3307 (用户: test_user, 密码: test_password)" | tee -a "${LOG_FILE}"
echo "Redis: localhost:6380 (密码: test_redis_password)" | tee -a "${LOG_FILE}"
echo "==========================================" | tee -a "${LOG_FILE}"

# 保存环境信息
cat > "${PROJECT_ROOT}/scripts/test/env-info.txt" << EOF
测试环境信息
============
设置时间: $(date)
项目目录: ${PROJECT_ROOT}

服务状态:
$(docker-compose -f docker-compose.test.yml ps)

访问信息:
- 后端API: http://localhost:3001
- 健康检查: http://localhost:3001/api/health
- API文档: http://localhost:3001/api/docs
- MySQL: localhost:3307 (用户: test_user, 密码: test_password)
- Redis: localhost:6380 (密码: test_redis_password)

环境变量:
- NODE_ENV: test
- DB_HOST: mysql-test
- DB_PORT: 3306
- DB_USERNAME: test_user
- DB_PASSWORD: test_password
- DB_DATABASE: wechat_shop_test
- REDIS_HOST: redis-test
- REDIS_PORT: 6379
- REDIS_PASSWORD: test_redis_password
EOF

echo "环境信息已保存到: ${PROJECT_ROOT}/scripts/test/env-info.txt" | tee -a "${LOG_FILE}"
echo "设置日志: ${LOG_FILE}" | tee -a "${LOG_FILE}"