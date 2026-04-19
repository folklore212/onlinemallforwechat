import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';
import { RedisHealthIndicator } from './redis.health';
import * as packageJson from '../../../package.json';

@ApiTags('健康检查')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
    private memory: MemoryHealthIndicator,
    private databaseHealth: DatabaseHealthIndicator,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: '健康检查端点', description: '检查应用及其依赖服务的健康状态' })
  @ApiResponse({ status: 200, description: '所有服务健康' })
  @ApiResponse({ status: 503, description: '一个或多个服务不健康' })
  async check() {
    return this.health.check([
      // 检查数据库连接
      async () => this.db.pingCheck('database', { timeout: 3000 }),

      // 检查Redis连接
      async () => this.redisHealth.isHealthy('redis'),

      // 检查内存使用（150MB阈值）
      async () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),

      // 检查RSS内存（300MB阈值）
      async () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),

      // 自定义数据库健康检查
      async () => this.databaseHealth.isHealthy('custom_database'),
    ]);
  }

  @Get('simple')
  @ApiOperation({ summary: '简单健康检查', description: '返回简单的应用状态信息' })
  @ApiResponse({ status: 200, description: '应用运行正常' })
  simple() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
    };
  }

  @Get('version')
  @ApiOperation({ summary: '版本信息', description: '获取应用版本信息' })
  @ApiResponse({ status: 200, description: '版本信息' })
  version() {
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}