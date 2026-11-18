import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { COOKIE_ADMIN, DURACAO_SESSAO_S, criarSessao, sessaoValida } from "./admin-sessao.server";
import { alterarDados, armazenamentoSupabase, lerDados, motivoDoErro } from "./dados.server";
import { conferirSenha } from "./senha.server";

// O login do super admin fica no próprio dados.json (e-mail + hash da senha).
// Se autorizado, o servidor grava um cookie de sessão assinado com o segredoSessao do JSON.

function registrar(contexto: string, error: unknown) {
  console.error(`[dados:${contexto}] Falha: ${motivoDoErro(error)}.`);
}

async function dadosSeAutenticado() {
  const dados = await lerDados(await armazenamentoSupabase());
  return (await sessaoValida(getCookie(COOKIE_ADMIN), dados.segredoSessao)) ? dados : null;
}

export const verSessaoAdmin = createServerFn({ method: "GET" }).handler(async () => {
  if (!getCookie(COOKIE_ADMIN)) return { autenticado: false };
  try {
    return { autenticado: (await dadosSeAutenticado()) !== null };
  } catch (error) {
    registrar("sessao", error);
    return { autenticado: false };
  }
});

export const entrarAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ email: z.string().trim().email().max(200), senha: z.string().min(1).max(200) }),
  )
  .handler(async ({ data }) => {
    let dados;
    try {
      dados = await lerDados(await armazenamentoSupabase());
    } catch (error) {
      registrar("login", error);
      return { ok: false as const, erro: "Não foi possível acessar os dados. Tente novamente." };
    }

    const emailOk = dados.admin.email.trim().toLowerCase() === data.email.toLowerCase();
    const senhaOk = await conferirSenha(data.senha, dados.admin.senhaHash);
    if (!emailOk || !senhaOk) return { ok: false as const, erro: "E-mail ou senha incorretos." };

    setCookie(COOKIE_ADMIN, await criarSessao(dados.segredoSessao), {
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
  try {
    const dados = await dadosSeAutenticado();
    if (!dados) return { ok: false as const, erro: "nao_autenticado" as const };
    return { ok: true as const, cadastros: dados.cadastros };
  } catch (error) {
    registrar("listar", error);
    return { ok: false as const, erro: "armazenamento" as const };
  }
});

export const marcarEnviadoAdmin = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      if (!(await dadosSeAutenticado())) return { ok: false };
      await alterarDados(
        await armazenamentoSupabase(),
        (d) => {
          const c = d.cadastros.find((x) => x.id === data.id);
          if (c) c.enviadoEm = new Date().toISOString();
        },
        (d) =>
          d.cadastros.find((x) => x.id === data.id)?.enviadoEm != null ||
          !d.cadastros.some((x) => x.id === data.id),
      );
      return { ok: true };
    } catch (error) {
      registrar("marcar", error);
      return { ok: false };
    }
  });
