import { createFileRoute } from "@tanstack/react-router";
import { paraCsv, paraJson } from "@/lib/exportar";

// GET /api/exportar?formato=csv|json  — exige o header "x-senha" igual ao secret EXPORT_SENHA.
export const Route = createFileRoute("/api/exportar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const senhaCorreta = process.env["EXPORT_SENHA"];
        if (!senhaCorreta) {
          return new Response("Configure o secret EXPORT_SENHA no Lovable.", { status: 500 });
        }
        if (request.headers.get("x-senha") !== senhaCorreta) {
          return new Response("Senha incorreta.", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("cadastros_ds")
          .select("nome, whatsapp, localidade, created_at")
          .order("created_at", { ascending: true });
        if (error) {
          console.error(error);
          return new Response("Erro ao buscar os cadastros.", { status: 500 });
        }

        const formato = new URL(request.url).searchParams.get("formato");
        const json = formato === "json";
        return new Response(json ? paraJson(data) : paraCsv(data), {
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
