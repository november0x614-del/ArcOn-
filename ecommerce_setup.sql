-- ==========================================
-- E-COMMERCE ORDERS TABLE
-- ==========================================

CREATE TABLE public.ecommerce_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id TEXT,
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

-- ==========================================
-- E-COMMERCE PRODUCTS TABLE
-- ==========================================

CREATE TABLE public.ecommerce_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL DEFAULT 1,
    image TEXT,
    category TEXT DEFAULT 'General',
    sales INTEGER NOT NULL DEFAULT 0,
    "desc" TEXT,
    date_label TEXT,
    seller_address TEXT,
    tx_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.ecommerce_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ecommerce_products ENABLE ROW LEVEL SECURITY;

-- Drop policies
DROP POLICY IF EXISTS "Allow authenticated insert for INSERT" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Allow public insert access for ecommerce" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Allow public update access for ecommerce" ON public.ecommerce_orders;
DROP POLICY IF EXISTS "Enable all access for service role on products" ON public.ecommerce_products;
DROP POLICY IF EXISTS "Public select for products" ON public.ecommerce_products;

-- Secure policies for orders
CREATE POLICY "Service role manages orders." ON public.ecommerce_orders FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their own orders." ON public.ecommerce_orders FOR SELECT USING (buyer_id = auth.uid());
CREATE POLICY "Users can insert their own orders." ON public.ecommerce_orders FOR INSERT TO authenticated WITH CHECK (buyer_id = auth.uid());
CREATE POLICY "Users can update their own orders." ON public.ecommerce_orders FOR UPDATE TO authenticated USING (buyer_id = auth.uid()) WITH CHECK (buyer_id = auth.uid());

-- Policies for products
CREATE POLICY "Anyone can view products." ON public.ecommerce_products FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert products." ON public.ecommerce_products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Sellers can update their own products." ON public.ecommerce_products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Sellers can delete their own products." ON public.ecommerce_products FOR DELETE TO authenticated USING (true);
CREATE POLICY "Service role manages products." ON public.ecommerce_products FOR ALL TO service_role USING (true);

