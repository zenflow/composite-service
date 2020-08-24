module.exports = {
  title: 'composite-service',
  tagline: 'Helps you run multiple services as one',
  url: 'https://zenflow.github.io',
  baseUrl: '/composite-service/',
  favicon: 'img/favicon.ico',
  organizationName: 'zenflow',
  projectName: 'composite-service',
  themeConfig: {
    navbar: {
      title: 'composite-service',
      logo: {
        alt: 'composite-service logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/intro',
          label: 'Intro',
          position: 'right',
        },
        {
          to: 'docs/guides/getting-started',
          label: 'Guides',
          position: 'right',
        },
        {
          to: 'docs/api/composite-service',
          label: 'API',
          position: 'right',
        },
        {
          href: 'https://github.com/zenflow/composite-service',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://www.npmjs.com/package/composite-service',
          label: 'npm',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: 'docs/intro',
            },
            {
              label: 'Getting Started',
              to: 'docs/guides/getting-started',
            },
            {
              label: 'API Reference',
              to: 'docs/api/composite-service',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/zenflow/composite-service',
            },
            {
              label: 'npm',
              href: 'https://www.npmjs.com/package/composite-service',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Matthew Francis Brunetti`,
    },
    googleAnalytics: {
      trackingID: 'UA-62288007-1',
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          path: '../docs',
          // homePageId: 'intro',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl:
            'https://github.com/zenflow/composite-service/edit/main/website/',
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
}
