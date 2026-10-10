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
    └── 01-arrays-vs-slices.md
```

Cada `.md` vira uma página; pastas e subpastas viram grupos expansíveis no menu. Não precisa renomear arquivos com espaços ou acentos, cadastrar páginas ou adicionar frontmatter. Copie pastas de assuntos do vault, não a raiz completa, para evitar trazer metadados pessoais ou um repositório Git aninhado.

As pastas começam fechadas no primeiro acesso. Durante a sessão da aba, o menu preserva as pastas abertas e sua posição de rolagem ao navegar entre notas ou recarregar a página. O explorador pode ser recolhido também no desktop para dar mais espaço à nota; o ícone da lateral permite abri-lo novamente.

Cada nota tem um índice automático de títulos à direita, com indicação do tópico atual durante a leitura. O campo “Filtrar conteúdo” busca nos títulos e no texto das seções da nota, sem diferenciar maiúsculas ou acentos, e mostra links e trechos dos resultados. O índice também pode ser recolhido. A preferência de abertura de cada lateral é salva no navegador (`localStorage`), inclusive depois de atualizar a página ou reabrir o site. Em telas menores, o índice fica acima da nota.

Diagramas Mermaid aproveitam toda a largura da coluna central, com rolagem interna para manter os textos legíveis nos diagramas largos. “Ampliar diagrama” abre uma visualização que ocupa quase toda a tela, com zoom, tamanho original e ajuste à largura. Use “Fechar” ou `Esc` para voltar à nota. O código do diagrama continua disponível.

A pasta APOO deste projeto foi copiada do seu vault para testar 8 notas e 35 imagens reais. O vault original não é alterado pelo site.

**[Guia de uso com Obsidian e Vercel](docs/obsidian-guide.md)** — copiar notas, atualizar, usar links e configurar publicação.

## Ordem de leitura das notas de Go

As notas de `go/` têm números nos arquivos e nos títulos para seguir esta sequência no menu:

1. [Arrays vs Slices in Go](src/content/notes/go/01-arrays-vs-slices.md)
2. [Concorrência e paralelismo em Go](src/content/notes/go/02-concorrencia-vs-paralelismo.md)
3. [Goroutines em Go](src/content/notes/go/03-goroutines.md)
4. [Channels em Go](src/content/notes/go/04-channels.md)
5. [Race condition, mutex e sync.Map em Go](src/content/notes/go/05-race-condition-mutex-sync-map.md)
6. [Pipelines em Go](src/content/notes/go/06-pipelines.md)
7. [Fan-Out e Fan-In em Go](src/content/notes/go/07-fan-out-fan-in.md)
8. [Estrutura de projetos em Go](src/content/notes/go/08-estrutura-de-projetos.md)

A sequência começa por coleções e fundamentos de concorrência, passa pela comunicação e sincronização e chega aos padrões de processamento. A última nota aplica organização de pacotes e mutex em uma API de tarefas.

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
| `src/components/NotesSidebar.astro` | Explorador recolhível com estado salvo |
| `src/components/NoteOutline.astro` | Índice da nota, filtro por seção e indicação do tópico atual |
| `src/components/NoteTree.astro` | Pastas expansíveis e destaque da nota aberta |
| `src/components/MermaidDiagrams.astro` | Renderização de diagramas quando presentes |
| `src/layouts/` | Estrutura geral do site e apresentação das notas |
| `src/pages/notes/[...slug].astro` | Uma página estática por nota |
| `src/pages/attachments/[...path].ts` | Gera arquivos estáticos para imagens e outros anexos |
| `src/styles/global.css` | Tema escuro, navegação responsiva e leitura do Markdown |
| `vercel.json` | Preset Astro, comando de build e pasta de saída |

A coleção lê Markdown recursivamente. `getStaticPaths()` gera as páginas, e `render()` transforma as notas em HTML. O menu vem da mesma coleção, portanto acompanha arquivos novos, renomeados e removidos.

Sem backend, banco de dados ou React. As laterais e as pastas usam HTML nativo; pequenos scripts guardam suas preferências e ativam o filtro e a indicação do tópico atual. Sem JavaScript, os menus continuam recolhíveis e os links do índice funcionam; o filtro fica oculto. Com armazenamento bloqueado, a navegação e o filtro continuam disponíveis, mas as preferências não são mantidas entre páginas. Os diagramas Mermaid usam JavaScript no navegador, carregado quando há diagramas. Os arquivos finais ficam em `dist/`.

## Metadados opcionais

Se houver `title`, ele será utilizado; caso contrário, o título vem do primeiro `# Título` no começo da nota ou do nome do arquivo. `description`, `date`, `updatedDate` e `tags` também são opcionais. As pastas determinam a navegação, independentemente de `category`.

## Referências

- [Content Collections do Astro](https://docs.astro.build/en/guides/content-collections/)
- [Markdown no Astro](https://docs.astro.build/en/guides/markdown-content/)
- [Deploy por Git na Vercel](https://vercel.com/docs/git)
