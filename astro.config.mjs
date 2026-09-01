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
  // Manual de identidad VIBA TECH: Space Grotesk (titulares) + Inter (lectura).
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Space Grotesk',
      cssVariable: '--font-space-grotesk',
      weights: [500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.google(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
  ],
});
