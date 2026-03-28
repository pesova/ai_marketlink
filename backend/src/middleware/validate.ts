import { ZodObject, z } from 'zod';

export class ValidationError extends Error {
  statusCode = 422;
  errors: { field: string | number; message: string }[];

  constructor(errors: { field: string | number; message: string }[]) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export const handleValidation = <T extends ZodObject>(
  schema: T,
  body: any
): z.infer<T> => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const errors = parsed.error.issues.map((issue: any) => ({
      field: issue.path[0],
      message: issue.message
    }));
    throw new ValidationError(errors);
  }
  return parsed.data;
};
