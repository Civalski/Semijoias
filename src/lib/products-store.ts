import type { Category, Product } from "../data/products";

const CATEGORIES: Category[] = ["colares", "brincos", "pulseiras", "aneis"];

export async function readProducts(db: D1Database): Promise<Product[]> {
	const res = await db
		.prepare(
			`SELECT id, slug, name, category, price, description, image, material
       FROM products ORDER BY rowid`,
		)
		.all<Record<string, unknown>>();

	const out: Product[] = [];
	for (const row of res.results ?? []) {
		const p = rowToProduct(row);
		if (p) out.push(p);
	}
	return out;
}

export async function writeProducts(
	db: D1Database,
	products: Product[],
): Promise<void> {
	const stmts: D1PreparedStatement[] = [
		db.prepare("DELETE FROM products"),
	];
	const insert = db.prepare(
		`INSERT INTO products (id, slug, name, category, price, description, image, material)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
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
			),
		);
	}
	await db.batch(stmts);
}

function rowToProduct(row: Record<string, unknown>): Product | null {
	if (!isProduct(row)) return null;
	return {
		id: row.id as string,
		slug: row.slug as string,
		name: row.name as string,
		category: row.category as Category,
		price: Number(row.price),
		description: row.description as string,
		image: row.image as string,
		material: row.material as string,
	};
}

function isProduct(x: unknown): x is Product {
	if (!x || typeof x !== "object") return false;
	const p = x as Record<string, unknown>;
	const price = Number(p.price);
	return (
		typeof p.id === "string" &&
		typeof p.slug === "string" &&
		typeof p.name === "string" &&
		typeof p.category === "string" &&
		CATEGORIES.includes(p.category as Category) &&
		typeof p.price === "number" &&
		Number.isFinite(price) &&
		typeof p.description === "string" &&
		typeof p.image === "string" &&
		typeof p.material === "string"
	);
}

export function parseProductsPayload(body: unknown): Product[] | null {
	if (!Array.isArray(body)) return null;
	const list = body.filter(isProduct);
	if (list.length !== body.length) return null;

	const slugs = new Set<string>();
	for (const p of list) {
		if (slugs.has(p.slug)) return null;
		slugs.add(p.slug);
	}
	return list;
}
