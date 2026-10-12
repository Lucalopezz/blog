---
title: "Atalhos e navegação no LazyVim"
description: "Atalhos do LazyVim e guia prático de motions, objetos de texto, buscas, substituições, registradores e macros do Vim/Neovim."
category: "Ferramentas"
tags: [vim, neovim, lazyvim, atalhos, edicao-de-texto]
---
# LazyVim — Core

> `<leader>` = `Space`

A primeira parte reúne atalhos do **LazyVim**. Depois, o guia explica os comandos do **Vim/Neovim** que você pode combinar para editar texto. Plugins e mapeamentos pessoais podem mudar algumas teclas; quando isso fizer diferença, há uma observação junto do comando.

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
| `Ctrl + v` | Selecionar um bloco retangular de texto |
| `viw` | Selecionar palavra |
| `vi"` | Selecionar dentro de `"` |
| `vi(` | Selecionar dentro de `()` |
| `gv` | Recuperar a última seleção e seu modo Visual |
| `o` | No modo Visual, mover o cursor para a outra ponta da seleção |

## Os que eu decoraria primeiro

`Space Space` · `Space e` · `Space /`  
`Ctrl + h/j/k/l` · `Shift + h/l`  
`gd` · `gr` · `K` · `Ctrl + o`  
`Space c r` · `Space c a`  
`ciw` · `dd` · `yy` · `p` · `u`

---

## Entendendo os comandos como uma linguagem

Os comandos do Vim/Neovim seguem uma lógica que permite construir ações sem decorar cada combinação separadamente:

```text
operador + movimento
operador + objeto de texto
```

Um **movimento** (*motion*) leva o cursor a uma posição, como `w`, `$` ou `f,`. Um **objeto de texto** (*text object*) identifica uma região, como uma palavra inteira ou o conteúdo entre aspas. Por exemplo, `iw` é um objeto de texto, não um movimento para usar sozinho no modo Normal.

> [!tip] Como digitar os exemplos
> Comece no modo **Normal** e pressione as teclas em sequência. Para executar `ci"`, digite `c`, depois `i`, depois `"`, sem Enter. Os comandos que começam com `:`, como `:help`, e as buscas com `/` ou `?` precisam de Enter. Em `g` seguido de `Ctrl + g`, pressione primeiro `g` e depois a combinação; não são três teclas simultâneas.

### Operadores: o que você quer fazer?

| Tecla | Significado | Resultado |
| --- | --- | --- |
| `c` | *Change*: alterar | Apaga o trecho e entra no modo Insert para escrever a substituição. |
| `d` | *Delete*: apagar | Apaga o trecho e permanece no modo Normal. |
| `y` | *Yank*: copiar | Copia o trecho para um registrador, sem apagá-lo. |

`v` entra no modo **Visual**. Embora não seja um operador como `c`, `d` e `y`, também pode ser seguido de um objeto de texto: `viw` seleciona uma palavra e `vi{` seleciona o interior de um bloco.

O texto copiado com `y` pode ser colado com `p`. Por padrão, o registrador do editor não é necessariamente a área de transferência do sistema; isso depende da configuração.

### Objetos de texto: dentro ou ao redor?

| Parte | Ideia | Exemplo |
| --- | --- | --- |
| `i` | *Inner*: parte interna | `i"` seleciona o conteúdo sem as aspas. |
| `a` | Objeto completo; pense em *around* | `a"` inclui as aspas; `aw` inclui a palavra e espaços adjacentes conforme o contexto. |

Nesse contexto, `i` e `a` fazem parte do objeto de texto. Sozinhos no modo Normal, eles têm outra função: entrar em inserção antes ou depois do cursor.

Leia `ci"` assim:

```text
c          + i       + "
alterar      dentro    das aspas duplas

“Quero substituir o conteúdo dentro destas aspas.”
```

### Aspas: `ci"`, `ca"` e `di"`

Com o cursor em algum caractere de `João Augusto`:

```js
const name = "João Augusto";
```

Digite `ci"`. O conteúdo é removido, as aspas permanecem e você entra em **Insert**:

```js
const name = "";
```

Agora você pode digitar o novo nome e pressionar `Esc` para voltar ao modo Normal.

Compare as três operações, partindo sempre do exemplo original:

| Comando | Trecho removido | Modo após a operação |
| --- | --- | --- |
| `ci"` | Apenas `João Augusto` | Insert, para digitar a substituição. |
| `di"` | Apenas `João Augusto` | Normal. |
| `ca"` | `"João Augusto"`, incluindo os delimitadores | Insert. |

`ca"` também pode consumir espaços adjacentes conforme as regras do objeto `a"`. A ideia principal é que as aspas deixam de fazer parte do texto. A linha pode ficar temporariamente com sintaxe incompleta enquanto você digita a substituição.

### Parênteses: `ci(` ou `ci)`

Considere:

```js
print("hello", user.name)
```

Com o cursor dentro dos parênteses, `ci(` remove os argumentos e entra em Insert:

```js
print()
```

`ci)` faz a mesma coisa. Os dois caracteres identificam o mesmo tipo de objeto. Com `ca(` ou `ca)`, os parênteses também são incluídos na alteração.

### Chaves: `ci{` ou `ci}`

Considere o cursor dentro do corpo desta função:

```js
function hello() {
    console.log("hello");
    return true;
}
```

`ci{` altera o conteúdo do bloco, preservando as chaves. Você entra em Insert para escrever o novo corpo. Em blocos com várias linhas, podem permanecer quebras de linha e indentação; não significa necessariamente transformar tudo em `{}` na mesma linha.

`ca{` inclui as próprias chaves. `ci}` e `ca}` são formas equivalentes usando o delimitador de fechamento. Se houver blocos aninhados, a posição do cursor determina o bloco interno selecionado.

### Tags: `cit` e `cat`

Em HTML/XML, com o cursor no texto:

```html
<div>Hello world</div>
```

`cit` altera o conteúdo e preserva as tags:

```html
<div></div>
```

`cat` inclui o par de tags e seu conteúdo. Esses comandos também podem ajudar em JSX simples com tags pareadas, mas não representam uma análise completa da sintaxe de React. Uma tag autocontida, como `<Input />`, não tem um interior entre abertura e fechamento para alterar.

### Combinações para consultar

| Objeto | Alterar o interior | Apagar o interior | Copiar o interior |
| --- | --- | --- | --- |
| Palavra | `ciw` | `diw` | `yiw` |
| Aspas duplas | `ci"` | `di"` | `yi"` |
| Aspas simples | `ci'` | `di'` | `yi'` |
| Crases | `` ci` `` | `` di` `` | `` yi` `` |
| Parênteses | `ci(` | `di(` | `yi(` |
| Colchetes | `ci[` | `di[` | `yi[` |
| Chaves | `ci{` | `di{` | `yi{` |
| Delimitadores `< >` | `ci<` | `di<` | `yi<` |
| Tags pareadas | `cit` | `dit` | `yit` |
| Parágrafo | `cip` | `dip` | `yip` |

Troque `i` por `a` para incluir o objeto completo. Com pares de delimitadores, isso inclui a abertura e o fechamento; para palavras e parágrafos, a diferença envolve os espaços ou linhas em branco ao redor.

`ci<` trabalha entre `<` e `>`; `cit` trabalha entre uma tag de abertura e sua tag de fechamento. Não são a mesma coisa. Os objetos de aspas e crases nativos procuram o par na mesma linha, não uma string inteira de várias linhas.

### Por que `di` está incompleto?

Ao digitar `di`, o editor ainda espera a resposta para **“apagar dentro de quê?”**:

```text
d + iw  → apagar o interior da palavra
d + i"  → apagar o conteúdo entre aspas
d + i{  → apagar o conteúdo entre chaves
```

Complete com o objeto desejado ou pressione `Esc` para cancelar. A diferença entre `di"` e `ci"` é o que acontece depois de apagar: `d` mantém o modo Normal; `c` entra em Insert.

### E o comando `ci*`?

> [!note] Depende da sua configuração
> `i*` não é um objeto de texto nativo do Vim/Neovim. Se `ci*` funciona na sua configuração, pode ter sido definido por um plugin ou mapeamento personalizado. Não é possível deduzir seu comportamento apenas pelo nome.

Para investigar, consulte os mapeamentos no modo **operator-pending**, isto é, quando o editor já recebeu `c` ou `d` e espera o restante:

```vim
:verbose omap i*
:verbose omap i
```

O primeiro procura o objeto específico; o segundo também ajuda a encontrar plugins que interceptam o prefixo `i` e leem a próxima tecla. Para seleção Visual, consulte:

```vim
:verbose xmap i*
:verbose xmap i
```

Também é possível verificar se existe um mapeamento da sequência inteira no modo Normal:

```vim
:verbose nmap ci*
```

Não encontrar um mapeamento em `nmap` não descarta um objeto definido por plugin: ele pode estar em outro modo ou no prefixo. `:verbose` ajuda a identificar onde o mapeamento foi definido. Veja a [documentação de mapeamentos do Neovim](https://neovim.io/doc/user/map/#mapmode-o).

## Mais movimentos que combinam com essa lógica

### Palavras: `w`, `b`, `e` e suas versões maiúsculas

| Movimento | Destino |
| --- | --- |
| `w` | Início da próxima palavra. |
| `b` | Início da palavra atual ou da anterior, dependendo da posição. |
| `e` | Final da palavra atual ou da próxima, dependendo da posição. |
| `ge` | Final da palavra anterior. |
| `W`, `B`, `E`, `gE` | Movimentos equivalentes para blocos de caracteres separados por espaços. |

As versões minúsculas distinguem palavras e pontuação conforme as regras do editor. As maiúsculas tratam uma sequência sem espaços como um bloco maior. Em `user.name`, por exemplo, `W` pode saltar o conjunto de uma vez, enquanto `w` percorre suas partes.

Compare, com o cursor no `A` de `Augusto`:

```text
João Augusto
```

- `de` apaga do cursor até o fim da palavra, incluindo o último caractere.
- `diw` apaga a palavra inteira, mesmo se o cursor estiver no meio dela.
- `daw` apaga a palavra e inclui espaços adjacentes conforme o contexto.
- `ciw` substitui a palavra inteira e entra em Insert.

`dw` apaga o trecho percorrido até a próxima palavra, frequentemente incluindo os espaços entre palavras. Existe uma particularidade histórica: sobre um caractere que não é espaço, `cw` se comporta como `ce`, alterando até o fim da palavra. Para substituir a palavra inteira a partir de qualquer posição nela, `ciw` costuma expressar melhor a intenção.

### Na linha: `0`, `^`, `$`, `f` e `t`

| Movimento | Ação |
| --- | --- |
| `0` | Ir para a primeira coluna da linha. |
| `^` | Ir para o primeiro caractere que não seja espaço ou tabulação. |
| `$` | Ir para o final da linha. |
| `g_` | Ir para o último caractere da linha que não seja espaço ou tabulação. |
| `gj` / `gk` | Descer/subir uma linha visual quando uma linha longa está quebrada na tela. |
| `f{caractere}` | Encontrar a próxima ocorrência do caractere à direita, na mesma linha. |
| `F{caractere}` | Encontrar a ocorrência à esquerda. |
| `t{caractere}` | Ir até antes da ocorrência à direita. |
| `T{caractere}` | Ir até depois da ocorrência à esquerda. |
| `;` | Repetir a última busca com `f`, `F`, `t` ou `T`. |
| `,` | Repetir essa busca na direção oposta. |

Em `f{caractere}`, as chaves são apenas uma indicação de parâmetro. Para encontrar uma vírgula, digite `f,`.

Partindo do `a` em cada exemplo:

```text
alpha, beta, gamma
```

| Comando | Resultado |
| --- | --- |
| `dt,` | Apaga `alpha`, preservando a primeira vírgula. |
| `df,` | Apaga `alpha,`, incluindo a primeira vírgula. |
| `ct,` | Remove `alpha` e entra em Insert antes da vírgula. |
| `d$` | Apaga do cursor até o final da linha. |
| `y$` | Copia do cursor até o final da linha. |

`D` é um atalho para `d$`; `C` equivale a `c$`.

### Pares, parágrafos e arquivo

| Movimento | Ação |
| --- | --- |
| `%` | Sobre um delimitador, saltar para seu par, como `(` e `)`, `[` e `]`, `{` e `}`. |
| `{` / `}` | Mover para o limite de parágrafo anterior ou seguinte. |
| `gg` / `G` | Ir para a primeira ou última linha do arquivo. |
| `123G` | Ir para a linha 123. |

Note a diferença entre `{` sozinho, que é um movimento por parágrafos, e `i{`, que seleciona o interior de um bloco entre chaves. Os parágrafos são delimitados principalmente por linhas em branco; `{` e `}` não analisam funções ou blocos da linguagem.

### Tela, rolagem e posição do cursor

O **buffer** é o texto aberto no editor. A **janela** mostra apenas uma parte dele. Alguns comandos mudam o cursor; outros reposicionam o texto na tela para facilitar a leitura.

| Comando | Ação no modo Normal |
| --- | --- |
| `Ctrl + e` | Rolar uma linha em direção ao fim do arquivo; o texto sobe na tela. |
| `Ctrl + y` | Rolar uma linha em direção ao início do arquivo; o texto desce na tela. |
| `Ctrl + d` / `Ctrl + u` | Rolar aproximadamente meia tela para baixo/para cima, movendo também o cursor. |
| `Ctrl + f` / `Ctrl + b` | Avançar/voltar aproximadamente uma tela. |
| `zt` | Reposicionar a linha do cursor no topo da janela. |
| `zz` | Reposicionar a linha do cursor no centro da janela. |
| `zb` | Reposicionar a linha do cursor na parte inferior da janela. |
| `H` | Mover o cursor para a parte superior da janela. |
| `M` | Mover o cursor para o meio da janela. |
| `L` | Mover o cursor para a parte inferior da janela. |

`Ctrl + e` e `Ctrl + y` mantêm o cursor no mesmo lugar do texto enquanto isso for possível. Se ele sair da área visível, o editor o ajusta. A opção `scrolloff` também pode reservar linhas acima e abaixo do cursor. `gg` e `G` vão aos extremos do arquivo; `H`, `M` e `L` trabalham na região visível. Veja a [referência de rolagem](https://neovim.io/doc/user/scroll/).

> [!note] `H` e `L` no LazyVim
> `H` é `Shift + h`, e `L` é `Shift + l`. Nos [mapeamentos padrão do LazyVim](https://www.lazyvim.org/keymaps), eles trocam de buffer, como na tabela do início da nota. Para usar os movimentos nativos sem alterar sua configuração, execute `:normal! H` ou `:normal! L`.

Se o tmux usa `Ctrl + b` como prefixo, ele pode interceptar essa tecla. Com o prefixo padrão, pressione `Ctrl + b` duas vezes para enviar uma ocorrência ao Neovim, como explica o [guia do tmux](https://github.com/tmux/tmux/wiki/Getting-Started#the-prefix-key).

### Contagens e repetição

Um número repete o movimento ou amplia a operação:

| Comando | Leitura |
| --- | --- |
| `3w` | Avançar três movimentos de palavra. |
| `2f,` | Ir até a segunda vírgula à direita na linha. |
| `d3w` ou `3dw` | Apagar o trecho percorrido por três movimentos `w`. |
| `3dd` | Apagar três linhas a partir da atual. |
| `2yy` | Copiar a linha atual e a seguinte. |
| `.` | Repetir a última alteração repetível. |
| `u` | Desfazer a última alteração. |
| `Ctrl + r` | Refazer uma alteração desfeita. |

Por exemplo: use `ci"`, digite um novo conteúdo e pressione `Esc`. Vá para outra string e pressione `.` para repetir a alteração. Isso reutiliza a operação anterior, incluindo o texto inserido.

## Buscas e substituições

### Buscar palavras ou trechos

| Comando | Ação |
| --- | --- |
| `*` / `#` | Buscar a palavra inteira sob o cursor para frente/para trás. |
| `g*` / `g#` | Buscar o texto da palavra sob o cursor, permitindo encontrá-lo dentro de palavras maiores. |
| `/texto` + Enter | Buscar para frente. |
| `?texto` + Enter | Buscar para trás. |
| `n` / `N` | Nativamente, repetir na direção da busca original/oposta. |
| `/texto\c` + Enter | Buscar ignorando maiúsculas e minúsculas. |
| `/texto\C` + Enter | Buscar diferenciando maiúsculas e minúsculas. |
| `/\Vuser.name` + Enter | Buscar `user.name` literalmente, sem tratar o ponto como um curinga. |
| `:nohlsearch` | Limpar o destaque da busca atual sem apagar seu padrão. |

`\c` e `\C` fazem parte do padrão; não são atalhos isolados. `\V` reduz a interpretação de caracteres especiais, mas a própria barra invertida ainda precisa ser escapada quando fizer parte do texto. As buscas usam a sintaxe de expressões regulares do Vim, que tem diferenças em relação à de JavaScript ou PCRE. Consulte a [referência de padrões de busca](https://neovim.io/doc/user/pattern/).

Por exemplo, sobre `user`, `*` busca a palavra inteira, enquanto `g*` também pode encontrar `username`. Isso não transforma `*` em um objeto de texto `i*`.

Nos [mapeamentos do LazyVim](https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua), `n` e `N` continuam para frente e para trás, respectivamente, mesmo quando a busca começou com `?`. `Esc` no modo Normal também limpa o destaque da busca.

### Combinar um operador com uma busca

A busca também pode ser o movimento de um comando. Digite a sequência e confirme com Enter:

| Comando | Ação |
| --- | --- |
| `y/legal` + Enter | Copiar do cursor até o início da próxima ocorrência de `legal`. |
| `d?legal` + Enter | Apagar o trecho entre a ocorrência anterior de `legal` e o cursor. |
| `c/legal` + Enter | Alterar do cursor até o início da próxima ocorrência de `legal` e entrar em Insert. |
| `v?legal` + Enter | Entrar em Visual e selecionar para trás até o início da ocorrência anterior de `legal`. |

Nas operações com `c`, `d` e `y`, `/` e `?` são movimentos **exclusivos**. Na mesma linha, a busca para frente deixa o primeiro caractere de `legal` fora do trecho alterado. Já `d?legal` inclui o início da ocorrência anterior e deixa de fora o caractere da posição original do cursor. Há ajustes nas bordas de linhas. No Visual, a seleção normalmente inclui o caractere de destino.

Por exemplo, partindo do `a`:

```text
alpha legal beta
```

`c/legal` + Enter remove `alpha ` e deixa `legal beta`, com o editor em Insert para escrever antes de `legal`. Para alterar a ocorrência encontrada em si, use `cgn`, explicado adiante.

### Buscar e substituir: `:s`

```vim
:[intervalo]s/padrão/substituição/flags
```

| Comando | Alcance |
| --- | --- |
| `:s/encontrar/substituir/` | Primeira ocorrência na linha atual, com a configuração padrão. |
| `:s/encontrar/substituir/g` | Todas as ocorrências na linha atual. |
| `:%s/encontrar/substituir/g` | Todas as ocorrências no buffer inteiro. |
| `:10,20s/encontrar/substituir/g` | Todas as ocorrências nas linhas 10 a 20. |
| `:'<,'>s/encontrar/substituir/g` | Todas as ocorrências nas linhas abrangidas pela última seleção Visual. |
| `:%s//substituir/g` | Usar o padrão da busca anterior, sem digitá-lo novamente. |

Depois de selecionar com `v`, `V` ou `Ctrl + v`, pressionar `:` já preenche `:'<,'>`. Complete com `s/encontrar/substituir/g`. Esse intervalo inclui as **linhas inteiras** abrangidas, mesmo quando você selecionou apenas algumas colunas.

| Flag | Efeito |
| --- | --- |
| `g` | Substituir todas as ocorrências de cada linha, com `gdefault` desativado, como é o padrão. |
| `c` | Pedir confirmação para cada substituição. |
| `i` | Ignorar maiúsculas e minúsculas. |
| `I` | Diferenciar maiúsculas e minúsculas. |

As flags podem ser combinadas: `:%s/encontrar/substituir/gci` procura no buffer inteiro, ignora diferenças de caixa e pede confirmação. Responda `y` para substituir, `n` para pular, `a` para substituir todas as restantes ou `q` para encerrar.

Se acabou de buscar `/encontrar` + Enter, use `:%s//substituir/gc` para reutilizar a busca e revisar cada troca. Quando o padrão contém muitas barras, outro separador pode facilitar:

```vim
:%s#src/old#src/new#g
```

O padrão é uma expressão regular; a substituição também tem caracteres especiais. Por exemplo, `&` na substituição representa o texto encontrado. Veja `:help :s` e a [referência de substituição](https://neovim.io/doc/user/change/#:substitute).

### Alterar ocorrências uma por uma com `cgn` e `.`

1. Busque `/user` + Enter.
2. Digite `cgn`, escreva `customer` e pressione `Esc`.
3. Pressione `.` para aplicar a mesma alteração à próxima ocorrência.
4. Para pular uma ocorrência, use `n` para visitá-la e `n` novamente para ir à seguinte; então repita com `.`.

`gn` seleciona a ocorrência atual ou a próxima do último padrão, sempre buscando para frente. Com `cgn`, você altera só essa ocorrência, e a repetição com `.` reaplica a operação e o texto inserido. Isso é útil para escolher quais resultados trocar. O padrão `user` também encontra partes de palavras; use `/\<user\>` para limitar a palavras inteiras. Consulte a [documentação de `gn`](https://neovim.io/doc/user/visual/#gn).

## Indentação e comentários

| Comando | Ação |
| --- | --- |
| `>>` / `<<` | Aumentar/reduzir a indentação da linha atual. |
| `3>>` / `3<<` | Aumentar/reduzir a indentação de três linhas a partir da atual. |
| `>` / `<` no Visual | Aumentar/reduzir a indentação das linhas selecionadas. |
| `==` | Recalcular a indentação da linha conforme as regras configuradas. |
| `=ip` | Reindentar o parágrafo atual. |
| `gg=G` | Reindentar o buffer inteiro. |
| `=` no Visual | Reindentar as linhas selecionadas. |
| `gcc` | Comentar/descomentar a linha atual. |
| `gc` + movimento | Comentar/descomentar as linhas abrangidas pelo movimento; por exemplo, `gcip` atua no parágrafo. |
| `gc` no Visual | Comentar/descomentar as linhas selecionadas. |

`=` ajusta **indentação** segundo as opções do editor e do tipo de arquivo; não equivale a executar um formatador completo. No LazyVim, `Space c f` executa a ação de formatação configurada.

`gc` no modo Normal espera um movimento; para uma única linha, use `gcc`. Esses mapeamentos de comentário estão disponíveis no Neovim desde a versão 0.10 e dependem do tipo de arquivo e de `commentstring`. Em versões anteriores ou outras configurações de Vim, podem vir de plugins. Veja a [documentação de comentários](https://neovim.io/doc/user/various/#commenting).

## Copiar, cortar, colar e usar registradores

Apagar com `d` ou alterar com `c` normalmente guarda o trecho removido em um **registrador**. Por isso, apagar também funciona como cortar, e pode mudar o conteúdo que `p` vai colar.

### Colar e voltar ao trecho inserido

| Comando | Ação |
| --- | --- |
| `dd` / `yy` | Cortar/copiar a linha inteira. |
| `p` / `P` | Colar depois/antes do cursor; para texto copiado por linhas, abaixo/acima da linha atual. |
| `gp` / `gP` | Colar como `p`/`P`, deixando o cursor logo após o trecho inserido. |
| `` `[ `` | Ir ao início do último trecho alterado, copiado ou colado. |
| `` `] `` | Ir ao fim do último trecho alterado, copiado ou colado. |

Nas duas últimas linhas, a primeira tecla é a **crase**. Uma edição ou cópia posterior pode mudar o trecho para o qual essas marcas apontam. Depois de colar, `` `[v`] `` seleciona o trecho entre as marcas em modo Visual por caracteres.

### Escolher onde guardar o texto

A sintaxe é `"{registrador}{comando}`. A primeira tecla é uma aspa dupla reta (`"`): não use as aspas tipográficas `“` e `”`.

| Comando | Ação |
| --- | --- |
| `"ayiw` | Copiar a palavra inteira para o registrador `a`. |
| `"adiw` | Cortar a palavra inteira para o registrador `a`. |
| `"ap` | Colar o conteúdo do registrador `a`. |
| `"Ayy` | Acrescentar a linha copiada ao conteúdo de `a`, usando a letra maiúscula. |
| `:reg` | Mostrar os registradores e seus conteúdos. |
| `:reg a 0 +` | Mostrar apenas os registradores `a`, `0` e `+`. |

| Registrador | Conteúdo ou finalidade |
| --- | --- |
| `""` | Sem nome: usado por padrão nas operações de copiar, cortar e colar. |
| `"0` | Último yank sem registrador explícito; `"0p` recupera essa cópia mesmo após apagar outro trecho. |
| `"a` a `"z` | Registradores nomeados para guardar trechos escolhidos por você. |
| `"+` | Área de transferência do sistema: `"+yy` copia uma linha e `"+p` cola. |
| `"*` | Seleção primária em ambientes que a oferecem, como X11; pode diferir de `"+`. |
| `".` | Somente leitura: contém o último texto inserido; `".p` o insere novamente. |
| `"_` | Descarte: apaga sem modificar os registradores usuais. |

Um fluxo útil: copie uma palavra com `yiw`, apague outra linha com `dd` e cole a palavra original com `"0p`. Se quiser que o apagamento preserve também o registrador sem nome, use `"_dd` ou `"_diw`. Para substituir uma seleção com o conteúdo de `a`, use `"_d` e depois `"aP`.

No modo **Insert**, `Ctrl + r` seguido de `a`, `0` ou `+` insere o conteúdo do registrador correspondente. No modo **Normal**, `Ctrl + r` refaz uma alteração desfeita: o modo muda a função da tecla.

> [!note] Área de transferência depende do ambiente
> `"+` e `"*` precisam de um provedor de clipboard funcional. No Linux, isso depende da sessão e de ferramentas como `wl-copy`/`wl-paste` no Wayland ou `xclip`/`xsel` no X11. A opção `clipboard` também pode fazer as operações sem registrador explícito usarem o clipboard. Se não funcionar, consulte `:checkhealth vim.provider` e a [documentação do provedor de clipboard](https://neovim.io/doc/user/provider/#clipboard).

Veja também `:help registers` e o [guia de copiar e colar com registradores](https://neovim.io/doc/user/usr_12/).

## Outros atalhos úteis no dia a dia

### Inserção e pequenas edições

| Comando | Ação a partir do modo Normal |
| --- | --- |
| `a` / `A` | Entrar em Insert depois do cursor/no fim da linha. |
| `I` | Entrar em Insert antes do primeiro caractere que não seja espaço na linha. |
| `o` / `O` | Criar uma linha abaixo/acima e entrar em Insert. |
| `gi` | Voltar à posição onde saiu de Insert pela última vez no buffer atual e entrar em Insert. |
| `r{caractere}` | Substituir o caractere sob o cursor sem permanecer em Insert. |
| `J` | Juntar a linha atual com a próxima, ajustando os espaços entre elas. |
| `gJ` | Juntar as linhas sem acrescentar um espaço entre elas. |
| `gUiw` / `guiw` | Converter a palavra inteira para maiúsculas/minúsculas. |
| `~` | Alternar maiúscula/minúscula do caractere sob o cursor. |
| `Ctrl + a` / `Ctrl + x` | Incrementar/decrementar o número sob o cursor ou o próximo número à direita na linha. |

`gi` retoma a **última posição de saída** de Insert, não necessariamente o ponto onde você começou a escrever. As regras de números, como reconhecimento de hexadecimal, dependem da opção `nrformats`. Referências: [comandos de inserção](https://neovim.io/doc/user/insert/) e [incremento e decremento](https://neovim.io/doc/user/usr_26/#26.2).

### Marcas e histórico de navegação

| Comando | Ação |
| --- | --- |
| `ma` | Guardar a posição atual na marca local `a`. |
| `` `a `` | Voltar à linha e à coluna exatas da marca `a`. |
| `'a` | Voltar ao primeiro caractere não branco da linha da marca `a`. |
| `mA` / `` `A `` | Criar/visitar a marca `A`, que também permite saltar entre arquivos. |
| `Ctrl + o` / `Ctrl + i` | Voltar/avançar na lista de saltos. |
| `g;` / `g,` | Visitar posições anteriores/seguintes na lista de alterações. |
| `:marks` / `:jumps` / `:changes` | Consultar marcas, saltos e alterações. |

Marcas e registradores têm funções diferentes: `ma` guarda uma **posição**; `"ayiw` guarda **texto**. `Ctrl + o` ajuda a voltar depois de buscas, `gg`, `G`, `gf` ou saltos de definição. `g;` ajuda a localizar onde você editou. Consulte `:help mark-motions`, `:help jumplist` e `:help changelist`.

### Arquivos, links e informações do buffer

| Comando | Ação |
| --- | --- |
| `gf` | Abrir no editor o arquivo cujo caminho está sob o cursor, se ele puder ser localizado. |
| `gx` | Abrir o link ou caminho sob o cursor com o aplicativo padrão do sistema. |
| `Ctrl + g` | Mostrar o arquivo atual e informações da posição do cursor. |
| `g` seguido de `Ctrl + g` | Mostrar coluna, linha e contagens de palavras, caracteres e bytes do buffer. |

`gf` considera opções como `path` e `suffixesadd`; não é um salto de definição do LSP. `gx` usa o aplicativo do sistema, como o navegador para uma URL. No Visual, `g` seguido de `Ctrl + g` conta o trecho selecionado. Referências: [abrir arquivos com `gf`](https://neovim.io/doc/user/editing/#gf) e [abrir links com `gx`](https://neovim.io/doc/user/various/#gx).

### Macros: repetir uma sequência de ações

| Comando | Ação |
| --- | --- |
| `qa` | Começar a gravar uma macro no registrador `a`. |
| `q` | No modo Normal, encerrar a gravação em andamento. |
| `@a` | Executar a macro guardada em `a`. |
| `@@` | Executar novamente a última macro usada. |
| `5@a` | Executar a macro de `a` cinco vezes. |

Por exemplo, para acrescentar `// ` no início de várias linhas de uma lista:

1. Posicione o cursor na primeira linha e digite `qa`.
2. Digite `0i`, escreva `// ` e pressione `Esc`.
3. Pressione `j` para ir à próxima linha e `q` para encerrar.
4. Use `@a` nas demais linhas, ou uma contagem como `3@a` para processar as três seguintes.

A primeira linha já é editada durante a gravação. A macro repete teclas, incluindo movimentos; terminar na próxima linha permite continuar a sequência. Macros usam os mesmos registradores das cópias: `"ayiw` substitui a macro que estava em `a`. Use letras diferentes para os trechos que quer manter. Consulte a [referência de gravação e execução](https://neovim.io/doc/user/repeat/#recording).

### Edição em bloco: escrever em várias linhas

`Ctrl + v` seleciona um retângulo. Para acrescentar o mesmo prefixo a várias linhas:

1. No modo Normal, vá à coluna desejada na primeira linha.
2. Pressione `Ctrl + v` e use `j` para incluir as linhas seguintes.
3. Pressione `I`, digite o prefixo e finalize com `Esc`.

Durante a digitação, o texto aparece na primeira linha; ao sair de Insert, ele é aplicado às outras linhas do bloco. Use `A` para acrescentar texto depois da borda direita selecionada. Veja o [guia de edição em bloco](https://neovim.io/doc/user/usr_10/#10.5).

## Como construir o comando que você precisa

| Intenção | Construção | Comando |
| --- | --- | --- |
| Alterar dentro das aspas | `c` + `i"` | `ci"` |
| Apagar uma palavra com seu espaço | `d` + `aw` | `daw` |
| Copiar dentro dos parênteses | `y` + `i(` | `yi(` |
| Selecionar um bloco com suas chaves | `v` + `a{` | `va{` |
| Alterar até antes da próxima vírgula | `c` + `t,` | `ct,` |
| Apagar até o final da linha | `d` + `$` | `d$` |

Se tiver dúvida sobre o trecho afetado, experimente primeiro selecionar com `viw`, `vi"` ou `vi{`. Depois de conferir a seleção, pressione `c`, `d` ou `y` para agir sobre ela, ou `Esc` para cancelar.

Para continuar estudando no próprio editor, use `:help motion.txt`, `:help text-objects`, `:help operator` e `:help .`. A referência completa está na [documentação de movimentos e objetos de texto do Neovim](https://neovim.io/doc/user/motion/#text-objects).

## Referência do post

Parte dos comandos desta nota foi reunida a partir de **Dominando o Neovim: Dicas e Truques que Você Não Sabia que Precisava**, de **Luiz Otavio Miranda**, publicado no **Otávio Miranda Substack** em **13 de outubro de 2025**. As tabelas também incluem comandos complementares e observações da documentação oficial do Neovim e do LazyVim.
