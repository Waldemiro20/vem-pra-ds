import "server-only";
// Sessão do painel /admin: o cookie guarda um token aleatório de 32 bytes;
// o banco (tabela sam_sessoes) guarda só o SHA-256 dele, com a data de expiração.
export const COOKIE_ADMIN = "sam_admin";
export const DURACAO_SESSAO_S = 12 * 60 * 60;

function base64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function novoTokenSessao() {
  return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return base64url(new Uint8Array(digest));
}

export function tokenComFormatoValido(token: string | undefined): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}
