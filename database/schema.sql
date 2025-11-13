-- FarmasiKu Database Schema for Supabase
-- Auth-backed Schema with Row-Level Security (RLS)
-- Run this SQL in your Supabase SQL Editor
-- 
-- This schema includes:
-- - User authentication support (via Supabase Auth)
-- - Row-Level Security (RLS) policies for data protection
-- - Support for both authenticated users and anonymous users (via session_id)
-- - Medications and symptom-medication mapping tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (using Supabase Auth users, but we can store additional info)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Symptom Assessments table
CREATE TABLE IF NOT EXISTS public.symptom_assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  body_part TEXT NOT NULL,
  symptoms TEXT[] NOT NULL,
  symptom_details JSONB, -- Store detailed assessment data
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Consultations table
CREATE TABLE IF NOT EXISTS public.consultations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  symptoms TEXT[] NOT NULL,
  severity TEXT NOT NULL, -- 'current' or 'severe'
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT, -- For anonymous users
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  transaction_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' NOT NULL, -- 'pending', 'paid', 'shipped', 'delivered'
  age INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Order Items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  medication_price DECIMAL(10, 2) NOT NULL,
  medication_usage JSONB, -- Store usage instructions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist, then create new ones
-- This allows the script to be run multiple times safely

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Symptom assessments policies (allow anonymous access via session_id)
DROP POLICY IF EXISTS "Users can view own assessments" ON public.symptom_assessments;
CREATE POLICY "Users can view own assessments" ON public.symptom_assessments
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.symptom_assessments;
CREATE POLICY "Users can insert own assessments" ON public.symptom_assessments
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Consultations policies (allow anonymous access via session_id)
DROP POLICY IF EXISTS "Users can view own consultations" ON public.consultations;
CREATE POLICY "Users can view own consultations" ON public.consultations
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can insert own consultations" ON public.consultations;
CREATE POLICY "Users can insert own consultations" ON public.consultations
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Orders policies (allow anonymous access via session_id)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

-- Order items policies (automatically accessible through orders)
-- Note: For anonymous users, session_id matching is handled at application level
-- RLS here ensures users can only see items from orders they own
DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) OR
        (auth.uid() IS NULL AND orders.session_id IS NOT NULL)
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert own order items" ON public.order_items;
CREATE POLICY "Users can insert own order items" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (
        (auth.uid() IS NOT NULL AND orders.user_id = auth.uid()) OR
        (auth.uid() IS NULL AND orders.session_id IS NOT NULL)
      )
    )
  );

-- Medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  usage_instructions JSONB, -- Store usage details (method, dosage, frequency, etc.)
  age_restrictions JSONB, -- Store age restrictions (restricted_for, alternatives, etc.)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Symptom-Medication Mapping table
CREATE TABLE IF NOT EXISTS public.symptom_medication_mapping (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  symptom TEXT NOT NULL,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  priority INTEGER DEFAULT 1, -- Lower number = higher priority
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(symptom, medication_id)
);

-- Enable RLS for medications tables
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_medication_mapping ENABLE ROW LEVEL SECURITY;

-- Medications policies (public read access, admin write access)
DROP POLICY IF EXISTS "Anyone can view active medications" ON public.medications;
CREATE POLICY "Anyone can view active medications" ON public.medications
  FOR SELECT USING (is_active = true);

-- Symptom-medication mapping policies (public read access)
DROP POLICY IF EXISTS "Anyone can view symptom-medication mappings" ON public.symptom_medication_mapping;
CREATE POLICY "Anyone can view symptom-medication mappings" ON public.symptom_medication_mapping
  FOR SELECT USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_user_id ON public.symptom_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_session_id ON public.symptom_assessments(session_id);
CREATE INDEX IF NOT EXISTS idx_consultations_user_id ON public.consultations(user_id);
CREATE INDEX IF NOT EXISTS idx_consultations_session_id ON public.consultations(session_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_session_id ON public.orders(session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_medications_name ON public.medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_is_active ON public.medications(is_active);
CREATE INDEX IF NOT EXISTS idx_symptom_medication_symptom ON public.symptom_medication_mapping(symptom);
CREATE INDEX IF NOT EXISTS idx_symptom_medication_medication_id ON public.symptom_medication_mapping(medication_id);


