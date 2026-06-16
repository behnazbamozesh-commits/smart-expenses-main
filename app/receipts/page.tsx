'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Receipt } from '@/lib/supabase';
import { getReceipts, deleteReceipt } from '@/lib/data';
import { format } from 'date-fns';
import { Camera, Search, Trash2, Eye, Calendar, Store, DollarSign } from 'lucide-react';
import Link from 'next/link';
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
import { toast } from 'sonner';
import Image from 'next/image';

export default function ReceiptsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<(Receipt & { items?: { item_name: string; quantity: number; price: number }[] })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) {
      loadReceipts();
    }
  }, [user]);

  const loadReceipts = async () => {
    try {
      if (!user) return;
      setLoading(true);
      const data = await getReceipts(user.id);
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Failed to load receipts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteReceipt(id);
      toast.success('Receipt deleted');
      loadReceipts();
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

  const filteredReceipts = receipts.filter((r) =>
    r.store_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors = {
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <AppLayout title="Receipts">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Receipt Archive</h1>
            <p className="text-slate-400 mt-1">View and manage your scanned receipts</p>
          </div>
          <Link href="/receipts/scan">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scan Receipt
            </Button>
          </Link>
        </div>

        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search receipts by store name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden">
                    <Skeleton className="h-40 w-full bg-slate-700" />
                    <div className="p-4 space-y-2">
                      <Skeleton className="h-4 w-32 bg-slate-700" />
                      <Skeleton className="h-3 w-24 bg-slate-700" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReceipts.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  {searchQuery ? 'No receipts match your search' : 'No receipts yet'}
                </p>
                <Link href="/receipts/scan">
                  <Button variant="link" className="text-emerald-400 hover:text-emerald-300 mt-2">
                    Scan your first receipt
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredReceipts.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="rounded-lg border border-slate-700 bg-slate-900/50 overflow-hidden hover:border-slate-600 transition-colors group"
                  >
                    <div className="relative h-40 bg-slate-800">
                      <Image
                        src={receipt.image_url}
                        alt="Receipt"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.pexels.com/pexels-4226140/pexels-4226140.jpeg?auto=compress&cs=tinysrgb&w=400';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                      <Badge
                        className={`absolute top-2 right-2 ${statusColors[receipt.status]}`}
                        variant="outline"
                      >
                        {receipt.status}
                      </Badge>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-white truncate">
                            {receipt.store_name || 'Unknown Store'}
                          </h3>
                          <div className="flex items-center gap-1 mt-1 text-sm text-slate-400">
                            <Calendar className="h-3 w-3" />
                            {receipt.receipt_date
                              ? format(new Date(receipt.receipt_date), 'MMM d, yyyy')
                              : 'No date'}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-white">{formatCurrency(receipt.total)}</p>
                          {receipt.items && (
                            <p className="text-xs text-slate-500">{receipt.items.length} items</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Link href={`/receipts/${receipt.id}`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-600 text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30"
                            >
                              <Trash2 className="h-3 w-3" />
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
                                onClick={() => handleDelete(receipt.id)}
                                className="bg-red-500 hover:bg-red-600 text-white"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
