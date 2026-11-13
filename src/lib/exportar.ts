export type Cadastro = {
  nome: string;
  whatsapp: string;
  localidade: string;
  created_at: string;
};

// Evita que o Excel interprete um valor como fórmula (=, +, -, @).
function celula(v: string) {
  const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${seguro.replace(/"/g, '""')}"`;
}

function dataBR(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" });
}

// CSV com ";" e BOM para abrir certinho (com acentos) no Excel em português e no Google Planilhas.
export function paraCsv(linhas: Cadastro[]) {
  const cabecalho = ["Nome", "WhatsApp", "Localidade", "Data do cadastro"].map(celula).join(";");
  const corpo = linhas.map((l) =>
    [l.nome, l.whatsapp, l.localidade, dataBR(l.created_at)].map(celula).join(";"),
  );
  return "﻿" + [cabecalho, ...corpo].join("\r\n");
}

export function paraJson(linhas: Cadastro[]) {
  return JSON.stringify(linhas, null, 2);
}
