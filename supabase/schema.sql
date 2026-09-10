-- Supabase schema for Kathiyawadi Karigari
-- Run this in Supabase SQL Editor after creating your free project.
-- IMPORTANT: Storage policies and RLS should be reviewed before production.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_code text not null unique,
  name text not null,
  category text not null default 'hoop',
  description text,
  image_url text,
  customization_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_inch integer not null,
  price_inr integer not null check (price_inr >= 0),
  variant_code text not null unique,
  active boolean not null default true,
  unique(product_id, size_inch)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  mobile text,
  email text,
  address text,
  pincode text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'payment_pending',
  total_inr integer not null check (total_inr >= 0),
  payment_proof_url text,
  customization_notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  product_name text not null,
  variant_code text not null,
  size_inch integer not null,
  unit_price_inr integer not null,
  quantity integer not null check (quantity > 0),
  customization jsonb not null default '{}'::jsonb
);

-- Seed the two current products.
insert into public.products (product_code,name,category,description,image_url)
values
('KKPRILNNNET','Couple Hoop Without Tassels','hoop',
'A personalized hand-embroidered couple hoop without tassel, featuring a couple illustration, names, special date, floral details, and decorative embroidery. Its clean and elegant finish makes it perfect for weddings, anniversaries, engagements, and modern home décor.',
'assets/couple-hoop-without-tassels.jpeg'),
('KKPRILTNNET','Couple Hoop With Tassels','hoop',
'A personalized hand-embroidered couple hoop with tassel, featuring a couple illustration, names, special date, floral details, and decorative embroidery. The elegant tassel finish adds a beautiful traditional touch, making it perfect for weddings, anniversaries, engagements, and gifting.',
'assets/couple-hoop-with-tassels.jpeg')
on conflict (product_code) do nothing;

insert into public.product_variants(product_id,size_inch,price_inr,variant_code)
select p.id, v.size_inch, v.price_inr, p.product_code || lpad(v.size_inch::text,2,'0')
from public.products p
join (values
  ('KKPRILNNNET',6,579),('KKPRILNNNET',8,779),('KKPRILNNNET',10,1149),
  ('KKPRILNNNET',12,1599),('KKPRILNNNET',14,2229),('KKPRILNNNET',16,3129),
  ('KKPRILNNNET',18,4469),('KKPRILNNNET',20,6529),('KKPRILNNNET',22,9269),
  ('KKPRILTNNET',6,889),('KKPRILTNNET',8,1149),('KKPRILTNNET',10,1579),
  ('KKPRILTNNET',12,2099),('KKPRILTNNET',14,2859),('KKPRILTNNET',16,3829),
  ('KKPRILTNNET',18,5239),('KKPRILTNNET',20,7369),('KKPRILTNNET',22,10239)
) as v(product_code,size_inch,price_inr) on v.product_code=p.product_code
on conflict (variant_code) do nothing;

-- Enable RLS before production.
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Public catalog policies:
create policy "public can view active products"
on public.products for select
to anon, authenticated
using (active = true);

create policy "public can view active variants"
on public.product_variants for select
to anon, authenticated
using (active = true);

-- Customer-owned records:
create policy "users can view own profile"
on public.profiles for select
to authenticated using (auth.uid() = id);

create policy "users can insert own profile"
on public.profiles for insert
to authenticated with check (auth.uid() = id);

create policy "users can update own profile"
on public.profiles for update
to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "users can view own orders"
on public.orders for select
to authenticated using (auth.uid() = customer_id);

create policy "users can create own orders"
on public.orders for insert
to authenticated with check (auth.uid() = customer_id);

create policy "users can view items from own orders"
on public.order_items for select
to authenticated using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.customer_id = auth.uid()
  )
);

-- Do NOT expose payment proof files publicly.
-- Create a private Supabase Storage bucket named: payment-proofs
-- Add authenticated-user upload/read policies later, restricted by order ownership.
