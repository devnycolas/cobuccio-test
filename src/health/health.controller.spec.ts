import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;
  let healthCheckService: HealthCheckService;
  let typeOrmHealthIndicator: TypeOrmHealthIndicator;

  const mockHealthCheckService = {
    check: jest.fn(),
  };

  const mockTypeOrmHealthIndicator = {
    pingCheck: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: mockHealthCheckService,
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: mockTypeOrmHealthIndicator,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthCheckService = module.get<HealthCheckService>(HealthCheckService);
    typeOrmHealthIndicator = module.get<TypeOrmHealthIndicator>(
      TypeOrmHealthIndicator,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('check', () => {
    it('should return healthy status when database is up', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'ok',
        info: {
          database: {
            status: 'up',
          },
        },
        error: {},
        details: {
          database: {
            status: 'up',
          },
        },
      };

      mockTypeOrmHealthIndicator.pingCheck.mockResolvedValue({
        database: { status: 'up' },
      });

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(result).toEqual(expectedResult);
    });

    it('should return unhealthy status when database is down', async () => {
      const expectedResult: HealthCheckResult = {
        status: 'error',
        info: {},
        error: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
        details: {
          database: {
            status: 'down',
            message: 'Connection failed',
          },
        },
      };

      mockTypeOrmHealthIndicator.pingCheck.mockRejectedValue(
        new Error('Connection failed'),
      );

      mockHealthCheckService.check.mockResolvedValue(expectedResult);

      const result = await controller.check();

      expect(healthCheckService.check).toHaveBeenCalledWith([
        expect.any(Function),
      ]);
      expect(result).toEqual(expectedResult);
    });

    it('should call database ping check correctly', async () => {
      const healthCheckFunction = jest.fn().mockResolvedValue({
        database: { status: 'up' },
      });

      mockTypeOrmHealthIndicator.pingCheck.mockImplementation(() =>
        healthCheckFunction(),
      );

      mockHealthCheckService.check.mockImplementation(async (checks) => {
        // Execute the health check function to verify it's called correctly
        const checkFunction = checks[0];
        const result = await checkFunction();

        return {
          status: 'ok',
          info: { database: result.database },
          error: {},
          details: { database: result.database },
        };
      });

      await controller.check();

      // Verify the ping check is called with the correct key
      expect(mockTypeOrmHealthIndicator.pingCheck).toHaveBeenCalledWith(
        'database',
      );
    });
  });
});
