import { createServerFn } from "@tanstack/react-start";
import { cadastroSchema } from "./cadastro";
import {
  configuracaoDoAmbiente,
  enviarCadastroParaPlanilha,
  registrarFalha,
} from "./planilha.server";

// Envia o cadastro para a planilha do Google (via Apps Script — veja google-sheets/planilha.gs).
// Roda só no servidor: a URL e o token ficam nos Secrets GOOGLE_SHEETS_URL e GOOGLE_SHEETS_TOKEN.
export const enviarParaPlanilha = createServerFn({ method: "POST" })
  .inputValidator(cadastroSchema)
  .handler(async ({ data }) => {
    const resultado = await enviarCadastroParaPlanilha(data, configuracaoDoAmbiente());
    if (!resultado.ok) registrarFalha("cadastro", resultado);
    return resultado;
  });
