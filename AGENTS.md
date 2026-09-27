# Contexto e orientações para agentes

Estas instruções se aplicam a todo o repositório. Leia este arquivo antes de alterar a aplicação. Consulte também o [README](README.md) e o [guia de uso](docs/obsidian-guide.md).

## Objetivo da aplicação

Este é o site pessoal de notas de estudo de um estudante de engenharia de software e desenvolvedor. Ele funciona como uma base de conhecimento técnica, organizada por assuntos e pastas, com navegação semelhante à de uma documentação.

Os assuntos incluem Go, Java, Spring, PHP, Laravel, React, Next.js, NestJS, Rust, Docker, Linux, bancos de dados, redes, arquitetura, DDD e disciplinas da faculdade, como APOO.

O fluxo principal desejado pelo usuário é:

1. Escrever normalmente no Obsidian.
2. Copiar uma pasta de notas, incluindo subpastas e anexos, para `src/content/notes/`.
3. Fazer commit e push para o repositório conectado à Vercel.
4. Ter páginas, anexos e menu atualizados automaticamente no deploy.

**Preserve esse fluxo sem etapas manuais por nota.** Não torne frontmatter obrigatório, não exija cadastrar rotas ou itens de menu e não exija converter os links e imagens já suportados.

A aplicação deve continuar simples, compreensível e fácil de estudar e estender. A interface e a documentação do projeto são em português brasileiro; as notas podem estar em qualquer idioma.

## Stack e decisões de arquitetura

- Astro com TypeScript em modo estrito; consulte `package.json` para as versões instaladas.
- Node.js 22.12 ou mais recente e pnpm. Preserve `pnpm-lock.yaml`; não adicione lockfiles de outros gerenciadores.
- Saída estática (`output: 'static'`), gerada em `dist/`.
- Sem backend, banco de dados, autenticação ou React na implementação atual. Não introduza esses recursos para resolver necessidades que Astro e HTML já atendem.
- Astro Content Collections com o loader `glob()` para descobrir notas recursivamente.
- Markdown processado por `unified()` de `@astrojs/markdown-remark`.
- Plugin local `remark-obsidian` para referências do Obsidian; `rehype-callouts` para callouts.
- Shiki com o tema `github-dark` para realce de código.
- Mermaid renderizado no navegador quando há diagramas. Mantenha a importação sob demanda, `securityLevel: 'strict'` e o código original visível se a renderização falhar.
- Tema escuro por padrão. O menu e os callouts recolhíveis usam HTML nativo, sem framework no cliente.

Prefira componentes Astro e funções pequenas com responsabilidades claras. Adicione dependências quando resolverem uma necessidade concreta; não crie camadas de abstração ou serviços para funcionalidades simples.

## Mapa do projeto

| Caminho | Responsabilidade |
| --- | --- |
| `src/content/notes/` | Conteúdo publicável: notas Markdown e anexos |
| `src/content.config.ts` | Loader, IDs das notas e schema de propriedades opcionais |
| `src/lib/notes.ts` | Títulos, agrupamento por pasta e construção da árvore do menu |
| `src/lib/vault-files.mjs` | Descoberta de arquivos, codificação de URLs e resolução de referências |
| `src/plugins/remark-obsidian.mjs` | Transformações do Markdown do Obsidian durante o processamento |
| `src/layouts/BaseLayout.astro` | Documento HTML, metadados, estilos, cabeçalho, menu e rodapé |
| `src/layouts/NoteLayout.astro` | Título, propriedades e corpo de uma nota |
| `src/components/Header.astro` | Navegação principal |
| `src/components/NotesSidebar.astro` | Consulta da coleção e contêiner do menu |
| `src/components/NoteTree.astro` | Renderização recursiva de pastas e notas |
| `src/components/NoteCard.astro` | Resumo da nota no índice |
| `src/components/MermaidDiagrams.astro` | Renderização dos diagramas e acesso ao código-fonte |
| `src/pages/index.astro` | Apresentação da base de conhecimento |
| `src/pages/notes/index.astro` | Índice agrupado pela estrutura de pastas |
| `src/pages/notes/[...slug].astro` | Páginas estáticas das notas via `getStaticPaths()` e `render()` |
| `src/pages/attachments/[...path].ts` | Geração dos anexos estáticos no build; não é um backend em produção |
| `src/styles/global.css` | Tema, layout responsivo, tipografia e ajustes de callouts |
| `tests/` | Testes de resolução de caminhos e integração do Markdown |
| `public/` | Assets estáticos do próprio site, como o favicon |
| `astro.config.mjs` | Saída estática e configuração dos processadores Markdown |
| `vercel.json` | Preset Astro, comando de build e diretório de saída |
| `docs/obsidian-guide.md` | Guia do usuário para copiar, conferir e publicar notas |

## Contrato de conteúdo e navegação

- A estrutura em `src/content/notes/` determina a navegação. Exemplo: `APOO/Aula8/DDD.md` gera `/notes/APOO/Aula8/DDD/`.
- Preserve nomes, espaços, acentos e maiúsculas das pastas e arquivos. Use `noteUrl()` para construir links; não implemente outra normalização de URLs nos componentes.
- Renomear arquivos ou pastas altera os endereços. Não faça renomeações apenas por preferência de estilo.
- Títulos usam esta ordem: propriedade `title`, primeiro `# Título` no início do corpo, nome do arquivo.
- `title`, `description`, `date`, `updatedDate`, `category` e `tags` são opcionais. Datas preenchidas precisam ser válidas; não invente datas de publicação quando estiverem ausentes.
- `category` pode permanecer como metadado, mas a organização visual vem das pastas.
- A árvore usa ordenação natural em `pt-BR`, destaca a nota atual e abre seus diretórios ancestrais. Pastas contendo apenas anexos não geram grupos vazios de notas.
- Todas as notas carregadas são publicadas. Não há filtro de rascunhos: `draft: true` não esconde conteúdo.
- Pastas ocultas, como `.obsidian` e `.trash`, ficam fora do conteúdo publicado. Preserve as exclusões e não exponha configurações locais do vault.
- Um vault copiado pode trazer seu próprio `.git`. Preserve a exclusão `src/content/notes/**/.git/` no `.gitignore`: sem ela, o Git pode registrar o conteúdo como um repositório aninhado em vez de adicionar os arquivos Markdown ao site.

## Compatibilidade com o Obsidian

A implementação atual suporta:

- Wikilinks como `[[DDD]]`, `[[APOO/Aula8/DDD|Domínio]]` e links para títulos de seção.
- Links Markdown relativos para outras notas e anexos.
- Imagens como `![[imagem.png]]`, inclusive dimensões numéricas como `|600` e `|600x400`.
- Publicação de PNG, JPEG, GIF, WebP, AVIF, SVG, PDF, MP3, WAV, OGG, MP4 e WebM dentro da pasta de notas. Imagens são exibidas; os demais anexos podem ser acessados por links.
- Callouts do Obsidian com ícones, cores, títulos formatados, aninhamento e modificadores recolhíveis `+` e `-`.
- Blocos de código e diagramas Mermaid.

A resolução de referências tenta o caminho relativo à nota, o caminho a partir da raiz da coleção e, por último, um nome único. Referências ambíguas devem produzir erro explicativo, sem escolher silenciosamente um arquivo. Wikilinks ausentes viram texto; links Markdown não resolvidos permanecem como escritos.

Limitações atuais: `aliases` do frontmatter não participa da resolução, `![[Outra nota]]` vira link sem transclusão, e não há suporte especial a Dataview, Canvas, backlinks, matemática, referências de bloco `#^id`, `==destaques==` ou comentários `%%...%%`. Estes comentários não são ocultados.

Ao ampliar a compatibilidade, faça a adaptação no processamento ou na apresentação. Evite reescrever em massa as notas para contornar limitações do site. Preserve conteúdo literal dentro de código e links externos.

## Estilo e experiência de leitura

- Preserve o tema escuro, a legibilidade, o contraste e a largura confortável do conteúdo.
- A classe `dark` no elemento `html` ativa o tema escuro de `rehype-callouts`; `color-scheme: dark` sozinho não substitui essa classe.
- Importe o tema de callouts antes dos ajustes locais. Mantenha a sintaxe `[!warning]` renderizada como callout, não como texto bruto.
- Use as variáveis de cor existentes em `global.css` e preserve o tema escuro do Shiki e do Mermaid.
- O menu fica ao lado do conteúdo no desktop e acima dele, recolhível, em telas menores.
- Preserve navegação por teclado, foco visível, link de pular para o conteúdo e indicação da página atual.
- Código, tabelas e diagramas largos devem permitir rolagem sem ampliar a página inteira.

## Desenvolvimento local

Execute os comandos na raiz do repositório.

```sh
pnpm install
pnpm dev
```

**Ao iniciar o servidor de desenvolvimento, use sempre modo background:** `astro dev --background`. O script `pnpm dev` já faz isso.

Gerencie o processo com:

```sh
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
```

Confira o status antes de abrir outro servidor. Use a URL e a porta informadas pelo Astro, pois a porta padrão pode estar ocupada.

Outros comandos:

```sh
pnpm test
pnpm build
pnpm preview
```

`pnpm preview` serve o último build e não substitui o servidor de desenvolvimento. Se mudanças no processador Markdown não aparecerem por causa de conteúdo em cache, execute `pnpm astro sync --force` e gere o build novamente. Não edite `.astro/`, `dist/` ou `node_modules/` manualmente.

## Validação das alterações

- Para mudanças em rotas, coleção, processamento ou componentes, execute `pnpm test` e `pnpm build`.
- Para alterações apenas na documentação, revise a consistência com o código e execute `git diff --check`; não é necessário reconstruir o site.
- Ao mudar a resolução de links, cubra caminhos relativos, nomes duplicados, espaços, acentos, anexos e referências inexistentes.
- Ao mudar o Markdown, confira que código literal não é convertido e que callouts, imagens, wikilinks e Mermaid continuam funcionando.
- Testes devem usar fixtures controladas ou diretórios temporários, sem depender do vault pessoal instalado no computador.
- Para mudanças visuais, confira desktop e tela estreita quando houver navegador disponível. Diferencie o que foi validado por build/testes do que foi conferido visualmente.
- O build valida o conteúdo e compila o site, mas não substitui uma checagem completa de tipos. Não anuncie `astro check` como executado se ele não foi rodado.

## Conteúdo pessoal e publicação

As notas de APOO são conteúdo real copiado do Obsidian. Não as trate como fixtures descartáveis nem altere seu conteúdo para fazer testes passarem. Trabalhe na cópia dentro do repositório; mudanças no vault original precisam fazer parte do pedido do usuário.

O caminho local do vault está documentado no guia de uso. Ele não é uma dependência do build: o projeto deve compilar na Vercel somente com os arquivos versionados. Não adicione caminhos pessoais absolutos ao código de produção. Oriente o usuário a copiar pastas de assuntos, evitando a raiz inteira do vault e seus diretórios de configuração.

A Vercel usa `pnpm build` e publica `dist/`, sem adapter de servidor. A conexão do repositório, a branch de produção e o domínio são configurações externas; não presuma que estão prontas por existir `vercel.json`.

Um commit é local. O push para a branch de produção configurada dispara o deploy quando a integração Git está conectada. Mantenha essa distinção nas instruções ao usuário.

Atualize README e guia quando o fluxo de publicação ou o comportamento das notas mudar. Não apresente limitações conhecidas como recursos já implementados.

## Documentação de referência

Documentação completa: https://docs.astro.build

Consulte os guias antes de trabalhar nos respectivos assuntos:

- [Páginas, rotas dinâmicas e middleware](https://docs.astro.build/en/guides/routing/)
- [Componentes Astro](https://docs.astro.build/en/basics/astro-components/)
- [Componentes React, Vue, Svelte e outros frameworks](https://docs.astro.build/en/guides/framework-components/)
- [Content Collections](https://docs.astro.build/en/guides/content-collections/)
- [Markdown e processadores](https://docs.astro.build/en/guides/markdown-content/)
- [Estilos e Tailwind](https://docs.astro.build/en/guides/styling/)
- [Internacionalização](https://docs.astro.build/en/guides/internationalization/)
- [Endpoints estáticos](https://docs.astro.build/en/guides/endpoints/)
- [rehype-callouts](https://github.com/lin-stephanie/rehype-callouts)
- [Mermaid](https://mermaid.js.org/config/usage.html)
- [Deploy por Git na Vercel](https://vercel.com/docs/git)
