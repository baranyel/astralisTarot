import { defineConfig } from 'vite'
import { CONFIG } from './src/config.js'
const escape = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
export default defineConfig({
  plugins: [
    {
      name: 'astralis-metadata',
      transformIndexHtml: {
        order: 'pre',
        handler(html) {
          return html
            .replaceAll('%ASTRALIS_TITLE%', escape(CONFIG.brand + ' · Tarot'))
            .replaceAll('%ASTRALIS_DESCRIPTION%', escape(CONFIG.description))
            .replaceAll('%ASTRALIS_BRAND%', escape(CONFIG.brand))
            .replace(/%ASTRALIS_STEP_([123])%/g, (_, number) => escape(CONFIG.process[Number(number) - 1]))
            .replaceAll(
              '%ASTRALIS_OG%',
              escape((CONFIG.siteUrl || '').replace(/\/$/, '') + '/og.png'),
            )
        },
      },
    },
    {
      name: 'inline-first-paint-styles',
      apply: 'build',
      enforce: 'post',
      generateBundle(_, bundle) {
        // One small stylesheet serves the entire single-page atlas. Let the first response paint it.
        const entry = bundle['index.html']
        if (!entry || entry.type !== 'asset') return
        entry.source = String(entry.source).replace(
          /<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
          (tag, href) => {
            const css = bundle[href.replace(/^\//, '')]
            return css?.type === 'asset' ? '<style>' + css.source + '</style>' : tag
          },
        )
      },
    },
  ],
})
