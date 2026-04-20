import {
	buildWhatsAppOrderUrl,
	CART_STORAGE_KEY,
	normalizeWhatsAppPhone,
	type CartLine,
} from "../lib/cart";
import { formatPrice } from "../data/products";
import {
	clearCart,
	getCart,
	removeLine,
	setLineQty,
} from "./cart-client";

let waPhone = "";

function esc(s: string): string {
	const d = document.createElement("div");
	d.textContent = s;
	return d.innerHTML;
}

function getEls() {
	return {
		root: document.getElementById("cart-drawer-root"),
		backdrop: document.getElementById("cart-drawer-backdrop"),
		panel: document.getElementById("cart-drawer-panel"),
		empty: document.getElementById("cart-drawer-empty"),
		content: document.getElementById("cart-drawer-content"),
		list: document.getElementById("cart-drawer-lines"),
		total: document.getElementById("cart-drawer-total"),
		btnWa: document.getElementById("cart-drawer-wa") as HTMLButtonElement | null,
		btnClear: document.getElementById("cart-drawer-clear"),
		waHint: document.getElementById("cart-drawer-wa-hint"),
		closeBtn: document.getElementById("cart-drawer-close"),
	} as const;
}

function render(): void {
	const { empty, content, list, total, btnWa, waHint } = getEls();
	if (!empty || !content || !list || !total) return;

	const lines = getCart();

	if (lines.length === 0) {
		empty.classList.remove("hidden");
		content.classList.add("hidden");
		list.innerHTML = "";
		return;
	}

	empty.classList.add("hidden");
	content.classList.remove("hidden");

	const sum = lines.reduce((s, l) => s + l.price * l.qty, 0);
	total.textContent = formatPrice(sum);

	list.innerHTML = lines
		.map((line: CartLine) => {
			const sub = line.price * line.qty;
			return `
<li class="flex gap-3 px-5 py-4">
	<div class="min-w-0 flex-1">
		<p class="font-display text-base font-semibold text-violet-deep leading-snug">${esc(line.name)}</p>
		<p class="mt-1 text-xs text-ink-muted">${esc(formatPrice(line.price))}${line.qty > 1 ? ` × ${line.qty} = ${esc(formatPrice(sub))}` : ""}</p>
	</div>
	<div class="flex shrink-0 flex-col items-end gap-2">
		<div class="flex items-center rounded-sm border border-ink/15 bg-cream/50">
			<button type="button" class="cart-qty-minus px-2.5 py-1.5 text-base leading-none text-violet-deep hover:bg-white" data-slug="${esc(line.slug)}" aria-label="Menos">−</button>
			<span class="min-w-[1.75rem] text-center text-sm font-medium">${line.qty}</span>
			<button type="button" class="cart-qty-plus px-2.5 py-1.5 text-base leading-none text-violet-deep hover:bg-white" data-slug="${esc(line.slug)}" aria-label="Mais">+</button>
		</div>
		<button type="button" class="cart-remove text-xs font-medium text-ink-muted underline-offset-2 hover:text-violet-deep hover:underline" data-slug="${esc(line.slug)}">Remover</button>
	</div>
</li>`;
		})
		.join("");

	if (btnWa) {
		btnWa.disabled = !waPhone;
		btnWa.classList.toggle("opacity-50", !waPhone);
		btnWa.classList.toggle("cursor-not-allowed", !waPhone);
	}
	if (waHint) {
		waHint.classList.toggle("hidden", !!waPhone);
	}
}

let lastFocus: HTMLElement | null = null;

export function closeCartDrawer(): void {
	const { root, backdrop, panel } = getEls();
	if (!root || !backdrop || !panel) return;

	document.body.classList.remove("overflow-hidden");
	root.setAttribute("aria-hidden", "true");
	root.classList.add("pointer-events-none");
	backdrop.classList.remove("opacity-100");
	backdrop.classList.add("opacity-0", "pointer-events-none");
	panel.classList.add("translate-x-full");

	document.getElementById("cart-link")?.setAttribute("aria-expanded", "false");

	lastFocus?.focus();
	lastFocus = null;
}

export function openCartDrawer(): void {
	const { root, backdrop, panel, closeBtn } = getEls();
	if (!root || !backdrop || !panel) return;

	lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

	document.body.classList.add("overflow-hidden");
	document.getElementById("cart-link")?.setAttribute("aria-expanded", "true");

	root.setAttribute("aria-hidden", "false");
	root.classList.remove("pointer-events-none");
	backdrop.classList.remove("opacity-0", "pointer-events-none");
	backdrop.classList.add("opacity-100");
	panel.classList.remove("translate-x-full");

	closeBtn?.focus();
	render();
}

function onBackdropPointerDown(e: PointerEvent): void {
	const target = e.target;
	if (target instanceof Element && target.id === "cart-drawer-backdrop") {
		closeCartDrawer();
	}
}

let bound = false;

export function initCartDrawer(): void {
	if (bound || typeof window === "undefined") return;
	bound = true;

	waPhone = normalizeWhatsAppPhone(import.meta.env.PUBLIC_WHATSAPP_NUMBER ?? "");

	const { root, backdrop, closeBtn, list, btnClear, btnWa } = getEls();

	document.getElementById("cart-link")?.addEventListener("click", (e) => {
		e.preventDefault();
		openCartDrawer();
	});

	closeBtn?.addEventListener("click", () => closeCartDrawer());

	backdrop?.addEventListener("pointerdown", onBackdropPointerDown);

	window.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && root?.getAttribute("aria-hidden") === "false") {
			e.preventDefault();
			closeCartDrawer();
		}
	});

	list?.addEventListener("click", (e) => {
		const t = e.target;
		if (!(t instanceof Element)) return;
		const minus = t.closest(".cart-qty-minus");
		const plus = t.closest(".cart-qty-plus");
		const rem = t.closest(".cart-remove");
		const slug =
			minus?.getAttribute("data-slug") ??
			plus?.getAttribute("data-slug") ??
			rem?.getAttribute("data-slug");
		if (!slug) return;
		const line = getCart().find((l) => l.slug === slug);
		if (!line) return;
		if (minus) setLineQty(slug, line.qty - 1);
		else if (plus) setLineQty(slug, line.qty + 1);
		else if (rem) removeLine(slug);
		render();
	});

	btnClear?.addEventListener("click", () => {
		clearCart();
		render();
	});

	btnWa?.addEventListener("click", () => {
		const lines = getCart();
		if (!lines.length || !waPhone) return;
		window.location.href = buildWhatsAppOrderUrl(waPhone, lines);
	});

	window.addEventListener("violeta-cart", render);
	window.addEventListener("storage", (ev) => {
		if (ev.key === CART_STORAGE_KEY) render();
	});

	render();
}
