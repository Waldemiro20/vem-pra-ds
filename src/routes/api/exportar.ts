import { createFileRoute } from "@tanstack/react-router";
import { paraCsv } from "@/lib/exportar";
import { COOKIE_ADMIN } from "@/lib/admin-sessao.server";
import { listarCadastros, sessaoValida } from "@/lib/admin.server";
import { registrarFalha } from "@/lib/db.server";

function lerCookie(request: Request, nome: string) {
  for (const parte of (request.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

// GET /api/exportar?formato=csv|json — baixa os cadastros do banco; exige login no /admin.
export const Route = createFileRoute("/api/exportar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let cadastros;
        try {
          if (!(await sessaoValida(lerCookie(request, COOKIE_ADMIN)))) {
            return new Response("Entre no painel /admin primeiro.", { status: 401 });
          }
          cadastros = (await listarCadastros()).reverse();
        } catch (error) {
          registrarFalha("exportar", error);
          return new Response("Erro ao ler os cadastros.", { status: 500 });
        }

        const json = new URL(request.url).searchParams.get("formato") === "json";
        const corpo = json
          ? JSON.stringify(cadastros, null, 2)
          : paraCsv(cadastros.map((c) => ({ ...c, created_at: c.data })));
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
