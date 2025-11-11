import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import slugify from 'slugify';
import client from '../src/config/sanityClient.js'; 

// Configura ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Função auxiliar para esperar (ex: 60 segundos entre criações)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Função para verificar se categoria já existe
async function categoryExists(title) {
  const slug = slugify(title, { lower: true });
  const query = `*[_type == "category" && slug.current == $slug][0]`;
  const result = await client.fetch(query, { slug });
  return !!result;
}

// Função principal de seeding
async function seedSanity() {
  console.log('🚀 Iniciando processo de seeding para Sanity...');
  let count = 0;

  for (const category of SEED_DATA) {
    const exists = await categoryExists(category.title);
    if (exists) {
      console.log(`⚠️ Categoria "${category.title}" já existe, pulando...`);
      continue;
    }

    const categorySlug = slugify(category.title, { lower: true });
    console.log(`📁 Criando categoria: ${category.title}`);

    // Cria subcategorias com suas tags
    const subcategories = category.subcategories.map((sub) => ({
      _type: 'subcategory',
      title: sub.title,
      slug: { _type: 'slug', current: slugify(sub.title, { lower: true }) },
      icon: sub.icon,
      tags: sub.tags.map((tag) => ({
        _type: 'tag',
        title: tag,
        slug: { _type: 'slug', current: slugify(tag, { lower: true }) },
      })),
    }));

    // Cria categoria no Sanity
    await client.create({
      _type: 'category',
      title: category.title,
      slug: { _type: 'slug', current: categorySlug },
      icon: category.icon,
      description: category.description,
      subcategories,
    });

    count++;
    console.log(`✅ Categoria "${category.title}" criada com sucesso!`);

    if (count < SEED_DATA.length) {
      console.log('⏳ Aguardando 1 minuto antes de criar a próxima...');
      await delay(60000);
    }
  }

  console.log('🎉 Seeding finalizado com sucesso!');
}

// Executa
seedSanity().catch((err) => {
  console.error('❌ Erro no seeding:', err);
});
