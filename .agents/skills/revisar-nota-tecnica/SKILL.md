---
name: revisar-nota-tecnica
description: Revisar exatidão técnica, exemplos e clareza didática das notas de estudo deste repositório. Use quando o usuário pedir revisão do conteúdo de uma nota, não para erros de renderização do site.
---

# Revisar uma nota técnica

Confira o conteúdo solicitado, preserve o formato usado no Obsidian e sustente correções técnicas com fontes pertinentes.

## Delimitar a revisão

- Leia [AGENTS.md](../../../AGENTS.md), [README](../../../README.md) e as limitações de conteúdo no [guia](../../../docs/obsidian-guide.md).
- Identifique a nota ou pasta solicitada e o tipo de trabalho: parecer, correção ou reestruturação. Se o usuário pedir apenas uma revisão, apresente os achados; se pedir correções, aplique-as na cópia do repositório.
- Leia a nota completa e, quando necessário, as notas relacionadas. Preserve o idioma, a voz, os termos e a estrutura úteis ao estudo. Ao escrever trechos substanciais no nome do usuário, aplique a skill de estilo de escrita disponível quando pertinente.
- Confira a versão de linguagem, framework ou ferramenta citada. Uma versão das dependências do site não define a versão dos assuntos estudados. Não transforme uma nota histórica em atualização para a versão mais recente sem pedido.

## Conferir o conteúdo

1. Identifique afirmações verificáveis, possíveis erros, simplificações que induzem a erro e lacunas que dificultam entender os exemplos. Dê prioridade ao que muda a compreensão ou a execução do código.
2. Consulte documentação oficial, especificações ou fontes primárias para afirmações duvidosas ou dependentes de versão. Diferencie comportamento garantido, detalhe de implementação e analogia didática. Declare incerteza quando as fontes não sustentarem a conclusão.
3. Para exemplos executáveis cujo resultado seja decisivo para a revisão, use ferramentas já disponíveis e uma pasta temporária. Ajuste a verificação à finalidade do trecho: pseudocódigo e fragmentos incompletos não precisam virar uma aplicação. Não instale runtimes ou dependências sem necessidade concreta.
4. Para uma correção, explique o conceito de forma direta, com exemplos proporcionais à nota. Preserve wikilinks, referências a seções, anexos, callouts e blocos de código. Use sintaxe já suportada pelo site; registre uma limitação relevante em vez de reescrever outras notas para contorná-la.
5. Mantenha o nome do arquivo e das pastas. Renomeações alteram URLs e só devem ocorrer quando fizerem parte do pedido, com conferência dos links afetados. Não invente datas ou torne frontmatter obrigatório. A numeração de leitura das notas de Go é uma convenção dessa pasta.

## Validar e entregar

- Se apenas produzir um parecer, não execute build como substituto da verificação técnica.
- Se alterar notas, execute `git diff --check` e `pnpm build` para conferir Markdown e referências. Execute `pnpm test` também se alterar código da aplicação ou o processamento. Confira no navegador os elementos de apresentação que tenham mudado quando houver navegador disponível.
- Cite as fontes junto às correções técnicas e informe quais exemplos foram executados e em qual versão. Se editar o arquivo, inclua somente os links de fonte úteis à nota; não preencha o texto com registros da revisão.
- Entregue os achados ou mudanças mais relevantes e a validação realizada. Não altere o vault original nem faça commit ou publicação fora do pedido.
