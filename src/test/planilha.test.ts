import { describe, expect, it, vi } from "vitest";
import { enviarCadastroParaPlanilha } from "@/lib/planilha.server";

const cadastro = {
  nome: "Teste de integração",
  whatsapp: "(85) 99999-0000",
  localidade: "Aracoiaba - CE",
};
const configuracao = { url: "https://example.test/exec", token: "credencial-ficticia-de-teste" };

describe("envio à planilha", () => {
  it("aceita a confirmação JSON mesmo com espaços", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{ "ok": true }'));
    expect(await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([401, 403])("identifica o bloqueio de acesso HTTP %s sem devolver a página do Google", async (status) => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response("<html>acesso restrito</html>", { status }));
    expect(await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).toEqual({
      ok: false,
      motivo: "acesso_negado",
      statusHttp: status,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("não confunde texto HTML contendo ok com uma confirmação real", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('<html><script>const exemplo = {"ok":true}</script></html>'));
    expect(await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).toEqual({
      ok: false,
      motivo: "resposta_invalida",
      statusHttp: 200,
    });
  });

  it("exige o booleano true, não a string true", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"ok":"true"}'));
    expect((await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).ok).toBe(false);
  });

  it("identifica uma rejeição do token sem devolver o valor", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(new Response('{"ok":false,"erro":"token inválido"}'));
    expect(await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).toEqual({
      ok: false,
      motivo: "token_invalido",
      statusHttp: 200,
    });
  });

  it("não envia quando falta a configuração", async () => {
    const fetchImpl = vi.fn<typeof fetch>();
    expect(await enviarCadastroParaPlanilha(cadastro, { fetchImpl })).toEqual({ ok: false, motivo: "configuracao" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("identifica redirecionamento à tela de login do Google", async () => {
    const response = new Response("<html>login</html>");
    Object.defineProperty(response, "url", { value: "https://accounts.google.com/ServiceLogin" });
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response);
    expect(await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).toEqual({
      ok: false,
      motivo: "acesso_negado",
      statusHttp: 200,
    });
  });

  it("não repete automaticamente um envio quando o tempo esgota", async () => {
    const error = new Error("tempo esgotado");
    error.name = "TimeoutError";
    const fetchImpl = vi.fn<typeof fetch>().mockRejectedValue(error);
    expect(await enviarCadastroParaPlanilha(cadastro, { ...configuracao, fetchImpl })).toEqual({
      ok: false,
      motivo: "tempo_esgotado",
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});