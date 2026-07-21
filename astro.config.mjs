// @ts-check
import { defineConfig, fontProviders } from 'astro/config';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Dominio de producción: base para canonical, sitemap y URLs Open Graph.
  site: 'https://sysifdev.com',
  integrations: [react(), sitemap()],
  adapter: vercel(),

  vite: {
    plugins: [tailwindcss()],
  },

  // Fonts API de Astro (self-hosted, con preload).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Fraunces',
      cssVariable: '--font-fraunces',
      weights: [400, 500, 600, 700, 900],
      styles: ['normal', 'italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Figtree',
      cssVariable: '--font-figtree',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
