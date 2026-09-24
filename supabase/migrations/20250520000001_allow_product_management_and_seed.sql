-- ==============================================================================
-- Migration: Allow Product & Category Management RLS and Seed Initial Data
-- ==============================================================================

-- 1. Categories RLS Policies
drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using (
    auth.role() = 'authenticated'
    or auth.role() = 'anon'
    or public.is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or auth.role() = 'anon'
    or public.is_admin()
  );

-- 2. Products RLS Policies
drop policy if exists "Admins can manage products" on public.products;
create policy "Admins can manage products"
  on public.products for all
  using (
    auth.role() = 'authenticated'
    or auth.role() = 'anon'
    or public.is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or auth.role() = 'anon'
    or public.is_admin()
  );

-- 3. Product Variants RLS Policies
drop policy if exists "Admins can manage product variants" on public.product_variants;
create policy "Admins can manage product variants"
  on public.product_variants for all
  using (
    auth.role() = 'authenticated'
    or auth.role() = 'anon'
    or public.is_admin()
  )
  with check (
    auth.role() = 'authenticated'
    or auth.role() = 'anon'
    or public.is_admin()
  );

-- 4. Seed Standard Categories if not exist
insert into public.categories (name, slug, depth, sort_order, is_active)
values
  ('전자제품', 'electronics', 1, 1, true),
  ('의류', 'clothing', 1, 2, true),
  ('식품', 'food', 1, 3, true),
  ('기타', 'etc', 1, 4, true)
on conflict (slug) do nothing;

-- 5. Seed Initial Products (Matching SEED_PRODUCTS)
insert into public.products (
  product_code, name_ko, category_id, regular_price, sale_price, stock_quantity, safety_stock, status, cover_image_url
)
values
  ('PROD-10001', '울트라 슬림 16인치 노트북', (select id from public.categories where slug = 'electronics' limit 1), 1890000, 1690000, 4, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=120&auto=format&fit=crop&q=60'),
  ('PROD-10002', '무선 노이즈캔슬링 프리미엄 헤드폰', (select id from public.categories where slug = 'electronics' limit 1), 380000, 329000, 28, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=120&auto=format&fit=crop&q=60'),
  ('PROD-10003', '기계식 무접점 게이밍 키보드', (select id from public.categories where slug = 'electronics' limit 1), 175000, 149000, 2, 5, 'ACTIVE', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=120&auto=format&fit=crop&q=60'),
  ('PROD-10004', '27인치 4K UHD 고화질 모니터', (select id from public.categories where slug = 'electronics' limit 1), 450000, 399000, 0, 5, 'OUT_OF_STOCK', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=120&auto=format&fit=crop&q=60'),
  ('PROD-20001', '프리미엄 캐시미어 블렌드 싱글 코트', (select id from public.categories where slug = 'clothing' limit 1), 289000, 249000, 18, 8, 'ACTIVE', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=60'),
  ('PROD-20002', '헤비웨이트 베이직 오버사이즈 후드티', (select id from public.categories where slug = 'clothing' limit 1), 69000, 52000, 3, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=120&auto=format&fit=crop&q=60'),
  ('PROD-20003', '클래식 테이퍼드 핏 데님 팬츠', (select id from public.categories where slug = 'clothing' limit 1), 89000, 79000, 35, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1542272604-780c96856592?w=120&auto=format&fit=crop&q=60'),
  ('PROD-20004', '메리노 울 니트 크루넥 가디건', (select id from public.categories where slug = 'clothing' limit 1), 119000, 99000, 0, 5, 'OUT_OF_STOCK', 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=120&auto=format&fit=crop&q=60'),
  ('PROD-30001', '청송 프리미엄 GAP 유기농 꿀사과 5kg', (select id from public.categories where slug = 'food' limit 1), 42000, 36000, 65, 15, 'ACTIVE', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=120&auto=format&fit=crop&q=60'),
  ('PROD-30002', '1++ 등급 한우 안심 스테이크 세트 600g', (select id from public.categories where slug = 'food' limit 1), 110000, 95000, 5, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=60'),
  ('PROD-30003', '스페셜티 에티오피아 싱글오리진 원두 500g', (select id from public.categories where slug = 'food' limit 1), 28000, 24000, 42, 10, 'ACTIVE', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=120&auto=format&fit=crop&q=60'),
  ('PROD-30004', '제주 수제 프리미엄 감귤 한과 세트', (select id from public.categories where slug = 'food' limit 1), 35000, 29000, 0, 10, 'OUT_OF_STOCK', 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=120&auto=format&fit=crop&q=60')
on conflict (product_code) do nothing;

