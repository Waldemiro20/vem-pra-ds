import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { COOKIE_ADMIN, DURACAO_SESSAO_S, criarSessao, sessaoValida } from "./admin-sessao.server";
import {
  configuracaoDoAmbiente,
  listarCadastrosDaPlanilha,
  marcarMensagemEnviada,
  registrarFalha,
  verificarLoginNaPlanilha,
} from "./planilha.server";

// As credenciais do painel ficam na aba "Admin" da planilha (veja google-sheets/planilha.gs).
// O servidor só confere com o Apps Script e, se autorizado, grava um cookie de sessão assinado.

const segredo = () => process.env["GOOGLE_SHEETS_TOKEN"];
const autenticado = () => sessaoValida(getCookie(COOKIE_ADMIN), segredo());

export const verSessaoAdmin = createServerFn({ method: "GET" }).handler(async () => ({
  autenticado: await autenticado(),
}));

export const entrarAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ email: z.string().trim().email().max(200), senha: z.string().min(1).max(200) }),
  )
  .handler(async ({ data }) => {
    const r = await verificarLoginNaPlanilha(data, configuracaoDoAmbiente());
    if (!r.ok) {
      registrarFalha("login", r);
      return {
        ok: false as const,
        erro: "Não foi possível falar com a planilha. Tente novamente.",
      };
    }
    if (!r.autorizado) return { ok: false as const, erro: "E-mail ou senha incorretos." };

    setCookie(COOKIE_ADMIN, await criarSessao(segredo()!), {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: DURACAO_SESSAO_S,
    });
    return { ok: true as const };
  });

export const sairAdmin = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(COOKIE_ADMIN, { path: "/" });
  return { ok: true };
});

export const listarCadastrosAdmin = createServerFn({ method: "GET" }).handler(async () => {
  if (!(await autenticado())) return { ok: false as const, erro: "nao_autenticado" as const };
  const r = await listarCadastrosDaPlanilha(configuracaoDoAmbiente());
  if (!r.ok) {
    registrarFalha("listar", r);
    return { ok: false as const, erro: "planilha" as const };
  }
  return { ok: true as const, cadastros: r.cadastros };
});

export const marcarEnviadoAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ linha: z.number().int().min(2), whatsapp: z.string().max(40) }))
  .handler(async ({ data }) => {
    if (!(await autenticado())) return { ok: false as const };
    const r = await marcarMensagemEnviada(data, configuracaoDoAmbiente());
    if (!r.ok) registrarFalha("marcar", r);
    return { ok: r.ok };
  });
