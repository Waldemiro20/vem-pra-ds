import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// A DATABASE_URL fica no .env.local (fora do Git). Nunca coloque no .env, que vai para o GitHub.
config({ path: [".env.local", ".env"], quiet: true });

// DATABASE_URL: string de conexão do Supabase (Project Settings → Database → Connection string,
// "Transaction pooler" ou "Session pooler"). Fica no .env.local (seu PC) e nas Environment Variables da Vercel.
// O site usa o "Transaction pooler" (porta 6543), mas criar/alterar tabelas exige o modo sessão.
// No Supabase é o mesmo endereço na porta 5432, então os comandos do Prisma trocam a porta sozinhos.
function urlParaMigracoes(url: string | undefined) {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".pooler.supabase.com") && u.port === "6543") u.port = "5432";
    return u.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: urlParaMigracoes(process.env["DATABASE_URL"]) },
});
