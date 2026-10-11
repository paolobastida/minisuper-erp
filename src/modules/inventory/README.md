# inventory — Inventario (bounded context)

Única fuente de verdad del stock.

- Agregado: `ArticuloEnStock` (stockFisico, stockReservado, stockDisponible).
- Invariante: `stockFisico >= stockReservado >= 0`.
- Comandos: entradaPorCompra, salidaPorVenta, merma, ajustePorConteo.
- El POS accede solo mediante el puerto de solo lectura `StockChecker`.
