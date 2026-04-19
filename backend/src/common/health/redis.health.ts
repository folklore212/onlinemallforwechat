import { Injectable, Inject, Optional } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { Redis } from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @Optional()
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis | null,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // 如果没有Redis客户端，返回未配置状态
    if (!this.redisClient) {
      return this.getStatus(key, true, {
        status: 'not_configured',
        message: 'Redis客户端未配置',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      // 执行简单的Redis命令
      const pingResult = await this.redisClient.ping();
      const isConnected = pingResult === 'PONG';

      // 获取Redis信息
      const info = await this.redisClient.info();
      const infoLines = info.split('\r\n');
      const redisInfo: Record<string, string> = {};

      for (const line of infoLines) {
        const [key, value] = line.split(':');
        if (key && value) {
          redisInfo[key.trim()] = value.trim();
        }
      }

      // 获取更多统计信息
      const memoryInfo = await this.redisClient.info('memory');
      const memoryLines = memoryInfo.split('\r\n');
      const memoryStats: Record<string, string> = {};

      for (const line of memoryLines) {
        const [key, value] = line.split(':');
        if (key && value && key.startsWith('used_memory')) {
          memoryStats[key.trim()] = value.trim();
        }
      }

      return this.getStatus(key, isConnected, {
        status: isConnected ? 'connected' : 'disconnected',
        version: redisInfo.redis_version || 'unknown',
        mode: redisInfo.redis_mode || 'unknown',
        uptime: redisInfo.uptime_in_seconds ? `${redisInfo.uptime_in_seconds}s` : 'unknown',
        connectedClients: redisInfo.connected_clients || 'unknown',
        usedMemory: memoryStats.used_memory_human || 'unknown',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // 如果Redis操作失败，返回不健康状态
      throw new HealthCheckError(
        'Redis连接失败',
        this.getStatus(key, false, {
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  async getRedisStats(): Promise<any> {
    // 如果没有Redis客户端，返回未配置状态
    if (!this.redisClient) {
      return {
        status: 'not_configured',
        message: 'Redis客户端未配置',
        isConnected: false,
      };
    }

    try {
      // 获取Redis统计信息
      const info = await this.redisClient.info();
      const infoLines = info.split('\r\n');
      const stats: Record<string, string> = {};

      for (const line of infoLines) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key.trim()] = value.trim();
        }
      }

      // 获取键数量
      const keys = await this.redisClient.dbsize();

      return {
        version: stats.redis_version,
        mode: stats.redis_mode,
        uptime: stats.uptime_in_seconds,
        connectedClients: stats.connected_clients,
        totalCommandsProcessed: stats.total_commands_processed,
        keys,
        isConnected: true,
      };
    } catch (error) {
      return {
        error: '无法获取Redis统计信息',
        message: error.message,
        isConnected: false,
      };
    }
  }
}