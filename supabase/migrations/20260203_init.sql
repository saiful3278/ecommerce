create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null,
  name text,
  avatar_url text,
  role text not null default 'USER',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"
  on public.profiles
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "update own profile"
  on public.profiles
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  is_new boolean not null default false,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_best_seller boolean not null default false,
  average_rating numeric not null default 0,
  review_count integer not null default 0,
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique not null,
  images text[] not null default '{}'::text[],
  price numeric not null,
  stock integer not null default 0,
  low_stock_threshold integer not null default 10,
  barcode text,
  warehouse_location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_variant_attributes (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  attribute_id uuid not null references public.attributes(id) on delete cascade,
  value_id uuid not null references public.attribute_values(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  rating integer not null,
  comment text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  status text not null default 'ACTIVE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  quantity integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (cart_id, variant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  amount numeric not null default 0,
  status text not null default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null default 1,
  price numeric not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null default 'PENDING',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type text not null,
  format text not null,
  parameters jsonb not null default '{}'::jsonb,
  file_path text,
  created_at timestamptz default now()
);

create table if not exists public.logs (
  id uuid primary key default gen_random_uuid(),
  level text not null,
  message text not null,
  context jsonb,
  created_at timestamptz default now()
);

create table if not exists public.sections (
  id bigint generated by default as identity primary key,
  type text not null default 'HERO',
  title text,
  description text,
  images text[] not null default '{}'::text[],
  icons text,
  link text,
  cta_text text,
  is_visible boolean not null default false,
  primary_color text,
  secondary_color text
);

alter table public.categories enable row level security;
alter table public.attributes enable row level security;
alter table public.attribute_values enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_variant_attributes enable row level security;
alter table public.reviews enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.transactions enable row level security;
alter table public.reports enable row level security;
alter table public.logs enable row level security;
alter table public.sections enable row level security;

create policy "public read categories"
  on public.categories
  for select
  to public
  using (true);

create policy "public read attributes"
  on public.attributes
  for select
  to public
  using (true);

create policy "public read attribute values"
  on public.attribute_values
  for select
  to public
  using (true);

create policy "public read products"
  on public.products
  for select
  to public
  using (true);

create policy "public read variants"
  on public.product_variants
  for select
  to public
  using (true);

create policy "public read variant attributes"
  on public.product_variant_attributes
  for select
  to public
  using (true);

create policy "public read reviews"
  on public.reviews
  for select
  to public
  using (true);

create policy "admin write catalog"
  on public.categories
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "admin write products"
  on public.products
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "admin write variants"
  on public.product_variants
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "admin write variant attributes"
  on public.product_variant_attributes
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "admin write attributes"
  on public.attributes
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "admin write attribute values"
  on public.attribute_values
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "user write reviews"
  on public.reviews
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "user update own reviews"
  on public.reviews
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "user delete own reviews"
  on public.reviews
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "read own cart"
  on public.carts
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "write own cart"
  on public.carts
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "read own cart items"
  on public.cart_items
  for select
  to authenticated
  using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "write own cart items"
  on public.cart_items
  for all
  to authenticated
  using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "read own orders"
  on public.orders
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "write own orders"
  on public.orders
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "read own order items"
  on public.order_items
  for select
  to authenticated
  using (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "write own order items"
  on public.order_items
  for insert
  to authenticated
  with check (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "read own transactions"
  on public.transactions
  for select
  to authenticated
  using (
    exists(select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy "write own reports"
  on public.reports
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "admin read logs"
  on public.logs
  for select
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "admin write logs"
  on public.logs
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create policy "public read sections"
  on public.sections
  for select
  to public
  using (true);

create policy "admin write sections"
  on public.sections
  for all
  to authenticated
  using (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  )
  with check (
    exists(
      select 1 from public.profiles p
      where p.user_id = auth.uid()
        and p.role in ('ADMIN','SUPERADMIN')
    )
  );

create or replace function public.place_order(p_cart_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare v_order_id uuid;
begin
  if not exists(select 1 from public.carts c where c.id = p_cart_id and c.user_id = auth.uid()) then
    raise exception 'Unauthorized';
  end if;

  insert into public.orders(user_id, status, created_at, updated_at)
  values (auth.uid(), 'PLACED', now(), now())
  returning id into v_order_id;

  insert into public.order_items(order_id, variant_id, quantity, price, created_at, updated_at)
  select v_order_id, ci.variant_id, ci.quantity, pv.price, now(), now()
  from public.cart_items ci
  join public.product_variants pv on pv.id = ci.variant_id
  where ci.cart_id = p_cart_id;

  update public.product_variants pv
    set stock = pv.stock - ci.quantity,
        updated_at = now()
    from public.cart_items ci
    where ci.variant_id = pv.id
      and ci.cart_id = p_cart_id;

  delete from public.cart_items where cart_id = p_cart_id;

  return v_order_id;
end $$;

grant execute on function public.place_order(uuid) to authenticated;
