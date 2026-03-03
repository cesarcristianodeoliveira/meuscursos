const Groq = require('groq-sdk');
require('dotenv').config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateCourseContent = async (topic) => {
  const AI_MODEL = 'llama-3.3-70b-versatile';
  const AI_PROVIDER = 'Groq';

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Você é um Designer Instrucional Sênior e Engenheiro de Currículos. 
        Crie um curso online de alta retenção no formato JSON seguindo estas diretrizes pedagógicas:

        REGRAS DE ESTRUTURA (ENSINO EFETIVO):
        1. QUANTIDADE: Gere entre 4 a 6 módulos densos.
        2. DENSIDADE: Cada módulo deve ser exaustivo, com mais de 1000 palavras de conteúdo técnico em Markdown (use tabelas, listas, negrito e blocos de código).
        3. EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 5 exercícios de fixação.
        4. PROVA FINAL: Crie uma seção 'finalExam' com 15 perguntas de alta complexidade abrangendo todo o curso.
        5. RESPOSTAS: 
           - Proibido usar prefixos como "A)", "B)", "1.", "2." nas opções.
           - O campo 'correctAnswer' deve ser o texto IDÊNTICO a uma das opções do array 'options'.
        6. CARGA HORÁRIA: 'estimatedTime' deve ser entre 3 e 8 horas.
        7. IMAGEM: 'searchQuery' deve conter 2 substantivos concretos em inglês.

        ESTRUTURA JSON OBRIGATÓRIA:
        {
          "title": "Título Profissional do Curso",
          "categoryName": "Nome da Categoria",
          "pixabay_category": "Categoria Pixabay",
          "searchQuery": "english keywords",
          "description": "Descrição detalhada com objetivos de aprendizagem (+300 caracteres)",
          "estimatedTime": number,
          "rating": 4.9,
          "modules": [
            { 
              "title": "Nome do Módulo", 
              "content": "Conteúdo Markdown vasto e detalhado...",
              "exercises": [
                { "question": "string", "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"], "correctAnswer": "Opção 1" }
              ]
            }
          ],
          "finalExam": [
            { "question": "string", "options": ["O1", "O2", "O3", "O4"], "correctAnswer": "O1" }
          ]
        }
        Responda apenas o JSON puro.`
      },
      { 
        role: 'user', 
        content: `Gere um curso técnico exaustivo, pedagógico e completo sobre o tema: "${topic}".` 
      }
    ],
    model: AI_MODEL,
    temperature: 0.5, // Reduzido para maior precisão em fatos técnicos e respostas
    max_tokens: 8000, // Aumentado significativamente para não cortar o curso no meio
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(completion.choices[0].message.content);
  
  return {
    ...content,
    aiProvider: AI_PROVIDER,
    aiModel: AI_MODEL
  };
};

module.exports = { generateCourseContent };