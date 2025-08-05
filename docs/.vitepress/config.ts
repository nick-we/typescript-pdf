import { defineConfig } from 'vitepress'

export default defineConfig({
    title: 'TypeScript PDF',
    description: 'A modern TypeScript library for programmatic PDF generation with a declarative API',

    ignoreDeadLinks: true,

    themeConfig: {
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Guide', link: '/guide/' },
            { text: 'API', link: '/api/' }
        ],

        sidebar: [
            {
                text: 'Getting Started',
                items: [
                    { text: 'Introduction', link: '/guide/' },
                    { text: 'Installation', link: '/guide/installation' },
                    { text: 'Quick Start', link: '/guide/quick-start' }
                ]
            },
            {
                text: 'Guides',
                items: [
                    { text: 'Typography', link: '/typography' },
                    { text: 'Theming', link: '/theming-guide' },
                    { text: 'Tables', link: '/table-guide' },
                    { text: 'MultiPage Documents', link: '/multipage-widget-guide' }
                ]
            }
        ],

        socialLinks: [
            { icon: 'github', link: 'https://github.com/nick-we/typescript-pdf' }
        ],

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2024 Nick Westendorf'
        }
    },

    base: '/typescript-pdf/',

    head: [
        ['link', { rel: 'icon', href: '/typescript-pdf/favicon.ico' }]
    ]
})