-- ============================================================
-- PET SOCIETY — SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT,
    country TEXT DEFAULT 'India',
    postal TEXT,
    payment_method TEXT NOT NULL,
    total NUMERIC NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Grooming Spa Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id TEXT UNIQUE NOT NULL,
    service_id TEXT,
    service_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    pet_name TEXT NOT NULL,
    booking_date DATE NOT NULL,
    time_slot TEXT DEFAULT 'Morning (10:00 AM)',
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'confirmed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public insert on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public read on orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert on bookings" ON public.bookings;
DROP POLICY IF EXISTS "Allow public read on bookings" ON public.bookings;

-- Policies for Orders
CREATE POLICY "Allow public insert on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on orders" ON public.orders
    FOR SELECT USING (true);

-- Policies for Bookings
CREATE POLICY "Allow public insert on bookings" ON public.bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on bookings" ON public.bookings
    FOR SELECT USING (true);

-- Helpful Indexing for speedy lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_phone ON public.bookings(phone);
