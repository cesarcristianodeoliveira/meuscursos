export default {
  name: 'certificate',
  title: 'Certificados',
  type: 'document',
  fields: [
    { name: 'user', title: 'Usuário', type: 'reference', to: [{ type: 'user' }] },
    { name: 'course', title: 'Curso', type: 'reference', to: [{ type: 'course' }] },
    { name: 'issueDate', title: 'Data de Emissão', type: 'datetime' },
    { name: 'hash', title: 'Código de Autenticidade', type: 'string' },
    { 
      name: 'canvasData', 
      title: 'Dados do Certificado (JSON)', 
      type: 'text', 
      description: 'Armazena o JSON para renderização via Canvas API' 
    }
  ]
}