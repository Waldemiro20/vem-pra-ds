import { createServerFn } from "@tanstack/react-start";
import { cadastroSchema } from "./cadastro";
import { enviarCadastroParaPlanilha } from "./planilha.server";

// Envia o cadastro para a planilha do Google (via Apps Script — veja google-sheets/planilha.gs).
// Roda só no servidor: a URL e o token ficam nos Secrets GOOGLE_SHEETS_URL e GOOGLE_SHEETS_TOKEN.
export const enviarParaPlanilha = createServerFn({ method: "POST" })
  .inputValidator(cadastroSchema)
  .handler(async ({ data }) => {
    const resultado = await enviarCadastroParaPlanilha(data, {
      url: process.env["GOOGLE_SHEETS_URL"],
      token: process.env["GOOGLE_SHEETS_TOKEN"],
    });
    if (!resultado.ok) {
      // Nunca registre a URL, o token ou a resposta bruta do Google.
      console.error(`[planilha] Falha: ${resultado.motivo}; HTTP: ${resultado.statusHttp ?? "indisponível"}.`);
    }
    return resultado;
  });
