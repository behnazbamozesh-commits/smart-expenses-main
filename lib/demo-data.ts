import { Transaction, Receipt, ReceiptItem } from './supabase';

export const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000';

export const DEMO_TRANSACTIONS: Transaction[] = [];

export const DEMO_RECEIPTS: (Receipt & { items: ReceiptItem[] })[] = [];
