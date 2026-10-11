import { describe, expect, it } from "vitest";
import { Money } from "@/shared";
import { ProductoInvalido, SkuInvalido } from "./errors";
import { Ean } from "./ean";
import { Iva } from "./iva";
import { Producto } from "./producto";
import { Sku } from "./sku";

describe("Sku", () => {
  it("acepta códigos simples", () => {
    expect(Sku.crear("LECHE-1L").value).toBe("LECHE-1L");
    expect(Sku.crear("  abc  ").value).toBe("abc"); // trimea
  });

  it("rechaza vacío, espacios internos y >30", () => {
    expect(() => Sku.crear("   ")).toThrow(SkuInvalido);
    expect(() => Sku.crear("MAL CODIGO")).toThrow(/espacios/);
    expect(() => Sku.crear("x".repeat(31))).toThrow(/30 caracteres/);
  });
});

describe("Ean", () => {
  it("acepta EAN-13 y EAN-8 con checksum correcto", () => {
    expect(Ean.crear("9780201379624").value).toBe("9780201379624");
    expect(Ean.crear("96385074").value).toBe("96385074");
  });

  it("rechaza checksum incorrecto", () => {
    expect(() => Ean.crear("9780201379625")).toThrow(/dígito de control/);
  });

  it("rechaza longitud y formato inválidos", () => {
    expect(() => Ean.crear("1234567")).toThrow(/8 \(EAN-8\) o 13/);
    expect(() => Ean.crear("978020137962a")).toThrow(/solo puede contener dígitos/);
  });

  it("crearOPermitirVacio devuelve null para vacío", () => {
    expect(Ean.crearOPermitirVacio(null)).toBeNull();
    expect(Ean.crearOPermitirVacio("  ")).toBeNull();
    expect(Ean.crearOPermitirVacio("96385074")?.value).toBe("96385074");
  });
});

describe("Iva", () => {
  it("solo admite 4, 10 y 21", () => {
    expect(Iva.crear(4).porcentaje).toBe(4);
    expect(Iva.crear(10).porcentaje).toBe(10);
    expect(Iva.crear(21).porcentaje).toBe(21);
    expect(() => Iva.crear(16)).toThrow(/IVA no permitido/);
  });
});

describe("Producto", () => {
  const base = {
    sku: Sku.crear("LECHE-1L"),
    nombre: "Leche entera 1L",
    unidad: "uds" as const,
    iva: Iva.crear(4),
    precioVenta: Money.fromDecimal("1.20"),
  };

  it("crea un producto válido con id y activo por defecto", () => {
    const p = Producto.crear(base);
    expect(p.id).toBeTruthy();
    expect(p.activo).toBe(true);
    expect(p.precioVenta.toString()).toBe("1.20");
    expect(p.nombre).toBe("Leche entera 1L");
  });

  it("rechaza nombre vacío o demasiado largo", () => {
    expect(() => Producto.crear({ ...base, nombre: "  " })).toThrow(ProductoInvalido);
    expect(() => Producto.crear({ ...base, nombre: "x".repeat(121) })).toThrow(/120/);
  });

  it("rechaza precio negativo", () => {
    expect(() =>
      Producto.crear({ ...base, precioVenta: Money.fromCents(-1) }),
    ).toThrow(/negativo/);
  });

  it("cambia precio validando", () => {
    const p = Producto.crear(base);
    p.cambiarPrecio(Money.fromDecimal("1.35"));
    expect(p.precioVenta.toString()).toBe("1.35");
    expect(() => p.cambiarPrecio(Money.fromCents(-5))).toThrow(/negativo/);
  });

  it("cambia nombre, desactiva y reactiva", () => {
    const p = Producto.crear(base);
    p.cambiarNombre("  Leche semi 1L  ");
    expect(p.nombre).toBe("Leche semi 1L");
    p.desactivar();
    expect(p.activo).toBe(false);
    p.reactivar();
    expect(p.activo).toBe(true);
  });

  it("rehidrata sin pasar por crear", () => {
    const p = Producto.crear(base);
    const copia = Producto.rehidratar({
      id: p.id,
      sku: p.sku,
      ean: p.ean,
      nombre: p.nombre,
      categoriaId: p.categoriaId,
      unidad: p.unidad,
      iva: p.iva,
      precioVenta: p.precioVenta,
      activo: false,
    });
    expect(copia.id).toBe(p.id);
    expect(copia.activo).toBe(false);
  });
});
