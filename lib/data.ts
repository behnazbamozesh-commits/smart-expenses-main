import { supabase, Transaction, Receipt, ReceiptItem } from './supabase';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';
import { DEMO_USER_ID, DEMO_TRANSACTIONS, DEMO_RECEIPTS } from './demo-data';

function isDemo(userId: string) {
  return userId === DEMO_USER_ID;
}

export async function getDashboardData(userId: string) {
  if (isDemo(userId)) {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const thisMonth = DEMO_TRANSACTIONS.filter((t) => {
      const d = new Date(t.date);
      return d >= monthStart && d <= monthEnd;
    });

    const totalIncome = thisMonth.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = thisMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const netProfit = totalIncome - totalExpenses;

    const expensesByCategory: Record<string, number> = {};
    thisMonth.filter((t) => t.type === 'expense').forEach((t) => {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Number(t.amount);
    });
    const largestEntry = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      largestCategory: largestEntry ? { category: largestEntry[0], amount: largestEntry[1] } : null,
      recentTransactions: [...DEMO_TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
    };
  }

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [transactionsResult, categoryResult] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId).gte('date', monthStart.toISOString()).lte('date', monthEnd.toISOString()).order('date', { ascending: false }),
    supabase.from('transactions').select('category, amount').eq('user_id', userId).eq('type', 'expense').gte('date', monthStart.toISOString()).lte('date', monthEnd.toISOString()),
  ]);

  const transactions = transactionsResult.data || [];
  const categoryData = categoryResult.data || [];

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  const netProfit = totalIncome - totalExpenses;

  const expensesByCategory: Record<string, number> = {};
  categoryData.forEach((item) => {
    expensesByCategory[item.category] = (expensesByCategory[item.category] || 0) + Number(item.amount);
  });
  const largestCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    largestCategory: largestCategory ? { category: largestCategory[0], amount: largestCategory[1] } : null,
    recentTransactions: transactions.slice(0, 5),
  };
}

export async function getTransactions(userId: string, dateRange?: { start: Date; end: Date }) {
  if (isDemo(userId)) {
    let data = [...DEMO_TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (dateRange) {
      data = data.filter((t) => {
        const d = new Date(t.date);
        return d >= dateRange.start && d <= dateRange.end;
      });
    }
    return data;
  }

  let query = supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
  if (dateRange) {
    query = query.gte('date', dateRange.start.toISOString()).lte('date', dateRange.end.toISOString());
  }
  const { data, error } = await query;
  if (error) throw error;
  return data as Transaction[];
}

export async function createTransaction(transaction: {
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  description?: string;
  source?: 'manual' | 'receipt';
  receipt_id?: string;
  transaction_type?: 'all' | 'business' | 'personal';
}) {
  if (isDemo(transaction.user_id)) {
    const newTx: Transaction = {
      id: 'tx-demo-' + Date.now(),
      receipt_id: transaction.receipt_id ?? null,
      source: transaction.source ?? 'manual',
      description: transaction.description ?? null,
      transaction_type: transaction.transaction_type ?? 'personal',
      created_at: new Date().toISOString(),
      ...transaction,
    };
    DEMO_TRANSACTIONS.unshift(newTx);
    return newTx;
  }

  const { data, error } = await supabase.from('transactions').insert(transaction).select().single();
  if (error) throw error;
  return data as Transaction;
}

export async function updateTransaction(id: string, updates: Partial<Transaction>) {
  if (id.startsWith('tx-')) {
    const idx = DEMO_TRANSACTIONS.findIndex((t) => t.id === id);
    if (idx !== -1) {
      DEMO_TRANSACTIONS[idx] = { ...DEMO_TRANSACTIONS[idx], ...updates };
      return DEMO_TRANSACTIONS[idx];
    }
  }

  const { data, error } = await supabase.from('transactions').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Transaction;
}

export async function deleteTransaction(id: string) {
  if (id.startsWith('tx-')) {
    const idx = DEMO_TRANSACTIONS.findIndex((t) => t.id === id);
    if (idx !== -1) DEMO_TRANSACTIONS.splice(idx, 1);
    return;
  }

  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}

export async function getReceipts(userId: string) {
  if (isDemo(userId)) return DEMO_RECEIPTS;

  const { data, error } = await supabase.from('receipts').select('*, items:receipt_items(*)').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  return data as (Receipt & { items: ReceiptItem[] })[];
}

export async function getReceipt(userId: string, receiptId: string) {
  if (isDemo(userId)) {
    const r = DEMO_RECEIPTS.find((r) => r.id === receiptId);
    if (!r) throw new Error('Receipt not found');
    return r;
  }

  const { data, error } = await supabase.from('receipts').select('*, items:receipt_items(*)').eq('user_id', userId).eq('id', receiptId).single();
  if (error) throw error;
  return data as Receipt & { items: ReceiptItem[] };
}

export async function createReceipt(receipt: {
  user_id: string;
  image_url: string;
  store_name?: string;
  receipt_date?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  raw_text?: string;
  status?: 'pending' | 'confirmed' | 'rejected';
}) {
  if (isDemo(receipt.user_id)) {
    const newReceipt = { id: 'rc-demo-' + Date.now(), created_at: new Date().toISOString(), items: [], ...receipt } as Receipt & { items: ReceiptItem[] };
    DEMO_RECEIPTS.unshift(newReceipt);
    return newReceipt;
  }

  const { data, error } = await supabase.from('receipts').insert(receipt).select().single();
  if (error) throw error;
  return data as Receipt;
}

export async function updateReceipt(id: string, updates: Partial<Receipt>) {
  if (id.startsWith('rc-')) {
    const idx = DEMO_RECEIPTS.findIndex((r) => r.id === id);
    if (idx !== -1) {
      DEMO_RECEIPTS[idx] = { ...DEMO_RECEIPTS[idx], ...updates };
      return DEMO_RECEIPTS[idx];
    }
  }

  const { data, error } = await supabase.from('receipts').update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data as Receipt;
}

export async function deleteReceipt(id: string) {
  if (id.startsWith('rc-')) {
    const idx = DEMO_RECEIPTS.findIndex((r) => r.id === id);
    if (idx !== -1) DEMO_RECEIPTS.splice(idx, 1);
    return;
  }

  const { error } = await supabase.from('receipts').delete().eq('id', id);
  if (error) throw error;
}

export async function createReceiptItem(item: {
  receipt_id: string;
  item_name: string;
  quantity?: number;
  price: number;
}) {
  if (item.receipt_id.startsWith('rc-')) {
    const newItem: ReceiptItem = { id: 'ri-demo-' + Date.now(), quantity: 1, ...item };
    const receipt = DEMO_RECEIPTS.find((r) => r.id === item.receipt_id);
    if (receipt) receipt.items.push(newItem);
    return newItem;
  }

  const { data, error } = await supabase.from('receipt_items').insert(item).select().single();
  if (error) throw error;
  return data as ReceiptItem;
}

export async function getReportsData(userId: string, months: number = 6) {
  if (isDemo(userId)) {
    const now = new Date();
    const startDate = subMonths(startOfMonth(now), months - 1);
    const data = DEMO_TRANSACTIONS.filter((t) => new Date(t.date) >= startDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const monthlyData: Record<string, { income: number; expenses: number; profit: number }> = {};
    data.forEach((t) => {
      const month = format(new Date(t.date), 'MMM yyyy');
      if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, profit: 0 };
      if (t.type === 'income') monthlyData[month].income += Number(t.amount);
      else monthlyData[month].expenses += Number(t.amount);
      monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses;
    });

    const categoryData: Record<string, number> = {};
    data.filter((t) => t.type === 'expense').forEach((t) => {
      categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
    });

    return {
      monthlyData,
      categoryData,
      totalIncome: data.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
      totalExpenses: data.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
    };
  }

  const now = new Date();
  const startDate = subMonths(startOfMonth(now), months - 1);
  const { data, error } = await supabase.from('transactions').select('*').eq('user_id', userId).gte('date', startDate.toISOString()).order('date', { ascending: true });
  if (error) throw error;

  const monthlyData: Record<string, { income: number; expenses: number; profit: number }> = {};
  data.forEach((transaction) => {
    const month = format(new Date(transaction.date), 'MMM yyyy');
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0, profit: 0 };
    if (transaction.type === 'income') monthlyData[month].income += Number(transaction.amount);
    else monthlyData[month].expenses += Number(transaction.amount);
    monthlyData[month].profit = monthlyData[month].income - monthlyData[month].expenses;
  });

  const categoryData: Record<string, number> = {};
  data.filter((t) => t.type === 'expense').forEach((t) => {
    categoryData[t.category] = (categoryData[t.category] || 0) + Number(t.amount);
  });

  return {
    monthlyData,
    categoryData,
    totalIncome: data.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0),
    totalExpenses: data.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0),
  };
}
