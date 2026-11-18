// Cria ou atualiza um super admin direto no banco (tabela sam_admins).
// Uso: npm run admin:criar   (pede e-mail e senha; a senha não aparece na tela)
// Precisa da DATABASE_URL no .env.local. No banco fica só o hash da senha, nunca a senha.
import { config } from "dotenv";
import { pbkdf2Sync, randomBytes, randomUUID } from "node:crypto";
import { createInterface } from "node:readline";
import pg from "pg";

// A DATABASE_URL fica no .env.local (fora do Git). Nunca coloque no .env, que vai para o GitHub.
config({ path: [".env.local", ".env"], quiet: true });

const ITERACOES = 50_000; // mesmo formato de src/lib/senha.server.ts

function hashSenha(senha) {
  const sal = randomBytes(16);
  const hash = pbkdf2Sync(senha, sal, ITERACOES, 32, "sha256");
  return `pbkdf2-sha256$${ITERACOES}$${sal.toString("base64url")}$${hash.toString("base64url")}`;
}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: process.stdin.isTTY,
});
const linhas = rl[Symbol.asyncIterator]();
let esconder = false;
rl._writeToOutput = (s) => {
  if (!esconder) process.stdout.write(s);
};

async function perguntar(texto, oculto = false) {
  process.stdout.write(texto);
  esconder = oculto && process.stdin.isTTY;
  const { value } = await linhas.next();
  esconder = false;
  if (oculto) process.stdout.write("\n");
  return (value ?? "").trim();
}

if (!process.env.DATABASE_URL) {
  console.error("Falta a DATABASE_URL no arquivo .env.local.");
  process.exit(1);
}

const email = (await perguntar("E-mail do admin: ")).toLowerCase();
const senha = await perguntar("Senha: ", true);
const confirmacao = await perguntar("Repita a senha: ", true);
rl.close();

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("E-mail inválido.");
  process.exit(1);
}
if (senha.length < 6 || senha !== confirmacao) {
  console.error(
    senha.length < 6 ? "A senha precisa ter pelo menos 6 caracteres." : "As senhas não conferem.",
  );
  process.exit(1);
}

const cliente = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await cliente.connect();
  const r = await cliente.query(
    `INSERT INTO "sam_admins" ("id", "email", "senha_hash") VALUES ($1, $2, $3)
     ON CONFLICT ("email") DO UPDATE SET "senha_hash" = EXCLUDED."senha_hash"
     RETURNING (xmax = 0) AS criado`,
    [randomUUID(), email, hashSenha(senha)],
  );
  // Troca de senha derruba as sessões abertas desse admin.
  if (!r.rows[0].criado) {
    await cliente.query(
      `DELETE FROM "sam_sessoes" WHERE "admin_id" = (SELECT "id" FROM "sam_admins" WHERE "email" = $1)`,
      [email],
    );
  }
  console.log(r.rows[0].criado ? `Admin ${email} criado.` : `Senha de ${email} atualizada.`);
} catch (error) {
  const codigo = error && typeof error === "object" && "code" in error ? error.code : "";
  console.error(
    codigo === "42P01"
      ? "A tabela sam_admins não existe. Rode antes: npm run db:migrar"
      : `Não foi possível gravar no banco${codigo ? ` (código ${codigo})` : ""}.`,
  );
  process.exitCode = 1;
} finally {
  await cliente.end().catch(() => {});
}
