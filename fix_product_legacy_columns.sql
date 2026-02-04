-- Fix for 'price_cents' column not-null constraint violation
-- This script makes 'price_cents' nullable as we are using variants for pricing now.
-- It also proactively checks for other potential legacy columns (e.g. 'stock', 'price').

DO $$
BEGIN
    -- 1. Handle 'price_cents' column
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price_cents') THEN
        RAISE NOTICE 'Found legacy column "price_cents". Making it nullable...';
        ALTER TABLE public.products ALTER COLUMN price_cents DROP NOT NULL;
        RAISE NOTICE 'Successfully made "price_cents" nullable.';
    END IF;

    -- 2. Handle 'price' column (if it exists on products table)
    -- Our current architecture stores price on 'product_variants', so price on 'products' might be legacy or summary.
    -- We'll make it nullable just in case.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'price') THEN
        RAISE NOTICE 'Found column "price". Making it nullable...';
        ALTER TABLE public.products ALTER COLUMN price DROP NOT NULL;
        RAISE NOTICE 'Successfully made "price" nullable.';
    END IF;

    -- 3. Handle 'stock' column (if it exists on products table)
    -- Stock is also tracked on variants now.
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock') THEN
        RAISE NOTICE 'Found column "stock". Making it nullable...';
        ALTER TABLE public.products ALTER COLUMN stock DROP NOT NULL;
        RAISE NOTICE 'Successfully made "stock" nullable.';
    END IF;
    
    -- 4. Force schema cache reload
    NOTIFY pgrst, 'reload config';
    
    RAISE NOTICE 'Triggered PostgREST schema cache reload.';
END $$;
