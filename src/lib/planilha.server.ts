import { z } from "zod";
import type { CadastroForm } from "./cadastro";

export type FalhaPlanilha =
  | "configuracao"
  | "acesso_negado"
  | "token_invalido"
  | "resposta_invalida"
  | "tempo_esgotado"
  | "falha_de_rede"
  | "falha_no_google";

export type ResultadoPlanilha =
  { ok: true } | { ok: false; motivo: FalhaPlanilha; statusHttp?: number };

type Falha = Extract<ResultadoPlanilha, { ok: false }>;

export type ConfiguracaoPlanilha = {
  url?: string | undefined;
  token?: string | undefined;
  fetchImpl?: typeof fetch;
};

export function configuracaoDoAmbiente(): ConfiguracaoPlanilha {
  return { url: process.env["GOOGLE_SHEETS_URL"], token: process.env["GOOGLE_SHEETS_TOKEN"] };
}

// Faz um POST ao Apps Script e só aceita como sucesso um JSON com `ok: true`.
// Nunca devolve a resposta bruta: em caso de falha, só o motivo classificado.
async function postarNaPlanilha(
  corpo: Record<string, unknown>,
  { url, token, fetchImpl = fetch }: ConfiguracaoPlanilha,
): Promise<{ ok: true; payload: Record<string, unknown> } | Falha> {
  if (!url || !token) return { ok: false, motivo: "configuracao" };

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...corpo, token }),
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, motivo: "acesso_negado", statusHttp: response.status };
    }
    if (!response.ok) {
      return { ok: false, motivo: "falha_no_google", statusHttp: response.status };
    }
    if (new URL(response.url || url).hostname === "accounts.google.com") {
      return { ok: false, motivo: "acesso_negado", statusHttp: response.status };
    }

    const text = await response.text();
    let payload: unknown;
    try {
      payload = JSON.parse(text);
    } catch {
      return { ok: false, motivo: "resposta_invalida", statusHttp: response.status };
    }

    if (payload && typeof payload === "object" && "ok" in payload && payload.ok === true) {
      return { ok: true, payload: payload as Record<string, unknown> };
    }
    if (
      payload &&
      typeof payload === "object" &&
      "erro" in payload &&
      payload.erro === "token inválido"
    ) {
      return { ok: false, motivo: "token_invalido", statusHttp: response.status };
    }
    return { ok: false, motivo: "resposta_invalida", statusHttp: response.status };
  } catch (error) {
    const timeout =
      error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { ok: false, motivo: timeout ? "tempo_esgotado" : "falha_de_rede" };
  }
}

export function registrarFalha(contexto: string, falha: Falha) {
  // Nunca registre a URL, o token, credenciais ou a resposta bruta do Google.
  console.error(
    `[planilha:${contexto}] Falha: ${falha.motivo}; HTTP: ${falha.statusHttp ?? "indisponível"}.`,
  );
}

export async function enviarCadastroParaPlanilha(
  data: CadastroForm,
  config: ConfiguracaoPlanilha,
): Promise<ResultadoPlanilha> {
  const r = await postarNaPlanilha({ ...data }, config);
  return r.ok ? { ok: true } : r;
}

const cadastroPlanilhaSchema = z.object({
  linha: z.number().int().min(2),
  data: z.string(),
  nome: z.string(),
  whatsapp: z.string(),
  localidade: z.string(),
  enviadoEm: z.string(),
});
export type CadastroPlanilha = z.infer<typeof cadastroPlanilhaSchema>;

export async function listarCadastrosDaPlanilha(
  config: ConfiguracaoPlanilha,
): Promise<{ ok: true; cadastros: CadastroPlanilha[] } | Falha> {
  const r = await postarNaPlanilha({ acao: "listar" }, config);
  if (!r.ok) return r;
  const lista = z.array(cadastroPlanilhaSchema).safeParse(r.payload["cadastros"]);
  if (!lista.success) return { ok: false, motivo: "resposta_invalida" };
  return { ok: true, cadastros: lista.data };
}

export async function verificarLoginNaPlanilha(
  credenciais: { email: string; senha: string },
  config: ConfiguracaoPlanilha,
): Promise<{ ok: true; autorizado: boolean } | Falha> {
  const r = await postarNaPlanilha({ acao: "login", ...credenciais }, config);
  if (!r.ok) return r;
  // Só um booleano true explícito autoriza.
  return { ok: true, autorizado: r.payload["autorizado"] === true };
}

export async function marcarMensagemEnviada(
  alvo: { linha: number; whatsapp: string },
  config: ConfiguracaoPlanilha,
): Promise<ResultadoPlanilha> {
  const r = await postarNaPlanilha({ acao: "marcar", ...alvo }, config);
  return r.ok ? { ok: true } : r;
}
