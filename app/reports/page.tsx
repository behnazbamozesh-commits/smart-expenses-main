'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getReportsData, getTransactions, getReceipts } from '@/lib/data';
import { Transaction, Receipt } from '@/lib/supabase';
import { format, subMonths, startOfMonth } from 'date-fns';
import { Download, TrendingUp, TrendingDown, DollarSign, ChartPie as PieChart, ChartBar as BarChart3, CircleCheck as CheckCircle2 } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { T2125TaxSummary } from '@/components/reports/T2125TaxSummary';
import { ReportsSkeleton } from '@/components/ui/skeleton-loader';
import { toast } from 'sonner';

const COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
];

export default function ReportsPage() {
  const { user } = useAuth();
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState<'3' | '6' | '12'>('6');
  const [reportsData, setReportsData] = useState<{
    monthlyData: Record<string, { income: number; expenses: number; profit: number; personalExpenses: number; businessExpenses: number }>;
    categoryData: Record<string, number>;
    totalIncome: number;
    totalExpenses: number;
    personalExpenses: number;
    businessExpenses: number;
  } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<(Receipt & { items?: { item_name: string; quantity: number; price: number }[] })[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, timeRange]);

  const loadData = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const months = parseInt(timeRange);
      const [reports, txData, rctData] = await Promise.all([
        getReportsData(user.id, months),
        getTransactions(user.id),
        getReceipts(user.id),
      ]);
      setReportsData(reports);
      setTransactions(txData);
      setReceipts(rctData);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      // Create CSV content for transactions
      const transactionHeaders = ['Date', 'Type', 'Account', 'Category', 'Amount', 'Description', 'Source'];
      const transactionRows = transactions.map((tx) => [
        tx.date,
        tx.type,
        tx.transaction_type || 'personal',
        tx.category,
        tx.amount.toString(),
        tx.description || '',
        tx.source,
      ]);

      const transactionsCSV = [
        transactionHeaders.join(','),
        ...transactionRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      ].join('\n');

      // Create CSV content for receipts
      const receiptHeaders = ['Date', 'Store', 'Subtotal', 'Tax', 'Total', 'Items'];
      const receiptRows = receipts.map((r) => [
        r.receipt_date || '',
        r.store_name || '',
        r.subtotal?.toString() || '',
        r.tax?.toString() || '',
        r.total?.toString() || '',
        r.items?.map((i) => `${i.item_name} (${i.quantity})`).join('; ') || '',
      ]);

      const receiptsCSV = [
        receiptHeaders.join(','),
        ...receiptRows.map((r) => r.map((c) => `"${c}"`).join(',')),
      ].join('\n');

      // Download transactions
      const txBlob = new Blob([transactionsCSV], { type: 'text/csv' });
      const txUrl = URL.createObjectURL(txBlob);
      const txLink = document.createElement('a');
      txLink.href = txUrl;
      txLink.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      txLink.click();
      URL.revokeObjectURL(txUrl);

      // Download receipts
      const rctBlob = new Blob([receiptsCSV], { type: 'text/csv' });
      const rctUrl = URL.createObjectURL(rctBlob);
      const rctLink = document.createElement('a');
      rctLink.href = rctUrl;
      rctLink.download = `receipts_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      rctLink.click();
      URL.revokeObjectURL(rctUrl);

      toast.success(isRTL ? 'خروجی با موفقیت انجام شد' : 'Data exported successfully!', {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
        description: isRTL ? `${transactions.length} تراکنش و ${receipts.length} رسید دانلود شد` : `${transactions.length} transactions and ${receipts.length} receipts downloaded`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isRTL ? 'خطا در خروجی' : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const monthlyChartData = reportsData
    ? Object.entries(reportsData.monthlyData).map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
        profit: data.profit,
      }))
    : [];

  // Category data is now Personal/Business breakdown
  const categoryChartData = reportsData
    ? [
        { category: 'Personal (Family)', amount: reportsData.personalExpenses || 0 },
        { category: 'Business', amount: reportsData.businessExpenses || 0 },
      ].filter(c => c.amount > 0)
    : [];

  const pieChartData = categoryChartData.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
  }));

  if (loading) {
    return (
      <AppLayout title={t('reports')}>
        <ReportsSkeleton />
      </AppLayout>
    );
  }

  return (
    <AppLayout title={t('reports')}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-bold text-white ${isRTL ? 'font-vazir' : ''}`}>{t('reportsAndAnalytics')}</h1>
            <p className={`text-slate-400 mt-1 ${isRTL ? 'font-vazir' : ''}`}>{t('viewFinancialInsights')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as typeof timeRange)}>
              <SelectTrigger className="w-[150px] bg-slate-800 border-slate-700 text-white">
                <SelectValue placeholder={t('timeRange')} />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="3">{t('last3MonthsOpt')}</SelectItem>
                <SelectItem value="6">{t('last6MonthsOpt')}</SelectItem>
                <SelectItem value="12">{t('last12MonthsOpt')}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={exportToExcel}
              disabled={exporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? t('exporting') : t('exportCsv')}
            </Button>
          </div>
        </div>

        {reportsData && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Income</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-400">{formatCurrency(reportsData.totalIncome)}</div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Total Expenses</CardTitle>
                  <TrendingDown className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-400">{formatCurrency(reportsData.totalExpenses)}</div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Net Profit</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${reportsData.totalIncome - reportsData.totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatCurrency(reportsData.totalIncome - reportsData.totalExpenses)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-800/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">Top Spending</CardTitle>
                  <PieChart className="h-4 w-4 text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {(reportsData?.businessExpenses || 0) > (reportsData?.personalExpenses || 0) ? 'Business' : 'Personal'}
                  </div>
                  <p className="text-sm text-slate-500">
                    {formatCurrency(Math.max(reportsData?.businessExpenses || 0, reportsData?.personalExpenses || 0))}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-slate-800 border-slate-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="categories" className="data-[state=active]:bg-emerald-600">
                  Categories
                </TabsTrigger>
                <TabsTrigger value="trends" className="data-[state=active]:bg-emerald-600">
                  Trends
                </TabsTrigger>
                <TabsTrigger value="tax" className="data-[state=active]:bg-emerald-600">
                  Tax (T2125)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Monthly Overview
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Income vs expenses over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ChartContainer
                        config={{
                          income: { label: 'Income', color: '#10b981' },
                          expenses: { label: 'Expenses', color: '#ef4444' },
                          profit: { label: 'Profit', color: '#3b82f6' },
                        }}
                      >
                        <BarChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="month"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Expenses by Account Type
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        {pieChartData.length > 0 ? (
                          <ChartContainer
                            config={{
                              amount: { label: 'Amount', color: '#10b981' },
                            }}
                          >
                            <RechartsPieChart>
                              <Pie
                                data={pieChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="amount"
                              >
                                {pieChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <ChartTooltip content={<ChartTooltipContent />} />
                            </RechartsPieChart>
                          </ChartContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">
                            No expense data available
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {pieChartData.map((item, index) => (
                          <div key={item.category} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-sm text-slate-400 truncate">{item.category}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-800/50">
                    <CardHeader>
                      <CardTitle className="text-white">Personal vs Business</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {categoryChartData.length > 0 ? categoryChartData.map((item, index) => (
                          <div key={item.category} className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm text-slate-300">{item.category}</span>
                                <span className="text-sm text-white">{formatCurrency(item.amount)}</span>
                              </div>
                              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${(item.amount / (Math.max(...categoryChartData.map(c => c.amount)) || 1)) * 100}%`,
                                    backgroundColor: COLORS[index % COLORS.length],
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center text-slate-400 py-8">
                            No expense data available
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="trends" className="space-y-6">
                <Card className="border-slate-700 bg-slate-800/50">
                  <CardHeader>
                    <CardTitle className="text-white">Profit Trend</CardTitle>
                    <CardDescription className="text-slate-400">
                      Track your profit over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px]">
                      <ChartContainer
                        config={{
                          profit: { label: 'Profit', color: '#3b82f6' },
                        }}
                      >
                        <LineChart data={monthlyChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="month"
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#9ca3af"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                          />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Line
                            type="monotone"
                            dataKey="profit"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tax" className="space-y-6">
                <T2125TaxSummary transactions={transactions} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppLayout>
  );
}
