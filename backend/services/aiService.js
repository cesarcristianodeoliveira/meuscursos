const generateCourseContent = async (topic) => {
  const AI_MODEL = 'llama-3.3-70b-versatile';
  const AI_PROVIDER = 'Groq';

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Você é um Designer Instrucional Sênior especializado em EAD. 
        Seu objetivo é criar um curso gratuito de alta retenção (3 a 8 horas de carga horária).

        DIRETRIZES DE CONTEÚDO:
        1. ESTRUTURA: O curso deve ter de 4 a 6 Módulos.
        2. DENSIDADE: Cada módulo deve ser um tratado técnico exaustivo. Não economize palavras. Use Markdown rico (tabelas, listas, negrito, blocos de código).
        3. EXERCÍCIOS: Gere EXATAMENTE 5 perguntas de múltipla escolha por módulo. 
        4. PROVA FINAL: Gere uma avaliação robusta com 15 perguntas que cubram todo o curso.
        5. QUALIDADE DAS PERGUNTAS: 
           - As opções NÃO devem incluir prefixos como "A)", "B)". Apenas o texto da opção.
           - 'correctAnswer' deve ser EXATAMENTE igual a uma das strings contidas no array 'options'.
        6. CARGA HORÁRIA: Defina 'estimatedTime' entre 3 e 8 horas baseando-se na complexidade.

        ESTRUTURA JSON (ESTRITA):
        {
          "title": "Título Profissional",
          "categoryName": "Nome da Categoria",
          "pixabay_category": "Categoria Pixabay",
          "searchQuery": "2 substantivos em inglês",
          "description": "Descrição detalhada (mínimo 300 caracteres)",
          "estimatedTime": number,
          "rating": 4.9,
          "modules": [
            { 
              "title": "Nome do Módulo", 
              "content": "Conteúdo Markdown extremamente longo e detalhado (+1000 palavras)",
              "exercises": [
                { "question": "Pergunta?", "options": ["Opção 1", "Opção 2", "Opção 3", "Opção 4"], "correctAnswer": "Opção 1" }
              ]
            }
          ],
          "finalExam": [
            { "question": "Pergunta complexa?", "options": ["O1", "O2", "O3", "O4"], "correctAnswer": "O1" }
          ]
        }`
      },
      { 
        role: 'user', 
        content: `Gere um curso COMPLETO, PROFISSIONAL e EXAUSTIVO sobre: "${topic}". Foque em ensinar conceitos profundos e aplicações práticas reais.` 
      }
    ],
    model: AI_MODEL,
    temperature: 0.5, // Menor temperatura = mais precisão nas respostas corretas
    max_tokens: 8000, // Aumentado para suportar o volume de texto solicitado
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(completion.choices[0].message.content);
  return { ...content, aiProvider: AI_PROVIDER, aiModel: AI_MODEL };
};