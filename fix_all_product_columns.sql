-- Fix for potentially missing columns in products table and schema cache reload

DO $$
BEGIN
    -- 1. Check and add is_featured column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_featured') THEN
        RAISE NOTICE 'is_featured column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN is_featured boolean DEFAULT false;
        RAISE NOTICE 'Successfully added is_featured column.';
    END IF;

    -- 2. Check and add is_trending column (proactive check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_trending') THEN
        RAISE NOTICE 'is_trending column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN is_trending boolean DEFAULT false;
        RAISE NOTICE 'Successfully added is_trending column.';
    END IF;

    -- 3. Check and add is_new column (proactive check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_new') THEN
        RAISE NOTICE 'is_new column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN is_new boolean DEFAULT false;
        RAISE NOTICE 'Successfully added is_new column.';
    END IF;

    -- 4. Check and add average_rating column (proactive check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'average_rating') THEN
        RAISE NOTICE 'average_rating column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN average_rating numeric DEFAULT 0;
        RAISE NOTICE 'Successfully added average_rating column.';
    END IF;

    -- 5. Check and add review_count column (proactive check)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'review_count') THEN
        RAISE NOTICE 'review_count column is missing. Adding it now...';
        ALTER TABLE public.products ADD COLUMN review_count integer DEFAULT 0;
        RAISE NOTICE 'Successfully added review_count column.';
    END IF;

    -- 6. Force schema cache reload for PostgREST
    NOTIFY pgrst, 'reload config';
    
    RAISE NOTICE 'Triggered PostgREST schema cache reload.';
END $$;
