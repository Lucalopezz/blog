// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeCallouts from 'rehype-callouts';
import remarkObsidian from './src/plugins/remark-obsidian.mjs';

export default defineConfig({
  output: 'static',
  markdown: {
    shikiConfig: { theme: 'github-dark' },
    processor: unified({
      remarkPlugins: [remarkObsidian],
      rehypePlugins: [rehypeCallouts],
    }),
  },
});
