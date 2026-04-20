import { env } from "cloudflare:workers";

export function getDb(): D1Database {
	const db = env.DB;
	if (!db) {
		throw new Error(
			"D1: binding 'DB' ausente. Configure [[d1_databases]] no wrangler.toml e rode a migração.",
		);
	}
	return db;
}
