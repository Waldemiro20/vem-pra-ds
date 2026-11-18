// Cole este código em: Planilha do Google → Extensões → Apps Script.
// Troque o TOKEN abaixo por uma senha sua (a mesma do secret GOOGLE_SHEETS_TOKEN no Lovable).
// Depois de colar: Implantar → Gerenciar implantações → editar → "Nova versão" → Implantar.
//
// Login do painel /admin: crie uma aba chamada "Admin" com
//   A1: Email   B1: Senha
//   A2: (seu e-mail)   B2: (sua senha)
// (se a aba não existir, o script cria só o cabeçalho na primeira tentativa de login).
const TOKEN = "TROQUE-ESTA-SENHA";
const CABECALHO = ["Data do cadastro", "Nome", "WhatsApp", "Localidade", "Mensagem enviada"];

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.token !== TOKEN) return resposta({ ok: false, erro: "token inválido" });

  if (d.acao === "listar") return listar();
  if (d.acao === "login") return login(d.email, d.senha);
  if (d.acao === "marcar") return marcar(d.linha, d.whatsapp);
  return cadastrar(d);
}

function abaCadastros() {
  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (aba.getLastRow() === 0) {
    aba.appendRow(CABECALHO);
    aba.setFrozenRows(1);
  }
  if (aba.getRange(1, 5).getValue() === "") aba.getRange(1, 5).setValue(CABECALHO[4]);
  aba.getRange(1, 1, 1, CABECALHO.length).setFontWeight("bold");
  return aba;
}

// O apóstrofo impede que o texto vire fórmula (ex.: um nome começando com "=").
const texto = (v) => "'" + String(v || "").slice(0, 120);

function cadastrar(d) {
  abaCadastros().appendRow([new Date(), texto(d.nome), texto(d.whatsapp), texto(d.localidade), ""]);
  return resposta({ ok: true });
}

function listar() {
  const aba = abaCadastros();
  const total = aba.getLastRow() - 1;
  if (total <= 0) return resposta({ ok: true, cadastros: [] });

  const valores = aba.getRange(2, 1, total, 5).getValues();
  const cadastros = valores
    .map((l, i) => ({
      linha: i + 2,
      data: l[0] instanceof Date ? l[0].toISOString() : String(l[0] || ""),
      nome: String(l[1] || ""),
      whatsapp: String(l[2] || ""),
      localidade: String(l[3] || ""),
      enviadoEm: l[4] instanceof Date ? l[4].toISOString() : String(l[4] || ""),
    }))
    .filter((c) => c.nome || c.whatsapp);
  return resposta({ ok: true, cadastros: cadastros });
}

function login(email, senha) {
  const planilha = SpreadsheetApp.getActiveSpreadsheet();
  let aba = planilha.getSheetByName("Admin");
  if (!aba) {
    aba = planilha.insertSheet("Admin");
    aba.appendRow(["Email", "Senha"]);
    aba.getRange(1, 1, 1, 2).setFontWeight("bold");
  }
  if (aba.getLastRow() < 2) return resposta({ ok: true, autorizado: false });

  const linhas = aba.getRange(2, 1, aba.getLastRow() - 1, 2).getDisplayValues();
  const e = String(email || "").trim().toLowerCase();
  const autorizado = linhas.some(
    (l) => l[0].trim().toLowerCase() === e && e !== "" && l[1] !== "" && l[1] === String(senha || ""),
  );
  return resposta({ ok: true, autorizado: autorizado });
}

function marcar(linha, whatsapp) {
  const aba = abaCadastros();
  const n = Number(linha);
  if (!Number.isInteger(n) || n < 2 || n > aba.getLastRow()) return resposta({ ok: false, erro: "linha inválida" });
  // Confere o WhatsApp para não marcar a pessoa errada se a planilha tiver sido reordenada.
  if (String(aba.getRange(n, 3).getValue()) !== String(whatsapp)) {
    return resposta({ ok: false, erro: "linha mudou" });
  }
  aba.getRange(n, 5).setValue(new Date());
  return resposta({ ok: true });
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
