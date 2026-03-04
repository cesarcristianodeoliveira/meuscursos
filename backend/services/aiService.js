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
        content: `Você é um Designer Instrucional Sênior e Especialista em EAD. 
        Crie um curso online de alta retenção no formato JSON seguindo estas novas diretrizes:

        REGRAS DE ESTRUTURA E PEDAGOGIA:
        1. QUANTIDADE: Gere entre 4 a 6 módulos densos.
        2. DENSIDADE: Cada módulo deve ser exaustivo, com conteúdo técnico em Markdown (use tabelas, listas e blocos de código).
        3. EXERCÍCIOS: Cada módulo deve conter EXATAMENTE 3 exercícios de fixação de múltipla escolha.
        4. PROVA FINAL: Crie uma seção 'finalExam' com no MÍNIMO 10 e no MÁXIMO 20 perguntas que cubram todo o curso.
        5. RESPOSTAS: 
           - Proibido usar prefixos como "A)", "B)", "1.", "2." nas opções.
           - O campo 'correctAnswer' deve ser o texto EXATAMENTE IDÊNTICO a uma das opções do array 'options'.
        6. RATING: Atribua uma nota de 0.0 a 5.0 baseada na complexidade e utilidade real (ex: 4.2, 4.8). O sistema irá arredondar depois.
        7. IMAGEM: 'searchQuery' deve conter 2 substantivos concretos em inglês para busca de fotos.

        ESTRUTURA JSON OBRIGATÓRIA:
        {
          "title": "Título Profissional do Curso",
          "categoryName": "Nome da Categoria",
          "pixabay_category": "Categoria Pixabay",
          "searchQuery": "english keywords",
          "description": "Descrição detalhada com objetivos de aprendizagem (+300 caracteres)",
          "rating": number,
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
        Responda apenas o JSON puro, sem textos explicativos.`
      },
      { 
        role: 'user', 
        content: `Gere um curso técnico exaustivo, pedagógico e completo sobre o tema: "${topic}".` 
      }
    ],
    model: AI_MODEL,
    temperature: 0.5, 
    max_tokens: 8000, 
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