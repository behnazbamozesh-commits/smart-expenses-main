'use client';

import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { useLanguage } from '@/contexts/LanguageContext';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title = 'Dashboard' }: AppLayoutProps) {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-slate-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="hidden lg:block">
        <AppSidebar />
      </div>
      <div className={`lg:pl-64 ${isRTL ? 'lg:pr-64 lg:pl-0' : ''}`}>
        <AppHeader title={title} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
