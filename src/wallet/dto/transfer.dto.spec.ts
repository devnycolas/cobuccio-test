import { validate } from 'class-validator';
import { TransferDto } from './transfer.dto';

describe('TransferDto', () => {
  let dto: TransferDto;

  beforeEach(() => {
    dto = new TransferDto();
  });

  describe('destinationUserId validation', () => {
    it('should pass with valid UUID', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const destinationUserIdErrors = errors.filter(
        (error) => error.property === 'destinationUserId',
      );

      expect(destinationUserIdErrors).toHaveLength(0);
    });

    it('should fail with invalid UUID format', async () => {
      dto.destinationUserId = 'invalid-uuid';
      dto.amount = 100;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const destinationUserIdErrors = errors.filter(
        (error) => error.property === 'destinationUserId',
      );

      expect(destinationUserIdErrors).toHaveLength(1);
      expect(destinationUserIdErrors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail with empty destinationUserId', async () => {
      dto.destinationUserId = '';
      dto.amount = 100;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const destinationUserIdErrors = errors.filter(
        (error) => error.property === 'destinationUserId',
      );

      expect(destinationUserIdErrors).toHaveLength(1);
      expect(destinationUserIdErrors[0].constraints).toHaveProperty(
        'isNotEmpty',
      );
    });

    it('should fail with null destinationUserId', async () => {
      dto.destinationUserId = null as any;
      dto.amount = 100;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const destinationUserIdErrors = errors.filter(
        (error) => error.property === 'destinationUserId',
      );

      expect(destinationUserIdErrors.length).toBeGreaterThan(0);
    });

    it('should fail with undefined destinationUserId', async () => {
      dto.amount = 100;
      dto.description = 'Test transfer';
      // destinationUserId is undefined

      const errors = await validate(dto);
      const destinationUserIdErrors = errors.filter(
        (error) => error.property === 'destinationUserId',
      );

      expect(destinationUserIdErrors.length).toBeGreaterThan(0);
    });

    it('should handle various valid UUID formats', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      for (const uuid of validUUIDs) {
        dto.destinationUserId = uuid;
        dto.amount = 100;
        dto.description = 'Test transfer';

        const errors = await validate(dto);
        const destinationUserIdErrors = errors.filter(
          (error) => error.property === 'destinationUserId',
        );

        expect(destinationUserIdErrors).toHaveLength(0);
      }
    });
  });

  describe('amount validation', () => {
    it('should pass with valid amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100.5;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });

    it('should pass with minimum valid amount (0.01)', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 0.01;
      dto.description = 'Minimum transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });

    it('should fail with amount less than 0.01', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 0.005;
      dto.description = 'Invalid transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail with zero amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 0;
      dto.description = 'Zero transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail with negative amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = -50;
      dto.description = 'Negative transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('min');
    });

    it('should fail with null amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = null as any;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with undefined amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.description = 'Test transfer';
      // amount is undefined

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors.length).toBeGreaterThan(0);
    });

    it('should fail with string amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = '100.50' as any;
      dto.description = 'Test transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(1);
      expect(amountErrors[0].constraints).toHaveProperty('isNumber');
    });

    it('should pass with large amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 999999.99;
      dto.description = 'Large transfer';

      const errors = await validate(dto);
      const amountErrors = errors.filter(
        (error) => error.property === 'amount',
      );

      expect(amountErrors).toHaveLength(0);
    });
  });

  describe('description validation', () => {
    it('should pass with valid description', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100;
      dto.description = 'Payment for services';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass with undefined description (optional field)', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100;
      // description is undefined

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass with null description (optional field)', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100;
      dto.description = null as any;

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should pass with empty string description', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100;
      dto.description = '';

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(0);
    });

    it('should fail with non-string description', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 100;
      dto.description = 123456 as any;

      const errors = await validate(dto);
      const descriptionErrors = errors.filter(
        (error) => error.property === 'description',
      );

      expect(descriptionErrors).toHaveLength(1);
      expect(descriptionErrors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('complete validation', () => {
    it('should pass with all valid fields', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 250.75;
      dto.description = 'Payment for loan';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with valid required fields and no description', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 150;

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail with multiple validation errors', async () => {
      dto.destinationUserId = 'invalid-uuid';
      dto.amount = -50;
      dto.description = 123 as any;

      const errors = await validate(dto);

      expect(errors).toHaveLength(3);
      expect(
        errors.some((error) => error.property === 'destinationUserId'),
      ).toBe(true);
      expect(errors.some((error) => error.property === 'amount')).toBe(true);
      expect(errors.some((error) => error.property === 'description')).toBe(
        true,
      );
    });

    it('should fail with only invalid destinationUserId', async () => {
      dto.destinationUserId = 'not-a-uuid';
      dto.amount = 100;
      dto.description = 'Valid description';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('destinationUserId');
    });

    it('should fail with only invalid amount', async () => {
      dto.destinationUserId = '123e4567-e89b-12d3-a456-426614174000';
      dto.amount = 0;
      dto.description = 'Valid description';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('amount');
    });
  });
});
