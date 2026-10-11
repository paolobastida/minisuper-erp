import { describe, expect, it } from "vitest";
import { Money } from "./money";
import { Quantity } from "./quantity";

describe("Money", () => {
  it("crea desde céntimos y muestra decimal", () => {
    const m = Money.fromCents(1250);
    expect(m.cents).toBe(1250);
    expect(m.toDecimal()).toBe(12.5);
    expect(m.toString()).toBe("12.50");
  });

  it("crea desde decimal string sin error de flotante", () => {
    // 0.1 + 0.2 en floats es 0.30000000000000004; en Money no.
    const a = Money.fromDecimal("0.10");
    const b = Money.fromDecimal("0.20");
    expect(a.add(b).toString()).toBe("0.30");
    expect(a.add(b).cents).toBe(30);
  });

  it("rechaza más de 2 decimales en string", () => {
    expect(() => Money.fromDecimal("12.345")).toThrow(/máximo 2 decimales/);
  });

  it("rechaza formatos inválidos", () => {
    expect(() => Money.fromDecimal("12,34")).toThrow(/inválido/);
    expect(() => Money.fromDecimal("abc")).toThrow(/inválido/);
    expect(() => Money.fromDecimal(Number.NaN)).toThrow(/no finito/);
  });

  it("suma y resta", () => {
    expect(Money.fromDecimal("10.00").add(Money.fromDecimal("2.50")).toString()).toBe("12.50");
    expect(Money.fromDecimal("10.00").subtract(Money.fromDecimal("2.50")).toString()).toBe("7.50");
  });

  it("multiplica con redondeo comercial (half away from zero)", () => {
    expect(Money.fromCents(125).multiply(2).cents).toBe(250);
    // 0.005 € → 0.5 céntimos → 1 céntimo
    expect(Money.fromCents(1).multiply(0.5).cents).toBe(1);
    expect(Money.fromCents(-1).multiply(0.5).cents).toBe(-1);
  });

  it("aplica IVA con redondeo comercial", () => {
    // 10.00 € + 21% = 2.10 €
    expect(Money.fromDecimal("10.00").applyPercentage(21).toString()).toBe("2.10");
    // 1.15 € + 21% = 0.2415 → 0.24
    expect(Money.fromDecimal("1.15").applyPercentage(21).toString()).toBe("0.24");
    // 3.35 € + 10% = 0.335 → 0.34 (mitad hacia fuera)
    expect(Money.fromDecimal("3.35").applyPercentage(10).toString()).toBe("0.34");
  });

  it("multiplica precio por cantidad en kg", () => {
    // 2.99 €/kg × 1.5 kg = 4.485 € → 4.49 € (half away from zero)
    const precio = Money.fromDecimal("2.99");
    expect(precio.multiplyQuantity(Quantity.fromDecimal("1.5")).toString()).toBe("4.49");
    // 1.20 €/kg × 0.001 kg (1 g) = 0.0012 € → 0.00 €
    expect(Money.fromDecimal("1.20").multiplyQuantity(Quantity.fromDecimal("0.001")).cents).toBe(0);
  });

  it("detecta signo", () => {
    expect(Money.zero().isZero()).toBe(true);
    expect(Money.fromCents(-50).isNegative()).toBe(true);
    expect(Money.fromCents(50).isPositive()).toBe(true);
  });

  it("compara igualdad", () => {
    expect(Money.fromDecimal("5.00").equals(Money.fromCents(500))).toBe(true);
    expect(Money.fromDecimal("5.00").equals(Money.fromCents(501))).toBe(false);
  });
});
