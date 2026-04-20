import { formatPrice } from "../data/products";

export const CART_STORAGE_KEY = "violeta-cart-v1";

/** Limite seguro para o tamanho total da URL (wa.me + ?text=…). */
export const WHATSAPP_URL_MAX_LENGTH = 2000;

export interface CartLine {
	slug: string;
	name: string;
	price: number;
	qty: number;
}

export function normalizeWhatsAppPhone(raw: string): string {
	return raw.replace(/\D/g, "");
}

/** Preço curto para WhatsApp: "R$19,90". */
export function formatPriceCompact(value: number): string {
	return `R$${value.toLocaleString("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function truncateName(s: string, max: number): string {
	const t = s.trim();
	if (t.length <= max) return t;
	return `${t.slice(0, Math.max(0, max - 1))}…`;
}

export function orderLineText(line: CartLine): string {
	const sub = line.price * line.qty;
	if (line.qty <= 1) {
		return `${line.name} — ${formatPrice(line.price)}`;
	}
	return `${line.name} — ${formatPrice(line.price)} × ${line.qty} = ${formatPrice(sub)}`;
}

function lineWhatsAppCompact(line: CartLine, maxName: number): string {
	const sub = line.price * line.qty;
	const nm = truncateName(line.name, maxName);
	if (line.qty <= 1) {
		return `• ${nm} ${formatPriceCompact(sub)}`;
	}
	return `• ${line.qty}× ${nm} ${formatPriceCompact(sub)}`;
}

function totalUrlLength(phone: string, text: string): number {
	const base = `https://wa.me/${phone}?text=`;
	return base.length + encodeURIComponent(text).length;
}

function assembleBody(lines: CartLine[], maxName: number): string {
	return lines.map((l) => lineWhatsAppCompact(l, maxName)).join("\n");
}

/**
 * Mensagem de pedido para WhatsApp: compacta e ajustada ao limite da URL no navegador.
 */
export function buildWhatsAppOrderText(
	lines: CartLine[],
	phoneForLengthCheck = "5511999999999",
): string {
	if (!lines.length) return "*Pedido Violeta*\n(vazio)";

	const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
	const footer = `\n*Total ${formatPriceCompact(total)}*`;

	for (let maxName = 48; maxName >= 10; maxName -= 6) {
		const body = assembleBody(lines, maxName);
		const text = `*Pedido Violeta*\n${body}${footer}`;
		if (totalUrlLength(phoneForLengthCheck, text) <= WHATSAPP_URL_MAX_LENGTH) {
			return text;
		}
	}

	// Encurta nomes ao máximo e ainda estourou: mostra só o começo da lista + “+N itens”.
	const header = "*Pedido Violeta*\n";
	for (let count = lines.length; count >= 1; count--) {
		const subset = lines.slice(0, count);
		let body = assembleBody(subset, 10);
		const rest = lines.length - count;
		if (rest > 0) {
			body += `\n• …+${rest} ${rest === 1 ? "item" : "itens"}`;
		}
		const text = `${header}${body}${footer}`;
		if (totalUrlLength(phoneForLengthCheck, text) <= WHATSAPP_URL_MAX_LENGTH) {
			return text;
		}
	}

	const n = lines.length;
	return `*Pedido Violeta*\n${n} ${n === 1 ? "item" : "itens"}\n*Total ${formatPriceCompact(total)}*`;
}

/**
 * URL wa.me com `text` recalculado usando o número real (comprimento da URL).
 */
export function buildWhatsAppOrderUrl(phone: string, lines: CartLine[]): string {
	const digits = normalizeWhatsAppPhone(phone);
	const placeholder = digits.length >= 10 ? digits : "5511999999999";
	let text = buildWhatsAppOrderText(lines, placeholder);
	if (digits.length >= 10 && totalUrlLength(digits, text) > WHATSAPP_URL_MAX_LENGTH) {
		text = buildWhatsAppOrderText(lines, digits);
	}
	return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
