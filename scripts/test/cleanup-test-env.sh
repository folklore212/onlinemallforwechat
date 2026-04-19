#!/bin/bash

# 清理测试环境脚本
# 停止测试Docker Compose环境，清理测试数据卷

set -e

# 设置Docker连接使用Unix socket
export DOCKER_HOST=unix:///var/run/docker.sock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
LOG_FILE="${PROJECT_ROOT}/scripts/test/cleanup-test-env.log"

echo "=========================================="
echo "清理微信在线商城测试环境"
echo "时间: $(date)"
echo "项目根目录: ${PROJECT_ROOT}"
echo "==========================================" | tee -a "${LOG_FILE}"

# 清理旧日志
> "${LOG_FILE}"

# 检查是否在测试环境中运行
if [ ! -f "${DEPLOYMENT_DIR}/docker-compose.test.yml" ]; then
    echo "错误: 未找到测试环境配置 docker-compose.test.yml" | tee -a "${LOG_FILE}"
    exit 1
fi

# 停止测试环境
echo "停止测试环境..." | tee -a "${LOG_FILE}"
cd "${DEPLOYMENT_DIR}"

# 停止容器
docker-compose -f docker-compose.test.yml down 2>&1 | tee -a "${LOG_FILE}"

# 清理数据卷
echo "清理测试数据卷..." | tee -a "${LOG_FILE}"
docker volume rm -f wechat-shop_mysql_test_data 2>/dev/null || true
docker volume rm -f wechat-shop_redis_test_data 2>/dev/null || true
docker volume rm -f wechat-shop_uploads_test 2>/dev/null || true
docker volume rm -f wechat-shop_logs_test 2>/dev/null || true

# 清理网络
echo "清理测试网络..." | tee -a "${LOG_FILE}"
docker network rm wechat-shop_wechat-test-network 2>/dev/null || true

# 清理临时文件
echo "清理临时文件..." | tee -a "${LOG_FILE}"
rm -rf "${PROJECT_ROOT}/backend/uploads-test" 2>/dev/null || true
rm -rf "${PROJECT_ROOT}/backend/logs" 2>/dev/null || true
rm -rf "${PROJECT_ROOT}/backend/coverage" 2>/dev/null || true
rm -rf "${PROJECT_ROOT}/backend/.nyc_output" 2>/dev/null || true

# 清理Docker镜像
echo "清理测试Docker镜像..." | tee -a "${LOG_FILE}"
docker rmi -f wechat-shop-backend-test 2>/dev/null || true
docker rmi -f $(docker images -f "dangling=true" -q) 2>/dev/null || true

# 验证清理
echo "验证清理结果..." | tee -a "${LOG_FILE}"

# 检查容器是否已停止
if docker ps -a --format "{{.Names}}" | grep -q "wechat-shop-.*-test"; then
    echo "警告: 仍有测试容器存在:" | tee -a "${LOG_FILE}"
    docker ps -a --format "{{.Names}}" | grep "wechat-shop-.*-test" | tee -a "${LOG_FILE}"
else
    echo "✓ 所有测试容器已清理" | tee -a "${LOG_FILE}"
fi

# 检查数据卷是否已清理
if docker volume ls --format "{{.Name}}" | grep -q "wechat-shop_.*_test"; then
    echo "警告: 仍有测试数据卷存在:" | tee -a "${LOG_FILE}"
    docker volume ls --format "{{.Name}}" | grep "wechat-shop_.*_test" | tee -a "${LOG_FILE}"
else
    echo "✓ 所有测试数据卷已清理" | tee -a "${LOG_FILE}"
fi

# 检查网络是否已清理
if docker network ls --format "{{.Name}}" | grep -q "wechat-shop.*test"; then
    echo "警告: 仍有测试网络存在:" | tee -a "${LOG_FILE}"
    docker network ls --format "{{.Name}}" | grep "wechat-shop.*test" | tee -a "${LOG_FILE}"
else
    echo "✓ 所有测试网络已清理" | tee -a "${LOG_FILE}"
fi

echo "==========================================" | tee -a "${LOG_FILE}"
echo "测试环境清理完成!" | tee -a "${LOG_FILE}"
echo "清理日志: ${LOG_FILE}" | tee -a "${LOG_FILE}"
echo "==========================================" | tee -a "${LOG_FILE}"

# 显示剩余资源（供参考）
echo "剩余Docker资源统计:" | tee -a "${LOG_FILE}"
echo "容器总数: $(docker ps -aq | wc -l)" | tee -a "${LOG_FILE}"
echo "镜像总数: $(docker images -q | wc -l)" | tee -a "${LOG_FILE}"
echo "数据卷总数: $(docker volume ls -q | wc -l)" | tee -a "${LOG_FILE}"
echo "网络总数: $(docker network ls -q | wc -l)" | tee -a "${LOG_FILE}"