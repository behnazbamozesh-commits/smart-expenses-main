'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Receipt, PlusCircle, FileSpreadsheet, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function QuickActions() {
  const { t } = useLanguage();

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <CardTitle className="text-white">{t('quickActions')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/transactions/new">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <PlusCircle className="h-5 w-5" />
              <span className="text-sm">{t('addTransaction')}</span>
            </Button>
          </Link>
          <Link href="/receipts/scan">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <Receipt className="h-5 w-5" />
              <span className="text-sm">{t('scanReceipt')}</span>
            </Button>
          </Link>
          <Link href="/reports">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">{t('viewReports')}</span>
            </Button>
          </Link>
          <Link href="/reports?export=true">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col gap-2 border-slate-600 hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <FileSpreadsheet className="h-5 w-5" />
              <span className="text-sm">{t('exportData')}</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
