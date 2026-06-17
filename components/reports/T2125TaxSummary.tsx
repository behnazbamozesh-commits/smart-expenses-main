'use client';

import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CircleHelp as HelpCircle, Landmark, Copy, Check } from 'lucide-react';
import { Transaction } from '@/lib/supabase';

// T2125 expense category mapping
const T2125_CATEGORIES: { code: string; labelEn: string; labelFa: string; matchedCategories: string[] }[] = [
  { code: '8520', labelEn: 'Advertising', labelFa: 'تبلیغات', matchedCategories: ['Business', 'Shopping'] },
  { code: '8730', labelEn: 'Internet & Telecommunications', labelFa: 'اینترنت و مخابرات', matchedCategories: ['Bills & Utilities'] },
  { code: '8810', labelEn: 'Office Supplies & Expenses', labelFa: 'لوازم و هزینه‌های اداری', matchedCategories: ['Business', 'Shopping', 'Education'] },
  { code: '8510', labelEn: 'Meals & Entertainment', labelFa: 'غذا و سرگرمی', matchedCategories: ['Food & Dining', 'Entertainment'] },
  { code: '8740', labelEn: 'Transportation & Delivery', labelFa: 'حمل‌ونقل و تحویل', matchedCategories: ['Transportation'] },
  { code: '8760', labelEn: 'Travel', labelFa: 'سفر', matchedCategories: ['Travel'] },
  { code: '8660', labelEn: 'Insurance', labelFa: 'بیمه', matchedCategories: ['Bills & Utilities', 'Healthcare'] },
  { code: '8620', labelEn: 'Professional Fees', labelFa: 'هزینه‌های حرفه‌ای', matchedCategories: ['Healthcare', 'Education'] },
  { code: '8710', labelEn: 'Rent', labelFa: 'اجاره', matchedCategories: ['Bills & Utilities', 'Home & Garden'] },
  { code: '8870', labelEn: 'Capital Cost Allowance (CCA)', labelFa: 'کاهش هزینه سرمایه', matchedCategories: [] },
  { code: '8850', labelEn: 'Maintenance & Repairs', labelFa: 'نگهداری و تعمیرات', matchedCategories: ['Home & Garden'] },
  { code: '8640', labelEn: 'Salaries, Wages & Benefits', labelFa: 'حقوق و مزایا', matchedCategories: ['Business'] },
  { code: '8782', labelEn: 'Property Taxes', labelFa: 'مالیات املاک', matchedCategories: ['Bills & Utilities'] },
  { code: '8765', labelEn: 'Utilities (Heat, Light, Water)', labelFa: 'خدمات (گرما، برق، آب)', matchedCategories: ['Bills & Utilities'] },
  { code: '8899', labelEn: 'Other Expenses', labelFa: 'سایر هزینه‌ها', matchedCategories: ['Personal Care', 'Gifts & Donations', 'Other'] },
];

interface T2125TaxSummaryProps {
  transactions: Transaction[];
}

export function T2125TaxSummary({ transactions }: T2125TaxSummaryProps) {
  const { isRTL, language } = useLanguage();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const currentYear = new Date().getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;

  // Filter business transactions for current year
  const businessTransactions = useMemo(() =>
    transactions.filter(t =>
      t.type === 'expense' &&
      (t.transaction_type === 'business' || t.transaction_type === 'all') &&
      t.date >= yearStart &&
      t.date <= yearEnd
    ),
    [transactions, yearStart, yearEnd]
  );

  // Also include all expense transactions (for users who don't distinguish)
  const allExpenses = useMemo(() =>
    transactions.filter(t =>
      t.type === 'expense' &&
      t.date >= yearStart &&
      t.date <= yearEnd
    ),
    [transactions, yearStart, yearEnd]
  );

  // Calculate total income
  const totalIncome = useMemo(() => {
    const incomeTx = transactions.filter(t =>
      t.type === 'income' &&
      t.date >= yearStart &&
      t.date <= yearEnd
    );
    return incomeTx.reduce((sum, t) => sum + Number(t.amount), 0);
  }, [transactions, yearStart, yearEnd]);

  // Use business transactions if available, otherwise fall back to all
  const expenseSource = businessTransactions.length > 0 ? businessTransactions : allExpenses;

  // Map expenses to T2125 categories
  const t2125Data = useMemo(() => {
    return T2125_CATEGORIES.map(cat => {
      const matched = expenseSource.filter(t =>
        cat.matchedCategories.includes(t.category)
      );
      const total = matched.reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        ...cat,
        amount: total,
        count: matched.length,
      };
    }).filter(c => c.amount > 0 || c.code === '8899'); // Always show Other
  }, [expenseSource]);

  const totalExpenses = t2125Data.reduce((sum, c) => sum + c.amount, 0);
  const netIncome = totalIncome - totalExpenses;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  const copyValue = (code: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <Card className="border-slate-700 bg-slate-800/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Landmark className="h-5 w-5 text-emerald-500" />
              {isRTL ? 'خلاصه مالیاتی T2125' : 'Tax Summary (T2125)'}
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              {isRTL
                ? `خلاصه هزینه‌های خوداشتغالی برای سال ${currentYear} - فرم CRA`
                : `Self-employment expense summary for ${currentYear} — CRA Form T2125`}
            </CardDescription>
          </div>
          <TaxFilingGuide />
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-3 mb-6">
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <p className="text-xs text-slate-400">{isRTL ? 'کل درآمد' : 'Gross Income'}</p>
            <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <p className="text-xs text-slate-400">{isRTL ? 'کل هزینه‌ها' : 'Total Expenses'}</p>
            <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-900/50 border border-slate-700">
            <p className="text-xs text-slate-400">{isRTL ? 'درآمد خالص' : 'Net Income'}</p>
            <p className={`text-lg font-bold ${netIncome >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(netIncome)}
            </p>
          </div>
        </div>

        {/* T2125 Table */}
        <div className="rounded-lg border border-slate-700 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-transparent">
                <TableHead className="text-slate-400 font-semibold">
                  {isRTL ? 'کد' : 'Code'}
                </TableHead>
                <TableHead className="text-slate-400 font-semibold">
                  {isRTL ? 'دسته‌بندی T2125' : 'T2125 Category'}
                </TableHead>
                <TableHead className="text-slate-400 font-semibold text-right">
                  {isRTL ? 'مبلغ' : 'Amount'}
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {t2125Data.map((row) => (
                <TableRow key={row.code} className="border-slate-700/50 hover:bg-slate-800/50">
                  <TableCell className="text-emerald-400 font-mono text-sm">{row.code}</TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {isRTL ? row.labelFa : row.labelEn}
                  </TableCell>
                  <TableCell className="text-white font-medium text-right">
                    {row.amount > 0 ? formatCurrency(row.amount) : '—'}
                  </TableCell>
                  <TableCell>
                    {row.amount > 0 && (
                      <button
                        onClick={() => copyValue(row.code, row.amount.toFixed(2))}
                        className="text-slate-500 hover:text-emerald-400 transition-colors"
                        title="Copy value"
                      >
                        {copiedCode === row.code
                          ? <Check className="h-3.5 w-3.5 text-emerald-400" />
                          : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="border-slate-700 bg-slate-900/50">
                <TableCell />
                <TableCell className="text-white font-semibold">
                  {isRTL ? 'مجموع هزینه‌ها' : 'Total Expenses'}
                </TableCell>
                <TableCell className="text-white font-bold text-right">
                  {formatCurrency(totalExpenses)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {businessTransactions.length === 0 && allExpenses.length > 0 && (
          <p className="text-xs text-amber-400 mt-3">
            {isRTL
              ? 'توجه: چون هیچ تراکنشی با نوع «کسب‌وکار» ثبت نشده، همه هزینه‌ها نمایش داده شده‌اند. برای دقت بیشتر، نوع حساب را در تراکنش‌ها مشخص کنید.'
              : 'Note: No business-type transactions found. Showing all expenses. For accuracy, tag transactions as "Business" in the account type filter.'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Tax Filing Guide Modal
function TaxFilingGuide() {
  const { isRTL, language } = useLanguage();

  const guideSteps = isRTL ? [
    {
      title: 'قدم ۱: نرم‌افزار مالیاتی رایگان را باز کنید',
      content: 'به سایت Wealthsimple Tax (wealthsimple.com/tax) یا TurboTax Free بروید. هر دو رایگان و تأیید شده توسط CRA هستند. حساب کاربری رایگان بسازید.',
    },
    {
      title: 'قدم ۲: بخش Self-Employment را پیدا کنید',
      content: 'در نرم‌افزار، به بخش "Self-Employment" یا "Business Income" بروید. فرم T2125 به صورت خودکار باز می‌شود.',
    },
    {
      title: 'قدم ۳: درآمد ناخالص را وارد کنید',
      content: 'عدد "کل درآمد" از جدول بالا را در باکس Gross Income / Gross Revenue در نرم‌افزار وارد کنید.',
    },
    {
      title: 'قدم ۴: هزینه‌ها را خط به خط کپی کنید',
      content: 'برای هر ردیف جدول بالا که مبلغ دارد، روی آیکون کپی کلیک کنید و عدد را در باکس مربوطه در نرم‌افزار پیست کنید. هر کد T2125 دقیقاً معادل یک باکس در نرم‌افزار است.',
    },
    {
      title: 'قدم ۵: بررسی و ارسال',
      content: 'بعد از وارد کردن همه اعداد، بررسی کنید که مجموع هزینه‌ها مطابقت داشته باشد. سپس NETFILE را بزنید تا مستقیم به CRA ارسال شود.',
    },
  ] : [
    {
      title: 'Step 1: Open a Free Tax Software',
      content: 'Go to Wealthsimple Tax (wealthsimple.com/tax) or TurboTax Free. Both are CRA-approved and free for simple returns. Create a free account.',
    },
    {
      title: 'Step 2: Find the Self-Employment Section',
      content: 'In the software, navigate to "Self-Employment" or "Business Income". The T2125 form will open automatically.',
    },
    {
      title: 'Step 3: Enter Your Gross Income',
      content: 'Take the "Gross Income" number from the summary above and enter it in the Gross Income / Gross Revenue box in the software.',
    },
    {
      title: 'Step 4: Copy Expenses Line by Line',
      content: 'For each row in the table above that has an amount, click the copy icon and paste the number into the corresponding box in the tax software. Each T2125 code maps to a specific field.',
    },
    {
      title: 'Step 5: Review & Submit',
      content: 'After entering all numbers, verify that the total expenses match. Then click NETFILE to submit directly to CRA.',
    },
  ];

  const codeMapping = isRTL ? [
    { code: '8520', software: 'تبلیغات / Advertising' },
    { code: '8730', software: 'اینترنت / Internet & Telecom' },
    { code: '8810', software: 'لوازم اداری / Office Supplies' },
    { code: '8510', software: 'غذا و سرگرمی / Meals & Entertainment' },
    { code: '8740', software: 'حمل‌ونقل / Transportation' },
    { code: '8760', software: 'سفر / Travel' },
    { code: '8660', software: 'بیمه / Insurance' },
    { code: '8620', software: 'هزینه حرفه‌ای / Professional Fees' },
    { code: '8710', software: 'اجاره / Rent' },
    { code: '8870', software: 'کاهش هزینه سرمایه / CCA' },
    { code: '8850', software: 'تعمیرات / Maintenance' },
    { code: '8640', software: 'حقوق / Salaries' },
    { code: '8782', software: 'مالیات املاک / Property Tax' },
    { code: '8765', software: 'خدمات / Utilities' },
    { code: '8899', software: 'سایر / Other Expenses' },
  ] : [
    { code: '8520', software: 'Advertising' },
    { code: '8730', software: 'Internet & Telecommunications' },
    { code: '8810', software: 'Office Supplies & Expenses' },
    { code: '8510', software: 'Meals & Entertainment (50% deductible)' },
    { code: '8740', software: 'Transportation & Delivery' },
    { code: '8760', software: 'Travel' },
    { code: '8660', software: 'Insurance' },
    { code: '8620', software: 'Professional Fees (accountant, lawyer)' },
    { code: '8710', software: 'Rent (business portion only)' },
    { code: '8870', software: 'Capital Cost Allowance (CCA)' },
    { code: '8850', software: 'Maintenance & Repairs' },
    { code: '8640', software: 'Salaries, Wages & Benefits' },
    { code: '8782', software: 'Property Taxes (business portion)' },
    { code: '8765', software: 'Utilities (business portion only)' },
    { code: '8899', software: 'Other Expenses' },
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-600/10 hover:text-emerald-300"
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          {isRTL ? 'راهنمای مالیاتی' : 'Tax Filing Guide'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] bg-slate-900 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2 text-lg">
            <HelpCircle className="h-5 w-5 text-emerald-400" />
            {isRTL ? 'راهنمای گام‌به‌گام پر کردن فرم T2125' : 'Step-by-Step Guide: Filing T2125'}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-2">
          <div className="space-y-5">
            {/* Intro */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-300">
                {isRTL
                  ? 'این راهنما به شما نشان می‌دهد چگونه بدون حسابدار و با نرم‌افزار رایگان، فرم T2125 را پر کنید.'
                  : 'This guide shows you how to file your T2125 without an accountant, using free tax software.'}
              </p>
            </div>

            {/* Steps */}
            {guideSteps.map((step, i) => (
              <div key={i} className="space-y-2">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  {step.title}
                </h3>
                <p className="text-sm text-slate-300 pl-8">{step.content}</p>
              </div>
            ))}

            <Separator className="bg-slate-700" />

            {/* Code Mapping Table */}
            <div>
              <h3 className="text-white font-semibold mb-3">
                {isRTL ? 'جدول تطبیق کدها' : 'Code-to-Software Mapping'}
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {isRTL
                  ? 'هر کد T2125 در جدول بالا دقیقاً معادل این باکس در نرم‌افزار مالیاتی است:'
                  : 'Each T2125 code from the table above maps to this exact field in the tax software:'}
              </p>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700 hover:bg-transparent">
                      <TableHead className="text-slate-400">{isRTL ? 'کد' : 'Code'}</TableHead>
                      <TableHead className="text-slate-400">{isRTL ? 'باکس نرم‌افزار' : 'Software Field'}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {codeMapping.map(row => (
                      <TableRow key={row.code} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="text-emerald-400 font-mono text-sm">{row.code}</TableCell>
                        <TableCell className="text-slate-300 text-sm">{row.software}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            {/* Tips */}
            <div className="space-y-2">
              <h3 className="text-white font-semibold">
                {isRTL ? 'نکات مهم' : 'Important Tips'}
              </h3>
              <ul className="text-sm text-slate-300 space-y-1.5 list-disc list-inside">
                <li>{isRTL ? 'هزینه غذا و سرگرمی فقط ۵۰٪ قابل کسر است.' : 'Meals & Entertainment are only 50% deductible.'}</li>
                <li>{isRTL ? 'فقط بخش مرتبط با کسب‌وکار از هزینه‌ها را کسر کنید.' : 'Only deduct the business-use portion of expenses (e.g., home office %).'}</li>
                <li>{isRTL ? 'رسیدها را حداقل ۶ سال نگه دارید.' : 'Keep all receipts for at least 6 years as CRA may audit.'}</li>
                <li>{isRTL ? 'اگر درآمد بیش از ۳۰,۰۰۰ دلار در سال باشد، باید شماره GST/HST ثبت کنید.' : 'If revenue exceeds $30,000/year, you must register for a GST/HST number.'}</li>
              </ul>
            </div>

            {/* Software Links */}
            <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
              <p className="text-sm text-slate-300">
                <strong className="text-white">{isRTL ? 'نرم‌افزارهای رایگان توصیه شده:' : 'Recommended free software:'}</strong>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isRTL
                  ? 'Wealthsimple Tax — رایگان، تأیید CRA، NETFILE'
                  : 'Wealthsimple Tax — Free, CRA-approved, NETFILE certified'}
              </p>
              <p className="text-xs text-slate-400">
                {isRTL
                  ? 'TurboTax Free — رایگان برای اظهارنامه ساده، تأیید CRA'
                  : 'TurboTax Free — Free for simple returns, CRA-approved'}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
