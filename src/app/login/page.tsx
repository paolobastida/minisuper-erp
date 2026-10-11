import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar — Minisuper ERP",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Minisuper ERP
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Accede con tu teléfono para abrir caja y vender.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
