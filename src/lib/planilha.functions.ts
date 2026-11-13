import { createServerFn } from "@tanstack/react-start";
import { cadastroSchema } from "./cadastro";

// Envia o cadastro para a planilha do Google (via Apps Script — veja google-sheets/planilha.gs).
// Roda só no servidor: a URL e o token ficam nos Secrets GOOGLE_SHEETS_URL e GOOGLE_SHEETS_TOKEN.
export const enviarParaPlanilha = createServerFn({ method: "POST" })
  .validator(cadastroSchema)
  .handler(async ({ data }) => {
    const url = process.env["GOOGLE_SHEETS_URL"];
    const token = process.env["GOOGLE_SHEETS_TOKEN"];
    if (!url || !token) {
      console.error("[planilha] Configure os secrets GOOGLE_SHEETS_URL e GOOGLE_SHEETS_TOKEN.");
      return { ok: false };
    }

    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ ...data, token }),
      });
      const resposta = await r.text();
      if (!r.ok || !resposta.includes('"ok":true')) {
        console.error(`[planilha] Resposta inesperada (${r.status}): ${resposta.slice(0, 200)}`);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.error("[planilha] Falha ao enviar:", e);
      return { ok: false };
    }
  });
