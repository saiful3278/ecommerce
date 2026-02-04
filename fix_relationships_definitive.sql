-- Definitive fix for 'products' to 'categories' relationship
-- This script removes ALL existing foreign keys between the two tables and creates ONE fresh, correct connection.

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Starting definitive relationship fix...';

    -- 1. Loop through and DROP ALL existing foreign keys from products to categories
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.products'::regclass 
        AND confrelid = 'public.categories'::regclass
    LOOP
        EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT ' || quote_ident(r.conname);
        RAISE NOTICE 'Dropped old constraint: %', r.conname;
    END LOOP;

    -- 2. Create the SINGLE correct Foreign Key on 'category_id'
    -- We assume 'category_id' column exists (added in previous steps).
    -- If 'categoryId' (camelCase) exists, we ignore it for relationships.
    
    ALTER TABLE public.products 
    ADD CONSTRAINT products_category_id_fkey 
    FOREIGN KEY (category_id) 
    REFERENCES public.categories(id)
    ON DELETE SET NULL;
    
    RAISE NOTICE 'Created fresh constraint: products_category_id_fkey';

    -- 3. Force schema cache reload
    NOTIFY pgrst, 'reload config';
END $$;
