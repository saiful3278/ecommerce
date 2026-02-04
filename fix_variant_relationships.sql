-- Fix duplicate FKs for variants and attributes
-- This checks if product_variants or product_variant_attributes have ambiguous relationships

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Checking for duplicate relationships on variants and attributes...';

    -- 1. Check product_variants -> products
    -- We want exactly ONE FK.
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.product_variants'::regclass 
        AND confrelid = 'public.products'::regclass
        ORDER BY conname ASC
        OFFSET 1 -- Skip the first one (keep one)
    LOOP
        EXECUTE 'ALTER TABLE public.product_variants DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped duplicate variant constraint: %', r.conname;
    END LOOP;

    -- 2. Check product_variant_attributes -> product_variants
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.product_variant_attributes'::regclass 
        AND confrelid = 'public.product_variants'::regclass
        ORDER BY conname ASC
        OFFSET 1
    LOOP
        EXECUTE 'ALTER TABLE public.product_variant_attributes DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped duplicate variant_attribute constraint (variant): %', r.conname;
    END LOOP;

    -- 3. Check product_variant_attributes -> attributes
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.product_variant_attributes'::regclass 
        AND confrelid = 'public.attributes'::regclass
        ORDER BY conname ASC
        OFFSET 1
    LOOP
        EXECUTE 'ALTER TABLE public.product_variant_attributes DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped duplicate variant_attribute constraint (attribute): %', r.conname;
    END LOOP;

    -- 4. Check product_variant_attributes -> attribute_values
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.product_variant_attributes'::regclass 
        AND confrelid = 'public.attribute_values'::regclass
        ORDER BY conname ASC
        OFFSET 1
    LOOP
        EXECUTE 'ALTER TABLE public.product_variant_attributes DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped duplicate variant_attribute constraint (value): %', r.conname;
    END LOOP;

    NOTIFY pgrst, 'reload config';
END $$;
