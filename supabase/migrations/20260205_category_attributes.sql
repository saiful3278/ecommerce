-- Ensure base tables exist (in case init migration failed or was partial)

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  images text[] not null default '{}'::text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.attributes (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.attribute_values (
  id uuid primary key default gen_random_uuid(),
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  value text not null,
  slug text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on these tables
alter table public.categories enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_values enable row level security;

-- Create policies (using DO blocks to avoid errors if they already exist)
do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'categories' and policyname = 'public read categories') then
    create policy "public read categories" on public.categories for select to public using (true);
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'attributes' and policyname = 'public read attributes') then
    create policy "public read attributes" on public.attributes for select to public using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'attribute_values' and policyname = 'public read attribute values') then
    create policy "public read attribute values" on public.attribute_values for select to public using (true);
  end if;
end
$$;

-- Now create the new junction table
create table if not exists public.category_attributes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  is_required boolean not null default false,
  created_at timestamptz default now(),
  unique (category_id, attribute_id)
);

alter table public.category_attributes enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'category_attributes' and policyname = 'public read category_attributes') then
    create policy "public read category_attributes" on public.category_attributes for select to public using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'category_attributes' and policyname = 'authenticated insert category_attributes') then
    create policy "authenticated insert category_attributes" on public.category_attributes for insert to authenticated with check (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'category_attributes' and policyname = 'authenticated delete category_attributes') then
    create policy "authenticated delete category_attributes" on public.category_attributes for delete to authenticated using (true);
  end if;
end
$$;
