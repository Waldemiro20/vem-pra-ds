import { describe, expect, it } from "vitest";
import { paraCsv, paraJson } from "@/lib/exportar";

const linha = { nome: 'Ana "Dev"', whatsapp: "(85) 99999-9999", localidade: "Aracoiaba", created_at: "2026-11-13T16:00:00Z" };

describe("exportar", () => {
  it("gera CSV com BOM, ; e aspas escapadas", () => {
    const csv = paraCsv([linha]);
    expect(csv.startsWith("﻿")).toBe(true);
    const [cab, l1] = csv.slice(1).split("\r\n");
    expect(cab).toBe('"Nome";"WhatsApp";"Localidade";"Data do cadastro"');
    expect(l1).toContain('"Ana ""Dev""";"(85) 99999-9999";"Aracoiaba";"13/11/2026');
  });

  it("neutraliza fórmulas no CSV", () => {
    expect(paraCsv([{ ...linha, nome: "=HYPERLINK(1)" }])).toContain(`"'=HYPERLINK(1)"`);
  });

  it("gera JSON", () => {
    expect(JSON.parse(paraJson([linha]))).toEqual([linha]);
  });
});
