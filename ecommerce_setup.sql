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
CREATE POLICY "Users can view their own orders." ON public.ecommerce_orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Service role manages orders." ON public.ecommerce_orders FOR ALL TO service_role USING (true);

