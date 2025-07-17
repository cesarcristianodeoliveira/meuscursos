// config/sanity.js
import { createClient } from '@sanity/client';

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID, // Seu ID do projeto Sanity
    dataset: process.env.SANITY_DATASET,     // Seu dataset (geralmente 'production')
    apiVersion: '2023-05-03',                  // Use a data atual ou a versão da API do Sanity
    useCdn: true,                              // `false` para rascunhos, `true` para dados publicados
    token: process.env.SANITY_API_TOKEN,       // Apenas se precisar de acesso com token (para escrita ou rascunhos)
});

export default client;