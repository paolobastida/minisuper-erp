<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# minisuper-erp

ERP para minisupermercado. Stack fijo (decidido por el dueño): Next.js 16 App Router + TypeScript + Supabase (PostgreSQL + Auth OTP teléfono) + deploy en Vercel. Repo público: `paolobastida/minisuper-erp`.

## Comandos

```bash
npm run dev      # desarrollo (localhost:3000)
npm test         # Vitest, todos los tests
npx vitest run src/shared/money.test.ts   # un solo archivo
npm run lint     # ESLint
npm run build    # build de producción; además ejecuta TypeScript (no hay script typecheck aparte)
```

Verificación mínima antes de dar por terminada una tarea: `npm run lint && npm test && npm run build`.

## Next.js 16 — quirks que importan

- Docs canónicos en `node_modules/next/dist/docs/` (el AGENTS de Next.js de arriba no es opcional).
- `middleware.ts` ya **no existe**: es `src/proxy.ts` con `export function proxy()`.
- `cacheComponents: true` activo: leer `cookies()`/sesión fuera de un `<Suspense>` es error de build. El patrón de auth: helpers con `'use cache: private'` + `<Suspense>` (ver `node_modules/next/dist/docs/01-app/02-guides/authentication-with-cache-components.md`).
- `LayoutProps<"/">` es un tipo global generado en build (no importarlo).
- El bloque `nextjs-agent-rules` de arriba lo regenera `next dev`: no lo borres del diff, revívelo con el trabajo.

## Arquitectura (hexagonal, obligatoria)

```
src/modules/<bounded-context>/   # catalog | inventory | sales | purchases
  domain/          # agregados, VOs, errores y puertos (interfaces). CERO imports de next/supabase/otros módulos
  application/     # casos de uso (clases con `ejecutar()`); importan solo domain
  infrastructure/  # adaptadores (Supabase, etc.) que implementan los puertos
src/shared/        # VOs transversales: Money, Quantity
src/lib/           # infraestructura transversal de la app (clientes Supabase)
```

Reglas de diseño (resumidas en los `README.md` de cada módulo; parte ya en código):

- Los módulos **no importan agregados entre sí**. Coordinación vía casos de uso públicos y eventos de dominio.
- `inventory` es la **única fuente de verdad del stock**; el POS (`sales`) solo lee vía puerto `StockChecker`.
- El ticket **captura el precio al vender** (`precio_unitario` fotografiado): cambios de PVP no alteran tickets cobrados.
- Casos de uso reciben y devuelven tipos planos (strings/numbers); la conversión a VOs ocurre dentro del caso de uso.

## Shared — Money y Quantity

- `Money` guarda **céntimos enteros**; `Quantity` guarda **milésimas enteras** (gramo de precisión para venta por kg).
- Nunca usar floats para importes/cantidades; parsear con `fromDecimal("1.20")` (string exacto) y redondear con *half away from zero*.
- Precio × cantidad en kg: `precio.multiplyQuantity(cantidad)` (no `multiply` a pelo).

## Supabase

- Env en `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Plantilla en `.env.example`. Build local falla sin ellas (crear `.env.local` con placeholders si no hay proyecto).
- Clientes: `src/lib/supabase/{client,server,middleware}.ts` (`@supabase/ssr`). El proxy refresca sesión y redirige a `/login`.
- Auth: OTP por teléfono. Roles `owner`/`staff` en `public.profiles` (trigger al registrarse); políticas RLS en la migración.
- Migraciones SQL manuales en `supabase/migrations/` (SQL Editor de Supabase; no hay `supabase db push` cableado). Nueva tabla = nueva migración numerada, sin editar migraciones ya aplicadas.

## Convenciones del proyecto

- Tests Vitest co-located (`*.test.ts` junto al código); alias `@/` → `src/` (ver `vitest.config.mts`).
- UI y metadatos en **español**.
- Commits pequeños y descriptivos (el dueño revisa el proceso en GitHub): conventional commits (`feat(catalog/domain): …`).
- Roadmap y decisiones de negocio en `README.md`; estado por fases en su tabla. No inventar reglas de negocio: si falta una, preguntar.
