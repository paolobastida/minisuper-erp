import { describe, expect, it } from "vitest";
import { Quantity } from "./quantity";

describe("Quantity", () => {
  it("crea desde milésimas y decimal", () => {
    expect(Quantity.fromMilli(1500).toDecimal()).toBe(1.5);
    expect(Quantity.fromDecimal("1.5").milli).toBe(1500);
    expect(Quantity.fromDecimal(1.5).milli).toBe(1500);
  });

  it("soporta precisión de gramo (0.001 kg)", () => {
    expect(Quantity.fromDecimal("0.001").milli).toBe(1);
    expect(Quantity.fromDecimal("0.001").toString()).toBe("0.001");
  });

  it("suma y resta cantidades", () => {
    const total = Quantity.fromDecimal("1.250").add(Quantity.fromDecimal("0.750"));
    expect(total.toString()).toBe("2.000");
    const resto = total.subtract(Quantity.fromDecimal("0.5"));
    expect(resto.toDecimal()).toBe(1.5);
  });

  it("rechaza más de 3 decimales en string", () => {
    expect(() => Quantity.fromDecimal("1.2345")).toThrow(/máximo 3 decimales/);
  });

  it("rechaza formatos inválidos", () => {
    expect(() => Quantity.fromDecimal("1,5")).toThrow(/inválido/);
    expect(() => Quantity.fromDecimal(Number.POSITIVE_INFINITY)).toThrow(/no finito/);
  });

  it("permite negativos (para ajustes), con redondeo comercial en number", () => {
    expect(Quantity.fromDecimal("-0.5").isNegative()).toBe(true);
    // 0.0005 → 0.001 (half away from zero)
    expect(Quantity.fromDecimal(0.0005).milli).toBe(1);
    expect(Quantity.fromDecimal(-0.0005).milli).toBe(-1);
  });

  it("multiplica por factor", () => {
    expect(Quantity.fromDecimal("2").multiply(3).toDecimal()).toBe(6);
  });

  it("compara igualdad", () => {
    expect(Quantity.fromDecimal("1.0").equals(Quantity.fromMilli(1000))).toBe(true);
  });
});
