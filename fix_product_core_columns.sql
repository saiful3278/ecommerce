-- Fix for missing core columns (name, slug, description) in products table

DO $$
BEGIN
    -- 1. Check and add 'name' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'name') THEN
        RAISE NOTICE 'name column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN name text;
        -- We can't easily enforce NOT NULL on an existing table without default values or data cleanup, 
        -- but for a new table it's fine. We'll leave it nullable for now to avoid errors if rows exist.
        RAISE NOTICE 'Successfully added name column.';
    END IF;

    -- 2. Check and add 'slug' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
        RAISE NOTICE 'slug column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN slug text;
        RAISE NOTICE 'Successfully added slug column.';
    END IF;

    -- 3. Check and add 'description' column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
        RAISE NOTICE 'description column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN description text;
        RAISE NOTICE 'Successfully added description column.';
    END IF;

    -- 4. Force schema cache reload for PostgREST
    NOTIFY pgrst, 'reload config';
    
    RAISE NOTICE 'Triggered PostgREST schema cache reload.';
END $$;
