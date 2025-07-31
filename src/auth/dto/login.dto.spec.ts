import { validate } from 'class-validator';
import { LoginDto } from './login.dto';

describe('LoginDto', () => {
  let dto: LoginDto;

  beforeEach(() => {
    dto = new LoginDto();
  });

  describe('email validation', () => {
    it('should pass with valid email', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors).toHaveLength(0);
    });

    it('should fail with invalid email format', async () => {
      dto.email = 'invalid-email';
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isEmail');
    });

    it('should fail with empty email', async () => {
      dto.email = '';
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors).toHaveLength(1);
      expect(emailErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail with null email', async () => {
      dto.email = null as any;
      dto.password = 'password123';

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors.length).toBeGreaterThan(0);
    });

    it('should fail with undefined email', async () => {
      dto.password = 'password123';
      // email is undefined

      const errors = await validate(dto);
      const emailErrors = errors.filter((error) => error.property === 'email');

      expect(emailErrors.length).toBeGreaterThan(0);
    });
  });

  describe('password validation', () => {
    it('should pass with valid password', async () => {
      dto.email = 'test@example.com';
      dto.password = 'password123';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors).toHaveLength(0);
    });

    it('should fail with password shorter than 8 characters', async () => {
      dto.email = 'test@example.com';
      dto.password = 'short';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors).toHaveLength(1);
      expect(passwordErrors[0].constraints).toHaveProperty('minLength');
    });

    it('should fail with empty password', async () => {
      dto.email = 'test@example.com';
      dto.password = '';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors).toHaveLength(1);
      expect(passwordErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail with null password', async () => {
      dto.email = 'test@example.com';
      dto.password = null as any;

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors.length).toBeGreaterThan(0);
    });

    it('should fail with undefined password', async () => {
      dto.email = 'test@example.com';
      // password is undefined

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors.length).toBeGreaterThan(0);
    });

    it('should fail with non-string password', async () => {
      dto.email = 'test@example.com';
      dto.password = 123456789 as any;

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors).toHaveLength(1);
      expect(passwordErrors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('complete validation', () => {
    it('should pass with all valid fields', async () => {
      dto.email = 'user@example.com';
      dto.password = 'validpassword123';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail with all invalid fields', async () => {
      dto.email = 'invalid-email';
      dto.password = 'short';

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some((error) => error.property === 'email')).toBe(true);
      expect(errors.some((error) => error.property === 'password')).toBe(true);
    });

    it('should pass with exactly 8 character password', async () => {
      dto.email = 'test@example.com';
      dto.password = '12345678';

      const errors = await validate(dto);
      const passwordErrors = errors.filter(
        (error) => error.property === 'password',
      );

      expect(passwordErrors).toHaveLength(0);
    });
  });
});
