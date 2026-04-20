import { env } from "cloudflare:workers";
import { isNonProdBuild } from "./admin-session";

/** Segmento da URL: /{ADMIN_PATH_SEGMENT}/ e /{ADMIN_PATH_SEGMENT}/painel */
export function getAdminPathSegment(): string {
	const fromEnv = env.ADMIN_PATH_SEGMENT?.trim();
	if (fromEnv) return fromEnv;
	if (isNonProdBuild()) return "admpainelmanager";
	return "admpainelmanager";
}

export function getAdminUser(): string {
	return env.ADMIN_USER?.trim() ?? (isNonProdBuild() ? "admin" : "");
}

export function getAdminPassword(): string {
	return env.ADMIN_PASSWORD?.trim() ?? (isNonProdBuild() ? "violeta123" : "");
}
