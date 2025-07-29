// schemas/course.js
export default {
  name: 'course',
  title: 'Curso',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Título do Curso',
      type: 'string',
      description: 'O título principal do curso.',
      // validation: Rule => Rule.required().min(5).max(120),
    },
    {
      name: 'slug',
      title: 'Slug do Curso',
      type: 'slug',
      options: {
        source: 'title',
        // maxLength: 96,
      },
      description: 'Um identificador único e amigável para URLs do curso.'
    },
    {
      name: 'description',
      title: 'Descrição Curta',
      type: 'text',
      // validation: Rule => Rule.required().min(20).max(500),
      description: 'Uma breve visão geral do que o curso aborda.'
    },
    {
      name: 'mainImage',
      title: 'Imagem Principal do Curso',
      type: 'reference', // ALTERADO PARA REFERÊNCIA
      to: [{ type: 'courseThumbnail' }], // REFERENCIA AO NOVO SCHEMA
      description: 'Uma imagem atraente para representar o curso.'
    },
    {
      name: 'video',
      title: 'Vídeo de Introdução',
      type: 'file',
      options: {
        accept: 'video/mp4, video/webm, video/ogg',
      },
      description: 'Um vídeo introdutório para o curso.'
    },
    {
      name: 'category',
      title: 'Categoria',
      type: 'reference',
      to: [{ type: 'courseCategory' }],
      // validation: Rule => Rule.required(),
      description: 'A categoria principal à qual este curso pertence. Selecionada de categorias predefinidas.'
    },
    {
      name: 'subCategory',
      title: 'Subcategoria',
      type: 'reference',
      to: [{ type: 'courseSubCategory' }],
      // validation: Rule => Rule.required(),
      description: 'A subcategoria específica do curso. Selecionada de subcategorias predefinidas.'
    },
    {
      name: 'courseTags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'courseTag' }] }], 
      description: 'Tags relevantes para o curso para auxiliar na descoberta e filtragem.'
    },
    {
      name: 'level',
      title: 'Nível de Dificuldade',
      type: 'string',
      options: {
        list: [
          { title: 'Iniciante', value: 'beginner' },
          { title: 'Intermediário', value: 'intermediate' },
          { title: 'Avançado', value: 'advanced' },
        ],
        layout: 'radio',
      },
      initialValue: 'beginner',
      // validation: Rule => Rule.required(), 
      description: 'O nível de dificuldade recomendado para este curso.'
    },
    {
      name: 'estimatedDuration',
      title: 'Duração Estimada (em minutos)',
      type: 'number', 
      description: 'O tempo estimado para completar o curso (em minutos).'
    },
    {
      name: 'language',
      title: 'Idioma do Curso',
      type: 'string',
      options: {
        list: [
          { title: 'Português', value: 'pt' },
          { title: 'Inglês', value: 'en' },
        ],
        layout: 'dropdown',
      },
      initialValue: 'pt',
      description: 'O idioma principal do conteúdo do curso.'
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Publicado', value: 'published' },
          { title: 'Rascunho', value: 'draft' },
          { title: 'Pendente', value: 'pending' },
          { title: 'Privado', value: 'private' },
          { title: 'Arquivado', value: 'archived' },
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      description: 'Status atual de publicação do curso.'
    },
    {
      name: 'price',
      title: 'Preço (BRL)',
      type: 'number',
      description: 'Preço do curso em BRL. Defina como 0 para cursos gratuitos.',
      initialValue: 0,
      // validation: Rule => Rule.min(0),
    },
    {
      name: 'isPro',
      title: 'Conteúdo Pro?',
      type: 'boolean',
      initialValue: false,
      description: 'Se verdadeiro, este curso está disponível apenas para membros do plano Pro.'
    },
    {
      name: 'creator',
      title: 'Criador',
      type: 'reference',
      to: [{ type: 'member' }],
      // validation: Rule => Rule.required(),
      description: 'O membro que iniciou a criação deste curso (frequentemente gerado por IA).'
    },
    {
      name: 'lessons',
      title: 'Aulas',
      type: 'array',
      of: [
        {
          type: 'reference',
          to: [{ type: 'lesson' }],
        }
      ],
      description: 'A sequência de aulas que compõem este curso.'
    },
    // --- Campos para Rastreamento da Geração via IA ---
    {
      name: 'aiGenerationPrompt',
      title: 'Prompt de Geração por IA',
      type: 'text',
      description: 'O prompt usado para gerar o conteúdo deste curso via IA. Para rastreamento interno e potencial regeneração.',
    },
    {
      name: 'aiModelUsed',
      title: 'Modelo de IA Usado',
      type: 'string',
      description: 'O modelo de IA específico (ex: gemini-1.5-flash, gpt-4o) usado para a geração de conteúdo.',
      readOnly: true,
    },
    {
      name: 'generatedAt',
      title: 'Gerado Em',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true,
      description: 'Data e hora em que o conteúdo do curso foi gerado inicialmente pela IA.'
    },
    {
      name: 'lastGenerationRevision',
      title: 'Última Revisão de Geração',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true,
      description: 'Data e hora da última vez que o conteúdo do curso foi regenerado ou revisado pela IA.'
    },
  ],
  preview: {
    select: {
      title: 'title',
      categoryTitle: 'category.title',
      subCategoryTitle: 'subCategory.title',
      courseTags: 'courseTags',
      media: 'mainImage.image', // AJUSTADO PARA PEGAR A IMAGEM DA REFERÊNCIA
      status: 'status',
      creatorName: 'creator.name',
    },
    prepare(selection) {
      const { title, categoryTitle, subCategoryTitle, courseTags, media, status, creatorName } = selection;
      const subtitleParts = [];
      if (categoryTitle) subtitleParts.push(categoryTitle);
      if (subCategoryTitle) subtitleParts.push(subCategoryTitle);
      if (courseTags && courseTags.length > 0) {
        subtitleParts.push(`Tags: ${courseTags.length}`);
      }
      if (status) subtitleParts.push(`Status: ${status}`);
      if (creatorName) subtitleParts.push(`Criador: ${creatorName}`);

      return {
        title: title || 'Novo Curso (Título Pendente)',
        subtitle: subtitleParts.join(' - '),
        media: media,
      };
    },
  },
};
