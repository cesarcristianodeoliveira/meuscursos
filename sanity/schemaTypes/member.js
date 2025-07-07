// schemas/member.js
export default {
  name: 'member',
  title: 'Member',
  type: 'document',
  fields: [
    // --- Informações Básicas e de Identificação ---
    {
      name: 'name',
      title: 'Full Name',
      type: 'string',
      validation: Rule => Rule.required().min(3).max(80),
      description: 'The full name of the member, used for profile display and slug generation.'
    },
    {
      name: 'slug',
      title: 'Member Slug',
      type: 'slug',
      options: {
        source: 'name',
      },
      validation: Rule => Rule.required(),
      description: 'A unique, human-readable identifier for the member\'s profile URL (e.g., /member/john-doe).'
    },
    {
      name: 'email',
      title: 'Email Address',
      type: 'string',
      validation: Rule => Rule.required().email().lowercase(),
      description: 'The member\'s unique email address, used for login and notifications.',
      options: {
        isUnique: true
      }
    },
    {
      name: 'password', // Campo para armazenar o HASH da senha
      title: 'Password Hash',
      type: 'string',
      readOnly: true,
      // Adicionado: Validação para o tamanho mínimo da senha (6 dígitos)
      // A validação de 'apenas números' é feita no backend e frontend antes de salvar.
      validation: Rule => Rule.required().min(6), 
      description: 'The hashed and salted password of the member. Should NOT be edited manually. Expected to be 6 numeric digits.'
    },
    {
      name: 'profileImage',
      title: 'Profile Picture',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'Optional profile picture for the member, displayed on their profile.'
    },
    {
      name: 'lastLogin',
      title: 'Last Login Date',
      type: 'datetime',
      options: {
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm',
        calendarTodayLabel: 'Today'
      },
      readOnly: true,
      description: 'The date and time of the member\'s last successful login.'
    },

    // --- Permissões e Planos ---
    {
      name: 'isAdmin',
      title: 'Is Admin?',
      type: 'boolean',
      initialValue: false,
      description: 'Set to true if this member has administrative privileges.'
    },
    {
      name: 'plan',
      title: 'Subscription Plan',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Pro', value: 'pro' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      description: 'The member\'s subscription plan, affecting available features and content access.'
    },
    {
      name: 'stripeCustomerId',
      title: 'Stripe Customer ID',
      type: 'string',
      description: 'The unique ID assigned by Stripe for this customer. Used for managing subscriptions.',
      readOnly: true,
      options: {
        isUnique: true
      }
    },
    {
      name: 'stripeSubscriptionId',
      title: 'Stripe Subscription ID',
      type: 'string',
      description: 'The unique ID of the active Stripe subscription for this member.',
      readOnly: true,
      options: {
        isUnique: true
      }
    },
    {
      name: 'subscriptionStatus',
      title: 'Subscription Status',
      type: 'string',
      options: {
        list: [
          { title: 'Active', value: 'active' },
          { title: 'Trialing', value: 'trialing' },
          { title: 'Past Due', value: 'past_due' },
          { title: 'Canceled', value: 'canceled' },
          { title: 'Unpaid', value: 'unpaid' },
        ],
        layout: 'radio',
      },
      readOnly: true,
      description: 'The current status of the Stripe subscription (e.g., active, trialing, canceled).'
    },

    // --- Progresso Global e Conteúdo Relacionado ---
    {
      name: 'memberLevel',
      title: 'Member Level',
      type: 'number',
      initialValue: 1, // Todos começam no nível 1
      readOnly: true, // Atualizado via backend
      description: 'The overall progression level of the member within the platform.'
    },
    {
      name: 'experiencePoints',
      title: 'Experience Points (XP)',
      type: 'number',
      initialValue: 0,
      readOnly: true, // Atualizado via backend
      description: 'Total experience points accumulated by the member for various activities.'
    },
    {
      // MODIFICAÇÃO: Renomeado de 'geminiCredits' para 'credits'
      // O nome 'geminiCredits' pode ser específico demais se você usar outras APIs de IA no futuro.
      name: 'credits', 
      title: 'AI Generation Credits',
      type: 'number',
      initialValue: 10, // Valor inicial de créditos para novos membros. Ajuste conforme sua política.
      validation: Rule => Rule.min(0), // Créditos não podem ser negativos
      description: 'Available credits for generating content via AI APIs. Can be manually adjusted by Admin or consumed by AI generation features.'
    },
    {
      name: 'createdCourses',
      title: 'Courses Created',
      type: 'array',
      of: [
        { 
          type: 'reference', 
          to: [{ type: 'course' }],
        }
      ],
      description: 'List of courses created by this member.'
    },
    {
      name: 'enrolledCourses',
      title: 'Courses Enrolled',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'course',
              title: 'Course',
              type: 'reference',
              to: [{ type: 'course' }],
            },
            {
              name: 'currentLesson',
              title: 'Current Lesson',
              type: 'reference',
              to: [{ type: 'lesson' }],
              description: 'The last lesson the member was studying in this course.',
            },
            {
              name: 'completedLessons',
              title: 'Completed Lessons',
              type: 'array',
              of: [{ type: 'reference', to: [{ type: 'lesson' }] }], // E aqui.
              description: 'List of lessons completed by the member in this specific course.'
            },
            {
              name: 'progressPercentage',
              title: 'Progress Percentage',
              type: 'number',
              readOnly: true,
              description: 'Overall progress percentage in this specific course (0-100).'
            },
            {
              name: 'enrolledAt',
              title: 'Enrolled At',
              type: 'datetime',
              options: {
                dateFormat: 'YYYY-MM-DD',
                timeFormat: 'HH:mm',
                calendarTodayLabel: 'Today'
              },
              readOnly: true,
              description: 'The date and time the member enrolled in this course.'
            }
          ],
          preview: {
            select: {
              title: 'course.title',
              subtitle: 'progressPercentage',
            },
            prepare(selection) {
              const { title, subtitle } = selection;
              return {
                title: title || 'Course Not Found',
                subtitle: subtitle !== undefined ? `Progress: ${subtitle}%` : 'No progress tracked',
              };
            },
          },
        }
      ],
      description: 'A list of courses the member is currently studying or has completed.'
    },
    {
      name: 'favoriteCourses',
      title: 'Favorite Courses',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }], // Recomendo fraca
      description: 'List of courses favorited by the member for quick access.'
    },
    {
      name: 'createdGroups',
      title: 'Groups Created',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'group' }] }], // Recomendo fraca
      readOnly: true,
      description: 'List of community groups created by this member.'
    },
    {
      name: 'joinedGroups',
      title: 'Groups Joined',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'group' }] }], // Recomendo fraca
      readOnly: true,
      description: 'List of community groups this member belongs to.'
    },

    // --- Conquistas e Interações ---
    {
      name: 'badgesEarned',
      title: 'Badges Earned',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'badge' }] }], // Recomendo fraca
      description: 'List of achievement badges earned by the member through interaction and progress (e.g., "First Course Completed", "Community Contributor").'
    },
    {
      name: 'certificatesAwarded',
      title: 'Certificates Awarded',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'certificate' }] }], // Recomendo fraca
      readOnly: true,
      description: 'List of course completion certificates awarded to the member.'
    },
    {
      name: 'messages',
      title: 'Messages',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'message' }] }], // Recomendo fraca
      readOnly: true,
      description: 'A collection of internal messages or notifications received by the member.'
    },

    // --- Preferências do Usuário ---
    {
      name: 'uiSettings',
      title: 'User Interface Settings',
      type: 'object',
      fields: [
        {
          name: 'themeMode',
          title: 'Theme Mode',
          type: 'string',
          options: {
            list: [
              { title: 'Light', value: 'light' },
              { title: 'Dark', value: 'dark' },
              { title: 'System', value: 'system' },
            ],
            layout: 'radio',
          },
          initialValue: 'system',
          description: 'Preferred visual theme (light, dark, or system default).'
        },
      ],
      description: 'Customizable user interface preferences.'
    },
    {
      name: 'notificationSettings',
      title: 'Notification Settings',
      type: 'object',
      fields: [
        {
          name: 'emailNotifications',
          title: 'Email Notifications',
          type: 'boolean',
          initialValue: true,
          description: 'Receive notifications via email.'
        },
        {
          name: 'inAppNotifications',
          title: 'In-App Notifications',
          type: 'boolean',
          initialValue: true,
          description: 'Receive notifications within the application.'
        },
        {
          name: 'courseUpdates',
          title: 'Course Update Notifications',
          type: 'boolean',
          initialValue: true,
          description: 'Receive notifications about new lessons or course changes.'
        },
        {
          name: 'communityUpdates',
          title: 'Community Update Notifications',
          type: 'boolean',
          initialValue: true,
          description: 'Receive notifications about community activities (e.g., new comments, group invites).'
        }
      ],
      description: 'User preferences for receiving various types of notifications.'
    },
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      media: 'profileImage',
      isAdmin: 'isAdmin',
      plan: 'plan',
      credits: 'credits', // MODIFICADO: De 'geminiCredits' para 'credits'
    },
    prepare(selection) {
      const { title, subtitle, media, isAdmin, plan, credits } = selection;
      return {
        title: title || 'New Member (Name Pending)',
        // MODIFICADO: Atualiza o subtitle para refletir 'credits' e 'isAdmin'
        subtitle: `${subtitle || 'No Email'} ${isAdmin ? '(Admin)' : ''} - Plan: ${plan} - AI Credits: ${credits || 0}`,
        media: media,
      };
    },
  },
};