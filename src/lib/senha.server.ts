// Hash de senha com PBKDF2 (Web Crypto, funciona no Cloudflare Worker).
// Formato: "pbkdf2-sha256$<iterações>$<sal base64url>$<hash base64url>".
const codificador = new TextEncoder();

function paraB64url(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function deB64url(texto: string) {
  const b64 = texto.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function derivar(senha: string, sal: Uint8Array<ArrayBuffer>, iteracoes: number) {
  const chave = await crypto.subtle.importKey("raw", codificador.encode(senha), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: sal, iterations: iteracoes },
    chave,
    256,
  );
  return new Uint8Array(bits);
}

export async function gerarHashSenha(senha: string, iteracoes = 50_000) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2-sha256$${iteracoes}$${paraB64url(sal)}$${paraB64url(await derivar(senha, sal, iteracoes))}`;
}

export async function conferirSenha(senha: string, hashGuardado: string) {
  const [alg, it, sal, hash] = hashGuardado.split("$");
  const iteracoes = Number(it);
  if (alg !== "pbkdf2-sha256" || !sal || !hash || !Number.isInteger(iteracoes) || iteracoes < 1) {
    return false;
  }
  const calculado = paraB64url(await derivar(senha, deB64url(sal), iteracoes));
  if (calculado.length !== hash.length) return false;
  let dif = 0;
  for (let i = 0; i < hash.length; i++) dif |= calculado.charCodeAt(i) ^ hash.charCodeAt(i);
  return dif === 0;
}
