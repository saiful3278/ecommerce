-- Fix for 'title' column not-null constraint violation
-- This script migrates data from 'title' to 'name' and makes 'title' nullable

DO $$
BEGIN
    -- 1. Check if 'title' column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'title') THEN
        RAISE NOTICE 'Found legacy column "title". Migrating data to "name"...';
        
        -- Copy data from title to name where name is null
        -- This ensures existing products show up correctly in the UI (which uses 'name')
        UPDATE public.products 
        SET name = title 
        WHERE name IS NULL AND title IS NOT NULL;
        
        -- 2. Make 'title' nullable
        -- This fixes the creation error because the code doesn't send 'title'
        ALTER TABLE public.products ALTER COLUMN title DROP NOT NULL;
        
        RAISE NOTICE 'Successfully made "title" nullable and migrated data.';
    ELSE
        RAISE NOTICE 'Column "title" does not exist. No action needed.';
    END IF;

    -- 3. Force schema cache reload for PostgREST
    NOTIFY pgrst, 'reload config';
    
    RAISE NOTICE 'Triggered PostgREST schema cache reload.';
END $$;
