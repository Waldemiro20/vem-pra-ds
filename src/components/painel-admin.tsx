"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  CheckCircle2,
  Download,
  LogOut,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import {
  entrarAdmin,
  listarCadastrosAdmin,
  marcarEnviadoAdmin,
  sairAdmin,
  verSessaoAdmin,
} from "@/app/actions";
import { linkWhatsapp, mensagemConvite } from "@/lib/whatsapp";
import type { CadastroAdmin } from "@/lib/cadastro";

const ATUALIZAR_A_CADA_MS = 5_000;

export function PainelAdmin() {
  const sessao = useQuery({ queryKey: ["admin-sessao"], queryFn: () => verSessaoAdmin() });

  return (
    <main className="bg-grid min-h-screen bg-[#1e1338] px-4 py-8 font-sans text-white">
      {sessao.isPending ? (
        <p className="mt-24 text-center text-white/70">Carregando...</p>
      ) : sessao.data?.autenticado ? (
        <Painel />
      ) : (
        <Login />
      )}
    </main>
  );
}

const campo =
  "mt-2 h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-white outline-none focus:border-[#c084fc] focus:ring-4 focus:ring-[#a855f7]/30";

function Login() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    try {
      const r = await entrarAdmin({ email, senha });
      if (r.ok) await qc.invalidateQueries({ queryKey: ["admin-sessao"] });
      else setErro(r.erro);
    } catch {
      setErro("Confira o e-mail e a senha e tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mx-auto mt-16 w-full max-w-sm rounded-3xl border border-[#a855f7]/50 bg-[#3a2668]/85 p-8 shadow-glow"
    >
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8b4fe]">
        Área restrita
      </p>
      <h1 className="mt-2 font-display text-2xl font-extrabold">Painel do administrador</h1>

      <label htmlFor="email" className="mt-6 block text-sm font-bold">
        E-mail
      </label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className={campo}
      />

      <label htmlFor="senha" className="mt-4 block text-sm font-bold">
        Senha
      </label>
      <input
        id="senha"
        type="password"
        autoComplete="current-password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        className={campo}
      />

      <button
        disabled={!email || !senha || enviando}
        className="mt-6 flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#a855f7] font-bold transition hover:brightness-110 disabled:opacity-60"
      >
        {enviando ? "Entrando..." : "Entrar"}
      </button>
      {erro && <p className="mt-4 text-sm font-medium text-red-300">{erro}</p>}
    </form>
  );
}

function dataBR(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
}

function Painel() {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "pendentes" | "enviados">("todos");
  // Linhas que já estavam na tela no primeiro carregamento; as que chegarem depois ganham o selo "Novo".
  const [vistas, setVistas] = useState<Set<string> | null>(null);

  const lista = useQuery({
    queryKey: ["admin-cadastros"],
    queryFn: async () => {
      const r = await listarCadastrosAdmin();
      if (!r.ok && r.erro === "nao_autenticado")
        await qc.invalidateQueries({ queryKey: ["admin-sessao"] });
      return r;
    },
    refetchInterval: ATUALIZAR_A_CADA_MS,
    refetchIntervalInBackground: true,
  });

  const marcarEnviado = useMutation({
    mutationFn: (c: CadastroAdmin) => marcarEnviadoAdmin({ id: c.id }),
    onMutate: (c) => {
      qc.setQueryData(["admin-cadastros"], (antigo: typeof lista.data) =>
        antigo?.ok
          ? {
              ...antigo,
              cadastros: antigo.cadastros.map((x) =>
                x.id === c.id ? { ...x, enviadoEm: new Date().toISOString() } : x,
              ),
            }
          : antigo,
      );
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin-cadastros"] }),
  });

  async function sairDoPainel() {
    await sairAdmin();
    qc.removeQueries({ queryKey: ["admin-cadastros"] });
    await qc.invalidateQueries({ queryKey: ["admin-sessao"] });
  }

  const cadastros = lista.data?.ok ? lista.data.cadastros : [];
  // Ajuste de estado durante a renderização (padrão do React): roda uma vez, no 1º carregamento.
  if (lista.data?.ok && vistas === null) setVistas(new Set(cadastros.map((c) => c.id)));

  const enviados = cadastros.filter((c) => c.enviadoEm).length;
  const termo = busca.trim().toLowerCase();
  const visiveis = cadastros.filter((c) => {
    if (filtro === "pendentes" && c.enviadoEm) return false;
    if (filtro === "enviados" && !c.enviadoEm) return false;
    return !termo || `${c.nome} ${c.whatsapp} ${c.localidade}`.toLowerCase().includes(termo);
  });

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8b4fe]">
            Super admin
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">
            Cadastros em tempo real
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["csv", "json"] as const).map((f) => (
            <a
              key={f}
              href={`/api/exportar?formato=${f}`}
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
            >
              <Download className="h-4 w-4" /> {f === "csv" ? "Excel / CSV" : "JSON"}
            </a>
          ))}
          <button
            onClick={sairDoPainel}
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/15"
          >
            <LogOut className="h-4 w-4" /> Sair
          </button>
        </div>
      </header>

      <section className="mt-6 grid grid-cols-3 gap-3">
        {[
          { rotulo: "Cadastros", valor: cadastros.length },
          { rotulo: "Mensagens enviadas", valor: enviados },
          { rotulo: "Pendentes", valor: cadastros.length - enviados },
        ].map((s) => (
          <div key={s.rotulo} className="rounded-2xl border border-white/10 bg-[#3a2668]/70 p-4">
            <p className="text-xs text-white/70 sm:text-sm">{s.rotulo}</p>
            <p className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{s.valor}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-60">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, WhatsApp ou localidade"
            className="h-11 w-full rounded-xl border border-white/15 bg-white/10 pl-9 pr-3 text-sm outline-none focus:border-[#c084fc]"
          />
        </div>
        <div className="flex rounded-xl border border-white/15 bg-white/5 p-1 text-sm">
          {(["todos", "pendentes", "enviados"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-lg px-3 py-1.5 font-bold capitalize ${filtro === f ? "bg-[#7c3aed]" : "text-white/70"}`}
            >
              {f}
            </button>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-white/60">
          <RefreshCw className={`h-3.5 w-3.5 ${lista.isFetching ? "animate-spin" : ""}`} />
          Atualiza a cada {ATUALIZAR_A_CADA_MS / 1000}s
        </p>
      </section>

      {lista.data && !lista.data.ok && lista.data.erro === "armazenamento" && (
        <p className="mt-6 rounded-xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
          Não foi possível ler os dados agora. Tentando de novo automaticamente...
        </p>
      )}

      <ul className="mt-6 space-y-3">
        {lista.isPending && <li className="text-white/70">Carregando cadastros...</li>}
        {lista.data?.ok && visiveis.length === 0 && (
          <li className="text-white/70">Nenhum cadastro encontrado.</li>
        )}
        {visiveis.map((c) => {
          const link = linkWhatsapp(c.whatsapp, mensagemConvite(c.nome));
          const novo = vistas !== null && !vistas.has(c.id);
          return (
            <li
              key={c.id}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-[#3a2668]/70 p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#7c3aed]/40 font-display text-lg font-extrabold">
                {c.nome.trim().charAt(0).toUpperCase() || <Users className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1 basis-48">
                <p className="flex items-center gap-2 truncate font-bold">
                  {c.nome}
                  {novo && (
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">
                      Novo
                    </span>
                  )}
                </p>
                <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/70">
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {c.whatsapp}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {c.localidade}
                  </span>
                </p>
                <p className="mt-1 text-xs text-white/50">Cadastrado em {dataBR(c.data)}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => !c.enviadoEm && marcarEnviado.mutate(c)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition hover:brightness-110 ${
                      c.enviadoEm
                        ? "border border-white/20 bg-white/10"
                        : "bg-[#25D366] text-[#073b1c]"
                    }`}
                  >
                    <MessageCircle className="h-4 w-4" />{" "}
                    {c.enviadoEm ? "Enviar de novo" : "Enviar mensagem"}
                  </a>
                ) : (
                  <span className="text-xs text-red-300">WhatsApp inválido</span>
                )}
                {c.enviadoEm && (
                  <span className="flex items-center gap-1 text-xs text-emerald-300">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Enviado em {dataBR(c.enviadoEm)}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
