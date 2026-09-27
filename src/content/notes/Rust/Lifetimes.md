# Lifetimes: validade de referências e desenho de APIs

Uma lifetime não é um pedido para o compilador manter um objeto vivo. É uma forma de expressar por quanto tempo uma referência precisa continuar válida e como essa validade se relaciona com a origem dos dados.

Para quem conhece C, a pergunta central é familiar: **o objeto apontado ainda existirá em cada acesso?** Rust usa essa informação para impedir referências penduradas em código seguro.

Leia primeiro [[Rust/Ownership e borrowing na prática|Ownership e borrowing na prática]]. Depois desta nota, aplique os conceitos em [[Rust/Construindo um grep|Construindo um grep]].

> [!note] Organização dos exemplos
> Use Rust estável com edition 2024. Blocos com `fn main()` são exemplos independentes. Os exemplos de erro estão marcados como **não compila**; a rejeição faz parte da explicação. Uma anotação de lifetime não tem uma estrutura alocada correspondente em runtime.

## Sumário

1. [Três durações que não são a mesma coisa](#1-três-durações-que-não-são-a-mesma-coisa)
2. [O erro de retornar memória local](#2-o-erro-de-retornar-memória-local)
3. [O que uma anotação realmente declara](#3-o-que-uma-anotação-realmente-declara)
4. [Elisão de lifetimes](#4-elisão-de-lifetimes)
5. [Relacionar só as entradas necessárias](#5-relacionar-só-as-entradas-necessárias)
6. [Structs que emprestam dados](#6-structs-que-emprestam-dados)
7. [O empréstimo de self e o empréstimo da origem](#7-o-empréstimo-de-self-e-o-empréstimo-da-origem)
8. [Referências estáticas e bounds estáticos](#8-referências-estáticas-e-bounds-estáticos)
9. [Resultados imediatos e iteradores preguiçosos](#9-resultados-imediatos-e-iteradores-preguiçosos)
10. [Quando possuir os dados é melhor](#10-quando-possuir-os-dados-é-melhor)
11. [Autorreferência, índices e limites do modelo](#11-autorreferência-índices-e-limites-do-modelo)
12. [Testando contratos emprestados](#12-testando-contratos-emprestados)
13. [Como ler e corrigir os diagnósticos](#13-como-ler-e-corrigir-os-diagnósticos)
14. [Exercícios e referências](#14-exercícios-e-referências)

## 1. Três durações que não são a mesma coisa

É útil separar:

| Conceito | Pergunta |
| --- | --- |
| Escopo de um nome | Onde posso escrever esse identificador? |
| Vida do valor ou recurso | Até quando o dado permanece válido? |
| Lifetime de um empréstimo | Em quais usos a referência precisa ser válida? |

```rust
fn main() {
    let mut texto = String::from("Rust");
    let visao = texto.as_str();
    println!("{visao}");

    // O último uso de visao já ocorreu.
    texto.push_str(" e C");
    println!("{texto}");
}
```

O nome `visao` ainda está no escopo até a chave final, mas o empréstimo não precisa continuar bloqueando a mutação após seu último uso. O valor `texto`, por sua vez, permanece vivo e é modificado.

Uma lifetime também não se resume a um cronômetro de execução. Ela faz parte de restrições analisadas no código: relações entre empréstimos, fluxos possíveis e assinaturas de funções.

## 2. O erro de retornar memória local

Este programa **não compila**:

```rust
fn criar<'a>() -> &'a str {
    let texto = String::from("temporário");
    texto.as_str()
}

fn main() {}
```

O buffer será liberado ao sair de `criar`. O chamador receberia uma referência a armazenamento destruído. Declarar `'a` não muda a vida de `texto`.

Compare com uma solução que transfere propriedade:

```rust
fn criar() -> String {
    String::from("resultado próprio")
}

fn main() {
    let texto = criar();
    assert_eq!(texto, "resultado próprio");
}
```

Também é possível retornar uma referência se os dados realmente tiverem vida suficiente, como um literal:

```rust
fn nome_da_ferramenta() -> &'static str {
    "mini-grep"
}

fn main() {
    println!("{}", nome_da_ferramenta());
}
```

As duas soluções representam contratos diferentes. Uma devolve um valor possuído; a outra devolve uma referência a armazenamento estático. Não escolha `'static` apenas porque a mensagem de erro mencionou a falta de uma lifetime.

## 3. O que uma anotação realmente declara

Observe esta função:

```rust
fn escolher<'a>(a: &'a str, b: &'a str, usar_primeiro: bool) -> &'a str {
    if usar_primeiro { a } else { b }
}

fn main() {
    let externo = String::from("primeiro");

    {
        let interno = String::from("segundo");
        let resultado = escolher(&externo, &interno, false);
        assert_eq!(resultado, "segundo");
    }
}
```

A assinatura afirma que a saída pode aproveitar uma região de validade que ambas as entradas consigam satisfazer. Ela não exige que as strings sejam criadas ou destruídas juntas.

```text
externo:    |-----------------------------------------|
interno:            |---------------------|
uso da saída:          |--------------|
```

A validade suficiente para o uso de saída está contida na região em que as duas fontes podem ser emprestadas. O compilador pode encurtar um empréstimo da fonte de vida mais longa para atender a essa relação.

Agora este uso **não compila**:

```rust
fn escolher<'a>(a: &'a str, b: &'a str, usar_primeiro: bool) -> &'a str {
    if usar_primeiro { a } else { b }
}

fn main() {
    let externo = String::from("primeiro");
    let resultado;

    {
        let interno = String::from("segundo");
        resultado = escolher(&externo, &interno, true);
    }

    println!("{resultado}");
}
```

Embora tenhamos passado `true`, o contrato público permite devolver qualquer entrada. O chamador precisa obedecer à assinatura. A escolha feita naquela execução não concede automaticamente uma lifetime diferente ao resultado.

As anotações documentam relações para que a função e seus chamadores possam ser verificados. Não são instruções de alocação, coleta de lixo ou extensão de escopo. Veja o capítulo oficial sobre [lifetimes em assinaturas](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).

## 4. Elisão de lifetimes

Muitas funções com referências não precisam de nomes explícitos. Existem regras de elisão, e não uma dedução irrestrita baseada em qualquer corpo de função.

### 4.1 Uma entrada emprestada

```rust
fn primeira_linha(texto: &str) -> Option<&str> {
    texto.lines().next()
}

fn main() {
    let texto = String::from("primeira\nsegunda");
    assert_eq!(primeira_linha(&texto), Some("primeira"));
}
```

A relação é equivalente, para essa assinatura, a:

```rust
// fn primeira_linha<'a>(texto: &'a str) -> Option<&'a str>
```

Cada lifetime de entrada omitida ganha inicialmente um parâmetro distinto. Se existir exatamente uma lifetime de entrada, ela pode ser atribuída às saídas omitidas. Em métodos com `&self` ou `&mut self`, há uma regra específica que associa saídas omitidas ao empréstimo do receptor.

### 4.2 Mais de uma origem possível

Uma assinatura como `fn escolher(a: &str, b: &str) -> &str` precisa explicar de qual entrada a saída pode depender. O fato de o corpo ser curto não elimina a necessidade de um contrato claro.

`'_` permite pedir uma lifetime inferida em posições apropriadas. Ele não é um atalho para fabricar a relação correta quando há ambiguidade de origem. As regras completas estão na [referência de elisão](https://doc.rust-lang.org/reference/lifetime-elision.html).

## 5. Relacionar só as entradas necessárias

Nem toda referência de entrada precisa ter a mesma lifetime. Um grep é um bom exemplo: a busca consulta um padrão, mas devolve linhas do texto pesquisado.

```rust
fn buscar<'texto>(padrao: &str, texto: &'texto str) -> Vec<&'texto str> {
    texto.lines().filter(|linha| linha.contains(padrao)).collect()
}

fn main() {
    let documento = String::from("Rust\nC\nRust e C");

    let resultados = {
        let consulta = String::from("Rust");
        buscar(&consulta, &documento)
    }; // consulta deixa de existir.

    assert_eq!(resultados, ["Rust", "Rust e C"]);
}
```

A saída armazena referências ao documento, não à consulta. Toda a busca ocorre antes de retornar o vetor, portanto a consulta pode ser destruída depois da chamada.

Se escrevêssemos a mesma lifetime para `padrao`, `texto` e saída, estaríamos impondo uma relação desnecessária ao chamador. Isso poderia impedir o exemplo acima mesmo sem haver dependência real dos resultados em relação ao armazenamento da consulta.

Há uma alocação para guardar as referências no `Vec`. Não há cópia dos bytes das linhas selecionadas. Dizer “retorno emprestado” não significa que nenhuma parte da operação aloca memória.

Também vale o caminho contrário: os resultados não podem continuar sendo usados depois que `documento` é destruído, nem enquanto uma mutação incompatível altera o buffer de origem.

## 6. Structs que emprestam dados

Uma struct com referências é uma visão sobre dados que pertencem a outra coisa:

```rust
#[derive(Debug, PartialEq, Eq)]
struct Atribuicao<'a> {
    chave: &'a str,
    valor: &'a str,
}

fn parse(linha: &str) -> Option<Atribuicao<'_>> {
    let (chave, valor) = linha.split_once('=')?;
    let chave = chave.trim();
    if chave.is_empty() {
        return None;
    }
    Some(Atribuicao { chave, valor: valor.trim() })
}

fn main() {
    let linha = String::from("linguagem = Rust");
    let atribuicao = parse(&linha).unwrap();
    assert_eq!(atribuicao.chave, "linguagem");
    assert_eq!(atribuicao.valor, "Rust");
}
```

O parser não guarda uma `String`; guarda slices da linha fornecida. Não precisa de um allocator para cada campo. Em troca, o chamador deve manter a linha válida enquanto utilizar a visão.

Usar uma lifetime para os dois campos é apropriado aqui porque ambos vêm da mesma entrada. Se uma struct armazena referências a origens independentes, pode haver motivo para declarar duas lifetimes. Só acrescente essa distinção quando ela expressar uma flexibilidade necessária à API.

É possível criar muitos registros emprestados de um único arquivo carregado em memória. Nesse desenho, o arquivo inteiro continua retido mesmo se os registros usam pequenas partes dele. Evitar cópias e minimizar memória retida são objetivos relacionados, mas não idênticos.

## 7. O empréstimo de self e o empréstimo da origem

### 7.1 Uma visão não é necessariamente dona da referência que devolve

```rust
struct Vista<'a> {
    texto: &'a str,
}

impl<'a> Vista<'a> {
    fn durante_consulta(&self) -> &str {
        self.texto
    }

    fn da_origem(&self) -> &'a str {
        self.texto
    }
}

fn main() {
    let documento = String::from("permaneço no chamador");

    let resultado = {
        let vista = Vista { texto: &documento };
        assert_eq!(vista.durante_consulta(), documento.as_str());
        vista.da_origem()
    }; // vista acaba, mas documento permanece vivo.

    println!("{resultado}");
}
```

Em `durante_consulta`, a elisão vincula a saída ao empréstimo de `self`. Em `da_origem`, a assinatura permite usar a referência segundo a validade dos dados originais. Esse segundo contrato é possível porque o campo já é uma referência compartilhada que pode ser copiada.

Não generalize isso para um campo `String` possuído pela struct. Nesse caso, uma referência aos bytes dependeria da permanência da própria proprietária. Também não se aplica automaticamente a mover um `&mut T` de um campo por meio de `&self`.

### 7.2 Evite prender todo acesso mutável à lifetime do buffer

Uma assinatura como `fn proxima(&'a mut self) -> ...` dentro de `impl<'a>` pode pedir um empréstimo exclusivo muito mais longo do que uma única chamada precisa.

Neste leitor, cada palavra aponta para o texto externo. Avançar o cursor não modifica esse texto:

```rust
struct Leitor<'a> {
    palavras: std::str::SplitWhitespace<'a>,
}

impl<'a> Leitor<'a> {
    fn novo(texto: &'a str) -> Self {
        Self { palavras: texto.split_whitespace() }
    }

    fn proxima(&mut self) -> Option<&'a str> {
        self.palavras.next()
    }
}

fn main() {
    let texto = String::from("ownership borrowing lifetimes");
    let mut leitor = Leitor::novo(&texto);
    let primeira = leitor.proxima().unwrap();
    let segunda = leitor.proxima().unwrap();

    assert_eq!((primeira, segunda), ("ownership", "borrowing"));
}
```

O empréstimo mutável de `self` dura o necessário para avançar o iterador. As referências retornadas dependem do texto externo e podem coexistir.

Um leitor que reutiliza um buffer interno de I/O tem outro contrato: a próxima leitura pode sobrescrever os bytes da linha anterior. Nesse caso, não seria correto oferecer a mesma independência. Essa diferença será importante no grep com leitura incremental.

## 8. Referências estáticas e bounds estáticos

### 8.1 &'static T é uma referência com validade estática

Literais de string são um caso comum. Um endereço de uma variável local não se torna estático porque você escreveu essa anotação.

É possível obter referências de longa duração por mecanismos como vazamento deliberado de uma alocação, mas isso muda a política de liberação. Não é uma correção genérica para empréstimos mal desenhados.

### 8.2 T: 'static não significa que o valor nunca será destruído

```rust
fn aceitar_independente<T: 'static>(valor: T) {
    drop(valor);
}

fn main() {
    let texto = String::from("vida curta, armazenamento próprio");
    aceitar_independente(texto);
}
```

O bound permite que `T` não dependa de empréstimos com validade menor que `'static`. Uma `String` possuída satisfaz esse contrato e pode ser destruída imediatamente dentro da função.

### 8.3 Threads mostram a diferença

```rust
use std::thread;

fn main() {
    let texto = String::from("transferido para a thread");
    let trabalho = thread::spawn(move || texto.len());
    assert_eq!(trabalho.join().unwrap(), 25);
}
```

O trabalho possui a string. Não depende de uma referência curta a uma variável do chamador. `thread::spawn` exige os bounds apropriados porque a thread pode sobreviver ao escopo que a criou; chamar `join` depois não altera retroativamente a assinatura de `spawn`. [Contrato de thread::spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).

Se o trabalho deve emprestar dados locais, `thread::scope` expressa uma garantia diferente: as threads do escopo terminam antes de seu retorno. Escolha a API cujo contrato corresponde ao desenho de execução.

## 9. Resultados imediatos e iteradores preguiçosos

Na seção de busca, o filtro terminava antes de devolver o vetor. Um iterador preguiçoso devolve também parte do trabalho ainda não executado:

```rust
fn buscar_depois<'a>(
    padrao: &'a str,
    texto: &'a str,
) -> impl Iterator<Item = &'a str> + 'a {
    texto.lines().filter(move |linha| linha.contains(padrao))
}

fn main() {
    let texto = String::from("Rust\nC\nRust seguro");
    let consulta = String::from("Rust");
    let resultados: Vec<_> = buscar_depois(&consulta, &texto).collect();
    assert_eq!(resultados, ["Rust", "Rust seguro"]);
}
```

O iterador guarda tanto o percurso do texto quanto a consulta usada pela closure. Os dois precisam continuar disponíveis enquanto ele executar as comparações. A saída de cada item aponta para o texto, mas o estado do processamento também depende do padrão.

Uma alternativa é receber uma `String` para o padrão e movê-la para a closure. Assim, o iterador possuirá a consulta. Outra é fazer o trabalho imediatamente, como no retorno `Vec<&str>`. As opções têm contratos e custos diferentes.

### Um objeto de trait também pode carregar um empréstimo

```rust
fn linhas<'a>(texto: &'a str) -> Box<dyn Iterator<Item = &'a str> + 'a> {
    Box::new(texto.lines())
}

fn main() {
    let texto = String::from("A\nB");
    assert_eq!(linhas(&texto).count(), 2);
}
```

O `+ 'a` descreve o bound de lifetime do objeto de trait. Em contextos como esse retorno, omitir o bound do objeto pode levar ao padrão `'static`, incompatível com a dependência do texto emprestado. O lifetime do `Item` e o bound do objeto descrevem aspectos diferentes: o tipo dos itens produzidos e o que o próprio objeto pode conter.

## 10. Quando possuir os dados é melhor

Retornar `String` pode ser mais simples e correto quando o resultado precisa ser independente de sua origem:

```rust
fn normalizar(texto: &str) -> String {
    texto.trim().to_owned()
}

fn main() {
    let resultado = {
        let entrada = String::from("  Rust  ");
        normalizar(&entrada)
    };
    assert_eq!(resultado, "Rust");
}
```

Essa implementação faz uma cópia dos bytes selecionados. Se o chamador precisa guardar o resultado por muito tempo, esse custo pode ser apropriado e evitar reter um buffer original enorme.

Outra possibilidade é `Cow<'a, str>`, que pode representar texto emprestado ou possuído. Ele é útil quando algumas transformações exigem alocação e outras podem devolver a entrada. Ainda será necessário decidir o que o chamador precisa: `into_owned` pode produzir independência, clonando quando a variante era emprestada.

Não avalie uma API apenas pelo número de anotações de lifetime. Observe quem paga por alocação, quanto armazenamento permanece retido e quão difícil fica combinar as operações.

## 11. Autorreferência, índices e limites do modelo

### 11.1 A struct que possui texto e aponta para si mesma

Uma tentativa comum é guardar `String` e `&str` para dentro dessa mesma string em uma struct. Uma lifetime simples não descreve automaticamente “esse campo aponta para aquele outro campo deste mesmo objeto”.

Mesmo que mover uma `String` não mova seus bytes alocados, a estrutura ainda precisa impedir substituição, liberação e modificações que invalidem os slices. Não basta observar um endereço estável em uma execução.

Uma alternativa segura é guardar intervalos e produzir referências sob demanda:

```rust
use std::ops::Range;

struct Documento {
    texto: String,
    titulo: Range<usize>,
}

impl Documento {
    fn novo(texto: String) -> Self {
        let fim = texto.find('\n').unwrap_or(texto.len());
        Self { texto, titulo: 0..fim }
    }

    fn titulo(&self) -> &str {
        &self.texto[self.titulo.clone()]
    }
}

fn main() {
    let documento = Documento::novo("Rust\nConteúdo".into());
    assert_eq!(documento.titulo(), "Rust");
}
```

Os campos são privados. O construtor encontra um limite válido de UTF-8, e a API não permite alterar o texto sem atualizar os intervalos. O retorno de `titulo` empresta `self` apenas durante seu uso. `Range::clone` copia o intervalo; não clona a string.

Se você adicionar edição, os offsets também precisarão acompanhar as mudanças. Índices eliminam uma categoria de empréstimo persistente, mas não tornam a identidade ou a posição dos dados imutável.

### 11.2 Limites da análise

O borrow checker trabalha com tipos e assinaturas, e não prova toda relação dinâmica que um programa poderia manter. Algumas reorganizações permitem expressar a mesma operação de maneira verificável. O Rustonomicon discute casos em que o contrato de lifetime restringe usos além do que uma implementação específica aparenta exigir. [Limits of Lifetimes](https://doc.rust-lang.org/nomicon/lifetime-mismatch.html).

Quando um erro parece artificial, primeiro reduza o exemplo e identifique a origem da referência e a região bloqueada. Um cast de ponteiro não remove a obrigação de manter a memória válida; apenas pode tirar a verificação das mãos do compilador.

## 12. Testando contratos emprestados

Em uma crate de estudo chamada `laboratorio_lifetimes`, você pode colocar esta implementação e seus testes em `src/lib.rs`:

```rust
/// Seleciona linhas emprestadas do texto, sem reter o padrão.
///
/// A saída não pode sobreviver à entrada:
///
/// ```compile_fail
/// use laboratorio_lifetimes::buscar;
/// let encontrados;
/// {
///     let texto = String::from("Rust");
///     encontrados = buscar("Rust", &texto);
/// }
/// println!("{encontrados:?}");
/// ```
pub fn buscar<'a>(padrao: &str, texto: &'a str) -> Vec<&'a str> {
    texto.lines().filter(|linha| linha.contains(padrao)).collect()
}

#[cfg(test)]
mod tests {
    use super::buscar;

    #[test]
    fn consulta_pode_ser_descartada_antes_do_resultado() {
        let texto = String::from("Rust\nC");
        let encontrados = {
            let padrao = String::from("Rust");
            buscar(&padrao, &texto)
        };
        assert_eq!(encontrados, ["Rust"]);
    }

    #[test]
    fn linha_aponta_para_o_buffer_original() {
        let texto = String::from("Rust\nC");
        let encontrados = buscar("Rust", &texto);
        assert_eq!(encontrados[0].as_ptr(), texto.as_ptr());
    }

    #[test]
    fn ausente_produz_colecao_vazia() {
        assert!(buscar("Go", "Rust\nC").is_empty());
    }
}
```

Execute `cargo test` no exercício. Os testes comuns verificam comportamento e possibilidades permitidas pelo contrato. O doctest `compile_fail` verifica que aquele uso inválido continua sendo rejeitado.

Um teste de compilação que falha pode falhar pelo motivo errado, por exemplo um import incorreto. Por isso o nome do pacote e o caminho público usados no exemplo precisam corresponder ao projeto de teste. A mensagem esperada também merece revisão quando o contrato for alterado.

## 13. Como ler e corrigir os diagnósticos

Faça duas perguntas separadas: **de onde vêm os bytes?** e **qual referência ainda precisa deles?**

| Situação | Causa provável | Caminho de solução |
| --- | --- | --- |
| “missing lifetime specifier” | Mais de uma relação possível na saída | Declarar de qual entrada a saída depende |
| “does not live long enough” | O uso exige a origem depois de sua validade | Mudar o proprietário ou encurtar o uso |
| Retorno de referência a local | O recurso morre antes do chamador usar | Retornar um valor possuído |
| Mutação bloqueada por resultado | O resultado ainda empresta a entrada | Consumir o resultado antes de modificar ou copiar deliberadamente |
| Segundo método mutável recusado | Empréstimo anterior continua exigido | Separar lifetime do receptor e do armazenamento quando válido |
| API exige `'static` | O valor não pode depender de empréstimos curtos | Transferir propriedade ou escolher uma API com escopo |

As anotações corretas revelam um desenho de propriedade coerente. Se você precisa prometer uma validade que nenhum objeto consegue fornecer, a correção está no desenho, não no nome escolhido para `'a`.

## 14. Exercícios e referências

1. Escreva `fn valor(linha: &str) -> Option<&str>` para devolver a parte depois do primeiro `=`. Primeiro use elisão; depois escreva a assinatura explícita equivalente.
2. Crie uma função que recebe duas strings, mas sempre retorna parte apenas da primeira. Permita que a segunda seja temporária e prove isso com um exemplo compilável.
3. Mude a busca imediata para retornar `Vec<String>`. Mostre que os resultados sobrevivem ao texto e identifique as cópias acrescentadas.
4. Mantenha duas palavras retornadas por `Leitor::proxima` em uso. Explique por que isso funciona, enquanto duas visões consecutivas de um único buffer de leitura reutilizável podem não funcionar.
5. Adicione um método de substituição de conteúdo a `Documento`, recalculando seu intervalo de título. Escreva um exemplo que precise terminar o uso de `titulo()` antes de substituir o texto.

Referências:

- [Lifetimes no Rust Book](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).
- [Regras de elisão](https://doc.rust-lang.org/reference/lifetime-elision.html).
- [Limites dos contratos de lifetime](https://doc.rust-lang.org/nomicon/lifetime-mismatch.html).
- [thread::spawn](https://doc.rust-lang.org/std/thread/fn.spawn.html).

Próxima etapa: [[Rust/Construindo um grep|Construindo um grep — do contrato de referências a uma ferramenta executável]].
