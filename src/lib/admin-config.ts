import { env } from "cloudflare:workers";

/** Segmento da URL: /{ADMIN_PATH_SEGMENT}/ e /{ADMIN_PATH_SEGMENT}/painel */
export function getAdminPathSegment(): string {
	return env.ADMIN_PATH_SEGMENT?.trim() || "admpainelmanager";
}

export function getAdminUser(): string {
	return env.ADMIN_USER?.trim() ?? "";
}

export function getAdminPassword(): string {
	return env.ADMIN_PASSWORD?.trim() ?? "";
}
