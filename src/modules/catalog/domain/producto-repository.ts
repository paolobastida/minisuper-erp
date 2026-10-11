import type { Producto } from "./producto";
import type { Sku } from "./sku";

/**
 * Puerto de salida: persistencia del catálogo.
 * Lo implementa infrastructure/ProductoRepositorySupabase.
 */
export interface ProductoRepository {
  findById(id: string): Promise<Producto | null>;
  findBySku(sku: Sku): Promise<Producto | null>;
  findByEan(ean: string): Promise<Producto | null>;
  /** Inserta o actualiza completo el producto (upsert por id). */
  save(producto: Producto): Promise<void>;
  /** Lista productos (activos por defecto), con búsqueda opcional por nombre/SKU/EAN. */
  list(busqueda?: string, incluirInactivos?: boolean): Promise<Producto[]>;
}
