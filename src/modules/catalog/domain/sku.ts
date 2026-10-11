import { SkuInvalido } from "./errors";

/**
 * SKU — código interno único del producto.
 * No vacío, máx. 30 caracteres, sin espacios (se usa en escáner y búsquedas).
 */
export class Sku {
  private constructor(readonly value: string) {}

  static crear(valor: string): Sku {
    const limpio = valor.trim();
    if (limpio.length === 0) {
      throw new SkuInvalido("no puede estar vacío");
    }
    if (limpio.length > 30) {
      throw new SkuInvalido("máximo 30 caracteres");
    }
    if (/\s/.test(limpio)) {
      throw new SkuInvalido("no puede contener espacios");
    }
    return new Sku(limpio);
  }

  equals(other: Sku): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
