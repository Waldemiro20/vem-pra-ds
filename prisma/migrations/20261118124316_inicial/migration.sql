-- CreateTable
CREATE TABLE "sam_cadastros" (
    "id" UUID NOT NULL,
    "nome" VARCHAR(120) NOT NULL,
    "whatsapp" VARCHAR(20) NOT NULL,
    "localidade" VARCHAR(120) NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mensagem_enviada_em" TIMESTAMPTZ(3),

    CONSTRAINT "sam_cadastros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_admins" (
    "id" UUID NOT NULL,
    "email" VARCHAR(200) NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sam_admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sam_sessoes" (
    "token_hash" TEXT NOT NULL,
    "admin_id" UUID NOT NULL,
    "expira_em" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sam_sessoes_pkey" PRIMARY KEY ("token_hash")
);

-- CreateIndex
CREATE INDEX "sam_cadastros_criado_em_idx" ON "sam_cadastros"("criado_em");

-- CreateIndex
CREATE UNIQUE INDEX "sam_admins_email_key" ON "sam_admins"("email");

-- CreateIndex
CREATE INDEX "sam_sessoes_expira_em_idx" ON "sam_sessoes"("expira_em");

-- AddForeignKey
ALTER TABLE "sam_sessoes" ADD CONSTRAINT "sam_sessoes_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "sam_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Segurança: liga o RLS sem nenhuma policy. A API pública do Supabase (chave anon) não lê nem
-- grava nada nestas tabelas; só o servidor do site, que conecta como dono do banco via DATABASE_URL.
ALTER TABLE "sam_cadastros" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sam_admins" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sam_sessoes" ENABLE ROW LEVEL SECURITY;

