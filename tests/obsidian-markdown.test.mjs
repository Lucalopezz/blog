import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeCallouts from 'rehype-callouts';
import remarkObsidian from '../src/plugins/remark-obsidian.mjs';

const root = mkdtempSync(path.join(tmpdir(), 'notes-markdown-test-'));
after(() => rmSync(root, { recursive: true, force: true }));
for (const name of ['APOO/Aula2/2. CASOS DE USO.md', 'APOO/Aula8/DDD.md', 'APOO/Imagens/Pasted image 20260803095808.png']) {
  mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
  writeFileSync(path.join(root, name), '');
}
const renderer = await createMarkdownProcessor({ remarkPlugins: [[remarkObsidian, { root }]], rehypePlugins: [rehypeCallouts], syntaxHighlight: false });
const fileURL = pathToFileURL(path.join(root, 'APOO/Aula2/2. CASOS DE USO.md'));
test('renderiza imagens do vault e preserva código literal', async () => {
  const { code } = await renderer.render('![[Pasted image 20260803095808.png|300]]\n\n`[[texto literal]]`\n\n```text\n[[texto literal]]\n```', { fileURL });
  assert.match(code, /src="\/attachments\/APOO\/Imagens\/Pasted%20image%2020260803095808.png"/);
  assert.match(code, /width="300"/);
  assert.match(code, /<code>\[\[texto literal\]\]<\/code>/);
  assert.match(code, /<pre[^>]*><code[^>]*>\[\[texto literal\]\]/);
});
test('resolve links para notas reais, relativos e wikilinks', async () => {
  const { code } = await renderer.render('[[APOO/Aula8/DDD|Domínio]]\n\n[DDD](../Aula8/DDD.md)', { fileURL });
  assert.equal((code.match(/href="\/notes\/APOO\/Aula8\/DDD\/"/g) || []).length, 2);
});
test('prepara Mermaid e mantém apenas o título da página como H1', async () => {
  const { code } = await renderer.render('# Título\n\n# Outro título\n\n```mermaid\ngraph LR\nA --> B\n```', { fileURL });
  assert.doesNotMatch(code, /<h1/);
  assert.match(code, /class="mermaid-source"/);
  assert.match(code, /A --(?:>|&#x3E;|&gt;) B/);
});

test('renderiza avisos do Obsidian com ícone e conteúdo preservado', async () => {
  const { code } = await renderer.render('> [!warning]\n> Desenvolvimento iterativo não significa ausência de planejamento.', { fileURL });
  assert.match(code, /data-callout="warning"/);
  assert.match(code, /<svg/);
  assert.match(code, /Desenvolvimento iterativo não significa ausência de planejamento\./);
  assert.doesNotMatch(code, /\[!warning\]/);
});

test('preserva títulos formatados, callouts aninhados e estado recolhível', async () => {
  const { code } = await renderer.render('> [!note]- **Detalhes**\n> [[APOO/Aula8/DDD|Domínio]]\n>\n> > [!tip]+ Dica\n> > Conteúdo interno.', { fileURL });
  assert.match(code, /<details[^>]*data-callout="note"[^>]*>/);
  assert.doesNotMatch(code, /<details[^>]*data-callout="note"[^>]*\bopen/);
  assert.match(code, /<strong>Detalhes<\/strong>/);
  assert.match(code, /href="\/notes\/APOO\/Aula8\/DDD\/"/);
  assert.match(code, /<details[^>]*data-callout="tip"[^>]*\bopen/);
});
