import type { APIRoute } from "astro";
import { getAdminPathSegment } from "../../../lib/admin-config";
import { ADMIN_COOKIE } from "../../../lib/admin-session";

export const GET: APIRoute = async ({ cookies, url }) => {
	cookies.delete(ADMIN_COOKIE, { path: "/" });
	const segment = getAdminPathSegment();
	return Response.redirect(new URL(`/${segment}/`, url), 302);
};
