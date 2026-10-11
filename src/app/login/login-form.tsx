"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Paso = "telefono" | "codigo";

/**
 * Login OTP por teléfono con Supabase Auth.
 * Paso 1: número → se envía un SMS de 6 dígitos.
 * Paso 2: código → verificación; el proxy reconoce la sesión en la siguiente request.
 */
export function LoginForm() {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>("telefono");
  const [telefono, setTelefono] = useState("");
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enviarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({ phone: telefono });
    setCargando(false);
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setPaso("codigo");
  }

  async function verificarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone: telefono,
      token: codigo,
      type: "sms",
    });
    if (verifyError) {
      setCargando(false);
      setError(verifyError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500";
  const btnCls =
    "w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50";

  return (
    <div className="mt-6">
      {paso === "telefono" ? (
        <form onSubmit={enviarCodigo} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-zinc-700" htmlFor="telefono">
            Teléfono
          </label>
          <input
            id="telefono"
            type="tel"
            required
            placeholder="+34 600 000 000"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={inputCls}
            autoComplete="tel"
          />
          <button type="submit" disabled={cargando} className={btnCls}>
            {cargando ? "Enviando…" : "Enviar código"}
          </button>
        </form>
      ) : (
        <form onSubmit={verificarCodigo} className="flex flex-col gap-3">
          <p className="text-sm text-zinc-600">
            Código enviado a <span className="font-medium">{telefono}</span>
          </p>
          <label className="text-sm font-medium text-zinc-700" htmlFor="codigo">
            Código de 6 dígitos
          </label>
          <input
            id="codigo"
            type="text"
            inputMode="numeric"
            required
            maxLength={6}
            pattern="\d{6}"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            className={inputCls}
            autoComplete="one-time-code"
            autoFocus
          />
          <button type="submit" disabled={cargando || codigo.length !== 6} className={btnCls}>
            {cargando ? "Verificando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPaso("telefono");
              setCodigo("");
              setError(null);
            }}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            Cambiar de número
          </button>
        </form>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
