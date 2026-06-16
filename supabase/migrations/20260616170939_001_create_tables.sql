/*
# Create core tables for Smart Expense Tracker

## 1. purpose
This migration creates the foundational tables for the expense tracking application:
- `transactions`: Records income and expense entries for each user
- `receipts`: Stores uploaded receipt images and extracted data
- `receipt_items`: Line items extracted from receipts

## 2. New Tables

### transactions
- `id` (uuid, primary key, auto-generated)
- `user_id` (uuid, references auth.users, required for multi-user isolation)
- `type` (varchar, check constraint: 'income' or 'expense')
- `amount` (numeric, monetary value)
- `category` (varchar, classification of the transaction)
- `date` (date, when the transaction occurred)
- `description` (text, optional note)
- `source` (varchar, default 'manual', check: 'manual' or 'receipt')
- `receipt_id` (uuid, optional link to receipts table)
- `created_at` (timestamptz, auto-generated)

### receipts
- `id` (uuid, primary key, auto-generated)
- `user_id` (uuid, references auth.users)
- `image_url` (text, URL to stored receipt image)
- `store_name` (varchar, optional merchant name)
- `receipt_date` (date, optional date on receipt)
- `subtotal` (numeric, optional pre-tax total)
- `tax` (numeric, optional tax amount)
- `total` (numeric, optional final amount)
- `raw_text` (text, OCR extracted text)
- `status` (varchar, default 'pending', check: 'pending', 'confirmed', or 'rejected')
- `created_at` (timestamptz, auto-generated)

### receipt_items
- `id` (uuid, primary key, auto-generated)
- `receipt_id` (uuid, references receipts, cascade delete)
- `item_name` (varchar, product/service name)
- `quantity` (numeric, default 1)
- `price` (numeric, unit price)

## 3. Security
- Row Level Security (RLS) enabled on all tables
- Policies enforce that users can only access their own data
- All policies use auth.uid() for ownership verification
- Separate policies for SELECT, INSERT, UPDATE, DELETE operations

## 4. Important Notes
1. The app currently runs in demo mode with in-memory data
2. When users authenticate via Supabase Auth, these tables will persist their data
3. user_id defaults to auth.uid() so inserts work without explicitly passing user_id from frontend
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL CHECK (amount >= 0),
  category varchar NOT NULL,
  date date NOT NULL,
  description text,
  source varchar DEFAULT 'manual' CHECK (source IN ('manual', 'receipt')),
  receipt_id uuid REFERENCES receipts(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON transactions;
CREATE POLICY "select_own_transactions" ON transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_transactions" ON transactions;
CREATE POLICY "insert_own_transactions" ON transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_transactions" ON transactions;
CREATE POLICY "update_own_transactions" ON transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_transactions" ON transactions;
CREATE POLICY "delete_own_transactions" ON transactions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  store_name varchar,
  receipt_date date,
  subtotal numeric CHECK (subtotal >= 0),
  tax numeric CHECK (tax >= 0),
  total numeric CHECK (total >= 0),
  raw_text text,
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on receipts
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_receipts" ON receipts;
CREATE POLICY "select_own_receipts" ON receipts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_receipts" ON receipts;
CREATE POLICY "insert_own_receipts" ON receipts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_receipts" ON receipts;
CREATE POLICY "update_own_receipts" ON receipts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_receipts" ON receipts;
CREATE POLICY "delete_own_receipts" ON receipts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Create receipt_items table
CREATE TABLE IF NOT EXISTS receipt_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  item_name varchar NOT NULL,
  quantity numeric DEFAULT 1 CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0)
);

-- Enable RLS on receipt_items
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_receipt_items" ON receipt_items;
CREATE POLICY "select_own_receipt_items" ON receipt_items FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_receipt_items" ON receipt_items;
CREATE POLICY "insert_own_receipt_items" ON receipt_items FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "update_own_receipt_items" ON receipt_items;
CREATE POLICY "update_own_receipt_items" ON receipt_items FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "delete_own_receipt_items" ON receipt_items;
CREATE POLICY "delete_own_receipt_items" ON receipt_items FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM receipts WHERE receipts.id = receipt_items.receipt_id AND receipts.user_id = auth.uid())
  );

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt_id ON receipt_items(receipt_id);