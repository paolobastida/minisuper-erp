# purchases — Compras (bounded context)

Proveedores y órdenes de compra simples.

- Agregado: `OrdenDeCompra` (borrador → recibida).
- Al marcarse `recibida`, un servicio de dominio crea entradas en `inventory`.
- `sales` no conoce este módulo.
