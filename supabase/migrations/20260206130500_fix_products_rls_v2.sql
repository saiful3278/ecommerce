-- Enable RLS on products and related tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert products
CREATE POLICY "authenticated insert products"
  ON public.products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update products
CREATE POLICY "authenticated update products"
  ON public.products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete products
CREATE POLICY "authenticated delete products"
  ON public.products
  FOR DELETE
  TO authenticated
  USING (true);

-- Enable RLS on product_variants if exists (it should, but just in case)
-- Note: In previous error it said relation does not exist, which is strange because init.sql has it.
-- Let's check if we need to be explicit about schema or if there's a typo.
-- Actually, the error "relation public.product_variants does not exist" suggests it might not be created yet in the remote DB if init failed?
-- But we saw it in init.sql. Maybe partial init?
-- Let's try to create them if not exists first, just to be safe, or just rely on them being there.
-- Wait, the error was on ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY
-- This implies the table really doesn't exist or is not visible.
-- Let's assume it exists and maybe there was a glitch, or re-create it safely.

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique not null,
  images text[] not null default '{}'::text[],
  price numeric not null,
  stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  barcode text,
  warehouse_location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert product variants
CREATE POLICY "authenticated insert product_variants"
  ON public.product_variants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update product variants
CREATE POLICY "authenticated update product_variants"
  ON public.product_variants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete product variants
CREATE POLICY "authenticated delete product_variants"
  ON public.product_variants
  FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS public.product_variant_attributes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  value_id uuid not null references public.attribute_values(id) on delete cascade,
  created_at timestamptz default now()
);

ALTER TABLE public.product_variant_attributes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert product variant attributes
CREATE POLICY "authenticated insert product_variant_attributes"
  ON public.product_variant_attributes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update product variant attributes
CREATE POLICY "authenticated update product_variant_attributes"
  ON public.product_variant_attributes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to delete product variant attributes
CREATE POLICY "authenticated delete product_variant_attributes"
  ON public.product_variant_attributes
  FOR DELETE
  TO authenticated
  USING (true);
