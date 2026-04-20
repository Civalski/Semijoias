import type { APIRoute } from "astro";
import { getAdminPassword, getAdminUser } from "../../../lib/admin-config";
import {
	ADMIN_COOKIE,
	createSessionValue,
	getSessionSecret,
} from "../../../lib/admin-session";

export const POST: APIRoute = async ({ request, cookies }) => {
	const secret = getSessionSecret();
	if (!secret) {
		return new Response(
			JSON.stringify({
				error: "Defina ADMIN_SESSION_SECRET no servidor.",
			}),
			{ status: 503, headers: { "Content-Type": "application/json" } },
		);
	}

	const expectedUser = getAdminUser();
	const expectedPass = getAdminPassword();
	if (!expectedUser || !expectedPass) {
		return new Response(
			JSON.stringify({
				error: "Defina ADMIN_USER e ADMIN_PASSWORD no servidor.",
			}),
			{ status: 503, headers: { "Content-Type": "application/json" } },
		);
	}

	let body: { username?: string; password?: string };
	try {
		body = await request.json();
	} catch {
		return new Response(JSON.stringify({ error: "Corpo inválido" }), {
			status: 400,
			headers: { "Content-Type": "application/json" },
		});
	}

	const user = body.username ?? "";
	const pass = body.password ?? "";

	if (user !== expectedUser || pass !== expectedPass) {
		return new Response(
			JSON.stringify({ error: "Usuário ou senha incorretos." }),
			{ status: 401, headers: { "Content-Type": "application/json" } },
		);
	}

	const token = await createSessionValue(secret, 7 * 24 * 60 * 60 * 1000);
	cookies.set(ADMIN_COOKIE, token, {
		path: "/",
		httpOnly: true,
		sameSite: "lax",
		maxAge: 7 * 24 * 60 * 60,
		secure: import.meta.env.PROD,
	});

	return new Response(JSON.stringify({ ok: true }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
};
