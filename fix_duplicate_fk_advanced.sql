-- Advanced fix for duplicate Foreign Keys between products and categories
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    r RECORD;
    kept_one BOOLEAN := FALSE;
BEGIN
    RAISE NOTICE 'Starting cleanup of duplicate Foreign Keys between products and categories...';

    -- Loop through all FK constraints linking 'products' -> 'categories'
    FOR r IN 
        SELECT conname
        FROM pg_constraint 
        WHERE conrelid = 'public.products'::regclass 
        AND confrelid = 'public.categories'::regclass
        ORDER BY conname ASC -- Sort alphabetically to ensure consistent results
    LOOP
        IF kept_one = FALSE THEN
            -- We keep the first one we find
            RAISE NOTICE '✅ Keeping constraint: %', r.conname;
            kept_one := TRUE;
        ELSE
            -- We drop any extras
            RAISE NOTICE '🗑️ Dropping duplicate constraint: %', r.conname;
            EXECUTE 'ALTER TABLE public.products DROP CONSTRAINT ' || quote_ident(r.conname);
        END IF;
    END LOOP;

    IF kept_one = FALSE THEN
        RAISE NOTICE '⚠️ No relationships found! You might need to add one.';
    ELSE
        RAISE NOTICE 'Cleanup complete. Schema cache reloaded.';
        NOTIFY pgrst, 'reload config';
    END IF;
END $$;
