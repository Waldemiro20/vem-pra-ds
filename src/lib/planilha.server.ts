import type { CadastroForm } from "./cadastro";

type FalhaPlanilha =
  | "configuracao"
  | "acesso_negado"
  | "token_invalido"
  | "resposta_invalida"
  | "tempo_esgotado"
  | "falha_de_rede"
  | "falha_no_google";

export type ResultadoPlanilha =
  | { ok: true }
  | { ok: false; motivo: FalhaPlanilha; statusHttp?: number };

type ConfiguracaoPlanilha = {
  url?: string;
  token?: string;
  fetchImpl?: typeof fetch;
};

export async function enviarCadastroParaPlanilha(
  data: CadastroForm,
  { url, token, fetchImpl = fetch }: ConfiguracaoPlanilha,
): Promise<ResultadoPlanilha> {
  if (!url || !token) return { ok: false, motivo: "configuracao" };

  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ ...data, token }),
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
      return { ok: true };
    }
    if (payload && typeof payload === "object" && "erro" in payload && payload.erro === "token inválido") {
      return { ok: false, motivo: "token_invalido", statusHttp: response.status };
    }
    return { ok: false, motivo: "resposta_invalida", statusHttp: response.status };
  } catch (error) {
    const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return { ok: false, motivo: timeout ? "tempo_esgotado" : "falha_de_rede" };
  }
}