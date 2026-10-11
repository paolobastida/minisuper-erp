# Minisuper ERP

ERP para minisupermercado: catálogo, inventario, terminal POS, control de caja,
compras simples y un asistente por WhatsApp.

**Stack**

- [Next.js 16](https://nextjs.org) (App Router) + React + TypeScript
- [Supabase](https://supabase.com) (PostgreSQL + Auth OTP por teléfono)
- Deploy en [Vercel](https://vercel.com)
- Agente WhatsApp (Fase 5): API de Claude + proveedor WhatsApp (Green API / Meta Cloud API)

**Arquitectura**: hexagonal (Ports & Adapters) con bounded contexts en [`src/modules/`](src/modules/README.md)
(`catalog`, `inventory`, `sales`, `purchases`) y value objects en [`src/shared/`](src/shared/README.md).

## Puesta en marcha

```bash
# 1. Dependencias
npm install

# 2. Variables de entorno
cp .env.example .env.local
# Edita .env.local con las claves de tu proyecto Supabase

# 3. Base de datos
# Aplica supabase/migrations/0001_init.sql desde el SQL Editor de Supabase
# (o con el CLI: supabase db push)

# 4. Desarrollo
npm run dev        # http://localhost:3000
npm test           # tests unitarios (Vitest)
npm run lint       # ESLint
```

### Configurar Supabase (una vez)

1. Crea el proyecto en [supabase.com](https://supabase.com) (plan Free).
2. **Project Settings → API**: copia `Project URL` y `anon public` key a `.env.local`.
3. **Authentication → Providers → Phone**: activa el proveedor SMS.
   - Para pruebas puedes usar el *Twilio test credentials* de Supabase
     (los SMS de prueba van a números verificados).
   - Producción: tu propia cuenta Twilio (o MessageBird…).
4. **Authentication → URL Configuration**: añade la URL de Vercel cuando exista.
5. Aplica la migración `supabase/migrations/0001_init.sql`.

### Roles

- `staff` (por defecto): vende, consulta stock.
- `owner`: además gestiona compras, precios y reportes.

El rol se guarda en `public.profiles.role` y se controla con RLS.
El primer usuario que se registra debe cambiar su rol a `owner` en la tabla
`profiles` (SQL Editor):

```sql
update public.profiles set role = 'owner'
where telefono = '+34...';
```

## Roadmap

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Scaffolding, `shared/`, auth OTP, esquema SQL | ✅ |
| 1 | Catálogo + Inventario | ⬜ |
| 2 | POS (tickets y cobro) | ⬜ |
| 3 | Cierre de caja / arqueo | ⬜ |
| 4 | Compras simples | ⬜ |
| 5 | Agente WhatsApp (solo lectura) | ⬜ |

## Decisiones técnicas

- **Money en céntimos / Quantity en milésimas** — sin errores de flotante;
  redondeo comercial (*half away from zero*). Ver `src/shared/`.
- **Inventario = única fuente de verdad del stock**; el POS solo lee
  disponibilidad.
- **Ticket captura el precio al vender** (foto de precio): cambios de PVP
  posteriores no alteran tickets ya cobrados.
- **Next.js 16**: `middleware.ts` → `proxy.ts`; `cacheComponents` activo.
