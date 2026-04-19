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
      of: [{ type: 'string' }],
      description: 'Lista de IDs (_key) das lições finalizadas'
    },
    { 
      name: 'lastModuleScore',
      title: 'Nota do Último Módulo (%)', 
      type: 'number',
      description: 'Nota persistida dos quizzes de prática (não gera certificado)',
      validation: Rule => Rule.min(0).max(100)
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
      description: 'Preenchido automaticamente ao atingir 80% no exame final'
    }
  ],
  preview: {
    select: {
      userTitle: 'user.name',
      userEmail: 'user.email',
      courseTitle: 'course.title',
      status: 'status',
      finalScore: 'finalScore'
    },
    prepare({ userTitle, userEmail, courseTitle, status, finalScore }) {
      const statusEmoji = status === 'concluido' ? '🎓' : '📚';
      const scoreDisplay = finalScore ? ` | Nota: ${finalScore}%` : '';
      
      return {
        title: `${statusEmoji} ${userTitle || 'Estudante'} -> ${courseTitle || 'Curso'}`,
        subtitle: `${userEmail || 'Sem e-mail'}${scoreDisplay}`,
      };
    }
  }
}