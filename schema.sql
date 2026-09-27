create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null default 'Bunga potong',
  unit text not null default 'ikat',
  image_url text not null default '',
  selling_price numeric(14,2) not null default 0 check (selling_price >= 0),
  estimated_selling_cost numeric(14,2) not null default 0 check (estimated_selling_cost >= 0),
  average_unit_cost numeric(14,2) not null default 0 check (average_unit_cost >= 0),
  minimum_stock numeric(12,3) not null default 3 check (minimum_stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.business_transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_type text not null check (transaction_type in ('sale', 'expense')),
  product_id uuid references public.products(id) on delete restrict,
  transaction_date date not null default current_date,
  quantity numeric(12,3) not null default 0 check (quantity >= 0),
  unit_price numeric(14,2) not null default 0 check (unit_price >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  revenue_amount numeric(14,2) not null default 0 check (revenue_amount >= 0),
  material_cost numeric(14,2) not null default 0 check (material_cost >= 0),
  labor_cost numeric(14,2) not null default 0 check (labor_cost >= 0),
  overhead_cost numeric(14,2) not null default 0 check (overhead_cost >= 0),
  expense_amount numeric(14,2) not null default 0 check (expense_amount >= 0),
  ppn_rate numeric(6,3) not null default 0 check (ppn_rate between 0 and 100),
  ppn_amount numeric(14,2) not null default 0 check (ppn_amount >= 0),
  pph_final_rate numeric(6,3) not null default 0 check (pph_final_rate between 0 and 100),
  pph_final_estimate numeric(14,2) not null default 0 check (pph_final_estimate >= 0),
  expense_category text not null default '',
  description text not null default '',
  created_at timestamptz not null default now(),
  constraint transaction_shape check (
    (transaction_type = 'sale' and product_id is not null and quantity > 0)
    or (transaction_type = 'expense' and product_id is null and expense_amount > 0)
  )
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null check (movement_type in ('purchase', 'sale', 'adjustment')),
  quantity_delta numeric(12,3) not null check (quantity_delta <> 0),
  unit_cost numeric(14,2) not null default 0 check (unit_cost >= 0),
  total_cost numeric(14,2) not null default 0 check (total_cost >= 0),
  transaction_id uuid references public.business_transactions(id) on delete restrict,
  notes text not null default '',
  movement_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists business_transactions_date_idx on public.business_transactions (transaction_date desc);
create index if not exists business_transactions_product_idx on public.business_transactions (product_id, transaction_date desc);
create index if not exists inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);

create or replace view public.inventory_summary as
select
  p.id,
  p.sku,
  p.name,
  p.category,
  p.unit,
  p.image_url,
  p.selling_price,
  p.estimated_selling_cost,
  p.average_unit_cost,
  p.minimum_stock,
  p.active,
  coalesce(sum(m.quantity_delta), 0)::numeric(12,3) as stock_on_hand,
  (coalesce(sum(m.quantity_delta), 0) * p.average_unit_cost)::numeric(14,2) as inventory_value,
  greatest(p.selling_price - p.estimated_selling_cost, 0)::numeric(14,2) as estimated_nrv_per_unit,
  (coalesce(sum(m.quantity_delta), 0) > 0 and p.average_unit_cost > greatest(p.selling_price - p.estimated_selling_cost, 0)) as nrv_review_required
from public.products p
left join public.inventory_movements m on m.product_id = p.id
group by p.id;

create or replace function public.record_purchase(
  p_product_id uuid,
  p_quantity numeric,
  p_unit_cost numeric,
  p_note text default '',
  p_movement_date date default current_date
) returns public.inventory_movements
language plpgsql security definer set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_stock numeric(12,3);
  v_movement public.inventory_movements%rowtype;
begin
  if p_quantity <= 0 or p_unit_cost < 0 then raise exception 'Jumlah pembelian dan biaya harus valid.'; end if;
  select * into v_product from public.products where id = p_product_id and active for update;
  if not found then raise exception 'Produk tidak ditemukan atau tidak aktif.'; end if;
  select coalesce(sum(quantity_delta), 0) into v_stock from public.inventory_movements where product_id = p_product_id;
  if v_stock < 0 then raise exception 'Stok tercatat negatif; sesuaikan stok sebelum pembelian.'; end if;
  update public.products
    set average_unit_cost = case when v_stock + p_quantity = 0 then 0
      else ((v_stock * v_product.average_unit_cost) + (p_quantity * p_unit_cost)) / (v_stock + p_quantity) end
    where id = p_product_id;
  insert into public.inventory_movements (product_id, movement_type, quantity_delta, unit_cost, total_cost, notes, movement_date)
    values (p_product_id, 'purchase', p_quantity, p_unit_cost, p_quantity * p_unit_cost, coalesce(p_note, ''), coalesce(p_movement_date, current_date))
    returning * into v_movement;
  return v_movement;
end;
$$;

create or replace function public.record_sale(
  p_product_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_discount numeric default 0,
  p_labor_cost numeric default 0,
  p_overhead_cost numeric default 0,
  p_ppn_rate numeric default 0,
  p_pph_final_rate numeric default 0,
  p_note text default '',
  p_transaction_date date default current_date
) returns public.business_transactions
language plpgsql security definer set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_stock numeric(12,3);
  v_material_cost numeric(14,2);
  v_net_revenue numeric(14,2);
  v_transaction public.business_transactions%rowtype;
begin
  if p_quantity <= 0 or p_unit_price < 0 or p_discount < 0 or p_labor_cost < 0 or p_overhead_cost < 0 then
    raise exception 'Nilai penjualan dan biaya harus valid.';
  end if;
  if p_ppn_rate not between 0 and 100 or p_pph_final_rate not between 0 and 100 then
    raise exception 'Tarif pajak harus berada di antara 0 dan 100.';
  end if;
  select * into v_product from public.products where id = p_product_id and active for update;
  if not found then raise exception 'Produk tidak ditemukan atau tidak aktif.'; end if;
  select coalesce(sum(quantity_delta), 0) into v_stock from public.inventory_movements where product_id = p_product_id;
  if v_stock < p_quantity then raise exception 'Stok tidak mencukupi. Stok tersedia: %', v_stock; end if;
  v_net_revenue := (p_quantity * p_unit_price) - p_discount;
  if p_discount > p_quantity * p_unit_price then raise exception 'Diskon tidak boleh melebihi nilai penjualan.'; end if;
  v_material_cost := round(p_quantity * v_product.average_unit_cost, 2);
  insert into public.business_transactions (
    transaction_type, product_id, transaction_date, quantity, unit_price, discount_amount,
    revenue_amount, material_cost, labor_cost, overhead_cost, ppn_rate, ppn_amount,
    pph_final_rate, pph_final_estimate, description
  ) values (
    'sale', p_product_id, coalesce(p_transaction_date, current_date), p_quantity, p_unit_price, p_discount,
    v_net_revenue, v_material_cost, p_labor_cost, p_overhead_cost, p_ppn_rate,
    round(v_net_revenue * p_ppn_rate / 100, 2), p_pph_final_rate,
    round(v_net_revenue * p_pph_final_rate / 100, 2), coalesce(p_note, '')
  ) returning * into v_transaction;
  insert into public.inventory_movements (
    product_id, movement_type, quantity_delta, unit_cost, total_cost, transaction_id, notes, movement_date
  ) values (
    p_product_id, 'sale', -p_quantity, v_product.average_unit_cost, v_material_cost,
    v_transaction.id, coalesce(p_note, 'Penjualan'), coalesce(p_transaction_date, current_date)
  );
  return v_transaction;
end;
$$;

create or replace function public.record_expense(
  p_category text,
  p_amount numeric,
  p_note text default '',
  p_transaction_date date default current_date
) returns public.business_transactions
language plpgsql security definer set search_path = public
as $$
declare
  v_transaction public.business_transactions%rowtype;
begin
  if p_amount <= 0 then raise exception 'Nominal biaya harus lebih besar dari nol.'; end if;
  insert into public.business_transactions (transaction_type, transaction_date, expense_amount, expense_category, description)
    values ('expense', coalesce(p_transaction_date, current_date), p_amount, coalesce(p_category, 'Operasional'), coalesce(p_note, ''))
    returning * into v_transaction;
  return v_transaction;
end;
$$;

create or replace function public.record_adjustment(
  p_product_id uuid,
  p_quantity_delta numeric,
  p_note text default ''
) returns public.inventory_movements
language plpgsql security definer set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_stock numeric(12,3);
  v_movement public.inventory_movements%rowtype;
begin
  if p_quantity_delta = 0 then raise exception 'Penyesuaian stok tidak boleh nol.'; end if;
  select * into v_product from public.products where id = p_product_id and active for update;
  if not found then raise exception 'Produk tidak ditemukan atau tidak aktif.'; end if;
  select coalesce(sum(quantity_delta), 0) into v_stock from public.inventory_movements where product_id = p_product_id;
  if v_stock + p_quantity_delta < 0 then raise exception 'Penyesuaian membuat stok menjadi negatif.'; end if;
  insert into public.inventory_movements (product_id, movement_type, quantity_delta, unit_cost, total_cost, notes)
    values (p_product_id, 'adjustment', p_quantity_delta, v_product.average_unit_cost,
      abs(p_quantity_delta) * v_product.average_unit_cost, coalesce(p_note, 'Penyesuaian stok'))
    returning * into v_movement;
  return v_movement;
end;
$$;

alter table public.products enable row level security;
alter table public.business_transactions enable row level security;
alter table public.inventory_movements enable row level security;

revoke all on public.products, public.business_transactions, public.inventory_movements from anon, authenticated;
revoke all on function public.record_purchase(uuid, numeric, numeric, text, date) from public, anon, authenticated;
revoke all on function public.record_sale(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, date) from public, anon, authenticated;
revoke all on function public.record_expense(text, numeric, text, date) from public, anon, authenticated;
revoke all on function public.record_adjustment(uuid, numeric, text) from public, anon, authenticated;
grant select, insert, update on public.products to service_role;
grant select, insert, update on public.business_transactions, public.inventory_movements to service_role;
grant select on public.inventory_summary to service_role;
grant execute on function public.record_purchase(uuid, numeric, numeric, text, date) to service_role;
grant execute on function public.record_sale(uuid, numeric, numeric, numeric, numeric, numeric, numeric, numeric, text, date) to service_role;
grant execute on function public.record_expense(text, numeric, text, date) to service_role;
grant execute on function public.record_adjustment(uuid, numeric, text) to service_role;

insert into public.products (sku, name, category, unit, image_url, selling_price, estimated_selling_cost, average_unit_cost, minimum_stock)
values
  ('FL-ROS-01', 'Mawar merah', 'Mawar', 'batang', 'https://images.unsplash.com/photo-1494972308805-463bc619d34e?auto=format&fit=crop&w=800&q=85', 18000, 2500, 7500, 20),
  ('FL-TUL-02', 'Tulip pastel', 'Tulip', 'batang', 'https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=85', 32000, 3000, 14000, 12),
  ('FL-PEO-03', 'Peony blush', 'Peony', 'batang', 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=800&q=85', 45000, 4000, 21000, 8),
  ('FL-SUN-04', 'Sunflower cerah', 'Bunga musiman', 'batang', 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=800&q=85', 22000, 2500, 9000, 10),
  ('FL-EUC-05', 'Eucalyptus', 'Filler', 'batang', 'https://images.unsplash.com/photo-1508610048659-a06b669e3321?auto=format&fit=crop&w=800&q=85', 12000, 1500, 4000, 15),
  ('FL-MIX-06', 'Buket meadow', 'Rangkaian', 'buket', 'https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=85', 285000, 18000, 122000, 4)
on conflict (sku) do nothing;

insert into public.inventory_movements (product_id, movement_type, quantity_delta, unit_cost, total_cost, notes)
select p.id, 'purchase', seed.quantity, p.average_unit_cost,
  seed.quantity * p.average_unit_cost, 'Saldo awal sistem'
from (values
  ('FL-ROS-01', 42::numeric), ('FL-TUL-02', 18::numeric), ('FL-PEO-03', 9::numeric),
  ('FL-SUN-04', 24::numeric), ('FL-EUC-05', 33::numeric), ('FL-MIX-06', 7::numeric)
) as seed(sku, quantity)
join public.products p on p.sku = seed.sku
where not exists (
  select 1 from public.inventory_movements m
  where m.product_id = p.id and m.movement_type = 'purchase' and m.notes = 'Saldo awal sistem'
);
