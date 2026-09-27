import path from 'node:path';
import { notesRoot, listVaultFiles, resolveVaultLink, isImage } from '../lib/vault-files.mjs';

export default function remarkObsidian({ root = notesRoot } = {}) {
  return (tree, file) => {
    const current = path.relative(root, String(file.path)).split(path.sep).join('/');
    if (current.startsWith('../')) return;
    const files = listVaultFiles(root);
    const resolve = (target, wiki = false) => resolveVaultLink(target, current, files, wiki);
    // The layout supplies the title. Preserve its anchor for links to the original H1.
    const first = tree.children[0];
    if (first?.type === 'heading' && first.depth === 1) {
      first.depth = 2;
      first.data = { ...first.data, hProperties: { className: ['note-original-title'] } };
    }
    function walk(parent) {
      if (!parent.children || ['code', 'inlineCode', 'html'].includes(parent.type)) return;
      parent.children = parent.children.flatMap(node => {
        if (node.type === 'heading' && node.depth === 1) node.depth = 2;
        if (node.type === 'code' && node.lang === 'mermaid') {
          return { type: 'paragraph', data: { hName: 'pre', hProperties: { className: ['mermaid-source'] } }, children: [{ type: 'text', value: node.value }] };
        }
        if (['link', 'image', 'definition'].includes(node.type)) {
          const result = resolve(node.url);
          if (result) node.url = result.url;
          return node;
        }
        if (node.type !== 'text') { walk(node); return node; }
        const pattern = /(!?)\[\[([^\]\n]+)\]\]/g;
        const parts = [];
        let cursor = 0;
        for (const match of node.value.matchAll(pattern)) {
          if (match.index > cursor) parts.push({ type: 'text', value: node.value.slice(cursor, match.index) });
          const [target, alias] = match[2].split('|');
          const result = resolve(target, true);
          if (!result) {
            file.message(`Nota ou anexo não encontrado: ${target}`);
            parts.push({ type: 'text', value: alias || target });
          } else if (match[1] && isImage(result.file)) {
            const size = alias?.match(/^(\d+)(?:x(\d+))?$/);
            parts.push({ type: 'image', url: result.url, alt: size ? path.basename(result.file) : alias || path.basename(result.file),
              data: size ? { hProperties: { width: Number(size[1]), ...(size[2] ? { height: Number(size[2]) } : {}) } } : undefined });
          } else {
            parts.push({ type: 'link', url: result.url, children: [{ type: 'text', value: alias || target.split('/').at(-1).replace(/\.md$/i, '') }] });
          }
          cursor = match.index + match[0].length;
        }
        if (!parts.length) return node;
        if (cursor < node.value.length) parts.push({ type: 'text', value: node.value.slice(cursor) });
        return parts;
      });
    }
    walk(tree);
  };
}
