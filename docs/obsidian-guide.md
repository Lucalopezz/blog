# Do Obsidian para o site

## O fluxo que você vai usar

1. Escreva normalmente no Obsidian.
2. Copie a pasta do assunto, com suas subpastas e anexos, para `src/content/notes/`.
3. Faça commit e push para o repositório conectado à Vercel.
4. A Vercel executa o build e publica as páginas e o menu atualizados.

Você não precisa preencher metadados, converter wikilinks ou mover imagens para `public/`.

Copie as **pastas dos assuntos** (por exemplo, `APOO`, `Banco2` ou `Estudos_Aleatorios`), não a raiz inteira do vault. O vault pode conter `.git`, `.obsidian`, `.trash` e arquivos pessoais. `.obsidian` e `.trash` são ignorados pelo build; metadados `.git` dentro da pasta de notas também são ignorados pelo Git para evitar incluir outro repositório dentro deste.

## Copiar APOO do seu computador

Seu vault foi encontrado em `~/Documentos/Obsidian Vault`. Na raiz deste projeto, execute:

```sh
cp -R "$HOME/Documentos/Obsidian Vault/APOO" src/content/notes/
```

Se `src/content/notes/APOO/` já existir, copie o conteúdo para atualizar os arquivos sem criar outra pasta APOO dentro dela:

```sh
cp -R "$HOME/Documentos/Obsidian Vault/APOO/." src/content/notes/APOO/
```

Esse segundo comando substitui as cópias dos arquivos de mesmo nome no projeto. O `cp` não remove arquivos antigos: se você renomear ou excluir uma nota no Obsidian, remova a cópia antiga do projeto também.

A cópia inicial já foi feita: **8 notas e 35 imagens** de APOO, mantendo suas pastas e conteúdo.

Para copiar várias pastas de assunto de uma vez, informe cada uma e, por último, a pasta de destino:

```sh
cp -R "$HOME/Documentos/Obsidian Vault/APOO" \
  "$HOME/Documentos/Obsidian Vault/Banco2" \
  "$HOME/Documentos/Obsidian Vault/Estudos_Aleatorios" \
  src/content/notes/
```

Você também pode copiar as pastas pelo gerenciador de arquivos. Se o vault já estiver misturado com as pastas do site, não copie novamente a raiz inteira: copie só os diretórios dos assuntos que quer atualizar. `.git`, `.obsidian` e `.trash` não viram notas do site.

## Como fica a navegação

```text
src/content/notes/
└── APOO/
    ├── Aula1/
    │   └── Processos de Software.md
    ├── Aula2/
    │   ├── 1. Modelagem de Software e UML.md
    │   └── 2. CASOS DE USO.md
    ├── Aula8/
    │   └── DDD.md
    └── Imagens/
        └── Pasted image 20260803095808.png
```

O menu mostra APOO e suas aulas como pastas expansíveis. A nota aberta fica destacada. A pasta Imagens serve os anexos e não aparece como um grupo de notas vazio.

As pastas começam fechadas no primeiro acesso. Ao abrir ou fechar pastas, navegar para outra nota ou atualizar a página, o menu mantém suas escolhas e a posição de rolagem durante a sessão da aba (`sessionStorage`). Clique em “Explorar notas” para recolher a lateral e ampliar a área da nota no desktop; o ícone que permanece permite abri-la novamente.

À direita, “Nesta nota” lista automaticamente os títulos do Markdown e destaca o tópico atual conforme você rola a página. Clique em um título para ir àquela seção. Use “Filtrar conteúdo” para buscar no texto ou nos títulos da nota aberta: a lista passa a mostrar as seções correspondentes e trechos do conteúdo, sem modificar o corpo da nota. A busca ignora diferenças de maiúsculas e acentos. Limpe o campo ou pressione `Esc` para voltar ao índice completo. Notas sem subtítulos continuam com o link “Início da nota” e a busca no seu conteúdo.

O índice também pode ser recolhido para dar mais espaço ao conteúdo. A abertura das duas laterais é salva separadamente no navegador (`localStorage`), inclusive ao atualizar a página ou reabrir o site. Sem JavaScript, as laterais continuam recolhíveis e os links continuam navegáveis, mas o filtro e a indicação do tópico atual ficam desativados. Se o armazenamento estiver bloqueado, apenas a persistência fica indisponível.

O arquivo `APOO/Aula8/DDD.md` vira `/notes/APOO/Aula8/DDD/`. Espaços e acentos são preservados e codificados nos links automaticamente. Maiúsculas e minúsculas importam: renomear arquivos ou pastas muda os endereços publicados.

Na pasta `go/`, as notas usam prefixos numéricos nos arquivos e nos títulos para indicar a [ordem de leitura](../README.md#ordem-de-leitura-das-notas-de-go). O menu ordena pelos títulos; quando houver a propriedade `title`, coloque o número nela também. Essa numeração é uma convenção dessas notas, e outras pastas podem continuar sem números ou propriedades. Ao renomear uma nota, atualize também os links que apontam para ela.

Em telas menores, o índice aparece acima da nota; no celular, o explorador também vai para cima do conteúdo. Ambos podem ser recolhidos pelos seus títulos. O tema é escuro por padrão.

## Notas sem configuração

Isto já é uma nota válida:

```md
# Minha anotação

## Conceito

Uma explicação do que aprendi.
```

O título vem, nesta ordem, de `title` nas propriedades, do primeiro título `#` no início da nota, ou do nome do arquivo. O conteúdo aparece abaixo do cabeçalho da página. Um título inicial já usado no cabeçalho não é repetido visualmente.

Se quiser, mantenha propriedades do Obsidian:

```yaml
---
title: Introdução ao DDD
description: Conceitos iniciais de modelagem de domínio.
date: 2026-09-26
updatedDate: 2026-09-26
tags: [ddd, arquitetura]
---
```

Todos esses campos são opcionais. Datas preenchidas devem ser válidas, preferencialmente no formato `YYYY-MM-DD`. Propriedades adicionais podem permanecer no arquivo; a navegação segue as pastas. A propriedade `category` continua aceita, mas não altera a estrutura do menu.

## Links e imagens do Obsidian

Os formatos abaixo são convertidos automaticamente:

```md
[[APOO/Aula8/DDD]]
[[DDD|Conceitos de domínio]]
[[DDD#1. Visão geral do DDD]]
[DDD](../Aula8/DDD.md)
![[Pasted image 20260803095808.png]]
![[Pasted image 20260803095808.png|600]]
![Diagrama](../Imagens/Pasted%20image%2020260803095808.png)
```

A busca tenta um caminho relativo à nota, depois um caminho a partir de `src/content/notes/`, e finalmente um nome único dentro da pasta de notas. Copie também os anexos referenciados e as outras notas que deseja abrir pelo site.

Se duas notas tiverem o mesmo nome e o link curto for ambíguo, use o caminho completo no link. O build informa a ambiguidade em vez de escolher uma nota arbitrariamente. Links para notas ausentes aparecem como texto; referências a nomes definidos somente na propriedade `aliases` não são resolvidas.

Imagens PNG, JPEG, GIF, WebP, AVIF e SVG são publicadas automaticamente, junto com PDFs e arquivos MP3, WAV, OGG, MP4 e WebM. Áudio, vídeo e PDFs podem ser abertos por links; não há player especial do Obsidian.

## Diagramas e diferenças em relação ao Obsidian

Blocos de código têm realce de sintaxe. Blocos com linguagem `mermaid` são renderizados como diagramas no navegador, no tema escuro, com opção para consultar seu código. Se a sintaxe do diagrama for inválida, seu código continua visível.

Os diagramas ocupam toda a largura disponível na coluna da nota. Diagramas largos mantêm sua escala original e permitem rolagem horizontal dentro do bloco, inclusive no celular. Diagramas menores se ampliam para aproveitar a largura do bloco. Em telas de até 1400 pixels, o índice “Nesta nota” fica acima do conteúdo para liberar espaço.

Clique em “Ampliar diagrama” para abrir uma visualização que ocupa quase toda a tela. Use `+` e `−` para ajustar o zoom, “Tamanho original” para voltar a 100% e “Ajustar à largura” para ver toda a extensão horizontal de uma vez. Role dentro dessa visualização para explorar as partes que ultrapassam a área visível. Pressione `Esc` ou clique em “Fechar” para voltar à nota; o foco retorna ao botão que abriu o diagrama. O ajuste é automático e não exige mudanças nos blocos Mermaid do Obsidian.

Este site não executa plugins do Obsidian. Dataview, Canvas, fórmulas matemáticas, backlinks automáticos e referências a blocos `#^id` ainda não têm suporte especial. `![[Outra nota]]` vira um link, sem transcluir o conteúdo. Callouts como `[!warning]`, `[!note]`, `[!tip]` e `[!danger]` são renderizados com ícones e cores no tema escuro. Os modificadores `[!note]-` e `[!note]+` criam blocos recolhíveis. `==destaques==` ainda usa a apresentação básica do Markdown. Comentários `%%...%%` não são ocultados: remova-os das notas que for publicar.

## Conferir no computador

Na raiz do projeto:

```sh
pnpm install
pnpm dev
```

Abra `http://localhost:4321/notes/` ou a porta informada pelo Astro. O menu já inclui APOO. Quando salvar arquivos, o servidor atualiza as notas; se necessário, recarregue a página.

```sh
pnpm astro dev status
pnpm astro dev logs
pnpm astro dev stop
pnpm test
pnpm build
```

O último comando valida as notas e gera o site completo em `dist/`. Para visualizar esse build, use `pnpm preview` e abra o endereço informado. Pare o preview com `Ctrl+C`.

## Configurar a Vercel uma vez

1. Coloque este projeto em um repositório GitHub, GitLab ou Bitbucket.
2. Na Vercel, importe esse repositório como um projeto.
3. Use a raiz do repositório como Root Directory. O `vercel.json` já define Astro, `pnpm build` e a saída `dist`.
4. Configure Node.js 22.12 ou mais recente e confirme qual é a branch de produção, geralmente `main`.
5. Faça o primeiro deploy. Depois, adicione seu subdomínio em Settings → Domains e configure o DNS conforme a Vercel indicar.

A conexão da conta e do repositório com a Vercel precisa ser feita uma vez. O código está preparado, mas esta implementação não criou um projeto na sua conta.

Depois de colocar as alterações iniciais do site no repositório, sua rotina para atualizar notas pode ser:

```sh
git add src/content/notes/
git commit -m "Atualiza notas de APOO"
git push
```

**Commit sozinho é local; é o push para a branch configurada que dispara o deploy.** Consulte a documentação de [deploy por Git da Vercel](https://vercel.com/docs/git).

Todas as notas da pasta são públicas no build. Não existe filtro de rascunhos: `draft: true` não esconde uma nota. Pastas ocultas como `.obsidian` e `.trash` são ignoradas pelo site.
