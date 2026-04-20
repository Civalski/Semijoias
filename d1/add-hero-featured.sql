-- Execute uma vez em bancos já criados antes da coluna hero_featured:
--   npx wrangler d1 execute semijoias --local --file=./d1/add-hero-featured.sql
--   npx wrangler d1 execute semijoias --remote --file=./d1/add-hero-featured.sql
ALTER TABLE products ADD COLUMN hero_featured INTEGER NOT NULL DEFAULT 0;
