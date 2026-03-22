import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

const blog = defineCollection({
    // Astro 5 Explicit Glob Loader
    loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
    schema: z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        author: z.string().default('idktheflag team'),
    }),
});
const docs = defineCollection({
    loader: docsLoader(),
    schema: docsSchema(),
});
export const collections = { blog, docs };
