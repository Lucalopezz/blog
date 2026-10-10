---
name: importar-notas-obsidian
description: Importar ou atualizar pastas de assuntos do Obsidian em src/content/notes, preservando subpastas e anexos. Use para pedidos de cópia ou sincronização de notas neste site.
---

# Importar notas do Obsidian

Copie os assuntos solicitados para a coleção do site e confira o resultado, mantendo o fluxo de publicação sem configuração por nota.

## Contexto e entrada

- Leia [AGENTS.md](../../../AGENTS.md) e a seção de cópia no [guia do Obsidian](../../../docs/obsidian-guide.md). Consulte o [README](../../../README.md) para convenções do assunto.
- Identifique as pastas solicitadas, a origem e o destino. O guia registra uma origem local possível; confirme sua existência e não a transforme em dependência do projeto.
- Se o assunto ou a origem não puderem ser inferidos, solicite apenas a informação necessária. Inspecione somente as pastas relevantes.
- Confira `git status --short` e as diferenças existentes no destino antes de substituir arquivos. Preserve edições locais que não façam parte da importação.

## Copiar e conferir

1. Compare os caminhos relativos e o conteúdo dos arquivos para distinguir adições, alterações e arquivos presentes somente no destino. A existência de um arquivo apenas no destino não comprova que ele foi excluído na origem; pode ser uma nota escrita diretamente no projeto.
2. Copie a pasta do assunto quando ela ainda não existir; quando existir, copie seu conteúdo para evitar estruturas como `APOO/APOO/`. Inclua subpastas, notas e anexos, preservando nomes, acentos e maiúsculas.
3. Exclua da cópia diretórios ocultos de configuração, lixeira e metadados Git. Preserve a exclusão `src/content/notes/**/.git/` no `.gitignore` e não siga links simbólicos para fora do assunto.
4. Aplique as substituições abrangidas pelo pedido. Se houver versões diferentes editadas no projeto e na origem sem evidência de qual deve prevalecer, apresente os arquivos envolvidos e peça a decisão antes de sobrescrevê-los. Prossiga com as cópias independentes.
5. Trate remoções ou renomeações conforme o escopo autorizado. Em uma simples cópia, relate os possíveis arquivos antigos; não faça limpeza automática. Em uma sincronização que inclua exclusões, restrinja-as ao assunto solicitado e confira as referências afetadas.
6. Confira as quantidades de notas e anexos copiados e a estrutura resultante. Para referências suspeitas, use a descoberta e a resolução de `src/lib/vault-files.mjs`; não crie outra normalização de URLs.
7. Execute `pnpm test` e `pnpm build` na raiz. Se uma falha vier de conteúdo fora do assunto importado, relate sua origem sem editar outras notas para fazer o build passar.

## Resultado

Informe os assuntos atualizados, as quantidades de notas e anexos, eventuais conflitos ou cópias antigas e o resultado da validação. Referencie os caminhos no repositório.

Não altere o vault original, acrescente frontmatter obrigatório, converta em massa os links ou cadastre menus. Importar notas não autoriza commit, push ou deploy; execute essas ações quando fizerem parte do pedido. Todas as notas carregadas são publicadas, inclusive as que contêm `draft: true`.
