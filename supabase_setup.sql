-- Supabase UID Infrastructure for Arc Commerce

-- 1. Create a users_wallets table to map Supabase UID -> Circle Wallet ID
CREATE TABLE public.user_wallets (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    wallet_set_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create a transactions table to track payments
CREATE TABLE public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    amount DECIMAL NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    internal_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Setup Row Level Security (RLS)
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. Users can read their own data
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets
FOR SELECT 
USING ( auth.uid() = id );

CREATE POLICY "Users can view their own transactions"
ON public.transactions
FOR SELECT
USING ( auth.uid() = user_id );

-- 5. Only Service Role (Server) can insert or update data
CREATE POLICY "Service role can manage wallets"
ON public.user_wallets
FOR ALL
USING ( auth.role() = 'service_role' );

CREATE POLICY "Service role can manage transactions"
ON public.transactions
FOR ALL
USING ( auth.role() = 'service_role' );
