-- Lounge Arc Testnet L1 - Full Database Schema Setup
-- Run this in your Supabase SQL Editor to initialize all required tables.
-- Author: Principal Software Architect @ Lounge

-- 1. Profiles & User Identities
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. User Wallets (Circle Developer Controlled Wallets)
CREATE TABLE IF NOT EXISTS public.user_wallets (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL, -- ID dari Circle
    wallet_address TEXT NOT NULL UNIQUE, -- Alamat di blockchain (Arc Testnet)
    wallet_set_id UUID,
    entity_secret_ciphertext TEXT, -- Optional, based on storage choice
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    balance DECIMAL(20, 6) DEFAULT 0.00
);

-- 3. Transactions (Main Ledger for UI)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount TEXT NOT NULL, -- Format +/- amount (e.g. -100.00)
    type TEXT NOT NULL, -- transfer, receive, swap, bridge, mint_nft, etc.
    status TEXT DEFAULT 'pending', -- pending, success, failed
    tx_hash TEXT, -- Blockchain transaction hash
    internal_ref TEXT UNIQUE, -- Circle transaction ID or internal UUID
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Transaction Ledger (Detailed technical ledger for audit)
CREATE TABLE IF NOT EXISTS public.transaction_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tx_type TEXT NOT NULL, -- SEND, RECEIVE, SWAP, BRIDGE, etc.
    amount DECIMAL(20, 6) NOT NULL,
    status TEXT DEFAULT 'PENDING', -- PENDING, COMPLETE, FAILED
    circle_tx_id TEXT,
    tx_hash TEXT,
    destination_address TEXT,
    source_address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Inbox & Notifications
CREATE TABLE IF NOT EXISTS public.inbox_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'notification', -- receipt, notification, system
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. E-commerce Products Catalog
CREATE TABLE IF NOT EXISTS public.ecommerce_products (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    "desc" TEXT,
    price DECIMAL(20, 6) NOT NULL,
    image TEXT,
    category TEXT DEFAULT 'General', -- NFT, RWA, etc.
    stock INTEGER DEFAULT 100,
    sales INTEGER DEFAULT 0,
    merchant_address TEXT NOT NULL,
    tx_hash TEXT, -- Specific for NFT minted hash
    date_label TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. E-commerce Orders & Escrow
CREATE TABLE IF NOT EXISTS public.ecommerce_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    seller_address TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT,
    amount DECIMAL(20, 6) NOT NULL,
    status TEXT DEFAULT 'PENDING_ESCROW', -- PENDING_ESCROW, PAID, RELEASED, FAILED
    tx_hash TEXT,
    memo TEXT,
    batch_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. User NFTs Collection
CREATE TABLE IF NOT EXISTS public.user_nfts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image TEXT,
    tx_hash TEXT,
    contract_address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. App Settings & Admin Config
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Audit Logs & Compliance
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    target_user_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Sanctions Blocklist
CREATE TABLE IF NOT EXISTS public.sanctions_blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. User Preferences (Frontend State Persistence)
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS (Row Level Security) for compliance
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_nfts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Basic Security Rules (Simple: User can only see their own data)
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own wallet" ON user_wallets FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own inbox" ON inbox_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own nfts" ON user_nfts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own preferences" ON user_preferences 
    USING (auth.uid() = user_id) 
    WITH CHECK (auth.uid() = user_id);

-- E-commerce Products are public for viewing
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Viewable by everyone" ON ecommerce_products FOR SELECT USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_user_id ON inbox_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON ecommerce_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON user_wallets(wallet_address);
