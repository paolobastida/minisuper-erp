# Módulos — Arquitectura Hexagonal

Cada bounded context del ERP vive en su propia carpeta, con tres capas:

```
modules/<context>/
  domain/           # Reglas de negocio puras: agregados, VOs, eventos, puertos (interfaces)
  application/      # Casos de uso: orquestan agregados y puertos
  infrastructure/   # Adaptadores: Supabase, APIs externas, impresión, etc.
```

## Reglas de dependencias

1. `domain/` **no importa** de Next.js, Supabase ni de otros módulos.
2. `application/` importa de `domain/` y define casos de uso.
3. `infrastructure/` implementa los puertos definidos en `domain/`.
4. La comunicación entre módulos se hace por **interfaces públicas de aplicación**
   y **eventos de dominio**, nunca importando agregados de otro módulo.
5. `shared/` (fuera de `modules/`) contiene VOs transversales (`Money`, `Quantity`).

## Bounded contexts

| Módulo | Responsabilidad |
|---|---|
| `catalog` | Productos, categorías, EAN, precios de venta |
| `inventory` | Stock, entradas/salidas, merma, ajustes — única fuente de verdad del stock |
| `sales` | Terminal POS: tickets, cobro, caja, arqueo |
| `purchases` | Proveedores, órdenes de compra, recepción de mercancía |

**Fronteras duras:**

- El POS (`sales`) solo **lee** stock vía `StockChecker` (puerto de solo lectura),
  nunca escribe inventario directamente.
- `sales` no conoce a proveedores ni facturas de compra.
- `inventory` es el único módulo que muta stock.
