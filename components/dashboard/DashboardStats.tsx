'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, ChartPie as PieChart, ArrowUpRight, ArrowDownRight, Wallet, Briefcase, Chrome as Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Transaction } from '@/lib/supabase';

interface DashboardStatsProps {
  transactions: Transaction[];
}

export function DashboardStats({ transactions }: DashboardStatsProps) {
  const { t, language, isRTL } = useLanguage();
  const [filterType, setFilterType] = useState<'all' | 'business' | 'personal'>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter transactions based on selected type
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.transaction_type === filterType || tx.transaction_type === 'all';
  });

  // Calculate stats from filtered transactions
  const totalIncome = filteredTransactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const totalExpenses = filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const netProfit = totalIncome - totalExpenses;

  // Find largest expense category
  const expensesByCategory: Record<string, number> = {};
  filteredTransactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + Number(tx.amount);
    });

  const largestCategory = Object.entries(expensesByCategory).sort(([, a], [, b]) => b - a)[0];

  const filterButtons = [
    { key: 'all' as const, icon: Wallet, label: isRTL ? 'همه' : 'All' },
    { key: 'business' as const, icon: Briefcase, label: isRTL ? 'کسب‌وکار' : 'Business' },
    { key: 'personal' as const, icon: Home, label: isRTL ? 'خانواده' : 'Family' },
  ];

  const stats = [
    {
      title: t('totalIncome'),
      value: formatCurrency(totalIncome),
      icon: TrendingUp,
      iconColor: 'text-emerald-500',
      bgIconColor: 'bg-emerald-500/10',
      trend: null,
    },
    {
      title: t('totalExpenses'),
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      iconColor: 'text-red-400',
      bgIconColor: 'bg-red-400/10',
      trend: null,
    },
    {
      title: t('netProfit'),
      value: formatCurrency(netProfit),
      icon: DollarSign,
      iconColor: netProfit >= 0 ? 'text-emerald-500' : 'text-red-400',
      bgIconColor: netProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-400/10',
      trend: netProfit >= 0 ? 'up' : 'down',
    },
    {
      title: t('largestExpense'),
      value: largestCategory ? largestCategory[0] : 'N/A',
      subValue: largestCategory ? formatCurrency(largestCategory[1]) : undefined,
      icon: PieChart,
      iconColor: 'text-amber-400',
      bgIconColor: 'bg-amber-400/10',
      trend: null,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <h2 className="text-lg font-semibold text-white">
          {isRTL ? 'فیلتر نوع حساب' : 'Account Type Filter'}
        </h2>
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-700">
          {filterButtons.map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterType(btn.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
                filterType === btn.key
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <btn.icon className="w-4 h-4" />
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-slate-700 bg-slate-800/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">{stat.title}</CardTitle>
              <div className={cn('rounded-lg p-2', stat.bgIconColor)}>
                <stat.icon className={cn('h-4 w-4', stat.iconColor)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {stat.trend === 'up' && <ArrowUpRight className="h-4 w-4 text-emerald-500" />}
                {stat.trend === 'down' && <ArrowDownRight className="h-4 w-4 text-red-400" />}
                <div className="text-2xl font-bold text-white">{stat.value}</div>
              </div>
              {stat.subValue && <p className="text-xs text-slate-500 mt-1">{stat.subValue}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
