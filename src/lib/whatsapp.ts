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

// Links do WhatsApp sem API: abrem a conversa com a mensagem já escrita (o envio é com Enter).
// Números de 10/11 dígitos recebem o código do Brasil (55).
function numeroInternacional(whatsapp: string) {
  let numero = whatsapp.replace(/\D/g, "");
  if (numero.length === 10 || numero.length === 11) numero = `55${numero}`;
  return numero.length < 12 ? null : numero;
}

// Celular: wa.me abre o app do WhatsApp.
export function linkWhatsapp(whatsapp: string, mensagem: string) {
  const numero = numeroInternacional(whatsapp);
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}` : null;
}

// Computador: vai direto para a conversa no WhatsApp Web, sem a página intermediária do wa.me
// (que às vezes cai na tela de contatos, principalmente com o WhatsApp Web já aberto).
export function linkWhatsappWeb(whatsapp: string, mensagem: string) {
  const numero = numeroInternacional(whatsapp);
  return numero
    ? `https://web.whatsapp.com/send?phone=${numero}&text=${encodeURIComponent(mensagem)}`
    : null;
}

export function ehCelular(userAgent: string) {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}
