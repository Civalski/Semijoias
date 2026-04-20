import { CART_STORAGE_KEY, type CartLine } from "../lib/cart";

function parseCartLine(x: unknown): CartLine | null {
	if (x === null || typeof x !== "object") return null;
	const o = x as Record<string, unknown>;
	const slug = o.slug;
	const name = o.name;
	if (typeof slug !== "string" || !slug) return null;
	if (typeof name !== "string" || !name) return null;
	const price = typeof o.price === "number" ? o.price : Number(o.price);
	const qty = typeof o.qty === "number" ? o.qty : Number(o.qty);
	if (!Number.isFinite(price) || price < 0) return null;
	if (!Number.isFinite(qty) || qty < 1) return null;
	return { slug, name, price, qty: Math.floor(qty) };
}

function read(): CartLine[] {
	try {
		const raw = localStorage.getItem(CART_STORAGE_KEY);
		if (!raw) return [];
		const data = JSON.parse(raw) as unknown;
		if (!Array.isArray(data)) return [];
		return data
			.map(parseCartLine)
			.filter((l): l is CartLine => l !== null);
	} catch {
		return [];
	}
}

function persist(lines: CartLine[]): void {
	localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
	window.dispatchEvent(new CustomEvent("violeta-cart"));
}

export function getCart(): CartLine[] {
	return read();
}

export function cartItemCount(lines: CartLine[]): number {
	return lines.reduce((s, l) => s + l.qty, 0);
}

export function addToCart(
	slug: string,
	name: string,
	price: number,
	qty = 1,
): void {
	if (!slug || !name || !Number.isFinite(price) || price < 0 || qty < 1) return;
	const lines = read();
	const idx = lines.findIndex((l) => l.slug === slug);
	if (idx >= 0) lines[idx].qty += qty;
	else lines.push({ slug, name, price, qty });
	persist(lines);
}

export function setLineQty(slug: string, qty: number): void {
	const lines = read();
	const idx = lines.findIndex((l) => l.slug === slug);
	if (idx < 0) return;
	if (qty < 1) {
		lines.splice(idx, 1);
	} else {
		lines[idx].qty = qty;
	}
	persist(lines);
}

export function removeLine(slug: string): void {
	persist(read().filter((l) => l.slug !== slug));
}

export function clearCart(): void {
	persist([]);
}

export function syncCartBadge(): void {
	const n = cartItemCount(getCart());
	const el = document.getElementById("cart-count");
	const link = document.getElementById("cart-link");
	if (el) {
		el.textContent = String(n);
		el.classList.toggle("hidden", n === 0);
	}
	if (link) {
		link.setAttribute(
			"aria-label",
			n > 0 ? `Carrinho, ${n} ${n === 1 ? "item" : "itens"}` : "Carrinho",
		);
	}
}
