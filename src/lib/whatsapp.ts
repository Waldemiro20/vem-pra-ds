export function formatWhatsapp(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const LINK_JOGO = "https://jornada-dev.vercel.app";

export function mensagemConvite(nome: string) {
  const primeiroNome = nome.trim().split(/\s+/)[0] ?? "";
  const saudacao = primeiroNome ? `Olá, ${primeiroNome}! ` : "Olá! ";
  return `${saudacao}Comece sua jornada na SAM pelo curso de Desenvolvimento de Sistemas: ${LINK_JOGO}`;
}

// Link "clique para conversar" do WhatsApp (sem API): abre a conversa com a mensagem já escrita.
// Números de 10/11 dígitos recebem o código do Brasil (55).
export function linkWhatsapp(whatsapp: string, mensagem: string) {
  let numero = whatsapp.replace(/\D/g, "");
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  if (numero.length < 12) return null;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}
