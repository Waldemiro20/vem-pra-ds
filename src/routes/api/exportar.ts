import { createFileRoute } from "@tanstack/react-router";
import { paraCsv } from "@/lib/exportar";
import { COOKIE_ADMIN, sessaoValida } from "@/lib/admin-sessao.server";
import { armazenamentoSupabase, lerDados, motivoDoErro } from "@/lib/dados.server";

function lerCookie(request: Request, nome: string) {
  for (const parte of (request.headers.get("cookie") ?? "").split(";")) {
    const [k, ...v] = parte.trim().split("=");
    if (k === nome) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

// GET /api/exportar?formato=csv|json — exige estar logado no painel /admin.
// formato=json devolve o dados.json com os cadastros (sem o login e o segredo do admin).
export const Route = createFileRoute("/api/exportar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let dados;
        try {
          dados = await lerDados(await armazenamentoSupabase());
        } catch (error) {
          console.error(`[dados:exportar] Falha: ${motivoDoErro(error)}.`);
          return new Response("Erro ao ler os cadastros.", { status: 500 });
        }
        if (!(await sessaoValida(lerCookie(request, COOKIE_ADMIN), dados.segredoSessao))) {
          return new Response("Entre no painel /admin primeiro.", { status: 401 });
        }

        const json = new URL(request.url).searchParams.get("formato") === "json";
        const corpo = json
          ? JSON.stringify(dados.cadastros, null, 2)
          : paraCsv(dados.cadastros.map((c) => ({ ...c, created_at: c.data })));
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
