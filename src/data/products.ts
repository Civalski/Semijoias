export type Category = "colares" | "brincos" | "pulseiras" | "aneis";

export interface Product {
	id: string;
	slug: string;
	name: string;
	category: Category;
	price: number;
	description: string;
	image: string;
	material: string;
	/** Exibir na faixa principal da home; alterna automaticamente com outros marcados. */
	heroFeatured: boolean;
}

export const categoryLabels: Record<Category, string> = {
	colares: "Colares",
	brincos: "Brincos",
	pulseiras: "Pulseiras",
	aneis: "Anéis",
};

export function getProductBySlug(
	list: Product[],
	slug: string,
): Product | undefined {
	return list.find((p) => p.slug === slug);
}

export function formatPrice(value: number): string {
	return value.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
}

export function slugify(text: string): string {
	return text
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
