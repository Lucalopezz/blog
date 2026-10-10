---
name: revisar-interface-notas
description: Revisar ou ajustar leitura, navegação e responsividade deste site de notas. Use para laterais, árvore de pastas, índice, filtro de seções, acessibilidade e apresentação de código, tabelas ou Mermaid.
---

# Revisar a interface das notas

Confira a experiência de leitura e aplique os ajustes solicitados usando os componentes Astro, HTML nativo e estilos existentes.

## Preparar a revisão

- Leia [AGENTS.md](../../../AGENTS.md), [README](../../../README.md) e a descrição atual da navegação no [guia](../../../docs/obsidian-guide.md).
- Localize o comportamento em `src/layouts/BaseLayout.astro`, `src/layouts/NoteLayout.astro`, `src/components/NotesSidebar.astro`, `src/components/NoteTree.astro`, `src/components/NoteOutline.astro`, `src/components/MermaidDiagrams.astro` e `src/styles/global.css`, lendo apenas o necessário.
- Diferencie um pedido de avaliação de um pedido de ajuste. Use páginas existentes que representem o problema sem modificar notas reais para montar cenários.
- Para conferir no navegador, execute primeiro `pnpm astro dev status`. Reutilize o servidor quando possível; se precisar iniciá-lo, use `pnpm dev`, que executa `astro dev --background`. Abra a URL e a porta informadas pelo Astro.

## Verificar os comportamentos afetados

Selecione os cenários pertinentes ao pedido; uma revisão geral deve cobrir desktop e tela estreita, incluindo uma largura em que o índice muda de posição conforme o CSS atual.

| Área | Conferência |
| --- | --- |
| Leitura | Tema escuro, contraste, largura confortável, títulos sem repetição visual e imagens dentro da coluna |
| Explorador | Pastas fechadas em uma sessão nova, ordenação natural, nota atual, recolhimento da lateral e ausência de grupos só de anexos |
| Persistência | Pastas e rolagem durante a sessão em `sessionStorage`; abertura das duas laterais separadamente em `localStorage`, inclusive após recarga |
| Índice e filtro | Âncoras, tópico atual durante rolagem, busca em texto e títulos sem distinguir acentos ou maiúsculas, trechos, nenhum resultado e limpeza com `Esc` |
| Notas sem subtítulos | Link de início e busca no corpo da nota |
| Teclado | Link de pular para o conteúdo, foco visível, controles alcançáveis e indicação da página ou seção atual |
| Conteúdo largo | Rolagem interna de código, tabelas e diagramas sem ampliar a página inteira |
| Mermaid | Código acessível, fonte visível em falha, ampliação, zoom, tamanho original, ajuste à largura, fechamento com `Esc` e retorno do foco |
| Degradação | Sem JavaScript, menus recolhíveis e links utilizáveis; com armazenamento bloqueado, navegação e filtro continuam funcionando |

## Ajustar e validar

1. Use as variáveis de cor e os padrões existentes. Preserve `html.dark`, o tema de callouts antes dos ajustes locais e os temas escuros de código e Mermaid.
2. Mantenha as URLs construídas por `noteUrl()` e a navegação derivada da coleção. Não acrescente cadastro manual de notas nem framework no cliente para resolver um ajuste simples.
3. Execute `pnpm test` e `pnpm build` ao alterar componentes ou comportamento. Para CSS, execute o build e confira visualmente os cenários afetados; execute também testes se a mudança afetar funcionalidades cobertas por eles.
4. Se não houver navegador, faça a revisão de código e registre quais cenários visuais ficaram sem conferência. Não apresente build ou inspeção de HTML como evidência de layout verificado.
5. Atualize README e guia quando mudar o comportamento da navegação ou o fluxo de leitura documentado.

## Resultado

Informe os problemas encontrados ou ajustes realizados, as páginas e larguras conferidas e os comandos executados. Diferencie resultados visuais de testes e build e relate limitações que afetem a conclusão.
