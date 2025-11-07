// src/utils/validators.js
function validateGeneratePayload(payload) {
  if (!payload.title) return { valid: false, message: 'Título é obrigatório.' };
  if (!payload.categoryId) return { valid: false, message: 'Categoria é obrigatória.' };
  return { valid: true };
}

module.exports = { validateGeneratePayload };
