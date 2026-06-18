'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createTransaction } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CircleAlert as AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewTransactionPage() {
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [transactionType, setTransactionType] = useState<'personal' | 'business'>('personal');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || !date) {
      setError('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error('User not authenticated');

      // Auto-assign category based on account type
      const category = transactionType === 'business' ? 'Business' : 'Personal';

      await createTransaction({
        user_id: user.id,
        type,
        amount: amountNum,
        category,
        date,
        description: description || undefined,
        source: 'manual',
        transaction_type: transactionType,
      });

      toast.success('Transaction created successfully');
      router.push('/transactions');
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError('Failed to create transaction');
      setLoading(false);
    }
  };

  return (
    <AppLayout title="Add Transaction">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">{isRTL ? 'افزودن تراکنش' : 'Add Transaction'}</h1>
            <p className="text-slate-400 mt-1">{isRTL ? 'ثبت درآمد یا هزینه جدید' : 'Record a new income or expense'}</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">{isRTL ? 'جزئیات تراکنش' : 'Transaction Details'}</CardTitle>
            <CardDescription className="text-slate-400">
              {isRTL ? 'جزئیات تراکنش خود را وارد کنید' : 'Enter the details of your transaction'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <Label className="text-slate-300">{isRTL ? 'نوع تراکنش' : 'Transaction Type'}</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as 'income' | 'expense')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" className="border-slate-600 text-emerald-500" />
                    <Label htmlFor="expense" className="text-slate-300 cursor-pointer">{isRTL ? 'هزینه' : 'Expense'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" className="border-slate-600 text-emerald-500" />
                    <Label htmlFor="income" className="text-slate-300 cursor-pointer">{isRTL ? 'درآمد' : 'Income'}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-300">{isRTL ? 'نوع حساب' : 'Account Type'} <span className="text-red-400">*</span></Label>
                <RadioGroup
                  value={transactionType}
                  onValueChange={(v) => setTransactionType(v as typeof transactionType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="personal" id="personal" className="border-slate-600 text-emerald-500" />
                    <Label htmlFor="personal" className="text-slate-300 cursor-pointer">{isRTL ? 'خانواده (شخصی)' : 'Family (Personal)'}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="business" id="business" className="border-slate-600 text-emerald-500" />
                    <Label htmlFor="business" className="text-slate-300 cursor-pointer">{isRTL ? 'کسب‌وکار' : 'Business'}</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-slate-300">
                    {isRTL ? 'مبلغ' : 'Amount'} <span className="text-red-400">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date" className="text-slate-300">
                    {isRTL ? 'تاریخ' : 'Date'} <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">{isRTL ? 'توضیحات (اختیاری)' : 'Description (Optional)'}</Label>
                <Textarea
                  id="description"
                  placeholder={isRTL ? 'یادداشتی درباره این تراکنش اضافه کنید...' : 'Add a note about this transaction...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/transactions" className="flex-1">
                  <Button variant="outline" type="button" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                    {isRTL ? 'انصراف' : 'Cancel'}
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={loading}>
                  {loading ? (isRTL ? 'در حال ایجاد...' : 'Creating...') : (isRTL ? 'ایجاد تراکنش' : 'Create Transaction')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
