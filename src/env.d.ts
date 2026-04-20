/// <reference path="../.astro/types.d.ts" />
/// <reference types="@cloudflare/workers-types" />

interface ImportMetaEnv {
	readonly PUBLIC_WHATSAPP_NUMBER?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

interface Env {
	DB: D1Database;
	ADMIN_PATH_SEGMENT?: string;
	ADMIN_USER?: string;
	ADMIN_PASSWORD?: string;
	ADMIN_SESSION_SECRET?: string;
}

declare module "cloudflare:workers" {
	export const env: Env;
}
