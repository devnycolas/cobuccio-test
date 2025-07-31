import { validate } from 'class-validator';
import { ReverseTransactionDto } from './reverse-transaction.dto';

describe('ReverseTransactionDto', () => {
  let dto: ReverseTransactionDto;

  beforeEach(() => {
    dto = new ReverseTransactionDto();
  });

  describe('transactionId validation', () => {
    it('should pass with valid UUID', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      const transactionIdErrors = errors.filter(
        (error) => error.property === 'transactionId',
      );

      expect(transactionIdErrors).toHaveLength(0);
    });

    it('should fail with invalid UUID format', async () => {
      dto.transactionId = 'invalid-uuid';
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      const transactionIdErrors = errors.filter(
        (error) => error.property === 'transactionId',
      );

      expect(transactionIdErrors).toHaveLength(1);
      expect(transactionIdErrors[0].constraints).toHaveProperty('isUuid');
    });

    it('should fail with empty transactionId', async () => {
      dto.transactionId = '';
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      const transactionIdErrors = errors.filter(
        (error) => error.property === 'transactionId',
      );

      expect(transactionIdErrors).toHaveLength(1);
      expect(transactionIdErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail with null transactionId', async () => {
      dto.transactionId = null as any;
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      const transactionIdErrors = errors.filter(
        (error) => error.property === 'transactionId',
      );

      expect(transactionIdErrors.length).toBeGreaterThan(0);
    });

    it('should fail with undefined transactionId', async () => {
      dto.reason = 'Test reason';
      // transactionId is undefined

      const errors = await validate(dto);
      const transactionIdErrors = errors.filter(
        (error) => error.property === 'transactionId',
      );

      expect(transactionIdErrors.length).toBeGreaterThan(0);
    });

    it('should fail with non-string transactionId', async () => {
      dto.transactionId = 123456 as any;
      dto.reason = 'Test reason';

      const errors = await validate(dto);
      const transactionIdErrors = errors.filter(
        (error) => error.property === 'transactionId',
      );

      expect(transactionIdErrors.length).toBeGreaterThan(0);
    });
  });

  describe('reason validation', () => {
    it('should pass with valid reason', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 'Valid reason for reversal';

      const errors = await validate(dto);
      const reasonErrors = errors.filter(
        (error) => error.property === 'reason',
      );

      expect(reasonErrors).toHaveLength(0);
    });

    it('should pass with undefined reason (optional field)', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      // reason is undefined

      const errors = await validate(dto);
      const reasonErrors = errors.filter(
        (error) => error.property === 'reason',
      );

      expect(reasonErrors).toHaveLength(0);
    });

    it('should pass with null reason (optional field)', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = null as any;

      const errors = await validate(dto);
      const reasonErrors = errors.filter(
        (error) => error.property === 'reason',
      );

      expect(reasonErrors).toHaveLength(0);
    });

    it('should pass with empty string reason', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = '';

      const errors = await validate(dto);
      const reasonErrors = errors.filter(
        (error) => error.property === 'reason',
      );

      expect(reasonErrors).toHaveLength(0);
    });

    it('should fail with non-string reason', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 123456 as any;

      const errors = await validate(dto);
      const reasonErrors = errors.filter(
        (error) => error.property === 'reason',
      );

      expect(reasonErrors).toHaveLength(1);
      expect(reasonErrors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('complete validation', () => {
    it('should pass with all valid fields', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';
      dto.reason = 'Transaction made by mistake';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should pass with valid transactionId and no reason', async () => {
      dto.transactionId = '123e4567-e89b-12d3-a456-426614174000';

      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid transactionId regardless of reason', async () => {
      dto.transactionId = 'invalid-uuid';
      dto.reason = 'Valid reason';

      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('transactionId');
    });

    it('should handle various UUID formats', async () => {
      const validUUIDs = [
        '123e4567-e89b-12d3-a456-426614174000',
        'a0b1c2d3-e4f5-6789-abcd-ef0123456789',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      for (const uuid of validUUIDs) {
        dto.transactionId = uuid;
        dto.reason = 'Test reason';

        const errors = await validate(dto);
        const transactionIdErrors = errors.filter(
          (error) => error.property === 'transactionId',
        );

        expect(transactionIdErrors).toHaveLength(0);
      }
    });
  });
});
