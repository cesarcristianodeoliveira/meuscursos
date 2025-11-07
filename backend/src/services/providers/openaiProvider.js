// src/services/providers/openaiProvider.js
const axios = require('axios');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TIMEOUT = Number(process.env.REQUEST_TIMEOUT_MS || 120000);

async function generateCourseOpenAI(payload) {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não configurada');

  // Montar prompt JSON-estruturado (você vai ajustar conforme necessidade)
  const prompt = `
Gere um curso no formato JSON com chaves: title, slug, description, duration, modules.
Cada módulo deve ter: title, description, lessons.
Cada lesson deve ter: title, content, tips (array), exercises (array of {question, answer, options}).
Nível: ${payload.level}
Categoria: ${payload.categoryTitle || payload.categoryId || ''}
Subcategoria: ${payload.subcategoryTitle || payload.subcategoryId || ''}
Tags: ${(payload.tagTitles || []).join(', ')}
Regras: Retorne somente JSON válido.
  `;

  const body = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Você é um gerador de cursos em formato JSON.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7
  };

  const resp = await axios.post('https://api.openai.com/v1/chat/completions', body, {
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    timeout: TIMEOUT
  });

  const content = resp.data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Resposta vazia do OpenAI');

  // Tentar parsear JSON — o provider deve obedecer o request; em produção, fazer sanitização
  try {
    const parsed = JSON.parse(content);
    return parsed;
  } catch (err) {
    // Caso o provider tenha retornado texto com explicação + JSON, tentar extrair JSON
    const jsonMatch = content.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error('Não foi possível parsear JSON retornado pelo OpenAI');
  }
}

module.exports = { generateCourseOpenAI };
