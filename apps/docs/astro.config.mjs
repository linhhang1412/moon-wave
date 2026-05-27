import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    starlight({
      title: 'moon-wave',
      description: 'AI agent framework for Cloudflare Workers',
      logo: {
        light: './src/assets/logo-light.svg',
        dark: './src/assets/logo-dark.svg',
        replacesTitle: false,
      },
      social: {
        github: 'https://github.com/linhhang1412/moon-wave',
      },
      editLink: {
        baseUrl: 'https://github.com/linhhang1412/moon-wave/edit/main/apps/docs/',
      },
      sidebar: [
        { label: 'Getting Started', autogenerate: { directory: 'getting-started' } },
        { label: 'Guides', autogenerate: { directory: 'guides' } },
        { label: 'Providers', autogenerate: { directory: 'providers' } },
        { label: 'API Reference', autogenerate: { directory: 'api' } },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
});
