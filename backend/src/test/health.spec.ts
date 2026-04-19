import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../common/health/health.controller';
import { HealthCheckService, HttpHealthIndicator, TypeOrmHealthIndicator, MemoryHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let mockHealthCheckService: Partial<HealthCheckService>;
  let mockHttpHealthIndicator: Partial<HttpHealthIndicator>;
  let mockTypeOrmHealthIndicator: Partial<TypeOrmHealthIndicator>;
  let mockMemoryHealthIndicator: Partial<MemoryHealthIndicator>;

  beforeEach(async () => {
    mockHealthCheckService = {
      check: jest.fn(() => Promise.resolve({
        status: 'ok',
        info: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          custom_database: { status: 'up' },
        },
        error: {},
        details: {
          database: { status: 'up' },
          redis: { status: 'up' },
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          custom_database: { status: 'up' },
        },
      })),
    };

    mockHttpHealthIndicator = {};
    mockTypeOrmHealthIndicator = {
      pingCheck: jest.fn(() => Promise.resolve({ database: { status: 'up' } })),
    };
    mockMemoryHealthIndicator = {
      checkHeap: jest.fn(() => Promise.resolve({ memory_heap: { status: 'up' } })),
      checkRSS: jest.fn(() => Promise.resolve({ memory_rss: { status: 'up' } })),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: HealthCheckService, useValue: mockHealthCheckService },
        { provide: HttpHealthIndicator, useValue: mockHttpHealthIndicator },
        { provide: TypeOrmHealthIndicator, useValue: mockTypeOrmHealthIndicator },
        { provide: MemoryHealthIndicator, useValue: mockMemoryHealthIndicator },
      ],
    })
      .useMocker(() => ({})) // 为其他依赖提供空mock
      .compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return health check results', async () => {
      const result = await controller.check();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(mockHealthCheckService.check).toHaveBeenCalled();
    });
  });

  describe('simple', () => {
    it('should return simple health status', () => {
      const result = controller.simple();

      expect(result).toBeDefined();
      expect(result.status).toBe('ok');
      expect(result.timestamp).toBeDefined();
      expect(result.uptime).toBeDefined();
      expect(result.memory).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
    });
  });

  describe('version', () => {
    it('should return version information', () => {
      const result = controller.version();

      expect(result).toBeDefined();
      expect(result.name).toBeDefined();
      expect(result.version).toBeDefined();
      expect(result.environment).toBeDefined();
      expect(result.nodeVersion).toBeDefined();
    });
  });
});