import { validate } from 'class-validator';
import { DepositDto } from './deposit.dto';

describe('DepositDto', () => {
  let dto: DepositDto;

  beforeEach(() => {
    dto = new DepositDto();
  });

  describe('amount validation', () => {
    it('should pass with valid amount', async () => {
      dto.amount = 100.5;
      dto.description = 'Test deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });

    it('should pass with minimum valid amount (0.01)', async () => {
      dto.amount = 0.01;
      dto.description = 'Minimum deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });

    it('should fail with amount less than 0.01', async () => {
      dto.amount = 0.005;
      dto.description = 'Invalid deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail with zero amount', async () => {
      dto.amount = 0;
      dto.description = 'Zero deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail with negative amount', async () => {
      dto.amount = -50;
      dto.description = 'Negative deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail with null amount', async () => {
      dto.amount = null as any;
      dto.description = 'Test deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with undefined amount', async () => {
      dto.description = 'Test deposit';
      // amount is undefined

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with empty string amount', async () => {
      dto.amount = '' as any;
      dto.description = 'Test deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('isNumber');
    });

    it('should fail with string amount', async () => {
      dto.amount = '100.50' as any;
      dto.description = 'Test deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('isNumber');
    });

    it('should pass with large amount', async () => {
      dto.amount = 999999.99;
      dto.description = 'Large deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });

    it('should pass with integer amount', async () => {
      dto.amount = 100;
      dto.description = 'Integer deposit';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });
  });

  describe('description validation', () => {
    it('should pass with valid description', async () => {
      dto.amount = 100;
      dto.description = 'Monthly salary deposit';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass with undefined description (optional field)', async () => {
      dto.amount = 100;
      // description is undefined

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass with null description (optional field)', async () => {
      dto.amount = 100;
      dto.description = null as any;

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass with empty string description', async () => {
      dto.amount = 100;
      dto.description = '';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should fail with non-string description', async () => {
      dto.amount = 100;
      dto.description = 123456 as any;

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(1);
      expect(descriptionErrors[0].constraints).toHaveProperty('isString');
    });

    it('should pass with long description', async () => {
      dto.amount = 100;
      dto.description =
        'This is a very long description that contains many characters to test if the validation accepts long strings without any issues';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });
  });

  describe('complete validation', () => {
    it('should pass with all valid fields', async () => {
      dto.amount = 250.75;
      dto.description = 'Bonus payment deposit';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with valid amount and no description', async () => {
      dto.amount = 150;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid amount regardless of description', async () => {
      dto.amount = -100;
      dto.description = 'Valid description';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('amount');
    });

    it('should fail with valid amount but invalid description type', async () => {
      dto.amount = 100;
      dto.description = 123 as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('description');
    });

    it('should fail with multiple validation errors', async () => {
      dto.amount = -50;
      dto.description = 123 as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(2);
      expect(errors.some((error) => error.property === 'amount')).toBe(true);
      expect(errors.some((error) => error.property === 'description')).toBe(
        true,
      );
    });
  });
});
