-- =============================================================================
-- Migración inicial — minisuper-erp
-- Esquema completo aprobado: catálogo, inventario, ventas/caja y compras.
-- RLS activo con políticas mínimas para single-store; se reforzarán por fase.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Auth / perfiles
-- -----------------------------------------------------------------------------

create type public.user_role as enum ('owner', 'staff');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null default '',
  telefono text unique,
  role public.user_role not null default 'staff',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crea el perfil automáticamente al registrarse un usuario (OTP phone).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, telefono)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Rol del usuario autenticado (para políticas RLS).
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- -----------------------------------------------------------------------------
-- Catálogo
-- -----------------------------------------------------------------------------

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Tienda principal fija (diseño multi-tienda, una sola activa).
create table public.productos (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  ean text unique,
  nombre text not null,
  categoria_id uuid references public.categorias (id),
  unidad text not null default 'uds' check (unidad in ('uds', 'kg')),
  iva numeric(5, 2) not null default 21 check (iva in (4, 10, 21)),
  precio_venta numeric(10, 2) not null check (precio_venta >= 0),
  activo boolean not null default true,
  tienda_id uuid not null default '00000000-0000-0000-0000-000000000001',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index productos_categoria_id_idx on public.productos (categoria_id);
create index productos_nombre_idx on public.productos (nombre);

-- -----------------------------------------------------------------------------
-- Inventario (única fuente de verdad del stock)
-- -----------------------------------------------------------------------------

create table public.inventario (
  producto_id uuid primary key references public.productos (id),
  stock_fisico numeric(12, 3) not null default 0 check (stock_fisico >= 0),
  stock_reservado numeric(12, 3) not null default 0
    check (stock_reservado >= 0 and stock_reservado <= stock_fisico),
  stock_disponible numeric(12, 3)
    generated always as (stock_fisico - stock_reservado) stored,
  updated_at timestamptz not null default now()
);

create table public.movimientos_stock (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id),
  tipo text not null check (tipo in ('entrada', 'salida', 'merma', 'ajuste')),
  cantidad numeric(12, 3) not null check (cantidad > 0),
  motivo text not null default '',
  referencia uuid, -- ticket_id u orden_id
  creado_por uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index movimientos_stock_producto_id_idx on public.movimientos_stock (producto_id);
create index movimientos_stock_created_at_idx on public.movimientos_stock (created_at desc);

-- -----------------------------------------------------------------------------
-- Ventas (POS) y caja
-- -----------------------------------------------------------------------------

create table public.sesiones_caja (
  id uuid primary key default gen_random_uuid(),
  numero integer not null unique,
  abierta_por uuid not null references public.profiles (id),
  fondo_inicial numeric(10, 2) not null default 0 check (fondo_inicial >= 0),
  estado text not null default 'abierta' check (estado in ('abierta', 'cerrada')),
  abierta_at timestamptz not null default now(),
  cerrada_at timestamptz,
  arqueo_contado numeric(10, 2) check (arqueo_contado >= 0),
  diferencia numeric(10, 2) -- arqueo_contado - (fondo_inicial + ventas efectivo); se calcula al cerrar
);

-- Solo una caja abierta a la vez por tienda.
create unique index sesiones_caja_unica_abierta
  on public.sesiones_caja ((estado)) where estado = 'abierta';

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  numero bigserial unique,
  sesion_caja_id uuid not null references public.sesiones_caja (id),
  medio_pago text not null default 'efectivo' check (medio_pago in ('efectivo', 'tarjeta')),
  subtotal numeric(10, 2) not null default 0,
  iva_total numeric(10, 2) not null default 0,
  total numeric(10, 2) not null default 0,
  estado text not null default 'abierto' check (estado in ('abierto', 'cobrado', 'anulado')),
  creado_por uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  cobrado_at timestamptz
);

create index tickets_sesion_caja_id_idx on public.tickets (sesion_caja_id);
create index tickets_created_at_idx on public.tickets (created_at desc);

create table public.lineas_ticket (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad numeric(12, 3) not null check (cantidad > 0), -- decimales para kg
  precio_unitario numeric(10, 2) not null check (precio_unitario >= 0),
  iva numeric(5, 2) not null,
  importe numeric(10, 2) not null check (importe >= 0)
);

create index lineas_ticket_ticket_id_idx on public.lineas_ticket (ticket_id);

-- -----------------------------------------------------------------------------
-- Compras
-- -----------------------------------------------------------------------------

create table public.proveedores (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  contacto text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.ordenes_compra (
  id uuid primary key default gen_random_uuid(),
  proveedor_id uuid not null references public.proveedores (id),
  estado text not null default 'borrador' check (estado in ('borrador', 'recibida')),
  total numeric(10, 2) not null default 0,
  creada_por uuid not null references public.profiles (id),
  creada_at timestamptz not null default now(),
  recibida_at timestamptz
);

create table public.lineas_orden_compra (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references public.ordenes_compra (id) on delete cascade,
  producto_id uuid not null references public.productos (id),
  cantidad numeric(12, 3) not null check (cantidad > 0),
  coste_unitario numeric(10, 2) not null check (coste_unitario >= 0)
);

create index lineas_orden_compra_orden_id_idx on public.lineas_orden_compra (orden_id);

-- -----------------------------------------------------------------------------
-- updated_at automático
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger productos_touch_updated_at
  before update on public.productos
  for each row execute function public.touch_updated_at();

create trigger inventario_touch_updated_at
  before update on public.inventario
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- RLS — políticas mínimas single-store (se endurecen en fases posteriores)
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.inventario enable row level security;
alter table public.movimientos_stock enable row level security;
alter table public.sesiones_caja enable row level security;
alter table public.tickets enable row level security;
alter table public.lineas_ticket enable row level security;
alter table public.proveedores enable row level security;
alter table public.ordenes_compra enable row level security;
alter table public.lineas_orden_compra enable row level security;

-- profiles: cada quien lee/actualiza su perfil; owner lee todos.
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_select_owner" on public.profiles
  for select using (public.current_user_role() = 'owner');
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Tablas operativas: cualquier usuario autenticado (tienda única, equipo de confianza).
-- TODO(fase): reforzar — p.ej. inventario solo desde server-side con funciones SECURITY DEFINER.
create policy "authenticated_read" on public.categorias for select to authenticated using (true);
create policy "authenticated_write" on public.categorias for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.productos for select to authenticated using (true);
create policy "authenticated_write" on public.productos for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.inventario for select to authenticated using (true);
create policy "authenticated_write" on public.inventario for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.movimientos_stock for select to authenticated using (true);
create policy "authenticated_insert" on public.movimientos_stock for insert to authenticated with check (true);

create policy "authenticated_read" on public.sesiones_caja for select to authenticated using (true);
create policy "authenticated_write" on public.sesiones_caja for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.tickets for select to authenticated using (true);
create policy "authenticated_write" on public.tickets for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.lineas_ticket for select to authenticated using (true);
create policy "authenticated_write" on public.lineas_ticket for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.proveedores for select to authenticated using (true);
create policy "authenticated_write" on public.proveedores for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.ordenes_compra for select to authenticated using (true);
create policy "authenticated_write" on public.ordenes_compra for all to authenticated using (true) with check (true);

create policy "authenticated_read" on public.lineas_orden_compra for select to authenticated using (true);
create policy "authenticated_write" on public.lineas_orden_compra for all to authenticated using (true) with check (true);
