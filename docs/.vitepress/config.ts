import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Scry',
  description: 'Scry — React dashboards for Home Assistant.',
  cleanUrls: true,
  lastUpdated: true,

  head: [
    ['meta', { name: 'theme-color', content: '#0a0a0f' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Scry' }],
    [
      'meta',
      {
        property: 'og:description',
        content: 'React dashboards for Home Assistant. Five hooks. Native panels. Zero auth.',
      },
    ],
  ],

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/quickstart' },
      { text: 'Hooks', link: '/hooks/useEntity' },
      { text: 'Templates', link: '/templates/' },
      {
        text: '0.x',
        items: [{ text: 'Changelog', link: 'https://github.com/colopisalvatore/ha-react-ui/blob/main/CHANGELOG.md' }],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting started',
          items: [
            { text: 'Quickstart', link: '/guide/quickstart' },
            { text: 'Install via HACS', link: '/guide/install-hacs' },
            { text: 'Local development', link: '/guide/local-dev' },
            { text: 'Build & deploy', link: '/guide/deploy' },
          ],
        },
        {
          text: 'Concepts',
          items: [
            { text: 'Panel vs standalone', link: '/guide/panel-vs-standalone' },
            { text: 'Multi-dashboard', link: '/guide/multi-dashboard' },
            { text: 'Templates', link: '/guide/templates' },
          ],
        },
        {
          text: 'Reference',
          items: [
            { text: 'Services', link: '/guide/services' },
            { text: 'Config flow', link: '/guide/config-flow' },
            { text: 'FAQ', link: '/guide/faq' },
          ],
        },
      ],

      '/hooks/': [
        {
          text: 'Hooks',
          items: [
            { text: 'useEntity', link: '/hooks/useEntity' },
            { text: 'useService', link: '/hooks/useService' },
            { text: 'useHistory', link: '/hooks/useHistory' },
            { text: 'useArea', link: '/hooks/useArea' },
            { text: 'useTheme', link: '/hooks/useTheme' },
          ],
        },
      ],

      '/templates/': [
        {
          text: 'Templates',
          items: [
            { text: 'Overview', link: '/templates/' },
            { text: 'Build your own', link: '/templates/build' },
            { text: 'Jarvis (premium)', link: '/templates/jarvis' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/colopisalvatore/ha-react-ui' },
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: '© 2025–present Salvatore Colopi',
    },

    search: {
      provider: 'local',
    },
  },
});
