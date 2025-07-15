import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@sanity/client';
import { v4 as uuidv4 } from 'uuid';

// --- Configuração da Gemini API ---
// Verifica se a chave da API está definida nas variáveis de ambiente
if (!process.env.GEMINI_API_KEY) {
    console.error("Erro: Variável de ambiente GEMINI_API_KEY não definida em courseController.");
}
// Inicializa o cliente Gemini AI se a chave estiver disponível
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// --- Configuração do Sanity Client ---
// Verifica se as variáveis de ambiente do Sanity estão definidas
if (!process.env.SANITY_PROJECT_ID || !process.env.SANITY_TOKEN) {
    console.error("Erro: Variáveis de ambiente SANITY_PROJECT_ID ou SANITY_TOKEN não definidas em courseController.");
}
// Inicializa o cliente Sanity se as credenciais estiverem disponíveis
const sanityClient = (process.env.SANITY_PROJECT_ID && process.env.SANITY_TOKEN) ? createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET || 'production', // Define o dataset, padrão 'production'
    apiVersion: '2025-06-12', // Usa uma data futura para garantir compatibilidade com as últimas APIs
    useCdn: false, // Desabilita CDN para escritas e leitura de dados frescos
    token: process.env.SANITY_TOKEN, // Token de autenticação para escritas
}) : null;

// --- Função auxiliar para gerar slug amigável para URLs e único ---
const generateSlug = (text) => {
    const normalizedText = text
        .normalize("NFD") // Normaliza caracteres Unicode (ex: 'á' -> 'a')
        .replace(/[\u0300-\u036f]/g, ""); // Remove diacríticos (acentos)

    const baseSlug = normalizedText
        .toLowerCase() // Converte para minúsculas
        .replace(/[^a-z0-9 -]/g, '') // Remove caracteres não alfanuméricos (exceto espaços e hífens)
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-'); // Remove hífens duplicados

    // Adiciona um UUID curto para garantir unicidade, mesmo com textos base idênticos
    return `${baseSlug}-${uuidv4().substring(0, 8)}`; 
};

// Helper para converter string de texto para Portable Text básico (formato Rich Text do Sanity)
const convertToPortableText = (text) => {
    if (!text) return []; // Retorna array vazio se o texto for nulo ou vazio
    // Divide o texto em parágrafos usando quebras de linha duplas
    const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');

    // Mapeia cada parágrafo para um bloco de Portable Text
    return paragraphs.map(p => ({
        _key: uuidv4(), // Garante uma chave única para cada bloco
        _type: 'block', // Tipo de bloco padrão
        children: [
            {
                _key: uuidv4(), // Garante uma chave única para cada span dentro do bloco
                _type: 'span', // Tipo de span (texto inline)
                marks: [], // Marcas de formatação (negrito, itálico, etc.) - vazias para texto simples
                text: p.trim(), // Texto do parágrafo, com espaços em branco removidos do início/fim
            },
        ],
        markDefs: [], // Definições de marcas (links, etc.) - vazias para texto simples
        style: 'normal', // Estilo do bloco (ex: 'normal', 'h1', 'blockquote')
    }));
};

// --- Funções do Controlador de Cursos ---

/**
 * @function generateTags
 * @description Endpoint para gerar sugestões de tags para um curso usando a IA da Gemini.
 * @param {Object} req - Objeto de requisição (contém topic, category, subCategory, level no body).
 * @param {Object} res - Objeto de resposta.
 */
export const generateTags = async (req, res) => {
    // Verifica se o cliente Gemini AI foi inicializado
    if (!genAI) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chave da Gemini API não inicializada.' });
    }

    const { topic, category, subCategory, level } = req.body; 

    // Validação dos dados de entrada
    if (!topic || !category || !subCategory || !level) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria e Nível são necessários para gerar tags.' });
    }

    try {
        // Usar um modelo mais leve como "gemini-1.5-flash" é uma boa prática para tarefas menores como geração de tags
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 

        // Prompt claro para a IA gerar tags no formato JSON
        const prompt = `Gere uma lista de até 10 tags (palavras-chave) em português para um curso com o seguinte tópico principal: "${topic}".
        Considere a categoria de ID "${category}", subcategoria de ID "${subCategory}", e nível de dificuldade "${level}".
        As tags devem ser relevantes, concisas (1-3 palavras por tag), e cobrir os principais temas e áreas de interesse do curso.
        Formate a resposta APENAS como um array JSON de strings, sem nenhum texto introdutório ou explicativo, e sem aspas triplas ('''json) ou outros caracteres extras.
        Exemplo: ["programacao", "javascript", "frontend", "desenvolvimento web", "react", "iniciante"]
        `;

        console.log(`[BACKEND] Gerando tags para o tópico: "${topic}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        // Verifica se a resposta da IA está vazia
        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API ao gerar tags.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado ao gerar tags.' });
        }

        let suggestedTags;
        try {
            // Tenta parsear JSON puro, ou extrai de bloco de código se a IA retornar assim (ex: ```json\n...\n```)
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            // Limpa caracteres problemáticos que a IA às vezes adiciona (aspas "inteligentes", quebras de linha extras)
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, ''); // Remove quebras de linha no início/fim
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"'); // Substitui aspas "inteligentes" por aspas padrão
            
            suggestedTags = JSON.parse(rawJsonString);

            // Valida se o resultado é um array de strings
            if (!Array.isArray(suggestedTags) || suggestedTags.some(tag => typeof tag !== 'string')) {
                throw new Error('Formato de tags sugeridas pela IA inválido: Esperado um array de strings.');
            }
            
            // Normaliza tags para minúsculas e remove duplicatas, garantindo consistência
            suggestedTags = [...new Set(suggestedTags.map(tag => tag.trim().toLowerCase()))];

        } catch (parseError) {
            console.error("[BACKEND] Erro ao parsear JSON das tags da Gemini API:", parseError);
            console.error("[BACKEND] Texto bruto de tags recebido da Gemini (primeiros 500 chars):", text.substring(0, 500) + (text.length > 500 ? '...' : ''));
            return res.status(500).json({ error: 'Erro ao processar a resposta da IA para tags. Formato JSON inválido.', rawText: text });
        }

        // Resposta de sucesso com as tags sugeridas
        res.status(200).json({
            message: 'Tags sugeridas geradas com sucesso!',
            suggestedTags: suggestedTags,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração de tags pela IA:", error);
        
        // --- Tratamento Específico para Serviço Indisponível (503) ---
        // Indica que o modelo da IA está sobrecarregado ou o serviço está temporariamente indisponível
        if (error.response?.status === 503) {
            console.error("[BACKEND] Gemini API: Modelo sobrecarregado ou serviço indisponível (503 Service Unavailable).");
            return res.status(503).json({
                error: "Nosso serviço de IA está sobrecarregado. Por favor, tente gerar as tags novamente em alguns instantes.",
                details: error.message // Inclui os detalhes do erro original para depuração
            });
        }
        // --- Tratamento para Limite de Requisições (429) ---
        // Indica que o limite de requisições à API foi excedido
        if (error.response?.status === 429) { 
            console.error("[BACKEND] Gemini API Rate Limit Excedido (tags):", error.response.data.error);
            return res.status(429).json({ 
                error: "Limite de requisições da IA para tags excedido. Por favor, tente novamente em breve.", 
                details: error.response.data.error.message 
            });
        }
        // --- Tratamento para outros erros da Gemini API (erros 4xx/5xx que não sejam 429/503) ---
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API (tags):", error.response.data.error);
            return res.status(500).json({ 
                error: `Erro da Gemini API ao gerar tags: ${error.response.data.error.message}`, 
                details: error.response.data 
            });
        }
        // --- Erro genérico de servidor ---
        // Para qualquer outro erro não categorizado que ocorra no bloco try
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
    // Verifica se os clientes Gemini AI e Sanity foram inicializados
    if (!genAI || !sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Chaves de API ou Cliente Sanity não inicializados.' });
    }

    // `tags` agora é um array de NOMES de tags (strings), não IDs do Sanity
    const { topic, category, subCategory, level, tags } = req.body; 
    const creatorId = req.user?.id; // Obtém o ID do criador do token JWT

    // Validação dos dados de entrada
    if (!topic || !category || !subCategory || !level || !creatorId) {
        return res.status(400).json({ error: 'Dados incompletos: Tópico, Categoria, Subcategoria, Nível e ID do criador são necessários.' });
    }

    try {
        // Usa o modelo Gemini mais robusto para a geração de conteúdo do curso
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); 

        // Adiciona contexto das tags ao prompt se houver tags selecionadas
        let tagsContext = '';
        if (tags && tags.length > 0) {
            tagsContext = `Considere que o curso deve incorporar as seguintes tags/palavras-chave em seu conteúdo, descrição e títulos de lição: "${tags.join(', ')}".
            As tags devem ser incorporadas de forma a enriquecer o título, a descrição e o conteúdo das lições.
            `;
        }

        // Prompt detalhado para a IA gerar o esquema do curso
        const prompt = `Gere um esquema de curso detalhado em português, garantindo que o **título do curso e os títulos das lições sejam altamente originais e únicos**, mesmo quando os parâmetros iniciais são semelhantes.

        ${tagsContext} O curso deve ser sobre "${topic}", na categoria de ID "${category}" e subcategoria de ID "${subCategory}", e ter um nível de dificuldade "${level}".
        
        Considere uma perspectiva ou abordagem ligeiramente diferente para este curso, tornando-o distintivo e não apenas uma repetição de cursos com temas próximos.
        
        **Varie o início do título do curso e das lições** com diferentes abordagens e sinônimos (ex: "Fluência em Inglês", "Domine o Inglês", "Inglês na Prática", "Guia Completo de Inglês", "Desvende o Inglês", etc. para títulos de curso de inglês). **Evite repetir as mesmas palavras iniciais nos títulos de cursos e lições.**

        O esquema deve conter:
        - Um campo 'title' (string): **Um título altamente criativo, único e atraente** para o curso (idealmente até 10 palavras). Deve refletir claramente o conteúdo gerado com base no tópico, categoria, subcategoria e nível, e destacar a unicidade da abordagem.
        - Um campo 'description' (string): Uma breve descrição concisa (2-3 frases), que também capture o ângulo único do curso.
        - Um campo 'lessons' (array de objetos): Uma lista de **5 a 7 lições essenciais e bem estruturadas**. Cada lição deve ter:
            - 'title' (string): **Um título único e cativante** para a lição, que seja relevante para o curso e não repetitivo em relação a outras lições.
            - 'order' (number): A ordem da lição no curso, começando de 1.
            - 'content' (string): Conteúdo detalhado da lição (3-5 parágrafos de texto corrido, sem formatação Markdown complexa ou HTML). Foque em clareza, profundidade adequada ao nível especificado e exemplos práticos quando aplicável.
            - 'estimatedReadingTime' (number): Tempo estimado de leitura em minutos para esta lição (entre 3 e 15).
        A resposta deve ser APENAS um objeto JSON válido, sem nenhum texto introdutório ou explicativo, e sem aspas triplas ('''json) ou outros caracteres extras.
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

        console.log(`[BACKEND] Gerando pré-visualização para o tópico: "${topic}", categoria: "${category}", subcategoria: "${subCategory}", nível: "${level}"...`);
        const geminiResponse = await model.generateContent(prompt);
        const text = geminiResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;

        // Verifica se a resposta da IA está vazia
        if (!text) {
            console.error("[BACKEND] Resposta vazia ou inesperada da Gemini API.");
            return res.status(500).json({ error: 'A IA retornou uma resposta vazia ou em formato inesperado.' });
        }

        let generatedCourseData;
        try {
            // Tenta extrair e parsear o JSON da resposta da IA
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
            let rawJsonString = jsonMatch ? jsonMatch[1] : text.trim();
            rawJsonString = rawJsonString.replace(/^[\r\n]+|[\r\n]+$/g, '');
            rawJsonString = rawJsonString.replace(/”/g, '"').replace(/“/g, '"');

            generatedCourseData = JSON.parse(rawJsonString);

            // Garante que o slug do curso seja gerado e anexado
            if (generatedCourseData.title) {
                generatedCourseData.slug = {
                    current: generateSlug(generatedCourseData.title),
                    _type: 'slug'
                };
            } else {
                // Fallback para slug se o título não for gerado (improvável com o prompt atual)
                generatedCourseData.slug = { current: `curso-${uuidv4()}`, _type: 'slug' };
            }

            // Garante que os slugs das lições sejam gerados e anexados
            if (generatedCourseData.lessons && Array.isArray(generatedCourseData.lessons)) {
                generatedCourseData.lessons = generatedCourseData.lessons.map(lesson => {
                    if (lesson.title) {
                        lesson.slug = {
                            current: generateSlug(lesson.title),
                            _type: 'slug'
                        };
                    } else {
                        // Fallback para slug da lição
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

        // Adiciona metadados da requisição e da IA aos dados da preview para serem salvos posteriormente
        const responseData = {
            ...generatedCourseData,
            category: category,
            subCategory: subCategory,
            level: level,
            tags: tags, // Continua enviando os NOMES das tags para o frontend
            promptUsed: prompt, // Salva o prompt usado para auditoria/depuração
            aiModelUsed: "gemini-2.0-flash" // Salva o modelo da IA usado
        };

        // Resposta de sucesso com a pré-visualização do curso
        res.status(200).json({
            message: 'Pré-visualização do curso gerada com sucesso!',
            coursePreview: responseData,
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de geração da pré-visualização do curso:", error);
        
        // --- Tratamento para Limite de Requisições (429) ---
        if (error.response?.status === 429) { 
            console.error("[BACKEND] Gemini API Rate Limit Excedido:", error.response.data.error);
            return res.status(429).json({ 
                error: "Limite de requisições da IA excedido para a pré-visualização. Por favor, tente novamente em breve.", 
                details: error.response.data.error.message 
            });
        }
        // --- Tratamento para outros erros da Gemini API ---
        if (error.response && error.response.data) {
            console.error("[BACKEND] Erro da Gemini API:", error.response.data.error);
            return res.status(500).json({ 
                error: `Erro da Gemini API: ${error.response.data.error.message}`, 
                details: error.response.data 
            });
        }
        // --- Erro genérico de servidor ---
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
    // Verifica se o cliente Sanity foi inicializado
    if (!sanityClient) {
        return res.status(500).json({ error: 'Erro de configuração do servidor: Cliente Sanity não inicializado.' });
    }

    console.log('[BACKEND - saveGeneratedCourse] Dados recebidos na requisição:', JSON.stringify(req.body, null, 2));

    const { 
        courseData,       // Dados do curso gerados pela IA (título, descrição, lições, etc.)
        category,         // ID da categoria principal do curso (para referenciar no Sanity)
        subCategory,      // ID da subcategoria do curso (para referenciar no Sanity)
        level,            // Nível de dificuldade do curso
        tags              // Array de NOMES de tags (strings) selecionadas pelo usuário
    } = req.body; 

    // Extrai informações do prompt e modelo da IA que foram anexadas à preview
    const aiGenerationPromptFromPreview = courseData.promptUsed || ''; 
    const aiModelUsedFromPreview = courseData.aiModelUsed || 'gemini-2.0-flash';

    const creatorId = req.user?.id; // Obtém o ID do criador do token JWT

    // Validação dos dados de entrada cruciais
    if (!courseData || !creatorId || !category || !subCategory || !level || !Array.isArray(tags)) {
        return res.status(400).json({ error: 'Dados incompletos para salvar o curso. Verifique courseData, category, subCategory, level, tags (array) e creatorId.' });
    }

    console.log('[BACKEND - saveGeneratedCourse] Conteúdo de courseData:', JSON.stringify(courseData, null, 2));
    console.log('[BACKEND - saveGeneratedCourse] Prompt de Geração da IA (a ser salvo):', aiGenerationPromptFromPreview);
    console.log('[BACKEND - saveGeneratedCourse] Modelo de IA Usado (a ser salvo):', aiModelUsedFromPreview);
    console.log('[BACKEND - saveGeneratedCourse] Tags recebidas (nomes):', tags);

    let transaction; // Variável para armazenar a transação do Sanity

    try {
        // Busca as informações do membro para verificar créditos e status de admin
        const member = await sanityClient.fetch(
            `*[_id == $creatorId][0]{isAdmin, credits}`,
            { creatorId }
        );

        if (!member) {
            throw new Error(`Membro com ID ${creatorId} não encontrado.`);
        }

        let updatedCredits = member.credits;
        const isMemberAdmin = member.isAdmin === true; 

        // Lógica de consumo de créditos: apenas se não for admin
        if (!isMemberAdmin) {
            if (member.credits <= 0) {
                throw new Error('Créditos insuficientes para criar um curso.');
            }
            updatedCredits = member.credits - 1; // Decrementa 1 crédito
            console.log(`[BACKEND] Créditos antes: ${member.credits}, Créditos depois: ${updatedCredits} para o membro ${creatorId}`);
        } else {
            console.log(`[BACKEND] Usuário Admin ${creatorId} está criando um curso. Nenhum crédito consumido.`);
        }

        // --- Lógica para garantir slug único para o curso principal ---
        let initialCourseSlug = courseData.slug.current;
        let finalCourseSlug = initialCourseSlug;
        let slugIsUnique = false;
        let attempt = 0;
        const MAX_SLUG_ATTEMPTS = 5; // Limite de tentativas para gerar um slug único

        while (!slugIsUnique && attempt < MAX_SLUG_ATTEMPTS) {
            // Verifica se o slug já existe no Sanity
            const existingCourse = await sanityClient.fetch(
                `*[_type == "course" && slug.current == $slug][0]{_id}`,
                { slug: finalCourseSlug }
            );

            if (!existingCourse) {
                slugIsUnique = true; // Slug é único
            } else {
                attempt++;
                console.warn(`[BACKEND] Slug "${finalCourseSlug}" já existe no Sanity. Tentando gerar um novo (tentativa ${attempt}).`);
                // Gera um novo slug adicionando um UUID mais curto
                finalCourseSlug = `${generateSlug(courseData.title)}-${uuidv4().substring(0, 4)}`; 
            }
        }

        // Se não conseguir um slug único após várias tentativas, lança um erro
        if (!slugIsUnique) {
            throw new Error('Falha ao gerar um slug único para o curso após múltiplas tentativas. Por favor, tente um tópico diferente para o curso.');
        }

        // Objeto slug formatado para o Sanity
        const courseSlugForSanity = {
            _type: 'slug',
            current: finalCourseSlug,
        };

        const courseId = `course-${uuidv4()}`; // ID único para o novo curso
        const lessonRefs = []; // Array para armazenar referências às lições criadas
        let totalEstimatedDuration = 0; // Para calcular a duração total do curso

        transaction = sanityClient.transaction(); // Inicia uma nova transação no Sanity

        // --- Patch: Atualiza os créditos do membro e adiciona o curso criado à lista do membro ---
        transaction.patch(creatorId, (patch) => {
            return patch
                .set({ credits: updatedCredits }) // Atualiza o contador de créditos
                .setIfMissing({ createdCourses: [] }) // Garante que o array `createdCourses` exista
                .append('createdCourses', [{ 
                    _ref: courseId, // Referência ao ID do curso recém-criado
                    _type: 'reference',
                    _key: uuidv4(), // Key é importante para itens em arrays de Portable Text e referências
                }]);
        });
        console.log(`[BACKEND] Transação iniciada. Membro ${creatorId} será atualizado e o curso será adicionado.`);

        // --- Loop para criar cada lição e adicionar à transação ---
        for (const lesson of courseData.lessons) {
            const lessonSlug = lesson.slug; // Slug da lição gerado na preview
            const lessonId = `lesson-${uuidv4()}`; // ID único para a nova lição

            const newLesson = {
                _id: lessonId,
                _type: 'lesson',
                title: lesson.title,
                slug: lessonSlug,
                content: convertToPortableText(lesson.content), // Converte o conteúdo para Portable Text
                order: lesson.order,
                estimatedReadingTime: lesson.estimatedReadingTime || 5, // Valor padrão de 5 minutos
                status: 'published', // Define o status padrão como publicado
                course: {
                    _ref: courseId, // Referência ao curso pai
                    _type: 'reference',
                },
            };

            transaction.create(newLesson); // Adiciona a criação da lição à transação
            lessonRefs.push({
                _key: uuidv4(), 
                _ref: lessonId,
                _type: 'reference',
            });
            totalEstimatedDuration += (lesson.estimatedReadingTime || 0); // Soma a duração estimada
            console.log(`[BACKEND] Lição "${lesson.title}" adicionada à transação (ID: ${lessonId}).`);
        }

        // --- Processamento das Tags: Busca existentes ou cria novas e as associa ao curso ---
        const courseTagRefs = []; // Array para armazenar referências às tags do curso
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                const normalizedTagName = tagName.trim().toLowerCase();

                // Busca por tags existentes pelo nome normalizado no Sanity
                const existingTag = await sanityClient.fetch(
                    `*[_type == "courseTag" && name == $tagName][0]{_id}`,
                    { tagName: normalizedTagName }
                );

                let tagRefId;
                if (existingTag) {
                    tagRefId = existingTag._id; // Usa o ID da tag existente
                    console.log(`[BACKEND] Tag existente encontrada: "${normalizedTagName}" (ID: ${tagRefId}).`);
                } else {
                    // Se a tag não existe, cria um novo documento `courseTag`
                    const newTagId = `courseTag-${uuidv4()}`;
                    const newTagSlug = { 
                        _type: 'slug',
                        current: generateSlug(normalizedTagName),
                    };

                    const newTagDocument = {
                        _id: newTagId,
                        _type: 'courseTag',
                        name: normalizedTagName, 
                        slug: newTagSlug,
                        description: `Tag gerada automaticamente para o tópico: ${normalizedTagName}.`,
                        // --- Adiciona a categoria principal do curso à nova tag ---
                        categories: [
                            {
                                _ref: category, // Usa o ID da categoria do curso para associar à tag
                                _type: 'reference',
                                _key: uuidv4() 
                            }
                        ]
                    };
                    
                    transaction.create(newTagDocument); // Adiciona a criação da nova tag à transação
                    tagRefId = newTagId;
                    console.log(`[BACKEND] Nova tag criada e adicionada à transação: "${normalizedTagName}" (ID: ${newTagId}).`);
                }

                // Adiciona a referência da tag (existente ou nova) à lista do curso
                courseTagRefs.push({
                    _ref: tagRefId,
                    _type: 'reference',
                    _key: uuidv4(), 
                });
            }
        }

        // --- Cria o documento do curso principal ---
        const newCourse = {
            _id: courseId,
            _type: 'course',
            title: courseData.title,
            description: courseData.description,
            slug: courseSlugForSanity,
            lessons: lessonRefs, // Referências às lições criadas
            status: 'published', // Status inicial do curso
            price: 0, // Preço padrão (ajustável no Sanity Studio)
            isProContent: false, // Define se é conteúdo Pro
            level: level, 
            estimatedDuration: totalEstimatedDuration, 
            creator: {
                _ref: creatorId, 
                _type: 'reference',
            },
            category: { _ref: category, _type: 'reference' }, 
            subCategory: { _ref: subCategory, _type: 'reference' }, 
            courseTags: courseTagRefs, // Referências às tags (existentes ou recém-criadas)
            aiGenerationPrompt: aiGenerationPromptFromPreview, // Salva o prompt original da IA
            aiModelUsed: aiModelUsedFromPreview, // Salva o modelo de IA usado
            generatedAt: new Date().toISOString(), // Data de geração
            lastGenerationRevision: new Date().toISOString(), // Data da última revisão (neste caso, geração)
        };

        transaction.create(newCourse); // Adiciona a criação do curso à transação
        console.log(`[BACKEND] Curso "${newCourse.title}" adicionado à transação (ID: ${courseId}).`);

        console.log("[BACKEND] Transação preparada para criar curso, lições, tags (se novas) e ATUALIZAR membro. Executando commit...");

        // --- Confirma a transação no Sanity ---
        // Isso executa todas as operações (criação de lições, tags, curso e atualização do membro) atomicamente
        const transactionResult = await transaction.commit(); 
        
        console.log(`[BACKEND] Transação concluída com sucesso! Documentos criados e atualizados:`, transactionResult);

        // Encontra o resultado da atualização do membro para retorno no frontend
        const memberUpdateInfo = transactionResult.results.find(
            r => r.id === creatorId && r.operation === 'update'
        );

        // Resposta de sucesso
        res.status(201).json({
            message: 'Curso, lições e tags salvos com sucesso! Créditos e cursos do membro atualizados.',
            course: newCourse, // Retorna os dados do curso criado
            lessons: courseData.lessons, // Retorna as lições (útil para o frontend para confirmar a estrutura)
            memberUpdateId: memberUpdateInfo ? memberUpdateInfo.id : null, // ID do membro atualizado
        });

    } catch (error) {
        console.error("[BACKEND] Erro no processo de salvamento do curso:", error);
        
        // --- Tratamento de erros específicos com mensagens amigáveis ---
        if (error.message === 'Créditos insuficientes para criar um curso.') {
            return res.status(403).json({ error: error.message }); 
        }
        if (error.message.includes('Membro com ID') && error.message.includes('não encontrado')) {
            return res.status(404).json({ error: error.message }); 
        }
        if (error.message.includes('Falha ao gerar um slug único')) {
            return res.status(500).json({ error: error.message }); 
        }
        // Erros vindos diretamente do Sanity API (ex: problemas de esquema, autenticação)
        if (error.statusCode) { 
            console.error("[BACKEND] Erro do Sanity:", error.message);
            return res.status(500).json({ error: `Erro do Sanity CMS: ${error.message}`, details: error });
        }
        // Erro genérico para qualquer outra exceção não tratada
        res.status(500).json({ error: 'Falha interna ao salvar o curso.', details: error.message });
    }
};