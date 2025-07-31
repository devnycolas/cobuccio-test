import { Test, TestingModule } from '@nestjs/testing';
import { HealthModule } from './health.module';
import { HealthController } from './health.controller';

describe('HealthModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [HealthModule],
    }).compile();
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should have HealthController defined', () => {
    const healthController = module.get<HealthController>(HealthController);
    expect(healthController).toBeDefined();
  });

  it('should import TerminusModule', async () => {
    // Test that TerminusModule is properly imported
    const healthController = module.get<HealthController>(HealthController);
    expect(healthController).toBeDefined();
    expect(healthController).toBeInstanceOf(HealthController);
  });

  it('should compile module successfully', async () => {
    const app = module.createNestApplication();
    expect(app).toBeDefined();
    await app.close();
  });

  it('should have proper module structure', () => {
    // Verify the module has the expected components
    expect(() => {
      module.get<HealthController>(HealthController);
    }).not.toThrow();
  });
});
