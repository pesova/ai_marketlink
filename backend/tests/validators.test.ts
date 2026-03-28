import { handleValidation, ValidationError } from '../src/middleware/validate';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../src/validations/authValidator';
import { onboardSchema, updateBankDetailsSchema } from '../src/validations/vendorValidator';
import {
  createProductSchema,
  updateProductSchema,
  bulkCreateSchema,
} from '../src/validations/productValidator';
import { createOrderSchema } from '../src/validations/orderValidator';
import { chatSchema } from '../src/validations/chatValidator';
import { ProductCategoryEnum } from '../src/interfaces/IProduct';

describe('handleValidation', () => {
  it('throws ValidationError with field details for invalid data', () => {
    expect(() => handleValidation(loginSchema, { email: 'bad', password: '' })).toThrow(
      ValidationError,
    );
    try {
      handleValidation(loginSchema, { email: 'bad', password: '' });
    } catch (e: any) {
      expect(e).toBeInstanceOf(ValidationError);
      expect(e.errors?.length).toBeGreaterThan(0);
      expect(e.statusCode).toBe(422);
    }
  });

  it('returns parsed data on success', () => {
    const data = handleValidation(loginSchema, {
      email: 'ok@test.com',
      password: 'secret',
    });
    expect(data.email).toBe('ok@test.com');
    expect(data.password).toBe('secret');
  });
});

describe('authValidator schemas', () => {
  it('registerSchema rejects short name', () => {
    expect(() =>
      handleValidation(registerSchema, {
        name: 'A',
        email: 'a@test.com',
        password: 'secret1',
        confirmPassword: 'secret1',
      }),
    ).toThrow(ValidationError);
  });

  it('registerSchema rejects mismatched passwords', () => {
    expect(() =>
      handleValidation(registerSchema, {
        name: 'Valid',
        email: 'a@test.com',
        password: 'secret1',
        confirmPassword: 'secret2',
      }),
    ).toThrow(ValidationError);
  });

  it('verifyEmailSchema rejects wrong token length', () => {
    expect(() =>
      handleValidation(verifyEmailSchema, { email: 'a@test.com', token: '12' }),
    ).toThrow(ValidationError);
  });

  it('forgotPasswordSchema rejects invalid email', () => {
    expect(() => handleValidation(forgotPasswordSchema, { email: 'nope' })).toThrow(
      ValidationError,
    );
  });

  it('resetPasswordSchema rejects weak new password', () => {
    expect(() =>
      handleValidation(resetPasswordSchema, {
        email: 'a@test.com',
        token: '123456',
        newPassword: '12345',
        confirmPassword: '12345',
      }),
    ).toThrow(ValidationError);
  });
});

describe('vendorValidator', () => {
  it('onboardSchema requires NIN length 11', () => {
    expect(() =>
      handleValidation(onboardSchema, {
        firstName: 'A',
        lastName: 'B',
        businessName: 'C',
        nin: '123',
        phoneNumber: '1',
        name: 'U',
        email: 'u@test.com',
        password: 'secret12',
        confirmPassword: 'secret12',
      }),
    ).toThrow(ValidationError);
  });

  it('updateBankDetailsSchema requires all bank fields', () => {
    expect(() =>
      handleValidation(updateBankDetailsSchema, {
        accountName: 'A',
        bankName: '',
        accountNumber: '1',
      }),
    ).toThrow(ValidationError);
  });
});

describe('productValidator', () => {
  it('createProductSchema requires positive price', () => {
    expect(() =>
      handleValidation(createProductSchema, {
        name: 'P',
        description: 'D',
        price: -5,
        category: ProductCategoryEnum.ELECTRONICS,
      }),
    ).toThrow(ValidationError);
  });

  it('updateProductSchema allows partial updates', () => {
    const data = handleValidation(updateProductSchema, { price: 10 });
    expect(data.price).toBe(10);
  });

  it('bulkCreateSchema validates category enum', () => {
    expect(() =>
      handleValidation(bulkCreateSchema, {
        groupName: 'G',
        category: 'not-a-category',
        price: 10,
      }),
    ).toThrow(ValidationError);
  });
});

describe('orderValidator', () => {
  it('createOrderSchema requires delivery address length', () => {
    expect(() =>
      handleValidation(createOrderSchema, {
        productId: '507f1f77bcf86cd799439011',
        quantity: 1,
        deliveryAddress: 'abc',
      }),
    ).toThrow(ValidationError);
  });
});

describe('chatValidator', () => {
  it('chatSchema rejects empty message', () => {
    expect(() => handleValidation(chatSchema, { message: '' })).toThrow(ValidationError);
  });

  it('chatSchema rejects message over 500 chars', () => {
    expect(() => handleValidation(chatSchema, { message: 'x'.repeat(501) })).toThrow(
      ValidationError,
    );
  });
});
