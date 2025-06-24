// schemas/badge.js
export default {
  name: 'badge',
  title: 'Badge',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Badge Name',
      type: 'string',
      description: 'The display name of the badge (e.g., "First Course Completed", "Community Contributor").',
      validation: Rule => Rule.required().min(3).max(80)
    },
    {
      name: 'slug',
      title: 'Badge Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
        isUnique: true,
      },
      description: 'A unique, URL-friendly identifier for the badge.'
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
      description: 'A brief explanation of what the badge signifies and how it can be earned.',
      validation: Rule => Rule.max(300)
    },
    {
      name: 'icon', // Pode ser uma imagem ou SVG do ícone
      title: 'Badge Icon/Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      validation: Rule => Rule.required(), // Um badge geralmente precisa de um visual
      description: 'The visual representation of the badge.'
    },
    {
      // --- CAMPO RENOMEADO PARA 'mission' ---
      name: 'mission',
      title: 'Badge Mission',
      type: 'array',
      of: [
        { type: 'block' }, // Permite descrever a missão com rich text
      ],
      description: 'The detailed mission or set of conditions that must be completed to earn this badge.'
    },
    {
      // --- NOVO CAMPO PARA RASTREAMENTO DE PROGRESSO ---
      name: 'progressTracking',
      title: 'Progress Tracking Setup',
      type: 'object',
      description: 'Defines how progress for this badge should be tracked (e.g., "Complete X of Y items").',
      fields: [
        {
          name: 'isEnabled',
          title: 'Enable Progress Tracking?',
          type: 'boolean',
          initialValue: false,
          description: 'Turn on if this badge allows users to see their progress towards earning it.'
        },
        {
          name: 'targetValue',
          title: 'Target Value (e.g., Number of courses, posts)',
          type: 'number',
          description: 'The total value required to earn the badge (e.g., 5 courses, 10 posts).',
          hidden: ({ parent }) => !parent?.isEnabled, // Esconde se o rastreamento não estiver habilitado
          validation: Rule => Rule.min(1).required().precision(0).error('Target value must be a positive whole number if tracking is enabled.'),
        },
        {
          name: 'unit',
          title: 'Unit of Progress',
          type: 'string',
          options: {
            list: [
              { title: 'Courses Completed', value: 'coursesCompleted' },
              { title: 'Lessons Completed', value: 'lessonsCompleted' },
              { title: 'Posts Made', value: 'postsMade' },
              { title: 'Comments Posted', value: 'commentsPosted' },
              { title: 'Group Join Count', value: 'groupJoinCount' },
              { title: 'Specific Action Count', value: 'specificActionCount' }, // Para ações mais genéricas
              { title: 'Other', value: 'other' },
            ],
          },
          description: 'The unit of measurement for tracking progress (e.g., courses, posts).',
          hidden: ({ parent }) => !parent?.isEnabled,
          validation: Rule => Rule.required().error('A unit is required if progress tracking is enabled.'),
        },
        {
          name: 'additionalNotes',
          title: 'Additional Notes for Progress',
          type: 'text',
          description: 'Any specific instructions or context for tracking this progress.',
          hidden: ({ parent }) => !parent?.isEnabled,
        },
      ],
      // Adiciona validação para o objeto inteiro se for importante que ele só exista se habilitado
      validation: Rule => Rule.custom((value, context) => {
        if (value?.isEnabled && (!value?.targetValue || !value?.unit)) {
          return 'Target Value and Unit are required if Progress Tracking is enabled.';
        }
        return true;
      }),
    },
    {
      name: 'type', // Para categorizar os badges (e.g., curso, comunidade, evento)
      title: 'Badge Type',
      type: 'string',
      options: {
        list: [
          { title: 'Course Completion', value: 'courseCompletion' },
          { title: 'Community Engagement', value: 'communityEngagement' },
          { title: 'Skill Mastery', value: 'skillMastery' },
          { title: 'Event Participation', value: 'eventParticipation' },
          { title: 'Special Award', value: 'specialAward' },
        ],
        layout: 'radio',
      },
      initialValue: 'courseCompletion',
      validation: Rule => Rule.required(),
      description: 'The category or type of achievement this badge represents.'
    },
    {
      name: 'level', // Se os badges tiverem níveis (ex: Bronze, Prata, Ouro)
      title: 'Badge Level (Optional)',
      type: 'string',
      options: {
        list: [
          { title: 'Bronze', value: 'bronze' },
          { title: 'Silver', value: 'silver' },
          { title: 'Gold', value: 'gold' },
          { title: 'Platinum', value: 'platinum' },
        ],
        layout: 'radio',
      },
      description: 'If badges have different tiers of achievement, specify the level.'
    },
    {
      name: 'associatedCourse', // Se o badge estiver ligado a um curso específico
      title: 'Associated Course (Optional)',
      type: 'reference',
      to: [{ type: 'course' }],
      description: 'The course this badge is specifically awarded for completing.'
    },
    {
      name: 'isHidden', // Para badges que não são públicos ou ainda não lançados
      title: 'Is Hidden?',
      type: 'boolean',
      initialValue: false,
      description: 'If true, this badge will not be displayed publicly until earned or released.'
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'type',
      media: 'icon',
      level: 'level',
      isHidden: 'isHidden',
      progressEnabled: 'progressTracking.isEnabled',
      targetValue: 'progressTracking.targetValue',
      unit: 'progressTracking.unit',
    },
    prepare(selection) {
      const { title, subtitle, media, level, isHidden, progressEnabled, targetValue, unit } = selection;
      const sub = [`Type: ${subtitle || 'N/A'}`];
      if (level) sub.push(`Level: ${level}`);
      if (isHidden) sub.push('(Hidden)');
      if (progressEnabled) sub.push(`Progress: ${targetValue || '?'} ${unit ? unit.replace(/([A-Z])/g, ' $1').trim() : 'Units'}`);

      return {
        title: title || 'New Badge',
        subtitle: sub.join(' - '),
        media: media,
      };
    },
  },
};