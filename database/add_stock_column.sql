-- Add stock/inventory column to medications table
-- Run this in Supabase SQL Editor

-- Add stock column if it doesn't exist
ALTER TABLE public.medications 
ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0 NOT NULL;

-- Add check constraint to ensure stock is non-negative
ALTER TABLE public.medications
DROP CONSTRAINT IF EXISTS stock_non_negative;

ALTER TABLE public.medications
ADD CONSTRAINT stock_non_negative CHECK (stock >= 0);

-- Update existing medications to have default stock (optional)
-- Uncomment if you want to set initial stock for existing medications
-- UPDATE public.medications SET stock = 100 WHERE stock = 0;

-- Create index for faster queries on stock
CREATE INDEX IF NOT EXISTS idx_medications_stock ON public.medications(stock) WHERE stock > 0;

-- Add comment
COMMENT ON COLUMN public.medications.stock IS 'Current inventory stock. Medications with stock = 0 will not be recommended to customers.';

