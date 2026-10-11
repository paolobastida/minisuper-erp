/**
 * Quantity — value object para cantidades con decimales.
 *
 * Almacena en **milésimas enteras** (3 decimales): suficiente para venta
 * por kg con precisión de gramo (0.001 kg). Evita errores de flotante.
 *
 * Permite cantidades negativas (diferencias de ajuste); los agregados
 * de negocio (inventario, ticket) imponen sus propias invariantes.
 */
export class Quantity {
  private constructor(
    /** cantidad en milésimas (entero): 1500 = 1.500 */
    readonly milli: number,
  ) {
    if (!Number.isInteger(milli)) {
      throw new Error(`Quantity: las milésimas deben ser enteras, recibido ${milli}`);
    }
  }

  /** Crea desde milésimas enteras (1500 → 1.5). */
  static fromMilli(milli: number): Quantity {
    return new Quantity(milli);
  }

  /**
   * Crea desde un decimal ("1.5", 1.5).
   * Con `string` el parseo es exacto. Máximo 3 decimales; si no, error.
   */
  static fromDecimal(value: number | string): Quantity {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new Error(`Quantity: valor no finito, recibido ${value}`);
      }
      return new Quantity(roundHalfAwayFromZero(value * 1000));
    }
    return new Quantity(parseDecimalToScale(value, 3));
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.milli + other.milli);
  }

  subtract(other: Quantity): Quantity {
    return new Quantity(this.milli - other.milli);
  }

  multiply(factor: number): Quantity {
    if (!Number.isFinite(factor)) {
      throw new Error(`Quantity: factor no finito, recibido ${factor}`);
    }
    return new Quantity(roundHalfAwayFromZero(this.milli * factor));
  }

  isZero(): boolean {
    return this.milli === 0;
  }

  isNegative(): boolean {
    return this.milli < 0;
  }

  isPositive(): boolean {
    return this.milli > 0;
  }

  equals(other: Quantity): boolean {
    return this.milli === other.milli;
  }

  /** Decimal para cálculos/UI, p.ej. 1500 → 1.5. */
  toDecimal(): number {
    return this.milli / 1000;
  }

  /** Formato con 3 decimales, p.ej. "1.500". */
  toString(): string {
    const sign = this.milli < 0 ? "-" : "";
    const abs = Math.abs(this.milli);
    const units = Math.floor(abs / 1000);
    const milli = abs % 1000;
    return `${sign}${units}.${String(milli).padStart(3, "0")}`;
  }
}

function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/** Parsea un decimal exacto a entero escalado; rechaza exceso de decimales. */
function parseDecimalToScale(value: string, scale: number): number {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Quantity: formato decimal inválido "${value}"`);
  }
  const negative = trimmed.startsWith("-");
  const [intPart, fracPart = ""] = trimmed.replace("-", "").split(".");
  if (fracPart.length > scale) {
    throw new Error(
      `Quantity: máximo ${scale} decimales en "${value}" (recibido ${fracPart.length})`,
    );
  }
  const scaled = Number(intPart) * 10 ** scale + Number(fracPart.padEnd(scale, "0"));
  return negative ? -scaled : scaled;
}
