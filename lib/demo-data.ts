import { Transaction, Receipt, ReceiptItem } from './supabase';

export const DEMO_USER_ID = 'demo-user-00000000-0000-0000-0000-000000000000';

const now = new Date();
const thisMonth = (day: number) => new Date(now.getFullYear(), now.getMonth(), day).toISOString().split('T')[0];

export const DEMO_TRANSACTIONS: Transaction[] = [
  // Business Income
  { id: 'tx-demo-1', user_id: DEMO_USER_ID, type: 'income', amount: 5000, category: 'Business', date: thisMonth(5), description: 'Client payment - Web project', source: 'manual', receipt_id: null, transaction_type: 'business', created_at: thisMonth(5) },
  { id: 'tx-demo-2', user_id: DEMO_USER_ID, type: 'income', amount: 2500, category: 'Freelance', date: thisMonth(12), description: 'Consulting fee', source: 'manual', receipt_id: null, transaction_type: 'business', created_at: thisMonth(12) },

  // Personal Income
  { id: 'tx-demo-3', user_id: DEMO_USER_ID, type: 'income', amount: 3500, category: 'Salary', date: thisMonth(1), description: 'Monthly salary', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(1) },
  { id: 'tx-demo-4', user_id: DEMO_USER_ID, type: 'income', amount: 200, category: 'Gifts', date: thisMonth(8), description: 'Birthday gift from parents', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(8) },

  // Business Expenses
  { id: 'tx-demo-5', user_id: DEMO_USER_ID, type: 'expense', amount: 150, category: 'Bills & Utilities', date: thisMonth(3), description: 'Business internet bill', source: 'manual', receipt_id: null, transaction_type: 'business', created_at: thisMonth(3) },
  { id: 'tx-demo-6', user_id: DEMO_USER_ID, type: 'expense', amount: 300, category: 'Shopping', date: thisMonth(7), description: 'Office supplies', source: 'manual', receipt_id: null, transaction_type: 'business', created_at: thisMonth(7) },
  { id: 'tx-demo-7', user_id: DEMO_USER_ID, type: 'expense', amount: 80, category: 'Food & Dining', date: thisMonth(10), description: 'Client lunch meeting', source: 'manual', receipt_id: null, transaction_type: 'business', created_at: thisMonth(10) },
  { id: 'tx-demo-8', user_id: DEMO_USER_ID, type: 'expense', amount: 200, category: 'Transportation', date: thisMonth(14), description: 'Business travel - Taxi', source: 'manual', receipt_id: null, transaction_type: 'business', created_at: thisMonth(14) },

  // Personal Expenses
  { id: 'tx-demo-9', user_id: DEMO_USER_ID, type: 'expense', amount: 120, category: 'Food & Dining', date: thisMonth(2), description: 'Grocery shopping', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(2) },
  { id: 'tx-demo-10', user_id: DEMO_USER_ID, type: 'expense', amount: 50, category: 'Entertainment', date: thisMonth(4), description: 'Movie tickets - Family', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(4) },
  { id: 'tx-demo-11', user_id: DEMO_USER_ID, type: 'expense', amount: 200, category: 'Healthcare', date: thisMonth(6), description: 'Doctor visit', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(6) },
  { id: 'tx-demo-12', user_id: DEMO_USER_ID, type: 'expense', amount: 75, category: 'Shopping', date: thisMonth(9), description: 'Kids clothes', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(9) },
  { id: 'tx-demo-13', user_id: DEMO_USER_ID, type: 'expense', amount: 60, category: 'Bills & Utilities', date: thisMonth(11), description: 'Electricity bill - Home', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(11) },
  { id: 'tx-demo-14', user_id: DEMO_USER_ID, type: 'expense', amount: 40, category: 'Transportation', date: thisMonth(15), description: 'Gas - Family car', source: 'manual', receipt_id: null, transaction_type: 'personal', created_at: thisMonth(15) },
];

export const DEMO_RECEIPTS: (Receipt & { items: ReceiptItem[] })[] = [];
