// D:\meuscursos\backend\utils\sanityClient.js

import { createClient } from '@sanity/client';

// --- Configurações do Sanity Client ---
const sanityClient = createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion: process.env.SANITY_API_VERSION || '2025-06-12',
    token: process.env.SANITY_TOKEN,
    useCdn: false,
});

export default sanityClient;
