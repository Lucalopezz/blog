import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveVaultLink, noteId, noteUrl } from '../src/lib/vault-files.mjs';

const files = ['APOO/Introdução.md', 'APOO/Conceitos/Classes e Objetos.md', 'APOO/anexos/Diagrama 1.png', 'Outro/Introdução.md'];
test('preserva pastas, espaços e acentos nos endereços', () => {
  assert.equal(noteUrl(noteId(files[1])), '/notes/APOO/Conceitos/Classes%20e%20Objetos/');
});
test('resolve caminhos relativos, completos e nomes únicos do Obsidian', () => {
  for (const target of ['Conceitos/Classes e Objetos', 'APOO/Conceitos/Classes e Objetos', 'Classes e Objetos']) {
    assert.equal(resolveVaultLink(target, files[0], files, true).file, files[1]);
  }
  assert.equal(resolveVaultLink('../Introdução.md', files[1], files).file, files[0]);
});
test('resolve anexos e links Markdown codificados', () => {
  assert.equal(resolveVaultLink('../anexos/Diagrama%201.png', files[1], files).url, '/attachments/APOO/anexos/Diagrama%201.png');
});
test('preserva links externos e endereços já publicados', () => {
  assert.equal(resolveVaultLink('https://go.dev', files[0], files), null);
  assert.equal(resolveVaultLink('/notes/go/arrays-vs-slices/', files[0], files), null);
});
test('links para seções e referências ausentes', () => {
  assert.equal(resolveVaultLink('Classes e Objetos#Exemplo', files[0], files, true).url, '/notes/APOO/Conceitos/Classes%20e%20Objetos/#exemplo');
  assert.equal(resolveVaultLink('Não existe', files[0], files, true), null);
});
test('não escolhe silenciosamente entre nomes duplicados nem sai da pasta', () => {
  assert.throws(() => resolveVaultLink('Introdução', 'Terceiro/nota.md', files, true), /ambíguo/);
  assert.equal(resolveVaultLink('../../../../etc/passwd', files[0], files, true), null);
});
