"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { cadastroSchema } from "@/lib/cadastro";
import { COOKIE_ADMIN, DURACAO_SESSAO_S } from "@/lib/admin-sessao.server";
import {
  autenticar,
  encerrarSessao,
  listarCadastros,
  marcarEnviado,
  sessaoValida,
} from "@/lib/admin.server";
import { db, registrarFalha } from "@/lib/db.server";

// Server Actions: rodam só no servidor. Toda entrada é revalidada aqui (o navegador não é confiável).

async function tokenDoCookie() {
  return (await cookies()).get(COOKIE_ADMIN)?.value;
}

// --- Landing page ---------------------------------------------------------------------------

export async function salvarCadastro(entrada: unknown) {
  const r = cadastroSchema.safeParse(entrada);
  if (!r.success) return { ok: false as const };
  try {
    await db().cadastro.create({ data: r.data });
    return { ok: true as const };
  } catch (error) {
    // Nunca registre os dados da pessoa nem a mensagem bruta do banco.
    registrarFalha("cadastro", error);
    return { ok: false as const };
  }
}

// --- Painel /admin --------------------------------------------------------------------------

export async function verSessaoAdmin() {
  try {
    return { autenticado: await sessaoValida(await tokenDoCookie()) };
  } catch (error) {
    registrarFalha("sessao", error);
    return { autenticado: false };
  }
}

const loginSchema = z.object({
  email: z.string().trim().email().max(200),
  senha: z.string().min(1).max(200),
});

export async function entrarAdmin(entrada: unknown) {
  const r = loginSchema.safeParse(entrada);
  if (!r.success) return { ok: false as const, erro: "E-mail ou senha incorretos." };

  let token;
  try {
    token = await autenticar(r.data.email, r.data.senha);
  } catch (error) {
    registrarFalha("login", error);
    return { ok: false as const, erro: "Não foi possível acessar o banco. Tente novamente." };
  }
  if (!token) return { ok: false as const, erro: "E-mail ou senha incorretos." };

  (await cookies()).set(COOKIE_ADMIN, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
  return { ok: true as const };
}

export async function sairAdmin() {
  try {
    await encerrarSessao(await tokenDoCookie());
  } catch (error) {
    registrarFalha("sair", error);
  }
  (await cookies()).delete(COOKIE_ADMIN);
  return { ok: true };
}

export async function listarCadastrosAdmin() {
  try {
    if (!(await sessaoValida(await tokenDoCookie()))) {
      return { ok: false as const, erro: "nao_autenticado" as const };
    }
    return { ok: true as const, cadastros: await listarCadastros() };
  } catch (error) {
    registrarFalha("listar", error);
    return { ok: false as const, erro: "armazenamento" as const };
  }
}

export async function marcarEnviadoAdmin(entrada: unknown) {
  const r = z.object({ id: z.string().uuid() }).safeParse(entrada);
  if (!r.success) return { ok: false };
  try {
    if (!(await sessaoValida(await tokenDoCookie()))) return { ok: false };
    await marcarEnviado(r.data.id);
    return { ok: true };
  } catch (error) {
    registrarFalha("marcar", error);
    return { ok: false };
  }
}
