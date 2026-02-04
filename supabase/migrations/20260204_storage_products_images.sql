insert into storage.buckets (id, name, public)
values ('products-images', 'products-images', true)
on conflict (id) do update set public = excluded.public;

-- Optional: set limits and allowed MIME types:
-- update storage.buckets
--   set file_size_limit = '50MiB',
--       allowed_mime_types = array['image/png','image/jpeg','image/webp']
-- where id = 'products-images';

-- RLS: only admins can write/delete product images
create policy "admin upload product images"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'products-images'
  );

create policy "admin update product images"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'products-images'
  )
  with check (
    bucket_id = 'products-images'
  );

create policy "admin delete product images"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'products-images'
  );
