# LazyVim — Core

> `<leader>` = `Space`

## Arquivos

| Atalho        | Ação                          |
| ------------- | ----------------------------- |
| `Space Space` | Buscar/abrir arquivo          |
| `Space e`     | Abrir/fechar Explorer         |
| `Space /`     | Buscar texto no projeto       |
| `/texto`      | Buscar texto no arquivo       |
| `n` / `N`     | Próxima / anterior ocorrência |

## Janelas e arquivos abertos

| Atalho           | Ação                  |
| ---------------- | --------------------- |
| `Ctrl + h/j/k/l` | Navegar entre janelas |
| `Shift + h`      | Buffer anterior       |
| `Shift + l`      | Próximo buffer        |
| `Space b d`      | Fechar buffer         |
| `Ctrl + s`       | Salvar                |

## Navegação no código

| Atalho     | Ação                                 |
| ---------- | ------------------------------------ |
| `gd`       | Ir para definição                    |
| `gr`       | Ver referências                      |
| `K`        | Ver tipo/documentação                |
| `Ctrl + o` | Voltar para onde estava              |
| `Ctrl + i` | Avançar novamente                    |
| `s`        | Pular rapidamente para texto visível |

## Refatoração / LSP

| Atalho      | Ação                             |
| ----------- | -------------------------------- |
| `Space c r` | Renomear variável/classe/símbolo |
| `Space c a` | Code Actions                     |
| `Space c f` | Formatar arquivo                 |
| `Space c d` | Ver erro/diagnóstico             |
| `]d` / `[d` | Próximo / anterior diagnóstico   |

## Edição

| Atalho     | Ação                        |
| ---------- | --------------------------- |
| `i`        | Entrar em Insert            |
| `Esc`      | Voltar para Normal          |
| `u`        | Undo                        |
| `Ctrl + r` | Redo                        |
| `dd`       | Apagar linha                |
| `yy`       | Copiar linha                |
| `p`        | Colar                       |
| `ciw`      | Alterar palavra             |
| `diw`      | Apagar palavra              |
| `ci"`      | Alterar conteúdo entre `"`  |
| `ci(`      | Alterar conteúdo entre `()` |
| `gcc`      | Comentar/descomentar linha  |

## Movimento

| Atalho     | Ação                              |
| ---------- | --------------------------------- |
| `h j k l`  | Esquerda / baixo / cima / direita |
| `w` / `b`  | Próxima / palavra anterior        |
| `0` / `$`  | Início / fim da linha             |
| `gg` / `G` | Início / fim do arquivo           |
| `123G`     | Ir para linha 123                 |

## Visual

| Atalho | Ação |
|---|---|
| `v` | Seleção visual |
| `V` | Selecionar linhas |
| `viw` | Selecionar palavra |
| `vi"` | Selecionar dentro de `"` |
| `vi(` | Selecionar dentro de `()` |

## Os que eu decoraria primeiro

`Space Space` · `Space e` · `Space /`  
`Ctrl + h/j/k/l` · `Shift + h/l`  
`gd` · `gr` · `K` · `Ctrl + o`  
`Space c r` · `Space c a`  
`ciw` · `dd` · `yy` · `p` · `u`