export default {
  name: 'enrollment',
  title: 'Matrículas e Progresso',
  type: 'document',
  fields: [
    { 
      name: 'user',
      title: 'Usuário', 
      type: 'reference', 
      to: [{ type: 'user' }],
      validation: Rule => Rule.required()
    },
    { 
      name: 'course', 
      title: 'Curso', 
      type: 'reference', 
      to: [{ type: 'course' }],
      validation: Rule => Rule.required()
    },
    { 
      name: 'status',
      title: 'Status do Aprendizado', 
      type: 'string',
      options: {
        list: [
          { title: '📖 Em Andamento', value: 'em_andamento' },
          { title: '✅ Concluído', value: 'concluido' }
        ]
      },
      initialValue: 'em_andamento'
    },
    { 
      name: 'completedLessons',
      title: 'Aulas Concluídas', 
      type: 'array', 
      description: 'Histórico detalhado de lições assistidas',
      of: [
        {
          type: 'object',
          name: 'lessonProgress',
          fields: [
            { name: 'lessonKey', title: 'ID da Lição', type: 'string' },
            { name: 'lessonTitle', title: 'Título da Lição', type: 'string' },
            { name: 'completedAt', title: 'Data de Conclusão', type: 'datetime' }
          ]
        }
      ]
    },
    { 
      name: 'completedQuizzes',
      title: 'Quizzes de Módulo Concluídos', 
      type: 'array',
      description: 'Resultados dos testes de cada módulo',
      of: [
        {
          type: 'object',
          name: 'quizResult',
          fields: [
            { name: 'moduleKey', title: 'ID do Módulo', type: 'string' },
            { name: 'moduleTitle', title: 'Título do Módulo', type: 'string' },
            { name: 'score', title: 'Acertos', type: 'number' },
            { name: 'totalQuestions', title: 'Total de Questões', type: 'number' },
            { name: 'percent', title: 'Aproveitamento (%)', type: 'number' }
          ]
        }
      ]
    },
    { 
      name: 'finalScore', 
      title: 'Nota do Exame Final (%)', 
      type: 'number',
      description: 'Nota obtida no exame de certificação',
      validation: Rule => Rule.min(0).max(100)
    },
    { 
      name: 'startDate',
      title: 'Data de Início', 
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'completionDate',
      title: 'Data de Conclusão',
      type: 'datetime',
      description: 'Preenchido automaticamente ao concluir o exame final'
    }
  ],
  preview: {
    select: {
      userTitle: 'user.name',
      courseTitle: 'course.title',
      status: 'status',
      finalScore: 'finalScore'
    },
    prepare({ userTitle, courseTitle, status, finalScore }) {
      const statusEmoji = status === 'concluido' ? '🎓' : '📚';
      const scoreDisplay = finalScore ? ` | Nota Final: ${finalScore}%` : '';
      
      return {
        title: `${statusEmoji} ${userTitle} -> ${courseTitle}`,
        subtitle: `Status: ${status}${scoreDisplay}`,
      };
    }
  }
}