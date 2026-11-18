import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { COOKIE_ADMIN, DURACAO_SESSAO_S } from "./admin-sessao.server";
import {
  autenticar,
  encerrarSessao,
  listarCadastros,
  marcarEnviado,
  sessaoValida,
} from "./admin.server";
import { registrarFalha } from "./db.server";

// Login do super admin: tabela sam_admins (e-mail + hash da senha) no Supabase.

export const verSessaoAdmin = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return { autenticado: await sessaoValida(getCookie(COOKIE_ADMIN)) };
  } catch (error) {
    registrarFalha("sessao", error);
    return { autenticado: false };
  }
});

export const entrarAdmin = createServerFn({ method: "POST" })
  .validator(
    z.object({ email: z.string().trim().email().max(200), senha: z.string().min(1).max(200) }),
  )
  .handler(async ({ data }) => {
    let token;
    try {
      token = await autenticar(data.email, data.senha);
    } catch (error) {
      registrarFalha("login", error);
      return { ok: false as const, erro: "Não foi possível acessar o banco. Tente novamente." };
    }
    if (!token) return { ok: false as const, erro: "E-mail ou senha incorretos." };

    setCookie(COOKIE_ADMIN, token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: DURACAO_SESSAO_S,
    });
    return { ok: true as const };
  });

export const sairAdmin = createServerFn({ method: "POST" }).handler(async () => {
  try {
    await encerrarSessao(getCookie(COOKIE_ADMIN));
  } catch (error) {
    registrarFalha("sair", error);
  }
  deleteCookie(COOKIE_ADMIN, { path: "/" });
  return { ok: true };
});

export const listarCadastrosAdmin = createServerFn({ method: "GET" }).handler(async () => {
  try {
    if (!(await sessaoValida(getCookie(COOKIE_ADMIN)))) {
      return { ok: false as const, erro: "nao_autenticado" as const };
    }
    return { ok: true as const, cadastros: await listarCadastros() };
  } catch (error) {
    registrarFalha("listar", error);
    return { ok: false as const, erro: "armazenamento" as const };
  }
});

export const marcarEnviadoAdmin = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string().uuid() }))
  .handler(async ({ data }) => {
    try {
      if (!(await sessaoValida(getCookie(COOKIE_ADMIN)))) return { ok: false };
      await marcarEnviado(data.id);
      return { ok: true };
    } catch (error) {
      registrarFalha("marcar", error);
      return { ok: false };
    }
  });
