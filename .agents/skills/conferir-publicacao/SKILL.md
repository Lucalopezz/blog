---
name: conferir-publicacao
description: Conferir se este site de notas está pronto para publicação, validando testes, build, referências e arquivos gerados. Use em pedidos de revisão antes de publicar; a conferência não implica push ou deploy.
---

# Conferir publicação

Produza uma avaliação com evidências do código, do conteúdo solicitado e do build atual.

## Definir o alcance

- Leia [AGENTS.md](../../../AGENTS.md), [README](../../../README.md) e as seções de conferência e Vercel do [guia](../../../docs/obsidian-guide.md).
- Confira `git status --short` e o diff para identificar o que será publicado e as mudanças preexistentes. Uma revisão de assunto pode limitar a inspeção detalhada a essa pasta; testes e build continuam validando o projeto completo.
- Um pedido de conferência pede diagnóstico. Faça correções quando o usuário também solicitar ajustes ou resolução dos problemas encontrados, respeitando esse alcance.

## Conferir o conteúdo e a saída

1. Use `src/lib/vault-files.mjs` e `src/content.config.ts` como fontes para arquivos suportados, exclusões e IDs. Confira anexos referenciados, datas preenchidas e nomes duplicados que possam tornar referências ambíguas. Não exija metadados ausentes.
2. Se precisar de uma auditoria de referências, processe o Markdown com o pipeline existente ou percorra sua AST, preservando código literal. Uma busca textual serve para triagem, mas não prova a existência de um link nem identifica sozinha um erro. Use `resolveVaultLink()` para a resolução.
3. Execute `pnpm test` e `pnpm build`, registrando falhas e mensagens relevantes. Um build bem-sucedido não comprova que todos os destinos existem: wikilinks ausentes podem virar texto e links Markdown não resolvidos podem permanecer na saída.
4. Inspecione a saída recém-gerada em `dist/`: páginas do alcance solicitado, navegação e anexos. Confira links locais suspeitos e fragmentos contra o destino real; respeite URLs codificadas e não normalize nomes de arquivos por preferência. Arquivos gerados são somente para leitura.
5. Dentro do alcance da revisão de conteúdo, considere as consequências já documentadas: todas as notas carregadas são públicas, `draft: true` não oculta conteúdo e comentários `%%...%%` permanecem visíveis. Aponte ocorrências relevantes sem apagar trechos automaticamente.
6. Quando houver navegador, confira as páginas ou interações afetadas no desktop e em tela estreita. Mermaid precisa dessa verificação no cliente; o build prepara seu código, mas não comprova a renderização de cada diagrama.
7. Confira `package.json`, `astro.config.mjs` e `vercel.json` para confirmar saída estática, comando e pasta de publicação. Só afirme que a integração Git, a branch de produção ou o domínio estão configurados se houver evidência dessas configurações externas.

## Relatar e publicar quando solicitado

Informe se os problemas encontrados impedem a publicação pretendida. Para cada problema, indique arquivo ou URL, evidência e correção sugerida. Separe falhas que interrompem o build de links ausentes e diferenças visuais que podem passar pelo build.

Liste os comandos executados, o alcance da inspeção e qualquer verificação indisponível. Não anuncie checagem completa de tipos sem executar `astro check`, nem deploy validado sem observar seu resultado.

Se o pedido incluir publicação, use a autorização já dada e confira remote, branch e mudanças que entrarão no commit ou push. Evite incluir alterações alheias. Commit é local; push só dispara publicação com a integração Git e a branch configuradas na Vercel. Não altere configurações externas que o pedido não abranja.
