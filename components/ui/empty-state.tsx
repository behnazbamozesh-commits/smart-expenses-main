'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { FileX, Inbox, Search, Receipt, TrendingUp, CreditCard, Video as LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  type?: 'transactions' | 'receipts' | 'reports' | 'search' | 'default';
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  type = 'default',
}: EmptyStateProps) {
  const { t, isRTL } = useLanguage();

  const config = {
    transactions: {
      icon: CreditCard,
      title: title || t('noTransactions'),
      description: description || t('addFirstTransaction'),
      actionLabel: actionLabel || t('addTransaction'),
      actionHref: actionHref || '/transactions/new',
    },
    receipts: {
      icon: Receipt,
      title: title || t('noReceipts'),
      description: description || t('scanFirstReceipt'),
      actionLabel: actionLabel || t('scanReceipt'),
      actionHref: actionHref || '/receipts/scan',
    },
    reports: {
      icon: TrendingUp,
      title: title || t('noDataAvailable'),
      description: description || t('startByAdding'),
      actionLabel: actionLabel || t('addTransaction'),
      actionHref: actionHref || '/transactions/new',
    },
    search: {
      icon: Search,
      title: title || t('noTransactionsMatchFilter'),
      description: description || t('adjustingFilters'),
      actionLabel: undefined,
      actionHref: undefined,
    },
    default: {
      icon: Icon || Inbox,
      title: title || t('nothingHere'),
      description: description || t('startByAdding'),
      actionLabel: undefined,
      actionHref: undefined,
    },
  };

  const { icon: DefaultIcon, title: defaultTitle, description: defaultDesc, actionLabel: defaultAction, actionHref: defaultHref } = config[type] || config.default;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative">
        <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full scale-150" />
        <div className="relative p-6 rounded-full bg-slate-800/80 border border-slate-700">
          <DefaultIcon className="h-12 w-12 text-slate-500" />
        </div>
      </div>
      <h3 className={`mt-6 text-xl font-semibold text-white ${isRTL ? 'font-vazir' : ''}`}>
        {defaultTitle}
      </h3>
      <p className={`mt-2 text-slate-400 text-center max-w-sm ${isRTL ? 'font-vazir' : ''}`}>
        {defaultDesc}
      </p>
      {(defaultAction || onAction) && (
        <div className="mt-6">
          {defaultHref ? (
            <Link href={defaultHref}>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {defaultAction}
              </Button>
            </Link>
          ) : onAction ? (
            <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {defaultAction}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
