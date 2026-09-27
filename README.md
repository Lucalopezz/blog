# Notas de estudo

Site pessoal em Astro + TypeScript, com tema escuro, páginas estáticas e navegação automática por pastas. Copie as notas do Obsidian para `src/content/notes/`, faça commit e push. Depois da configuração inicial da Vercel, cada push na branch de produção publica a nova versão.

## Colocar suas notas

```text
src/content/notes/
├── APOO/
│   ├── Aula1/
│   │   └── Processos de Software.md
│   ├── Aula8/
│   │   └── DDD.md
│   └── Imagens/
│       └── Pasted image 20260803095808.png
└── go/
    └── arrays-vs-slices.md
```

Cada `.md` vira uma página; pastas e subpastas viram grupos expansíveis no menu. Não precisa renomear arquivos com espaços ou acentos, cadastrar páginas ou adicionar frontmatter. Copie pastas de assuntos do vault, não a raiz completa, para evitar trazer metadados pessoais ou um repositório Git aninhado.

A pasta APOO deste projeto foi copiada do seu vault para testar 8 notas e 35 imagens reais. O vault original não é alterado pelo site.

**[Guia de uso com Obsidian e Vercel](docs/obsidian-guide.md)** — copiar notas, atualizar, usar links e configurar publicação.

## Rodar localmente

Requer Node.js 22.12+ e pnpm.

```sh
pnpm install
pnpm dev
```

Abra o endereço informado, normalmente `http://localhost:4321`. O servidor roda em segundo plano, conforme `AGENTS.md`.

```sh
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
pnpm test
pnpm build
pnpm preview
```

## Estrutura do código

| Caminho | Responsabilidade |
| --- | --- |
| `src/content/notes/` | Notas e anexos copiados do Obsidian |
| `src/content.config.ts` | Content Collection; propriedades opcionais e IDs que preservam as pastas |
| `src/lib/notes.ts` | Títulos automáticos e árvore de navegação |
| `src/lib/vault-files.mjs` | Descoberta de arquivos, endereços e resolução dos links |
| `src/plugins/remark-obsidian.mjs` | Converte wikilinks e referências a anexos durante o build |
| `src/components/NotesSidebar.astro` | Menu lateral; recolhível em telas pequenas |
| `src/components/NoteTree.astro` | Pastas expansíveis e destaque da nota aberta |
| `src/components/MermaidDiagrams.astro` | Renderização de diagramas quando presentes |
| `src/layouts/` | Estrutura geral do site e apresentação das notas |
| `src/pages/notes/[...slug].astro` | Uma página estática por nota |
| `src/pages/attachments/[...path].ts` | Gera arquivos estáticos para imagens e outros anexos |
| `src/styles/global.css` | Tema escuro, navegação responsiva e leitura do Markdown |
| `vercel.json` | Preset Astro, comando de build e pasta de saída |

A coleção lê Markdown recursivamente. `getStaticPaths()` gera as páginas, e `render()` transforma as notas em HTML. O menu vem da mesma coleção, portanto acompanha arquivos novos, renomeados e removidos.

Sem backend, banco de dados ou React. O menu usa HTML nativo; os diagramas Mermaid usam JavaScript no navegador, carregado quando há diagramas. Os arquivos finais ficam em `dist/`.

## Metadados opcionais

Se houver `title`, ele será utilizado; caso contrário, o título vem do primeiro `# Título` no começo da nota ou do nome do arquivo. `description`, `date`, `updatedDate` e `tags` também são opcionais. As pastas determinam a navegação, independentemente de `category`.

## Referências

- [Content Collections do Astro](https://docs.astro.build/en/guides/content-collections/)
- [Markdown no Astro](https://docs.astro.build/en/guides/markdown-content/)
- [Deploy por Git na Vercel](https://vercel.com/docs/git)
