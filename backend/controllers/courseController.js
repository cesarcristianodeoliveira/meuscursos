// D:\meuscursos\backend\controllers\courseController.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios'; // Importar axios para requisições HTTP (para Pixabay)

// --- Configuração da Gemini API ---
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
}
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// --- Configuração da Pixabay API ---
if (!process.env.PIXABAY_API_KEY) {
    console.error("Erro: Variável de ambiente PIXABAY_API_KEY não definida em courseController.");
}
const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY; // Apenas para facilitar o uso

// --- Configuração do Sanity Client para ESCRITA ---
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variável de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
}
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2025-06-12',
    useCdn: false, // Desabilita CDN para escritas e leitura de dados frescos
    token: process.env.SANITY_TOKEN, // Token de autenticação para escritas
}) : null;

// --- Função auxiliar para gerar slug amigável para URLs e único ---
const generateSlug = (text) => {
    const normalizedText = text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const baseSlug = normalizedText
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');

    return `${baseSlug}-${uuidv4().substring(0, 8)}`;
};

// Helper para converter string de texto para Portable Text básico (formato Rich Text do Sanity)
const convertToPortableText = (text) => {
    if (!text) return [];
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');

    return paragraphs.map(p => ({
        _key: uuidv4(),
        _type: 'block',
        children: [
            {
                _key: uuidv4(),
                _type: 'span',
                marks: [],
                text: p.trim(),
            },
        ],
        markDefs: [],
        style: 'normal',
    }));
};

// --- Funções do Controlador de Cursos ---

/**
 * @function generateCourseTitles
 * @description Endpoint para gerar 5 títulos de curso usando a IA da Gemini.
 * @route POST /api/courses/create/generate-titles
 * @access Protected
 * @param {Object} req.body - Contém category, subCategory, tags, level.
 */
export const generateCourseTitles = async (req, res) => {
    if (!genAI) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chave da Gemini API não inicializada.' });
    }

    const { category, subCategory, tags, level } = req.body;

    if (!category || !subCategory || !Array.isArray(tags) || tags.length === 0 || !level) {
        return res.status(400).json({ error: 'Dados incompletos: Categoria, Subcategoria, pelo menos uma Tag e Nível são necessários para gerar títulos.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Gere uma lista de 5 títulos de curso em português.
        Os títulos devem ser atraentes, criativos e altamente originais, **evitando inícios repetitivos ou clichês**.
        Devem ser baseados na categoria de curso: "${category}", subcategoria: "${subCategory}", tags: "${tags.join(', ')}", e nível de dificuldade: "${level}".
        Cada título deve ter no máximo 10 palavras.
        Formate a resposta APENAS como um array JSON de strings, sem nenhum texto introdutório ou explicativo.
        Exemplo: ["Dominando JavaScript Moderno", "Explorando React Essencial", "Desvendando UI/UX para Web", "Fullstack com Node.js e Express", "Design Responsivo na Prática"]
        `;

        console.log(`[BACKEND] Gerando 5 títulos para Categoria: ${category}, Subcategoria: ${subCategory}, Tags: ${tags.join(', ')}, Nível: ${level}...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API ao gerar títulos.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado ao gerar títulos.' });
        }

        let suggestedTitles;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            suggestedTitles = JSON.parse(rawJsonString);

            if (!Array.isArray(suggestedTitles) || suggestedTitles.some(title => typeof title !== 'string')) {
                throw new Error('Formato de títulos sugeridos pela IA inválido: Esperado um array de strings.');
            }

            // Garante que são 5 títulos
            if (suggestedTitles.length > 5) {
                suggestedTitles = suggestedTitles.slice(0, 5);
            } else if (suggestedTitles.length < 5) {
                // Opcional: tentar gerar mais ou preencher com genéricos se menos de 5 forem retornados
                console.warn(`[BACKEND] Gemini API retornou menos de 5 títulos (${suggestedTitles.length}).`);
            }

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON dos títulos da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto de títulos recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA para títulos. Formato JSON inválido.', rawText: text });
        }

        res.status(200).json({
            message: 'Títulos sugeridos gerados com sucesso!',
            suggestedTitles: suggestedTitles,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração de títulos pela IA:", error);
        if (error.response?.status === 503) {
            console.error("[BACKEND] Gemini API: Modelo sobrecarregado ou serviço indisponível (503 Service Unavailable).");
            return res.status(503).json({
                error: "Nosso serviço de IA para títulos está sobrecarregado. Por favor, tente novamente em instantes.",
                details: error.message
            });
        }
        if (error.response?.status === 429) {
            console.error("[BACKEND] Gemini API Rate Limit Excedido (títulos):", error.response.data.error);
            return res.status(429).json({
                error: "Limite de requisições da IA para títulos excedido. Por favor, tente novamente em breve.",
                details: error.response.data.error.message
            });
        }
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API (títulos):", error.response.data.error);
            return res.status(500).json({
                error: `Erro da Gemini API ao gerar títulos: ${error.response.data.error.message}`,
                details: error.response.data
            });
        }
        res.status(500).json({ error: 'Falha interna ao gerar títulos para o curso.', details: error.message });
    }
};

/**
 * @function getPixabayImages
 * @description Endpoint para buscar 3 imagens aleatórias da Pixabay API.
 * @route GET /api/courses/create/pixabay-images
 * @access Protected
 * @param {Object} req.query - Contém tags (string ou array de strings separadas por vírgula).
 */
export const getPixabayImages = async (req, res) => {
    if (!PIXABAY_API_KEY) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chave da Pixabay API não definida.' });
    }

    // `tags` pode vir como uma string 'tag1,tag2' ou um array ['tag1', 'tag2']
    // Normalizamos para uma string separada por vírgulas para a API Pixabay.
    let searchTags = req.query.tags;
    if (Array.isArray(searchTags)) {
        searchTags = searchTags.join(',');
    } else if (typeof searchTags !== 'string') {
        searchTags = ''; // Default para vazio se não for string ou array
    }

    if (!searchTags) {
        // Se nenhuma tag for fornecida, podemos usar um termo genérico ou retornar um erro.
        // Optando por um termo genérico para sempre retornar imagens.
        searchTags = 'education,learning,online course';
        console.warn("[BACKEND] Nenhuma tag fornecida para Pixabay, usando tags genéricas: 'education,learning,online course'");
    }

    try {
        const pixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${encodeURIComponent(searchTags)}&image_type=photo&per_page=200&safesearch=true`;
        // per_page=200 para ter mais opções para randomizar
        // safesearch=true para garantir conteúdo apropriado

        console.log(`[BACKEND] Buscando imagens da Pixabay para tags: "${searchTags}"...`);
        const pixabayResponse = await axios.get(pixabayUrl);
        const images = pixabayResponse.data.hits;

        if (!images || images.length === 0) {
            console.log("[BACKEND] Nenhuma imagem encontrada na Pixabay para as tags fornecidas.");
            // Tenta com termos mais genéricos se não houver resultados específicos
            const genericPixabayUrl = `https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=online learning,education,study&image_type=photo&per_page=200&safesearch=true`;
            const genericResponse = await axios.get(genericPixabayUrl);
            const genericImages = genericResponse.data.hits;

            if (!genericImages || genericImages.length === 0) {
                return res.status(404).json({ message: 'Nenhuma imagem encontrada na Pixabay, mesmo com termos genéricos.' });
            }
            console.log("[BACKEND] Usando imagens genéricas da Pixabay.");
            return res.status(200).json({
                message: 'Imagens genéricas encontradas.',
                images: selectRandomImages(genericImages, 3)
            });
        }

        res.status(200).json({
            message: 'Imagens da Pixabay encontradas com sucesso!',
            images: selectRandomImages(images, 3)
        });

    } catch (error) {
        console.error("[BACKEND] Erro ao buscar imagens da Pixabay:", error);
        res.status(500).json({ error: 'Falha interna ao buscar imagens da Pixabay.', details: error.message });
    }
};

// Função auxiliar para selecionar um número específico de imagens aleatórias
const selectRandomImages = (imageArray, count) => {
    if (!imageArray || imageArray.length === 0) {
        return [];
    }
    const shuffled = [...imageArray].sort(() => 0.5 - Math.random()); // Embaralha o array
    const selected = shuffled.slice(0, count); // Pega as primeiras 'count' imagens

    return selected.map(img => ({
        url: img.webformatURL, // Ou img.largeImageURL para maior resolução
        altText: img.tags,
        previewURL: img.webformatURL // Adicionando para conveniência, pode ser o mesmo que 'url'
    }));
};

/**
 * @function generateTags
 * @description Endpoint para gerar sugestões de tags para um curso usando a IA da Gemini.
 * Foi movida para o dataController ou ajustada para não ser mais necessária se 'getTopTags' for suficiente.
 * Mantida aqui apenas por histórico, mas provavelmente não será usada com a nova rota `/api/courses/create/top-tags`.
 * Se ainda for necessária para "sugestões de IA além das top 10", será reavaliada.
 */
export const generateTags = async (req, res) => {
    // Esta função foi designada para ser substituída ou complementada por getTopTags no dataController.
    // Se você ainda precisa que a IA gere tags de forma dinâmica (além das 10 mais procuradas),
    // esta função deve ser mantida e a rota correspondente usada.
    // Por enquanto, o foco é nas "top 10 tags" do Sanity.
    // Se a intenção é que o Passo 3 tenha 10 tags do Sanity E SUGESTÕES DA IA, precisamos de clareza.
    // Mantenho o código existente, mas com a ressalva de seu uso no novo fluxo.
    if (!genAI) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chave da Gemini API não inicializada.' });
    }

    const { topic, category, subCategory, level } = req.body;

    if (!topic || !category || !subCategory || !level) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria e Nível são necessários para gerar tags.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Gere uma lista de até 10 tags (palavras-chave) em português para um curso com o seguinte tópico principal: "${topic}".
        Considere que a categoria de ID "${category}", subcategoria de ID "${subCategory}", e nível de dificuldade "${level}".
        As tags devem ser relevantes, concisas (1-3 palavras por tag), e cobrir os principais temas e áreas de interesse do curso.
        Formate a resposta APENAS como um array JSON de strings, sem nenhum texto introdutório ou explicativo.
        Exemplo: ["programacao", "javascript", "frontend", "desenvolvimento web", "react", "iniciante"]
        `;

        console.log(`[BACKEND] Gerando tags para o tópico: "${topic}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API ao gerar tags.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado ao gerar tags.' });
        }

        let suggestedTags;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            suggestedTags = JSON.parse(rawJsonString);

            if (!Array.isArray(suggestedTags) || suggestedTags.some(tag => typeof tag !== 'string')) {
                throw new Error('Formato de tags sugeridas pela IA inválido: Esperado um array de strings.');
            }

            suggestedTags = [...new Set(suggestedTags.map(tag => tag.trim().toLowerCase()))];

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON das tags da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto de tags recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA para tags. Formato JSON inválido.', rawText: text });
        }

        res.status(200).json({
            message: 'Tags sugeridas geradas com sucesso!',
            suggestedTags: suggestedTags,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração de tags pela IA:", error);

        if (error.response?.status === 503) {
            console.error("[BACKEND] Gemini API: Modelo sobrecarregado ou serviço indisponível (503 Service Unavailable).");
            return res.status(503).json({
                error: "Nosso serviço de IA está sobrecarregado. Por favor, tente gerar as tags novamente em alguns instantes.",
                details: error.message
            });
        }
        if (error.response?.status === 429) {
            console.error("[BACKEND] Gemini API Rate Limit Excedido (tags):", error.response.data.error);
            return res.status(429).json({
                error: "Limite de requisições da IA para tags excedido. Por favor, tente novamente em breve.",
                details: error.response.data.error.message
            });
        }
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API (tags):", error.response.data.error);
            return res.status(500).json({
                error: `Erro da Gemini API ao gerar tags: ${error.response.data.error.message}`,
                details: error.response.data
            });
        }
        res.status(500).json({ error: 'Falha interna ao gerar tags para o curso.', details: error.message });
    }
};

/**
 * @function generateCoursePreview
 * @description Endpoint para gerar uma pré-visualização de um curso (título, descrição, lições) usando a IA da Gemini.
 * @param {Object} req - Objeto de requisição (contém topic, category, subCategory, level, tags e creatorId no body).
 * @param {Object} res - Objeto de resposta.
 */
export const generateCoursePreview = async (req, res) => {
    if (!genAI || !sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chaves de API ou Cliente Sanity não inicializados.' });
    }

    const { chosenTitle, category, subCategory, level, tags } = req.body;
    const creatorId = req.user?.id;

    // ALTERAÇÃO: Use chosenTitle no lugar de topic para a geração do curso
    if (!chosenTitle || !category || !subCategory || !level || !creatorId || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'Dados incompletos: Título escolhido, Categoria, Subcategoria, Nível, Tags (array) e ID do criador são necessários para gerar o curso.' });
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use um modelo mais rápido para pré-visualização

        let tagsContext = '';
        if (tags && tags.length > 0) {
            tagsContext = `Considere que o curso deve incorporar as seguintes tags/palavras-chave em seu conteúdo, descrição e títulos de lição: "${tags.join(', ')}".
            As tags devem ser incorporadas de forma a enriquecer o título, a descrição e o conteúdo das lições.
            `;
        }

        const prompt = `Gere um esquema de curso detalhado em português, garantindo que o **título do curso e os títulos das lições sejam altamente originais e únicos**, mesmo quando os parâmetros iniciais são semelhantes.
        
        O título do curso já foi definido como: "${chosenTitle}".
        
        ${tagsContext} O curso está na categoria de ID "${category}" e subcategoria de ID "${subCategory}", e tem um nível de dificuldade "${level}".
        
        Considere uma perspectiva ou abordagem ligeiramente diferente para este curso, tornando-o distintivo e não apenas uma repetição de cursos com temas próximos.
        
        **Varie o início do título do curso e das lições** com diferentes abordagens e sinônimos (ex: "Fluência em Inglês", "Domine o Inglês", "Inglês na Prática", "Guia Completo de Inglês", "Desvende o Inglês", etc. para títulos de curso de inglês). **Evite repetir as mesmas palavras iniciais nos títulos de cursos e lições.**
        
        O esquema deve conter:
        - Um campo 'title' (string): **EXATAMENTE o título fornecido: "${chosenTitle}"**. (Não altere este título).
        - Um campo 'description' (string): Uma breve descrição concisa (2-3 frases), que também capture o ângulo único do curso.
        - Um campo 'lessons' (array de objetos): Uma lista de **5 a 7 lições essenciais e bem estruturadas**. Cada lição deve ter:
            - 'title' (string): **Um título único e cativante** para a lição, que seja relevante para o curso e não repetitivo em relação a outras lições.
            - 'order' (number): A ordem da lição no curso, começando de 1.
            - 'content' (string): Conteúdo detalhado da lição (3-5 parágrafos de texto corrido, sem formatação Markdown complexa ou HTML). Foque em clareza, profundidade adequada ao nível especificado e exemplos práticos quando aplicável.
            - 'estimatedReadingTime' (number): Tempo estimado de leitura em minutos para esta lição (entre 3 e 15).
        A resposta deve ser APENAS um objeto JSON válido, sem nenhum texto introdutório ou explicativo.
        Exemplo de formato JSON para o curso e lições (o slug será gerado pelo backend):
        {
            "title": "Titulo do Curso Único e Criativo",
            "description": "Uma descrição breve e engajante que destaca a singularidade.",
            "lessons": [
                {
                    "title": "Titulo da Licao 1 Única",
                    "order": 1,
                    "content": "Conteúdo do parágrafo 1.\\n\\nConteúdo do parágrafo 2.",
                    "estimatedReadingTime": 7
                },
                {
                    "title": "Titulo da Licao 2 Diferente",
                    "order": 2,
                    "content": "Mais conteúdo aqui.\\n\\nOutro parágrafo.",
                    "estimatedReadingTime": 10
                }
            ]
        }
        `;

        console.log(`[BACKEND] Gerando pré-visualização para o curso: "${chosenTitle}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado.' });
        }

        let generatedCourseData;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            generatedCourseData = JSON.parse(rawJsonString);

            // Garante que o título gerado é o título escolhido
            generatedCourseData.title = chosenTitle;

            if (generatedCourseData.title) {
                generatedCourseData.slug = {
                    current: generateSlug(generatedCourseData.title),
                    _type: 'slug'
                };
            } else {
                generatedCourseData.slug = { current: `curso-${uuidv4()}`, _type: 'slug' };
            }

            if (generatedCourseData.lessons && Array.isArray(generatedCourseData.lessons)) {
                generatedCourseData.lessons = generatedCourseData.lessons.map(lesson => {
                    if (lesson.title) {
                        lesson.slug = {
                            current: generateSlug(lesson.title),
                            _type: 'slug'
                        };
                    } else {
                        lesson.slug = { current: `licao-${uuidv4()}`, _type: 'slug' };
                    }
                    return lesson;
                });
            }

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON ou gerar slugs da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA. Formato JSON inválido ou falha na geração de slug.', rawText: text });
        }

        const responseData = {
            ...generatedCourseData,
            category: category,
            subCategory: subCategory,
            level: level,
            tags: tags,
            promptUsed: prompt, // Salvamos o prompt completo para referência
            aiModelUsed: "gemini-1.5-flash" // Modelo usado para esta geração
        };

        res.status(200).json({
            message: 'Pré-visualização do curso gerada com sucesso!',
            coursePreview: responseData,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração da pré-visualização do curso:", error);

        if (error.response?.status === 429) {
            console.error("[BACKEND] Gemini API Rate Limit Excedido:", error.response.data.error);
            return res.status(429).json({
                error: "Limite de requisições da IA excedido para a pré-visualização. Por favor, tente novamente em breve.",
                details: error.response.data.error.message
            });
        }
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({
                error: `Erro da Gemini API: ${error.response.data.error.message}`,
                details: error.response.data
            });
        }
        res.status(500).json({ error: 'Falha interna ao gerar a pré-visualização do curso.', details: error.message });
    }
};

/**
 * @function saveGeneratedCourse
 * @description Salva um curso gerado pela IA no Sanity CMS, incluindo lições e tags, e atualiza os créditos do criador.
 * @param {Object} req - Objeto de requisição (contém courseData, category, subCategory, level, tags no body, e user no JWT).
 * @param {Object} res - Objeto de resposta.
 */
export const saveGeneratedCourse = async (req, res) => {
    if (!sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Cliente Sanity não inicializado.' });
    }

    console.log('[BACKEND - saveGeneratedCourse] Dados recebidos na requisição:', JSON.stringify(req.body, null, 2));

    const {
        courseData,
        category,
        subCategory,
        level,
        tags,
        mainImageUrl // NOVO: Campo para a URL da imagem principal do curso
    } = req.body;

    const aiGenerationPromptFromPreview = courseData.promptUsed || '';
    const aiModelUsedFromPreview = courseData.aiModelUsed || 'gemini-1.5-flash'; // Atualizado para refletir o modelo de preview

    const creatorId = req.user?.id;

    if (!courseData || !creatorId || !category || !subCategory || !level || !Array.isArray(tags) || !mainImageUrl) {
        return res.status(400).json({ error: 'Dados incompletos para salvar o curso. Verifique courseData, category, subCategory, level, tags (array), mainImageUrl e creatorId.' });
    }

    console.log('[BACKEND - saveGeneratedCourse] Conteúdo de courseData:', JSON.stringify(courseData, null, 2));
    console.log('[BACKEND - saveGeneratedCourse] Prompt de Geração da IA (a ser salvo):', aiGenerationPromptFromPreview);
    console.log('[BACKEND - saveGeneratedCourse] Modelo de IA Usado (a ser salvo):', aiModelUsedFromPreview);
    console.log('[BACKEND - saveGeneratedCourse] Tags recebidas (nomes):', tags);
    console.log('[BACKEND - saveGeneratedCourse] URL da Imagem Principal:', mainImageUrl);

    let transaction;

    try {
        const member = await sanityClient.fetch(
            `*[_id == $creatorId][0]{isAdmin, credits}`,
            { creatorId }
        );

        if (!member) {
            throw new Error(`Membro com ID ${creatorId} não encontrado.`);
        }

        let updatedCredits = member.credits;
        const isMemberAdmin = member.isAdmin === true;

        if (!isMemberAdmin) {
            if (member.credits <= 0) {
                throw new Error('Créditos insuficientes para criar um curso.');
            }
            updatedCredits = member.credits - 1;
            console.log(`[BACKEND] Créditos antes: ${member.credits}, Créditos depois: ${updatedCredits} para o membro ${creatorId}`);
        } else {
            console.log(`[BACKEND] Usuário Admin ${creatorId} está criando um curso. Nenhum crédito consumido.`);
        }

        let initialCourseSlug = courseData.slug.current;
        let finalCourseSlug = initialCourseSlug;
        let slugIsUnique = false;
        let attempt = 0;
        const MAX_SLUG_ATTEMPTS = 5;

        while (!slugIsUnique && attempt < MAX_SLUG_ATTEMPTS) {
            const existingCourse = await sanityClient.fetch(
                `*[_type == "course" && slug.current == $slug][0]{_id}`,
                { slug: finalCourseSlug }
            );

            if (!existingCourse) {
                slugIsUnique = true;
            } else {
                attempt++;
                console.warn(`[BACKEND] Slug "${finalCourseSlug}" já existe no Sanity. Tentando gerar um novo (tentativa ${attempt}).`);
                finalCourseSlug = `${generateSlug(courseData.title)}-${uuidv4().substring(0, 4)}`;
            }
        }

        if (!slugIsUnique) {
            throw new Error('Falha ao gerar um slug único para o curso após múltiplas tentativas. Por favor, tente um tópico diferente para o curso.');
        }

        const courseSlugForSanity = {
            _type: 'slug',
            current: finalCourseSlug,
        };

        const courseId = `course-${uuidv4()}`;
        const lessonRefs = [];
        let totalEstimatedDuration = 0;

        transaction = sanityClient.transaction();

        transaction.patch(creatorId, (patch) => {
            return patch
                .set({ credits: updatedCredits })
                .setIfMissing({ createdCourses: [] })
                .append('createdCourses', [{
                    _ref: courseId,
                    _type: 'reference',
                    _key: uuidv4(),
                }]);
        });
        console.log(`[BACKEND] Transação iniciada. Membro ${creatorId} será atualizado e o curso será adicionado.`);

        for (const lesson of courseData.lessons) {
            const lessonSlug = lesson.slug;
            const lessonId = `lesson-${uuidv4()}`;

            const newLesson = {
                _id: lessonId,
                _type: 'lesson',
                title: lesson.title,
                slug: lessonSlug,
                content: convertToPortableText(lesson.content),
                order: lesson.order,
                estimatedReadingTime: lesson.estimatedReadingTime || 5,
                status: 'published',
                course: {
                    _ref: courseId,
                    _type: 'reference',
                },
            };

            transaction.create(newLesson);
            lessonRefs.push({
                _key: uuidv4(),
                _ref: lessonId,
                _type: 'reference',
            });
            totalEstimatedDuration += (lesson.estimatedReadingTime || 0);
            console.log(`[BACKEND] Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        const courseTagRefs = [];
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                const normalizedTagName = tagName.trim().toLowerCase();

                const existingTag = await sanityClient.fetch(
                    `*[_type == "courseTag" && (name == $tagName || title == $tagName)][0]{_id, categories[]->{_id}, subCategories[]->{_id}}`, // Inclui categorias e subcategorias existentes para associar
                    { tagName: normalizedTagName }
                );

                let tagRefId;
                if (existingTag) {
                    tagRefId = existingTag._id;
                    console.log(`[BACKEND] Tag existente encontrada: "${normalizedTagName}" (ID: ${tagRefId}).`);

                    const categoryAlreadyLinked = existingTag.categories && existingTag.categories.some(cat => cat._id === category);
                    const subCategoryAlreadyLinked = existingTag.subCategories && existingTag.subCategories.some(subCat => subCat._id === subCategory);

                    // Verifica e adiciona a categoria se não estiver linkada
                    if (!categoryAlreadyLinked) {
                        console.log(`[BACKEND] Adicionando referência à categoria "${category}" na tag existente "${normalizedTagName}".`);
                        transaction.patch(tagRefId).append('categories', [{
                            _ref: category,
                            _type: 'reference',
                            _key: uuidv4()
                        }]);
                    }
                    // Verifica e adiciona a subcategoria se não estiver linkada
                    if (!subCategoryAlreadyLinked) {
                        console.log(`[BACKEND] Adicionando referência à subcategoria "${subCategory}" na tag existente "${normalizedTagName}".`);
                        transaction.patch(tagRefId).append('subCategories', [{
                            _ref: subCategory,
                            _type: 'reference',
                            _key: uuidv4()
                        }]);
                    }

                } else {
                    const newTagId = `courseTag-${uuidv4()}`;
                    const newTagSlug = {
                        _type: 'slug',
                        current: generateSlug(normalizedTagName),
                    };

                    const newTagDocument = {
                        _id: newTagId,
                        _type: 'courseTag',
                        name: normalizedTagName, // Ou 'title', dependendo do seu schema de tag
                        slug: newTagSlug,
                        description: `Tag gerada automaticamente para o tópico: ${normalizedTagName}.`,
                        categories: [ // Associa a tag à categoria do curso
                            {
                                _ref: category,
                                _type: 'reference',
                                _key: uuidv4()
                            }
                        ],
                        subCategories: [ // Associa a tag à subcategoria do curso
                            {
                                _ref: subCategory,
                                _type: 'reference',
                                _key: uuidv4()
                            }
                        ]
                    };

                    transaction.create(newTagDocument);
                    tagRefId = newTagId;
                    console.log(`[BACKEND] Nova tag criada e adicionada à transação: "${normalizedTagName}" (ID: ${newTagId}).`);
                }

                courseTagRefs.push({
                    _ref: tagRefId,
                    _type: 'reference',
                    _key: uuidv4(),
                });
            }
        }

        // NOVO: Processa a imagem principal
        let mainImageRef = null;
        if (mainImageUrl) {
            try {
                // Sanity Asset URL: Para fazer upload de uma imagem externa para o Sanity CDN
                const uploadedAsset = await sanityClient.assets.upload('image', mainImageUrl);
                mainImageRef = {
                    _type: 'image',
                    asset: {
                        _ref: uploadedAsset._id,
                        _type: 'reference'
                    },
                    alt: courseData.title // Usa o título do curso como alt text padrão
                };
                console.log(`[BACKEND] Imagem principal upada para Sanity com sucesso: ${uploadedAsset._id}`);
            } catch (uploadError) {
                console.error("[BACKEND] Erro ao fazer upload da imagem para o Sanity:", uploadError);
                // Continua mesmo que a imagem falhe no upload, mas loga o erro
                mainImageRef = null;
            }
        }


        const newCourse = {
            _id: courseId,
            _type: 'course',
            title: courseData.title,
            description: courseData.description,
            slug: courseSlugForSanity,
            lessons: lessonRefs,
            mainImage: mainImageRef, // Adicionando a referência da imagem principal
            status: 'published',
            price: 0,
            isProContent: false,
            level: level,
            estimatedDuration: totalEstimatedDuration,
            creator: {
                _ref: creatorId,
                _type: 'reference',
            },
            category: { _ref: category, _type: 'reference' },
            subCategory: { _ref: subCategory, _type: 'reference' },
            courseTags: courseTagRefs,
            aiGenerationPrompt: aiGenerationPromptFromPreview,
            aiModelUsed: aiModelUsedFromPreview,
            generatedAt: new Date().toISOString(),
            lastGenerationRevision: new Date().toISOString(),
        };

        transaction.create(newCourse);
        console.log(`[BACKEND] Curso "${newCourse.title}" adicionado à transação (ID: ${courseId}).`);

        console.log("[BACKEND] Transação preparada para criar curso, lições, tags (se novas) e ATUALIZAR membro. Executando commit...");

        const transactionResult = await transaction.commit();

        console.log(`[BACKEND] Transação concluída com sucesso! Documentos criados e atualizados:`, transactionResult);

        const memberUpdateInfo = transactionResult.results.find(
            r => r.id === creatorId && r.operation === 'update'
        );

        res.status(201).json({
            message: 'Curso, lições e tags salvos com sucesso! Créditos e cursos do membro atualizados.',
            course: newCourse, // Retorna o objeto completo do curso salvo
            lessons: courseData.lessons,
            memberUpdateId: memberUpdateInfo ? memberUpdateInfo.id : null,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de salvamento do curso:", error);

        if (error.message === 'Créditos insuficientes para criar um curso.') {
            return res.status(403).json({ error: error.message });
        }
        res.status(500).json({ error: 'Erro interno do servidor ao salvar o curso.', details: error.message });
    }
};