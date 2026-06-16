/*
# Add transaction_type column for Business/Personal filtering

## 1. Purpose
This migration adds a `transaction_type` column to the transactions table to enable filtering between business and personal/family expenses.

## 2. Changes
- Add `transaction_type` column to `transactions` table
- Column type: varchar with CHECK constraint ('all', 'business', 'personal')
- Default value: 'all' (existing transactions default to all/general)
- NOT NULL constraint

## 3. Important Notes
1. Existing transactions will have 'all' as their transaction_type
2. Frontend can now filter transactions by business or personal type
3. The filter works independently of the existing category field
*/

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_type varchar NOT NULL DEFAULT 'all' 
CHECK (transaction_type IN ('all', 'business', 'personal'));

-- Create index for the new column for faster filtering
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_type ON transactions(transaction_type);