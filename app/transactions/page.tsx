'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Transaction } from '@/lib/supabase';
import { getTransactions, deleteTransaction } from '@/lib/data';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, Search, Plus, Trash2, CreditCard as Edit, CircleCheck as CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TransactionListSkeleton } from '@/components/ui/skeleton-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { toast } from 'sonner';

export default function TransactionsPage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'this-month' | 'last-month' | 'last-3-months' | 'all'>('this-month');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, dateRange]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      if (!user) return;

      let range: { start: Date; end: Date } | undefined;
      const now = new Date();

      switch (dateRange) {
        case 'this-month':
          range = { start: startOfMonth(now), end: endOfMonth(now) };
          break;
        case 'last-month':
          const lastMonth = subMonths(now, 1);
          range = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
          break;
        case 'last-3-months':
          range = { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
          break;
        case 'all':
          range = undefined;
          break;
      }

      const data = await getTransactions(user.id, range);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success(t('successfullyDeleted'), {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
      });
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(t('failedToDelete'));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  const allCategories = Array.from(new Set(transactions.map((t) => t.category)));

  return (
    <AppLayout title={t('transactions')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold text-white ${isRTL ? 'font-vazir' : ''}`}>{t('transactions')}</h1>
            <p className={`text-slate-400 mt-1 ${isRTL ? 'font-vazir' : ''}`}>{t('manageYourFinances')}</p>
          </div>
          <Link href="/transactions/new">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <Plus className="h-4 w-4" />
              {t('addTransaction')}
            </Button>
          </Link>
        </div>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="relative flex-1">
                <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500`} />
                <Input
                  placeholder={t('searchTransactions')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pr-9' : 'pl-9'} bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
                  <SelectTrigger className="w-[130px] bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue placeholder={t('transactionType')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">{t('allTypes')}</SelectItem>
                    <SelectItem value="income">{t('income')}</SelectItem>
                    <SelectItem value="expense">{t('expense')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue placeholder={t('category')} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
                  <SelectTrigger className="w-[150px] bg-slate-900/50 border-slate-600 text-white">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TransactionListSkeleton count={5} />
            ) : filteredTransactions.length === 0 ? (
              <EmptyState
                type={searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' ? 'search' : 'transactions'}
                title={searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' ? t('noTransactionsMatchFilter') : t('noTransactions')}
                description={searchQuery || typeFilter !== 'all' || categoryFilter !== 'all' ? t('adjustingFilters') : t('addFirstTransaction')}
              />
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2.5 rounded-full ${
                          transaction.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-red-400/10 text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {transaction.description || transaction.category}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-700"
                          >
                            {transaction.category}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {format(new Date(transaction.date), 'MMM d, yyyy')}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-600 text-slate-400"
                          >
                            {transaction.source}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`font-semibold ${
                          transaction.type === 'income' ? 'text-emerald-500' : 'text-red-400'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/transactions/${transaction.id}`)}
                          className="text-slate-400 hover:text-white hover:bg-slate-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-400 hover:text-red-400 hover:bg-slate-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-slate-800 border-slate-700">
                            <AlertDialogHeader>
                              <AlertDialogTitle className={`text-white ${isRTL ? 'font-vazir' : ''}`}>{t('delete')} {t('transactions')}</AlertDialogTitle>
                              <AlertDialogDescription className={`text-slate-400 ${isRTL ? 'font-vazir' : ''}`}>
                                {t('thisActionCannotBeUndone')}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
                                {t('cancel')}
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(transaction.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                {t('delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
