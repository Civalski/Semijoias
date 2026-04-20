import { env } from "cloudflare:workers";

export const ADMIN_COOKIE = "violeta_admin";

export function getSessionSecret(): string {
	const s = env.ADMIN_SESSION_SECRET?.trim();
	if (s) return s;
	if (import.meta.env.DEV) return "dev-admin-session-troque-em-producao";
	return "";
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
	return [...new Uint8Array(sig)]
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

export async function createSessionValue(
	secret: string,
	maxAgeMs: number,
): Promise<string> {
	const exp = Date.now() + maxAgeMs;
	const ver = "v1";
	const sig = await hmacSha256Hex(secret, `${exp}.${ver}`);
	return `${exp}.${ver}.${sig}`;
}

export async function verifySessionValue(
	value: string | undefined,
	secret: string,
): Promise<boolean> {
	if (!value || !secret) return false;
	const parts = value.split(".");
	if (parts.length !== 3) return false;
	const [exp, ver, sig] = parts;
	if (ver !== "v1") return false;
	const expMs = Number(exp);
	if (!Number.isFinite(expMs) || expMs < Date.now()) return false;
	const expected = await hmacSha256Hex(secret, `${exp}.${ver}`);
	return timingSafeEqualHex(sig, expected);
}
