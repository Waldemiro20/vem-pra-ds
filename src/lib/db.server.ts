import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Cliente Prisma do servidor (nunca importe isto em código do navegador).
// Usa só a variável DATABASE_URL — a mesma do prisma.config.ts.
let cliente: PrismaClient | undefined;

export function db() {
  if (!cliente) {
    const url = process.env["DATABASE_URL"];
    if (!url) throw new Error("db_configuracao");
    // Poucas conexões por instância: cada função da Vercel é uma instância separada.
    cliente = new PrismaClient({ adapter: new PrismaPg({ connectionString: url, max: 3 }) });
  }
  return cliente;
}

// Classifica a falha sem expor a URL, credenciais ou a mensagem bruta do banco.
export function motivoDoErro(error: unknown) {
  if (error instanceof Error && error.message === "db_configuracao") return "db_configuracao";
  const codigo = (error as { code?: unknown } | null)?.code;
  return typeof codigo === "string" && /^[A-Z0-9_]{2,12}$/.test(codigo)
    ? `db_${codigo}`
    : "db_indisponivel";
}

export function registrarFalha(contexto: string, error: unknown) {
  console.error(`[db:${contexto}] Falha: ${motivoDoErro(error)}.`);
}
