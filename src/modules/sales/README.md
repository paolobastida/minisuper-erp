# sales — Ventas / POS (bounded context)

Terminal de venta y control de caja.

- Agregado: `Ticket` (líneas, IVA desglosado, medio de pago, estado).
- Agregado: `SesionCaja` (apertura, arqueo, cierre, sobrante/faltante).
- Invariantes: ticket no vacío al cobrar; total = suma de líneas.
- Evento: `TicketCobrado` → salida de stock + suma a caja.
