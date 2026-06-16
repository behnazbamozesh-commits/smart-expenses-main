'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Transaction, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/lib/supabase';
import { getTransactions, updateTransaction, deleteTransaction } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (user && id) {
      loadTransaction();
    }
  }, [user, id]);

  const loadTransaction = async () => {
    try {
      if (!user) return;
      const transactions = await getTransactions(user.id);
      const found = transactions.find((t) => t.id === id);
      if (found) {
        setTransaction(found);
        setType(found.type);
        setAmount(found.amount.toString());
        setCategory(found.category);
        setDate(found.date);
        setDescription(found.description || '');
      } else {
        toast.error('Transaction not found');
        router.push('/transactions');
      }
    } catch (err) {
      console.error('Error loading transaction:', err);
      toast.error('Failed to load transaction');
    } finally {
      setLoading(false);
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || !category || !date) {
      setError('Please fill in all required fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setSaving(true);

    try {
      await updateTransaction(id, {
        type,
        amount: amountNum,
        category,
        date,
        description: description || null,
      });

      toast.success('Transaction updated successfully');
      router.push('/transactions');
    } catch (err) {
      console.error('Error updating transaction:', err);
      setError('Failed to update transaction');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTransaction(id);
      toast.success('Transaction deleted');
      router.push('/transactions');
    } catch (err) {
      console.error('Error deleting transaction:', err);
      toast.error('Failed to delete transaction');
    }
  };

  if (loading) {
    return (
      <AppLayout title="Edit Transaction">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-slate-700 rounded" />
            <div className="h-96 bg-slate-800 rounded-lg" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!transaction) {
    return null;
  }

  return (
    <AppLayout title="Edit Transaction">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/transactions">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">Edit Transaction</h1>
              <p className="text-slate-400 mt-1">Update transaction details</p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-slate-800 border-slate-700">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-white">Delete Transaction</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Are you sure you want to delete this transaction? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600 border-slate-600">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-600 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Transaction Details</CardTitle>
            <CardDescription className="text-slate-400">
              Make changes to your transaction
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
                <Label className="text-slate-300">Transaction Type</Label>
                <RadioGroup
                  value={type}
                  onValueChange={(v) => {
                    setType(v as 'income' | 'expense');
                    setCategory('');
                  }}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="expense" id="expense" className="border-slate-600 text-emerald-500" />
                    <Label htmlFor="expense" className="text-slate-300 cursor-pointer">Expense</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="income" id="income" className="border-slate-600 text-emerald-500" />
                    <Label htmlFor="income" className="text-slate-300 cursor-pointer">Income</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-slate-300">
                    Amount <span className="text-red-400">*</span>
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
                    Date <span className="text-red-400">*</span>
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
                <Label htmlFor="category" className="text-slate-300">
                  Category <span className="text-red-400">*</span>
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-white hover:bg-slate-700">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a note about this transaction..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-emerald-500 min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/transactions" className="flex-1">
                  <Button variant="outline" type="button" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
