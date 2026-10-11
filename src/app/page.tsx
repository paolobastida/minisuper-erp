import { SignOutButton } from "./sign-out-button";

const modulos = [
  { nombre: "Productos", descripcion: "Catálogo y precios", fase: "Fase 1" },
  { nombre: "Inventario", descripcion: "Stock, merma y ajustes", fase: "Fase 1" },
  { nombre: "POS", descripcion: "Venta y cobro de tickets", fase: "Fase 2" },
  { nombre: "Caja", descripcion: "Apertura, arqueo y cierre", fase: "Fase 3" },
  { nombre: "Compras", descripcion: "Proveedores y recepción", fase: "Fase 4" },
  { nombre: "Asistente", descripcion: "Agente WhatsApp", fase: "Fase 5" },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
            Minisuper ERP
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Fase 0 completada — la sesión funciona y el esquema está listo.
          </p>
        </div>
        <SignOutButton />
      </header>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {modulos.map((m) => (
          <li
            key={m.nombre}
            className="rounded-xl border border-zinc-200 bg-white p-4 opacity-70"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-zinc-900">{m.nombre}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                {m.fase}
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">{m.descripcion}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
