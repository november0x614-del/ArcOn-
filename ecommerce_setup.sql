-- ==========================================
-- E-COMMERCE ORDERS TABLE
-- ==========================================

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

ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;

-- Drop any potentially permissive policies that might exist
DROP POLICY IF EXISTS "Allow authenticated insert for INSERT" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Allow public insert access for ecommerce" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Allow public update access for ecommerce" ON public.ecommerce_orders;

-- Secure policies
CREATE POLICY "Service role manages orders." ON public.ecommerce_orders FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their own orders." ON public.ecommerce_orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can insert their own orders." ON public.ecommerce_orders FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Users can update their own orders." ON public.ecommerce_orders FOR UPDATE TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());

