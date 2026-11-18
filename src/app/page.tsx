import type { Metadata } from "next";
import { Landing } from "@/components/landing";

export const metadata: Metadata = {
  title: "Jornada EEEP: O Desafio de Desenvolvimento de Sistemas",
  description: "Identifique-se e inicie sua Jornada EEEP no curso de Desenvolvimento de Sistemas.",
  openGraph: {
    title: "Jornada EEEP",
    description:
      "Identifique-se e inicie sua Jornada EEEP no curso de Desenvolvimento de Sistemas.",
    type: "website",
  },
};

export default function Page() {
  return <Landing />;
}
