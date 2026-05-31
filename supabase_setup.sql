-- ==========================================
-- ARC COMMERCE: COMPLETE SUPABASE SETUP
-- ==========================================
-- Gunakan script ini pada SQL Editor di Supabase Dashboard (https://supabase.com).
-- Script ini TERKONSOLIDASI (hanya perlu run 1 file ini saja) dan akan menghapus 
-- tabel lama yang bertumpuk untuk membangun skema baru yang aman & rapi.

-- 1. DROP EXISTING TABLES & TRIGGERS (Reset bersih)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP TABLE IF EXISTS public.ecommerce_orders CASCADE;
DROP TABLE IF EXISTS public.user_tokens CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.sanctions_blocklist CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.transaction_ledger CASCADE;
DROP TABLE IF EXISTS public.balances CASCADE;
DROP TABLE IF EXISTS public.user_wallets CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREATE PROFILES TABLE (Informasi UI User & Role Base Access)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    role TEXT DEFAULT 'user', -- 'user' atau 'admin'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. CREATE WALLETS TABLE (Mapping UID ke Circle Web3 dengan Proteksi Delete RESTRICT)
CREATE TABLE public.user_wallets (
    id UUID REFERENCES auth.users(id) ON DELETE RESTRICT PRIMARY KEY,
    wallet_id TEXT UNIQUE NOT NULL,
    wallet_address TEXT UNIQUE NOT NULL,
    wallet_set_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CREATE BALANCES TABLE (Penyimpanan Saldo Native-Stablecoin)
CREATE TABLE public.balances (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    amount DECIMAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USDC',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CREATE TRANSACTIONS TABLE (Log Ledger Sederhana)
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL NOT NULL,
    type TEXT CHECK (type IN ('deposit', 'withdraw', 'transfer', 'batchTransfer', 'payment', 'swap', 'receive')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'success', 'failed')) NOT NULL,
    tx_hash TEXT,
    internal_ref TEXT UNIQUE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CREATE TRANSACTION LEDGER TABLE (Extended Ledger untuk Webhook)
CREATE TABLE public.transaction_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tx_type VARCHAR(50) NOT NULL,
    amount NUMERIC,
    token_address VARCHAR(255),
    destination_address VARCHAR(255),
    circle_tx_id VARCHAR(255) UNIQUE,
    tx_hash VARCHAR(255),
    status VARCHAR(50) DEFAULT 'PENDING',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE E-COMMERCE ORDERS TABLE
CREATE TABLE public.ecommerce_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    buyer_address TEXT,
    seller_address TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_ESCROW',
    circle_tx_id TEXT,
    tx_hash TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. CREATE AUDIT LOGS TABLE
CREATE TABLE public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    tx_hash TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. CREATE SANCTIONS BLOCKLIST TABLE
CREATE TABLE public.sanctions_blocklist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    address TEXT UNIQUE NOT NULL,
    reason TEXT,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. CREATE APP SETTINGS TABLE
CREATE TABLE public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
INSERT INTO public.app_settings (key, value) VALUES ('GAS_FEE_STRATEGY', 'SPONSORED') ON CONFLICT (key) DO NOTHING;

-- 11. CREATE USER TOKENS TABLE (Custom/Imported Tokens)
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

-- ==========================================
-- ROW LEVEL SECURITY (RLS) & POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanctions_blocklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (id = (SELECT auth.uid()));

-- Wallets
CREATE POLICY "Users can view their own wallet." ON public.user_wallets FOR SELECT USING (id = (SELECT auth.uid()));
CREATE POLICY "Service role manages wallets." ON public.user_wallets FOR ALL TO service_role USING (true);

-- Transactions & Ledger
CREATE POLICY "Users can view their own transactions." ON public.transactions FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages transactions." ON public.transactions FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their own transaction ledger." ON public.transaction_ledger FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages transaction ledger." ON public.transaction_ledger FOR ALL TO service_role USING (true);

-- Balances
CREATE POLICY "Users can view their own balances." ON public.balances FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages balances." ON public.balances FOR ALL TO service_role USING (true);

-- E-commerce
CREATE POLICY "Service role manages orders." ON public.ecommerce_orders FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their own orders." ON public.ecommerce_orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can insert their own orders." ON public.ecommerce_orders FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());

-- Admin/Management Tables
CREATE POLICY "Users can view their own audit logs." ON public.audit_logs FOR SELECT USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages audit logs." ON public.audit_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Public can view blocklist." ON public.sanctions_blocklist FOR SELECT USING (true);
CREATE POLICY "Service role manages sanctions." ON public.sanctions_blocklist FOR ALL TO service_role USING (true);
CREATE POLICY "Public can view settings." ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Service role manages settings." ON public.app_settings FOR ALL TO service_role USING (true);
CREATE POLICY "Users can manage their own tokens." ON public.user_tokens FOR ALL USING (user_id = (SELECT auth.uid()));
CREATE POLICY "Service role manages user tokens." ON public.user_tokens FOR ALL TO service_role USING (true);

-- ==========================================
-- AUTOMATION TRIGGER (Auth -> Profiles)
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, avatar_url, role)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'username', 'Arc User'),
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substring(new.id::text from 1 for 8)),
    new.raw_user_meta_data->>'avatar_url',
    'user' -- Default role adalah user
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, authenticated, anon;

-- ==========================================
-- 12. PROTEKSI DELETE & UPDATE PADA DOMPET (SCA WALLET LOCK)
-- Mencegah penghapusan baris di table user_wallets agar identitas dan dompet aman dari kesalahan admin.
-- ==========================================
CREATE OR REPLACE FUNCTION public.prevent_wallet_deletion_or_address_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Izinkan modifikasi/penghapusan khusus untuk ID Admin agar bisa 'Ganti Dompet' / 'Force Re-initialize'
    IF (TG_OP = 'DELETE' AND OLD.id = '11111111-1111-1111-1111-111111111111') THEN
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE' AND OLD.id = '11111111-1111-1111-1111-111111111111') THEN
        RETURN NEW;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RAISE EXCEPTION 'CRITICAL SECURITY ERROR: Domain wallet milik pengguna terkunci secara permanen di database Supabase untuk mencegah kehilangan aset SCA Arc Network!';
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (NEW.wallet_address <> OLD.wallet_address OR NEW.wallet_id <> OLD.wallet_id OR NEW.id <> OLD.id) THEN
            RAISE EXCEPTION 'CRITICAL SECURITY ERROR: Mengubah wallet_address, wallet_id, atau id pengguna dilarang karena dapat merusak integritas kunci SCA!';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lock_user_wallets_integrity
    BEFORE UPDATE OR DELETE ON public.user_wallets
    FOR EACH ROW EXECUTE PROCEDURE public.prevent_wallet_deletion_or_address_change();

-- ==========================================
-- 13. PROTEKSI DELETE PADA PROFIL USER (PROFILE LOCK)
-- Mencegah penghapusan profil di tabel profiles jika pengguna memiliki dompet SCA aktif.
-- ==========================================
CREATE OR REPLACE FUNCTION public.prevent_profile_deletion_with_active_wallet()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.user_wallets WHERE id = OLD.id) THEN
        RAISE EXCEPTION 'CRITICAL SECURITY ERROR: Profil pengguna dilarang dihapus karena pengguna ini memiliki dompet SCA aktif yang menyimpan aset!';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lock_profile_deletion_with_wallet
    BEFORE DELETE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.prevent_profile_deletion_with_active_wallet();

-- ==========================================
-- 14. PROTEKSI ANTI-ROLE ESCALATION (ROLE INTEGRITY LOCK)
-- Mencegah user meng-upgrade role mereka sendiri menggunakan client-side API.
-- Perubahan role hanya diizinkan untuk super_admin / service_role.
-- ==========================================
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.role IS DISTINCT FROM NEW.role) THEN
        -- Cek apakah pemanggil adalah user biasa (authenticated/anon) yang mencoba merubah role mereka sendiri
        IF (auth.role() = 'authenticated' OR auth.role() = 'anon') THEN
            RAISE EXCEPTION 'CRITICAL SECURITY ERROR: Perubahan hak akses dilarang dari sisi client!';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER lock_profile_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.prevent_profile_role_escalation();
