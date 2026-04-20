import { slugify, type Category, type Product } from "../data/products";

const CATEGORIES: Category[] = ["colares", "brincos", "pulseiras", "aneis"];

/**
 * Slug da URL: só a partir do nome (painel não envia slug). Garante não vazio e único;
 * slugs vazios virariam /produto/ e o Astro devolve 404.
 */
export function normalizeProductSlugs(products: Product[]): Product[] {
	const used = new Set<string>();
	return products.map((p) => {
		let base = slugify(p.name);
		if (!base) {
			const idPart = p.id
				.replace(/[^a-z0-9]+/gi, "-")
				.replace(/^-+|-+$/g, "")
				.slice(0, 24);
			base = idPart || "item";
		}
		let candidate = base;
		let n = 2;
		while (used.has(candidate)) {
			candidate = `${base}-${n++}`;
		}
		used.add(candidate);
		return { ...p, slug: candidate };
	});
}

function finalizeCatalogList(raw: Product[]): Product[] | null {
	const normalized = normalizeProductSlugs(raw);
	const slugs = new Set<string>();
	for (const p of normalized) {
		if (!isProduct(p)) return null;
		if (slugs.has(p.slug)) return null;
		slugs.add(p.slug);
	}
	return normalized;
}

export async function readProducts(db: D1Database): Promise<Product[]> {
	const res = await db
		.prepare(
			`SELECT id, slug, name, category, price, description, image, material, hero_featured
       FROM products ORDER BY rowid`,
		)
		.all<Record<string, unknown>>();

	const out: Product[] = [];
	for (const row of res.results ?? []) {
		const p = rowToProduct(row);
		if (p) out.push(p);
	}
	return finalizeCatalogList(out) ?? out;
}

export async function writeProducts(
	db: D1Database,
	products: Product[],
): Promise<void> {
	const stmts: D1PreparedStatement[] = [
		db.prepare("DELETE FROM products"),
	];
	const insert = db.prepare(
		`INSERT INTO products (id, slug, name, category, price, description, image, material, hero_featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	);
	for (const p of products) {
		stmts.push(
			insert.bind(
				p.id,
				p.slug,
				p.name,
				p.category,
				p.price,
				p.description,
				p.image,
				p.material,
				p.heroFeatured ? 1 : 0,
			),
		);
	}
	await db.batch(stmts);
}

function rowToProduct(row: Record<string, unknown>): Product | null {
	const price = Number(row.price);
	const hf = row.hero_featured;
	const heroFeatured =
		hf === 1 || hf === true || hf === "1" ? true : false;
	const candidate: Product = {
		id: String(row.id ?? ""),
		slug: row.slug == null ? "" : String(row.slug),
		name: String(row.name ?? ""),
		category: row.category as Category,
		price,
		description: String(row.description ?? ""),
		image: String(row.image ?? ""),
		material: String(row.material ?? ""),
		heroFeatured,
	};
	if (!isLooseProduct(candidate)) return null;
	return candidate;
}

/** Aceita payload da API / linha D1; slug pode estar vazio (corrigido por `normalizeProductSlugs`). */
function isHeroFeaturedLoose(v: unknown): boolean {
	return (
		v === undefined ||
		v === null ||
		typeof v === "boolean" ||
		v === 0 ||
		v === 1
	);
}

function isLooseProduct(x: unknown): x is Product {
	if (!x || typeof x !== "object") return false;
	const p = x as Record<string, unknown>;
	const price = Number(p.price);
	return (
		typeof p.id === "string" &&
		typeof p.slug === "string" &&
		typeof p.name === "string" &&
		typeof p.category === "string" &&
		CATEGORIES.includes(p.category as Category) &&
		Number.isFinite(price) &&
		typeof p.description === "string" &&
		typeof p.image === "string" &&
		typeof p.material === "string" &&
		isHeroFeaturedLoose(p.heroFeatured)
	);
}

function coerceHeroFeatured(p: Record<string, unknown>): boolean {
	const v = p.heroFeatured;
	return v === true || v === 1;
}

function isProduct(x: unknown): x is Product {
	if (!isLooseProduct(x)) return false;
	const p = x as Product;
	return p.slug.trim().length > 0;
}

export function parseProductsPayload(body: unknown): Product[] | null {
	if (!Array.isArray(body)) return null;
	const list: Product[] = [];
	for (const item of body) {
		if (!item || typeof item !== "object") return null;
		const raw = item as Record<string, unknown>;
		if (!isLooseProduct({ ...raw, heroFeatured: raw.heroFeatured ?? false }))
			return null;
		list.push({
			...raw,
			heroFeatured: coerceHeroFeatured(raw),
		} as Product);
	}
	return finalizeCatalogList(list);
}

/** Valida um único produto (campos iguais ao payload em lote; slug pode vir vazio). */
export function parseSingleProduct(body: unknown): Product | null {
	if (!body || typeof body !== "object") return null;
	const raw = body as Record<string, unknown>;
	if (!isLooseProduct({ ...raw, heroFeatured: raw.heroFeatured ?? false }))
		return null;
	return {
		...raw,
		heroFeatured: coerceHeroFeatured(raw),
	} as Product;
}

/**
 * Insere ou atualiza um produto pelo `id` e reescreve o catálogo completo
 * (mesmo mecanismo do PUT em lote), garantindo slugs únicos em toda a lista.
 */
export async function upsertProduct(
	db: D1Database,
	product: Product,
): Promise<void> {
	const all = await readProducts(db);
	const idx = all.findIndex((p) => p.id === product.id);
	if (idx >= 0) all[idx] = product;
	else all.push(product);
	const parsed = finalizeCatalogList(all);
	if (!parsed) {
		throw new Error("INVALID_CATALOG");
	}
	await writeProducts(db, parsed);
}
