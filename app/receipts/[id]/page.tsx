'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Receipt, ReceiptItem } from '@/lib/supabase';
import { getReceipt, deleteReceipt } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Store, Calendar, DollarSign, FileText, Trash2, ShoppingBag } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [receipt, setReceipt] = useState<(Receipt & { items: ReceiptItem[] }) | null>(null);

  useEffect(() => {
    if (user && id) {
      loadReceipt();
    }
  }, [user, id]);

  const loadReceipt = async () => {
    try {
      if (!user) return;
      const data = await getReceipt(user.id, id);
      setReceipt(data);
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast.error('Failed to load receipt');
      router.push('/receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteReceipt(id);
      toast.success('Receipt deleted');
      router.push('/receipts');
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast.error('Failed to delete receipt');
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  if (loading) {
    return (
      <AppLayout title="Receipt Details">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48 bg-slate-700" />
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-96 rounded-lg bg-slate-800" />
            <Skeleton className="h-96 rounded-lg bg-slate-800" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!receipt) {
    return null;
  }

  return (
    <AppLayout title="Receipt Details">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/receipts">
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white">{receipt.store_name || 'Receipt'}</h1>
              <p className="text-slate-400 mt-1">
                {receipt.receipt_date ? format(new Date(receipt.receipt_date), 'MMMM d, yyyy') : 'No date'}
              </p>
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
                <AlertDialogTitle className="text-white">Delete Receipt</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-400">
                  Are you sure you want to delete this receipt? This action cannot be undone.
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

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Receipt Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-slate-900">
                <Image
                  src={receipt.image_url}
                  alt="Receipt"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.pexels.com/pexels-4226140/pexels-4226140.jpeg?auto=compress&cs=tinysrgb&w=600';
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Store className="h-5 w-5" />
                  Receipt Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Status</span>
                  <Badge className={statusColors[receipt.status]} variant="outline">
                    {receipt.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Store className="h-4 w-4" /> Store
                  </span>
                  <span className="text-white">{receipt.store_name || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Date
                  </span>
                  <span className="text-white">
                    {receipt.receipt_date ? format(new Date(receipt.receipt_date), 'MMM d, yyyy') : 'Unknown'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Amounts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">{formatCurrency(receipt.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tax</span>
                  <span className="text-white">{formatCurrency(receipt.tax)}</span>
                </div>
                <Separator className="bg-slate-700" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Total</span>
                  <span className="text-emerald-400 font-semibold text-lg">{formatCurrency(receipt.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {receipt.items && receipt.items.length > 0 && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Purchased Items ({receipt.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Item</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-slate-400">Qty</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Price</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-slate-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {receipt.items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-900/30">
                        <td className="px-4 py-3 text-white">{item.item_name}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{item.quantity}</td>
                        <td className="px-4 py-3 text-right text-slate-400">{formatCurrency(item.price)}</td>
                        <td className="px-4 py-3 text-right text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {receipt.raw_text && (
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Raw OCR Text</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm text-slate-400 whitespace-pre-wrap font-mono bg-slate-900/50 p-4 rounded-lg">
                {receipt.raw_text}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
