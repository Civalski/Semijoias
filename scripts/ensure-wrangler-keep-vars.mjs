/**
 * O deploy usa dist/server/wrangler.json gerado no build. Sem keep_vars, o Wrangler
 * apaga variáveis de texto definidas só no painel da Cloudflare a cada deploy.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve("dist/server/wrangler.json");
const config = JSON.parse(readFileSync(path, "utf8"));
config.keep_vars = true;
writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`);
