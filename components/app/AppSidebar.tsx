'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Receipt,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LanguageSwitcher } from './LanguageSwitcher';

export function AppSidebar() {
  const { user, signOut, isDemoMode } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: t('dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('transactions'), href: '/transactions', icon: FileText },
    { name: t('receipts'), href: '/receipts', icon: Receipt },
    { name: t('reports'), href: '/reports', icon: BarChart3 },
  ];

  return (
    <aside className={`fixed top-0 z-40 h-screen w-64 bg-slate-800/50 backdrop-blur border-slate-700 flex flex-col ${isRTL ? 'right-0 border-l' : 'left-0 border-r'}`}>
      <div className="flex items-center justify-between gap-2 px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Wallet className="h-8 w-8 text-emerald-500" />
          <span className="text-xl font-bold text-white">ExpenseTracker</span>
        </div>
        <LanguageSwitcher />
      </div>

      {isDemoMode && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-400 font-medium">
            {language === 'fa' ? 'حساب دمو' : 'Demo Mode'}
          </span>
        </div>
      )}

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 space-y-2">
        <Button
          onClick={() => router.push('/transactions/new')}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2"
        >
          <PlusCircle className="h-4 w-4" />
          {t('addTransaction')}
        </Button>
        <Button
          onClick={() => router.push('/receipts/scan')}
          variant="outline"
          className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center justify-center gap-2"
        >
          <Receipt className="h-4 w-4" />
          {t('scanReceipt')}
        </Button>
      </div>

      <div className="p-3 border-t border-slate-700">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={`${isDemoMode ? 'bg-emerald-600' : 'bg-slate-600'} text-white text-sm`}>
                  {isDemoMode ? <Sparkles className="h-4 w-4" /> : (user?.email?.slice(0, 2).toUpperCase() || 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">
                  {isDemoMode ? (language === 'fa' ? 'کاربر دمو' : 'Demo User') : (user?.email?.split('@')[0] || 'User')}
                </p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isRTL ? 'start' : 'end'} className="w-56 bg-slate-800 border-slate-700">
            {!isDemoMode && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer text-slate-300 hover:text-white flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    {t('settings')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
              </>
            )}
            <DropdownMenuItem
              onClick={() => signOut()}
              className="cursor-pointer text-red-400 hover:text-red-300 focus:text-red-300 focus:bg-slate-700 flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              {isDemoMode ? (language === 'fa' ? 'خروج از دمو' : 'Exit Demo') : t('signOut')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
