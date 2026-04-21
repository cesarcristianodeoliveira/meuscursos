export default {
  name: 'enrollment',
  title: 'Matrículas e Progresso',
  type: 'document',
  fieldsets: [
    { name: 'participants', title: 'Vínculos Principais', options: { columns: 2 } },
    { name: 'progressData', title: 'Progresso Detalhado', options: { collapsible: true, collapsed: false } },
    { name: 'assessment', title: 'Avaliação e Certificação', options: { columns: 2 } }
  ],
  fields: [
    { 
      name: 'user',
      title: 'Usuário', 
      type: 'reference', 
      fieldset: 'participants',
      to: [{ type: 'user' }],
      options: { disableNew: true },
      validation: Rule => Rule.required()
    },
    { 
      name: 'course', 
      title: 'Curso', 
      type: 'reference', 
      fieldset: 'participants',
      to: [{ type: 'course' }],
      options: { disableNew: true },
      validation: Rule => Rule.required()
    },
    { 
      name: 'status',
      title: 'Status do Aprendizado', 
      type: 'string',
      options: {
        list: [
          { title: '📖 Em Andamento', value: 'em_andamento' },
          { title: '✅ Concluido', value: 'concluido' }
        ]
      },
      initialValue: 'em_andamento'
    },
    {
      name: 'progress', // Certifique-se de que o backend envie um número para cá
      title: 'Progresso Atual (%)',
      type: 'number',
      description: 'Porcentagem total de conclusão do curso.',
      initialValue: 0,
      validation: Rule => Rule.min(0).max(100)
    },

    // --- PROGRESSO DETALHADO ---
    { 
      name: 'completedLessons',
      title: 'Aulas Concluídas', 
      type: 'array', 
      fieldset: 'progressData',
      of: [
        {
          type: 'object',
          name: 'lessonProgress',
          fields: [
            { name: 'lessonKey', title: 'ID da Lição', type: 'string' },
            { name: 'lessonTitle', title: 'Título da Lição', type: 'string' },
            { name: 'completedAt', title: 'Data de Conclusão', type: 'datetime' }
          ],
          preview: {
            select: { title: 'lessonTitle', date: 'completedAt' },
            prepare({ title, date }) {
              return {
                title: title || 'Lição sem título',
                subtitle: date ? new Date(date).toLocaleDateString() : 'Sem data'
              }
            }
          }
        }
      ]
    },
    { 
      name: 'completedQuizzes',
      title: 'Quizzes de Módulo', 
      type: 'array',
      fieldset: 'progressData',
      of: [
        {
          type: 'object',
          name: 'quizResult',
          fields: [
            { name: 'moduleKey', title: 'ID do Módulo', type: 'string' },
            { name: 'moduleTitle', title: 'Título do Módulo', type: 'string' },
            { name: 'score', title: 'Acertos', type: 'number' },
            { name: 'totalQuestions', title: 'Total de Questões', type: 'number' },
            { name: 'percent', title: 'Aproveitamento (%)', type: 'number' },
            { 
              name: 'isPassed', 
              title: 'Aprovado?', 
              type: 'boolean',
              description: 'Define se este módulo libera o próximo.'
            }
          ],
          preview: {
            select: { title: 'moduleTitle', score: 'score', total: 'totalQuestions', passed: 'isPassed' },
            prepare({ title, score, total, passed }) {
              return {
                title: `${passed ? '✅' : '❌'} Módulo: ${title}`,
                subtitle: `Acertos: ${score}/${total} (${Math.round((score/total)*100)}%)`
              }
            }
          }
        }
      ]
    },

    // --- AVALIAÇÃO FINAL ---
    { 
      name: 'finalScore', 
      title: 'Nota do Exame Final (%)', 
      type: 'number',
      fieldset: 'assessment',
      validation: Rule => Rule.min(0).max(100)
    },
    { 
      name: 'startDate',
      title: 'Data de Início', 
      type: 'datetime',
      fieldset: 'assessment',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'completionDate',
      title: 'Data de Conclusão',
      type: 'datetime',
      fieldset: 'assessment'
    }
  ],
  preview: {
    select: {
      userTitle: 'user.name',
      courseTitle: 'course.title',
      status: 'status',
      finalScore: 'finalScore',
      progress: 'progress'
    },
    prepare({ userTitle, courseTitle, status, finalScore, progress }) {
      const statusEmoji = status === 'concluido' ? '🎓' : '📚';
      const progressValue = typeof progress === 'number' ? progress : 0;
      
      return {
        title: `${statusEmoji} ${userTitle || 'Usuário'} -> ${courseTitle || 'Curso'}`,
        subtitle: `Status: ${status} (${progressValue}%) ${finalScore ? `| Nota Final: ${finalScore}%` : ''}`,
      };
    }
  }
}