import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
});

export const newPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Transaction validation schemas
export const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  accountType: z.enum(['personal', 'business']),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
});

// Receipt validation schemas
export const receiptItemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1).default(1),
  price: z.number().min(0).default(0),
});

export const receiptSchema = z.object({
  store_name: z.string().min(1, 'Store name is required'),
  receipt_date: z.string().min(1, 'Date is required'),
  subtotal: z.number().min(0).default(0),
  tax: z.number().min(0).default(0),
  total: z.number().positive('Total must be greater than 0'),
  items: z.array(receiptItemSchema).optional(),
});

// Validation helper functions
export function validateEmail(email: string): string | null {
  const result = loginSchema.shape.email.safeParse(email);
  return result.success ? null : result.error.errors[0]?.message || 'Invalid email';
}

export function validatePassword(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters';
  if (!/[a-zA-Z]/.test(password)) return 'Password must contain at least one letter';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
  return null;
}

export function validateAmount(amount: string): string | null {
  const num = parseFloat(amount);
  if (isNaN(num)) return 'Please enter a valid number';
  if (num <= 0) return 'Amount must be greater than 0';
  return null;
}

export function validateDate(date: string): string | null {
  if (!date) return 'Date is required';
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return 'Invalid date format';
  return null;
}

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;
export type ReceiptFormData = z.infer<typeof receiptSchema>;
