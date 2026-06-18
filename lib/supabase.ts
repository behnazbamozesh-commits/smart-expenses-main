import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string; // 'Personal' or 'Business' based on account type
  date: string;
  description: string | null;
  source: 'manual' | 'receipt';
  receipt_id: string | null;
  transaction_type: 'personal' | 'business';
  created_at: string;
};

export type Receipt = {
  id: string;
  user_id: string;
  image_url: string;
  store_name: string | null;
  receipt_date: string | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  raw_text: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
  items?: ReceiptItem[];
};

export type ReceiptItem = {
  id: string;
  receipt_id: string;
  item_name: string;
  quantity: number;
  price: number;
};

// Account types for Personal/Business categorization
export const ACCOUNT_TYPES = ['personal', 'business'] as const;
export type AccountType = typeof ACCOUNT_TYPES[number];
