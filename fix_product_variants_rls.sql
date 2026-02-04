-- Fix for RLS policy violation on product_variants table
-- This script ensures that RLS is enabled and proper policies exist for authenticated users.

DO $$
BEGIN
    -- 1. Enable RLS on the table (safeguard)
    ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

    -- 2. Drop existing policies to avoid conflicts or outdated definitions
    DROP POLICY IF EXISTS "authenticated insert product_variants" ON public.product_variants;
    DROP POLICY IF EXISTS "authenticated update product_variants" ON public.product_variants;
    DROP POLICY IF EXISTS "authenticated delete product_variants" ON public.product_variants;
    DROP POLICY IF EXISTS "public select product_variants" ON public.product_variants;
    
    -- 3. Create permissive policies for authenticated users (admins/sellers)
    
    -- INSERT: Allow authenticated users to insert variants
    CREATE POLICY "authenticated insert product_variants"
      ON public.product_variants
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    -- UPDATE: Allow authenticated users to update variants
    CREATE POLICY "authenticated update product_variants"
      ON public.product_variants
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);

    -- DELETE: Allow authenticated users to delete variants
    CREATE POLICY "authenticated delete product_variants"
      ON public.product_variants
      FOR DELETE
      TO authenticated
      USING (true);

    -- SELECT: Allow everyone (including anonymous users) to view variants
    -- This is crucial for the public shop to work
    CREATE POLICY "public select product_variants"
      ON public.product_variants
      FOR SELECT
      TO public
      USING (true);

    RAISE NOTICE 'RLS policies for product_variants have been updated.';
    
    -- 4. Force schema cache reload
    NOTIFY pgrst, 'reload config';
END $$;
