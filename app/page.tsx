'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/app';
import { DashboardStats, RecentTransactions, QuickActions } from '@/components/dashboard';
import { getTransactions } from '@/lib/data';
import { Transaction } from '@/lib/supabase';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const data = await getTransactions(user.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  if (authLoading || loading) {
    return (
      <AppLayout title={t('dashboard')}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-32 mt-2 bg-slate-700" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg bg-slate-800" />
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-lg bg-slate-800" />
            <Skeleton className="h-96 rounded-lg bg-slate-800" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('dashboard')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">{t('dashboard')}</h1>
            <p className="text-slate-400 flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'MMMM yyyy')}
            </p>
          </div>
        </div>

        <DashboardStats transactions={transactions} />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions transactions={recentTransactions} />
          <QuickActions />
        </div>
      </div>
    </AppLayout>
  );
}
