import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
    type: 'content',
    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        description: z.string(),
        // Transform string to Date object
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
        author: z.string().default('idktheflag team'),
    }),
});

const docs = defineCollection({
    type: 'content',
    schema: z.object({
        title: z.string(),
        description: z.string(),
    }),
});

export const collections = { blog, docs };
