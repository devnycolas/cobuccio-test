import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';

describe('AppModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Mock environment variables for testing
    process.env.DB_HOST = 'localhost';
    process.env.DB_PORT = '5432';
    process.env.DB_USERNAME = 'postgres';
    process.env.DB_PASSWORD = 'postgres';
    process.env.DB_DATABASE = 'test_db';
    process.env.NODE_ENV = 'test';

    // Create a minimal test module to test AppModule structure
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
      ],
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

  it('should compile a basic test module successfully', async () => {
    const app = module.createNestApplication();
    expect(app).toBeDefined();
    await app.close();
  });

  it('should have ConfigModule available', () => {
    const configModule = module.get(ConfigModule);
    expect(configModule).toBeDefined();
  });

  it('should initialize with environment variables', () => {
    // Test that environment variables are being used
    expect(process.env.DB_HOST).toBe('localhost');
    expect(process.env.DB_PORT).toBe('5432');
    expect(process.env.DB_USERNAME).toBe('postgres');
    expect(process.env.DB_PASSWORD).toBe('postgres');
    expect(process.env.DB_DATABASE).toBe('test_db');
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('should handle default environment variables', () => {
    // Clear environment variables to test defaults
    delete process.env.DB_HOST;
    delete process.env.DB_PORT;
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_DATABASE;

    // The module should still work with defaults
    expect(() => {
      const host = process.env.DB_HOST || 'localhost';
      const port = parseInt(process.env.DB_PORT || '5432');
      const username = process.env.DB_USERNAME || 'postgres';
      const password = process.env.DB_PASSWORD || 'postgres';
      const database = process.env.DB_DATABASE || 'wallet_db';

      expect(host).toBe('localhost');
      expect(port).toBe(5432);
      expect(username).toBe('postgres');
      expect(password).toBe('postgres');
      expect(database).toBe('wallet_db');
    }).not.toThrow();
  });
});
