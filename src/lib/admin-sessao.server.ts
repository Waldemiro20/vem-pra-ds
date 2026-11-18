// Sessão do painel /admin: cookie "exp.assinatura" assinado com HMAC-SHA256.
// A chave é derivada do secret GOOGLE_SHEETS_TOKEN, então não há senha guardada no navegador.
export const COOKIE_ADMIN = "sam_admin";
export const DURACAO_SESSAO_S = 12 * 60 * 60;

const codificador = new TextEncoder();

function base64url(bytes: ArrayBuffer) {
  let s = "";
  for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function assinar(segredo: string, mensagem: string) {
  const chave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(`sam-admin-sessao:${segredo}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64url(await crypto.subtle.sign("HMAC", chave, codificador.encode(mensagem)));
}

function iguais(a: string, b: string) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

export async function criarSessao(segredo: string, agoraMs = Date.now()) {
  const exp = Math.floor(agoraMs / 1000) + DURACAO_SESSAO_S;
  return `${exp}.${await assinar(segredo, `admin:${exp}`)}`;
}

export async function sessaoValida(
  valor: string | undefined,
  segredo: string | undefined,
  agoraMs = Date.now(),
) {
  if (!valor || !segredo) return false;
  const [exp, assinatura] = valor.split(".");
  if (!exp || !assinatura || !/^\d+$/.test(exp)) return false;
  if (Number(exp) * 1000 <= agoraMs) return false;
  return iguais(assinatura, await assinar(segredo, `admin:${exp}`));
}
