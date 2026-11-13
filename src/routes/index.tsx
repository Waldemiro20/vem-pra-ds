import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatWhatsapp } from "@/lib/whatsapp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vem ser DS — Cadastre-se" },
      { name: "description", content: "Preencha seus dados e dê o próximo passo para ser DS." },
      { property: "og:title", content: "Vem ser DS" },
      { property: "og:description", content: "Preencha seus dados e dê o próximo passo para ser DS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const schema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome completo").max(120),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Informe um WhatsApp completo"),
  localidade: z.string().trim().min(2, "Informe sua cidade e estado").max(120),
});
type Form = z.infer<typeof schema>;

function Index() {
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
    const { error } = await supabase.from("cadastros_ds").insert(r.data);
    setStatus(error ? "error" : "done");
  }

  const field = (k: keyof Form, label: string, placeholder: string, extra?: object) => (
    <div className="space-y-1.5">
      <label htmlFor={k} className="text-sm font-semibold">{label}</label>
      <input
        id={k}
        value={form[k]}
        placeholder={placeholder}
        onChange={(e) =>
          setForm({ ...form, [k]: k === "whatsapp" ? formatWhatsapp(e.target.value) : e.target.value })
        }
        aria-invalid={!!errors[k]}
        className="h-14 w-full rounded-xl border-2 border-input bg-card px-4 text-lg outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/30 aria-[invalid=true]:border-destructive"
        {...extra}
      />
      {errors[k] && <p className="text-sm font-medium text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <main className="min-h-screen bg-background bg-hero px-5 py-12 font-sans text-foreground sm:py-20">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="font-display text-6xl uppercase leading-[0.9] tracking-tight sm:text-8xl">
          Vem ser <span className="text-primary">DS</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-lg text-muted-foreground sm:text-xl">
          Preencha seus dados abaixo e dê o próximo passo. Leva menos de 1 minuto.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-md rounded-3xl bg-card p-6 text-card-foreground shadow-card sm:p-8">
        {status === "done" ? (
          <div className="py-6 text-center" role="status">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" strokeWidth={2.5} />
            <h2 className="mt-4 font-display text-2xl uppercase">Cadastro recebido!</h2>
            <p className="mt-3 text-lg">
              Obrigado, {form.nome.split(" ")[0]}! Nossa equipe vai entrar em contato com você pelo WhatsApp em breve.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            {field("nome", "Nome", "Seu nome completo", { autoComplete: "name" })}
            {field("whatsapp", "WhatsApp", "(00) 00000-0000", { inputMode: "numeric", autoComplete: "tel" })}
            {field("localidade", "Localidade", "Cidade - UF")}
            {status === "error" && (
              <p className="text-sm font-medium text-destructive">Não foi possível enviar. Tente novamente.</p>
            )}
            <button
              type="submit"
              disabled={status === "sending"}
              className="h-16 w-full rounded-xl bg-primary font-display text-xl uppercase text-primary-foreground transition hover:scale-[1.02] hover:brightness-105 active:scale-100 disabled:opacity-60"
            >
              {status === "sending" ? "Enviando..." : "Quero ser DS"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
