/** Error base para violaciones de reglas de negocio del catálogo. */
export class ErrorCatalogo extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class SkuInvalido extends ErrorCatalogo {
  constructor(detalle: string) {
    super(`SKU inválido: ${detalle}`);
  }
}

export class EanInvalido extends ErrorCatalogo {
  constructor(detalle: string) {
    super(`EAN inválido: ${detalle}`);
  }
}

export class IvaInvalido extends ErrorCatalogo {
  constructor(valor: number) {
    super(`IVA no permitido: ${valor}. Valores válidos: 4, 10, 21`);
  }
}

export class ProductoInvalido extends ErrorCatalogo {
  constructor(detalle: string) {
    super(`Producto inválido: ${detalle}`);
  }
}
