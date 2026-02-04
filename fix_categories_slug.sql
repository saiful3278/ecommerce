-- Fix for missing columns in categories table
-- Run this in Supabase SQL Editor

DO $$
BEGIN
    -- 1. Check and add slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'slug') THEN
        ALTER TABLE public.categories ADD COLUMN slug text;
        -- Populate slug
        UPDATE public.categories SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')) WHERE slug IS NULL;
        
        -- Enforce NOT NULL and UNIQUE if possible (might fail if duplicates exist)
        BEGIN
            ALTER TABLE public.categories ALTER COLUMN slug SET NOT NULL;
            ALTER TABLE public.categories ADD CONSTRAINT categories_slug_key UNIQUE (slug);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not set constraints on slug (likely duplicates or nulls remaining): %', SQLERRM;
        END;
        RAISE NOTICE 'Added slug column to categories table';
    END IF;

    -- 2. Check and add images column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'images') THEN
        ALTER TABLE public.categories ADD COLUMN images text[] DEFAULT '{}'::text[];
        RAISE NOTICE 'Added images column to categories table';
    END IF;
END $$;
