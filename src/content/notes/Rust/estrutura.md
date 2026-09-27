# Estrutura de uma aplicação em Rust

Saber escrever funções em Rust é uma parte do trabalho. A próxima é entender onde elas ficam, como os arquivos se conectam, o que deve ser público e como separar entrada e saída das regras da aplicação.

Esta nota complementa [[Rust/Introdução|Rust: do zero ao avançado para quem já domina C]]. O foco aqui é a **organização de um projeto completo**, mantendo a comparação com C quando ela ajuda a explicar uma diferença importante.

Vamos construir uma aplicação de linha de comando chamada `resumo-notas`. Ela recebe o caminho de um arquivo UTF-8 e informa quantas linhas, palavras e bytes ele contém. O exemplo é pequeno o suficiente para ser compreendido inteiro, mas inclui biblioteca, executável, módulos, erros, testes e um exemplo de uso.

> [!note] Como usar os códigos
> Os blocos da aplicação principal formam **um único projeto**, com cada arquivo identificado no título da seção. Use Rust estável com suporte à edition 2024. Crie o exercício em um diretório separado do site de notas. As propostas de expansão no fim da aula são alternativas de organização; não precisam ser adicionadas ao exemplo inicial.

## Sumário

1. [Os níveis de organização](#1-os-níveis-de-organização)
2. [A estrutura mínima](#2-a-estrutura-mínima)
3. [A estrutura do exemplo completo](#3-a-estrutura-do-exemplo-completo)
4. [Cargo.toml e Cargo.lock](#4-cargotoml-e-cargolock)
5. [Biblioteca e executável são crates diferentes](#5-biblioteca-e-executável-são-crates-diferentes)
6. [Módulos, arquivos e caminhos](#6-módulos-arquivos-e-caminhos)
7. [Implementando a biblioteca](#7-implementando-a-biblioteca)
8. [Implementando a interface de linha de comando](#8-implementando-a-interface-de-linha-de-comando)
9. [Executando e acompanhando o fluxo](#9-executando-e-acompanhando-o-fluxo)
10. [Organização dos testes](#10-organização-dos-testes)
11. [Exemplos, documentação e comandos](#11-exemplos-documentação-e-comandos)
12. [Privacidade e API pública](#12-privacidade-e-api-pública)
13. [Como a estrutura cresce](#13-como-a-estrutura-cresce)
14. [Vários executáveis no mesmo pacote](#14-vários-executáveis-no-mesmo-pacote)
15. [Quando usar um workspace](#15-quando-usar-um-workspace)
16. [Configuração, dependências e arquivos auxiliares](#16-configuração-dependências-e-arquivos-auxiliares)
17. [Comparação com a organização de um projeto C](#17-comparação-com-a-organização-de-um-projeto-c)
18. [Exercícios e roteiro de revisão](#18-exercícios-e-roteiro-de-revisão)
19. [Referências](#19-referências)

## 1. Os níveis de organização

Antes da árvore de diretórios, separe quatro conceitos:

| Conceito | O que representa | Exemplo |
| --- | --- | --- |
| Workspace | Conjunto de pacotes gerenciados em conjunto | Uma ferramenta e bibliotecas locais relacionadas |
| Pacote, ou package | Projeto descrito por um `Cargo.toml` com seção `[package]` | O pacote `resumo-notas` |
| Crate | Unidade de compilação Rust | A biblioteca ou um executável do pacote |
| Módulo | Organização de nomes e privacidade dentro de uma crate | `analise`, `erro` e `servico` |

Uma crate pode conter muitos módulos, espalhados por vários arquivos. Um arquivo `.rs` comum não vira automaticamente uma crate independente.

No modelo usual de Cargo, um pacote pode ter uma biblioteca e vários executáveis. Um workspace permite coordenar vários pacotes, mas não é necessário para começar. Essas distinções são apresentadas no capítulo oficial sobre [pacotes e crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html).

No exemplo desta aula:

```text
pacote resumo-notas
│
├── crate de biblioteca: resumo_notas
│   └── raiz em src/lib.rs
│       ├── módulo analise
│       ├── módulo erro
│       └── módulo servico
│
└── crate executável: resumo-notas
    └── raiz em src/main.rs
        └── módulo cli
```

Perceba que a separação entre biblioteca e executável é uma fronteira real de compilação e visibilidade. Eles compartilham o pacote, mas não compartilham automaticamente o mesmo módulo raiz.

## 2. A estrutura mínima

Crie o projeto:

```sh
cargo new resumo-notas --bin --edition 2024
cd resumo-notas
```

Um ponto de partida suficiente é:

```text
resumo-notas/
├── Cargo.toml
└── src/
    └── main.rs
```

O conteúdo inicial de `src/main.rs` pode ser:

```rust
fn main() {
    println!("Aplicação iniciada");
}
```

Execute com:

```sh
cargo run
```

Para um experimento de poucas linhas, isso basta. Não é obrigatório começar com pastas `domain`, `application`, `infra`, `services`, `repositories` e vários traits.

A divisão em arquivos passa a ajudar quando revela responsabilidades que você consegue nomear e explicar. Nesta aula, faremos essa divisão para estudar as fronteiras; não porque todo programa de contagem precise nascer com esse número de arquivos.

## 3. A estrutura do exemplo completo

Ao terminar os passos abaixo, o projeto terá:

```text
resumo-notas/
├── Cargo.toml
├── Cargo.lock
├── .gitignore
├── src/
│   ├── lib.rs
│   ├── analise.rs
│   ├── erro.rs
│   ├── servico.rs
│   ├── main.rs
│   └── cli.rs
├── tests/
│   ├── resumo_publico.rs
│   └── fixtures/
│       └── nota.txt
├── examples/
│   └── analisar_texto.rs
└── target/                    ← gerado pelo Cargo
```

Cada arquivo tem uma pergunta principal para responder:

| Arquivo | Pergunta que ele responde |
| --- | --- |
| `Cargo.toml` | Qual é o pacote e como ele depende de outras bibliotecas? |
| `src/lib.rs` | Qual funcionalidade a biblioteca oferece a seus clientes? |
| `src/analise.rs` | Como calcular as estatísticas de um texto? |
| `src/erro.rs` | Como representar e explicar as falhas da biblioteca? |
| `src/servico.rs` | Como combinar leitura de arquivo e análise? |
| `src/cli.rs` | Quais argumentos a interface de terminal aceita? |
| `src/main.rs` | Como iniciar, executar e encerrar o programa? |
| `tests/resumo_publico.rs` | A API funciona quando usada por um cliente externo? |
| `tests/fixtures/nota.txt` | Qual entrada controlada será usada no teste com arquivo? |
| `examples/analisar_texto.rs` | Como alguém utiliza a biblioteca em outro programa? |

Cargo reconhece convenções para `src/main.rs`, `src/lib.rs`, `tests/`, `examples/`, `benches/` e `src/bin/`. Já nomes como `analise.rs` e `servico.rs` são decisões nossas. As convenções oficiais estão no guia de [layout de pacotes](https://doc.rust-lang.org/cargo/guide/project-layout.html).

> [!tip] Diferencie convenção da ferramenta e escolha de arquitetura
> `src/lib.rs` tem um significado convencional para Cargo. `src/servico.rs` não recebe nenhum comportamento especial por se chamar “serviço”. Seu papel vem do código, das dependências e da API que você escreveu.

## 4. Cargo.toml e Cargo.lock

### 4.1 O manifesto do projeto

Use este `Cargo.toml` completo:

```toml
[package]
name = "resumo-notas"
version = "0.1.0"
edition = "2024"

[dependencies]
```

O programa usa apenas a biblioteca padrão, portanto não precisa de dependências externas.

`name` identifica o pacote. No código Rust, o nome convencional da biblioteca usa underscores: `resumo_notas`. Por isso, o executável será chamado como `resumo-notas`, enquanto os imports usarão `use resumo_notas::...`.

`version` é a versão do seu pacote. `edition` seleciona as regras de edição da linguagem; não fixa uma versão exata do compilador. Cargo descobre os alvos convencionais sem exigir que você declare manualmente cada arquivo `.rs` no manifesto.

### 4.2 O papel do lockfile

`Cargo.toml` descreve requisitos de dependências. `Cargo.lock`, mantido pelo Cargo, registra as versões resolvidas. Nesta aplicação, mantenha o lockfile versionado.

Não escreva uma lista manual de dependências transitivas nele. Quando for necessário atualizar versões, use os comandos do Cargo e revise a alteração produzida.

O lockfile ajuda a reproduzir a resolução das dependências, mas não fixa sozinho todo o ambiente: compilador, alvo, bibliotecas nativas e opções de compilação também podem afetar o build.

### 4.3 O diretório target

`target/` recebe artefatos de compilação, caches e executáveis. É gerado, não é o lugar para escrever código-fonte.

Inclua no `.gitignore`:

```text
/target/
```

Em uma configuração local padrão, os executáveis ficam em `target/debug/` ou `target/release/`, conforme o perfil escolhido. Compilar para um alvo explícito pode acrescentar outra camada de diretórios.

## 5. Biblioteca e executável são crates diferentes

`src/main.rs` é a raiz do executável. `src/lib.rs` é a raiz da biblioteca. Ter os dois no mesmo pacote é útil quando a funcionalidade merece ser usada e testada independentemente da interface do terminal.

No nosso projeto:

- A biblioteca sabe analisar um texto e resumir um arquivo.
- O executável sabe ler argumentos, imprimir resultados e escolher o código de saída.

Se amanhã surgir uma interface gráfica, ela poderá chamar a mesma biblioteca. A função que conta palavras não precisará aprender a abrir uma janela.

O fluxo pretendido é:

```text
usuário
  │ fornece argumentos
  ▼
main.rs ──► cli.rs
  │ recebe um caminho validado
  ▼
API pública da biblioteca: resumir_arquivo(...)
  │
  ▼
servico.rs ──► sistema de arquivos
  │ texto UTF-8
  ▼
analise.rs
  │ Resumo
  ▼
main.rs ──► saída no terminal
```

O desenho mostra chamadas e circulação de dados. Ele não exige que todos os módulos conheçam todos os outros.

### Uma consequência importante para crate::

Dentro da biblioteca, `crate::` aponta para a raiz definida por `lib.rs`. Dentro do executável, aponta para a raiz definida por `main.rs`.

Por isso, em `main.rs` usaremos:

```rust
use resumo_notas::resumir_arquivo;
```

Esse é o acesso à outra crate, a biblioteca do pacote. `crate::resumir_arquivo` não aponta automaticamente para `lib.rs`.

Também não repetiremos `mod analise;` em `main.rs`. Isso declararia outro módulo na árvore do executável, em vez de importar o módulo já declarado na biblioteca. Tipos definidos em duas declarações distintas não viram o mesmo tipo apenas porque vieram de um arquivo de nome semelhante.

## 6. Módulos, arquivos e caminhos

### 6.1 mod declara; use dá acesso por um nome no escopo

Quando a raiz da biblioteca contém:

```rust
mod analise;
```

ela declara um módulo cujo conteúdo será procurado, na organização adotada, em `src/analise.rs`.

Quando outro módulo contém:

```rust
use crate::analise::analisar;
```

ele traz o nome `analisar` para seu escopo. Não está incluindo o arquivo como um header C nem declarando uma nova cópia do módulo.

Criar `src/qualquer_coisa.rs` sozinho não o conecta automaticamente à árvore de módulos. Arquivos comuns entram pela declaração correspondente; alvos como `src/bin/exemplo.rs` seguem convenções específicas do Cargo.

### 6.2 Submódulos em diretórios

Uma possível expansão, que ainda não é necessária no exemplo, seria:

```text
src/
├── lib.rs
├── analise.rs
└── analise/
    ├── palavras.rs
    └── linhas.rs
```

`lib.rs` declara `mod analise;`. Por sua vez, `analise.rs` pode declarar:

```rust
mod palavras;
mod linhas;
```

Esses filhos pertencem a `crate::analise::palavras` e `crate::analise::linhas`. Os diretórios acompanham a árvore, mas não a substituem.

Rust também aceita o formato `src/analise/mod.rs` no lugar de `src/analise.rs`. Escolha uma organização para aquele módulo: não crie os dois ao mesmo tempo. As alternativas são documentadas no capítulo de [módulos em arquivos separados](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html).

### 6.3 Os prefixos de caminhos

| Prefixo | Significado |
| --- | --- |
| `crate::` | Raiz da crate atual |
| `self::` | Módulo atual |
| `super::` | Módulo pai |
| `resumo_notas::` | Biblioteca acessível pelo nome da crate |
| `std::` | Biblioteca padrão |

Nos testes internos de um módulo, `use super::*;` é comum porque o teste é um módulo filho que precisa acessar os itens do pai. Em código de aplicação, imports explícitos costumam deixar as dependências mais fáceis de identificar.

## 7. Implementando a biblioteca

### 7.1 src/lib.rs: a fachada pública

Crie `src/lib.rs` com:

```rust
//! Funções para analisar textos e resumir arquivos UTF-8.

mod analise;
mod erro;
mod servico;

pub use analise::{Resumo, analisar};
pub use erro::ErroAplicacao;
pub use servico::resumir_arquivo;
```

As três declarações `mod` conectam os arquivos à crate. Os `pub use` reexportam os itens que clientes podem utilizar.

O cliente escreve `resumo_notas::analisar`, sem precisar conhecer o caminho interno `analise`. Isso permite reorganizar módulos privados preservando os caminhos públicos, desde que os contratos e itens exportados continuem compatíveis.

O comentário `//!` documenta o módulo que o contém — neste caso, a raiz da biblioteca. Comentários `///`, usados abaixo, documentam o próximo item.

### 7.2 src/analise.rs: a regra de contagem

Crie `src/analise.rs` com:

```rust
/// Estatísticas de um texto UTF-8.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Resumo {
    pub linhas: usize,
    pub palavras: usize,
    pub bytes: usize,
}

/// Analisa o conteúdo sem ler arquivos nem imprimir mensagens.
///
/// Palavras são segmentos separados por whitespace Unicode.
/// Uma quebra de linha final não cria uma linha vazia adicional.
///
/// ```
/// use resumo_notas::analisar;
///
/// let resumo = analisar("Rust\nC\n");
/// assert_eq!(resumo.linhas, 2);
/// assert_eq!(resumo.palavras, 2);
/// assert_eq!(resumo.bytes, 7);
/// ```
pub fn analisar(texto: &str) -> Resumo {
    Resumo {
        linhas: texto.lines().count(),
        palavras: texto.split_whitespace().count(),
        bytes: texto.len(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn texto_vazio_nao_tem_linhas_nem_palavras() {
        assert_eq!(analisar(""), Resumo {
            linhas: 0,
            palavras: 0,
            bytes: 0,
        });
    }

    #[test]
    fn bytes_nao_sao_a_quantidade_de_caracteres() {
        assert_eq!(analisar("ação"), Resumo {
            linhas: 1,
            palavras: 1,
            bytes: 6,
        });
    }

    #[test]
    fn preserva_linha_vazia_interna() {
        let resumo = analisar("Rust\n\nC\n");
        assert_eq!(resumo.linhas, 3);
        assert_eq!(resumo.palavras, 2);
    }
}
```

Essa função recebe um empréstimo `&str` e devolve apenas números. Ela não toma posse da string, não copia o texto e não guarda referências à entrada.

O resultado não precisa de lifetime porque possui seus próprios valores. O buffer original pode ser descartado depois da chamada sem invalidar `Resumo`.

Também há decisões de negócio, mesmo num programa tão simples:

- `bytes` mede a representação UTF-8, não caracteres percebidos pelo usuário.
- `palavras` usa espaços em branco como separadores; não é uma análise linguística.
- `linhas` segue `str::lines`, incluindo a decisão sobre uma quebra final.
- Se o arquivo for Markdown, a contagem inclui sua sintaxe; não remove código, frontmatter ou marcações.

Os campos de `Resumo` são públicos porque aqui ele é um registro de resultados sem invariantes que precisem de proteção. Um tipo como `PortaValida` ou `Saldo` poderia exigir campos privados e um construtor verificado.

### 7.3 src/erro.rs: erros com contexto

Crie `src/erro.rs` com:

```rust
use std::{error::Error, fmt, io, path::PathBuf};

#[derive(Debug)]
pub enum ErroAplicacao {
    Leitura {
        caminho: PathBuf,
        fonte: io::Error,
    },
}

impl fmt::Display for ErroAplicacao {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Leitura { caminho, fonte } => {
                write!(f, "não foi possível ler {}: {fonte}", caminho.display())
            }
        }
    }
}

impl Error for ErroAplicacao {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            Self::Leitura { fonte, .. } => Some(fonte),
        }
    }
}
```

O erro preserva o caminho envolvido e a causa original. Isso é mais útil para o usuário do que uma mensagem solta como “falha de leitura”, e mais útil para outro programa do que transformar tudo prematuramente em `String`.

O `PathBuf` possui o caminho. Assim, o erro pode ser retornado e guardado sem depender do tempo de vida do argumento original.

Esta aplicação tem uma única categoria de falha na biblioteca. Não precisamos de uma grande hierarquia de erros. Se o programa ganhar parsing ou validações, novas variantes podem expressar as diferenças que os chamadores realmente precisam tratar.

### 7.4 src/servico.rs: combinando I/O e regra

Crie `src/servico.rs` com:

```rust
use std::{fs, path::Path};

use crate::analise::{Resumo, analisar};
use crate::erro::ErroAplicacao;

pub fn resumir_arquivo(caminho: impl AsRef<Path>) -> Result<Resumo, ErroAplicacao> {
    let caminho = caminho.as_ref();

    let texto = fs::read_to_string(caminho).map_err(|fonte| {
        ErroAplicacao::Leitura {
            caminho: caminho.to_path_buf(),
            fonte,
        }
    })?;

    Ok(analisar(&texto))
}
```

Essa função coordena duas operações: ler e analisar. Ela não decide como o resultado será apresentado.

`impl AsRef<Path>` aceita diferentes valores que podem oferecer uma visão de caminho. Depois de `as_ref`, a função trabalha com `&Path`. Não exige que caminhos sejam strings UTF-8; o conteúdo do arquivo é que precisa ser UTF-8 para `read_to_string`.

`map_err` acrescenta contexto apenas se a leitura falhar. O `?` propaga a falha. Em caso de sucesso, o `String` local é emprestado para `analisar`, e o resumo numérico é retornado.

Este exemplo lê o arquivo inteiro em memória. Para arquivos muito grandes ou entrada não confiável, considere limites de tamanho ou processamento incremental. Uma versão em streaming precisaria preservar a definição da contagem quando uma palavra ou sequência UTF-8 atravessasse a fronteira entre buffers.

### 7.5 Por que não criar um trait de repositório agora

O programa lê um arquivo de texto e calcula números. Uma função pequena resolve essa operação de modo claro.

Um trait passa a fazer sentido se houver uma variação concreta: ler de um arquivo, de uma fonte remota, de um buffer fornecido pelo chamador ou de um recurso que precise ser substituído nos testes. Mesmo assim, `Read` ou `BufRead`, da biblioteca padrão, podem ser suficientes.

Separar análise de I/O já permite testar a regra com texto em memória. Testabilidade não exige, por si só, criar uma interface para cada função.

## 8. Implementando a interface de linha de comando

### 8.1 src/cli.rs: interpretar argumentos

Crie `src/cli.rs` com:

```rust
use std::{error::Error, ffi::OsString, fmt, path::PathBuf};

#[derive(Debug)]
pub(crate) struct Config {
    pub(crate) caminho: PathBuf,
}

#[derive(Debug, PartialEq, Eq)]
pub(crate) enum ErroCli {
    CaminhoAusente,
    ArgumentosEmExcesso,
}

impl fmt::Display for ErroCli {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::CaminhoAusente => {
                write!(f, "informe um arquivo; uso: resumo-notas <arquivo>")
            }
            Self::ArgumentosEmExcesso => {
                write!(f, "informe apenas um arquivo; uso: resumo-notas <arquivo>")
            }
        }
    }
}

impl Error for ErroCli {}

impl Config {
    pub(crate) fn parse<I>(argumentos: I) -> Result<Self, ErroCli>
    where
        I: IntoIterator<Item = OsString>,
    {
        let mut argumentos = argumentos.into_iter();
        let caminho = argumentos.next().ok_or(ErroCli::CaminhoAusente)?;

        if argumentos.next().is_some() {
            return Err(ErroCli::ArgumentosEmExcesso);
        }

        Ok(Self { caminho: PathBuf::from(caminho) })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aceita_um_caminho_com_espacos() {
        let config = Config::parse([OsString::from("minha nota.md")]).unwrap();
        assert_eq!(config.caminho, PathBuf::from("minha nota.md"));
    }

    #[test]
    fn rejeita_falta_de_caminho() {
        let erro = Config::parse(Vec::<OsString>::new()).unwrap_err();
        assert_eq!(erro, ErroCli::CaminhoAusente);
    }

    #[test]
    fn rejeita_mais_de_um_caminho() {
        let argumentos = [OsString::from("a.md"), OsString::from("b.md")];
        assert_eq!(
            Config::parse(argumentos).unwrap_err(),
            ErroCli::ArgumentosEmExcesso,
        );
    }
}
```

`Config::parse` recebe argumentos como dados. Ela não consulta diretamente o processo. Isso permite testar a interpretação sem alterar argumentos globais nem iniciar outro executável.

O parser aceita exatamente um caminho. Ele ainda não implementa opções como `--help`, filtros ou subcomandos. Conforme a CLI crescer, uma biblioteca especializada pode evitar trabalho repetitivo; o resto da aplicação não precisa mudar por causa dessa escolha.

Usamos `pub(crate)` porque `cli` pertence à crate executável. Os itens devem ser acessíveis ao seu `main`, mas não fazem parte de uma API externa da biblioteca.

### 8.2 src/main.rs: composição e apresentação

Substitua `src/main.rs` por:

```rust
mod cli;

use std::{env, error::Error, process::ExitCode};

use resumo_notas::resumir_arquivo;

fn executar() -> Result<(), Box<dyn Error>> {
    let config = cli::Config::parse(env::args_os().skip(1))?;
    let resumo = resumir_arquivo(&config.caminho)?;

    println!("Arquivo: {}", config.caminho.display());
    println!("Linhas: {}", resumo.linhas);
    println!("Palavras: {}", resumo.palavras);
    println!("Bytes: {}", resumo.bytes);

    Ok(())
}

fn main() -> ExitCode {
    match executar() {
        Ok(()) => ExitCode::SUCCESS,
        Err(erro) => {
            eprintln!("Erro: {erro}");
            ExitCode::FAILURE
        }
    }
}
```

O `main` decide a política de encerramento. A função `executar` liga a interface à biblioteca e apresenta o resultado.

`args_os` preserva argumentos que não podem ser representados por uma `String` UTF-8. `skip(1)` ignora o primeiro argumento, normalmente usado para identificar o executável.

Na fronteira final do programa, `Box<dyn Error>` permite propagar tanto `ErroCli` quanto `ErroAplicacao`. A biblioteca continua oferecendo um erro concreto para clientes que precisam inspecionar a falha. Para uma ferramenta que precise distinguir erro de uso, leitura e processamento por códigos de saída diferentes, a interface deve manter e tratar essas categorias explicitamente.

Repare no que não está em `main.rs`: a implementação da contagem, os detalhes de `read_to_string` e as regras de interpretação dos argumentos. Assim, é possível ler o fluxo principal sem atravessar todos os detalhes.

## 9. Executando e acompanhando o fluxo

Crie o diretório `tests/fixtures/` e o arquivo `tests/fixtures/nota.txt` em UTF-8, com quebras de linha LF e uma quebra final:

```text
Rust
Memória segura
```

Na raiz do projeto do exercício:

```sh
cargo run -- tests/fixtures/nota.txt
```

O `--` separa argumentos do Cargo dos argumentos da aplicação. A saída esperada é:

```text
Arquivo: tests/fixtures/nota.txt
Linhas: 2
Palavras: 3
Bytes: 21
```

O texto tem 21 bytes porque `ó` ocupa dois bytes em UTF-8 e há uma quebra LF depois de cada linha. Com CRLF ou sem a quebra final, a quantidade de bytes muda.

O percurso da execução é:

1. Cargo compila a biblioteca e o executável conforme necessário.
2. O processo entra em `main` e chama `executar`.
3. `Config::parse` valida a quantidade de argumentos e produz um `PathBuf`.
4. `resumir_arquivo` tenta carregar o conteúdo como texto UTF-8.
5. `analisar` recebe uma referência ao texto e produz `Resumo`.
6. O texto local é liberado; os números do resumo continuam válidos.
7. O executável imprime o resultado e termina com sucesso.

Se faltar argumento, a CLI retorna erro antes de ler um arquivo. Se o arquivo não puder ser aberto ou não contiver UTF-8 válido, a biblioteca retorna a falha com o caminho. A função de contagem não precisa conhecer nenhuma dessas situações.

Experimente:

```sh
cargo run
cargo run -- a.md b.md
cargo run -- caminho-inexistente.md
cargo run -- "minha nota.md"
```

O último comando só terá sucesso se esse arquivo existir. As aspas são interpretadas pelo shell e preservam o caminho como um único argumento.

## 10. Organização dos testes

### 10.1 Testes unitários ficam perto do comportamento

Já adicionamos testes dentro de `analise.rs` e `cli.rs`, em módulos com `#[cfg(test)]`. Essa configuração inclui o módulo no build de testes correspondente, sem incorporá-lo ao build normal da aplicação.

Por serem módulos filhos, esses testes podem acessar detalhes privados do módulo pai. Isso permite verificar uma função auxiliar sem torná-la pública apenas para o teste.

Os testes de análise não acessam disco. Os testes de argumentos não consultam os argumentos reais do processo. Essa independência vem das assinaturas que recebem dados explícitos.

### 10.2 Testes de integração usam a API pública

Crie `tests/resumo_publico.rs` com o seguinte conteúdo completo:

```rust
use std::{path::PathBuf, process::Command};

use resumo_notas::{Resumo, analisar, resumir_arquivo};

fn caminho_da_fixture() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests")
        .join("fixtures")
        .join("nota.txt")
}

#[test]
fn biblioteca_pode_ser_usada_sem_arquivos() {
    let resumo = analisar("Rust e C");
    assert_eq!(resumo, Resumo {
        linhas: 1,
        palavras: 3,
        bytes: 8,
    });
}

#[test]
fn le_arquivo_de_teste_controlado() {
    let resumo = resumir_arquivo(caminho_da_fixture()).unwrap();
    assert_eq!(resumo, Resumo {
        linhas: 2,
        palavras: 3,
        bytes: 21,
    });
}

#[test]
fn executavel_apresenta_o_resultado() {
    let resultado = Command::new(env!("CARGO_BIN_EXE_resumo-notas"))
        .arg(caminho_da_fixture())
        .output()
        .expect("deveria iniciar o executável de teste");

    assert!(resultado.status.success());
    let saida = String::from_utf8(resultado.stdout).unwrap();
    assert!(saida.contains("Linhas: 2"));
    assert!(saida.contains("Palavras: 3"));
    assert!(saida.contains("Bytes: 21"));
}

#[test]
fn executavel_sinaliza_argumento_ausente() {
    let resultado = Command::new(env!("CARGO_BIN_EXE_resumo-notas"))
        .output()
        .expect("deveria iniciar o executável de teste");

    assert!(!resultado.status.success());
    let erro = String::from_utf8(resultado.stderr).unwrap();
    assert!(erro.contains("uso: resumo-notas <arquivo>"));
}
```

O teste importa `resumo_notas`, assim como faria outro consumidor da biblioteca. Ele não acessa `crate::analise`, pois sua própria crate não é a biblioteca.

`CARGO_MANIFEST_DIR` permite localizar a fixture a partir do diretório do pacote. `CARGO_BIN_EXE_resumo-notas` fornece o executável construído pelo Cargo para esses testes, evitando presumir manualmente um caminho em `target/debug`.

O primeiro teste verifica a API em memória, o segundo atravessa a fronteira de leitura de arquivo e os dois últimos executam o programa para conferir saída e status. Cada nível responde a uma pergunta diferente.

### 10.3 Fixtures e helpers

Uma fixture é uma entrada controlada do teste. Não faça o sucesso da suíte depender de um arquivo pessoal do seu computador ou do diretório em que o comando foi iniciado.

Se vários testes de integração precisarem dos mesmos helpers, uma organização possível é:

```text
tests/
├── common/
│   └── mod.rs
├── fixtures/
│   └── nota.txt
├── resumo_publico.rs
└── erros_publicos.rs
```

Cada arquivo que usa os helpers declara `mod common;`. O arquivo em `common/mod.rs` não se torna sozinho outro alvo de teste no nível superior. Se você colocasse `tests/common.rs`, ele também seria descoberto como um alvo de integração pela convenção usual.

A diferença entre testes internos e clientes externos é descrita na documentação de [organização dos testes](https://doc.rust-lang.org/book/ch11-03-test-organization.html).

### 10.4 Documentação também pode ser verificada

O bloco de exemplo em `///` da função `analisar` é um doctest. Ele demonstra uma utilização pública e pode ser compilado e executado junto com os testes de documentação.

Mantenha esses exemplos pequenos e úteis. Um doctest bom explica como usar a API; uma suíte interna pode cobrir bordas e combinações com mais detalhe.

## 11. Exemplos, documentação e comandos

### 11.1 Um cliente em examples/

Crie `examples/analisar_texto.rs`:

```rust
use resumo_notas::analisar;

fn main() {
    let resumo = analisar("Rust\nMemória segura\n");
    println!("{resumo:#?}");
}
```

Execute com:

```sh
cargo run --example analisar_texto
```

O exemplo usa a biblioteca sem a CLI e sem a leitura de arquivo. Isso demonstra que a parte reutilizável realmente pode ser consumida por outra interface.

`examples/` não é um diretório de helpers internos da aplicação. Seus arquivos são programas de demonstração. Se dois executáveis de produção precisam da mesma regra, coloque-a na biblioteca.

### 11.2 Comandos na raiz do projeto Rust

```sh
cargo fmt
cargo check --all-targets
cargo test
cargo clippy --all-targets -- -D warnings
cargo doc --no-deps --open
cargo build --release
```

`--all-targets` amplia a verificação para alvos como testes e exemplos. `cargo test` executa a suíte e, na execução padrão deste pacote, inclui testes de documentação da biblioteca.

Para inspecionar partes específicas:

```sh
cargo test --lib
cargo test --bin resumo-notas
cargo test --test resumo_publico
cargo test --doc
cargo run --release -- tests/fixtures/nota.txt
```

`--lib` seleciona a biblioteca. `--bin` seleciona o executável. `--test` escolhe um alvo de integração, não o nome de uma pasta arbitrária. `--doc` seleciona os testes de documentação.

## 12. Privacidade e API pública

### 12.1 Público para quem?

| Declaração | Alcance pretendido |
| --- | --- |
| `fn auxiliar()` | Módulo que define o item e seus descendentes |
| `pub(super) fn auxiliar()` | Restrito ao módulo pai e ao seu contexto de visibilidade |
| `pub(crate) fn auxiliar()` | Dentro da crate atual |
| `pub fn operar()` | Pode ser exposto a outras crates por um caminho acessível |
| `pub use interno::operar;` | Oferece um caminho público alternativo para o item |

Acessar um item também depende da visibilidade do caminho até ele. No nosso exemplo, `analise` é privado, mas `analisar` é reexportado publicamente pela raiz. Consulte as regras de [visibilidade e reexportação](https://doc.rust-lang.org/reference/visibility-and-privacy.html).

### 12.2 pub(crate) não significa público para todo o pacote

Essa diferença é uma fonte frequente de dúvida:

```text
mesmo pacote
├── lib.rs  → crate da biblioteca
└── main.rs → crate do executável
```

Se uma função da biblioteca for apenas `pub(crate)`, o executável não ganha acesso a ela por compartilhar o mesmo `Cargo.toml`. O executável precisa de um caminho público da biblioteca.

No exemplo, `Config` é `pub(crate)` na crate executável e pode ser usado por seu `main`. Já `resumir_arquivo` é público e reexportado pela biblioteca para atravessar a fronteira entre crates.

### 12.3 Exponha capacidades, não toda a organização interna

É tentador corrigir qualquer dificuldade de importação tornando tudo `pub`. Isso amplia a superfície que outros clientes podem começar a usar e torna reorganizações futuras mais difíceis.

Prefira identificar o contrato de uso:

```rust
// API pública oferecida em lib.rs:
pub use analise::{Resumo, analisar};
pub use erro::ErroAplicacao;
pub use servico::resumir_arquivo;
```

Os consumidores precisam dessas operações e tipos. Eles não precisam saber quantos arquivos foram usados para implementá-los.

Uma biblioteca interna ainda não publicada também se beneficia dessa disciplina: os próprios executáveis e testes passam a revelar quando uma mudança rompe uma fronteira.

## 13. Como a estrutura cresce

### 13.1 Primeiro, dividir um módulo grande

Suponha que a análise passe a incluir palavras, títulos Markdown e blocos de código. Uma expansão possível é:

```text
src/
├── lib.rs
├── analise.rs
├── analise/
│   ├── palavras.rs
│   ├── titulos.rs
│   └── codigo.rs
├── erro.rs
├── servico.rs
├── main.rs
└── cli.rs
```

`analise.rs` coordena as partes e continua oferecendo o contrato escolhido. Os submódulos podem permanecer privados. Não é preciso criar novos pacotes só porque um arquivo ficou grande.

Uma boa separação reduz a quantidade de detalhes que você precisa entender ao alterar uma regra. Se os arquivos ficaram menores, mas cada função precisa importar dez módulos para executar uma operação simples, a divisão talvez não tenha melhorado o desenho.

### 13.2 Organizar por funcionalidade

Se a aplicação passar a importar notas, indexar conteúdo e fazer buscas, pode ser mais claro agrupar por capacidade:

```text
src/
├── lib.rs
├── notas.rs
├── notas/
│   ├── modelo.rs
│   ├── importar.rs
│   └── analisar.rs
├── busca.rs
├── busca/
│   ├── consulta.rs
│   └── indice.rs
├── armazenamento.rs
├── armazenamento/
│   └── arquivos.rs
├── main.rs
└── cli.rs
```

Essa árvore é uma proposta de evolução, não outro projeto completo fornecido aqui. Seu objetivo é mostrar que arquivos alterados pela mesma funcionalidade podem ficar próximos.

Evite uma pasta `utils` que acumule qualquer função difícil de classificar. Se uma função analisa títulos, seu nome e localização podem revelar essa responsabilidade. Utilitários realmente gerais existem, mas precisam de um contrato coerente.

### 13.3 Organizar por camadas quando houver uma necessidade concreta

Em uma aplicação maior, com regras de negócio relevantes e várias interfaces, outra opção seria:

```text
src/
├── lib.rs
├── dominio.rs
├── dominio/
│   └── nota.rs
├── aplicacao.rs
├── aplicacao/
│   └── importar_nota.rs
├── infraestrutura.rs
├── infraestrutura/
│   └── arquivos.rs
├── interface.rs
├── interface/
│   └── cli.rs
└── main.rs
```

Nesse desenho:

- `dominio` define valores e regras que não deveriam depender da forma de armazenamento.
- `aplicacao` coordena operações, como importar uma nota.
- `infraestrutura` implementa detalhes de arquivos ou outros recursos externos.
- `interface` traduz entradas e saídas da interação com o usuário.
- `main` constrói os componentes e inicia a execução.

O nome das pastas não garante essa separação. Uma função em `dominio/` que lê variáveis de ambiente e conhece detalhes de um banco continua acoplada a esses mecanismos.

Se um caso de uso precisa depender de uma capacidade substituível de armazenamento, um trait pode descrever essa capacidade, e o adaptador concreto pode implementá-lo. O `main` combina os dois. Ainda será preciso decidir quem possui os objetos, quais operações emprestam dados e onde os erros são traduzidos.

### 13.4 Onde entram ownership e lifetimes na arquitetura?

Uma fronteira também é um contrato de memória. No exemplo principal:

```text
Config possui PathBuf
       │ empresta &Path
       ▼
servico possui String temporária
       │ empresta &str
       ▼
analise devolve Resumo com números próprios
```

Essa escolha evita espalhar lifetimes pelo resultado. Se `Resumo` guardasse trechos do texto como `&str`, sua validade precisaria acompanhar a do buffer original. Isso alteraria a API e impediria retornar essas referências a partir de uma string local destruída ao final do serviço.

Por isso, a organização de módulos não deve ser separada do modelo de propriedade. Antes de adicionar `Arc`, `Mutex` ou `'static` a tudo, desenhe quem precisa manter cada recurso vivo e por quanto tempo.

## 14. Vários executáveis no mesmo pacote

Imagine que você queira um programa auxiliar que imprima o resumo de um texto fixo, reaproveitando a biblioteca. É possível adicionar:

```text
src/
├── lib.rs
├── main.rs
├── ...
└── bin/
    └── demonstrar.rs
```

Conteúdo completo de `src/bin/demonstrar.rs`:

```rust
use resumo_notas::analisar;

fn main() {
    let resumo = analisar("Uma demonstração sem leitura de arquivo.");
    println!("Palavras: {}", resumo.palavras);
}
```

Execute com:

```sh
cargo run --bin demonstrar
cargo run --bin resumo-notas -- tests/fixtures/nota.txt
```

Depois de adicionar outro executável, especifique `--bin` ou configure `default-run = "resumo-notas"` dentro de `[package]` para preservar uma escolha padrão no `cargo run`.

Cada binário tem sua própria raiz e pode usar a biblioteca. Um binário não importa o `main.rs` do outro como um conjunto de helpers.

Se um executável auxiliar precisar de módulos próprios, pode usar esta alternativa:

```text
src/bin/demonstrar/
├── main.rs
└── argumentos.rs
```

Nesse caso, declare `mod argumentos;` no `main.rs` dessa subpasta. Use essa organização no lugar de `src/bin/demonstrar.rs`, evitando definir o mesmo alvo duas vezes. As possibilidades de descoberta e configuração estão documentadas em [Cargo Targets](https://doc.rust-lang.org/cargo/reference/cargo-targets.html).

## 15. Quando usar um workspace

Um workspace é útil quando você precisa de **vários pacotes** relacionados. Exemplos: uma biblioteca usada por mais de uma aplicação, componentes com conjuntos diferentes de dependências ou artefatos que precisam ser distribuídos separadamente.

Não há um número de linhas que obrigue a migração. Um pacote com biblioteca, alguns executáveis e módulos bem definidos pode permanecer adequado por bastante tempo.

### 15.1 Um workspace mínimo completo

O exemplo a seguir é independente de `resumo-notas`. Crie outro diretório com esta estrutura:

```text
estudos-workspace/
├── Cargo.toml
├── Cargo.lock                 ← gerado na raiz
├── crates/
│   ├── analise-core/
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   └── resumo-cli/
│       ├── Cargo.toml
│       └── src/
│           └── main.rs
└── target/                    ← compartilhado por padrão
```

O `Cargo.toml` da raiz:

```toml
[workspace]
members = ["crates/analise-core", "crates/resumo-cli"]
resolver = "3"

[workspace.package]
version = "0.1.0"
edition = "2024"
```

Essa raiz tem um manifesto virtual: não há uma seção `[package]`, portanto ela não define um pacote próprio. O resolver é explícito porque um workspace virtual não tem uma edição de pacote raiz da qual inferi-lo.

`crates/analise-core/Cargo.toml`:

```toml
[package]
name = "analise-core"
version.workspace = true
edition.workspace = true
```

`crates/analise-core/src/lib.rs`:

```rust
pub fn contar_palavras(texto: &str) -> usize {
    texto.split_whitespace().count()
}
```

`crates/resumo-cli/Cargo.toml`:

```toml
[package]
name = "resumo-cli"
version.workspace = true
edition.workspace = true

[dependencies]
analise-core = { path = "../analise-core" }
```

`crates/resumo-cli/src/main.rs`:

```rust
use analise_core::contar_palavras;

fn main() {
    println!("Palavras: {}", contar_palavras("Rust com Cargo"));
}
```

Na raiz do workspace:

```sh
cargo check --workspace
cargo test --workspace
cargo run -p resumo-cli
```

O programa imprime `Palavras: 3`. `-p` seleciona um pacote; `--bin` seleciona um alvo binário. São seleções diferentes, embora às vezes seus nomes coincidam.

### 15.2 Compartilhar o workspace não cria dependências implícitas

Os dois pacotes serem membros do mesmo workspace não torna toda função de um automaticamente acessível ao outro. A dependência `path` no manifesto de `resumo-cli` é o que declara essa relação.

O caminho é relativo ao manifesto do pacote dependente. Por isso usamos `../analise-core`, e não um caminho pessoal absoluto.

Membros compartilham normalmente o lockfile e o diretório de artefatos da raiz. Metadados declarados em `[workspace.package]` precisam ser adotados pelos membros com `workspace = true`. As regras são detalhadas na documentação de [workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html).

### 15.3 O custo de dividir em crates

Cada crate adicional cria outra fronteira pública, outro manifesto e outra relação de dependência a manter. Módulos permitem organização interna sem assumir imediatamente esses custos.

Prefira uma nova crate quando a fronteira ajuda de verdade: reutilização independente, distribuição, conjunto de dependências, integração com outra linguagem ou um contrato que merece isolamento. Não crie ciclos entre bibliotecas tentando reproduzir referências circulares do domínio no grafo de dependências de produção.

## 16. Configuração, dependências e arquivos auxiliares

### 16.1 Três tipos de configuração que não devem ser confundidos

| Arquivo ou mecanismo | Configura o quê? |
| --- | --- |
| `Cargo.toml` | Pacote, dependências, alvos, features e perfis |
| `.cargo/config.toml` | Comportamento do Cargo, como aliases e configuração de alvos |
| Argumentos, ambiente ou arquivo próprio | Comportamento da aplicação em execução |

Um arquivo chamado `config.toml` não é carregado automaticamente pelo seu programa. A aplicação precisa implementar ou utilizar uma biblioteca que faça a leitura e validação.

Da mesma forma, Cargo não carrega automaticamente um `.env` como configuração da sua aplicação. Isso precisa fazer parte do código ou do ambiente de execução escolhido.

### 16.2 Configuração de execução deve ter uma fronteira clara

No exemplo principal, `Config` contém apenas um caminho vindo da CLI. Se houver também arquivo de configuração e variáveis de ambiente, defina uma precedência, por exemplo:

```text
valores padrão < arquivo de configuração < ambiente < argumentos da CLI
```

Essa ordem é uma decisão da sua aplicação, não uma regra universal de Rust. Resolva e valide a configuração na entrada; depois passe uma estrutura tipada para as operações que precisam dela.

Evite fazer cada função consultar novamente o ambiente. Isso dificulta explicar qual configuração está em vigor e pode prejudicar a independência dos testes.

### 16.3 Categorias de dependências

| Seção do manifesto | Uso |
| --- | --- |
| `[dependencies]` | Dependências normais da biblioteca ou executável |
| `[dev-dependencies]` | Apoio a testes, exemplos e benchmarks |
| `[build-dependencies]` | Dependências do script de build |

Adicione uma dependência onde ela é necessária. Uma biblioteca usada apenas para criar diretórios temporários em testes não precisa ser dependência normal da aplicação.

Requisitos de versão no manifesto descrevem intervalos de versões conforme as regras do Cargo; não são sempre uma igualdade exata. A resolução escolhida é registrada no lockfile. Para requisitos específicos, consulte [Specifying Dependencies](https://doc.rust-lang.org/cargo/reference/specifying-dependencies.html).

### 16.4 .cargo/config.toml

Um uso opcional para o projeto do exercício seria:

```toml
[alias]
verificar = "check --all-targets"
```

Salvo em `.cargo/config.toml`, isso permite executar `cargo verificar`. Não altera a lógica do programa e não substitui configuração de runtime. As opções e sua hierarquia são descritas na [configuração do Cargo](https://doc.rust-lang.org/cargo/reference/config.html).

### 16.5 build.rs

`build.rs`, na raiz de um pacote, serve a tarefas de compilação específicas, como integração com bibliotecas nativas ou geração de código necessária ao build. Ele é compilado e executado no ambiente de build; não é uma função de inicialização do programa final.

Não é necessário para declarar módulos, ler argumentos ou iniciar a aplicação desta aula. Se a necessidade surgir, considere entradas, saídas e condições de reexecução para preservar builds previsíveis. Consulte [Build Scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

### 16.6 Outros diretórios possíveis

| Caminho | Quando faz sentido |
| --- | --- |
| `benches/` | Benchmarks com uma estratégia de medição definida |
| `docs/` | Documentação de arquitetura e uso |
| `scripts/` | Automação de desenvolvimento que não pertence ao programa |
| `.github/workflows/` | CI quando o projeto usa GitHub Actions |
| `assets/` | Recursos usados pela aplicação, com carregamento definido no código |

Não crie diretórios vazios só para reproduzir uma árvore “profissional”. Adicione cada parte quando conseguir explicar quem a usa e como ela é verificada.

## 17. Comparação com a organização de um projeto C

| Organização frequente em C | Ideia relacionada em Rust | Diferença importante |
| --- | --- | --- |
| Arquivos `.c` como unidades de tradução | Crates como unidades de compilação | Um módulo `.rs` comum não é uma crate por si só |
| Headers `.h` com declarações públicas | Itens `pub` e reexportações | Não é necessário manter um header Rust separado das definições |
| `#include` | Não há equivalência direta com `mod` | `mod` declara um nó da árvore; `use` traz nomes ao escopo |
| Biblioteca estática ou dinâmica | Crate de biblioteca com tipo de artefato apropriado | FFI C exige ABI e representação explícitas |
| `Makefile` ou configuração de build | Manifesto e comandos do Cargo | Cargo conhece convenções para alvos e dependências |
| Função interna ao arquivo com `static` | Item privado ao módulo e seus descendentes | A fronteira é o módulo, não apenas o arquivo físico |
| `main.c` | `src/main.rs` | A lógica reutilizável pode ficar em `src/lib.rs` e seus módulos |
| Pasta de testes com executáveis próprios | Alvos de integração em `tests/` | Eles consomem a API como outras crates |

Uma comparação útil é pensar no sistema de módulos como uma organização explícita de nomes e permissões. O linker continua existindo, mas você não precisa usar convenções de nome e headers como único mecanismo para comunicar quais partes pertencem a uma API.

Ao integrar com C, a fronteira muda: um `pub fn` Rust não vira automaticamente uma função chamável com a ABI C. Esse assunto envolve `extern "C"`, símbolos exportados, tipos compatíveis e ownership dos recursos, como explicado na nota de introdução.

### Erros comuns ao organizar os primeiros projetos

**Criar o arquivo e esquecer `mod`.** O arquivo existe no disco, mas não entrou na árvore de módulos.

**Confundir `use` com inclusão.** O caminho só funciona se o módulo ou a crate estiver disponível e o item for acessível.

**Declarar os mesmos módulos em `lib.rs` e `main.rs`.** Isso cria árvores separadas; importe a biblioteca quando quiser reutilizá-la.

**Usar `pub(crate)` esperando acesso pelo binário.** O pacote pode conter mais de uma crate; a permissão não atravessa essa fronteira.

**Misturar saída de terminal com regra de negócio.** Isso dificulta reutilizar a função em outra interface e testar seu resultado sem capturar saída.

**Criar abstrações antes das variações.** Um trait com uma implementação trivial e nenhum requisito de substituição pode apenas aumentar o trabalho de leitura.

**Expor todos os módulos internos.** Clientes passam a depender do arranjo físico, tornando refatorações mais custosas.

**Usar caminhos pessoais nos testes.** A suíte deixa de funcionar em outro computador ou na integração contínua.

## 18. Exercícios e roteiro de revisão

### Exercício 1 — Adicionar uma estatística

Acrescente a quantidade de linhas não vazias ao `Resumo`. Defina se uma linha contendo apenas espaços é vazia. Atualize análise, apresentação, testes e documentação pública.

Observe os arquivos que precisaram mudar. Eles correspondem à regra, ao contrato de saída e à apresentação, ou houve mudanças em partes sem relação com o requisito?

### Exercício 2 — Outra apresentação

Adicione um segundo binário que apresente as mesmas estatísticas em uma linha separada por tabulações. Reutilize a biblioteca sem declarar novamente `mod analise`.

Decida se o parser de argumentos deve continuar privado a cada binário ou se existe lógica de interface suficiente em comum para extrair outra parte. Não coloque regras específicas do terminal no módulo que apenas conta palavras.

### Exercício 3 — Entrada em memória e entrada em arquivo

Crie mais um exemplo em `examples/` usando uma string construída dinamicamente. Mostre que `Resumo` continua utilizável depois que a string sai do escopo.

Explique por que isso é permitido com campos numéricos e o que mudaria se o resumo guardasse referências a palavras do texto.

### Exercício 4 — Erro de conteúdo

Adicione uma fixture binária com UTF-8 inválido e um teste que confirme a falha de `resumir_arquivo`. Não dependa da mensagem exata do sistema operacional; inspecione a variante e, quando apropriado, o tipo da causa.

### Exercício 5 — Extração para outro pacote

Quando o exemplo estiver claro, separe a análise em uma biblioteca local de um workspace. Mantenha a CLI como outro pacote e declare a dependência por caminho relativo.

Confira se a biblioteca consegue ser verificada sem carregar dependências exclusivas da interface. Essa é uma fronteira mais significativa do que simplesmente ter colocado o código em outra pasta.

### Roteiro para revisar qualquer projeto Rust

1. Localize os `Cargo.toml` e descubra se há um pacote ou um workspace.
2. Identifique os alvos de biblioteca, executáveis, testes e exemplos.
3. Leia as raízes `lib.rs` e `main.rs` para entender as árvores de módulos.
4. Observe o que é reexportado como API e o que permanece interno.
5. Siga uma operação real desde a entrada até a saída.
6. Desenhe quem possui os buffers, configurações e recursos.
7. Localize onde os erros ganham contexto e onde viram mensagens ao usuário.
8. Confira quais testes verificam regras, fronteiras e execução completa.
9. Avalie se as dependências entre módulos correspondem às responsabilidades descritas.

## 19. Referências

- [Layout de pacotes no Cargo](https://doc.rust-lang.org/cargo/guide/project-layout.html): convenções de diretórios e arquivos.
- [Pacotes e crates](https://doc.rust-lang.org/book/ch07-01-packages-and-crates.html): fronteiras de compilação e manifesto.
- [Módulos em arquivos separados](https://doc.rust-lang.org/book/ch07-05-separating-modules-into-different-files.html): declaração e localização dos módulos.
- [Visibilidade e privacidade](https://doc.rust-lang.org/reference/visibility-and-privacy.html): caminhos públicos e permissões internas.
- [Organização dos testes](https://doc.rust-lang.org/book/ch11-03-test-organization.html): testes unitários e de integração.
- [Cargo Targets](https://doc.rust-lang.org/cargo/reference/cargo-targets.html): bibliotecas, binários, exemplos e outros alvos.
- [Workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html): coordenação de vários pacotes.

Para rever ownership, lifetimes, traits e os contratos usados nos exemplos, volte a [[Rust/Introdução|Introdução ao Rust]].
