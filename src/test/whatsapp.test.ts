import { expect, test } from "vitest";
import { formatWhatsapp } from "@/lib/whatsapp";
test("mascara completa", () => expect(formatWhatsapp("11987654321")).toBe("(11) 98765-4321"));
test("limita a 11 dígitos", () => expect(formatWhatsapp("119876543219999")).toBe("(11) 98765-4321"));
