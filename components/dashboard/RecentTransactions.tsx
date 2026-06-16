'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Transaction } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const { t, language } = useLanguage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'fa' ? 'fa-IR' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-white">{t('recentTransactions')}</CardTitle>
        <Link href="/transactions" className="text-sm text-emerald-400 hover:text-emerald-300">
          {t('viewAll')}
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-500">{t('noTransactions')}</p>
            <p className="text-sm text-slate-600 mt-1">{t('addFirstTransaction')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 hover:bg-slate-900/70 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
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
                    <p className="font-medium text-white">{transaction.description || transaction.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge
                        variant="secondary"
                        className="text-xs bg-slate-700 text-slate-300 hover:bg-slate-700"
                      >
                        {transaction.category}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(transaction.date), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                <span
                  className={`font-semibold ${
                    transaction.type === 'income' ? 'text-emerald-500' : 'text-red-400'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
