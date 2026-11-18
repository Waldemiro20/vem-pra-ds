import { createServerFn } from "@tanstack/react-start";
import { cadastroSchema } from "./cadastro";
import { alterarDados, armazenamentoSupabase, motivoDoErro, novoCadastro } from "./dados.server";

// Salva o cadastro no dados.json (veja src/lib/dados.server.ts). Roda só no servidor.
export const salvarCadastro = createServerFn({ method: "POST" })
  .inputValidator(cadastroSchema)
  .handler(async ({ data }) => {
    const cadastro = novoCadastro(data);
    try {
      await alterarDados(
        await armazenamentoSupabase(),
        (d) => d.cadastros.push(cadastro),
        (d) => d.cadastros.some((c) => c.id === cadastro.id),
      );
      return { ok: true as const };
    } catch (error) {
      // Nunca registre os dados da pessoa nem respostas brutas do armazenamento.
      console.error(`[dados:cadastro] Falha: ${motivoDoErro(error)}.`);
      return { ok: false as const };
    }
  });
