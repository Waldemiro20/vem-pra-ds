import type { CadastroAdmin } from "./cadastro";
import {
  DURACAO_SESSAO_S,
  hashToken,
  novoTokenSessao,
  tokenComFormatoValido,
} from "./admin-sessao.server";
import { db } from "./db.server";
import { conferirSenha } from "./senha.server";

// Regras do painel /admin, sem nada de cookie/HTTP (usadas pelas server functions e pela rota de exportação).

export async function autenticar(email: string, senha: string) {
  const admin = await db().admin.findUnique({ where: { email: email.trim().toLowerCase() } });
  // Confere a senha mesmo sem admin, para não revelar pelo tempo de resposta se o e-mail existe.
  const ok = await conferirSenha(
    senha,
    admin?.senhaHash ??
      "pbkdf2-sha256$50000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  );
  if (!admin || !ok) return null;

  const token = novoTokenSessao();
  await db().sessao.create({
    data: {
      tokenHash: await hashToken(token),
      adminId: admin.id,
      expiraEm: new Date(Date.now() + DURACAO_SESSAO_S * 1000),
    },
  });
  // Faxina: apaga sessões vencidas.
  await db().sessao.deleteMany({ where: { expiraEm: { lt: new Date() } } });
  return token;
}

export async function sessaoValida(token: string | undefined) {
  if (!tokenComFormatoValido(token)) return false;
  const sessao = await db().sessao.findUnique({ where: { tokenHash: await hashToken(token) } });
  return !!sessao && sessao.expiraEm > new Date();
}

export async function encerrarSessao(token: string | undefined) {
  if (!tokenComFormatoValido(token)) return;
  await db().sessao.deleteMany({ where: { tokenHash: await hashToken(token) } });
}

export async function listarCadastros(): Promise<CadastroAdmin[]> {
  const linhas = await db().cadastro.findMany({ orderBy: { criadoEm: "desc" } });
  return linhas.map((c) => ({
    id: c.id,
    data: c.criadoEm.toISOString(),
    nome: c.nome,
    whatsapp: c.whatsapp,
    localidade: c.localidade,
    enviadoEm: c.mensagemEnviadaEm?.toISOString() ?? null,
  }));
}

export async function marcarEnviado(id: string) {
  await db().cadastro.updateMany({
    where: { id, mensagemEnviadaEm: null },
    data: { mensagemEnviadaEm: new Date() },
  });
}
