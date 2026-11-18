import type { Metadata } from "next";
import { PainelAdmin } from "@/components/painel-admin";

// Área restrita: não aparece em buscadores nem tem link na landing (só digitando /admin).
export const metadata: Metadata = {
  title: "Painel — Jornada EEEP",
  description: "Área restrita.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PainelAdmin />;
}
