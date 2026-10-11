import { IvaInvalido } from "./errors";

/** Tipo impositivo aplicable en España (supermercado): 4%, 10% o 21%. */
export type TipoIva = 4 | 10 | 21;

const VALORES_PERMITIDOS: readonly TipoIva[] = [4, 10, 21];

export class Iva {
  private constructor(readonly porcentaje: TipoIva) {}

  static crear(valor: number): Iva {
    if (!VALORES_PERMITIDOS.includes(valor as TipoIva)) {
      throw new IvaInvalido(valor);
    }
    return new Iva(valor as TipoIva);
  }

  static readonly SUPERMERCADO = VALORES_PERMITIDOS;

  equals(other: Iva): boolean {
    return this.porcentaje === other.porcentaje;
  }

  toString(): string {
    return `${this.porcentaje}%`;
  }
}
