// schemas/courseCategory.js
export default {
  name: 'courseCategory',
  title: 'Course Category',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Category Title',
      type: 'string',
      description: 'The main title of the course category (e.g., "Technology", "Business", "Health & Wellness").',
      // validation: Rule => Rule.required().min(3).max(80)
    },
    {
      name: 'slug',
      title: 'Category Slug',
      type: 'slug',
      options: {
        source: 'title',
        // maxLength: 96,
      },
      description: 'A unique, URL-friendly identifier for the course category.'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'A brief description of what courses this category includes.',
    },
    {
      name: 'image',
      title: 'Category Image (Optional)',
      type: 'image',
      options: {
        hotspot: true,
      },
      description: 'An optional image to represent the course category.'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
      media: 'image',
    },
    prepare(selection) {
      const { title, subtitle, media } = selection;
      return {
        title: title || 'New Course Category',
        subtitle: subtitle ? `${subtitle.substring(0, 50)}...` : 'No description',
        media: media,
      };
    },
  },
};