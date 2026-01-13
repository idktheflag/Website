import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import starlight from '@astrojs/starlight';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  // Your production URL (used for sitemap generation)
  site: 'https://idktheflag.vercel.app',

  // Static output is faster and cheaper (Serverless functions only used if explicitly needed)
  output: 'static',

  // Vercel adapter for optimal build/deploy handling
  adapter: vercel(),

  integrations: [
    // Standard site integrations
    tailwind(),
    mdx(),
    sitemap(),

    // The Wiki Configuration
    starlight({
      title: 'idktheflag Wiki',
      
      // CRITICAL: Mounts the wiki at /wiki so it doesn't overwrite your homepage
      base: '/wiki',
      
      // Social links in the top right of the wiki
      social: {
        github: 'https://github.com/your-org/idktheflag',
        discord: 'https://discord.gg/your-invite-code',
      },

      // Sidebar navigation (Auto-generates from src/content/docs/folder-name)
      sidebar: [
        {
          label: 'Start Here',
          items: [
            // Looks for src/content/docs/general/setup.md
            { label: 'Team Setup', link: '/general/setup/' },
          ],
        },
        {
          label: 'Knowledge Base',
          autogenerate: { directory: 'pwn' },
        },
        {
          label: 'Crypto',
          autogenerate: { directory: 'crypto' },
        },
        {
          label: 'Web Exploitation',
          autogenerate: { directory: 'web' },
        },
      ],

      // Optional: Add custom CSS for the wiki if you want to match the main site theme
      customCss: [],
    }),
  ],
});
