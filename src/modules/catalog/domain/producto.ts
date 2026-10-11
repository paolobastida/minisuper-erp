import { Money } from "@/shared";
import { ProductoInvalido } from "./errors";
import { Ean } from "./ean";
import { Iva } from "./iva";
import { Sku } from "./sku";
import { type UnidadVenta } from "./unidad-venta";

export interface ProductoProps {
  id: string;
  sku: Sku;
  ean: Ean | null;
  nombre: string;
  categoriaId: string | null;
  unidad: UnidadVenta;
  iva: Iva;
  precioVenta: Money;
  activo: boolean;
}

export interface NuevoProductoProps {
  sku: Sku;
  ean?: Ean | null;
  nombre: string;
  categoriaId?: string | null;
  unidad: UnidadVenta;
  iva: Iva;
  precioVenta: Money;
}

const NOMBRE_MAX = 120;

/**
 * Agregado Producto del catálogo.
 * Invariantes: nombre no vacío (máx. 120); precio de venta ≥ 0.
 * La unicidad de SKU/EAN la garantiza el repository (infraestructura).
 */
export class Producto {
  private constructor(
    readonly id: string,
    readonly sku: Sku,
    private _ean: Ean | null,
    private _nombre: string,
    private _categoriaId: string | null,
    readonly unidad: UnidadVenta,
    readonly iva: Iva,
    private _precioVenta: Money,
    private _activo: boolean,
  ) {}

  static crear(props: NuevoProductoProps, id: string = crypto.randomUUID()): Producto {
    const nombre = props.nombre.trim();
    Producto.validarNombre(nombre);
    if (props.precioVenta.isNegative()) {
      throw new ProductoInvalido("el precio de venta no puede ser negativo");
    }
    return new Producto(
      id,
      props.sku,
      props.ean ?? null,
      nombre,
      props.categoriaId ?? null,
      props.unidad,
      props.iva,
      props.precioVenta,
      true,
    );
  }

  /** Reconstruye desde persistencia sin revalidar reglas de creación. */
  static rehidratar(props: ProductoProps): Producto {
    return new Producto(
      props.id,
      props.sku,
      props.ean,
      props.nombre,
      props.categoriaId,
      props.unidad,
      props.iva,
      props.precioVenta,
      props.activo,
    );
  }

  get ean(): Ean | null {
    return this._ean;
  }

  get nombre(): string {
    return this._nombre;
  }

  get categoriaId(): string | null {
    return this._categoriaId;
  }

  get precioVenta(): Money {
    return this._precioVenta;
  }

  get activo(): boolean {
    return this._activo;
  }

  cambiarPrecio(nuevoPrecio: Money): void {
    if (nuevoPrecio.isNegative()) {
      throw new ProductoInvalido("el precio de venta no puede ser negativo");
    }
    this._precioVenta = nuevoPrecio;
  }

  cambiarNombre(nombre: string): void {
    const limpio = nombre.trim();
    Producto.validarNombre(limpio);
    this._nombre = limpio;
  }

  cambiarCategoria(categoriaId: string | null): void {
    this._categoriaId = categoriaId;
  }

  desactivar(): void {
    this._activo = false;
  }

  reactivar(): void {
    this._activo = true;
  }

  private static validarNombre(nombre: string): void {
    if (nombre.length === 0) {
      throw new ProductoInvalido("el nombre no puede estar vacío");
    }
    if (nombre.length > NOMBRE_MAX) {
      throw new ProductoInvalido(`el nombre no puede superar ${NOMBRE_MAX} caracteres`);
    }
  }
}
