import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // 执行简单的数据库查询
      await this.dataSource.query('SELECT 1 as health_check');

      // 获取数据库连接信息
      const isConnected = this.dataSource.isInitialized;
      const driver = this.dataSource.driver.options.type;
      const database = this.dataSource.driver.database;

      return this.getStatus(key, isConnected, {
        driver,
        database,
        connectionStatus: isConnected ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // 如果查询失败，返回不健康状态
      throw new HealthCheckError(
        '数据库连接失败',
        this.getStatus(key, false, {
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
      );
    }
  }

  async getDatabaseStats(): Promise<any> {
    try {
      // 获取数据库统计信息
      const [tableCount] = await this.dataSource.query(
        "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE()",
      );

      const [connectionCount] = await this.dataSource.query(
        "SELECT COUNT(*) as count FROM information_schema.processlist WHERE db = DATABASE()",
      );

      return {
        tables: tableCount?.count || 0,
        connections: connectionCount?.count || 0,
        driver: this.dataSource.driver.options.type,
        database: this.dataSource.driver.database,
        isConnected: this.dataSource.isInitialized,
      };
    } catch (error) {
      return {
        error: '无法获取数据库统计信息',
        message: error.message,
      };
    }
  }
}