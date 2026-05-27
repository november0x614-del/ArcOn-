-- ==========================================
-- ARC COMMERCE: COMPLETE SUPABASE RESET
-- ==========================================
-- Gunakan script ini pada SQL Editor di Supabase Dashboard (https://supabase.com).
-- Script ini akan menghapus tabel lama (jika ada) dan membangun skema baru yang aman & bersih.

-- 1. DROP EXISTING TABLES (Reset)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE PROFILES TABLE (Untuk Informasi UI User)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE WALLETS TABLE (Mapping UID ke Circle Web3)
CREATE TABLE public.user_wallets (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    wallet_id TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    wallet_set_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.5. CREATE BALANCES TABLE
CREATE TABLE public.balances (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    amount DECIMAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USDC',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE TRANSACTIONS TABLE (Log Ledger)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'withdraw', 'transfer', 'payment', 'swap', 'receive')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'success', 'failed')) NOT NULL,
    tx_hash TEXT,
    internal_ref TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Profiles: Semua orang bisa baca profile (untuk transfer antar user), tapi update & insert hanya milik sendiri
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Wallets: User hanya bisa BACA datanya sendiri. Server (Service Role) bisa SEMUANYA.
CREATE POLICY "Users can view their own wallet." ON public.user_wallets FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role manages wallets." ON public.user_wallets FOR ALL USING (auth.role() = 'service_role');

-- Transactions: User hanya bisa BACA transaksinya sendiri. Server (Service Role) bisa SEMUANYA.
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages transactions." ON public.transactions FOR ALL USING (auth.role() = 'service_role');

-- ==========================================
-- AUTOMATION TRIGGER (Auth -> Profiles)
-- ==========================================
-- Trigger ini akan otomatis membuat profile kosong saat user mendaftar di Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. CREATE AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Audit Logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own audit logs." ON public.audit_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages audit logs." ON public.audit_logs FOR ALL USING (auth.role() = 'service_role');

