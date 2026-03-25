import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        author: z.union([z.string(), z.array(z.string())]).default('idktheflag team'),
    }),
});

const team = defineCollection({
    loader: glob({ pattern: "**/*.md", base: "./src/content/team" }),
    schema: z.object({
        name: z.string(),
        nicknames: z.array(z.string()).default([]),
        pfp: z.string(),
        role: z.string().default('Member'),
        specialties: z.array(z.string()).default([]),
        hobbies: z.array(z.string()).default([]),
        socials: z.array(z.object({
            name: z.string(),
            url: z.string(),
        })).default([]),
        active: z.boolean().default(true),
        order: z.number().default(99),
    }),
});

export const collections = { blog, team };
