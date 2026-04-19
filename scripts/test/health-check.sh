#!/bin/bash

# 健康检查脚本
# 检查所有服务的健康状态，验证API端点可用性

set -e

# 设置Docker连接使用Unix socket
export DOCKER_HOST=unix:///var/run/docker.sock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
LOG_DIR="${PROJECT_ROOT}/scripts/test/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/health-check_${TIMESTAMP}.log"
REPORT_FILE="${LOG_DIR}/health-report_${TIMESTAMP}.json"

echo "=========================================="
echo "微信在线商城健康检查"
echo "检查时间: $(date)"
echo "=========================================="

# 创建日志目录
mkdir -p "${LOG_DIR}"

# 清理旧日志
> "${LOG_FILE}"

# 记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 检查服务状态
check_service() {
    local service_name=$1
    local check_command=$2

    log "检查服务: ${service_name}"

    if eval "${check_command}" > /dev/null 2>&1; then
        log "  ✓ ${service_name} 健康"
        return 0
    else
        log "  ✗ ${service_name} 不健康"
        return 1
    fi
}

# 检查HTTP端点
check_http_endpoint() {
    local endpoint_name=$1
    local url=$2
    local expected_status=${3:-200}

    log "检查HTTP端点: ${endpoint_name} (${url})"

    local response_code
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "${url}" 2>/dev/null || echo "000")

    if [ "${response_code}" -eq "${expected_status}" ]; then
        log "  ✓ ${endpoint_name} 响应正常 (HTTP ${response_code})"
        return 0
    elif [ "${response_code}" -eq "000" ]; then
        log "  ✗ ${endpoint_name} 无法访问"
        return 1
    else
        log "  ⚠️ ${endpoint_name} 响应异常 (HTTP ${response_code}, 期望 ${expected_status})"
        return 2
    fi
}

# 检查端口监听
check_port() {
    local service_name=$1
    local host=$2
    local port=$3

    log "检查端口: ${service_name} (${host}:${port})"

    if nc -z -w 3 "${host}" "${port}" > /dev/null 2>&1; then
        log "  ✓ ${service_name} 端口 ${port} 可访问"
        return 0
    else
        log "  ✗ ${service_name} 端口 ${port} 不可访问"
        return 1
    fi
}

# 检查磁盘空间
check_disk_space() {
    local path=$1
    local threshold=${2:-10} # 默认10%阈值

    log "检查磁盘空间: ${path}"

    local available_percent
    available_percent=$(df "${path}" | awk 'NR==2 {print $5}' | sed 's/%//')

    if [ -z "${available_percent}" ]; then
        log "  ⚠️ 无法获取磁盘空间信息"
        return 2
    fi

    local used_percent=$((100 - available_percent))

    if [ "${used_percent}" -lt "${threshold}" ]; then
        log "  ✓ 磁盘空间充足 (已用: ${used_percent}%)"
        return 0
    else
        log "  ⚠️ 磁盘空间紧张 (已用: ${used_percent}%, 阈值: ${threshold}%)"
        return 1
    fi
}

# 检查内存使用
check_memory() {
    local threshold=${1:-90} # 默认90%阈值

    log "检查内存使用"

    local memory_info
    memory_info=$(free -m | awk 'NR==2 {print $3,$2}')

    local used_mb
    local total_mb
    used_mb=$(echo "${memory_info}" | awk '{print $1}')
    total_mb=$(echo "${memory_info}" | awk '{print $2}')

    if [ -z "${used_mb}" ] || [ -z "${total_mb}" ]; then
        log "  ⚠️ 无法获取内存信息"
        return 2
    fi

    local used_percent=$((used_mb * 100 / total_mb))

    if [ "${used_percent}" -lt "${threshold}" ]; then
        log "  ✓ 内存使用正常 (已用: ${used_percent}%)"
        return 0
    else
        log "  ⚠️ 内存使用过高 (已用: ${used_percent}%, 阈值: ${threshold}%)"
        return 1
    fi
}

# 主检查函数
main() {
    local overall_health="healthy"
    local health_report="{}"

    log "开始健康检查"

    # 检查Docker服务
    log "=== 检查Docker服务 ==="
    if ! check_service "Docker Daemon" "docker info > /dev/null 2>&1"; then
        overall_health="unhealthy"
    fi

    # 检查Docker Compose
    if ! check_service "Docker Compose" "docker-compose version > /dev/null 2>&1"; then
        overall_health="unhealthy"
    fi

    # 检查测试环境容器
    log "=== 检查测试环境容器 ==="
    if ! check_service "MySQL测试容器" "docker ps --filter 'name=wechat-shop-mysql-test' --format '{{.Status}}' | grep -q 'Up'"; then
        overall_health="unhealthy"
    fi

    if ! check_service "Redis测试容器" "docker ps --filter 'name=wechat-shop-redis-test' --format '{{.Status}}' | grep -q 'Up'"; then
        overall_health="unhealthy"
    fi

    if ! check_service "后端测试容器" "docker ps --filter 'name=wechat-shop-backend-test' --format '{{.Status}}' | grep -q 'Up'"; then
        overall_health="unhealthy"
    fi

    # 检查端口
    log "=== 检查网络端口 ==="
    if ! check_port "MySQL测试" "localhost" "3307"; then
        overall_health="unhealthy"
    fi

    if ! check_port "Redis测试" "localhost" "6380"; then
        overall_health="unhealthy"
    fi

    if ! check_port "后端API测试" "localhost" "3001"; then
        overall_health="unhealthy"
    fi

    # 检查API端点
    log "=== 检查API端点 ==="
    BASE_URL="http://localhost:3001"

    # 健康检查端点
    check_http_endpoint "健康检查" "${BASE_URL}/api/health" 200
    health_check_result=$?

    check_http_endpoint "简单健康检查" "${BASE_URL}/api/health/simple" 200
    simple_health_result=$?

    check_http_endpoint "版本信息" "${BASE_URL}/api/health/version" 200
    version_result=$?

    # 业务API端点（不验证响应内容，只检查可访问性）
    check_http_endpoint "API文档" "${BASE_URL}/api/docs" 200
    docs_result=$?

    check_http_endpoint "商品API" "${BASE_URL}/api/products" 200
    products_result=$?

    check_http_endpoint "分类API" "${BASE_URL}/api/categories" 200
    categories_result=$?

    # 检查系统资源
    log "=== 检查系统资源 ==="
    check_disk_space "/" 90
    disk_result=$?

    check_memory 95
    memory_result=$?

    # 生成健康报告
    health_report=$(cat << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "overall_health": "${overall_health}",
  "services": {
    "docker": "$([ $? -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "mysql_test": "$([ $? -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "redis_test": "$([ $? -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "backend_test": "$([ $? -eq 0 ] && echo "healthy" || echo "unhealthy")"
  },
  "ports": {
    "mysql": "$([ $? -eq 0 ] && echo "open" || echo "closed")",
    "redis": "$([ $? -eq 0 ] && echo "open" || echo "closed")",
    "backend": "$([ $? -eq 0 ] && echo "open" || echo "closed")"
  },
  "api_endpoints": {
    "health_check": "$([ ${health_check_result} -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "simple_health": "$([ ${simple_health_result} -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "version": "$([ ${version_result} -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "api_docs": "$([ ${docs_result} -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "products": "$([ ${products_result} -eq 0 ] && echo "healthy" || echo "unhealthy")",
    "categories": "$([ ${categories_result} -eq 0 ] && echo "healthy" || echo "unhealthy")"
  },
  "system_resources": {
    "disk": "$([ ${disk_result} -eq 0 ] && echo "healthy" || [ ${disk_result} -eq 1 ] && echo "warning" || echo "unknown")",
    "memory": "$([ ${memory_result} -eq 0 ] && echo "healthy" || [ ${memory_result} -eq 1 ] && echo "warning" || echo "unknown")"
  }
}
EOF
)

    # 保存报告
    echo "${health_report}" | jq . > "${REPORT_FILE}"

    log ""
    log "=== 健康检查完成 ==="
    log "总体状态: ${overall_health}"
    log "详细报告: ${REPORT_FILE}"
    log "检查日志: ${LOG_FILE}"

    # 显示摘要
    echo ""
    echo "健康检查摘要:"
    echo "总体状态: ${overall_health}"
    echo "服务检查: $(echo "${health_report}" | jq -r '.services | to_entries | map("\(.key): \(.value)") | join(", ")')"
    echo "API端点: $(echo "${health_report}" | jq -r '.api_endpoints | to_entries | map("\(.key): \(.value)") | join(", ")')"
    echo "系统资源: $(echo "${health_report}" | jq -r '.system_resources | to_entries | map("\(.key): \(.value)") | join(", ")')"

    # 如果总体不健康，返回非零退出码
    if [ "${overall_health}" = "unhealthy" ]; then
        return 1
    fi

    return 0
}

# 运行主检查
main

exit $?