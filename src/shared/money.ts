import { Quantity } from "./quantity";

/**
 * Money — value object para importes monetarios.
 *
 * Almacena el importe en **céntimos enteros** para eliminar los errores
 * del punto flotante (0.1 + 0.2 !== 0.3). Moneda fija: EUR.
 *
 * Los importes negativos se permiten (devoluciones, ajustes); son los
 * agregados (Ticket, Caja) quienes imponen invariantes de negocio.
 */
export class Money {
  private constructor(/** importe en céntimos (entero) */ readonly cents: number) {
    if (!Number.isInteger(cents)) {
      throw new Error(`Money: los céntimos deben ser enteros, recibido ${cents}`);
    }
  }

  /** Crea un importe a partir de céntimos enteros. */
  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  /**
   * Crea un importes desde un decimal ("12.50", 12.5).
   *
   * Con `string` el parseo es exacto (se recomienda). Con `number` se
   * tolera la imprecisión de float redondeando al céntimo más cercano.
   * Máximo 2 decimales: "12.345" lanza error.
   */
  static fromDecimal(value: number | string): Money {
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new Error(`Money: valor no finito, recibido ${value}`);
      }
      return new Money(roundHalfAwayFromZero(value * 100));
    }
    return new Money(parseDecimalToScale(value, 2));
  }

  static zero(): Money {
    return new Money(0);
  }

  add(other: Money): Money {
    return new Money(this.cents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.cents - other.cents);
  }

  /** Multiplica por un factor escalar con redondeo comercial (half away from zero). */
  multiply(factor: number): Money {
    if (!Number.isFinite(factor)) {
      throw new Error(`Money: factor no finito, recibido ${factor}`);
    }
    return new Money(roundHalfAwayFromZero(this.cents * factor));
  }

  /**
   * Aplica un porcentaje (ej. IVA 21) con redondeo comercial.
   * `percentage` es el número "natural": 21 significa 21%.
   */
  applyPercentage(percentage: number): Money {
    if (!Number.isFinite(percentage)) {
      throw new Error(`Money: porcentaje no finito, recibido ${percentage}`);
    }
    return new Money(roundHalfAwayFromZero((this.cents * percentage) / 100));
  }

  /**
   * Precio unitario × cantidad (ej. 2.99 €/kg × 1.5 kg).
   * Se aplica redondeo comercial al céntimo en el resultado total.
   */
  multiplyQuantity(quantity: Quantity): Money {
    return new Money(roundHalfAwayFromZero((this.cents * quantity.milli) / 1000));
  }

  isZero(): boolean {
    return this.cents === 0;
  }

  isNegative(): boolean {
    return this.cents < 0;
  }

  isPositive(): boolean {
    return this.cents > 0;
  }

  equals(other: Money): boolean {
    return this.cents === other.cents;
  }

  /** Decimal para mostrar en UI, p.ej. 1250 → 12.5 (no formatea moneda). */
  toDecimal(): number {
    return this.cents / 100;
  }

  /** Representación legible con 2 decimales, p.ej. "12.50". */
  toString(): string {
    const sign = this.cents < 0 ? "-" : "";
    const abs = Math.abs(this.cents);
    const euros = Math.floor(abs / 100);
    const cents = abs % 100;
    return `${sign}${euros}.${String(cents).padStart(2, "0")}`;
  }
}

/** Redondeo comercial: mitad hacia fuera de cero (0.5 → 1, -0.5 → -1). */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Parsea un decimal exacto a entero escalado (por ejemplo céntimos, scale=2).
 * Rechaza más decimales de los permitidos — no redondea en silencio.
 */
function parseDecimalToScale(value: string, scale: number): number {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`Money: formato decimal inválido "${value}"`);
  }
  const negative = trimmed.startsWith("-");
  const [intPart, fracPart = ""] = trimmed.replace("-", "").split(".");
  if (fracPart.length > scale) {
    throw new Error(
      `Money: máximo ${scale} decimales en "${value}" (recibido ${fracPart.length})`,
    );
  }
  const scaled = Number(intPart) * 10 ** scale + Number(fracPart.padEnd(scale, "0"));
  return negative ? -scaled : scaled;
}
