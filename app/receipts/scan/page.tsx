'use client';

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EXPENSE_CATEGORIES } from '@/lib/supabase';
import { createReceipt, createReceiptItem, createTransaction } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { Upload, ArrowLeft, Loader2, Check, X, FileText, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import Image from 'next/image';

type ExtractedItem = { item_name: string; quantity: number; price: number };

type ExtractedData = {
  store_name: string;
  receipt_date: string;
  subtotal: number;
  tax: number;
  total: number;
  items: ExtractedItem[];
  raw_text: string;
};

// Resize image on canvas to keep payload under ~1MB
function resizeImage(file: File, maxDim = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not available'));
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

const today = () => new Date().toISOString().slice(0, 10);

export default function ScanReceiptPage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);
  const [category, setCategory] = useState<string>('');

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setEditedData(null);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const clearImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setEditedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processOCR = async () => {
    if (!imageFile) return;
    setOcrLoading(true);
    try {
      // Resize client-side so large/high-res images don't time out the function
      const base64 = await resizeImage(imageFile);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/ocr-receipt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ imageBase64: base64 }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'OCR processing failed');
      }

      setEditedData(data);
      toast.success('Data extracted — review and edit below');
    } catch (error) {
      console.error('OCR Error:', error);
      // On any failure, open a blank editable form so the user can enter manually
      setEditedData({
        store_name: '',
        receipt_date: today(),
        subtotal: 0,
        tax: 0,
        total: 0,
        items: [],
        raw_text: '',
      });
      toast.error('Could not auto-extract data. Please fill in the details manually.');
    } finally {
      setOcrLoading(false);
    }
  };

  const updateItem = (index: number, field: keyof ExtractedItem, value: string | number) => {
    if (!editedData) return;
    const items = [...editedData.items];
    items[index] = { ...items[index], [field]: value };
    const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    setEditedData({ ...editedData, items, subtotal: Math.round(subtotal * 100) / 100 });
  };

  const removeItem = (index: number) => {
    if (!editedData) return;
    const items = editedData.items.filter((_, i) => i !== index);
    const subtotal = items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
    setEditedData({ ...editedData, items, subtotal: Math.round(subtotal * 100) / 100 });
  };

  const addItem = () => {
    if (!editedData) return;
    setEditedData({ ...editedData, items: [...editedData.items, { item_name: '', quantity: 1, price: 0 }] });
  };

  const handleSave = async () => {
    if (!editedData || !user) return;
    if (!category) { toast.error('Please select a category'); return; }
    if (!editedData.total || editedData.total <= 0) { toast.error('Please enter a valid total'); return; }

    setSaving(true);
    try {
      const receipt = await createReceipt({
        user_id: user.id,
        image_url: imagePreview || '',
        store_name: editedData.store_name || 'Unknown Store',
        receipt_date: editedData.receipt_date || today(),
        subtotal: editedData.subtotal,
        tax: editedData.tax,
        total: editedData.total,
        raw_text: editedData.raw_text,
        status: 'confirmed',
      });

      for (const item of editedData.items) {
        if (item.item_name.trim()) {
          await createReceiptItem({
            receipt_id: receipt.id,
            item_name: item.item_name,
            quantity: item.quantity || 1,
            price: item.price || 0,
          });
        }
      }

      await createTransaction({
        user_id: user.id,
        type: 'expense',
        amount: editedData.total,
        category,
        date: editedData.receipt_date || today(),
        description: editedData.store_name || 'Receipt',
        source: 'receipt',
        receipt_id: receipt.id,
      });

      toast.success('Receipt saved successfully');
      router.push('/receipts');
    } catch (error) {
      console.error('Save Error:', error);
      toast.error('Failed to save receipt');
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);

  return (
    <AppLayout title="Scan Receipt">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/receipts">
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-slate-800">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Scan Receipt</h1>
            <p className="text-slate-400 mt-1">Upload a receipt image to extract data automatically</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Upload panel */}
          <Card className="border-slate-700 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="text-white">Upload Receipt</CardTitle>
              <CardDescription className="text-slate-400">
                JPG, PNG or WEBP — any size accepted
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className={`relative border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                  imagePreview ? 'border-emerald-500/50 bg-emerald-500/5 p-2' : 'border-slate-600 hover:border-slate-500 p-8 text-center'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !imagePreview && fileInputRef.current?.click()}
              >
                {imagePreview ? (
                  <div className="relative">
                    <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 max-h-72">
                      <Image src={imagePreview} alt="Receipt preview" fill className="object-contain" />
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="h-10 w-10 text-slate-500 mx-auto" />
                    <p className="text-slate-400 font-medium">Drop image here or click to browse</p>
                    <p className="text-xs text-slate-600">High-resolution receipts are automatically resized</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              <Button
                onClick={processOCR}
                disabled={!imageFile || ocrLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {ocrLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><FileText className="h-4 w-4 mr-2" />Extract Data</>
                )}
              </Button>

              {!editedData && !ocrLoading && imageFile && (
                <button
                  onClick={() => setEditedData({ store_name: '', receipt_date: today(), subtotal: 0, tax: 0, total: 0, items: [], raw_text: '' })}
                  className="w-full text-sm text-slate-400 hover:text-slate-300 underline underline-offset-2"
                >
                  Skip extraction — enter details manually
                </button>
              )}
            </CardContent>
          </Card>

          {/* Extracted / editable data panel */}
          {editedData && (
            <Card className="border-slate-700 bg-slate-800/50">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Check className="h-5 w-5 text-emerald-500" />
                  Receipt Details
                </CardTitle>
                <CardDescription className="text-slate-400">Review and edit before saving</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Store Name</Label>
                    <Input
                      value={editedData.store_name}
                      onChange={(e) => setEditedData({ ...editedData, store_name: e.target.value })}
                      placeholder="Store name"
                      className="bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Date</Label>
                    <Input
                      type="date"
                      value={editedData.receipt_date}
                      onChange={(e) => setEditedData({ ...editedData, receipt_date: e.target.value })}
                      className="bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {(['subtotal', 'tax', 'total'] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label className="text-slate-300 capitalize">{field}</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedData[field]}
                        onChange={(e) => setEditedData({ ...editedData, [field]: parseFloat(e.target.value) || 0 })}
                        className="bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-slate-300">Items</Label>
                    <button onClick={addItem} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                      <Plus className="h-3 w-3" />Add item
                    </button>
                  </div>
                  {editedData.items.length === 0 && (
                    <p className="text-xs text-slate-500 py-2 text-center">No items — add them above or leave empty</p>
                  )}
                  <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                    {editedData.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Input
                          value={item.item_name}
                          onChange={(e) => updateItem(i, 'item_name', e.target.value)}
                          placeholder="Item name"
                          className="flex-1 h-8 bg-slate-900/50 border-slate-600 text-white text-xs focus:border-emerald-500"
                        />
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(i, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-14 h-8 bg-slate-900/50 border-slate-600 text-white text-xs focus:border-emerald-500"
                          min="1"
                        />
                        <Input
                          type="number"
                          step="0.01"
                          value={item.price}
                          onChange={(e) => updateItem(i, 'price', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 h-8 bg-slate-900/50 border-slate-600 text-white text-xs focus:border-emerald-500"
                        />
                        <button onClick={() => removeItem(i)} className="text-slate-500 hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300">
                    Category <span className="text-red-400">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="bg-slate-900/50 border-slate-600 text-white focus:border-emerald-500">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/receipts')}
                    className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={saving}
                  >
                    {saving ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</>
                    ) : (
                      <><Check className="h-4 w-4 mr-2" />Save Receipt</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
