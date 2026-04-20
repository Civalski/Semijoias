import type { APIRoute } from "astro";
import { ADMIN_COOKIE, getSessionSecret, verifySessionValue } from "../../../lib/admin-session";
import { getDb } from "../../../lib/db";
import {
	parseProductsPayload,
	readProducts,
	writeProducts,
} from "../../../lib/products-store";

async function authorized(
	cookies: Parameters<APIRoute>[0]["cookies"],
): Promise<boolean> {
	const v = cookies.get(ADMIN_COOKIE)?.value;
	return verifySessionValue(v, getSessionSecret());
}

export const GET: APIRoute = async ({ cookies }) => {
	if (!(await authorized(cookies))) {
		return new Response("Não autorizado", { status: 401 });
	}
	const products = await readProducts(getDb());
	return new Response(JSON.stringify(products), {
		status: 200,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
};

export const PUT: APIRoute = async ({ request, cookies }) => {
	if (!(await authorized(cookies))) {
		return new Response("Não autorizado", { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "JSON inválido" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const parsed = parseProductsPayload(body);
	if (!parsed) {
		return new Response(
			JSON.stringify({
				error:
					"Lista inválida: verifique categorias, preços numéricos e slugs únicos.",
			}),
			{ status: 400, headers: { "Content-Type": "application/json" } },
		);
	}

	await writeProducts(getDb(), parsed);
	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
