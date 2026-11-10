import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(1, 'required').max(100, 'too_long'),
  email: z.string().email('invalid'),
  message: z.string().min(10, 'too_short').max(5000, 'too_long'),
  locale: z.enum(['th', 'en']),
  turnstileToken: z.string().min(1),
  website: z.string(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export interface ValidationError {
  name?: 'required' | 'too_long';
  email?: 'invalid';
  message?: 'too_short' | 'too_long';
}

export function parseContactInput(data: unknown):
  | {
      success: true;
      data: ContactInput;
    }
  | {
      success: false;
      fields: ValidationError;
    } {
  const result = contactSchema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const fields: ValidationError = {};

  for (const issue of result.error.issues) {
    const path = issue.path[0] as string;

    if (path === 'name') {
      fields.name = issue.message as 'required' | 'too_long';
    } else if (path === 'email') {
      fields.email = 'invalid';
    } else if (path === 'message') {
      fields.message = issue.message as 'too_short' | 'too_long';
    }
  }

  return { success: false, fields };
}
