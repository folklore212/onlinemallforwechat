#!/bin/bash

# 微信在线商城自动化测试主脚本
# 运行完整的测试套件：单元测试、集成测试、端到端测试

set -e

# 设置Docker连接使用Unix socket
export DOCKER_HOST=unix:///var/run/docker.sock

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BACKEND_DIR="${PROJECT_ROOT}/backend"
DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"
LOG_DIR="${PROJECT_ROOT}/scripts/test/logs"
REPORT_DIR="${PROJECT_ROOT}/scripts/test/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/run-tests_${TIMESTAMP}.log"
TEST_RESULTS_FILE="${REPORT_DIR}/test-results_${TIMESTAMP}.json"

echo "=========================================="
echo "微信在线商城自动化测试套件"
echo "开始时间: $(date)"
echo "项目根目录: ${PROJECT_ROOT}"
echo "=========================================="

# 创建日志和报告目录
mkdir -p "${LOG_DIR}" "${REPORT_DIR}"

# 清理旧日志
> "${LOG_FILE}"

# 记录开始时间
START_TIME=$(date +%s)

# 函数：记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# 函数：检查命令执行结果
check_result() {
    local exit_code=$1
    local step_name=$2

    if [ $exit_code -eq 0 ]; then
        log "✓ ${step_name} 成功"
        return 0
    else
        log "✗ ${step_name} 失败 (退出码: $exit_code)"
        return 1
    fi
}

# 函数：显示测试结果摘要
show_summary() {
    local end_time=$(date +%s)
    local duration=$((end_time - START_TIME))

    echo ""
    echo "=========================================="
    echo "测试完成摘要"
    echo "=========================================="
    echo "开始时间: $(date -d @${START_TIME} '+%Y-%m-%d %H:%M:%S')"
    echo "结束时间: $(date -d @${end_time} '+%Y-%m-%d %H:%M:%S')"
    echo "总耗时: ${duration} 秒"
    echo ""

    if [ -f "${TEST_RESULTS_FILE}" ]; then
        echo "测试结果文件: ${TEST_RESULTS_FILE}"
        echo ""

        # 解析测试结果
        local total_tests=$(jq '.numTotalTests' "${TEST_RESULTS_FILE}" 2>/dev/null || echo "0")
        local passed_tests=$(jq '.numPassedTests' "${TEST_RESULTS_FILE}" 2>/dev/null || echo "0")
        local failed_tests=$(jq '.numFailedTests' "${TEST_RESULTS_FILE}" 2>/dev/null || echo "0")

        echo "测试统计:"
        echo "  总测试数: ${total_tests}"
        echo "  通过数: ${passed_tests}"
        echo "  失败数: ${failed_tests}"

        if [ "${failed_tests}" -gt 0 ]; then
            echo ""
            echo "失败的测试:"
            jq -r '.testResults[] | select(.status == "failed") | .name' "${TEST_RESULTS_FILE}" 2>/dev/null || echo "无法解析失败测试"
        fi
    fi

    echo ""
    echo "详细日志: ${LOG_FILE}"
    echo "报告目录: ${REPORT_DIR}"
    echo "=========================================="
}

# 设置信号处理
trap 'log "测试被中断"; show_summary; exit 1' INT TERM

log "开始自动化测试流程"

# 步骤1: 设置测试环境
log "步骤1: 设置测试环境"
"${SCRIPT_DIR}/test/setup-test-env.sh"
check_result $? "设置测试环境"

# 步骤2: 运行单元测试
log "步骤2: 运行单元测试"
cd "${BACKEND_DIR}"
npm test -- --testPathPattern=".*\.spec\.ts" --passWithNoTests --json --outputFile="${REPORT_DIR}/unit-tests_${TIMESTAMP}.json" 2>&1 | tee -a "${LOG_FILE}"
check_result ${PIPESTATUS[0]} "单元测试"

# 步骤3: 运行集成测试
log "步骤3: 运行集成测试"
cd "${BACKEND_DIR}"
npm test -- --testPathPattern=".*\.integration\.spec\.ts" --passWithNoTests --json --outputFile="${REPORT_DIR}/integration-tests_${TIMESTAMP}.json" 2>&1 | tee -a "${LOG_FILE}"
check_result ${PIPESTATUS[0]} "集成测试"

# 步骤4: 运行端到端测试
log "步骤4: 运行端到端测试"
cd "${BACKEND_DIR}"
npm test -- --testPathPattern=".*\.e2e\.spec\.ts" --passWithNoTests --json --outputFile="${REPORT_DIR}/e2e-tests_${TIMESTAMP}.json" 2>&1 | tee -a "${LOG_FILE}"
check_result ${PIPESTATUS[0]} "端到端测试"

# 步骤5: 生成测试覆盖率报告
log "步骤5: 生成测试覆盖率报告"
cd "${BACKEND_DIR}"
npm run test:cov 2>&1 | tee -a "${LOG_FILE}"
check_result ${PIPESTATUS[0]} "生成测试覆盖率报告"

# 步骤6: 运行健康检查
log "步骤6: 运行健康检查"
HEALTH_CHECK_URL="http://localhost:3001/api/health"
for i in {1..10}; do
    if curl -s -f "${HEALTH_CHECK_URL}" > /dev/null 2>&1; then
        log "✓ 健康检查通过"

        # 获取详细的健康信息
        curl -s "${HEALTH_CHECK_URL}" | jq . > "${REPORT_DIR}/health-check_${TIMESTAMP}.json" 2>/dev/null || true
        break
    fi

    if [ $i -eq 10 ]; then
        log "✗ 健康检查失败"
        exit 1
    fi

    sleep 2
done

# 步骤7: 验证API端点
log "步骤7: 验证API端点"
API_ENDPOINTS=(
    "/api/health/simple"
    "/api/health/version"
    "/api/auth/profile"
    "/api/users"
    "/api/products"
    "/api/categories"
    "/api/cart"
    "/api/orders"
)

VALIDATION_RESULTS="${REPORT_DIR}/api-validation_${TIMESTAMP}.txt"
> "${VALIDATION_RESULTS}"

for endpoint in "${API_ENDPOINTS[@]}"; do
    url="http://localhost:3001${endpoint}"

    # 尝试访问端点（不验证响应内容）
    if curl -s -f -I "${url}" > /dev/null 2>&1; then
        echo "✓ ${endpoint} 可达" | tee -a "${VALIDATION_RESULTS}"
    else
        echo "✗ ${endpoint} 不可达" | tee -a "${VALIDATION_RESULTS}"
    fi
done

log "API端点验证完成，结果保存在: ${VALIDATION_RESULTS}"

# 步骤8: 合并测试结果
log "步骤8: 合并测试结果"
cat "${REPORT_DIR}/unit-tests_${TIMESTAMP}.json" \
    "${REPORT_DIR}/integration-tests_${TIMESTAMP}.json" \
    "${REPORT_DIR}/e2e-tests_${TIMESTAMP}.json" 2>/dev/null | \
    jq -s '.[0] * .[1] * .[2]' > "${TEST_RESULTS_FILE}" 2>/dev/null || true

# 步骤9: 清理测试环境
log "步骤9: 清理测试环境"
"${SCRIPT_DIR}/test/cleanup-test-env.sh"
check_result $? "清理测试环境"

# 显示最终摘要
show_summary

# 检查是否有测试失败
if [ -f "${TEST_RESULTS_FILE}" ]; then
    FAILED_TESTS=$(jq '.numFailedTests' "${TEST_RESULTS_FILE}" 2>/dev/null || echo "0")
    if [ "${FAILED_TESTS}" -gt 0 ]; then
        log "警告: 有 ${FAILED_TESTS} 个测试失败"
        exit 1
    fi
fi

log "所有测试通过!"
exit 0