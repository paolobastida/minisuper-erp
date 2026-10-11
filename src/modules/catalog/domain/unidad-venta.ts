/**
 * Unidad de venta: por unidad (uds) o a granel por kilogramo (kg).
 * `kg` admite cantidades con decimales en el ticket (precisión de gramo).
 */
export type UnidadVenta = "uds" | "kg";

export const UNIDADES_DE_VENTA: readonly UnidadVenta[] = ["uds", "kg"];

export function esUnidadDeVenta(valor: string): valor is UnidadVenta {
  return (UNIDADES_DE_VENTA as readonly string[]).includes(valor);
}
