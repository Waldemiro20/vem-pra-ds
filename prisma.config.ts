import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// A DATABASE_URL fica no .env.local (fora do Git). Nunca coloque no .env, que vai para o GitHub.
config({ path: [".env.local", ".env"], quiet: true });

// DATABASE_URL: string de conexão do Supabase (Project Settings → Database → Connection string,
// opção "Session pooler"). Fica no .env.local (seu PC) e nas Environment Variables da Vercel.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env["DATABASE_URL"] ?? "" },
});
