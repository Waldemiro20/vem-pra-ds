import { z } from "zod";

export const cadastroSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome ou apelido").max(120),
  whatsapp: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Informe um WhatsApp completo"),
  localidade: z.string().trim().min(2, "Informe sua localidade").max(120),
});

export type CadastroForm = z.infer<typeof cadastroSchema>;

// Como um cadastro chega ao painel /admin (datas em ISO).
export type CadastroAdmin = {
  id: string;
  data: string;
  nome: string;
  whatsapp: string;
  localidade: string;
  enviadoEm: string | null;
};
