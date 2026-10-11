import { EanInvalido } from "./errors";

/**
 * EAN — código de barras GS1 (EAN-8 o EAN-13) con validación de dígito de control.
 * Es opcional en el catálogo del minisuper.
 */
export class Ean {
  private constructor(readonly value: string) {}

  /** Crea un EAN validando longitud y dígito de control (checksum GS1). */
  static crear(valor: string): Ean {
    const limpio = valor.trim();
    if (!/^\d+$/.test(limpio)) {
      throw new EanInvalido("solo puede contener dígitos");
    }
    if (limpio.length !== 8 && limpio.length !== 13) {
      throw new EanInvalido("debe tener 8 (EAN-8) o 13 (EAN-13) dígitos");
    }
    if (!Ean.checksumValido(limpio)) {
      throw new EanInvalido("el dígito de control no es correcto");
    }
    return new Ean(limpio);
  }

  /** Intenta crear; devuelve null si el valor está vacío, error si es inválido. */
  static crearOPermitirVacio(valor: string | null | undefined): Ean | null {
    if (valor == null || valor.trim() === "") {
      return null;
    }
    return Ean.crear(valor);
  }

  /** Checksum GS1: suma ponderada 1/3 desde la izquierda; dígito = (10 - suma % 10) % 10. */
  private static checksumValido(codigo: string): boolean {
    const cuerpo = codigo.slice(0, -1);
    const control = Number(codigo.slice(-1));
    let suma = 0;
    for (let i = 0; i < cuerpo.length; i++) {
      const digito = Number(cuerpo[i]);
      // Posiciones 1-indexadas desde la izquierda del cuerpo: impares ×1, pares ×3
      suma += i % 2 === 0 ? digito : digito * 3;
    }
    const esperado = (10 - (suma % 10)) % 10;
    return control === esperado;
  }

  equals(other: Ean): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}
