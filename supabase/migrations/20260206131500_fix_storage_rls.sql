-- Enable RLS on storage.objects if not already enabled (it usually is)
-- But we need policies for authenticated users to upload to 'products-images' bucket

-- Allow authenticated users to upload images to products-images bucket
CREATE POLICY "authenticated insert products-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'products-images');

-- Allow authenticated users to update images in products-images bucket
CREATE POLICY "authenticated update products-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'products-images')
  WITH CHECK (bucket_id = 'products-images');

-- Allow authenticated users to delete images in products-images bucket
CREATE POLICY "authenticated delete products-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'products-images');

-- Allow authenticated users to read images (though public bucket allows everyone)
CREATE POLICY "authenticated select products-images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'products-images');
