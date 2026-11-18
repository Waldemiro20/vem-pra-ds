# Vem pra DS — Jornada EEEP

Landing page de cadastro do curso de Desenvolvimento de Sistemas + painel de super admin
(`/admin`) com os cadastros em tempo real e botão para mandar o convite pelo WhatsApp.

**Stack:** Next.js 16 (App Router) · Tailwind CSS 4 · Prisma 7 · Supabase (Postgres) · Vercel.

## Como rodar no seu PC

1. Crie o arquivo `.env.local` (ele **não** vai para o GitHub) com a conexão do seu Supabase:
   ```
   DATABASE_URL="postgresql://postgres.SEU-PROJETO:SUA-SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres"
   ```
   Onde pegar: supabase.com/dashboard → seu projeto → **Connect** → Connection string.
2. Instale, crie as tabelas e o seu admin:
   ```
   npm install
   npm run db:migrar
   npm run admin:criar
   ```
3. Rode `npm run dev` e abra http://localhost:3000 (painel em http://localhost:3000/admin).

## Deploy na Vercel

- **Environment Variables:** só `DATABASE_URL` (a mesma do `.env.local`).
- O build roda `prisma generate` sozinho (no `npm install`).

## Comandos

| Comando | O que faz |
|---|---|
| `npm run dev` | Site em modo desenvolvimento |
| `npm run build` / `npm start` | Build e servidor de produção |
| `npm run db:migrar` | Cria/atualiza as tabelas no banco |
| `npm run admin:criar` | Cria um admin ou troca a senha (pede e-mail e senha) |
| `npm test` / `npm run lint` | Testes e verificação de código |

## Onde fica cada coisa

- `src/app/page.tsx` + `src/components/landing.tsx` — landing page
- `src/app/admin/page.tsx` + `src/components/painel-admin.tsx` — painel `/admin`
- `src/app/actions.ts` — Server Actions (salvar cadastro, login, listar, marcar enviado)
- `src/app/api/exportar/route.ts` — download CSV/JSON (exige login)
- `src/lib/whatsapp.ts` — texto do convite e link do jogo
- `prisma/schema.prisma` — tabelas `sam_cadastros`, `sam_admins`, `sam_sessoes`

---

## Briefing original


Crie uma landing page moderna, responsiva (mobile-first) e de alta conversão com foco total na captura de cadastro.

1. Destaque Principal (Hero Section):

- Exiba o título **"Vem ser DS"** em fonte bem grande, ousada e com máximo destaque logo na primeira dobra da página.

- Abaixo do título, coloque uma frase curta convidando o visitante a preencher os dados para dar o próximo passo.

2. Formulário (somente 3 campos):

Crie um card centralizado com visual limpo e alto contraste contendo exclusivamente os seguintes campos obrigatórios:

- **Nome**: campo de texto para o nome completo.

- **WhatsApp**: campo com máscara de telefone brasileiro `(00) 00000-0000`.

- **Localidade**: campo de texto para cidade e estado (ex.: Cidade - UF).

- **Botão de ação**: botão grande e chamativo com o texto "Quero ser DS".

3. Regras e Comportamento:

- Não inclua nenhum outro campo além de Nome, WhatsApp e Localidade.

- Adicione validação para impedir o envio com campos vazios ou WhatsApp incompleto.

- Após o envio, substitua o formulário por uma mensagem de confirmação agradecendo o cadastro e informando que a equipe entrará em contato pelo WhatsApp.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/dd7e552b-1134-4ad7-875b-c2184bb08736).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
