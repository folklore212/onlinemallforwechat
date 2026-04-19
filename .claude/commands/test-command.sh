#!/bin/bash

# 微信在线商城测试命令处理器
# 处理 /test 命令及其子命令

set -e

# 设置Docker连接使用Unix socket
export DOCKER_HOST=unix:///var/run/docker.sock

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPTS_DIR="${PROJECT_ROOT}/scripts"
TEST_SCRIPTS_DIR="${SCRIPTS_DIR}/test"
BACKEND_DIR="${PROJECT_ROOT}/backend"
DEPLOYMENT_DIR="${PROJECT_ROOT}/deployment"

# 显示帮助信息
show_help() {
    echo "微信在线商城测试命令"
    echo ""
    echo "可用命令:"
    echo "  help                  显示此帮助信息"
    echo "  run                   运行完整测试套件"
    echo "  unit                  仅运行单元测试"
    echo "  integration           仅运行集成测试"
    echo "  e2e                   仅运行端到端测试"
    echo "  health                运行健康检查"
    echo "  setup                 设置测试环境"
    echo "  cleanup               清理测试环境"
    echo "  coverage              生成测试覆盖率报告"
    echo "  api                   验证API端点"
    echo "  docker                验证Docker配置"
    echo "  images                检查图片资源"
    echo "  quick                 快速测试"
    echo ""
    echo "使用示例:"
    echo "  /test run             运行完整测试"
    echo "  /test health          检查服务健康状态"
    echo "  /test setup           启动测试环境"
    echo ""
    echo "更多信息请查看: .claude/commands/test.md"
}

# 运行完整测试套件
run_full_tests() {
    echo "运行完整测试套件..."
    echo "================================"

    # 设置测试环境
    echo "步骤1: 设置测试环境"
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"

    # 运行单元测试
    echo "步骤2: 运行单元测试"
    cd "${BACKEND_DIR}"
    npm test -- --testPathPattern=".*\.spec\.ts" --passWithNoTests

    # 运行集成测试
    echo "步骤3: 运行集成测试"
    cd "${BACKEND_DIR}"
    npm test -- --testPathPattern=".*\.integration\.spec\.ts" --passWithNoTests

    # 运行端到端测试
    echo "步骤4: 运行端到端测试"
    cd "${BACKEND_DIR}"
    npm test -- --testPathPattern=".*\.e2e\.spec\.ts" --passWithNoTests

    # 生成覆盖率报告
    echo "步骤5: 生成测试覆盖率报告"
    cd "${BACKEND_DIR}"
    npm run test:cov

    # 运行健康检查
    echo "步骤6: 运行健康检查"
    "${TEST_SCRIPTS_DIR}/health-check.sh"

    # 清理测试环境
    echo "步骤7: 清理测试环境"
    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"

    echo "================================"
    echo "测试完成!"
}

# 运行单元测试
run_unit_tests() {
    echo "运行单元测试..."
    cd "${BACKEND_DIR}"
    npm test -- --testPathPattern=".*\.spec\.ts" --passWithNoTests
}

# 运行集成测试
run_integration_tests() {
    echo "运行集成测试..."
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"
    cd "${BACKEND_DIR}"
    npm test -- --testPathPattern=".*\.integration\.spec\.ts" --passWithNoTests
    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"
}

# 运行端到端测试
run_e2e_tests() {
    echo "运行端到端测试..."
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"
    cd "${BACKEND_DIR}"
    npm test -- --testPathPattern=".*\.e2e\.spec\.ts" --passWithNoTests
    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"
}

# 运行健康检查
run_health_check() {
    echo "运行健康检查..."
    "${TEST_SCRIPTS_DIR}/health-check.sh"
}

# 设置测试环境
setup_test_env() {
    echo "设置测试环境..."
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"
}

# 清理测试环境
cleanup_test_env() {
    echo "清理测试环境..."
    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"
}

# 生成覆盖率报告
run_coverage() {
    echo "生成测试覆盖率报告..."
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"
    cd "${BACKEND_DIR}"
    npm run test:cov
    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"
}

# 验证API端点
run_api_check() {
    echo "验证API端点..."
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"

    echo "测试API端点可访问性..."
    BASE_URL="http://localhost:3001"
    ENDPOINTS=(
        "/api/health"
        "/api/health/simple"
        "/api/health/version"
        "/api/products"
        "/api/categories"
        "/api/cart"
        "/api/orders"
        "/api/docs"
    )

    for endpoint in "${ENDPOINTS[@]}"; do
        url="${BASE_URL}${endpoint}"
        if curl -s -f -I "${url}" > /dev/null 2>&1; then
            echo "  ✓ ${endpoint}"
        else
            echo "  ✗ ${endpoint}"
        fi
    done

    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"
}

# 验证Docker配置
run_docker_check() {
    echo "验证Docker配置..."

    # 检查Docker
    if command -v docker &> /dev/null; then
        echo "  ✓ Docker已安装"
    else
        echo "  ✗ Docker未安装"
        return 1
    fi

    # 检查Docker Compose
    if command -v docker-compose &> /dev/null; then
        echo "  ✓ Docker Compose已安装"
    else
        echo "  ✗ Docker Compose未安装"
        return 1
    fi

    # 检查测试配置文件
    if [ -f "${DEPLOYMENT_DIR}/docker-compose.test.yml" ]; then
        echo "  ✓ 测试Docker配置存在"
    else
        echo "  ✗ 测试Docker配置不存在"
        return 1
    fi

    # 检查后端Dockerfile
    if [ -f "${BACKEND_DIR}/Dockerfile.test" ]; then
        echo "  ✓ 测试Dockerfile存在"
    else
        echo "  ✗ 测试Dockerfile不存在"
        return 1
    fi

    echo "Docker配置验证通过"
}

# 检查图片资源
run_images_check() {
    echo "检查图片资源..."

    UPLOADS_DIR="${PROJECT_ROOT}/public/uploads"

    if [ -d "${UPLOADS_DIR}" ]; then
        echo "  ✓ 图片上传目录存在"

        # 统计图片数量
        total_images=$(find "${UPLOADS_DIR}" -type f \( -name "*.jpg" -o -name "*.png" -o -name "*.gif" \) | wc -l)
        echo "  ✓ 找到 ${total_images} 个图片文件"

        # 检查关键目录
        for dir in "products/large" "products/medium" "products/small" "products/thumb" "categories" "users" "banners"; do
            if [ -d "${UPLOADS_DIR}/${dir}" ]; then
                count=$(find "${UPLOADS_DIR}/${dir}" -type f \( -name "*.jpg" -o -name "*.png" \) | wc -l)
                echo "  ✓ ${dir}: ${count} 个文件"
            else
                echo "  ✗ ${dir}: 目录不存在"
            fi
        done
    else
        echo "  ✗ 图片上传目录不存在"
        echo "  运行下载脚本: scripts/download-images.sh"
    fi

    echo "图片资源检查完成"
}

# 快速测试
run_quick_test() {
    echo "运行快速测试..."

    # 只运行关键的健康检查
    run_docker_check
    run_health_check

    # 快速API检查
    echo "快速API检查..."
    "${TEST_SCRIPTS_DIR}/setup-test-env.sh"

    BASE_URL="http://localhost:3001"
    CRITICAL_ENDPOINTS=(
        "/api/health"
        "/api/products"
        "/api/categories"
    )

    for endpoint in "${CRITICAL_ENDPOINTS[@]}"; do
        url="${BASE_URL}${endpoint}"
        if curl -s -f "${url}" > /dev/null 2>&1; then
            echo "  ✓ ${endpoint}"
        else
            echo "  ✗ ${endpoint}"
        fi
    done

    "${TEST_SCRIPTS_DIR}/cleanup-test-env.sh"

    echo "快速测试完成"
}

# 主函数
main() {
    local command="${1:-help}"

    case "${command}" in
        help|--help|-h)
            show_help
            ;;
        run)
            run_full_tests
            ;;
        unit)
            run_unit_tests
            ;;
        integration)
            run_integration_tests
            ;;
        e2e)
            run_e2e_tests
            ;;
        health)
            run_health_check
            ;;
        setup)
            setup_test_env
            ;;
        cleanup)
            cleanup_test_env
            ;;
        coverage)
            run_coverage
            ;;
        api)
            run_api_check
            ;;
        docker)
            run_docker_check
            ;;
        images)
            run_images_check
            ;;
        quick)
            run_quick_test
            ;;
        *)
            echo "未知命令: ${command}"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"