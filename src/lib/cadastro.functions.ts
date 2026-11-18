import { createServerFn } from "@tanstack/react-start";
import { cadastroSchema } from "./cadastro";
import { db, registrarFalha } from "./db.server";

// Salva o cadastro da landing page na tabela sam_cadastros (Supabase, via Prisma).
export const salvarCadastro = createServerFn({ method: "POST" })
  .validator(cadastroSchema)
  .handler(async ({ data }) => {
    try {
      await db().cadastro.create({ data });
      return { ok: true as const };
    } catch (error) {
      // Nunca registre os dados da pessoa nem a mensagem bruta do banco.
      registrarFalha("cadastro", error);
      return { ok: false as const };
    }
  });
