"use client";

import { useState } from "react";
import { CheckCircle2, Globe, Lock, MapPin, Phone, Settings, User, Zap } from "lucide-react";
import { formatWhatsapp } from "@/lib/whatsapp";
import { cadastroSchema as schema, type CadastroForm as Form } from "@/lib/cadastro";
import { salvarCadastro } from "@/app/actions";

// Fotos do mosaico à esquerda: coloque as imagens em public/fotos/ com esses nomes.
// Se alguma não existir, o bloco aparece só com o degradê roxo.
const FOTOS = Array.from({ length: 12 }, (_, i) => `/fotos/${i + 1}.jpg`);

function Logo() {
  return (
    <div className="relative mx-auto h-36 w-36 rounded-3xl border-2 border-white/40 bg-gradient-to-br from-[#a855f7] to-[#7c3aed] shadow-[0_20px_60px_-10px_rgba(168,85,247,0.8)] sm:h-40 sm:w-40">
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full text-white"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      >
        <polygon points="50,22 72,35 72,61 50,74 28,61 28,35" />
      </svg>
      <Globe
        className="absolute left-[33%] top-[36%] h-[26%] w-[26%] text-sky-300"
        strokeWidth={2}
      />
      <Zap
        className="absolute right-[10%] top-[8%] h-[30%] w-[30%] rotate-12 text-white"
        strokeWidth={2}
      />
      <Zap
        className="absolute bottom-[4%] left-[18%] h-[28%] w-[28%] -rotate-12 text-white"
        strokeWidth={2}
      />
      <Lock
        className="absolute bottom-[22%] left-[10%] h-[18%] w-[18%] fill-white text-white"
        strokeWidth={2}
      />
      <Settings
        className="absolute bottom-[16%] right-[14%] h-[20%] w-[20%] text-white"
        strokeWidth={2}
      />
    </div>
  );
}

export function Landing() {
  const [form, setForm] = useState<Form>({ nome: "", whatsapp: "", localidade: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = schema.safeParse(form);
    if (!r.success) {
      const errs: typeof errors = {};
      r.error.issues.forEach((i) => (errs[i.path[0] as keyof Form] ??= i.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setStatus("sending");
    // Salva no banco (Supabase, via Prisma) pelo servidor.
    try {
      const resultado = await salvarCadastro(r.data);
      setStatus(resultado.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  const field = (
    k: keyof Form,
    label: string,
    placeholder: string,
    Icon: typeof User,
    extra?: object,
  ) => (
    <div className="space-y-2">
      <label htmlFor={k} className="block text-sm font-bold text-white">
        {label}
      </label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/80" />
        <input
          id={k}
          value={form[k]}
          placeholder={placeholder}
          onChange={(e) =>
            setForm({
              ...form,
              [k]: k === "whatsapp" ? formatWhatsapp(e.target.value) : e.target.value,
            })
          }
          aria-invalid={!!errors[k]}
          className="h-12 w-full rounded-xl border border-white/15 bg-white/10 pl-11 pr-4 text-[15px] text-white outline-none transition placeholder:text-white/85 focus:border-[#c084fc] focus:bg-white/15 focus:ring-4 focus:ring-[#a855f7]/30 aria-[invalid=true]:border-red-400"
          {...extra}
        />
      </div>
      {errors[k] && <p className="text-sm font-medium text-red-300">{errors[k]}</p>}
    </div>
  );

  return (
    <main className="grid min-h-screen font-sans text-white lg:grid-cols-2">
      {/* Lado esquerdo: mosaico de fotos com overlay roxo */}
      <section className="relative flex min-h-[420px] items-center justify-center overflow-hidden bg-[#3b2470] px-6 py-16">
        <div className="absolute inset-0 grid scale-110 grid-cols-3 gap-3 blur-[3px]">
          {FOTOS.map((src, i) => (
            <div
              key={src}
              className="rounded-lg bg-cover bg-center"
              style={{
                backgroundImage: `url(${src}), linear-gradient(${135 + i * 25}deg, #6d4bb0, #4c2f8a 60%, #8b5cf6)`,
              }}
            />
          ))}
        </div>
        <div className="absolute inset-0 bg-[#6b3fc4]/55 mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2a1650]/30 via-transparent to-[#2a1650]/40" />

        <div className="relative text-center">
          <Logo />
          <h1 className="mt-8 font-display text-4xl font-extrabold tracking-tight drop-shadow-lg sm:text-5xl">
            Jornada EEEP
          </h1>
          <p className="mt-3 text-sm font-medium text-white/95 drop-shadow sm:text-base">
            EEEP Dr. Salomão Alves de Moura — Expotec
          </p>
        </div>
      </section>

      {/* Lado direito: grade + formulário */}
      <section className="bg-grid flex items-center justify-center bg-[#1e1338] px-5 py-14">
        <div className="w-full max-w-sm rounded-3xl border border-[#a855f7]/50 bg-[#3a2668]/85 p-7 shadow-glow backdrop-blur sm:p-8">
          {status === "done" ? (
            <div className="py-6 text-center" role="status">
              <CheckCircle2 className="mx-auto h-16 w-16 text-[#c084fc]" strokeWidth={2.5} />
              <h2 className="mt-4 font-display text-2xl font-extrabold">Jornada iniciada!</h2>
              <p className="mt-3 text-white/85">
                Valeu, {form.nome.split(" ")[0]}! Em breve entraremos em contato pelo WhatsApp.
              </p>
            </div>
          ) : (
            <>
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8b4fe]">
                O desafio de desenvolvimento de sistemas
              </p>
              <h2 className="mt-2 font-display text-[26px] font-extrabold leading-tight">
                Identifique-se,
                <br />
                Desenvolvedor!
              </h2>

              <form onSubmit={submit} noValidate className="mt-6 space-y-5">
                {field("nome", "Nome completo ou Apelido", "Ex.: Ana Dev", User, {
                  autoComplete: "name",
                })}
                {field("whatsapp", "WhatsApp", "(85) 9 9999-9999", Phone, {
                  inputMode: "numeric",
                  autoComplete: "tel",
                })}
                {field("localidade", "Sua Localidade", "Aracoiaba", MapPin)}
                {status === "error" && (
                  <p className="text-sm font-medium text-red-300">
                    Não foi possível enviar. Tente novamente.
                  </p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] font-bold text-white shadow-[0_10px_30px_-8px_rgba(168,85,247,0.9)] transition hover:scale-[1.02] hover:brightness-110 active:scale-100 disabled:opacity-60"
                >
                  {status === "sending" ? "Enviando..." : "Iniciar Jornada 🚀"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
