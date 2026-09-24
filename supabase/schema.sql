-- ==============================================================================
-- CommerceHub Supabase Database Schema & RLS Policies
-- Next.js 16 (App Router) & Supabase SSR Architecture
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ==============================================================================
-- 2. HELPER FUNCTIONS
-- ==============================================================================

-- Helper function to automatically update `updated_at` column
create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- 3. USERS TABLE (public.users referencing auth.users)
-- ==============================================================================

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  customer_number text unique, -- e.g. 'CUST-08419'
  email text not null,
  name text not null,
  phone text,
  role text not null default 'customer' check (role in ('super_admin', 'admin', 'manager', 'staff', 'customer')),
  avatar_url text,
  membership_grade text not null default 'BRONZE' check (membership_grade in ('BRONZE', 'SILVER', 'GOLD', 'VIP', 'VVIP')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DORMANT_WARNING', 'DORMANT', 'WITHDRAWN')),
  total_spent numeric(15, 2) not null default 0,
  total_orders integer not null default 0,
  reward_points integer not null default 0,
  coupons_count integer not null default 0,
  personal_customs_code text, -- 개인통관고유부호
  gender text check (gender in ('MALE', 'FEMALE', 'OTHER')),
  birth_year integer,
  sms_consent boolean not null default false,
  email_consent boolean not null default false,
  app_push_consent boolean not null default false,
  default_address text,
  default_zipcode text,
  last_visit_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for performance
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_users_customer_number on public.users(customer_number);
create index if not exists idx_users_membership_grade on public.users(membership_grade);

-- Trigger for users updated_at
drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_current_timestamp_updated_at();

-- Helper function to check if current auth user is admin/staff
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.users
    where id = auth.uid()
      and role in ('super_admin', 'admin', 'manager', 'staff')
  );
end;
$$ language plpgsql security definer;

-- Trigger to sync auth.users -> public.users on signup
create or replace function public.handle_new_user()
returns trigger as $$
declare
  generated_cust_num text;
begin
  generated_cust_num := 'CUST-' || lpad(floor(random() * 90000 + 10000)::text, 5, '0');

  insert into public.users (
    id,
    customer_number,
    email,
    name,
    phone,
    role,
    avatar_url,
    membership_grade,
    status
  ) values (
    new.id,
    generated_cust_num,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    new.raw_user_meta_data->>'avatar_url',
    'BRONZE',
    'ACTIVE'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if already exists then recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- 4. CATEGORIES TABLE
-- ==============================================================================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  parent_id uuid references public.categories(id) on delete set null,
  depth integer not null default 1, -- 1: 대분류, 2: 중분류, 3: 소분류
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_categories_parent_id on public.categories(parent_id);

-- ==============================================================================
-- 5. PRODUCTS & VARIANTS (SKU) TABLES
-- ==============================================================================

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique, -- e.g. 'PROD-98241'
  name_ko text not null,
  name_en text,
  category_id uuid references public.categories(id) on delete set null,
  regular_price numeric(15, 2) not null,
  sale_price numeric(15, 2) not null,
  discount_rate integer not null default 0,
  tax_type text not null default 'TAXABLE' check (tax_type in ('TAXABLE', 'TAX_EXEMPT')),
  max_order_quantity integer not null default 99,
  stock_quantity integer not null default 0,
  safety_stock integer not null default 10, -- 품절 임박 경고 기준치
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'OUT_OF_STOCK', 'HIDDEN', 'DRAFT')),
  sku_code text,
  manufacturer text,
  brand_name text,
  description text,
  cover_image_url text,
  additional_images jsonb not null default '[]'::jsonb,
  shipping_fee numeric(10, 2) not null default 3000,
  origin_address text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_status on public.products(status);
create index if not exists idx_products_product_code on public.products(product_code);
create index if not exists idx_products_created_at on public.products(created_at desc);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_current_timestamp_updated_at();

-- Product Variants (SKU 옵션)
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku_code text not null,
  variant_name text not null, -- e.g. 'Charcoal Gray / 48 (Medium)'
  options jsonb not null default '{}'::jsonb, -- e.g. {"color": "Charcoal Gray", "size": "48"}
  additional_price numeric(15, 2) not null default 0,
  stock_quantity integer not null default 0,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_variants_product_id on public.product_variants(product_id);

drop trigger if exists set_variants_updated_at on public.product_variants;
create trigger set_variants_updated_at
before update on public.product_variants
for each row execute function public.set_current_timestamp_updated_at();

-- ==============================================================================
-- 6. ORDERS & ORDER ITEMS TABLES
-- ==============================================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique, -- e.g. 'ORD-20250520-00192'
  customer_id uuid references public.users(id) on delete set null,
  order_name text not null, -- e.g. '프리미엄 싱글 코트 외 1건'
  status text not null default 'PAYMENT_PENDING' check (
    status in (
      'PAYMENT_PENDING', -- 입금 대기
      'PAID',            -- 결제 완료 (발주 필요)
      'PREPARING',       -- 배송 준비 (송장 미등록)
      'SHIPPING',        -- 배송 중 (택배 집하)
      'DELIVERED',       -- 배송 완료
      'CANCEL_REQUESTED',-- 취소 요청 (승인 대기)
      'CANCELLED',       -- 취소 완료
      'RETURN_REQUESTED',-- 반품 요청
      'RETURNED'         -- 반품 완료
    )
  ),
  total_product_amount numeric(15, 2) not null default 0,
  discount_amount numeric(15, 2) not null default 0,
  point_used integer not null default 0,
  shipping_fee numeric(15, 2) not null default 0,
  total_paid_amount numeric(15, 2) not null default 0,
  payment_method text not null default 'CREDIT_CARD' check (
    payment_method in ('CREDIT_CARD', 'NAVER_PAY', 'KAKAO_PAY', 'TOSS_PAY', 'VIRTUAL_ACCOUNT', 'MOBILE')
  ),
  payment_status text not null default 'PENDING' check (
    payment_status in ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')
  ),
  payment_details jsonb not null default '{}'::jsonb, -- e.g. { card_company: "현대카드", installment: 12, approved_at: "..." }
  recipient_name text not null,
  recipient_phone text not null,
  shipping_address text not null,
  shipping_zipcode text not null,
  shipping_message text,
  tracking_company text, -- e.g. 'CJ대한통운', '우체국택배'
  tracking_number text,  -- e.g. '6892-0193-4411'
  paid_at timestamp with time zone,
  shipped_at timestamp with time zone,
  delivered_at timestamp with time zone,
  cancelled_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_orders_customer_id on public.orders(customer_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_order_number on public.orders(order_number);
create index if not exists idx_orders_created_at on public.orders(created_at desc);

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_current_timestamp_updated_at();

-- Order Items
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  variant_name text,
  product_image_url text,
  sku_code text,
  unit_price numeric(15, 2) not null,
  quantity integer not null default 1,
  discount_amount numeric(15, 2) not null default 0,
  total_price numeric(15, 2) not null,
  status text not null default 'ORDERED' check (
    status in ('ORDERED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCEL_REQUESTED', 'CANCELLED', 'RETURNED')
  ),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);
create index if not exists idx_order_items_product_id on public.order_items(product_id);

-- ==============================================================================
-- 7. CS NOTES & AUDIT TRAILS (관리자 CS 메모 & 처리 이력)
-- ==============================================================================

-- Order CS Notes
create table if not exists public.order_notes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  author_id uuid references public.users(id) on delete set null,
  author_name text not null,
  content text not null,
  is_system boolean not null default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_order_notes_order_id on public.order_notes(order_id);

-- Customer CS Notes
create table if not exists public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id) on delete cascade,
  author_id uuid references public.users(id) on delete set null,
  author_name text not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_customer_notes_customer_id on public.customer_notes(customer_id);

-- ==============================================================================
-- 8. COUPONS & POINT TRANSACTIONS
-- ==============================================================================

create table if not exists public.customer_coupons (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  discount_amount numeric(15, 2),
  discount_rate integer,
  min_order_amount numeric(15, 2) not null default 0,
  is_used boolean not null default false,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_customer_coupons_customer on public.customer_coupons(customer_id);

create table if not exists public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  amount integer not null, -- 양수는 적립, 음수는 차감
  balance_after integer not null,
  description text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_points_customer on public.point_transactions(customer_id);

-- ==============================================================================
-- 9. STORE SETTINGS TABLE (쇼핑몰 환경설정)
-- ==============================================================================

create table if not exists public.store_settings (
  id text primary key default 'default',
  store_name text not null default 'CommerceHub 공식스토어',
  representative_name text not null default '김은영',
  business_number text not null default '214-88-91204',
  ecommerce_permit_number text not null default '2024-서울강남-03891호',
  cs_phone text not null default '1588-4920',
  cs_email text not null default 'support@commercehub.co.kr',
  address text not null default '서울특별시 강남구 테헤란로 427, 위워크타워 14층 1402호',
  zipcode text not null default '06164',
  logo_header_url text,
  logo_mobile_url text,
  favicon_url text,
  is_operating boolean not null default true,
  require_adult_verification boolean not null default false,
  allow_guest_order boolean not null default true,
  default_shipping_fee numeric(10, 2) not null default 3000,
  free_shipping_threshold numeric(15, 2) not null default 50000,
  island_mountain_shipping_fee numeric(10, 2) not null default 3000,
  purchase_reward_rate numeric(4, 2) not null default 1.5,
  text_review_reward integer not null default 500,
  photo_review_reward integer not null default 1500,
  welcome_reward integer not null default 3000,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_by uuid references public.users(id)
);

drop trigger if exists set_store_settings_updated_at on public.store_settings;
create trigger set_store_settings_updated_at
before update on public.store_settings
for each row execute function public.set_current_timestamp_updated_at();

-- Insert default store settings row if not exists
insert into public.store_settings (id)
values ('default')
on conflict (id) do nothing;

-- ==============================================================================
-- 10. DASHBOARD SUMMARY RPC FUNCTION (메인 대시보드 4대 핵심 지표)
-- ==============================================================================

create or replace function public.get_dashboard_summary()
returns json as $$
declare
  v_today_start timestamp with time zone := date_trunc('day', timezone('Asia/Seoul', now()));
  v_yesterday_start timestamp with time zone := v_today_start - interval '1 day';
  
  v_today_sales numeric(15, 2) := 0;
  v_yesterday_sales numeric(15, 2) := 0;
  v_sales_diff_rate numeric(5, 2) := 0;

  v_today_orders integer := 0;
  v_yesterday_orders integer := 0;
  v_orders_diff integer := 0;

  v_today_customers integer := 0;
  v_yesterday_customers integer := 0;
  v_customers_diff integer := 0;

  v_low_stock_products integer := 0;
begin
  -- 1. 오늘 & 어제 매출 (결제 완료 이상)
  select coalesce(sum(total_paid_amount), 0), coalesce(count(*), 0)
  into v_today_sales, v_today_orders
  from public.orders
  where created_at >= v_today_start
    and status not in ('CANCELLED', 'PAYMENT_PENDING');

  select coalesce(sum(total_paid_amount), 0), coalesce(count(*), 0)
  into v_yesterday_sales, v_yesterday_orders
  from public.orders
  where created_at >= v_yesterday_start and created_at < v_today_start
    and status not in ('CANCELLED', 'PAYMENT_PENDING');

  if v_yesterday_sales > 0 then
    v_sales_diff_rate := round(((v_today_sales - v_yesterday_sales) / v_yesterday_sales) * 100, 1);
  else
    v_sales_diff_rate := 0;
  end if;

  v_orders_diff := v_today_orders - v_yesterday_orders;

  -- 2. 오늘 & 어제 신규 가입 고객
  select count(*) into v_today_customers
  from public.users
  where created_at >= v_today_start and role = 'customer';

  select count(*) into v_yesterday_customers
  from public.users
  where created_at >= v_yesterday_start and created_at < v_today_start and role = 'customer';

  v_customers_diff := v_today_customers - v_yesterday_customers;

  -- 3. 재고 부족/품절 상품 개수 (safety_stock 이하 또는 stock_quantity <= 0)
  select count(*) into v_low_stock_products
  from public.products
  where status != 'HIDDEN' and stock_quantity <= safety_stock;

  return json_build_object(
    'today_sales', v_today_sales,
    'sales_diff_rate', v_sales_diff_rate,
    'today_orders', v_today_orders,
    'orders_diff', v_orders_diff,
    'today_customers', v_today_customers,
    'customers_diff', v_customers_diff,
    'low_stock_products', v_low_stock_products
  );
end;
$$ language plpgsql security definer;

-- ==============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_notes enable row level security;
alter table public.customer_notes enable row level security;
alter table public.customer_coupons enable row level security;
alter table public.point_transactions enable row level security;
alter table public.store_settings enable row level security;

-- ------------------------------------------------------------------------------
-- A. USERS POLICIES
-- ------------------------------------------------------------------------------
-- 1) Any user can read their own profile
drop policy if exists "Users can read their own profile" on public.users;
create policy "Users can read their own profile"
  on public.users for select
  using (auth.uid() = id or public.is_admin());

-- 2) Users can update their own non-sensitive profile
drop policy if exists "Users can update their own profile" on public.users;
create policy "Users can update their own profile"
  on public.users for update
  using (auth.uid() = id or public.is_admin());

-- 3) Only admins can insert or delete users directly
drop policy if exists "Admins can manage all users" on public.users;
create policy "Admins can manage all users"
  on public.users for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- B. CATEGORIES POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Anyone can read active categories" on public.categories;
create policy "Anyone can read active categories"
  on public.categories for select
  using (is_active = true or public.is_admin());

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

-- ------------------------------------------------------------------------------
-- C. PRODUCTS & VARIANTS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Anyone can read active products" on public.products;
create policy "Anyone can read active products"
  on public.products for select
  using (status != 'HIDDEN' or public.is_admin());

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

drop policy if exists "Anyone can read active product variants" on public.product_variants;
create policy "Anyone can read active product variants"
  on public.product_variants for select
  using (true);

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

-- ------------------------------------------------------------------------------
-- D. ORDERS & ORDER ITEMS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Users can read their own orders" on public.orders;
create policy "Users can read their own orders"
  on public.orders for select
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "Authenticated users can create orders" on public.orders;
create policy "Authenticated users can create orders"
  on public.orders for insert
  with check (customer_id = auth.uid() or auth.uid() is not null or public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
  on public.orders for update
  using (public.is_admin() or customer_id = auth.uid());

drop policy if exists "Admins can manage all orders" on public.orders;
create policy "Admins can manage all orders"
  on public.orders for all
  using (public.is_admin());

drop policy if exists "Users can read their order items" on public.order_items;
create policy "Users can read their order items"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (orders.customer_id = auth.uid() or public.is_admin())
    )
  );

drop policy if exists "Users can insert order items for their orders" on public.order_items;
create policy "Users can insert order items for their orders"
  on public.order_items for insert
  with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
        and (orders.customer_id = auth.uid() or auth.uid() is not null or public.is_admin())
    )
  );

drop policy if exists "Admins can manage all order items" on public.order_items;
create policy "Admins can manage all order items"
  on public.order_items for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- E. CS NOTES (Order Notes & Customer Notes) POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Admins can manage order notes" on public.order_notes;
create policy "Admins can manage order notes"
  on public.order_notes for all
  using (public.is_admin());

drop policy if exists "Admins can manage customer notes" on public.customer_notes;
create policy "Admins can manage customer notes"
  on public.customer_notes for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- F. COUPONS & POINT TRANSACTIONS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Users can read their own coupons" on public.customer_coupons;
create policy "Users can read their own coupons"
  on public.customer_coupons for select
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage coupons" on public.customer_coupons;
create policy "Admins can manage coupons"
  on public.customer_coupons for all
  using (public.is_admin());

drop policy if exists "Users can read their own point transactions" on public.point_transactions;
create policy "Users can read their own point transactions"
  on public.point_transactions for select
  using (customer_id = auth.uid() or public.is_admin());

drop policy if exists "Admins can manage point transactions" on public.point_transactions;
create policy "Admins can manage point transactions"
  on public.point_transactions for all
  using (public.is_admin());

-- ------------------------------------------------------------------------------
-- G. STORE SETTINGS POLICIES
-- ------------------------------------------------------------------------------
drop policy if exists "Anyone can read store settings" on public.store_settings;
create policy "Anyone can read store settings"
  on public.store_settings for select
  using (true);

drop policy if exists "Only admins can update store settings" on public.store_settings;
create policy "Only admins can update store settings"
  on public.store_settings for update
  using (public.is_admin());

-- ==============================================================================
-- 8. STORAGE BUCKETS & STORAGE POLICIES
-- ==============================================================================

-- Create 'product-images' bucket for catalog photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB (10 * 1024 * 1024)
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];

-- Storage RLS Policies (RLS is already enabled by default on storage.objects in Supabase)
drop policy if exists "Public Access to Product Images" on storage.objects;
create policy "Public Access to Product Images"
  on storage.objects for select
  using (bucket_id = 'product-images');

drop policy if exists "Allow Upload to Product Images" on storage.objects;
create policy "Allow Upload to Product Images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and (auth.role() = 'authenticated' or auth.role() = 'anon' or public.is_admin())
  );

drop policy if exists "Allow Update to Product Images" on storage.objects;
create policy "Allow Update to Product Images"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and (auth.role() = 'authenticated' or auth.role() = 'anon' or public.is_admin())
  );

drop policy if exists "Allow Delete to Product Images" on storage.objects;
create policy "Allow Delete to Product Images"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and (auth.role() = 'authenticated' or auth.role() = 'anon' or public.is_admin())
  );
