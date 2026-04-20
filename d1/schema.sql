CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT NOT NULL,
  image TEXT NOT NULL,
  material TEXT NOT NULL
);

INSERT OR REPLACE INTO products (id, slug, name, category, price, description, image, material) VALUES
('1', 'colar-gravata-violeta', 'Colar gravata Violeta', 'colares', 189.9, 'Corrente delicada em banho de ouro 18k com pingente em formato de gravata e zircônias lapidadas. Acabamento espelhado e fecho lagosta com extensor.', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80', 'Banho de ouro 18k · Zircônia'),
('2', 'brinco-argola-cristal', 'Argola cristal Aurora', 'brincos', 149.9, 'Argolas médias com cristais facetados que capturam a luz. Leves e confortáveis para o dia a dia, com visual sofisticado à noite.', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&q=80', 'Ródio branco · Cristal'),
('3', 'pulseira-elos-duplos', 'Pulseira elos duplos', 'pulseiras', 219.9, 'Elos ovalados entrelaçados com brilho acetinado. Peça versátil que combina sozinha ou em conjunto com outras pulseiras da linha.', 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80', 'Banho de ouro 18k'),
('4', 'anel-solitario-vintage', 'Anel solitário vintage', 'aneis', 129.9, 'Inspirado em joalheria clássica, com pedra central em destaque e aro trabalhado. Tamanho regulável para presente sem erro.', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 'Banho de ouro rosé · Zircônia'),
('5', 'colar-medalha-minimal', 'Colar medalha minimal', 'colares', 159.9, 'Medalha circular com superfície acetinada e borda polida. Corrente veneziana fina — elegância discreta para qualquer ocasião.', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80', 'Aço cirúrgico com banho dourado'),
('6', 'brinco-ear-cuff-duo', 'Ear cuff duo', 'brincos', 99.9, 'Par de ear cuffs sem furo, com duas fileiras de brilho. Encaixe confortável e moderno para compor looks assimétricos.', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80', 'Ródio negro · Zircônia'),
('7', 'pulseira-tennis-prata', 'Pulseira tennis prata', 'pulseiras', 279.9, 'Fileira contínua de pedras em lapidação redonda. O brilho clássico da tennis bracelet em versão semi joia premium.', 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800&q=80', 'Prata 925 · Zircônia'),
('8', 'anel-coroa-fino', 'Anel coroa fino', 'aneis', 119.9, 'Design de coroa com micro zircônias. Ideal para usar no mindinho ou empilhado com outros anéis da coleção.', 'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80', 'Banho de ouro 18k');
