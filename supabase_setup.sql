-- Supabase UID Infrastructure for Arc Commerce

-- 1. Create a users_wallets table to map Supabase UID -> Circle Wallet ID
CREATE TABLE public.user_wallets (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    wallet_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    wallet_set_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Setup Row Level Security (RLS)
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;

-- 3. Users can read their own wallet data
CREATE POLICY "Users can view their own wallet" 
ON public.user_wallets
FOR SELECT 
USING ( auth.uid() = id );

-- 4. Only Service Role (Server) can insert or update wallet mapping
CREATE POLICY "Service role can manage wallets"
ON public.user_wallets
FOR ALL
USING ( auth.role() = 'service_role' );

-- NOTE: 
-- 1. Client-Side (Next.js/React) will just do `supabase.auth.signUp()`.
-- 2. Once signup is successful, it calls `/api/wallets/create` in Next/Express.
-- 3. `/api/wallets/create` calls Circle SDK -> gets wallet UUIDs.
-- 4. Server-Side inserts records into `user_wallets` using `SUPABASE_SERVICE_ROLE_KEY`.
