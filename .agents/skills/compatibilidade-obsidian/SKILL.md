---
name: compatibilidade-obsidian
description: Diagnosticar referências e renderização do Obsidian ou ampliar sua compatibilidade neste site Astro. Use para wikilinks, anexos, callouts, Mermaid e outras sintaxes das notas.
---

# Compatibilidade com o Obsidian

Reproduza o problema ou defina a nova sintaxe, faça a adaptação no processamento ou na apresentação e preserve os formatos já suportados.

## Localizar a responsabilidade

Leia [AGENTS.md](../../../AGENTS.md), [README](../../../README.md) e as seções de compatibilidade do [guia do Obsidian](../../../docs/obsidian-guide.md). Consulte as referências oficiais indicadas no AGENTS.md para a parte que será alterada.

| Sintoma ou mudança | Arquivos para começar |
| --- | --- |
| Descoberta de arquivos, URLs, nomes duplicados e referências | `src/lib/vault-files.mjs`, `tests/vault-files.test.mjs` |
| Wikilinks, embeds, títulos e blocos Mermaid no Markdown | `src/plugins/remark-obsidian.mjs`, `tests/obsidian-markdown.test.mjs` |
| Schema, IDs e páginas ou anexos ausentes | `src/content.config.ts`, `src/pages/notes/[...slug].astro`, `src/pages/attachments/[...path].ts` |
| Callouts e realce de código | `astro.config.mjs`, `src/layouts/BaseLayout.astro`, `src/styles/global.css` |
| Diagrama no navegador ou visualização ampliada | `src/components/MermaidDiagrams.astro`, `src/styles/global.css` |

## Diagnosticar e implementar

1. Obtenha o trecho que falha, o caminho da nota e os caminhos dos destinos relevantes. Diferencie referência ausente, nome ambíguo, sintaxe sem suporte e erro de apresentação.
2. Reproduza com uma fixture controlada ou diretório temporário, seguindo os testes existentes. As notas reais de APOO e o vault pessoal não são fixtures editáveis.
3. Para um novo formato, defina o comportamento esperado, a preservação do conteúdo literal e o resultado quando a referência ou renderização falhar. Verifique se a necessidade já é atendida pelos processadores instalados antes de adicionar dependências.
4. Corrija a responsabilidade identificada com uma mudança pequena. A resolução tenta caminho relativo, caminho na raiz da coleção e nome único; ambiguidades devem continuar produzindo erro explicativo. Wikilinks ausentes viram texto e links Markdown não resolvidos permanecem como escritos.
5. Ao alterar resolução, cubra caminhos relativos e completos, duplicatas, espaços, acentos, anexos, fragmentos, destinos ausentes e links externos. Ao alterar Markdown, confira código inline e cercado, imagens com dimensões, callouts simples, aninhados e recolhíveis e blocos Mermaid. Selecione os casos pertinentes à mudança e preserve as verificações existentes.
6. Ao alterar apresentação, mantenha `html.dark`, a ordem do tema de callouts antes dos ajustes locais e o tema escuro de Shiki. Para Mermaid, mantenha importação sob demanda, `securityLevel: 'strict'` e código visível em caso de falha.
7. Execute `pnpm test` e `pnpm build`. Se o resultado indicar cache de Markdown desatualizado, execute `pnpm astro sync --force` e gere o build novamente. Mudanças no navegador também exigem conferência visual quando houver navegador disponível.

## Resultado

Informe a causa ou o novo comportamento, os arquivos alterados e a validação realizada. Atualize README e guia quando o comportamento das notas mudar, mantendo explícitas as limitações restantes.

Não reescreva as notas em massa para contornar o processador. Renomeações ou correções em notas específicas só devem ocorrer quando abrangidas pelo pedido. Não implemente aliases, transclusão, matemática, Canvas ou Dataview apenas por encontrar essas sintaxes durante um diagnóstico.
