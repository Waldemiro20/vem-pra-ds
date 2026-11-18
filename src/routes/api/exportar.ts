import { createFileRoute } from "@tanstack/react-router";
import { paraCsv } from "@/lib/exportar";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin-sessao.server";
import {
  configuracaoDoAmbiente,
  listarCadastrosDaPlanilha,
  registrarFalha,
} from "@/lib/planilha.server";

function lerCookie(request: Request, nome: string) {
  for (const parte of (request.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

// GET /api/exportar?formato=csv|json — baixa os cadastros da planilha; exige login no /admin.
export const Route = createFileRoute("/api/exportar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const segredo = process.env["GOOGLE_SHEETS_TOKEN"];
        if (!(await sessaoValida(lerCookie(request, COOKIE_ADMIN), segredo))) {
          return new Response("Entre no painel /admin primeiro.", { status: 401 });
        }

        const r = await listarCadastrosDaPlanilha(configuracaoDoAmbiente());
        if (!r.ok) {
          registrarFalha("exportar", r);
          return new Response("Erro ao ler a planilha.", { status: 502 });
        }

        const json = new URL(request.url).searchParams.get("formato") === "json";
        const corpo = json
          ? JSON.stringify(r.cadastros, null, 2)
          : paraCsv(r.cadastros.map((c) => ({ ...c, created_at: c.data })));
        return new Response(corpo, {
          headers: {
            "content-type": json ? "application/json; charset=utf-8" : "text/csv; charset=utf-8",
            "content-disposition": `attachment; filename="cadastros.${json ? "json" : "csv"}"`,
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
