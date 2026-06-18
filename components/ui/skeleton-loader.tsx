'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TransactionSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-700" />
          <Skeleton className="h-3 w-24 bg-slate-700" />
        </div>
      </div>
      <Skeleton className="h-4 w-16 bg-slate-700" />
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  );
}

export function ReceiptSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 rounded-lg bg-slate-700" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32 bg-slate-700" />
          <Skeleton className="h-3 w-24 bg-slate-700" />
          <Skeleton className="h-3 w-16 bg-slate-700" />
        </div>
      </div>
    </div>
  );
}

export function ReceiptListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <ReceiptSkeleton key={i} />
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900/50 border border-slate-800">
        <Skeleton className="h-6 w-32 bg-slate-700" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20 bg-slate-700" />
          <Skeleton className="h-10 w-20 bg-slate-700" />
          <Skeleton className="h-10 w-20 bg-slate-700" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 rounded-lg border border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-4 w-20 bg-slate-700" />
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-700" />
            </div>
            <Skeleton className="h-8 w-32 mt-2 bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <Skeleton className="h-6 w-48 bg-slate-700" />
        <div className="mt-4 space-y-3">
          <TransactionListSkeleton count={3} />
        </div>
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48 bg-slate-700" />
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 bg-slate-700" />
          <Skeleton className="h-10 w-28 bg-slate-700" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-slate-700 bg-slate-800/50">
            <div className="flex items-center justify-between pb-2">
              <Skeleton className="h-4 w-24 bg-slate-700" />
              <Skeleton className="h-8 w-8 rounded-lg bg-slate-700" />
            </div>
            <Skeleton className="h-6 w-24 mt-2 bg-slate-700" />
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 h-96">
        <div className="p-6">
          <Skeleton className="h-6 w-32 bg-slate-700" />
          <div className="mt-6 h-64 w-full bg-slate-700/50 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800/50">
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-32 bg-slate-700" />
        <Skeleton className="h-4 w-full bg-slate-700" />
        <Skeleton className="h-4 w-3/4 bg-slate-700" />
        <Skeleton className="h-10 w-full bg-slate-700" />
      </div>
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-20 bg-slate-700" />
          <Skeleton className="h-10 w-full bg-slate-700" />
        </div>
      ))}
      <Skeleton className="h-10 w-full bg-slate-700" />
    </div>
  );
}
