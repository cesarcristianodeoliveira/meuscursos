const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateCourseContent = async (topic) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Você é um Engenheiro de Currículos Educacionais Sênior. Sua função é criar materiais didáticos exaustivos e técnicos sobre qualquer tema solicitado.

        REGRAS DE OURO (IDENTIDADE):
        1. IDIOMA: Português (Brasil).
        2. TÍTULO: Autoritário e técnico. Proibido: "Guia", "Curso", "Masterclass", "Arte de", "Básico", "Mestre".
        3. CATEGORIZAÇÃO: 'site_category' (nicho em PT-BR) e 'pixabay_category' (escolha a que melhor se encaixa na lista oficial do Pixabay).
        4. BUSCA VISUAL (searchQuery): Escreva obrigatoriamente 2 substantivos concretos em INGLÊS que definam o objeto físico principal do tema. NUNCA use adjetivos ou frases.

        REGRAS DE MARKDOWN (ESTRUTURAÇÃO RÍGIDA):
        - Módulos densos: Mínimo 3 parágrafos explicativos por módulo.
        - Hierarquia: Use ## para títulos e ### para subtópicos internos.
        - QUEBRAS DE LINHA: Use obrigatoriamente duas quebras de linha (\\n\\n) para separar parágrafos, tabelas e blocos de código.
        - TABELAS: Devem conter cabeçalho, linha separadora (| --- |) e dados alinhados. Cada linha deve ser uma nova linha real.
        - CITAÇÕES (>): Use para destacar conceitos teóricos ou avisos importantes.
        - BLOCOS DE CÓDIGO ( \`\`\` ): Use para listar processos passo-a-passo ou checklists numerados.

        ESTRUTURA JSON:
        {
          "title": "string",
          "site_category": "string",
          "pixabay_category": "string",
          "searchQuery": "string",
          "description": "string",
          "modules": [
            { "title": "string", "content": "string" }
          ]
        }
        Responda apenas o JSON puro, sem textos introdutórios ou conclusivos.`
      },
      { 
        role: 'user', 
        content: `Gere uma especialização técnica exaustiva, com conteúdo denso e detalhado sobre o tema: "${topic}".` 
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
};

module.exports = { generateCourseContent };