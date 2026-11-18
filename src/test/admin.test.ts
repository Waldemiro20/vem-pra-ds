import { describe, expect, it } from "vitest";
import { hashToken, novoTokenSessao, tokenComFormatoValido } from "@/lib/admin-sessao.server";
import { conferirSenha, gerarHashSenha } from "@/lib/senha.server";

describe("token de sessão", () => {
  it("gera tokens aleatórios no formato esperado", () => {
    const a = novoTokenSessao();
    expect(tokenComFormatoValido(a)).toBe(true);
    expect(a).not.toBe(novoTokenSessao());
  });
  it("recusa valores fora do formato", () => {
    expect(tokenComFormatoValido(undefined)).toBe(false);
    expect(tokenComFormatoValido("curto")).toBe(false);
  });
  it("guarda só o hash, que é estável", async () => {
    const t = novoTokenSessao();
    expect(await hashToken(t)).toBe(await hashToken(t));
    expect(await hashToken(t)).not.toBe(t);
  });
});

describe("senha", () => {
  it("confere o hash gerado e recusa senha errada", async () => {
    const h = await gerarHashSenha("minha-senha", 1000);
    expect(await conferirSenha("minha-senha", h)).toBe(true);
    expect(await conferirSenha("outra", h)).toBe(false);
    expect(await conferirSenha("minha-senha", "lixo")).toBe(false);
  });
});

// Teste de ponta a ponta no banco: só roda com TEST_DATABASE_URL apontando para um Postgres
// já migrado e descartável (ex.: Docker). Usa um admin de teste próprio e apaga o que criou.
const urlTeste = process.env["TEST_DATABASE_URL"];
describe.skipIf(!urlTeste)("banco (Prisma)", () => {
  it("salva cadastro, faz login, lista, marca enviado e encerra a sessão", async () => {
    process.env["DATABASE_URL"] = urlTeste;
    const { db } = await import("@/lib/db.server");
    const admin = await import("@/lib/admin.server");
    const email = `teste-${Date.now()}@exemplo.test`;
    await db().admin.create({
      data: { email, senhaHash: await gerarHashSenha("senha-teste", 1000) },
    });
    const cad = await db().cadastro.create({
      data: { nome: "Ana Teste", whatsapp: "(85) 99999-0000", localidade: "Aracoiaba" },
    });
    try {
      expect(await admin.autenticar(email, "errada")).toBeNull();
      const token = await admin.autenticar(email.toUpperCase(), "senha-teste");
      expect(token).toBeTruthy();
      expect(await admin.sessaoValida(token!)).toBe(true);

      const lista = await admin.listarCadastros();
      expect(lista.find((c) => c.id === cad.id)).toMatchObject({
        nome: "Ana Teste",
        enviadoEm: null,
      });

      await admin.marcarEnviado(cad.id);
      const marcado = (await admin.listarCadastros()).find((c) => c.id === cad.id);
      expect(marcado?.enviadoEm).toBeTruthy();

      await admin.encerrarSessao(token!);
      expect(await admin.sessaoValida(token!)).toBe(false);
    } finally {
      await db().cadastro.delete({ where: { id: cad.id } });
      await db().admin.delete({ where: { email } });
      await db().$disconnect();
    }
  });
});
