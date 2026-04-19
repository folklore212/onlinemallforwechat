# /test - 微信在线商城测试命令

Claude Code自定义命令，用于运行微信在线商城项目的各种测试。当你在Claude Code中输入 `/test` 命令时，可以使用以下子命令。

## 快速开始

```bash
# 运行完整测试套件
/test run

# 仅运行健康检查
/test health

# 设置测试环境
/test setup

# 清理测试环境
/test cleanup
```

## 命令执行

以下命令可以直接在Claude Code中执行：

### 基础命令

```bash
# 显示帮助信息
/test help

# 运行完整的测试套件
/test run

# 仅运行单元测试  
/test unit

# 仅运行集成测试
/test integration

# 仅运行端到端测试
/test e2e

# 运行健康检查
/test health

# 设置测试环境
/test setup

# 清理测试环境
/test cleanup

# 生成测试覆盖率报告
/test coverage
```

### 高级命令

```bash
# 验证所有API端点
/test api

# 验证Docker配置
/test docker

# 检查图片资源
/test images

# 快速测试
/test quick
```

## 命令实现

所有测试命令通过 `.claude/commands/test-command.sh` 脚本实现。当你在Claude Code中输入测试命令时，Claude会执行相应的脚本。

### 直接执行脚本

你也可以直接运行测试脚本：

```bash
# 运行完整测试套件
./scripts/test/run-tests.sh

# 设置测试环境
./scripts/test/setup-test-env.sh

# 清理测试环境
./scripts/test/cleanup-test-env.sh

# 运行健康检查
./scripts/test/health-check.sh
```

### 手动执行测试

如果你需要更精细的控制，可以手动执行各个步骤：

```bash
# 1. 设置环境
cd /media/vdc/WorkSpace/Personal/WechatOnlineShop
./scripts/test/setup-test-env.sh

# 2. 运行特定类型的测试
cd backend
npm test -- --testPathPattern=".*\.spec\.ts"           # 单元测试
npm test -- --testPathPattern=".*\.integration\.spec\.ts"  # 集成测试
npm test -- --testPathPattern=".*\.e2e\.spec\.ts"     # 端到端测试

# 3. 生成覆盖率报告
npm run test:cov

# 4. 清理环境
cd ..
./scripts/test/cleanup-test-env.sh
```

## 环境配置

测试环境使用独立的配置，不会影响生产环境：

| 服务 | 版本 | 端口 | 说明 |
|------|------|------|------|
| MySQL数据库 | 8.0 | 3307 | 测试专用数据库 |
| Redis缓存 | 7-alpine | 6380 | 测试专用缓存 |
| 后端API | Node.js 18 | 3001 | 测试专用后端 |
| 环境变量 | - | - | 使用 `.env.test` 文件 |

## 文件结构

```
.claude/commands/
├── test.md                    # 此命令文档
└── test-command.sh           # 命令处理器脚本

scripts/test/
├── run-tests.sh              # 主测试脚本
├── setup-test-env.sh         # 环境设置脚本
├── cleanup-test-env.sh       # 环境清理脚本
├── health-check.sh           # 健康检查脚本
├── logs/                     # 日志文件目录
└── reports/                  # 测试报告目录

backend/
├── jest.config.js           # Jest测试配置
├── .env.test               # 测试环境变量
├── src/test/               # 测试代码目录
└── coverage/               # 覆盖率报告

deployment/
└── docker-compose.test.yml  # 测试Docker配置
```

## 测试报告

测试完成后，可以在以下位置查看结果：

1. **日志文件**: `scripts/test/logs/` - 详细的执行日志
2. **测试报告**: `scripts/test/reports/` - JSON格式的测试结果
3. **覆盖率报告**: `backend/coverage/` - HTML格式的代码覆盖率报告
4. **健康报告**: `scripts/test/logs/health-report_*.json` - 健康检查结果

## 错误处理

测试脚本包含详细的错误处理：

1. **逐步检查**: 每个步骤都有独立的错误检查
2. **详细日志**: 所有操作都记录到日志文件
3. **资源清理**: 即使测试失败，也会尝试清理环境
4. **错误报告**: 提供具体的错误信息和解决方案建议

## 故障排除

### 常见问题

#### 1. Docker未安装
```bash
# 检查Docker是否安装
docker --version
docker-compose --version

# 安装Docker (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install docker.io docker-compose
```

#### 2. 端口冲突
```bash
# 检查端口占用
sudo netstat -tulpn | grep -E ':(3307|6380|3001)'

# 停止占用端口的进程
sudo kill -9 <PID>
```

#### 3. 内存不足
测试环境需要至少2GB可用内存：
```bash
# 检查内存
free -h

# 清理内存缓存
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
```

#### 4. 网络问题
```bash
# 测试网络连接
ping -c 3 docker.com

# 检查Docker服务
sudo systemctl status docker
```

### 调试命令

```bash
# 查看容器日志
cd /media/vdc/WorkSpace/Personal/WechatOnlineShop/deployment
docker-compose -f docker-compose.test.yml logs

# 检查容器状态
docker-compose -f docker-compose.test.yml ps

# 进入容器调试
docker-compose -f docker-compose.test.yml exec backend-test sh

# 查看数据库
docker-compose -f docker-compose.test.yml exec mysql-test mysql -u test_user -ptest_password wechat_shop_test

# 手动测试API端点
curl -v http://localhost:3001/api/health
curl -v http://localhost:3001/api/health/simple
```

### 快速修复

如果测试失败，可以尝试以下步骤：

1. **完全清理并重试**:
   ```bash
   ./scripts/test/cleanup-test-env.sh
   ./scripts/test/setup-test-env.sh
   ```

2. **重建Docker镜像**:
   ```bash
   cd backend
   docker build -f Dockerfile.test -t wechat-shop-backend-test .
   ```

3. **检查环境变量**:
   ```bash
   cat backend/.env.test
   echo "DB_HOST=$DB_HOST"
   ```

4. **查看详细日志**:
   ```bash
   tail -f scripts/test/logs/*.log
   ```

## 自定义配置

### 环境变量覆盖
可以通过环境变量自定义测试行为：

```bash
# 设置自定义端口
export TEST_MYSQL_PORT=3308
export TEST_REDIS_PORT=6381
export TEST_BACKEND_PORT=3002

# 设置超时时间
export TEST_SETUP_TIMEOUT=60
export TEST_HEALTH_TIMEOUT=30

# 控制测试范围
export SKIP_INTEGRATION_TESTS=false
export SKIP_E2E_TESTS=false
export MIN_COVERAGE=80
```

### 配置文件
可以在项目根目录创建 `.testrc` 文件：

```json
{
  "timeout": 300,
  "ports": {
    "mysql": 3307,
    "redis": 6380,
    "backend": 3001
  },
  "coverage": {
    "enabled": true,
    "threshold": 80
  },
  "healthCheck": {
    "enabled": true,
    "timeout": 30
  },
  "logging": {
    "level": "info",
    "directory": "./scripts/test/logs"
  }
}
```

## 最佳实践

### 开发流程
1. **编写代码** → **运行单元测试** → **提交代码**
2. **功能完成** → **运行集成测试** → **代码审查**
3. **发布前** → **运行端到端测试** → **健康检查**

### CI/CD集成
```yaml
# GitHub Actions 示例
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run tests
        run: ./scripts/test/run-tests.sh
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### 性能优化
- 使用缓存加速Docker构建
- 并行运行独立测试
- 增量测试（只测试更改的文件）
- 使用测试数据工厂减少数据库操作

## 注意事项

1. **数据隔离**: 测试环境使用独立的数据卷，不会影响生产数据
2. **自动清理**: 测试完成后会自动清理环境，避免资源泄漏
3. **详细日志**: 所有操作都记录到日志文件，便于调试
4. **错误处理**: 测试失败时提供具体的错误信息和解决方案
5. **CI/CD支持**: 所有脚本都设计为可在CI/CD环境中运行
6. **资源管理**: 测试环境配置了合理的内存和CPU限制

## 扩展开发

### 添加新测试
1. 在 `backend/src/test/` 目录创建新的测试文件
2. 遵循命名约定：`*.spec.ts`（单元）、`*.integration.spec.ts`（集成）、`*.e2e.spec.ts`（端到端）
3. 更新 `jest.config.js` 配置（如果需要）
4. 运行测试验证功能

### 自定义命令
要添加新的测试命令，编辑 `.claude/commands/test-command.sh`：

```bash
# 添加新的命令处理函数
run_custom_command() {
    echo "执行自定义命令..."
    # 添加你的逻辑
}

# 在主函数中添加case
case "${command}" in
    custom)
        run_custom_command
        ;;
    # ... 其他命令
esac
```

## 支持与反馈

如果遇到问题或需要改进：

1. **查看日志**: `scripts/test/logs/` 目录
2. **检查配置**: 验证环境变量和配置文件
3. **运行诊断**: `./scripts/test/health-check.sh`
4. **手动测试**: 使用调试命令逐步排查

## 版本历史

- **v1.0.0** (2026-04-19): 初始版本，包含完整的测试基础设施
- **功能**: 单元测试、集成测试、端到端测试、健康检查、Docker化测试环境
- **脚本**: 自动化测试脚本、环境管理、报告生成
- **集成**: Claude Code命令支持、CI/CD就绪

---

*最后更新: 2026-04-19*  
*微信在线商城测试系统*