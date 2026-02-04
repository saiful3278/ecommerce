-- Fix for missing is_best_seller column in products table and schema cache reload

DO $$
BEGIN
    -- 1. Check if is_best_seller column exists in products table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_best_seller') THEN
        RAISE NOTICE 'is_best_seller column is missing. Adding it now...';
        
        -- Add the column
        ALTER TABLE public.products 
        ADD COLUMN is_best_seller boolean DEFAULT false;
        
        RAISE NOTICE 'Successfully added is_best_seller column.';
    ELSE
        RAISE NOTICE 'is_best_seller column already exists in products table.';
    END IF;

    -- 2. Force schema cache reload for PostgREST
    NOTIFY pgrst, 'reload config';
    
    RAISE NOTICE 'Triggered PostgREST schema cache reload.';
END $$;
