import { z } from "zod";
import type { CadastroForm } from "./cadastro";

// Todos os dados do site ficam num único arquivo JSON:
//   bucket privado "sam-dados" do Supabase Storage → dados.json
// (o Cloudflare Worker não tem disco, então o arquivo precisa morar num serviço de arquivos).
//
// Formato do arquivo:
// {
//   "versao": 1,
//   "admin": { "email": "...", "senhaHash": "pbkdf2-sha256$..." },
//   "segredoSessao": "...",            ← assina o cookie de login; troque para derrubar sessões
//   "cadastros": [ { "id", "data", "nome", "whatsapp", "localidade", "enviadoEm" } ]
// }

export const BUCKET = "sam-dados";
export const ARQUIVO = "dados.json";

// Super admin inicial: usado só quando o dados.json ainda não existe.
// A senha não fica no código, só o hash (veja src/lib/senha.server.ts).
export const ADMIN_INICIAL = {
  email: "carloswaldemiro85@gmail.com",
  senhaHash:
    "pbkdf2-sha256$50000$gJNSLablCCm0_Eq8nJ8MRg$oncLm9PwmgOTCCV_zTJWD1XdZedgHpZ9CyN8wUctA1Q",
};

const cadastroSalvoSchema = z.object({
  id: z.string(),
  data: z.string(),
  nome: z.string(),
  whatsapp: z.string(),
  localidade: z.string(),
  enviadoEm: z.string().nullable(),
});
export type CadastroSalvo = z.infer<typeof cadastroSalvoSchema>;

const dadosSchema = z.object({
  versao: z.literal(1),
  admin: z.object({ email: z.string(), senhaHash: z.string() }),
  segredoSessao: z.string().min(32),
  cadastros: z.array(cadastroSalvoSchema),
});
export type Dados = z.infer<typeof dadosSchema>;

// O que o armazenamento precisa saber fazer (Supabase Storage em produção, memória nos testes).
export type Armazenamento = {
  /** Texto do arquivo, ou null se ele ainda não existe. Lança erro em qualquer outra falha. */
  ler(): Promise<string | null>;
  gravar(texto: string): Promise<void>;
  /** Cadastros que já existiam antes do JSON (migração única); [] se não houver. */
  cadastrosAntigos?(): Promise<CadastroSalvo[]>;
};

function segredoAleatorio() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

export async function lerDados(arm: Armazenamento): Promise<Dados> {
  const texto = await arm.ler();
  if (texto !== null) return dadosSchema.parse(JSON.parse(texto));

  const iniciais: Dados = {
    versao: 1,
    admin: { ...ADMIN_INICIAL },
    segredoSessao: segredoAleatorio(),
    cadastros: (await arm.cadastrosAntigos?.()) ?? [],
  };
  await arm.gravar(JSON.stringify(iniciais, null, 2));
  return iniciais;
}

// Lê → altera → grava → relê para confirmar. Se outra requisição gravou ao mesmo tempo
// e a alteração se perdeu, repete (o Storage não tem gravação condicional).
export async function alterarDados(
  arm: Armazenamento,
  alterar: (d: Dados) => void,
  confirmar: (d: Dados) => boolean,
  tentativas = 4,
) {
  for (let i = 0; i < tentativas; i++) {
    const dados = await lerDados(arm);
    if (confirmar(dados)) return;
    alterar(dados);
    await arm.gravar(JSON.stringify(dados, null, 2));
    if (confirmar(await lerDados(arm))) return;
  }
  throw new Error("gravacao_nao_confirmada");
}

export function novoCadastro(form: CadastroForm, agora = new Date()): CadastroSalvo {
  return {
    id: crypto.randomUUID(),
    data: agora.toISOString(),
    nome: form.nome,
    whatsapp: form.whatsapp,
    localidade: form.localidade,
    enviadoEm: null,
  };
}

// --- Supabase Storage ---------------------------------------------------------------------

export async function armazenamentoSupabase(): Promise<Armazenamento> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const storage = supabaseAdmin.storage;

  return {
    async ler() {
      const { data, error } = await storage.from(BUCKET).download(ARQUIVO);
      if (!error) return await data.text();

      // Só considera "não existe" depois de confirmar pela listagem — nunca sobrescreve por engano.
      const lista = await storage.from(BUCKET).list("", { search: ARQUIVO });
      if (lista.error) {
        const bucket = await storage.getBucket(BUCKET);
        if (bucket.data) throw new Error("storage_indisponivel");
        const criado = await storage.createBucket(BUCKET, { public: false });
        if (criado.error) throw new Error("storage_bucket");
        return null;
      }
      if (!lista.data.some((f) => f.name === ARQUIVO)) return null;
      throw new Error("storage_leitura");
    },

    async gravar(texto) {
      const { error } = await storage.from(BUCKET).upload(ARQUIVO, texto, {
        upsert: true,
        contentType: "application/json; charset=utf-8",
        cacheControl: "0",
      });
      if (error) throw new Error("storage_gravacao");
    },

    async cadastrosAntigos() {
      const { data, error } = await supabaseAdmin
        .from("cadastros_ds")
        .select("nome, whatsapp, localidade, created_at")
        .order("created_at", { ascending: true });
      if (error || !data) return [];
      return data.map((l) => ({
        id: crypto.randomUUID(),
        data: l.created_at,
        nome: l.nome,
        whatsapp: l.whatsapp,
        localidade: l.localidade,
        enviadoEm: null,
      }));
    },
  };
}

export function motivoDoErro(error: unknown) {
  const m = error instanceof Error ? error.message : "";
  return /^(storage_|gravacao_)/.test(m)
    ? m
    : error instanceof z.ZodError
      ? "json_invalido"
      : "desconhecido";
}
