# Rust: do zero ao avançado para quem já domina C

Esta aula parte de uma vantagem: você já entende memória, ponteiros, representação binária, stack, heap e o custo das operações. Por isso, o objetivo não é ensinar o que é uma variável. É construir o modelo mental de Rust, relacionando cada novidade a problemas que você já conhece em C.

Ao terminar, você terá percorrido a linguagem básica, ownership, empréstimos, lifetimes, modelagem com tipos, tratamento de erros, abstrações, concorrência, programação assíncrona, código `unsafe` e interoperabilidade com C. O projeto final reúne esses assuntos em um parser de protocolo binário sem copiar o payload.

Uma aula, mesmo extensa, não substitui a experiência de projetar bibliotecas e depurar sistemas reais. Os tópicos avançados incluem as invariantes que você precisa entender para continuar estudando com autonomia.

> [!note] Como acompanhar os exemplos
> Use Rust estável com suporte à **edition 2024**. Essa edição foi introduzida no Rust 1.85; edição e versão do compilador são conceitos diferentes. Os blocos com `fn main()` são programas independentes: coloque um por vez em `src/main.rs`. Blocos identificados como trechos precisam do contexto indicado. Exemplos que devem falhar estão explicitamente marcados. [Referência sobre a edição](https://doc.rust-lang.org/edition-guide/rust-2024/).

## Roteiro

1. [A mudança de modelo mental](#1-a-mudança-de-modelo-mental)
2. [Ambiente, Cargo e primeiro programa](#2-ambiente-cargo-e-primeiro-programa)
3. [Sintaxe, tipos e expressões](#3-sintaxe-tipos-e-expressões)
4. [Ownership, move, Copy e Clone](#4-ownership-move-copy-e-clone)
5. [Borrowing: referências e exclusividade](#5-borrowing-referências-e-exclusividade)
6. [Arrays, slices e vetores](#6-arrays-slices-e-vetores)
7. [Strings, UTF-8 e bytes](#7-strings-utf-8-e-bytes)
8. [Structs, métodos e invariantes](#8-structs-métodos-e-invariantes)
9. [Enums, padrões e estados válidos](#9-enums-padrões-e-estados-válidos)
10. [Erros com Option, Result e o operador ?](#10-erros-com-option-result-e-o-operador-)
11. [Lifetimes sem misticismo](#11-lifetimes-sem-misticismo)
12. [Generics, traits e polimorfismo](#12-generics-traits-e-polimorfismo)
13. [Closures e iteradores](#13-closures-e-iteradores)
14. [Módulos, crates e organização](#14-módulos-crates-e-organização)
15. [Coleções e escolhas de representação](#15-coleções-e-escolhas-de-representação)
16. [RAII, Drop e ponteiros inteligentes](#16-raii-drop-e-ponteiros-inteligentes)
17. [Mutabilidade interior e compartilhamento](#17-mutabilidade-interior-e-compartilhamento)
18. [Threads, Send, Sync e canais](#18-threads-send-sync-e-canais)
19. [Atômicos e ordenação de memória](#19-atômicos-e-ordenação-de-memória)
20. [Async, Future e Pin](#20-async-future-e-pin)
21. [Unsafe e contratos de segurança](#21-unsafe-e-contratos-de-segurança)
22. [Layout, inicialização e ponteiros brutos](#22-layout-inicialização-e-ponteiros-brutos)
23. [Interoperabilidade com C](#23-interoperabilidade-com-c)
24. [Tipos avançados e desenho de APIs](#24-tipos-avançados-e-desenho-de-apis)
25. [Macros declarativas e procedurais](#25-macros-declarativas-e-procedurais)
26. [Testes, ferramentas e desempenho](#26-testes-ferramentas-e-desempenho)
27. [Projeto final: parser binário sem cópia](#27-projeto-final-parser-binário-sem-cópia)
28. [Como traduzir padrões de C para Rust](#28-como-traduzir-padrões-de-c-para-rust)
29. [Exercícios progressivos](#29-exercícios-progressivos)
30. [Referências e próximos estudos](#30-referências-e-próximos-estudos)

## 1. A mudança de modelo mental

Em C, um ponteiro descreve um endereço e um tipo de acesso. O contrato de uso costuma ficar fora do sistema de tipos:

```c
char *ler_nome(void);
void processar(const char *nome);
void substituir(char **destino, const char *origem);
```

Apenas olhando essas assinaturas, você não sabe tudo. Quem libera o resultado de `ler_nome`? `processar` guarda o ponteiro? `substituir` libera o destino antigo? O ponteiro pode ser nulo? A string tem terminador? O chamador precisa conhecer a documentação e manter essas regras em todos os caminhos de execução.

Em Rust, uma parte maior desse contrato aparece nos tipos:

```rust
// Assinaturas ilustrativas, não definições completas.
// fn ler_nome() -> String;
// fn processar(nome: &str);
// fn substituir(destino: &mut String, origem: &str);
```

`String` representa um texto possuído. `&str` representa uma visão emprestada de texto UTF-8. `&mut String` permite modificar uma string durante um empréstimo exclusivo. Isso não especifica toda a semântica de negócio, mas elimina várias ambiguidades sobre memória.

Rust combina controle de baixo nível com verificações estáticas. Não exige um coletor de lixo de rastreamento para gerenciar valores comuns. Destrutores liberam recursos, e o compilador restringe os usos que poderiam deixar referências penduradas ou acessos incompatíveis.

| Em C você precisa garantir… | Em Rust o desenho usual é… |
| --- | --- |
| Uma alocação é liberada exatamente pelo responsável | Um proprietário controla a liberação |
| Um ponteiro emprestado não sobrevive ao recurso | Lifetimes restringem a validade da referência |
| Escritas concorrentes são sincronizadas | Tipos e primitivas de sincronização restringem o compartilhamento |
| Um erro é distinguível de um resultado válido | `Result<T, E>` |
| A ausência de um objeto é tratada | `Option<T>` |
| Um par ponteiro/comprimento é consistente | Slice `&[T]` |
| Uma tag corresponde ao conteúdo de uma união | `enum` com dados |

Segurança de memória não significa correção total. Rust seguro ainda permite deadlocks, loops infinitos, vazamentos lógicos, estouro de recursos, erros de protocolo e condições de corrida de negócio. E as garantias dependem de implementações corretas nos trechos `unsafe`, nas bibliotecas e nas interfaces externas.

## 2. Ambiente, Cargo e primeiro programa

Instale a toolchain pelo procedimento oficial do [rustup](https://rustup.rs/). Uma toolchain reúne compilador, biblioteca padrão e ferramentas. Depois da instalação:

```sh
rustc --version
cargo --version
rustup show
cargo new laboratorio_rust --edition 2024
cd laboratorio_rust
cargo run
```

Cargo combina funções que em projetos C costumam estar distribuídas entre gerenciador de dependências, scripts de build e convenções de diretórios.

```text
laboratorio_rust/
├── Cargo.toml
├── Cargo.lock
└── src/
    └── main.rs
```

`Cargo.toml` descreve o pacote:

```toml
[package]
name = "laboratorio_rust"
version = "0.1.0"
edition = "2024"

[dependencies]
```

`Cargo.lock` registra a resolução de dependências. Em uma aplicação, versione-o para reproduzir a resolução do build. `edition` seleciona regras de compatibilidade da linguagem; não fixa a versão exata do compilador.

Primeiro programa:

```rust
fn main() {
    let linguagem = "Rust";
    println!("Olá, {linguagem}!");
}
```

O `!` em `println!` indica uma macro. A formatação é verificada durante a compilação; não é uma função variádica como `printf` interpretando tipos informalmente.

Comandos frequentes:

```sh
cargo check
cargo run
cargo test
cargo fmt
cargo clippy
cargo build --release
cargo doc --open
rustc --explain E0382
```

`cargo check` verifica o programa sem gerar o executável final. `cargo run` compila e executa. `--release` seleciona o perfil otimizado. `rustc --explain` detalha um diagnóstico: aprender a ler os erros faz parte do aprendizado de Rust.

## 3. Sintaxe, tipos e expressões

### 3.1 Imutabilidade, mutabilidade e shadowing

```rust
fn main() {
    let limite: u32 = 100;
    let mut total = 0_u32;
    total += 7;

    let entrada = "42";
    let entrada: u32 = entrada.parse().expect("número conhecido no exemplo");

    println!("limite={limite}, total={total}, entrada={entrada}");
}
```

Uma associação criada com `let` é imutável por padrão. `mut` permite mudar seu valor. Shadowing cria outra associação com o mesmo nome, inclusive de outro tipo; não converte a variável antiga magicamente.

`expect` encerra esse caminho com panic se houver erro. Aqui a entrada é um literal controlado. Para entrada externa, aprenderemos a retornar um erro.

### 3.2 Tipos numéricos e conversões

Inteiros têm larguras explícitas: `i8`, `i16`, `i32`, `i64`, `i128` e equivalentes sem sinal `u8` até `u128`. `usize` e `isize` acompanham a largura de ponteiro da plataforma. Índices de coleções usam `usize`.

`f32` e `f64` são os tipos usuais de ponto flutuante. `bool` não é um inteiro, e condições não aceitam conversão implícita de números para verdadeiro/falso. `char` representa um valor escalar Unicode, não um byte; ocupa quatro bytes.

```rust
fn main() {
    let pequeno: u8 = 200;
    let ampliado = u32::from(pequeno); // Conversão sem perda.

    let grande: u16 = 300;
    let validado = u8::try_from(grande); // Err: 300 não cabe.
    let truncado = grande as u8;        // 44: descarta bits altos.

    assert_eq!(ampliado, 200);
    assert!(validado.is_err());
    assert_eq!(truncado, 44);

    assert_eq!(u8::MAX.checked_add(1), None);
    assert_eq!(u8::MAX.wrapping_add(1), 0);
    assert_eq!(u8::MAX.saturating_add(1), 255);
    assert_eq!(u8::MAX.overflowing_add(1), (0, true));
}
```

Não use `as` como sinônimo de validação. Em código de tamanho de buffer e protocolos, prefira conversões verificadas e aritmética `checked_*` quando o excesso precisa ser rejeitado.

Overflow de inteiros em operações comuns normalmente causa panic no perfil de desenvolvimento e usa wrap no perfil release padrão; as verificações são configuráveis. Expressões constantes também podem ser rejeitadas na compilação. Escreva explicitamente a política desejada, em vez de depender do perfil. Isso é diferente de assumir que overflow assinado funciona como em C, onde ele é comportamento indefinido.

### 3.3 Expressões retornam valores

```rust
fn absoluto(x: i64) -> Option<i64> {
    x.checked_abs()
}

fn main() {
    let pontos = 80;
    let situacao = if pontos >= 60 { "aprovado" } else { "reprovado" };

    let calculado = {
        let base = 10;
        base * 3
    };

    println!("{situacao}: {calculado}, {:?}", absoluto(-12));
}
```

A última expressão de um bloco, sem `;`, é seu valor. Adicionar `;` descarta esse valor e normalmente faz o bloco produzir `()`, o tipo unit. `return` continua disponível para saídas antecipadas.

O retorno de `absoluto` é opcional porque o módulo do menor `i64` não cabe em um `i64` positivo. A assinatura torna essa borda explícita.

### 3.4 Laços, tuplas e pattern matching básico

```rust
fn main() {
    let coordenada = (12_i32, -4_i32);
    let (x, y) = coordenada;

    for indice in 0..3 {
        println!("{indice}: ({x}, {y})");
    }

    let mut tentativa = 0;
    let resultado = loop {
        tentativa += 1;
        if tentativa == 3 {
            break tentativa * 10;
        }
    };

    assert_eq!(resultado, 30);
}
```

`0..3` exclui o limite final; `0..=3` inclui. `loop` pode produzir um valor com `break valor`. `while` existe, mas a iteração direta sobre elementos frequentemente expressa melhor a intenção do que um índice manual.

## 4. Ownership, move, Copy e Clone

### 4.1 O problema que você resolve manualmente em C

Imagine um buffer alocado com `malloc`. Copiar seu ponteiro não duplica a alocação. Se duas partes do programa se considerarem responsáveis por `free`, você tem double free. Se nenhuma se considerar responsável, há vazamento. Se uma liberar enquanto outra usa, há use-after-free.

Rust trata a transferência de responsabilidade como parte da semântica das operações.

```rust
fn consumir(texto: String) {
    println!("Recebi: {texto}");
} // texto é destruído aqui.

fn main() {
    let primeiro = String::from("memória");
    let segundo = primeiro; // Move: segundo assume o valor.

    // println!("{primeiro}"); // NÃO COMPILA: uso após move.
    consumir(segundo);       // Outro move, agora para a função.
    // println!("{segundo}"); // NÃO COMPILA.
}
```

Não interprete move como “copiar profundamente a memória”. Ao mover uma `String`, transfere-se seu controle sobre o armazenamento. O compilador pode eliminar movimentações físicas; a propriedade semântica importante é que a origem deixa de poder ser usada como dona daquele valor.

Modelo conceitual, sem prometer a ordem dos campos na memória:

```text
antes:
primeiro ── descritor { ponteiro, comprimento, capacidade } ──► bytes

depois do move:
primeiro: indisponível
segundo ── descritor { ponteiro, comprimento, capacidade } ──► mesmos bytes
```

Ownership não é restrito ao heap. Uma struct armazenada localmente também pode ser movida. “Ficar na stack” e “implementar `Copy`” são propriedades diferentes.

### 4.2 Copy é uma autorização de duplicação implícita

```rust
#[derive(Debug, Clone, Copy)]
struct Coordenada {
    x: i32,
    y: i32,
}

fn main() {
    let a = Coordenada { x: 3, y: 5 };
    let b = a; // Cópia implícita; a continua utilizável.

    println!("a=({}, {}), b={b:?}", a.x, a.y);
}
```

Inteiros, booleanos e vários outros tipos simples implementam `Copy`. Uma struct só pode implementar `Copy` se seus campos também puderem. Um tipo com destrutor `Drop` não pode implementar `Copy`.

Uma referência compartilhada `&T` é `Copy`, mesmo se `T` não for. Copiar a referência não copia o objeto. Já `&mut T` não é `Copy`: duplicar indiscriminadamente uma permissão exclusiva quebraria o contrato.

### 4.3 Clone é uma operação explícita definida pelo tipo

```rust
fn main() {
    let original = String::from("buffer próprio");
    let mut copia = original.clone();
    copia.push('!');

    assert_eq!(original, "buffer próprio");
    assert_eq!(copia, "buffer próprio!");
}
```

Para `String`, `clone` duplica os bytes em armazenamento independente. Para `Rc` e `Arc`, que veremos adiante, ele cria outro handle para a mesma alocação e incrementa uma contagem. Portanto, `Clone` não significa universalmente “cópia profunda” nem “operação barata”.

> [!tip] Antes de adicionar clone
> Pergunte se a próxima função precisa possuir o valor ou apenas observá-lo. Um empréstimo costuma representar melhor uma leitura temporária. Use cópia quando a independência dos dados realmente fizer parte do requisito.

### 4.4 Retornar valores transfere a propriedade

```rust
fn montar_mensagem(nome: &str) -> String {
    format!("Bem-vindo, {nome}!")
}

fn main() {
    let mensagem = montar_mensagem("Ana");
    println!("{mensagem}");
}
```

O buffer criado na função não é destruído antes do retorno: seu proprietário passa a ser o chamador. Não é necessário retornar um ponteiro para uma variável local nem pedir ao chamador que adivinhe como liberar o resultado.

A documentação de [ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html) descreve essas regras de propriedade e transferência.

## 5. Borrowing: referências e exclusividade

### 5.1 Emprestar para ler ou modificar

```rust
fn tamanho(texto: &str) -> usize {
    texto.len()
}

fn acrescentar(texto: &mut String) {
    texto.push_str(" + Rust");
}

fn main() {
    let mut assunto = String::from("C");
    let bytes = tamanho(&assunto);
    acrescentar(&mut assunto);

    assert_eq!(bytes, 1);
    assert_eq!(assunto, "C + Rust");
}
```

`&assunto` cria um empréstimo compartilhado. A coerção de `&String` para `&str` permite usar uma API que só precisa observar texto. `&mut assunto` empresta a string com exclusividade para modificá-la, sem transferir sua propriedade.

Para a região de memória emprestada, a regra operacional básica é:

- Vários empréstimos compartilhados podem coexistir.
- Um empréstimo mutável exige acesso exclusivo enquanto estiver ativo.
- Uma referência deve permanecer válida durante todos os seus usos.

O segundo ponto vai além de “não ter dois escritores”. Uma leitura por outra referência também pode conflitar com um empréstimo mutável ativo. A exclusividade permite ao compilador assumir que acessos incompatíveis não acontecem por caminhos independentes. Existem abstrações de mutabilidade interior com regras próprias, apresentadas mais adiante.

### 5.2 O borrow checker acompanha os usos

```rust
fn main() {
    let mut texto = String::from("Rust");
    let leitura = &texto;
    println!("Antes: {leitura}"); // Último uso de leitura.

    texto.push_str(" estável");  // Permitido após esse último uso.
    println!("Depois: {texto}");
}
```

O empréstimo não precisa durar até a chave final do bloco apenas porque a variável ainda está no escopo. A análise considera onde a referência é utilizada, comportamento associado a *non-lexical lifetimes*.

Este outro programa **deve falhar na compilação**:

```rust
fn main() {
    let mut valores = vec![10, 20, 30];
    let primeiro = &valores[0];

    valores.push(40); // Exige acesso mutável; pode realocar o buffer.
    println!("{primeiro}"); // Mantém o empréstimo anterior necessário.
}
```

Em C, uma operação semelhante a `realloc` poderia invalidar o ponteiro salvo. Rust recusa esse padrão. Mesmo reservar capacidade suficiente não libera genericamente a operação: o contrato de `push` exige `&mut Vec<T>`.

Possíveis soluções dependem da intenção: copie o número se ele for `Copy`, use o índice novamente depois da modificação, termine o uso da referência antes de modificar ou reorganize a estrutura de dados.

### 5.3 Reborrow e regiões disjuntas

```rust
fn incrementar(valor: &mut i32) {
    *valor += 1;
}

fn main() {
    let mut numero = 0;
    let referencia = &mut numero;

    incrementar(referencia); // Reempréstimo temporário.
    incrementar(referencia);
    assert_eq!(*referencia, 2);

    let mut dados = [1, 2, 3, 4];
    let (esquerda, direita) = dados.split_at_mut(2);
    esquerda[0] = 10;
    direita[0] = 30;
    assert_eq!(dados, [10, 2, 30, 4]);
}
```

Reemprestar `&mut T` temporariamente não equivale a copiar a referência. Durante o reempréstimo, o acesso passa pelo novo empréstimo; depois dele, a referência original pode voltar a ser utilizada.

`split_at_mut` representa uma prova encapsulada pela biblioteca: os dois slices cobrem regiões disjuntas. Em vez de “enganar o compilador” com ponteiros, escolha APIs que expressem a separação dos dados.

Consulte as regras e os exemplos de [referências e borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).

## 6. Arrays, slices e vetores

### 6.1 Três abstrações distintas

| Tipo | Possui elementos? | Comprimento | Uso típico |
| --- | --- | --- | --- |
| `[T; N]` | Sim | Parte do tipo | Buffer de tamanho fixo |
| `&[T]` | Não | Metadado da referência | Ler uma sequência emprestada |
| `&mut [T]` | Não | Metadado da referência | Alterar elementos emprestados |
| `Vec<T>` | Sim | Variável | Sequência contígua que pode crescer |

Um array é armazenado inline onde seu proprietário estiver: em uma variável local, dentro de uma struct ou dentro de uma alocação. “Array sempre fica na stack” é uma simplificação incorreta.

Um slice `[T]` tem tamanho dinâmico. Geralmente você o manipula por uma referência que carrega endereço e comprimento. `&[T]` corresponde conceitualmente ao par ponteiro/comprimento usado em C, com um contrato adicional de validade.

```rust
fn soma(valores: &[i32]) -> i64 {
    valores.iter().map(|&n| i64::from(n)).sum()
}

fn zerar(valores: &mut [i32]) {
    valores.fill(0);
}

fn main() {
    let fixo = [10, 20, 30];
    let mut dinamico = vec![40, 50, 60];

    assert_eq!(soma(&fixo), 60);
    assert_eq!(soma(&dinamico[1..]), 110);

    zerar(&mut dinamico[..2]);
    assert_eq!(dinamico, [0, 0, 60]);
}
```

Receber `&[T]` em vez de `&Vec<T>` evita restringir a API a uma única forma de armazenamento. Quando a função precisa aumentar a coleção, `&mut Vec<T>` faz sentido; um slice não controla a capacidade.

### 6.2 Comprimento não é capacidade

```rust
fn main() {
    let mut bytes = Vec::<u8>::with_capacity(8);
    assert_eq!(bytes.len(), 0);
    assert!(bytes.capacity() >= 8);

    bytes.extend_from_slice(&[10, 20, 30]);
    assert_eq!(bytes.len(), 3);

    assert_eq!(bytes.get(1), Some(&20));
    assert_eq!(bytes.get(99), None);
}
```

Capacidade reservada não cria elementos inicializados. `bytes[0]` antes do primeiro `push` causaria panic, mesmo havendo espaço alocado. `get` oferece acesso verificável sem panic por índice inválido.

Para tipos de tamanho diferente de zero, `Vec` administra armazenamento contíguo; crescer além da capacidade pode realocar. Tipos de tamanho zero têm tratamento especial. Não dependa da ordem interna dos campos nem de um fator fixo de crescimento: consulte as [garantias de Vec](https://doc.rust-lang.org/std/vec/struct.Vec.html#guarantees).

## 7. Strings, UTF-8 e bytes

### 7.1 String não é um char * terminado em zero

`String` possui texto UTF-8 que pode crescer. `str` é uma sequência de texto UTF-8 de tamanho dinâmico, normalmente acessada por `&str`. Nenhum dos dois exige terminador NUL. O caractere `\0` pode inclusive aparecer dentro do texto.

```rust
fn main() {
    let texto = String::from("ação");

    assert_eq!(texto.len(), 6);           // Bytes UTF-8.
    assert_eq!(texto.chars().count(), 4); // Valores escalares Unicode.
    assert_eq!(texto.get(0..1), Some("a"));
    assert_eq!(texto.get(1..3), Some("ç"));
    assert_eq!(texto.get(1..2), None);    // Corta um caractere no meio.

    for (offset, caractere) in texto.char_indices() {
        println!("byte {offset}: {caractere}");
    }
}
```

`texto[0]` não é uma operação disponível para strings. Um índice numérico sozinho não esclarece se você quer um byte, um valor escalar ou um caractere percebido pelo usuário. Um grafema, como uma letra com acento combinante ou certos emojis, pode conter vários valores escalares. `chars()` não faz segmentação de grafemas.

Para protocolo binário, use bytes. Converta para texto apenas quando o protocolo exigir UTF-8:

```rust
fn main() -> Result<(), std::str::Utf8Error> {
    let bytes: &[u8] = b"GET / HTTP/1.1";
    let texto = std::str::from_utf8(bytes)?;
    assert!(texto.starts_with("GET"));
    Ok(())
}
```

`from_utf8` valida e empresta; não precisa copiar os bytes. `String::from_utf8(Vec<u8>)` recebe a propriedade de um vetor e tenta transformá-lo em string. `from_utf8_lossy` pode substituir sequências inválidas, o que só é adequado quando essa perda é aceitável.

### 7.2 Parsing emprestado

```rust
fn separar_atribuicao(linha: &str) -> Option<(&str, &str)> {
    let (chave, valor) = linha.split_once('=')?;
    Some((chave.trim(), valor.trim()))
}

fn main() {
    let configuracao = String::from("porta = 8080");
    let (chave, valor) = separar_atribuicao(&configuracao).unwrap();
    assert_eq!((chave, valor), ("porta", "8080"));
}
```

As duas referências retornadas apontam para partes da string original. Não há necessidade de alocar uma string para a chave e outra para o valor. Em contrapartida, elas não podem continuar em uso após a destruição ou uma modificação incompatível de `configuracao`.

## 8. Structs, métodos e invariantes

```rust
#[derive(Debug)]
struct Conta {
    titular: String,
    saldo_centavos: u64,
}

impl Conta {
    fn nova(titular: impl Into<String>) -> Self {
        Self {
            titular: titular.into(),
            saldo_centavos: 0,
        }
    }

    fn titular(&self) -> &str {
        &self.titular
    }

    fn depositar(&mut self, valor: u64) -> Result<(), &'static str> {
        let novo_saldo = self.saldo_centavos
            .checked_add(valor)
            .ok_or("saldo excede o limite")?;
        self.saldo_centavos = novo_saldo;
        Ok(())
    }

    fn encerrar(self) -> u64 {
        self.saldo_centavos
    }
}

fn main() -> Result<(), &'static str> {
    let mut conta = Conta::nova("Lia");
    conta.depositar(12_500)?;
    println!("Titular: {}", conta.titular());

    let saldo_final = conta.encerrar();
    assert_eq!(saldo_final, 12_500);
    // conta.depositar(10)?; // NÃO COMPILA: encerrar consumiu conta.
    Ok(())
}
```

`impl Conta` reúne funções associadas e métodos. `Self` é o tipo sendo implementado. `Conta::nova` não recebe uma instância. Os receptores descrevem permissões:

- `&self`: observa a instância.
- `&mut self`: modifica por empréstimo exclusivo.
- `self`: recebe a instância por valor, normalmente consumindo-a.

`impl Into<String>` aceita tipos que podem ser convertidos em `String`. Uma string já possuída pode ser movida; um `&str` será convertido para armazenamento próprio. Estudaremos traits para entender essa assinatura.

Modelar dinheiro com centavos inteiros evita alguns problemas de representação binária de ponto flutuante, mas uma aplicação financeira real ainda precisa definir moeda, arredondamentos e regras de negócio. Aqui o domínio é apenas um exemplo de invariantes.

Rust não precisa de herança de classes para associar comportamento a dados. Composição, enums e traits cobrem necessidades diferentes. Campos privados em um módulo, combinados com construtores e métodos, permitem impedir que código externo crie estados inválidos.

## 9. Enums, padrões e estados válidos

Um `enum` de Rust pode carregar dados diferentes em cada variante. É próximo de uma tagged union de C cujo uso consistente é verificado pelo compilador.

```rust
#[derive(Debug)]
enum Comando {
    Sair,
    Escrever { chave: String, valor: Vec<u8> },
    Ler(String),
}

fn executar(comando: Comando) {
    match comando {
        Comando::Sair => println!("Encerrando"),
        Comando::Escrever { chave, valor } => {
            println!("Gravar {} bytes em {chave}", valor.len());
        }
        Comando::Ler(chave) => println!("Ler {chave}"),
    }
}

fn main() {
    executar(Comando::Escrever {
        chave: "tema".into(),
        valor: b"escuro".to_vec(),
    });
    executar(Comando::Ler("tema".into()));
    executar(Comando::Sair);
}
```

`match` precisa cobrir todas as possibilidades. Quando você adiciona uma variante, os matches exaustivos revelam os pontos que precisam ser atualizados. Um braço `_` captura o restante, mas também pode esconder lugares que mereceriam revisão.

O exemplo consome `comando` e pode mover os campos de suas variantes. Com `match &comando`, os campos são examinados por referência. Esse detalhe evita copiar dados só para decidir o que fazer.

Padrões também permitem desestruturar slices e aplicar condições:

```rust
fn classificar(bytes: &[u8]) -> &'static str {
    match bytes {
        [] => "vazio",
        [0x7f, b'E', b'L', b'F', ..] => "assinatura ELF",
        [primeiro, ..] if *primeiro < 0x20 => "inicia com byte de controle",
        _ => "outro conteúdo",
    }
}

fn main() {
    assert_eq!(classificar(b"\x7fELFrestante"), "assinatura ELF");
}
```

Reconhecer a assinatura não valida um arquivo ELF inteiro. A vantagem aqui é representar o formato do teste diretamente no padrão.

`if let` é útil quando só uma variante interessa. `let ... else` permite extrair uma forma e sair cedo quando ela não ocorre:

```rust
fn mostrar_primeiro(valores: &[i32]) {
    let Some(primeiro) = valores.first() else {
        println!("Coleção vazia");
        return;
    };

    println!("Primeiro: {primeiro}");
}

fn main() {
    mostrar_primeiro(&[7, 8]);
    mostrar_primeiro(&[]);
}
```

## 10. Erros com Option, Result e o operador ?

### 10.1 Ausência não é necessariamente erro

`Option<T>` possui as variantes `Some(T)` e `None`. `Result<T, E>` possui `Ok(T)` e `Err(E)`. São enums comuns da biblioteca padrão, usados para expressar contratos.

```rust
fn buscar_porta(texto: &str) -> Result<Option<u16>, std::num::ParseIntError> {
    let Some(valor) = texto.strip_prefix("porta=") else {
        return Ok(None);
    };

    let porta = valor.parse::<u16>()?;
    Ok(Some(porta))
}

fn main() -> Result<(), std::num::ParseIntError> {
    assert_eq!(buscar_porta("porta=8080")?, Some(8080));
    assert_eq!(buscar_porta("tema=escuro")?, None);
    assert!(buscar_porta("porta=abc").is_err());
    Ok(())
}
```

Há três resultados semanticamente distintos: não é uma configuração de porta; é uma porta válida; parece uma porta, mas seu conteúdo é inválido. Um `-1` ou um ponteiro nulo não expressaria essa distinção tão claramente.

### 10.2 O que ? faz

No caso usual de `Result`, `expressao?` extrai o valor de `Ok` ou retorna antecipadamente um erro, convertendo o tipo do erro quando existe uma conversão apropriada. Para `Option`, extrai `Some` ou retorna `None`.

`?` não lança uma exceção. O tipo de retorno precisa ser compatível. Não dá para usar `?` de um `Option` arbitrariamente em uma função que retorna `Result`: primeiro transforme a ausência em erro, por exemplo com `ok_or` ou `ok_or_else`.

### 10.3 Um tipo de erro próprio

```rust
use std::{error::Error, fmt, num::ParseIntError};

#[derive(Debug)]
enum ErroPorta {
    Formato(ParseIntError),
    Zero,
}

impl fmt::Display for ErroPorta {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Formato(erro) => write!(f, "porta inválida: {erro}"),
            Self::Zero => write!(f, "a porta precisa ser diferente de zero"),
        }
    }
}

impl Error for ErroPorta {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Formato(erro) => Some(erro),
            Self::Zero => None,
        }
    }
}

impl From<ParseIntError> for ErroPorta {
    fn from(erro: ParseIntError) -> Self {
        Self::Formato(erro)
    }
}

fn ler_porta(texto: &str) -> Result<u16, ErroPorta> {
    let porta = texto.parse::<u16>()?;
    if porta == 0 {
        return Err(ErroPorta::Zero);
    }
    Ok(porta)
}

fn main() -> Result<(), ErroPorta> {
    let porta = ler_porta("8080")?;
    println!("Porta: {porta}");
    Ok(())
}
```

`Debug` atende à inspeção técnica, `Display` define a mensagem de apresentação e `Error::source` preserva a causa. `From` permite que `?` transforme `ParseIntError` em `ErroPorta`.

Em uma biblioteca, um enum de erros permite ao chamador reagir a casos específicos. Em uma aplicação pequena, `Box<dyn Error>` pode simplificar a propagação de erros heterogêneos. A escolha deve considerar quem precisa tomar decisões a partir deles.

### 10.4 Panic não é o mecanismo normal de validação

`unwrap` e `expect` causam panic em `None` ou `Err`. São úteis em testes e em invariantes realmente justificadas; não substituem a validação de entrada externa.

Dependendo da configuração e do alvo, panic pode desenrolar a stack ou abortar o processo. No desenrolamento, destruidores são executados durante a saída dos escopos. No abort, não conte com isso. Um destrutor também não é um lugar adequado para uma operação cujo erro precisa ser recuperado pelo chamador.

## 11. Lifetimes sem misticismo

### 11.1 O problema é a validade da referência

Você já conhece o erro de retornar o endereço de uma variável automática em C. Rust o rejeita para referências seguras. Este programa **não compila**:

```rust
fn criar() -> &'static str {
    let texto = String::from("temporário");
    &texto // Referência a armazenamento destruído ao sair da função.
}

fn main() {}
```

Escrever `'static` não prolonga a vida da string. A solução é retornar `String`, transferindo sua propriedade, ou retornar uma referência a dados que realmente vivam o suficiente, como um literal.

Uma anotação de lifetime descreve uma relação que precisa ser satisfeita. Ela não aloca memória, não introduz contagem de referências e não adia a destruição.

### 11.2 Por que algumas assinaturas precisam de nomes

Com uma entrada emprestada, várias relações são óbvias para as regras de elisão:

```rust
fn primeira_palavra(texto: &str) -> &str {
    texto.split_whitespace().next().unwrap_or("")
}

fn main() {
    assert_eq!(primeira_palavra("Rust e C"), "Rust");
}
```

Conceitualmente, a assinatura relaciona a saída à entrada: `fn primeira_palavra<'a>(texto: &'a str) -> &'a str`. Isso não significa que o compilador inspeciona qualquer corpo e inventa uma relação pública: existem regras específicas de elisão.

Com duas entradas e um resultado que pode apontar para qualquer uma, declare a relação:

```rust
fn escolher_mais_longo<'a>(a: &'a str, b: &'a str) -> &'a str {
    if a.len() >= b.len() { a } else { b }
}

fn main() {
    let externo = String::from("linguagem de sistemas");

    {
        let interno = String::from("C");
        let escolhido = escolher_mais_longo(&externo, &interno);
        println!("{escolhido}");
    }
}
```

`'a` representa uma região de validade que as duas entradas conseguem satisfazer e dentro da qual a saída pode ser usada. Isso não exige que as strings tenham sido criadas juntas ou sejam destruídas juntas. Os empréstimos podem ser encurtados para uma região em comum.

Mesmo que você saiba que `externo` é maior, o chamador precisa obedecer ao contrato da função: a saída pode depender de qualquer entrada. O compilador não transforma o resultado desse teste de comprimento em uma nova assinatura.

### 11.3 Structs que emprestam dados

```rust
#[derive(Debug)]
struct Cabecalho<'a> {
    nome: &'a str,
    valor: &'a str,
}

impl<'a> Cabecalho<'a> {
    fn parse(linha: &'a str) -> Option<Self> {
        let (nome, valor) = linha.split_once(':')?;
        Some(Self { nome: nome.trim(), valor: valor.trim() })
    }

    fn valor(&self) -> &'a str {
        self.valor
    }
}

fn main() {
    let linha = String::from("Content-Type: text/plain");
    let cabecalho = Cabecalho::parse(&linha).unwrap();
    assert_eq!(cabecalho.nome, "Content-Type");
    assert_eq!(cabecalho.valor(), "text/plain");
}
```

`Cabecalho` é uma visão sobre a linha, não seu proprietário. Se precisa armazenar o resultado independentemente do buffer original, use campos `String` ou outra estratégia de propriedade.

Há uma diferença útil entre retornar `&str` de um método e retornar `&'a str`: pela elisão, o primeiro geralmente vincula o resultado ao empréstimo de `self`; o segundo declara que a referência pode aproveitar a validade dos dados originais. Essa escolha afeta quão flexível a API será.

### 11.4 'static em referências e em bounds

`&'static str` referencia texto válido por toda a execução, como um literal. Já `T: 'static` diz que `T` não contém empréstimos com validade mais curta que `'static`. Um `String` possuído pode satisfazer `T: 'static` e ainda assim ser destruído no fim de um pequeno escopo.

Portanto, um bound `'static` não exige “vazar tudo para sempre”. Ele é frequente em APIs que não podem depender de variáveis emprestadas do chamador, como uma thread que pode continuar após o retorno da função que a iniciou.

### 11.5 Por que estruturas autorreferentes são difíceis

Uma struct que possui uma `String` e também guarda `&str` para dentro dela exige que essa referência continue válida quando a struct for movida, modificada ou destruída. Simplesmente adicionar `'a` não prova isso.

Alternativas comuns são guardar offsets e obter slices sob demanda, manter o buffer fora da struct e emprestá-lo, ou usar abstrações especializadas com invariantes de pinning. Para parsers e editores, índices frequentemente deixam a estrutura mais simples.

As regras formais de elisão e os exemplos de relações entre entradas e saídas estão no capítulo de [lifetimes](https://doc.rust-lang.org/book/ch10-03-lifetime-syntax.html).

## 12. Generics, traits e polimorfismo

### 12.1 Generics preservam informação de tipo

```rust
fn maior<T: Ord>(a: T, b: T) -> T {
    if a >= b { a } else { b }
}

fn main() {
    assert_eq!(maior(10, 20), 20);
    assert_eq!(maior(String::from("alfa"), String::from("beta")), "beta");
}
```

`T: Ord` exige uma ordenação total. `f64` não implementa `Ord`, porque NaN complica a ordem; há operações como `total_cmp` para escolhas explícitas nesse domínio. Escolher um trait bound é escolher parte do contrato matemático da função.

O exemplo recebe valores por propriedade. Ele não precisa de `Clone`, porque devolve um dos argumentos e descarta o outro. Se quisesse apenas selecionar uma referência, a assinatura e os lifetimes seriam diferentes.

### 12.2 Definindo comportamento com traits

```rust
trait Medida {
    fn bytes(&self) -> usize;

    fn vazio(&self) -> bool {
        self.bytes() == 0
    }
}

struct Pacote(Vec<u8>);

impl Medida for Pacote {
    fn bytes(&self) -> usize {
        self.0.len()
    }
}

fn relatar<T: Medida>(item: &T) {
    println!("{} bytes; vazio={}", item.bytes(), item.vazio());
}

fn main() {
    let pacote = Pacote(vec![1, 2, 3]);
    relatar(&pacote);
}
```

Um trait pode conter métodos obrigatórios, métodos padrão, tipos associados e constantes associadas. A implementação fica separada da definição do tipo. Não se trata de herança de representação.

Bounds mais extensos ficam legíveis com `where`:

```rust
fn imprimir_ordenado<T>(mut itens: Vec<T>)
where
    T: Ord + std::fmt::Debug,
{
    itens.sort();
    println!("{itens:?}");
}

fn main() {
    imprimir_ordenado(vec![3, 1, 2]);
}
```

### 12.3 Dispatch estático versus dinâmico

Com `T: Trait`, o compilador normalmente gera versões especializadas para os tipos utilizados: monomorfização. Isso favorece inlining e otimizações, mas muitas instanciações podem aumentar tempo de compilação e tamanho do binário.

Com `dyn Trait`, o tipo concreto é apagado atrás de uma interface e as chamadas usam dispatch dinâmico:

```rust
trait Operacao {
    fn aplicar(&self, entrada: i32) -> i32;
}

struct Dobrar;
struct Incrementar;

impl Operacao for Dobrar {
    fn aplicar(&self, entrada: i32) -> i32 { entrada * 2 }
}

impl Operacao for Incrementar {
    fn aplicar(&self, entrada: i32) -> i32 { entrada + 1 }
}

fn main() {
    let dobrar = Dobrar;
    let incrementar = Incrementar;
    let etapas: [&dyn Operacao; 2] = [&dobrar, &incrementar];

    let resultado = etapas.iter().fold(10, |valor, etapa| etapa.aplicar(valor));
    assert_eq!(resultado, 21);
}
```

Conceitualmente, `&dyn Operacao` carrega referência ao objeto e metadados para selecionar a implementação. Isso lembra uma struct de ponteiro de contexto mais tabela de funções em C. O exemplo usa referências a valores locais; `dyn` sozinho não exige alocação no heap. `Box<dyn Operacao>` adicionaria propriedade por uma caixa.

Nem todo trait admite `dyn`. Por exemplo, um método genérico não pode ser despachado dessa forma, e métodos que retornam `Self` exigem cuidados. Você pode restringir determinados métodos a `where Self: Sized`, tornando-os indisponíveis pelo objeto de trait. A referência chama esse conjunto de regras de [dyn compatibility](https://doc.rust-lang.org/reference/items/traits.html#dyn-compatibility).

### 12.4 impl Trait em argumentos e retornos

No argumento, `impl Trait` normalmente é uma forma conveniente de receber algum tipo que implementa aquele trait. No retorno, representa um tipo concreto escolhido pela implementação, mas ocultado na interface:

```rust
fn pares_ate(limite: u32) -> impl Iterator<Item = u32> {
    (0..limite).filter(|n| n % 2 == 0)
}

fn main() {
    assert_eq!(pares_ate(7).collect::<Vec<_>>(), [0, 2, 4, 6]);
}
```

Esse retorno não permite escolher tipos concretos arbitrariamente diferentes em cada ramo. Se uma função retorna ora um tipo de iterador, ora outro, você pode reorganizar os adaptadores, criar um enum ou usar um objeto de trait.

### 12.5 Tipos associados e coerência

`Iterator` tem um tipo associado `Item`: para uma implementação de `Iterator` de determinado tipo, ele descreve o item produzido. Um parâmetro genérico de trait, por sua vez, pode permitir várias implementações com diferentes argumentos, respeitadas as regras de coerência.

Rust restringe implementações que combinam um trait externo e um tipo externo, pelas regras conhecidas como *orphan rules*. Para o caso comum, crie um tipo local que envolva o externo — o padrão *newtype*. Isso permite associar comportamento sem disputar uma implementação global que outra crate também poderia fornecer.

## 13. Closures e iteradores

### 13.1 Closures carregam ambiente

```rust
fn main() {
    let fator = 3;
    let multiplicar = |valor: i32| valor * fator;
    assert_eq!(multiplicar(4), 12);

    let mut chamadas = 0;
    let mut registrar = || {
        chamadas += 1;
    };
    registrar();
    registrar();
    assert_eq!(chamadas, 2);

    let mensagem = String::from("entregue");
    let entregar = move || mensagem;
    let resultado = entregar();
    assert_eq!(resultado, "entregue");
    // entregar(); // NÃO COMPILA: a closure já foi consumida.
}
```

Em C, callbacks com contexto costumam ser representados por uma função e um `void *`. Closures fornecem uma abstração tipada desse par, com captura e validade controladas.

Os traits de chamada descrevem o que a closure precisa fazer com seu ambiente:

| Trait | Como a chamada usa a closure | Situação típica |
| --- | --- | --- |
| `Fn` | Empresta por referência compartilhada | Apenas lê capturas |
| `FnMut` | Precisa de empréstimo mutável | Atualiza estado capturado |
| `FnOnce` | Pode consumir o ambiente | Move uma captura para fora |

Uma closure `Fn` também atende aos contratos `FnMut` e `FnOnce`; uma `FnMut` também atende a `FnOnce`. O inverso não é garantido.

`move` controla **como as capturas entram** na closure. Não significa automaticamente que ela só pode ser chamada uma vez. Uma closure que possui uma `String`, mas apenas lê essa string, pode continuar implementando `Fn`.

### 13.2 Iteradores são descrições de uma sequência de operações

```rust
fn main() {
    let entradas = ["10", "erro", "20", "30"];

    let validos: Vec<i32> = entradas.iter()
        .filter_map(|texto| texto.parse::<i32>().ok())
        .filter(|numero| *numero >= 20)
        .collect();

    assert_eq!(validos, [20, 30]);

    let todos: Result<Vec<i32>, _> = entradas.iter()
        .map(|texto| texto.parse::<i32>())
        .collect();

    assert!(todos.is_err());
}
```

As duas pipelines têm políticas distintas: a primeira ignora entradas inválidas; a segunda para com erro quando encontra uma falha. A composição dos tipos expressa a diferença.

Adaptadores como `map` e `filter` são preguiçosos: criar o iterador não percorre necessariamente a entrada. Consumidores como `collect`, `sum`, `fold` e o laço `for` provocam o processamento. Os adaptadores não precisam criar vetores intermediários.

### 13.3 iter, iter_mut e into_iter

```rust
fn main() {
    let mut nomes = vec![String::from("ana"), String::from("bia")];

    for nome in nomes.iter() {       // Item: &String.
        println!("{nome}");
    }

    for nome in nomes.iter_mut() {   // Item: &mut String.
        nome.make_ascii_uppercase();
    }

    for nome in nomes.into_iter() {  // Item: String; consome o Vec.
        println!("Consumido: {nome}");
    }
}
```

Para um `Vec<T>`, essa tabela mental é bastante útil. Mas `into_iter()` é um método de trait: aplicado a uma referência, pode produzir itens emprestados. Observe o tipo do receptor, não apenas o nome do método. `for item in &colecao` e `for item in &mut colecao` são formas idiomáticas de empréstimo.

## 14. Módulos, crates e organização

Um **pacote** é descrito por `Cargo.toml`. Uma **crate** é uma unidade de compilação: pode ser uma biblioteca ou um executável. Um **módulo** organiza nomes e visibilidade dentro da crate. Um pacote pode fornecer uma biblioteca e vários executáveis.

Exemplo de biblioteca com um executável:

```text
estudo/
├── Cargo.toml
├── src/
│   ├── lib.rs
│   ├── main.rs
│   └── protocolo.rs
└── tests/
    └── protocolo_publico.rs
```

Conteúdo de `src/lib.rs`:

```rust
pub mod protocolo;
```

Conteúdo de `src/protocolo.rs`:

```rust
pub const VERSAO: u8 = 1;

pub fn versao_suportada(versao: u8) -> bool {
    versao == VERSAO
}
```

Conteúdo de `src/main.rs`, supondo que o pacote se chama `estudo`:

```rust
use estudo::protocolo::versao_suportada;

fn main() {
    assert!(versao_suportada(1));
}
```

`mod` declara um módulo; `use` traz um caminho para o escopo. `use` não funciona como inclusão textual de header. Itens são privados por padrão. `pub`, `pub(crate)` e `pub(super)` permitem escolher a fronteira de acesso.

Separar uma biblioteca do executável facilita testar regras de negócio sem depender da interface de linha de comando. Não é necessário criar uma crate para cada arquivo ou responsabilidade pequena.

Quando o projeto crescer, workspaces coordenam vários pacotes. Antes de dividir, procure uma fronteira real: reuso, compilação, dependências ou distribuição independentes.

## 15. Coleções e escolhas de representação

### 15.1 HashMap e a API entry

```rust
use std::collections::HashMap;

fn contar_palavras(texto: &str) -> HashMap<&str, usize> {
    let mut contagem = HashMap::new();

    for palavra in texto.split_whitespace() {
        *contagem.entry(palavra).or_insert(0) += 1;
    }

    contagem
}

fn main() {
    let texto = String::from("rust c rust sistemas");
    let contagem = contar_palavras(&texto);

    assert_eq!(contagem.get("rust"), Some(&2));
    assert_eq!(contagem.get("java"), None);
}
```

As chaves são slices do texto original. É uma contagem com pouca alocação de strings, mas o mapa depende da vida do texto. Para mantê-lo depois de descartar o texto, transforme as chaves em `String`.

`entry` combina a busca e a decisão de inserir ou atualizar. Isso evita separar operações de modo que você precise carregar empréstimos incompatíveis do mapa.

### 15.2 Escolher pelo padrão de acesso

| Coleção | Propriedade útil | Atenção |
| --- | --- | --- |
| `Vec<T>` | Contiguidade e acesso por índice | Inserir no início desloca elementos |
| `VecDeque<T>` | Inserir/remover nas duas pontas | Buffer circular pode ter duas regiões |
| `HashMap<K, V>` | Busca por chave com custo esperado constante | Ordem de iteração não é contrato de ordenação |
| `BTreeMap<K, V>` | Chaves ordenadas e consultas por intervalo | Busca e atualização logarítmicas |
| `HashSet<T>` | Testar pertencimento e unicidade | Exige coerência entre igualdade e hash |
| `BinaryHeap<T>` | Prioridade; maior elemento no topo por padrão | Não é uma sequência totalmente ordenada |

Uma lista ligada não se torna a melhor escolha apenas porque você domina ponteiros. Alocações por nó, indireções e localidade de cache podem dominar o custo. Para muitos workloads, um vetor com índices é mais eficiente e mais fácil de expressar com ownership.

Para grafos, uma arena de nós em `Vec<Node>` com arestas armazenadas como índices pode evitar ownership circular. Se houver remoção e reutilização de posições, um índice antigo pode passar a identificar outro nó: IDs com geração são uma forma de detectar esse uso obsoleto.

## 16. RAII, Drop e ponteiros inteligentes

### 16.1 Recursos têm um ciclo de vida

Ownership não serve apenas para memória. Arquivos, locks e outros recursos também podem ser associados à vida de um valor.

```rust
struct Marcador(&'static str);

impl Drop for Marcador {
    fn drop(&mut self) {
        println!("Liberando {}", self.0);
    }
}

fn main() {
    let externo = Marcador("externo");
    {
        let _interno = Marcador("interno");
        println!("Dentro do bloco");
    }
    drop(externo); // Consome o valor e antecipa sua destruição.
    println!("Recursos já encerrados");
}
```

Você não chama `valor.drop()` diretamente. `std::mem::drop`, disponível no prelude, recebe o valor e o deixa ser destruído. Após esse consumo, o proprietário anterior não pode continuar usando o recurso.

Variáveis locais são normalmente destruídas na ordem inversa de sua declaração; campos de structs seguem a ordem de declaração. Ao depender de detalhes de destruição, consulte as regras específicas de escopo e evite efeitos frágeis entre destruidores.

Destrutores não são garantia absoluta de execução: abort, término forçado e vazamentos deliberados, como `mem::forget`, podem impedi-los. Uma API `unsafe` não pode depender de que código seguro jamais deixe de executar um destrutor.

### 16.2 Box: propriedade exclusiva por indireção

```rust
#[derive(Debug)]
enum Expressao {
    Numero(i64),
    Soma(Box<Expressao>, Box<Expressao>),
}

impl Expressao {
    fn avaliar(&self) -> i64 {
        match self {
            Self::Numero(n) => *n,
            Self::Soma(a, b) => a.avaliar() + b.avaliar(),
        }
    }
}

fn main() {
    let expressao = Expressao::Soma(
        Box::new(Expressao::Numero(10)),
        Box::new(Expressao::Numero(32)),
    );
    assert_eq!(expressao.avaliar(), 42);
}
```

Sem indireção, um enum recursivo precisaria conter a si próprio inline indefinidamente. `Box` dá tamanho conhecido à ligação com os filhos e administra sua propriedade. O avaliador é didático: entrada hostil exigiria limites de profundidade e uma política para overflow numérico.

`Box<T>` não é uma referência emprestada. Ele possui o valor. Mover a caixa não move necessariamente o objeto alocado, mas isso sozinho ainda não estabelece o contrato completo de pinning.

### 16.3 Rc, Arc e Weak

`Rc<T>` permite propriedade compartilhada em uma thread, com contagem de referências não atômica. `Arc<T>` usa contagem atômica e pode permitir compartilhamento entre threads quando `T` satisfaz os bounds necessários.

```rust
use std::rc::Rc;

fn main() {
    let dados = Rc::new(String::from("configuração"));
    let outro = Rc::clone(&dados);
    let fraco = Rc::downgrade(&dados);

    assert_eq!(Rc::strong_count(&dados), 2);
    drop(dados);
    assert_eq!(outro.as_str(), "configuração");

    drop(outro);
    assert!(fraco.upgrade().is_none());
}
```

`Weak` não mantém o valor vivo. `upgrade` tenta obter novamente uma referência forte. Isso ajuda a representar relações de observação ou de retorno, como um filho que conhece o pai sem manter um ciclo de propriedade.

Dois `Rc` que se mantêm vivos mutuamente podem vazar os valores. Contagem de referências não coleta ciclos. Desenhe quem realmente possui quem; não substitua todas as referências por `Rc` para fazer erros de lifetime desaparecerem.

## 17. Mutabilidade interior e compartilhamento

### 17.1 O significado de interior mutability

Em alguns projetos, você precisa modificar estado por meio de uma referência compartilhada. Rust oferece abstrações que estabelecem outro mecanismo para controlar isso:

| Tipo | Controle principal | Uso |
| --- | --- | --- |
| `Cell<T>` | Move/substitui valores sem fornecer empréstimos comuns ao conteúdo | Estado pequeno, frequentemente `Copy` |
| `RefCell<T>` | Verifica empréstimos em runtime | Mutação compartilhada em uma thread |
| `Mutex<T>` | Exclusão mútua sincronizada | Estado compartilhado entre threads |
| `RwLock<T>` | Leituras compartilhadas ou escrita exclusiva | Workloads que se beneficiem desse padrão |

Essas abstrações se apoiam em `UnsafeCell` ou mecanismos relacionados em suas implementações. Você normalmente utiliza suas interfaces seguras, sem escrever `unsafe`.

### 17.2 RefCell não remove a regra de empréstimos

```rust
use std::{cell::RefCell, rc::Rc};

fn main() {
    let tarefas = Rc::new(RefCell::new(vec![String::from("ler")]));
    let painel = Rc::clone(&tarefas);

    {
        let mut acesso = tarefas.borrow_mut();
        acesso.push(String::from("praticar"));
    } // O guard termina e libera o empréstimo mutável.

    assert_eq!(painel.borrow().len(), 2);

    let leitura = painel.borrow();
    assert!(tarefas.try_borrow_mut().is_err());
    drop(leitura);
    assert!(tarefas.try_borrow_mut().is_ok());
}
```

`borrow` e `borrow_mut` retornam guards que mantêm o empréstimo ativo. Um conflito provoca panic nas variantes comuns; `try_borrow` e `try_borrow_mut` retornam erro. A regra continua existindo, mas é verificada durante a execução.

`Rc<RefCell<T>>` pode ser útil em uma árvore de interface ou grafo local com mutação compartilhada. Não é a resposta padrão para todo erro do borrow checker. Às vezes o problema é uma função grande demais, um proprietário mal definido ou referências mantidas além do necessário.

`RefCell<T>` não fornece sincronização entre threads. `Arc<RefCell<T>>` não se torna uma solução concorrente apenas por usar uma contagem atômica. Veja a documentação de [mutabilidade interior](https://doc.rust-lang.org/std/cell/index.html).

## 18. Threads, Send, Sync e canais

### 18.1 Transferindo propriedade para uma thread

```rust
use std::thread;

fn main() {
    let valores = vec![10_i64, 20, 30];

    let trabalho = thread::spawn(move || {
        valores.into_iter().sum::<i64>()
    });

    let soma = trabalho.join().expect("thread do exemplo não deve entrar em panic");
    assert_eq!(soma, 60);
}
```

`move` entrega o vetor à closure. `thread::spawn` exige que o trabalho e seu resultado possam atravessar a fronteira entre threads e não dependam de empréstimos temporários incompatíveis com sua duração. `join` espera a thread e retorna um resultado que também informa panic.

### 18.2 Threads com escopo podem emprestar dados locais

```rust
use std::thread;

fn main() {
    let valores = [1_i64, 2, 3, 4, 5, 6];
    let (a, b) = valores.split_at(3);

    let total = thread::scope(|escopo| {
        let esquerda = escopo.spawn(|| a.iter().sum::<i64>());
        let direita = escopo.spawn(|| b.iter().sum::<i64>());

        esquerda.join().unwrap() + direita.join().unwrap()
    });

    assert_eq!(total, 21);
}
```

O escopo garante que suas threads terminem antes de ele retornar. Isso permite empréstimos de dados locais sem forçar `Arc` nem copiar os arrays. A garantia de término é parte central do contrato de [thread::scope](https://doc.rust-lang.org/std/thread/fn.scope.html).

### 18.3 Send e Sync são contratos diferentes

- `T: Send` significa que um valor de `T` pode ser transferido com segurança entre threads.
- `T: Sync` significa que uma referência compartilhada `&T` pode ser enviada entre threads; formalmente, `&T: Send`.

Esses traits são inferidos automaticamente para muitos tipos a partir de seus componentes. `Rc<T>` não oferece a contagem atômica necessária para seu uso entre threads. `Arc<T>` administra a contagem de modo sincronizado, mas não corrige um conteúdo que seja inseguro para compartilhar. As definições oficiais de [Send](https://doc.rust-lang.org/std/marker/trait.Send.html) e [Sync](https://doc.rust-lang.org/std/marker/trait.Sync.html) são uma referência útil para ler bounds de APIs.

### 18.4 Arc com Mutex

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let contador = Arc::new(Mutex::new(0_u64));
    let mut threads = Vec::new();

    for _ in 0..4 {
        let contador = Arc::clone(&contador);
        threads.push(thread::spawn(move || {
            for _ in 0..1_000 {
                let mut guard = contador.lock().unwrap();
                *guard += 1;
            }
        }));
    }

    for thread in threads {
        thread.join().unwrap();
    }

    assert_eq!(*contador.lock().unwrap(), 4_000);
}
```

`Arc` cuida da propriedade compartilhada. `Mutex` cuida do acesso ao conteúdo. `MutexGuard` libera o lock ao ser destruído. São responsabilidades diferentes.

Neste exemplo, os `unwrap` tornam qualquer falha evidente. Em produção, defina uma política para panic e envenenamento do mutex. Envenenamento é um sinal de possível quebra de invariantes após panic; não é uma prova de integridade nem uma proteção suficiente para justificar código `unsafe`.

Evite manter o lock durante I/O demorado ou chamadas cujo comportamento você não controla. Para vários locks, estabeleça uma ordem de aquisição consistente. Rust não prova a ausência de deadlock.

### 18.5 Canais transferem mensagens

```rust
use std::{sync::mpsc, thread};

fn main() {
    let (envio, recebimento) = mpsc::sync_channel::<String>(2);

    let produtor = thread::spawn(move || {
        for numero in 0..5 {
            envio.send(format!("tarefa {numero}")).unwrap();
        }
    });

    for mensagem in recebimento {
        println!("Recebido: {mensagem}");
    }

    produtor.join().unwrap();
}
```

O canal limitado introduz *backpressure*: quando está cheio, o envio espera o consumidor. A iteração termina quando todos os emissores são destruídos e as mensagens pendentes acabam. Se você guardar sem querer um emissor extra, pode ficar esperando um fechamento que nunca acontece.

Escolha entre mensagens e estado compartilhado pelo fluxo de dados. Um único proprietário processando comandos por canal pode simplificar invariantes que seriam difíceis com vários locks.

## 19. Atômicos e ordenação de memória

Se você já usa atomics de C, mantenha a distinção entre atomicidade e ordenação. Uma operação atômica impede que seu acesso indivisível seja observado parcialmente; a ordenação estabelece relações com outros acessos.

```rust
use std::sync::atomic::{AtomicUsize, Ordering};
use std::thread;

fn main() {
    let contador = AtomicUsize::new(0);

    thread::scope(|escopo| {
        for _ in 0..4 {
            let contador = &contador;
            escopo.spawn(move || {
                for _ in 0..1_000 {
                    contador.fetch_add(1, Ordering::Relaxed);
                }
            });
        }
    });

    assert_eq!(contador.load(Ordering::Relaxed), 4_000);
}
```

Aqui o contador não publica nenhum outro dado. Precisamos de incrementos atômicos; o término das threads dentro do escopo precede a verificação final.

| Ordenação | Ideia principal |
| --- | --- |
| `Relaxed` | Atomicidade sem usar a operação para ordenar outros acessos |
| `Release` | Publica operações anteriores quando pareada apropriadamente |
| `Acquire` | Pode observar a publicação correspondente |
| `AcqRel` | Combina aspectos de aquisição e liberação em operações de leitura/modificação/escrita |
| `SeqCst` | Acrescenta uma ordem total entre operações sequencialmente consistentes |

Um load não aceita `Release`; um store não aceita `Acquire`. Em `compare_exchange`, sucesso e falha têm ordens distintas porque uma falha não realiza a escrita.

Acquire e Release não sincronizam magicamente qualquer par de threads: a relação depende do valor observado e das regras do modelo de memória. Publicar um ponteiro também exige provar validade, propriedade e quando será permitido liberar a alocação.

`volatile` não substitui operações atômicas nem sincronização. Ele atende a necessidades como certos acessos a dispositivos, com regras próprias. Antes de escrever estruturas lock-free, domine o algoritmo, o problema ABA e estratégias de recuperação de memória. Consulte os contratos exatos de [Ordering](https://doc.rust-lang.org/std/sync/atomic/enum.Ordering.html).

## 20. Async, Future e Pin

### 20.1 Uma função async constrói uma computação suspensível

```rust
async fn calcular() -> u32 {
    42
}

fn main() {
    let futuro = calcular();
    drop(futuro); // Criar e descartar o futuro não executa seu corpo.
}
```

`async fn` produz um valor que implementa `Future`. A chamada constrói a computação; o executor a faz avançar. `.await` aguarda um futuro dentro de outra computação assíncrona, permitindo suspensão se o resultado ainda não estiver disponível.

Rust fornece a linguagem e os traits fundamentais, mas a biblioteca padrão não fornece um runtime geral de I/O assíncrono. Runtimes como Tokio acrescentam executor, timers e integração de I/O.

### 20.2 Exemplo com runtime explícito

Em um projeto de estudo separado, adicione ao `Cargo.toml`:

```toml
[dependencies]
tokio = { version = "1", features = ["macros", "rt-multi-thread", "time"] }
```

Depois use este `src/main.rs`:

```rust
use std::time::Duration;
use tokio::time::sleep;

async fn tarefa(nome: &'static str, atraso_ms: u64) -> &'static str {
    sleep(Duration::from_millis(atraso_ms)).await;
    nome
}

#[tokio::main]
async fn main() {
    let (a, b) = tokio::join!(
        tarefa("A", 100),
        tarefa("B", 50),
    );

    println!("Concluídas: {a} e {b}");
}
```

As esperas podem progredir concorrentemente. `join!` não implica criar duas threads nem distribuir automaticamente CPU entre núcleos. O atributo `tokio::main` configura um runtime para executar a função; as features necessárias estão descritas na [documentação da macro](https://docs.rs/tokio/latest/tokio/attr.main.html).

Chamar `std::thread::sleep` dentro dessa tarefa bloquearia a thread do executor. Para operações bloqueantes, use uma estratégia apropriada, como `spawn_blocking`, e controle a quantidade de trabalho. Para CPU intensiva, um pool dedicado pode representar melhor a carga.

### 20.3 Como Future funciona por baixo

Assinatura conceitual simplificada do trait:

```rust
// Ilustração: Future já existe na biblioteca padrão.
// trait Future {
//     type Output;
//     fn poll(
//         self: Pin<&mut Self>,
//         cx: &mut Context<'_>,
//     ) -> Poll<Self::Output>;
// }
```

`poll` retorna `Ready(resultado)` ou `Pending`. Ao retornar `Pending`, uma implementação que depende de um evento externo deve organizar a notificação pelo `Waker` quando puder avançar. O executor então agenda outra consulta. Fazer busy polling ignora esse protocolo e desperdiça CPU. Consulte [Future::poll](https://doc.rust-lang.org/std/future/trait.Future.html).

O compilador transforma um bloco async em uma máquina de estados. Variáveis necessárias depois de um `.await` precisam ser preservadas no futuro. Por isso, manter um valor não `Send` atravessando a suspensão pode fazer o futuro também não ser `Send`, impedindo seu envio a um executor que exige mobilidade entre threads.

### 20.4 Pin é um contrato sobre movimentação

Alguns futuros podem conter relações internas que dependem de endereço estável. `Pin<P>` restringe o que pode ser feito com o valor apontado por `P` quando esse valor não implementa `Unpin`.

Mover um `Pin<Box<T>>` pode mover o handle sem mover o `T` alocado. `Pin` não imobiliza o ponteiro em uma variável local e não impede toda mutação. Ele protege a posição e a validade do objeto apontado segundo seu contrato, incluindo cuidados na destruição. Para tipos `Unpin`, as restrições de movimentação são relaxadas.

```rust
use std::{future::Future, pin::Pin};

fn resposta() -> Pin<Box<dyn Future<Output = u32>>> {
    Box::pin(async { 42 })
}

fn main() {
    let futuro = resposta();
    drop(futuro); // Para obter 42, um executor precisaria executar o futuro.
}
```

Essa assinatura também mostra apagamento de tipo: a caixa permite retornar futuros concretos diferentes por uma interface comum. Ela tem custos de alocação e dispatch que um retorno `impl Future` pode evitar.

Escrever projeções de campos fixados ou tipos autorreferentes manualmente é assunto avançado de segurança. Leia o contrato completo de [Pin](https://doc.rust-lang.org/std/pin/index.html) antes de introduzir `unsafe` para esse fim.

### 20.5 Cancelamento e locks atravessando await

Descartar um futuro pendente cancela sua progressão local, mas não desfaz automaticamente efeitos já realizados. Um envio parcial na rede ou uma gravação iniciada exige um desenho de protocolo que tolere interrupções.

Descartar o `JoinHandle` de uma tarefa Tokio, por outro lado, não equivale simplesmente a descartar o futuro que a tarefa está executando: o handle pode ser separado da tarefa, que continua. Consulte a política da API utilizada.

Evite manter guards de locks síncronos durante `.await`. Extraia o estado necessário e solte o guard antes da espera. Quando precisa coordenar uma seção que atravessa suspensão, avalie um mutex assíncrono ou um proprietário único recebendo mensagens; a decisão depende da invariável que precisa ser preservada.

## 21. Unsafe e contratos de segurança

### 21.1 Unsafe não desliga a linguagem

Um bloco `unsafe` permite realizar operações que o compilador não consegue validar completamente, como desreferenciar ponteiros brutos e chamar funções com precondições de segurança. Ownership, tipos e várias outras verificações continuam existindo.

`unsafe` também não torna comportamento indefinido aceitável. Ele marca a região em que você assume a obrigação de demonstrar propriedades adicionais. Uma abstração segura construída sobre `unsafe` deve permanecer correta para qualquer uso permitido por sua API segura. Veja a definição de *soundness* na [referência de comportamento indefinido](https://doc.rust-lang.org/reference/behavior-considered-undefined.html).

```rust
fn main() {
    let mut numero = 10_i32;
    let ponteiro: *mut i32 = &mut numero;

    // SAFETY: o ponteiro deriva de numero, que continua vivo e alinhado.
    // Não há outro acesso ao valor durante esta operação.
    unsafe {
        *ponteiro += 5;
    }

    assert_eq!(numero, 15);
}
```

Criar um ponteiro bruto não exige automaticamente `unsafe`. O acesso ao valor apontado é que precisa de justificativa. Ponteiros brutos podem ser nulos ou pendurados; a existência de um ponteiro assim não autoriza sua desreferência.

### 21.2 Uma abstração segura sobre operações brutas

Esta é uma implementação didática de uma operação que já existe como `split_at_mut`. Em código real, use a função da biblioteca padrão.

```rust
fn dividir_mut<T>(dados: &mut [T], meio: usize) -> (&mut [T], &mut [T]) {
    let tamanho = dados.len();
    assert!(meio <= tamanho);
    let ponteiro = dados.as_mut_ptr();

    // SAFETY:
    // - o slice original fornece armazenamento válido e alinhado;
    // - meio <= tamanho mantém as duas regiões dentro do slice;
    // - as regiões de elementos [0, meio) e [meio, tamanho) não se sobrepõem;
    // - os resultados ficam vinculados ao empréstimo original pela assinatura;
    // - o slice original não é usado para outro acesso enquanto eles vivem.
    unsafe {
        let esquerda = std::slice::from_raw_parts_mut(ponteiro, meio);
        let direita = std::slice::from_raw_parts_mut(
            ponteiro.add(meio),
            tamanho - meio,
        );
        (esquerda, direita)
    }
}

fn main() {
    let mut valores = [1, 2, 3, 4];
    let (a, b) = dividir_mut(&mut valores, 2);
    a[1] = 20;
    b[0] = 30;
    assert_eq!(valores, [1, 20, 30, 4]);
}
```

A verificação de limite vem **antes** de construir os slices. Um `debug_assert!` seria inadequado se a segurança dependesse dele, porque pode desaparecer no perfil release. Uma validação de segurança deve existir em todos os perfis relevantes ou ser garantida pelo contrato `unsafe` do chamador.

O comentário `SAFETY` documenta a prova. “É seguro porque está em unsafe” e “funcionou no teste” não são provas.

### 21.3 Unsafe fn transfere obrigações ao chamador

Uma função pública que exige um ponteiro válido que ela não consegue verificar deve declarar esse contrato na documentação, normalmente em uma seção `# Safety`, e ser `unsafe fn` quando violá-lo pode provocar comportamento indefinido.

Na edition 2024, operações inseguras dentro de uma `unsafe fn` devem ser demarcadas por blocos `unsafe` explícitos para evitar o lint padrão correspondente. Isso separa “o chamador tem uma obrigação” de “esta implementação executa uma operação insegura”.

Um wrapper seguro deve fazer as validações possíveis e encapsular o restante da prova. Não exponha uma função segura que aceita qualquer endereço inteiro e o transforma em referência válida por mera confiança.

## 22. Layout, inicialização e ponteiros brutos

### 22.1 repr(C), padding e formatos binários

```rust
use std::mem::{align_of, size_of};

#[repr(C)]
struct Registro {
    tipo: u8,
    quantidade: u32,
}

fn main() {
    println!("tamanho={}", size_of::<Registro>());
    println!("alinhamento={}", align_of::<Registro>());
}
```

O layout padrão de structs Rust não promete a mesma ordem de campos usada em C. `#[repr(C)]` seleciona regras de representação compatíveis com o modelo C para esse tipo e alvo, incluindo padding. Isso não transforma automaticamente qualquer campo Rust em um tipo apropriado para FFI.

Mesmo uma struct `repr(C)` não é, por si só, um formato de arquivo. Endianness, padding, alinhamento e diferenças entre alvos continuam relevantes. Serializar lendo toda a memória bruta da struct pode ainda tentar ler padding não inicializado. Formatos de rede devem codificar campos explicitamente.

```rust
fn main() {
    let quantidade = 0x0102_0304_u32;
    let bytes = quantidade.to_be_bytes();
    assert_eq!(bytes, [1, 2, 3, 4]);
    assert_eq!(u32::from_be_bytes(bytes), quantidade);
}
```

`#[repr(packed)]` reduz alinhamento, mas pode deixar campos desalinhados. Criar uma referência a um campo desalinhado é inválido mesmo que a CPU aceite a leitura. Operações apropriadas com ponteiros brutos, como `read_unaligned`, não dispensam os demais contratos de acesso.

`#[repr(transparent)]` é útil para um newtype que precisa preservar a representação do campo relevante, seguindo suas restrições. As garantias exatas estão na [referência de layout](https://doc.rust-lang.org/reference/type-layout.html).

### 22.2 Memória reservada não é um valor válido

```rust
use std::mem::MaybeUninit;

fn main() {
    let mut espaco = MaybeUninit::<u32>::uninit();
    espaco.write(123);

    // SAFETY: write inicializou integralmente um u32 válido.
    let valor = unsafe { espaco.assume_init() };
    assert_eq!(valor, 123);
}
```

`MaybeUninit<T>` representa armazenamento que ainda pode não conter um `T` válido. `assume_init` não inicializa nada; você afirma que a inicialização já aconteceu. Se essa afirmação for falsa, o programa pode ter comportamento indefinido.

Nem todo padrão de bits é válido para todo tipo. Uma referência não pode ser nula; `bool` tem valores válidos restritos; um enum exige uma variante válida. “Zerar a memória” não cria universalmente um objeto Rust válido.

`MaybeUninit` também não destrói automaticamente um `T` que você deixou dentro dele. Inicialização parcial de arrays e erros no meio da construção exigem acompanhar quais elementos existem e quais precisam ser destruídos. Essa contabilidade explica por que escrever seu próprio `Vec` é um exercício avançado, e não uma otimização trivial. Consulte [MaybeUninit](https://doc.rust-lang.org/std/mem/union.MaybeUninit.html).

### 22.3 Construir uma referência impõe condições imediatamente

Ao converter um ponteiro bruto em `&T` ou `&mut T`, você assume que as exigências da referência são satisfeitas. Validar depois de criar uma referência inválida já pode ser tarde demais.

Para construir um slice de ponteiro/comprimento, prove pelo menos: armazenamento vivo, inicialização dos elementos, alinhamento, tamanho representável, uma única alocação cobrindo a região e permissões de acesso compatíveis. Um slice vazio ainda tem exigências de ponteiro não nulo e alinhado nas funções de construção bruta. Não passe diretamente `(NULL, 0)` de uma API C para `from_raw_parts` sem tratar esse caso. [Contrato de from_raw_parts](https://doc.rust-lang.org/std/slice/fn.from_raw_parts.html).

Outro detalhe importante é a *proveniência*: um ponteiro não é apenas um número ao qual você pode somar qualquer coisa e recuperar autorização de acesso. As regras relacionam acessos à origem do ponteiro e à alocação correspondente. Modelos de aliasing e proveniência possuem nuances; prefira APIs documentadas a hipóteses baseadas apenas no assembly produzido em um teste.

`NonNull<T>` registra não nulidade, mas não prova por si só inicialização, vida útil, propriedade ou exclusividade. `ManuallyDrop<T>` permite controlar destruição, mas não resolve sozinho essas invariantes. `transmute` muda a interpretação de um valor e pode exigir provas de validade que vão muito além de os tamanhos coincidirem.

## 23. Interoperabilidade com C

### 23.1 Chamando C a partir de Rust

Exemplo para um ambiente com a ABI C e `strlen` da biblioteca C disponíveis, como Linux:

```rust
use std::ffi::{c_char, CString};

unsafe extern "C" {
    fn strlen(texto: *const c_char) -> usize;
}

fn main() -> Result<(), std::ffi::NulError> {
    let texto = CString::new("Rust chama C")?;

    // SAFETY: CString oferece sequência válida terminada em NUL;
    // texto continua vivo, e strlen não retém nem modifica o ponteiro.
    let tamanho = unsafe { strlen(texto.as_ptr()) };

    assert_eq!(tamanho, 12);
    Ok(())
}
```

`extern "C"` seleciona a convenção de chamada. O bloco `unsafe extern` é a forma exigida pela edition 2024 para declarar funções externas cuja assinatura e contrato precisam estar corretos. Não basta uma função C “parecer igual”: assinatura, ABI e biblioteca vinculada precisam concordar. [Blocos externos na edition 2024](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-extern.html).

`CString` possui uma string C sem NUL interno e com terminador. `CStr` oferece uma visão emprestada de uma string C. Nenhuma string C é automaticamente UTF-8; converter para `&str` pode falhar. Para APIs que recebem bytes e comprimento, geralmente não há necessidade de criar `CString`.

Não faça `CString::new(...).unwrap().as_ptr()` e guarde o ponteiro para uso após o fim dessa expressão: o temporário pode ser destruído, deixando o ponteiro pendurado. Mantenha o proprietário vivo. A documentação de [CString](https://doc.rust-lang.org/std/ffi/struct.CString.html) detalha os contratos de acesso e transferência.

### 23.2 Exportando uma função Rust para C

Crie um projeto de biblioteca separado:

```sh
cargo new contagem_ffi --lib --edition 2024
cd contagem_ffi
```

Acrescente ao `Cargo.toml`:

```toml
[lib]
crate-type = ["cdylib"]
```

Use este `src/lib.rs`:

```rust
/// Conta os bytes diferentes de zero.
///
/// # Safety
/// Se tamanho > 0, dados deve apontar para tamanho bytes inicializados,
/// legíveis e contidos em uma única alocação viva durante toda a chamada.
/// O tamanho total deve ser no máximo isize::MAX e não pode haver mutação
/// concorrente desses bytes enquanto esta função os lê.
/// Se tamanho == 0, dados pode ser nulo.
// SAFETY: este nome de símbolo deve ser exclusivo na aplicação vinculada.
#[unsafe(no_mangle)]
pub unsafe extern "C" fn estudo_contar_nao_nulos(
    dados: *const u8,
    tamanho: usize,
) -> usize {
    if tamanho == 0 {
        return 0;
    }

    // SAFETY: o contrato público acima exige uma região válida;
    // u8 tem alinhamento 1 e o caso vazio foi tratado separadamente.
    let bytes = unsafe { std::slice::from_raw_parts(dados, tamanho) };
    bytes.iter().filter(|&&byte| byte != 0).count()
}
```

`#[unsafe(no_mangle)]` preserva o nome exportado e marca a obrigação de evitar colisões de símbolo. Essa sintaxe acompanha a exigência da [edition 2024 para atributos inseguros](https://doc.rust-lang.org/edition-guide/rust-2024/unsafe-attributes.html).

Na raiz desse projeto, crie `demo.c`:

```c
#include <stddef.h>
#include <stdint.h>
#include <stdio.h>

extern size_t estudo_contar_nao_nulos(const uint8_t *dados, size_t tamanho);

int main(void) {
    const uint8_t dados[] = {1, 0, 2, 3, 0};
    const size_t total = estudo_contar_nao_nulos(dados, sizeof dados);
    printf("%zu\n", total); /* 3 */
    return 0;
}
```

Em Linux, com um compilador C disponível:

```sh
cargo build --release
cc demo.c -L target/release -lcontagem_ffi -o demo
LD_LIBRARY_PATH=target/release ./demo
```

A função não consegue descobrir se um ponteiro arbitrário aponta para uma alocação viva. Por isso, o contrato continua necessário do lado C. Receber o par ponteiro/comprimento não o torna automaticamente validado.

### 23.3 As fronteiras que precisam de projeto explícito

Se Rust entrega uma alocação para C, ofereça uma função correspondente para devolvê-la ao proprietário correto. Não libere com `free` algo que precisa ser recuperado por `Box::from_raw`, e não reconstrua um `Vec` de uma alocação estrangeira sem satisfazer todos os contratos de layout, capacidade e allocator.

Não passe `String`, `Vec` ou objetos de trait como se fossem structs C de layout público. Use números de tamanho definido, structs compatíveis, ponteiros, comprimentos e handles opacos. Documente quem retém cada recurso.

Projete a política de falhas na fronteira: códigos de status, mensagem de erro e ownership dos buffers. Não deixe um panic atravessar inadvertidamente uma fronteira `extern "C"`; um panic Rust tentando escapar de uma função com essa ABI resulta em aborto, e exceções estrangeiras possuem suas próprias restrições. ABIs que permitem unwind exigem um projeto específico. `catch_unwind` não captura abort e não transforma invariantes quebradas em estado utilizável.

Para callbacks, documente também a duração do contexto, a thread de execução e se a biblioteca pode chamar o callback após uma operação de cancelamento. O [capítulo de FFI do Rustonomicon](https://doc.rust-lang.org/nomicon/ffi.html) aprofunda essas fronteiras.

## 24. Tipos avançados e desenho de APIs

### 24.1 Newtypes impedem misturas semânticas

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Metros(u32);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Segundos(u32);

fn velocidade(distancia: Metros, tempo: Segundos) -> Option<f64> {
    if tempo.0 == 0 {
        return None;
    }
    Some(f64::from(distancia.0) / f64::from(tempo.0))
}

fn main() {
    assert_eq!(velocidade(Metros(100), Segundos(20)), Some(5.0));
    // velocidade(Segundos(20), Metros(100)); // NÃO COMPILA.
}
```

Um alias `type Metros = u32` não impediria a troca: aliases não criam identidades de tipo distintas. Newtypes podem ainda validar valores no construtor, restringir operações e implementar traits específicos.

### 24.2 Typestate: transições que consomem o estado anterior

```rust
mod arquivo_logico {
    use std::marker::PhantomData;

    pub struct Aberto;
    pub struct Fechado;

    pub struct Arquivo<Estado> {
        nome: String,
        estado: PhantomData<Estado>,
    }

    impl Arquivo<Fechado> {
        pub fn novo(nome: String) -> Self {
            Self { nome, estado: PhantomData }
        }

        pub fn abrir(self) -> Arquivo<Aberto> {
            Arquivo { nome: self.nome, estado: PhantomData }
        }
    }

    impl Arquivo<Aberto> {
        pub fn escrever(&mut self, texto: &str) {
            println!("{} recebe {texto}", self.nome);
        }

        pub fn fechar(self) -> Arquivo<Fechado> {
            Arquivo { nome: self.nome, estado: PhantomData }
        }
    }
}

fn main() {
    use arquivo_logico::{Arquivo, Fechado};

    let fechado = Arquivo::<Fechado>::novo("registro".into());
    let mut aberto = fechado.abrir();
    aberto.escrever("início");
    let _fechado = aberto.fechar();
    // aberto.escrever("fim"); // NÃO COMPILA: estado anterior consumido.
}
```

Esse exemplo modela um recurso lógico; não abre um arquivo do sistema operacional. Em um recurso real, `abrir` provavelmente retornaria `Result`. Os campos privados impedem que clientes construam arbitrariamente um `Arquivo<Aberto>`.

`PhantomData<Estado>` expressa uma relação de tipos sem armazenar um valor de `Estado`. Ele também influencia análise de variância, auto traits e destruição; não é apenas uma forma de silenciar “parâmetro não utilizado”. Veja [PhantomData no Rustonomicon](https://doc.rust-lang.org/nomicon/phantom-data.html).

Typestate funciona bem quando transições são poucas e o chamador conhece o estado estaticamente. Para muitos estados decididos em runtime, um enum pode ser mais simples. Escolha o nível de restrição que melhora o uso da API.

### 24.3 Const generics

```rust
fn inverter<const N: usize>(mut bytes: [u8; N]) -> [u8; N] {
    bytes.reverse();
    bytes
}

fn main() {
    assert_eq!(inverter([1, 2, 3, 4]), [4, 3, 2, 1]);
    assert_eq!(inverter([10, 20]), [20, 10]);
}
```

`N` é um parâmetro conhecido em compilação. Arrays com comprimentos diferentes são tipos diferentes, mas a função atende a todos esses comprimentos. Isso é útil para blocos de protocolo e matrizes com dimensões fixas.

Não assuma que toda aritmética simbólica com parâmetros const é aceita em qualquer posição no Rust estável. Escrever um retorno `[u8; N + 1]`, por exemplo, envolve restrições adicionais de expressões const genéricas. Prefira contratos que a versão estável escolhida consegue expressar sem features experimentais.

### 24.4 Sized, DSTs e ?Sized

Parâmetros genéricos normalmente possuem um bound implícito `Sized`. `str`, slices `[T]` e `dyn Trait` são exemplos de tipos cujo tamanho não é conhecido estaticamente apenas pelo nome do tipo.

```rust
fn inspecionar<T: std::fmt::Debug + ?Sized>(valor: &T) {
    println!("{valor:?}");
}

fn main() {
    inspecionar("um str emprestado");
    inspecionar(&[10, 20][..]);
}
```

`?Sized` relaxa o requisito de tamanho conhecido; não significa que o tipo necessariamente tem tamanho dinâmico. Receber `&T` permite manipular esses tipos por indireção.

### 24.5 Cow: emprestar quando possível, possuir quando necessário

```rust
use std::borrow::Cow;

fn remover_crlf(texto: &str) -> Cow<'_, str> {
    if texto.contains("\r\n") {
        Cow::Owned(texto.replace("\r\n", "\n"))
    } else {
        Cow::Borrowed(texto)
    }
}

fn main() {
    let sem_alocacao = remover_crlf("a\nb");
    let transformado = remover_crlf("a\r\nb");

    assert!(matches!(sem_alocacao, Cow::Borrowed(_)));
    assert_eq!(transformado, "a\nb");
}
```

`Cow` oferece uma representação que pode ser emprestada ou possuída. O método `to_mut` obtém acesso mutável, produzindo a versão possuída se necessário; `into_owned` entrega o valor possuído, copiando apenas quando necessário. É útil em normalização e escaping quando muitas entradas não precisam mudar. [Documentação de Cow](https://doc.rust-lang.org/std/borrow/enum.Cow.html).

### 24.6 Higher-ranked trait bounds: para qualquer lifetime

```rust
fn executar_com_temporario<F>(funcao: F) -> usize
where
    F: for<'a> Fn(&'a str) -> usize,
{
    let temporario = String::from("local");
    funcao(&temporario)
}

fn main() {
    assert_eq!(executar_com_temporario(|texto| texto.len()), 5);
}
```

`for<'a>` exige que a função aceite uma referência para qualquer lifetime apropriado escolhido naquele uso, inclusive o de um temporário criado internamente. É diferente de receber uma função especializada em um único lifetime escolhido fora.

Você verá HRTBs em callbacks, iteradores emprestados e bibliotecas que precisam separar o tempo de vida de uma chamada do tempo de vida de um objeto. [Referência de higher-ranked bounds](https://doc.rust-lang.org/reference/trait-bounds.html#higher-ranked-trait-bounds).

### 24.7 GATs: tipos associados que também têm parâmetros

Um trait pode associar uma família de tipos parametrizada por lifetime. Exemplo completo:

```rust
trait Fonte {
    type Vista<'a>
    where
        Self: 'a;

    fn vista(&self) -> Self::Vista<'_>;
}

struct Buffer(Vec<u8>);

impl Fonte for Buffer {
    type Vista<'a> = &'a [u8] where Self: 'a;

    fn vista(&self) -> Self::Vista<'_> {
        &self.0
    }
}

fn main() {
    let buffer = Buffer(vec![1, 2, 3]);
    assert_eq!(buffer.vista(), &[1, 2, 3]);
}
```

`Vista<'a>` pode depender do tempo de vida do empréstimo de `self`. Isso é útil para abstrações que retornam visões ou itens emprestados do próprio produtor. Um iterador que empresta seu buffer interno a cada chamada pode precisar desse tipo de modelagem em vez do contrato tradicional de `Iterator`.

GATs ampliam o poder de expressão, mas também têm restrições de uso, inclusive na combinação com objetos de trait. Não os introduza quando um retorno `&[u8]` comum já expressa a necessidade. [Referência de tipos associados](https://doc.rust-lang.org/reference/items/associated-items.html#associated-types).

### 24.8 Variância: quando um lifetime pode ser encurtado

Se uma referência é válida por muito tempo, geralmente podemos usá-la em uma região mais curta. Essa substituição é relacionada à covariância. Mas a posição em que o tipo aparece muda o que é seguro.

`&'a T` é covariante em `'a` e em `T`. `&'a mut T` é covariante em `'a`, mas **invariante em `T`**. Essa invariância impede substituir o conteúdo através de uma referência mutável de maneira que deixe um empréstimo curto dentro de algo que promete validade maior.

Imagine se fosse permitido tratar `&mut &'static str` como um lugar para escrever qualquer `&str` temporário. Você poderia inserir nele uma referência local, terminar seu escopo e manter um campo que ainda anuncia `'static`. A restrição evita essa mentira.

Esse assunto importa especialmente ao construir containers e abstrações `unsafe`. Consulte a tabela e as demonstrações de [subtipagem e variância](https://doc.rust-lang.org/nomicon/subtyping.html), em vez de decorar regras sem associá-las à operação de leitura ou escrita permitida.

### 24.9 no_std e sistemas embarcados

`#![no_std]` permite uma crate que não depende automaticamente de `std`. `core` oferece fundamentos que não exigem os serviços comuns de um sistema operacional. `alloc` pode fornecer `Vec`, `String` e `Box` quando o ambiente disponibiliza um allocator adequado.

Isso não transforma qualquer programa em firmware. Um executável bare-metal pode precisar de alvo específico, inicialização, linker script, tratamento de panic e acesso a dispositivos. Evite confundir `no_std` com “sem heap”: são escolhas relacionadas, mas distintas.

Uma biblioteca de parsing baseada em slices e erros pequenos pode funcionar sem I/O e sem alocação. Separar esse núcleo do código que abre arquivos é uma decisão arquitetural útil mesmo quando você nunca pretende escrever firmware.

## 25. Macros declarativas e procedurais

### 25.1 Uma macro declarativa pequena

```rust
macro_rules! vetor_textos {
    ($($texto:expr),* $(,)?) => {
        vec![$(String::from($texto)),*]
    };
}

fn main() {
    let linguagens = vetor_textos!["C", "Rust", "Go",];
    assert_eq!(linguagens.len(), 3);
    assert_eq!(linguagens[1], "Rust");
}
```

`$texto:expr` captura uma expressão. `$()*` repete o padrão. `$(,)?` aceita uma vírgula final opcional. A expansão produz código que ainda será analisado e verificado pelo compilador.

Diferentemente do pré-processador C, macros declarativas Rust trabalham com tokens e fragmentos sintáticos, com regras de higiene. Isso reduz várias colisões acidentais de nomes, mas não elimina a necessidade de entender resolução de nomes e escopos. Em macros exportadas, `$crate` ajuda a referenciar a crate que define a macro. [Macros by example](https://doc.rust-lang.org/reference/macros-by-example.html).

Antes de criar uma macro, considere uma função genérica. Macros são úteis quando é necessário gerar estrutura sintática que uma função não consegue receber ou produzir da mesma maneira. Mensagens de erro, documentação e manutenção também têm custo.

### 25.2 Macros procedurais

Macros procedurais recebem tokens e produzem tokens por código Rust. Há macros do tipo função, atributos e derives. Exemplos de uso incluem `#[derive(...)]` e atributos que geram integração com um runtime.

Uma implementação procedural normalmente vive em uma crate `proc-macro` separada. Ela executa no processo de compilação, não como parte de cada chamada do programa final. Ainda assim, pode aumentar o tempo de build e gerar código difícil de inspecionar. Aprenda primeiro os tipos e as APIs que deseja gerar; uma macro não substitui um contrato bem projetado.

## 26. Testes, ferramentas e desempenho

### 26.1 Testes unitários e de integração

Em `src/lib.rs` de uma crate de estudo:

```rust
pub fn dividir(a: i32, b: i32) -> Option<i32> {
    a.checked_div(b)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn divide_valores_validos() {
        assert_eq!(dividir(12, 3), Some(4));
    }

    #[test]
    fn rejeita_zero_e_overflow() {
        assert_eq!(dividir(1, 0), None);
        assert_eq!(dividir(i32::MIN, -1), None);
    }
}
```

Execute com `cargo test`. Testes em `tests/` são compilados como clientes da API pública. Testes de documentação permitem que exemplos de uso sejam verificados junto com a biblioteca.

Para um parser, um teste valioso não apenas repete a implementação. Ele afirma uma propriedade: entradas truncadas retornam erro; um limite anunciado nunca provoca acesso fora do buffer; codificar e decodificar preserva os dados válidos.

### 26.2 Uma rotina de verificação

```sh
cargo fmt --check
cargo clippy --all-targets -- -D warnings
cargo test
cargo test --release
cargo build --release
```

`fmt` padroniza apresentação. Clippy encontra padrões suspeitos e oportunidades de simplificação. Testar também em release ajuda a perceber dependências indevidas de verificações de overflow e outras diferenças de perfil. Nem Clippy nem testes substituem a leitura de contratos `unsafe`.

Para investigar esse código, Miri interpreta programas Rust e detecta várias classes de comportamento indefinido nos caminhos executados. Em uma toolchain nightly que disponibilize o componente:

```sh
rustup +nightly component add miri
cargo +nightly miri test
```

Miri não prova correção de todos os caminhos e tem limitações de plataforma e interoperabilidade. Consulte as [instruções e limitações do projeto](https://github.com/rust-lang/miri). Para bibliotecas críticas, combine testes de propriedades, fuzzing, revisão e ferramentas apropriadas ao domínio.

### 26.3 Desempenho começa no modelo de dados

Um percurso de iteradores não é automaticamente mais lento que um laço manual. Com monomorfização e otimização, ambos podem resultar em código semelhante. Da mesma forma, um bloco `unsafe` não é automaticamente mais rápido: ele pode apenas remover uma proteção sem melhorar o algoritmo.

Antes de otimizar, defina uma carga representativa e meça em release. Observe alocações, volume de cópias, acessos indiretos, localidade, contenção e I/O. Considere o custo de tempo de compilação e tamanho do executável quando houver muitos generics.

Exemplos de escolhas que costumam merecer medição:

- Retornar um slice emprestado em vez de alocar outra string.
- Reservar capacidade quando a ordem de grandeza é conhecida.
- Reutilizar buffers entre operações.
- Processar lotes para amortizar locks e chamadas de sistema.
- Usar armazenamento contíguo para estruturas percorridas sequencialmente.
- Reduzir cópias de `Arc` em um caminho muito frequente.

“Zero-cost abstraction” descreve uma intenção de projeto: abstrações podem compilar sem custo adicional em relação à implementação manual equivalente. Não significa que toda abstração custa zero, que allocations desapareceram ou que `dyn`, locks e validações deixaram de executar trabalho.

## 27. Projeto final: parser binário sem cópia

Vamos reunir os conceitos em uma biblioteca que lê um protocolo pequeno. O ponto central não é a complexidade do formato, mas a relação entre buffer, validação, referências, erros e API pública.

### 27.1 O contrato do formato

Cada pacote possui este layout em bytes:

| Offset | Tamanho | Significado |
| --- | --- | --- |
| 0 | 2 bytes | Assinatura ASCII `RU` |
| 2 | 1 byte | Versão; apenas `1` é aceita |
| 3 | 1 byte | Flags reservadas; precisam ser `0` |
| 4 | 4 bytes | Tamanho do payload em `u32` little-endian |
| 8 | Variável | Payload binário |

O limite de payload será 1 MiB. A função de parsing recebe um slice e retorna uma visão do primeiro pacote e o restante da entrada. Isso permite processar vários pacotes concatenados sem copiar cada payload.

```text
entrada: [ R U | versão | flags | tamanho LE | payload | próximo pacote... ]
           └──────── cabeçalho: 8 bytes ─────┘   │           │
                                              └─ &payload └─ &restante
```

Não vamos converter o cabeçalho em uma struct `repr(C)` por cast. Vamos ler campos explicitamente, verificando limites e endianness. Nenhuma operação `unsafe` é necessária.

### 27.2 Criando o projeto

Em um diretório para seus exercícios, fora do código do site:

```sh
cargo new protocolo_rust --lib --edition 2024
cd protocolo_rust
```

Substitua `src/lib.rs` pelo bloco completo a seguir. Ele inclui biblioteca e testes:

```rust
use std::{error::Error, fmt};

pub const TAMANHO_CABECALHO: usize = 8;
pub const MAX_PAYLOAD: usize = 1_048_576;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErroPacote {
    Incompleto { necessario: usize, disponivel: usize },
    AssinaturaInvalida,
    VersaoNaoSuportada(u8),
    FlagsInvalidas(u8),
    PayloadMuitoGrande { tamanho: usize, limite: usize },
    ComprimentoNaoRepresentavel,
}

impl fmt::Display for ErroPacote {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Incompleto { necessario, disponivel } => {
                write!(f, "entrada incompleta: precisa de {necessario} bytes, tem {disponivel}")
            }
            Self::AssinaturaInvalida => write!(f, "assinatura diferente de RU"),
            Self::VersaoNaoSuportada(versao) => {
                write!(f, "versão não suportada: {versao}")
            }
            Self::FlagsInvalidas(flags) => write!(f, "flags reservadas: {flags:#04x}"),
            Self::PayloadMuitoGrande { tamanho, limite } => {
                write!(f, "payload de {tamanho} bytes excede o limite de {limite}")
            }
            Self::ComprimentoNaoRepresentavel => {
                write!(f, "comprimento não representável na plataforma ou no protocolo")
            }
        }
    }
}

impl Error for ErroPacote {}

#[derive(Debug, PartialEq, Eq)]
pub struct Pacote<'a> {
    pub versao: u8,
    pub payload: &'a [u8],
}

impl<'a> Pacote<'a> {
    pub fn texto(&self) -> Result<&'a str, std::str::Utf8Error> {
        std::str::from_utf8(self.payload)
    }
}

pub fn parse<'a>(entrada: &'a [u8]) -> Result<(Pacote<'a>, &'a [u8]), ErroPacote> {
    if entrada.len() < TAMANHO_CABECALHO {
        return Err(ErroPacote::Incompleto {
            necessario: TAMANHO_CABECALHO,
            disponivel: entrada.len(),
        });
    }

    if &entrada[..2] != b"RU" {
        return Err(ErroPacote::AssinaturaInvalida);
    }

    let versao = entrada[2];
    if versao != 1 {
        return Err(ErroPacote::VersaoNaoSuportada(versao));
    }

    let flags = entrada[3];
    if flags != 0 {
        return Err(ErroPacote::FlagsInvalidas(flags));
    }

    let anunciado = u32::from_le_bytes([
        entrada[4], entrada[5], entrada[6], entrada[7],
    ]);

    let tamanho = usize::try_from(anunciado)
        .map_err(|_| ErroPacote::ComprimentoNaoRepresentavel)?;

    if tamanho > MAX_PAYLOAD {
        return Err(ErroPacote::PayloadMuitoGrande {
            tamanho,
            limite: MAX_PAYLOAD,
        });
    }

    let fim = TAMANHO_CABECALHO.checked_add(tamanho)
        .ok_or(ErroPacote::ComprimentoNaoRepresentavel)?;

    if entrada.len() < fim {
        return Err(ErroPacote::Incompleto {
            necessario: fim,
            disponivel: entrada.len(),
        });
    }

    let pacote = Pacote {
        versao,
        payload: &entrada[TAMANHO_CABECALHO..fim],
    };

    Ok((pacote, &entrada[fim..]))
}

pub fn codificar(payload: &[u8]) -> Result<Vec<u8>, ErroPacote> {
    if payload.len() > MAX_PAYLOAD {
        return Err(ErroPacote::PayloadMuitoGrande {
            tamanho: payload.len(),
            limite: MAX_PAYLOAD,
        });
    }

    let tamanho = u32::try_from(payload.len())
        .map_err(|_| ErroPacote::ComprimentoNaoRepresentavel)?;

    let capacidade = TAMANHO_CABECALHO.checked_add(payload.len())
        .ok_or(ErroPacote::ComprimentoNaoRepresentavel)?;

    let mut saida = Vec::with_capacity(capacidade);
    saida.extend_from_slice(b"RU");
    saida.push(1);
    saida.push(0);
    saida.extend_from_slice(&tamanho.to_le_bytes());
    saida.extend_from_slice(payload);
    Ok(saida)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn le_pacote_e_empresta_o_payload_original() {
        let bytes = b"RU\x01\x00\x04\x00\x00\x00Rust";
        let (pacote, resto) = parse(bytes).unwrap();

        assert_eq!(pacote.versao, 1);
        assert_eq!(pacote.texto().unwrap(), "Rust");
        assert!(resto.is_empty());
        assert_eq!(pacote.payload.as_ptr(), bytes[TAMANHO_CABECALHO..].as_ptr());
    }

    #[test]
    fn rejeita_todos_os_prefixos_truncados() {
        let bytes = b"RU\x01\x00\x04\x00\x00\x00Rust";

        for fim in 0..bytes.len() {
            assert!(matches!(
                parse(&bytes[..fim]),
                Err(ErroPacote::Incompleto { .. })
            ));
        }
    }

    #[test]
    fn rejeita_assinatura_versao_e_flags() {
        let mut bytes = *b"RU\x01\x00\x00\x00\x00\x00";

        bytes[0] = b'X';
        assert_eq!(parse(&bytes), Err(ErroPacote::AssinaturaInvalida));

        bytes[0] = b'R';
        bytes[2] = 2;
        assert_eq!(parse(&bytes), Err(ErroPacote::VersaoNaoSuportada(2)));

        bytes[2] = 1;
        bytes[3] = 1;
        assert_eq!(parse(&bytes), Err(ErroPacote::FlagsInvalidas(1)));
    }

    #[test]
    fn rejeita_tamanho_excessivo_antes_de_esperar_o_payload() {
        let mut bytes = *b"RU\x01\x00\x00\x00\x00\x00";
        let anunciado = u32::try_from(MAX_PAYLOAD + 1).unwrap();
        bytes[4..8].copy_from_slice(&anunciado.to_le_bytes());

        assert!(matches!(parse(&bytes), Err(ErroPacote::PayloadMuitoGrande { .. })));
    }

    #[test]
    fn devolve_o_restante_para_outro_parse() {
        let mut bytes = codificar(b"primeiro").unwrap();
        bytes.extend_from_slice(&codificar(b"segundo").unwrap());

        let (primeiro, resto) = parse(&bytes).unwrap();
        let (segundo, final_do_buffer) = parse(resto).unwrap();

        assert_eq!(primeiro.payload, b"primeiro");
        assert_eq!(segundo.payload, b"segundo");
        assert!(final_do_buffer.is_empty());
    }

    #[test]
    fn aceita_payload_vazio() {
        let bytes = codificar(b"").unwrap();
        let (pacote, resto) = parse(&bytes).unwrap();
        assert!(pacote.payload.is_empty());
        assert!(resto.is_empty());
    }

    #[test]
    fn payload_binario_nao_precisa_ser_utf8() {
        let bytes = codificar(&[0xff, 0xfe]).unwrap();
        let (pacote, _) = parse(&bytes).unwrap();
        assert!(pacote.texto().is_err());
    }

    #[test]
    fn codificar_preserva_bytes_ao_decodificar() {
        let original = [0, 1, 127, 128, 255];
        let bytes = codificar(&original).unwrap();
        let (pacote, resto) = parse(&bytes).unwrap();
        assert_eq!(pacote.payload, original.as_slice());
        assert!(resto.is_empty());
    }

    #[test]
    fn aceita_o_limite_e_rejeita_o_excesso_na_codificacao() {
        let payload = vec![0_u8; MAX_PAYLOAD];
        let bytes = codificar(&payload).unwrap();
        assert_eq!(parse(&bytes).unwrap().0.payload.len(), MAX_PAYLOAD);

        let excessivo = vec![0_u8; MAX_PAYLOAD + 1];
        assert!(matches!(
            codificar(&excessivo),
            Err(ErroPacote::PayloadMuitoGrande { .. })
        ));
    }
}
```

Execute no projeto do exercício:

```sh
cargo fmt
cargo test
cargo test --release
```

### 27.3 O que a API garante e o que ela não promete

A assinatura de `parse` vincula pacote e restante à entrada. Não há alocação do payload durante o parsing. Ler os quatro bytes de comprimento em um `u32` envolve copiar um pequeno valor escalar, o que é diferente de duplicar o corpo da mensagem.

O primeiro teste compara os endereços para demonstrar que o payload é uma fatia do buffer original. Isso complementa a verificação do conteúdo, que sozinha também passaria em uma implementação que alocasse uma cópia.

A função diferencia truncamento de entrada inválida. Em um stream, `Incompleto` pode significar “acumule mais bytes”; no fim de um arquivo, significa que o arquivo terminou cedo. O tamanho anunciado é limitado antes de ser aceito como quantidade de dados a aguardar.

`Pacote::texto` é opcional e independente da validação estrutural. Um payload binário com bytes não UTF-8 continua sendo um pacote válido. Isso evita confundir regras do envelope com regras de um conteúdo específico.

O limite de 1 MiB é uma política local, não uma propriedade de `u32`. Ajuste-o conforme o domínio e os recursos disponíveis. O código assume um alvo de uso geral com `usize` de pelo menos 32 bits. Falta de memória na codificação não foi modelada como uma variante recuperável; `Vec::with_capacity` usa a política usual de alocação do ambiente. Uma biblioteca com esse requisito precisaria considerar APIs falíveis de reserva.

Também não há autenticação, checksum, compressão nem proteção contra repetição. Essas são propriedades de protocolo a serem projetadas, não consequências automáticas da segurança de memória.

### 27.4 Um executável para ler um arquivo

No mesmo projeto, adicione `src/main.rs`. Ele lê **um pacote por arquivo** e limita a quantidade de bytes que aceita carregar:

```rust
use protocolo_rust::{MAX_PAYLOAD, TAMANHO_CABECALHO, parse};
use std::{env, error::Error, fs::File, io::{self, Read}};

fn executar() -> Result<(), Box<dyn Error>> {
    let mut argumentos = env::args_os().skip(1);
    let caminho = argumentos.next().ok_or_else(|| {
        io::Error::new(io::ErrorKind::InvalidInput, "uso: protocolo_rust arquivo.bin")
    })?;

    if argumentos.next().is_some() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "informe apenas um arquivo",
        ).into());
    }

    let limite = TAMANHO_CABECALHO + MAX_PAYLOAD;
    let arquivo = File::open(caminho)?;
    let mut bytes = Vec::new();

    // Um byte extra permite detectar que o arquivo excede o limite.
    arquivo.take((limite + 1) as u64).read_to_end(&mut bytes)?;

    if bytes.len() > limite {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "arquivo excede o limite de um pacote",
        ).into());
    }

    let (pacote, resto) = parse(&bytes)?;
    if !resto.is_empty() {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            "há bytes extras após o pacote",
        ).into());
    }

    println!("Versão: {}", pacote.versao);
    println!("Payload: {} bytes", pacote.payload.len());
    match pacote.texto() {
        Ok(texto) => println!("Texto: {texto}"),
        Err(_) => println!("Payload binário sem representação UTF-8 válida"),
    }

    Ok(())
}

fn main() {
    if let Err(erro) = executar() {
        eprintln!("Erro: {erro}");
        std::process::exit(1);
    }
}
```

`args_os` aceita caminhos que não sejam representáveis como UTF-8. O limite da leitura impede que um arquivo arbitrariamente grande seja carregado por inteiro antes da validação. O buffer cresce com os bytes efetivamente lidos; a capacidade interna do `Vec` pode ser maior que seu comprimento.

Para gerar um arquivo de demonstração, execute em um terminal com Python 3, na raiz do exercício:

```sh
python3 - <<'PY'
from pathlib import Path
payload = b"Rust"
cabecalho = b"RU" + bytes([1, 0]) + len(payload).to_bytes(4, "little")
Path("exemplo.bin").write_bytes(cabecalho + payload)
PY
cargo run -- exemplo.bin
```

Saída esperada:

```text
Versão: 1
Payload: 4 bytes
Texto: Rust
```

### 27.5 Por que não retornar um pacote que aponta para um Vec local

Este desenho **não compila**:

```rust
use protocolo_rust::{Pacote, parse};

fn carregar<'a>() -> Pacote<'a> {
    let bytes = std::fs::read("exemplo.bin").unwrap();
    parse(&bytes).unwrap().0
} // bytes seria destruído, invalidando o payload.
```

A lifetime `'a` é escolhida pelo contrato, mas a função não consegue produzir uma referência que viva esse tempo a partir de um buffer local prestes a morrer. O problema não é falta de uma anotação mais longa: é o desenho de propriedade.

Três alternativas úteis:

1. O chamador possui os bytes e passa `&[u8]` ao parser, como fizemos.
2. A função retorna um pacote possuído, com `Vec<u8>` no payload, aceitando a propriedade ou a cópia necessária.
3. Um objeto possui o buffer e guarda intervalos numéricos, produzindo slices apenas nos métodos que o emprestam.

### 27.6 Evoluindo para um parser de stream

Em TCP, uma leitura não corresponde necessariamente a uma mensagem. Você pode receber meio cabeçalho, várias mensagens juntas ou qualquer fragmentação entre esses extremos.

Um leitor incremental precisa acumular dados, chamar o parser, consumir apenas o prefixo completo e preservar o restante. Enquanto houver um `Pacote` emprestando o buffer, você não pode realocar ou deslocar livremente esse buffer. Processe o pacote antes de reutilizá-lo, transfira a propriedade do armazenamento ou use uma representação que suporte compartilhamento controlado.

Esse é um ponto em que ownership ajuda a revelar um problema de projeto que em C poderia ficar escondido atrás de um ponteiro aparentemente válido até a próxima realocação.

## 28. Como traduzir padrões de C para Rust

| Padrão em C | Primeira alternativa a considerar em Rust | Observação |
| --- | --- | --- |
| `malloc` + `free` para um objeto | `Box<T>` | Propriedade exclusiva e destruição |
| Buffer dinâmico com comprimento/capacidade | `Vec<T>` | Separação entre elementos válidos e capacidade |
| Ponteiro + número de elementos | `&[T]` ou `&mut [T]` | Empréstimo com limites |
| `char *` para texto próprio | `String` | UTF-8, sem terminador obrigatório |
| `const char *` temporário para texto Rust | `&str` | Não substitui diretamente string C em FFI |
| String C terminada em zero | `CString` / `CStr` | Possuída / emprestada |
| Ponteiro nulo para ausência | `Option<T>` | Escolha `T` conforme propriedade e referência |
| Código de retorno + parâmetro de saída | `Result<T, E>` | Resultado e erro não se confundem |
| Tagged union manual | `enum` com dados | `match` verifica variantes |
| Callback + `void *` | Closure e traits `Fn*` | Na FFI, o contrato manual pode continuar necessário |
| Tabela de ponteiros de função | Trait; eventualmente `dyn Trait` | Escolha dispatch pelo requisito |
| `goto cleanup` | RAII e guards | Erros retornam com `?` |
| Contagem manual de referências | `Rc` ou `Arc` | Ciclos continuam exigindo projeto |
| Buffer de saída fornecido pelo chamador | `&mut [u8]` | Retorne tamanho escrito e erro explicitamente |
| Contexto global mutável | Estado explícito ou inicialização/sincronização apropriada | Evite acesso global irrestrito |
| Aritmética de ponteiros para percorrer array | Iteradores e slices | Raw pointers ficam para contratos realmente necessários |

Essas correspondências são pontos de partida, não traduções automáticas. Uma API C pode combinar convenções de ownership que exigem tipos e wrappers específicos.

### Erros frequentes de quem já conhece C

**Tratar `&T` como um `const T *` sem outras obrigações.** Referências Rust incluem contratos de validade, alinhamento e aliasing que vão além de proibir escrita por aquele identificador.

**Usar `clone` até tudo compilar.** Você pode acabar alterando a semântica de compartilhamento e adicionando cópias caras. Primeiro descubra quem deve possuir o dado.

**Colocar lifetimes em todos os tipos por hábito.** Use referências quando há uma relação real de empréstimo. Um objeto autônomo pode ficar mais claro com campos possuídos.

**Acreditar que `'static` significa alocação global.** Bounds de tipos e duração concreta de um valor não são a mesma coisa.

**Usar `unsafe` para escapar de um erro de arquitetura.** O código pode compilar e ainda violar o modelo de memória. Reorganizar o acesso costuma produzir uma solução mais fácil de manter.

**Assumir que `Arc` permite modificar qualquer coisa.** A contagem é sincronizada; o conteúdo continua precisando de um mecanismo apropriado de acesso.

**Confundir panic com comportamento indefinido.** Um acesso seguro fora dos limites gera panic; um acesso bruto inválido pode tornar o programa inteiro incorreto. Não são variantes equivalentes do mesmo resultado.

**Esperar que um compilador elimine bugs de lógica.** Um programa pode ser seguro em memória e ainda cobrar duas vezes, perder mensagens ou esperar para sempre.

## 29. Exercícios progressivos

### Etapa 1 — Sintaxe e contratos numéricos

Implemente conversões de temperatura com tipos explícitos e uma função que converte `u64` para `u16` retornando erro quando necessário. Depois implemente soma de comprimentos com `checked_add`.

Critério de conclusão: entradas de limite são testadas e nenhum cast é usado como substituto de validação. Explique por que `i32::MIN / -1` merece tratamento especial.

### Etapa 2 — Empréstimos e texto

Implemente `fn extensao(nome: &str) -> Option<&str>` sem alocar. Defina o comportamento para nomes sem ponto, nomes iniciados por ponto, vários pontos e ponto no final. Em seguida, escreva um parser de linhas `chave=valor` que devolva slices.

Critério de conclusão: os resultados dependem explicitamente da entrada e os testes documentam suas decisões. Teste texto com acentos e não corte UTF-8 no meio.

### Etapa 3 — Ownership e coleções

Construa um índice de palavras em duas versões: `HashMap<&str, usize>` emprestando um documento e `HashMap<String, usize>` independente do documento.

Critério de conclusão: explique quais alocações cada versão precisa e por que a primeira não pode sobreviver ao texto. Ordene a apresentação do resultado sem assumir ordem de iteração do `HashMap`.

### Etapa 4 — Modelagem e erros

Modele uma tarefa com estados `Pendente`, `EmExecucao` e `Concluida`, carregando dados relevantes em cada variante. Implemente transições que retornam erro para operações proibidas. Depois compare com uma versão de typestate.

Critério de conclusão: estados inválidos não são representados apenas por combinações arbitrárias de booleanos. Justifique qual versão serve melhor para carregar tarefas de um arquivo em runtime.

### Etapa 5 — Parser e dados hostis

Amplie o projeto final com um codificador que escreve em `&mut [u8]` e retorna o número de bytes escritos. Antes de modificar o destino, verifique se há espaço suficiente. Adicione testes para um buffer exatamente do tamanho necessário e outro com um byte a menos.

Depois implemente parsing de uma sequência de pacotes. Decida se uma falha depois de três mensagens válidas deve retornar os resultados parciais ou invalidar a sequência inteira.

Critério de conclusão: a política de processamento parcial está na API e nos testes. Nenhum byte anunciado pela entrada é usado para acessar memória antes da validação.

### Etapa 6 — Concorrência

Processe arquivos independentes com um número limitado de workers. Use um canal limitado para enviar tarefas e outro mecanismo para coletar resultados. Preserve o caminho do arquivo junto com cada erro.

Critério de conclusão: existe um limite explícito de concorrência e acúmulo de mensagens. O encerramento não depende de emissores esquecidos. A ordem dos resultados é definida, mesmo que seja “ordem de conclusão”.

### Etapa 7 — FFI

Exponha um parser mínimo para C, retornando status e offsets em uma struct compatível. Evite retornar uma referência Rust através da ABI. Escreva um header C com as regras de validade e um programa que chama a biblioteca.

Critério de conclusão: está documentado quem possui o buffer, por quanto tempo os offsets são utilizáveis e como cada status é tratado. Uma entrada truncada retorna erro sem provocar panic.

### Etapa 8 — Revisão de unsafe

Releia `dividir_mut` e escreva a prova para os casos de slice vazio, divisão em zero e divisão no comprimento total. Execute os testes sob Miri em um ambiente com a ferramenta instalada. Como extensão, estude o caso de tipos de tamanho zero.

Critério de conclusão: você consegue distinguir condições verificadas em runtime, condições garantidas pela assinatura e condições que a implementação precisa demonstrar manualmente.

### Perguntas para verificar seu modelo mental

1. Por que mover uma `String` normalmente não precisa duplicar seus bytes?
2. Por que reservar capacidade não permite manter qualquer referência e chamar `push` livremente?
3. Quando retornar `String` é mais adequado que retornar `&str`?
4. Por que `Clone` em `String` e em `Arc<String>` tem efeitos diferentes?
5. Qual é a diferença entre um tipo `Send` e um tipo `Sync`?
6. Por que `Relaxed` serve para um contador independente, mas não descreve sozinho a publicação de outro objeto?
7. O que precisa continuar verdadeiro depois de criar um slice com `from_raw_parts`?
8. Por que `repr(C)` não é uma definição completa de formato de rede?
9. O que um futuro deixa de fazer quando é descartado, e quais efeitos podem continuar existindo?
10. Qual garantia de uma API é realmente estática, qual depende de runtime e qual continua sendo uma convenção documentada?

## 30. Referências e próximos estudos

Os exemplos desta nota foram construídos para relacionar os conceitos a situações comuns de programação de sistemas. Para aprofundar os contratos e acompanhar sua evolução, use as fontes oficiais:

| Fonte | Como usar |
| --- | --- |
| [The Rust Programming Language](https://doc.rust-lang.org/book/) | Percurso estruturado da linguagem e exercícios de projeto |
| [Rust by Example](https://doc.rust-lang.org/rust-by-example/) | Exemplos pequenos para praticar sintaxe e recursos |
| [Biblioteca padrão](https://doc.rust-lang.org/std/) | Contratos, exemplos e complexidade das APIs utilizadas |
| [Rust Reference](https://doc.rust-lang.org/reference/) | Regras da linguagem, representação e comportamento |
| [Rustonomicon](https://doc.rust-lang.org/nomicon/) | Invariantes de código inseguro e programação de baixo nível |
| [Cargo Book](https://doc.rust-lang.org/cargo/) | Perfis, dependências, workspaces, testes e distribuição |
| [Edition Guide](https://doc.rust-lang.org/edition-guide/) | Diferenças de edição e migração |
| [Async Book](https://rust-lang.github.io/async-book/) | Modelo de execução assíncrona e conceitos fundamentais |
| [Documentação do Tokio](https://docs.rs/tokio/latest/tokio/) | Runtime, tarefas, I/O, sincronização e cancelamento |
| [The Embedded Rust Book](https://doc.rust-lang.org/embedded-book/) | Aplicação de Rust em ambientes embarcados |

Uma sequência de estudo útil é implementar primeiro uma ferramenta de linha de comando com arquivos e erros tipados, depois uma biblioteca de parsing com testes e, por fim, um pequeno serviço concorrente ou uma integração com C. Ao revisar cada projeto, desenhe os proprietários dos recursos e anote onde há empréstimos, cópias, sincronização e contratos externos. Esse hábito aproveita seu conhecimento de C e o transforma em decisões explícitas de API em Rust.

Para continuar com aulas práticas mais focadas, siga esta ordem:

1. [[Rust/Ownership e borrowing na prática|Ownership e borrowing na prática]] — transferências, empréstimos e correção de conflitos sem cópias desnecessárias.
2. [[Rust/Lifetimes|Lifetimes]] — contratos de referências, origem dos dados e resultados emprestados.
3. [[Rust/Construindo um grep|Construindo um grep]] — aplicação completa com CLI, leitura incremental, busca e testes.
