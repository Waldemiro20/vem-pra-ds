import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download, FileJson, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Cadastros — Jornada EEEP" },
      { name: "description", content: "Área restrita para baixar os cadastros da Jornada EEEP." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const [senha, setSenha] = useState("");
  const [msg, setMsg] = useState("");
  const [baixando, setBaixando] = useState(false);

  async function baixar(formato: "csv" | "json") {
    setMsg("");
    setBaixando(true);
    try {
      const r = await fetch(`/api/exportar?formato=${formato}`, { headers: { "x-senha": senha } });
      if (!r.ok) {
        setMsg(await r.text());
        return;
      }
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = `cadastros.${formato}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setMsg("Não foi possível baixar. Tente novamente.");
    } finally {
      setBaixando(false);
    }
  }

  const botao =
    "flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold text-white transition hover:brightness-110 disabled:opacity-60";

  return (
    <main className="bg-grid flex min-h-screen items-center justify-center bg-[#1e1338] px-5 font-sans text-white">
      <div className="w-full max-w-sm rounded-3xl border border-[#a855f7]/50 bg-[#3a2668]/85 p-8 shadow-glow">
        <p className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#d8b4fe]">Área restrita</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold">Baixar cadastros</h1>

        <label htmlFor="senha" className="mt-6 block text-sm font-bold">
          Senha
        </label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-white/10 px-4 text-white outline-none focus:border-[#c084fc] focus:ring-4 focus:ring-[#a855f7]/30"
        />

        <div className="mt-6 space-y-3">
          <button
            disabled={!senha || baixando}
            onClick={() => baixar("csv")}
            className={`${botao} bg-gradient-to-r from-[#7c3aed] to-[#a855f7]`}
          >
            <FileSpreadsheet className="h-5 w-5" /> Baixar planilha (Excel / CSV)
          </button>
          <button
            disabled={!senha || baixando}
            onClick={() => baixar("json")}
            className={`${botao} border border-white/20 bg-white/10`}
          >
            <FileJson className="h-5 w-5" /> Baixar JSON
          </button>
        </div>

        {baixando && (
          <p className="mt-4 flex items-center gap-2 text-sm text-white/80">
            <Download className="h-4 w-4" /> Preparando arquivo...
          </p>
        )}
        {msg && <p className="mt-4 text-sm font-medium text-red-300">{msg}</p>}
      </div>
    </main>
  );
}
