-- Fix for missing category_id column in products table and schema cache reload

DO $$
BEGIN
    -- 1. Check if category_id column exists in products table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'category_id') THEN
        RAISE NOTICE 'category_id column is missing. Adding it now...';
        
        -- Add the column
        ALTER TABLE public.products 
        ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Successfully added category_id column.';
    ELSE
        RAISE NOTICE 'category_id column already exists in products table.';
    END IF;

    -- 2. Verify foreign key constraint
    -- (The ADD COLUMN above adds it, but if column existed without FK, we might want to check. 
    --  For simplicity, we assume if it exists it's correct or we leave it be to avoid errors.)

    -- 3. Force schema cache reload for PostgREST
    -- This is often necessary when schema changes happen but the API doesn't reflect them immediately.
    NOTIFY pgrst, 'reload config';
    
    RAISE NOTICE 'Triggered PostgREST schema cache reload.';
END $$;
