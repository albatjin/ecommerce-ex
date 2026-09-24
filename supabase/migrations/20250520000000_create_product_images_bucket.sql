-- ==============================================================================
-- Migration: Create 'product-images' Storage Bucket & RLS Policies
-- CommerceHub Next.js 16 & Supabase Architecture
-- ==============================================================================

-- 1. Ensure columns exist on public.products table
alter table if exists public.products
  add column if not exists cover_image_url text,
  add column if not exists additional_images jsonb not null default '[]'::jsonb;

-- 2. Create 'product-images' bucket in storage.buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit (10 * 1024 * 1024)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
-- 3. Storage RLS Policies (RLS is enabled by default on storage.objects in Supabase)

-- 4. Policy: Anyone can view product images (Public Read for Storefront & Admin)
drop policy if exists "Public Access to Product Images" on storage.objects;
create policy "Public Access to Product Images"
on storage.objects for select
using (bucket_id = 'product-images');

-- 5. Policy: Authenticated users, admins, and anon developers can upload product images
drop policy if exists "Allow Upload to Product Images" on storage.objects;
create policy "Allow Upload to Product Images"
on storage.objects for insert
with check (
  bucket_id = 'product-images'
  and (auth.role() = 'authenticated' or auth.role() = 'anon' or public.is_admin())
);

-- 6. Policy: Authenticated users & admins can update product images
drop policy if exists "Allow Update to Product Images" on storage.objects;
create policy "Allow Update to Product Images"
on storage.objects for update
using (
  bucket_id = 'product-images'
  and (auth.role() = 'authenticated' or auth.role() = 'anon' or public.is_admin())
);

-- 7. Policy: Authenticated users & admins can delete product images
drop policy if exists "Allow Delete to Product Images" on storage.objects;
create policy "Allow Delete to Product Images"
on storage.objects for delete
using (
  bucket_id = 'product-images'
  and (auth.role() = 'authenticated' or auth.role() = 'anon' or public.is_admin())
);
