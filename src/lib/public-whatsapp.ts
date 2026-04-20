import { env } from "cloudflare:workers";

/**
 * Número WhatsApp (público). Em produção vem do Worker (`[vars]` / dashboard);
 * no dev/local pode vir de `.env` via `import.meta.env` (build-time).
 */
export function getPublicWhatsAppNumberRaw(): string {
	const fromWorker = env.PUBLIC_WHATSAPP_NUMBER;
	if (typeof fromWorker === "string" && fromWorker.trim()) return fromWorker.trim();
	const fromBuild = import.meta.env.PUBLIC_WHATSAPP_NUMBER;
	if (typeof fromBuild === "string" && fromBuild.trim()) return fromBuild.trim();
	return "";
}
