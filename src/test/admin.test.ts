import { describe, expect, it, vi } from "vitest";
import { criarSessao, sessaoValida } from "@/lib/admin-sessao.server";
import { listarCadastrosDaPlanilha, verificarLoginNaPlanilha } from "@/lib/planilha.server";

const config = (body: string, init?: ResponseInit) => ({
  url: "https://example.test/exec",
  token: "credencial-ficticia-de-teste",
  fetchImpl: vi.fn<typeof fetch>().mockResolvedValue(new Response(body, init)),
});

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

describe("login pela planilha", () => {
  it("só autoriza com autorizado === true", async () => {
    expect(
      await verificarLoginNaPlanilha(
        { email: "a@b.c", senha: "x" },
        config('{"ok":true,"autorizado":true}'),
      ),
    ).toEqual({ ok: true, autorizado: true });
    expect(
      await verificarLoginNaPlanilha(
        { email: "a@b.c", senha: "x" },
        config('{"ok":true,"autorizado":"true"}'),
      ),
    ).toEqual({ ok: true, autorizado: false });
  });
  it("bloqueio do Google não vira login", async () => {
    const r = await verificarLoginNaPlanilha(
      { email: "a@b.c", senha: "x" },
      config("<html></html>", { status: 401 }),
    );
    expect(r.ok).toBe(false);
  });
});

describe("listagem da planilha", () => {
  it("valida o formato dos cadastros", async () => {
    const c = {
      linha: 2,
      data: "2026-11-18T10:00:00.000Z",
      nome: "Ana",
      whatsapp: "(85) 99999-0000",
      localidade: "Aracoiaba",
      enviadoEm: "",
    };
    expect(
      await listarCadastrosDaPlanilha(config(JSON.stringify({ ok: true, cadastros: [c] }))),
    ).toEqual({ ok: true, cadastros: [c] });
    expect((await listarCadastrosDaPlanilha(config('{"ok":true,"cadastros":"x"}'))).ok).toBe(false);
  });
});
