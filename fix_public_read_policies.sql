-- Ensure public read access for core tables (products, categories, variants)
-- This is critical for the home page to display data to unauthenticated users.

DO $$
BEGIN
    -- 1. Products: Allow public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'public select products'
    ) THEN
        DROP POLICY IF EXISTS "public read products" ON public.products; -- Drop old naming if exists
        CREATE POLICY "public select products" ON public.products FOR SELECT TO public USING (true);
        RAISE NOTICE 'Added public select policy for products';
    ELSE
        RAISE NOTICE 'Public select policy for products already exists';
    END IF;

    -- 2. Categories: Allow public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'categories' AND policyname = 'public select categories'
    ) THEN
        DROP POLICY IF EXISTS "public read categories" ON public.categories;
        CREATE POLICY "public select categories" ON public.categories FOR SELECT TO public USING (true);
        RAISE NOTICE 'Added public select policy for categories';
    ELSE
        RAISE NOTICE 'Public select policy for categories already exists';
    END IF;

    -- 3. Product Variants: Allow public read (Double check)
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_variants' AND policyname = 'public select product_variants'
    ) THEN
        DROP POLICY IF EXISTS "public read variants" ON public.product_variants;
        CREATE POLICY "public select product_variants" ON public.product_variants FOR SELECT TO public USING (true);
        RAISE NOTICE 'Added public select policy for product_variants';
    ELSE
        RAISE NOTICE 'Public select policy for product_variants already exists';
    END IF;

    -- 4. Product Variant Attributes: Allow public read
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'product_variant_attributes' AND policyname = 'public select product_variant_attributes'
    ) THEN
        DROP POLICY IF EXISTS "public read variant attributes" ON public.product_variant_attributes;
        CREATE POLICY "public select product_variant_attributes" ON public.product_variant_attributes FOR SELECT TO public USING (true);
        RAISE NOTICE 'Added public select policy for product_variant_attributes';
    ELSE
        RAISE NOTICE 'Public select policy for product_variant_attributes already exists';
    END IF;

    -- Force schema cache reload
    NOTIFY pgrst, 'reload config';
END $$;
