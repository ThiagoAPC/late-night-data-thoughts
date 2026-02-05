import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Late Night Data Thoughts',
  tagline: 'Reflexões noturnas sobre dados, código e tecnologia',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://thiagoapc.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/late-night-data-thoughts/',

  // GitHub pages deployment config.
  organizationName: 'ThiagoAPC',
  projectName: 'late-night-data-thoughts',
  trailingSlash: false,

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: false, // Desabilita docs - é um blog
        blog: {
          showReadingTime: true,
          blogTitle: 'Posts',
          blogDescription: 'Artigos sobre desenvolvimento web, JavaScript, React e muito mais.',
          postsPerPage: 10,
          blogSidebarTitle: 'Arquivo',
          blogSidebarCount: 'ALL',
          feedOptions: {
            type: ['rss', 'atom'],
            xslt: true,
            title: 'Late Night Data Thoughts',
            description: 'Reflexões noturnas sobre dados, código e tecnologia.',
          },
          onInlineTags: 'ignore',
          onInlineAuthors: 'ignore',
          onUntruncatedBlogPosts: 'ignore',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Late Night Data Thoughts',
      hideOnScroll: false,
      items: [
        {to: '/blog', label: 'Posts', position: 'left'},
        {to: '/about', label: 'About', position: 'left'},
        {
          href: 'https://github.com/ThiagoAPC',
          position: 'right',
          className: 'header-github-link',
          'aria-label': 'GitHub',
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Navegação',
          items: [
            {
              label: 'Posts',
              to: '/blog',
            },
            {
              label: 'About',
              to: '/about',
            },
          ],
        },
        {
          title: 'Links',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/ThiagoAPC',
            },
            {
              label: 'Contato',
              href: 'mailto:contato@techblog.com',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Late Night Data Thoughts. Todos os direitos reservados.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
