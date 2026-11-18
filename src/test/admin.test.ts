import { describe, expect, it } from "vitest";
import { criarSessao, sessaoValida } from "@/lib/admin-sessao.server";
import {
  ADMIN_INICIAL,
  alterarDados,
  lerDados,
  novoCadastro,
  type Armazenamento,
} from "@/lib/dados.server";
import { conferirSenha, gerarHashSenha } from "@/lib/senha.server";

function memoria(inicial: string | null = null) {
  const estado = { texto: inicial, gravacoes: 0 };
  const arm: Armazenamento = {
    ler: async () => estado.texto,
    gravar: async (t) => {
      estado.texto = t;
      estado.gravacoes++;
    },
  };
  return { arm, estado };
}

const form = { nome: "Ana", whatsapp: "(85) 99999-0000", localidade: "Aracoiaba" };

describe("sessão do admin", () => {
  it("aceita a sessão assinada com o mesmo segredo e dentro do prazo", async () => {
    const s = await criarSessao("segredo-a", 0);
    expect(await sessaoValida(s, "segredo-a", 1000)).toBe(true);
  });
  it("recusa segredo diferente, sessão expirada ou adulterada", async () => {
    const s = await criarSessao("segredo-a", 0);
    expect(await sessaoValida(s, "segredo-b", 1000)).toBe(false);
    expect(await sessaoValida(s, "segredo-a", 13 * 3600 * 1000)).toBe(false);
    expect(await sessaoValida(s.replace(/^\d+/, "99999999999"), "segredo-a", 1000)).toBe(false);
    expect(await sessaoValida(undefined, "segredo-a")).toBe(false);
  });
});

describe("senha", () => {
  it("confere o hash gerado e recusa senha errada", async () => {
    const h = await gerarHashSenha("minha-senha", 1000);
    expect(await conferirSenha("minha-senha", h)).toBe(true);
    expect(await conferirSenha("outra", h)).toBe(false);
    expect(await conferirSenha("minha-senha", "lixo")).toBe(false);
  });
  it("o admin inicial guarda só o hash", () => {
    expect(ADMIN_INICIAL.senhaHash.startsWith("pbkdf2-sha256$")).toBe(true);
  });
});

describe("dados.json", () => {
  it("cria o arquivo com o admin inicial quando não existe", async () => {
    const { arm, estado } = memoria();
    const d = await lerDados(arm);
    expect(d.admin.email).toBe(ADMIN_INICIAL.email);
    expect(d.cadastros).toEqual([]);
    expect(d.segredoSessao).toHaveLength(64);
    expect(JSON.parse(estado.texto!)).toEqual(d);
  });

  it("salva um cadastro e confirma relendo", async () => {
    const { arm } = memoria();
    const c = novoCadastro(form);
    await alterarDados(
      arm,
      (d) => d.cadastros.push(c),
      (d) => d.cadastros.some((x) => x.id === c.id),
    );
    expect((await lerDados(arm)).cadastros).toEqual([c]);
  });

  it("repete quando outra gravação apagou a alteração", async () => {
    const { arm, estado } = memoria();
    await lerDados(arm);
    const original = arm.gravar;
    let primeira = true;
    arm.gravar = async (t) => {
      // Simula outra requisição sobrescrevendo logo depois da primeira gravação.
      const antes = estado.texto;
      await original(t);
      if (primeira) {
        primeira = false;
        estado.texto = antes;
      }
    };
    const c = novoCadastro(form);
    await alterarDados(
      arm,
      (d) => d.cadastros.push(c),
      (d) => d.cadastros.some((x) => x.id === c.id),
    );
    expect((await lerDados(arm)).cadastros.map((x) => x.id)).toEqual([c.id]);
  });

  it("não sobrescreve um arquivo inválido", async () => {
    const { arm, estado } = memoria('{"quebrado": true}');
    await expect(lerDados(arm)).rejects.toThrow();
    expect(estado.gravacoes).toBe(0);
  });
});
