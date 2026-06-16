'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface DashboardStatsProps {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  largestCategory: { category: string; amount: number } | null;
}

export function DashboardStats({
  totalIncome,
  totalExpenses,
  netProfit,
  largestCategory,
}: DashboardStatsProps) {
  const { t, language } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

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
      value: largestCategory ? largestCategory.category : 'N/A',
      subValue: largestCategory ? formatCurrency(largestCategory.amount) : undefined,
      icon: PieChart,
      iconColor: 'text-amber-400',
      bgIconColor: 'bg-amber-400/10',
      trend: null,
    },
  ];

  return (
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
  );
}
