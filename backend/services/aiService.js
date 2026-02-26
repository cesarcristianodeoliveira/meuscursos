const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateCourseContent = async (topic) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Você é um Engenheiro de Currículos Educacionais Sênior. Sua função é criar materiais didáticos exaustivos, técnicos e visualmente organizados.

        REGRAS DE OURO:
        1. IDIOMA: Português (Brasil). Proibido estrangeirismos.
        2. TÍTULO: Autoritário e original. Proibido: "Guia", "Curso", "Masterclass", "Arte de", "Básico", "Mestre".
        3. CATEGORIZAÇÃO: 'site_category' em português, 'pixabay_category' da lista oficial.
        4. BUSCA VISUAL: Apenas 2 palavras em inglês (objetos físicos).

        REGRAS DE DENSIDADE E MARKDOWN (ESTRITO):
        - Cada módulo deve ter pelo menos 3 parágrafos explicativos antes de usar elementos visuais.
        - Use ## para seções e ### para sub-tópicos detalhados.
        - TABELAS: Use para comparar vantagens/desvantagens, tipos ou métricas.
        - CITAÇÕES (>): Use para destacar "A Visão do Especialista" ou "Ponto de Atenção".
        - CÓDIGO (\`\`\b): Use para listar checklists, scripts, fórmulas ou processos numerados.
        - PROIBIDO: Módulos com apenas 1 ou 2 frases. Desenvolva o raciocínio técnico.

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
        Responda apenas o JSON puro.`
      },
      { 
        role: 'user', 
        content: `Gere uma especialização técnica exaustiva, com conteúdo denso e detalhado sobre: "${topic}".` 
      }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.65, // Reduzi um pouco para manter a IA focada e menos "vaga"
    max_tokens: 4000,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
};

module.exports = { generateCourseContent };