-- Identify and fix duplicate relationships between products and categories

DO $$
DECLARE
    fk_record RECORD;
BEGIN
    -- 1. Find all foreign keys from products to categories
    -- We want to keep 'products_category_id_fkey' or whichever one is on 'category_id'
    -- and drop any accidental extras (like if we added one manually while one existed).
    
    FOR fk_record IN 
        SELECT con.conname
        FROM pg_catalog.pg_constraint con
        INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        INNER JOIN pg_catalog.pg_namespace nsp ON nsp.oid = connamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'products'
          AND con.contype = 'f'
          AND EXISTS (
              SELECT 1 
              FROM pg_catalog.pg_constraint con2 
              WHERE con2.oid = con.confrelid 
              AND con2.conrelid = (SELECT oid FROM pg_class WHERE relname = 'categories')
          )
    LOOP
        RAISE NOTICE 'Found foreign key: %', fk_record.conname;
    END LOOP;

    -- If we have multiple, PostgREST gets confused.
    -- We explicitly created 'products_category_id_fkey' (implicitly named) in init.sql usually.
    -- Then we ran a fix script that did:
    -- ALTER TABLE public.products ADD COLUMN category_id ... REFERENCES public.categories(id)
    
    -- If 'category_id' already existed but we didn't check properly, we might have added a second FK?
    -- Actually, ADD COLUMN ... REFERENCES creates a constraint.
    
    -- Let's try to standardize. We want ONE FK on category_id.
    -- We will drop known duplicates if they exist by name, or we can just be specific in the query.
    -- But fixing the schema is better.
    
    -- Let's assume the correct one is on column 'category_id'.
    -- If there's another column referencing categories (e.g. 'categoryId'), we should know.
    
    -- Only DROP if there are strictly more than 1 constraint pointing to categories?
    -- It's hard to script conditionally without complex dynamic SQL.
    
    -- Strategy:
    -- 1. Explicitly drop the likely duplicate constraint names if we know them.
    -- 2. Or, tell PostgREST which one to use.
    
    -- But since we want to fix it permanently:
    -- Let's check if 'category_id' has multiple constraints.
    
    -- Common names:
    -- products_category_id_fkey
    -- products_category_id_fkey1
    
    -- Let's try to drop 'products_category_id_fkey1' if it exists.
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_fkey1') THEN
        ALTER TABLE public.products DROP CONSTRAINT products_category_id_fkey1;
        RAISE NOTICE 'Dropped duplicate constraint products_category_id_fkey1';
    END IF;

    -- Also check if we have a constraint on a DIFFERENT column (e.g. if we had 'categoryId' camelCase).
    -- If so, we should drop that column or constraint.
    
    -- Force reload schema
    NOTIFY pgrst, 'reload config';

END $$;
