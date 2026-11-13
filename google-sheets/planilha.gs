// Cole este código em: Planilha do Google → Extensões → Apps Script.
// Troque o TOKEN abaixo por uma senha sua (a mesma do secret GOOGLE_SHEETS_TOKEN no Lovable).
const TOKEN = "TROQUE-ESTA-SENHA";

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  if (d.token !== TOKEN) return resposta({ ok: false, erro: "token inválido" });

  const aba = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (aba.getLastRow() === 0) {
    aba.appendRow(["Data do cadastro", "Nome", "WhatsApp", "Localidade"]);
    aba.getRange(1, 1, 1, 4).setFontWeight("bold");
    aba.setFrozenRows(1);
  }

  // O apóstrofo impede que o texto vire fórmula (ex.: um nome começando com "=").
  const texto = (v) => "'" + String(v || "").slice(0, 120);
  aba.appendRow([new Date(), texto(d.nome), texto(d.whatsapp), texto(d.localidade)]);
  return resposta({ ok: true });
}

function resposta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
