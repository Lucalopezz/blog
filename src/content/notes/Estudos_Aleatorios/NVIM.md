---
title: "Atalhos e navegação no LazyVim"
description: "Atalhos do LazyVim e guia prático de movimentos, operadores e objetos de texto do Vim/Neovim."
category: "Ferramentas"
tags: [vim, neovim, lazyvim, atalhos, edicao-de-texto]
---
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

---

## Entendendo os comandos como uma linguagem

Os comandos do Vim/Neovim seguem uma lógica que permite construir ações sem decorar cada combinação separadamente:

```text
operador + movimento
operador + objeto de texto
```

Um **movimento** (*motion*) leva o cursor a uma posição, como `w`, `$` ou `f,`. Um **objeto de texto** (*text object*) identifica uma região, como uma palavra inteira ou o conteúdo entre aspas. Por exemplo, `iw` é um objeto de texto, não um movimento para usar sozinho no modo Normal.

> [!tip] Como digitar os exemplos
> Comece no modo **Normal** e pressione as teclas em sequência, sem `:` nem Enter. Para executar `ci"`, digite `c`, depois `i`, depois `"`. Os comandos que começam com `:`, como `:help`, usam a linha de comando e precisam de Enter.

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

Com o cursor em algum caractere de `Lucas Lopes`:

```js
const name = "Lucas Lopes";
```

Digite `ci"`. O conteúdo é removido, as aspas permanecem e você entra em **Insert**:

```js
const name = "";
```

Agora você pode digitar o novo nome e pressionar `Esc` para voltar ao modo Normal.

Compare as três operações, partindo sempre do exemplo original:

| Comando | Trecho removido | Modo após a operação |
| --- | --- | --- |
| `ci"` | Apenas `Lucas Lopes` | Insert, para digitar a substituição. |
| `di"` | Apenas `Lucas Lopes` | Normal. |
| `ca"` | `"Lucas Lopes"`, incluindo os delimitadores | Insert. |

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
| `W`, `B`, `E` | Movimentos equivalentes para blocos de caracteres separados por espaços. |

As versões minúsculas distinguem palavras e pontuação conforme as regras do editor. As maiúsculas tratam uma sequência sem espaços como um bloco maior. Em `user.name`, por exemplo, `W` pode saltar o conjunto de uma vez, enquanto `w` percorre suas partes.

Compare, com o cursor no `L` de `Lopes`:

```text
Lucas Lopes
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
| `*` / `#` | Buscar a palavra sob o cursor para frente ou para trás. |
| `n` / `N` | Repetir a busca na direção original ou oposta. |

Note a diferença entre `{` sozinho, que é um movimento por parágrafos, e `i{`, que seleciona o interior de um bloco entre chaves. Da mesma forma, `*` tem uma função nativa de busca, mas isso não cria um objeto nativo `i*`.

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
