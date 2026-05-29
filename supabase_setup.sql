-- ==========================================
-- ARC COMMERCE: COMPLETE SUPABASE RESET
-- ==========================================
-- Gunakan script ini pada SQL Editor di Supabase Dashboard (https://supabase.com).
-- Script ini akan menghapus tabel lama jika ada dan membangun skema baru yang aman & bersih.

-- 1. DROP EXISTING TABLES (Reset lengkap agar tidak error)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TABLE IF EXISTS public.user_tokens CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.sanctions_blocklist CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.balances CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE PROFILES TABLE (Untuk Informasi UI User)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    username TEXT UNIQUE,
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

-- 3.5. CREATE BALANCES TABLE (Penyimpanan Saldo Native-Stablecoin)
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
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;

-- Profiles: Semua orang bisa baca profile (untuk transfer antar user), tapi update hanya milik sendiri
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (id = (SELECT auth.uid()));

-- Wallets: User hanya bisa BACA datanya sendiri. Server (Service Role) bisa mengelola semuanya.
CREATE POLICY "Users can view their own wallet." ON public.user_wallets FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "Service role manages wallets." ON public.user_wallets FOR ALL TO service_role USING (true);

-- Transactions: User hanya bisa BACA transaksinya sendiri. Server (Service Role) bisa mengelola semuanya.
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages transactions." ON public.transactions FOR ALL TO service_role USING (true);

-- Balances: User hanya bisa BACA saldonya sendiri. Server (Service Role) bisa mengelola semuanya.
CREATE POLICY "Users can view their own balances." ON public.balances FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages balances." ON public.balances FOR ALL TO service_role USING (true);

-- ==========================================
-- Automation Trigger & Functions (Auth -> Profiles)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, avatar_url)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', 'Arc User'),
    COALESCE(new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'full_name', 'arc_user'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Membatasi akses eksekusi langsung ke handle_new_user oleh anonim demi keamanan
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;

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
CREATE POLICY "Users can view their own audit logs." ON public.audit_logs FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages audit logs." ON public.audit_logs FOR ALL TO service_role USING (true);

-- 6. CREATE SANCTIONS BLOCKLIST TABLE
CREATE TABLE public.sanctions_blocklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT UNIQUE NOT NULL,
    reason TEXT,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS for Sanctions Blocklist
ALTER TABLE public.sanctions_blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view blocklist." ON public.sanctions_blocklist FOR SELECT USING (true);
CREATE POLICY "Service role manages sanctions." ON public.sanctions_blocklist FOR ALL TO service_role USING (true);

-- 7. CREATE APP SETTINGS TABLE
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Initial values
INSERT INTO public.app_settings (key, value) VALUES ('GAS_FEE_STRATEGY', 'SPONSORED') ON CONFLICT (key) DO NOTHING;

-- RLS for App Settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view settings." ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Service role manages settings." ON public.app_settings FOR ALL TO service_role USING (true);

-- 8. CREATE USER TOKENS TABLE (Custom/Imported Tokens)
CREATE TABLE public.user_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    symbol TEXT NOT NULL,
    name TEXT NOT NULL,
    contract_address TEXT NOT NULL,
    decimals INTEGER DEFAULT 18,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, contract_address)
);

-- RLS for User Tokens
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own imported tokens." ON public.user_tokens FOR ALL USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages user tokens." ON public.user_tokens FOR ALL TO service_role USING (true);
