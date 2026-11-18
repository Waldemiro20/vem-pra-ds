import { expect, test } from "vitest";
import { formatWhatsapp } from "@/lib/whatsapp";
test("mascara completa", () => expect(formatWhatsapp("11987654321")).toBe("(11) 98765-4321"));
test("limita a 11 dígitos", () =>
  expect(formatWhatsapp("119876543219999")).toBe("(11) 98765-4321"));

import { linkWhatsapp, mensagemConvite } from "@/lib/whatsapp";
test("link wa.me com DDI 55 e mensagem codificada", () => {
  const link = linkWhatsapp("(85) 99999-0000", mensagemConvite("Ana Maria"));
  expect(link).toMatch(/^https:\/\/wa\.me\/5585999990000\?text=/);
  expect(decodeURIComponent(link!.split("text=")[1]!)).toBe(
    "Olá, Ana! Comece sua jornada na SAM pelo curso de Desenvolvimento de Sistemas: https://jornada-dev.vercel.app",
  );
});
test("número incompleto não gera link", () => expect(linkWhatsapp("(85) 9999", "oi")).toBeNull());
