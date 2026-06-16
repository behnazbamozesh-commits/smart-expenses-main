'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/app';
import { DashboardStats, RecentTransactions, QuickActions } from '@/components/dashboard';
import { getDashboardData } from '@/lib/data';
import { Transaction } from '@/lib/supabase';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<{
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    largestCategory: { category: string; amount: number } | null;
    recentTransactions: Transaction[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      if (!user) return;
      const data = await getDashboardData(user.id);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!dashboardData) {
    return (
      <AppLayout title={t('dashboard')}>
        <div className="text-center py-12">
          <p className="text-slate-400">{t('failedToLoad')}</p>
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

        <DashboardStats
          totalIncome={dashboardData.totalIncome}
          totalExpenses={dashboardData.totalExpenses}
          netProfit={dashboardData.netProfit}
          largestCategory={dashboardData.largestCategory}
        />

        <div className="grid gap-6 lg:grid-cols-2">
          <RecentTransactions transactions={dashboardData.recentTransactions} />
          <QuickActions />
        </div>
      </div>
    </AppLayout>
  );
}
