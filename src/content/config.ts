import { defineCollection, z } from 'astro:content';

const projects = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      summary: z.string(),
      role: z.string(),
      stack: z.array(z.string()).optional().default([]),
      order: z.number(),
      size: z.enum(['large', 'small']),
      cover: image().optional(),
      badges: z
        .array(z.enum(['new', 'production']))
        .optional()
        .default([]),
      metrics: z
        .array(
          z.object({
            label: z.string(),
            value: z.string(),
          })
        )
        .optional(),
      demoUrl: z.string().url().optional(),
      repoUrl: z.string().url().optional(),
    }),
});

export const collections = { projects };
