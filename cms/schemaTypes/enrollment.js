export default {
  name: 'enrollment',
  title: 'Matrículas e Progresso',
  type: 'document',
  fields: [
    { name: 'student', title: 'Aluno', type: 'reference', to: [{ type: 'user' }] },
    { name: 'course', title: 'Curso', type: 'reference', to: [{ type: 'course' }] },
    { name: 'enrolledAt', title: 'Data da Matrícula', type: 'datetime', initialValue: (new Date()).toISOString() },
    { name: 'completedModules', title: 'Módulos Concluídos', type: 'array', of: [{ type: 'string' }] },
    { name: 'isCompleted', title: 'Curso Finalizado', type: 'boolean', initialValue: false },
    { name: 'finalScore', title: 'Nota no Exame', type: 'number' }
  ]
}