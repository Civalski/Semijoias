import { env } from "cloudflare:workers";

/** Segmento da URL: /{ADMIN_PATH_SEGMENT}/ e /{ADMIN_PATH_SEGMENT}/painel */
export function getAdminPathSegment(): string {
	const fromEnv = env.ADMIN_PATH_SEGMENT?.trim();
	if (fromEnv) return fromEnv;
	if (import.meta.env.DEV) return "admpainelmanager";
	return "admpainelmanager";
}

export function getAdminUser(): string {
	return (
		env.ADMIN_USER?.trim() ?? (import.meta.env.DEV ? "admin" : "")
	);
}

export function getAdminPassword(): string {
	return (
		env.ADMIN_PASSWORD?.trim() ??
		(import.meta.env.DEV ? "violeta123" : "")
	);
}
