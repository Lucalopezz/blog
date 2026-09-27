# Construindo um grep em Rust

Nesta aula vamos construir uma ferramenta de busca textual de linha de comando. O objetivo é aplicar [[Rust/Ownership e borrowing na prática|ownership e borrowing]] e [[Rust/Lifetimes|lifetimes]] em um programa completo, incluindo argumentos, arquivos, entrada padrão, saída e testes.

O nome do exercício será `mini-grep`. É uma ferramenta didática com um contrato próprio, não uma implementação compatível com todas as opções e regras do GNU grep. A organização segue as ideias da nota [[Rust/estrutura|Estrutura de uma aplicação em Rust]].

> [!note] Ambiente do exercício
> Crie o projeto em um diretório de estudo separado do site de notas. Os arquivos completos abaixo pertencem ao mesmo pacote Cargo, com edition 2024 e sem dependências externas. Os blocos de demonstração anteriores à implementação servem para explicar as decisões; copie como projeto final apenas os arquivos explicitamente identificados.

## Sumário

1. [Definindo o comportamento](#1-definindo-o-comportamento)
2. [Primeiro modelo: resultados emprestados](#2-primeiro-modelo-resultados-emprestados)
3. [Segundo modelo: processar uma linha por vez](#3-segundo-modelo-processar-uma-linha-por-vez)
4. [Estrutura do projeto](#4-estrutura-do-projeto)
5. [Biblioteca de busca completa](#5-biblioteca-de-busca-completa)
6. [Entendendo os contratos da biblioteca](#6-entendendo-os-contratos-da-biblioteca)
7. [Interpretando argumentos](#7-interpretando-argumentos)
8. [O executável e os recursos de I/O](#8-o-executável-e-os-recursos-de-io)
9. [Testando a biblioteca](#9-testando-a-biblioteca)
10. [Testando o programa completo](#10-testando-o-programa-completo)
11. [Executando exemplos reais](#11-executando-exemplos-reais)
12. [Memória, desempenho e limites](#12-memória-desempenho-e-limites)
13. [Evoluções e exercícios](#13-evoluções-e-exercícios)
14. [Revisão e referências](#14-revisão-e-referências)

## 1. Definindo o comportamento

Antes do código, fixe o contrato:

```text
mini-grep [-n] [-i] [--] <padrao> <arquivo|->
mini-grep --help
```

| Entrada ou opção | Comportamento |
| --- | --- |
| `padrao` | Substring literal UTF-8, sem expressões regulares |
| `arquivo` | Caminho do arquivo a ler como UTF-8 |
| `-` na posição do arquivo | Ler a entrada padrão |
| `-n` | Antepor número da linha e `:` |
| `-i` | Ignorar diferenças entre maiúsculas e minúsculas **somente em ASCII** |
| `--` antes do padrão | Encerrar interpretação de opções |
| `--help` sozinho | Mostrar ajuda |

As opções precisam aparecer antes do padrão. Depois do primeiro argumento posicional, os demais são tratados como posicionais. Não implementaremos agrupamento como `-ni`; use `-n -i`.

O padrão vazio seleciona toda linha existente. Um arquivo vazio continua tendo zero linhas. Padrões com `\n` ou `\r` são rejeitados pela CLI, pois a busca foi definida por linha.

A saída contém uma linha por linha selecionada, mesmo se a substring aparecer várias vezes nela. Os números começam em 1 e contam todas as linhas de entrada, inclusive as não selecionadas.

Usaremos estes códigos de saída:

| Código | Significado |
| --- | --- |
| `0` | Houve correspondência, ou a ajuda foi exibida com sucesso |
| `1` | A busca terminou corretamente, mas não encontrou linhas |
| `2` | Argumentos inválidos ou falha de leitura/escrita |

Esse contrato ajuda a usar a ferramenta em scripts. “Nenhuma ocorrência” é um resultado válido da busca, mas possui um código diferente de “encontrou”.

## 2. Primeiro modelo: resultados emprestados

Se o texto já está em memória, podemos devolver slices das linhas encontradas:

```rust
fn buscar<'a>(padrao: &str, texto: &'a str) -> Vec<&'a str> {
    texto.lines().filter(|linha| linha.contains(padrao)).collect()
}

fn main() {
    let texto = String::from("Rust\nC\nRust e C");
    let encontrados = buscar("Rust", &texto);
    assert_eq!(encontrados, ["Rust", "Rust e C"]);
}
```

`texto` possui os bytes. O vetor possui apenas referências às linhas. A saída depende da lifetime do texto, enquanto o padrão só precisa existir durante a chamada.

Essa versão é apropriada quando você quer continuar consultando os resultados e já tem o documento inteiro disponível. Ela não lê arquivos e não imprime: sua responsabilidade é selecionar.

Não tente colocar `read_to_string` dentro dessa função e devolver referências à string local. Nesse desenho, os bytes seriam liberados antes de o chamador usar os resultados. O chamador precisa possuir o buffer, ou a função deve devolver dados possuídos.

## 3. Segundo modelo: processar uma linha por vez

Uma ferramenta de terminal normalmente pode emitir cada resultado imediatamente. Não precisa guardar todas as linhas encontradas.

```text
arquivo ou stdin
       │ leitura bufferizada
       ▼
String reutilizada para uma linha
       │ empréstimo para comparação
       ▼
corresponde? ── sim ──► escrever resultado
       │
       ▼
terminar os usos da linha → clear → próxima leitura
```

O buffer só é alterado novamente depois que as referências necessárias à comparação e à escrita terminam de ser usadas. `clear` zera o comprimento da string, preservando sua capacidade para reutilização.

Por que não devolver um `Vec<&str>` apontando para esse buffer? Porque a leitura seguinte modifica ou substitui os bytes das referências anteriores. Para guardar todas as linhas nesse modelo, precisaríamos copiá-las para armazenamento próprio ou adotar outra estratégia de buffers.

Nossa biblioteca oferecerá as duas formas: uma função sobre texto já carregado e uma função que filtra um `BufRead` para um `Write`. A CLI usará a segunda.

## 4. Estrutura do projeto

Crie o pacote:

```sh
cargo new mini-grep --bin --edition 2024
cd mini-grep
```

Ao terminar, teremos:

```text
mini-grep/
├── Cargo.toml
├── Cargo.lock
├── src/
│   ├── lib.rs
│   ├── cli.rs
│   └── main.rs
└── tests/
    ├── busca.rs
    ├── programa.rs
    └── fixtures/
        └── notas.txt
```

O `Cargo.toml` completo:

```toml
[package]
name = "mini-grep"
version = "0.1.0"
edition = "2024"

[dependencies]
```

O nome da biblioteca nos imports será `mini_grep`, enquanto o executável mantém `mini-grep`. Mantenha `Cargo.lock` versionado no exercício e ignore `target/` no Git.

## 5. Biblioteca de busca completa

Coloque todo o bloco abaixo em `src/lib.rs`:

```rust
use std::io::{self, BufRead, Write};

#[derive(Debug, Clone, Copy, Default)]
pub struct Opcoes {
    pub numerar: bool,
    pub ignorar_caixa_ascii: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Correspondencia<'a> {
    pub numero: usize,
    pub texto: &'a str,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct Relatorio {
    pub linhas_lidas: usize,
    pub linhas_encontradas: usize,
}

/// Busca uma substring literal. O modo insensível trata apenas ASCII.
pub fn contem(linha: &str, padrao: &str, ignorar_caixa_ascii: bool) -> bool {
    if !ignorar_caixa_ascii {
        return linha.contains(padrao);
    }

    let padrao = padrao.as_bytes();
    if padrao.is_empty() {
        return true;
    }

    linha.as_bytes()
        .windows(padrao.len())
        .any(|janela| janela.eq_ignore_ascii_case(padrao))
}

/// Devolve referências às linhas do texto original.
pub fn buscar<'a>(
    texto: &'a str,
    padrao: &str,
    ignorar_caixa_ascii: bool,
) -> Vec<Correspondencia<'a>> {
    texto.lines()
        .enumerate()
        .filter(|(_, linha)| contem(linha, padrao, ignorar_caixa_ascii))
        .map(|(indice, texto)| Correspondencia { numero: indice + 1, texto })
        .collect()
}

/// Filtra linhas UTF-8, normalizando os terminadores de saída para LF.
/// Retorna falhas de leitura, escrita e flush ao chamador.
pub fn filtrar<R: BufRead, W: Write>(
    mut leitor: R,
    mut saida: W,
    padrao: &str,
    opcoes: Opcoes,
) -> io::Result<Relatorio> {
    let mut linha = String::new();
    let mut relatorio = Relatorio::default();

    loop {
        linha.clear();
        if leitor.read_line(&mut linha)? == 0 {
            break;
        }

        relatorio.linhas_lidas = relatorio.linhas_lidas.checked_add(1)
            .ok_or_else(|| io::Error::other("contador de linhas excedeu o limite"))?;

        // Remove LF e o CR que faz parte de CRLF. Um CR isolado é conteúdo.
        if linha.ends_with('\n') {
            linha.pop();
            if linha.ends_with('\r') {
                linha.pop();
            }
        }

        if contem(&linha, padrao, opcoes.ignorar_caixa_ascii) {
            if opcoes.numerar {
                writeln!(saida, "{}:{}", relatorio.linhas_lidas, linha)?;
            } else {
                writeln!(saida, "{linha}")?;
            }
            relatorio.linhas_encontradas += 1;
        }
    }

    saida.flush()?;
    Ok(relatorio)
}
```

Esse arquivo não conhece argumentos de processo, caminhos específicos nem stdout. Pode ser usado com arquivos, memória ou outras implementações dos traits.

## 6. Entendendo os contratos da biblioteca

### 6.1 Comparação sem alocar uma versão minúscula da linha

No modo sensível à caixa, usamos `str::contains`. No modo ASCII, percorremos janelas de bytes do tamanho do padrão e comparamos sem distinguir letras ASCII maiúsculas e minúsculas.

O tratamento do padrão vazio ocorre antes de `windows`, pois uma janela de tamanho zero não é permitida por essa API. Padrões maiores que a linha simplesmente não produzem janelas candidatas.

Esse algoritmo didático pode fazer trabalho proporcional ao produto do tamanho da linha pelo tamanho do padrão. Não representa o melhor algoritmo possível para todos os workloads. Ele evita criar uma string minúscula para cada linha e mantém explícita a regra de comparação.

`-i` permite que `Rust`, `RUST` e `rust` correspondam. Não equipara `AÇÃO` a `ação`, porque a diferença entre `Ç` e `ç`, por exemplo, não pertence a ASCII. A busca sensível continua aceitando texto Unicode normalmente; apenas compara seus bytes de forma exata. Não implementamos normalização nem case folding Unicode.

### 6.2 O empréstimo no resultado

Em `buscar`, `Correspondencia<'a>` guarda número e visão da linha. A lifetime se relaciona somente a `texto`, pois nenhum resultado guarda a consulta.

Em `filtrar`, não devolvemos uma referência ao buffer. `Relatorio` possui apenas contadores, então continua válido após destruir a string de trabalho e fechar a entrada.

### 6.3 Por que read_line e clear aparecem juntos

`read_line` acrescenta conteúdo ao buffer recebido. Se você esquecer `clear`, o texto de uma leitura anterior pode continuar nele. O retorno zero indica EOF; uma linha em branco com `\n` não é EOF.

Uma última linha sem quebra final ainda é processada. Uma quebra final não gera uma linha fantasma depois dela. Entrada inválida em UTF-8 provoca erro porque escolhemos trabalhar com `String`. Esses comportamentos fazem parte do contrato de [BufRead::read_line](https://doc.rust-lang.org/std/io/trait.BufRead.html#method.read_line).

Não usamos `trim`: ele removeria espaços que pertencem ao conteúdo e alteraria o resultado da busca. Removemos apenas LF ou o par CRLF para padronizar a apresentação. Um `\r` isolado permanece no conteúdo.

### 6.4 Ownership dos leitores e escritores

`filtrar` recebe `R` e `W` por valor. Se você passar um `BufReader<File>`, ele será movido para a chamada. Também é possível passar `&mut leitor` ou `&mut saida` quando essas referências implementam os traits requeridos; os testes usam essa opção para observar um vetor de saída depois da chamada.

`R: BufRead` e `W: Write` permitem monomorfização para as implementações utilizadas. Não precisamos de `Box<dyn ...>` nem de um trait próprio de repositório para testar o filtro em memória.

### 6.5 Erros na saída também são erros do programa

`writeln!` devolve um resultado que precisa ser tratado. Quando há bufferização, parte do erro pode aparecer somente em `flush`. Por isso o caminho de sucesso chama `flush` explicitamente, antes de devolver `Ok`.

Depender apenas da destruição de um `BufWriter` não permite tratar todos esses erros: falhas durante o flush feito em sua destruição são ignoradas pela API. [Documentação de BufWriter](https://doc.rust-lang.org/std/io/struct.BufWriter.html).

Uma falha depois de algumas linhas não desfaz as linhas já escritas. O filtro é incremental, não transacional. A CLI retornará código 2 mesmo que parte do resultado já tenha sido emitida.

`linhas_encontradas` nunca supera `linhas_lidas`: há no máximo um incremento por linha, depois que o contador de leitura foi incrementado com verificação. Essa invariável justifica o incremento simples do contador de correspondências.

## 7. Interpretando argumentos

Coloque este arquivo completo em `src/cli.rs`:

```rust
use std::{ffi::OsString, path::PathBuf};

use mini_grep::Opcoes;

pub(crate) const USO: &str = "Uso: mini-grep [-n] [-i] [--] <padrao> <arquivo|->
       mini-grep --help

-n  mostra o número da linha
-i  ignora caixa somente em ASCII
-   na posição de arquivo, lê stdin
As opções devem vir antes do padrão.";

#[derive(Debug)]
pub(crate) enum Origem {
    Arquivo(PathBuf),
    EntradaPadrao,
}

#[derive(Debug)]
pub(crate) struct Config {
    pub(crate) padrao: String,
    pub(crate) origem: Origem,
    pub(crate) opcoes: Opcoes,
}

#[derive(Debug)]
pub(crate) enum Comando {
    Ajuda,
    Buscar(Config),
}

pub(crate) fn parse<I>(argumentos: I) -> Result<Comando, String>
where
    I: IntoIterator<Item = OsString>,
{
    let argumentos: Vec<_> = argumentos.into_iter().collect();
    if argumentos.len() == 1 && argumentos[0] == "--help" {
        return Ok(Comando::Ajuda);
    }

    let mut opcoes = Opcoes::default();
    let mut ler_opcoes = true;
    let mut posicionais = Vec::new();

    for argumento in argumentos {
        if ler_opcoes {
            if argumento == "--" {
                ler_opcoes = false;
                continue;
            }
            if argumento == "-n" {
                opcoes.numerar = true;
                continue;
            }
            if argumento == "-i" {
                opcoes.ignorar_caixa_ascii = true;
                continue;
            }
            if argumento != "-"
                && argumento.to_str().is_some_and(|valor| valor.starts_with('-'))
            {
                return Err(format!("opção desconhecida: {}", argumento.to_string_lossy()));
            }
        }

        ler_opcoes = false;
        posicionais.push(argumento);
    }

    let mut posicionais = posicionais.into_iter();
    let padrao = posicionais.next().ok_or("informe um padrão".to_owned())?;
    let arquivo = posicionais.next().ok_or("informe um arquivo ou -".to_owned())?;
    if posicionais.next().is_some() {
        return Err("informe apenas um padrão e uma origem".into());
    }

    let padrao = padrao.into_string()
        .map_err(|_| "o padrão precisa ser UTF-8 válido".to_owned())?;

    if padrao.contains('\n') || padrao.contains('\r') {
        return Err("o padrão não pode conter quebras de linha".into());
    }

    let origem = if arquivo == "-" {
        Origem::EntradaPadrao
    } else {
        Origem::Arquivo(PathBuf::from(arquivo))
    };

    Ok(Comando::Buscar(Config { padrao, origem, opcoes }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argumentos(valores: &[&str]) -> Vec<OsString> {
        valores.iter().map(|valor| OsString::from(*valor)).collect()
    }

    #[test]
    fn aceita_opcoes_e_entrada_padrao() {
        let comando = parse(argumentos(&["-n", "-i", "Rust", "-"])).unwrap();
        let Comando::Buscar(config) = comando else {
            panic!("esperava uma busca");
        };
        assert!(config.opcoes.numerar);
        assert!(config.opcoes.ignorar_caixa_ascii);
        assert!(matches!(config.origem, Origem::EntradaPadrao));
        assert_eq!(config.padrao, "Rust");
    }

    #[test]
    fn terminador_permite_padrao_com_hifen() {
        let comando = parse(argumentos(&["--", "-i", "nota.txt"])).unwrap();
        let Comando::Buscar(config) = comando else {
            panic!("esperava uma busca");
        };
        assert_eq!(config.padrao, "-i");
        assert!(!config.opcoes.ignorar_caixa_ascii);
    }

    #[test]
    fn rejeita_entradas_invalidas() {
        for valores in [
            vec![],
            vec!["Rust"],
            vec!["Rust", "a", "b"],
            vec!["-x", "Rust", "a"],
            vec!["a\nb", "a"],
        ] {
            assert!(parse(argumentos(&valores)).is_err());
        }
    }

    #[test]
    fn ajuda_nao_exige_arquivo() {
        assert!(matches!(parse(argumentos(&["--help"])), Ok(Comando::Ajuda)));
    }
}
```

### Por que OsString nos argumentos e String no padrão?

Um caminho do sistema operacional não precisa ser UTF-8. `args_os` e `PathBuf` preservam essa possibilidade. Já nossa operação de busca exige texto UTF-8; converter o padrão para `String` valida esse contrato.

A configuração possui o padrão e o caminho. Não devolvemos referências a strings dentro de um vetor local de argumentos. Isso permite que `Config` sobreviva ao parser sem lifetimes adicionais.

`to_string_lossy` só é usado para apresentar um argumento inválido na mensagem de erro; ele não altera o caminho usado para abrir arquivos.

O parser recebe uma coleção de argumentos em vez de consultar o processo diretamente. Os testes conseguem fornecer listas controladas. Os `unwrap` e `panic!` desse arquivo ficam nos testes, onde falhas devem interromper o caso verificado.

## 8. O executável e os recursos de I/O

Coloque o código completo em `src/main.rs`:

```rust
mod cli;

use std::{
    env,
    fmt::Display,
    fs::File,
    io::{self, BufReader, BufWriter, Write},
    process::ExitCode,
};

use cli::{Comando, Config, Origem};
use mini_grep::{Relatorio, filtrar};

fn executar(config: &Config) -> io::Result<Relatorio> {
    let stdout = io::stdout();
    let saida = BufWriter::new(stdout.lock());

    match &config.origem {
        Origem::Arquivo(caminho) => {
            let arquivo = File::open(caminho)?;
            filtrar(BufReader::new(arquivo), saida, &config.padrao, config.opcoes)
        }
        Origem::EntradaPadrao => {
            let stdin = io::stdin();
            filtrar(stdin.lock(), saida, &config.padrao, config.opcoes)
        }
    }
}

fn falhar(mensagem: impl Display) -> ExitCode {
    // Se até stderr falhar, ainda preservamos o status de erro.
    let _ = writeln!(io::stderr().lock(), "Erro: {mensagem}");
    ExitCode::from(2)
}

fn main() -> ExitCode {
    let comando = match cli::parse(env::args_os().skip(1)) {
        Ok(comando) => comando,
        Err(erro) => return falhar(format!("{erro}\n{}", cli::USO)),
    };

    match comando {
        Comando::Ajuda => {
            let mut saida = io::stdout().lock();
            let resultado = writeln!(saida, "{}", cli::USO)
                .and_then(|()| saida.flush());
            match resultado {
                Ok(()) => ExitCode::SUCCESS,
                Err(erro) => falhar(erro),
            }
        }
        Comando::Buscar(config) => match executar(&config) {
            Ok(relatorio) if relatorio.linhas_encontradas > 0 => ExitCode::SUCCESS,
            Ok(_) => ExitCode::from(1),
            Err(erro) => match &config.origem {
                Origem::Arquivo(caminho) => {
                    falhar(format!("ao processar {}: {erro}", caminho.display()))
                }
                Origem::EntradaPadrao => falhar(format!("no fluxo de stdin/saída: {erro}")),
            },
        },
    }
}
```

`main` escolhe códigos de saída e mensagens. A biblioteca não encerra o processo nem decide como reportar a falha ao usuário.

`File` possui o recurso aberto. `BufReader` reduz a necessidade de pequenas leituras ao sistema operacional. `stdin.lock()` já fornece leitura bufferizada. `stdout.lock()` evita adquirir novamente o lock a cada chamada, e `BufWriter` agrupa as escritas.

`executar` empresta a configuração, move os wrappers para `filtrar` e devolve somente os contadores. Os recursos locais são liberados quando seus proprietários saem do escopo.

Este programa considera erro de pipe quebrado uma falha de saída e devolve 2. Ferramentas Unix podem adotar políticas diferentes para pipelines interrompidos; aqui a escolha é explícita e coberta pelo mecanismo de propagação de I/O. Retornar `ExitCode` permite escolher o status do processo sem recorrer a `process::exit` no meio da lógica. [Documentação de ExitCode](https://doc.rust-lang.org/std/process/struct.ExitCode.html).

## 9. Testando a biblioteca

Crie `tests/busca.rs` com todo o conteúdo abaixo:

```rust
use std::io::{self, Cursor, Write};

use mini_grep::{Opcoes, Relatorio, buscar, contem, filtrar};

fn rodar(entrada: &[u8], padrao: &str, opcoes: Opcoes) -> (Relatorio, String) {
    let mut saida = Vec::new();
    let relatorio = filtrar(Cursor::new(entrada), &mut saida, padrao, opcoes).unwrap();
    (relatorio, String::from_utf8(saida).unwrap())
}

#[test]
fn busca_literal_nao_interpreta_regex() {
    assert!(contem("a.b", ".", false));
    assert!(!contem("abc", ".", false));
    assert!(!contem("Rust", "rust", false));
    assert!(contem("Rust", "rust", true));
}

#[test]
fn modo_ascii_nao_promete_case_folding_unicode() {
    assert!(contem("AÇÃO", "AÇÃO", false));
    assert!(!contem("AÇÃO", "ação", true));
    assert!(!contem("x", "padrão maior", true));
}

#[test]
fn busca_em_memoria_empresta_o_texto_e_nao_a_consulta() {
    let texto = String::from("C\nRust\nGo");
    let resultados = {
        let consulta = String::from("Rust");
        buscar(&texto, &consulta, false)
    };
    assert_eq!(resultados.len(), 1);
    assert_eq!(resultados[0].numero, 2);
    assert_eq!(resultados[0].texto, "Rust");
    assert_eq!(resultados[0].texto.as_ptr(), texto[2..6].as_ptr());
}

#[test]
fn numera_e_processa_ultima_linha_sem_quebra() {
    let opcoes = Opcoes { numerar: true, ignorar_caixa_ascii: true };
    let (relatorio, saida) = rodar(b"Rust\r\nRUST\n\nRust", "rust", opcoes);
    assert_eq!(relatorio, Relatorio { linhas_lidas: 4, linhas_encontradas: 3 });
    assert_eq!(saida, "1:Rust\n2:RUST\n4:Rust\n");
}

#[test]
fn padrao_vazio_seleciona_linhas_existentes() {
    let (relatorio, saida) = rodar(b"\nA\n", "", Opcoes::default());
    assert_eq!(relatorio.linhas_encontradas, 2);
    assert_eq!(saida, "\nA\n");
    assert!(contem("qualquer", "", true));

    let (vazio, saida) = rodar(b"", "", Opcoes::default());
    assert_eq!(vazio, Relatorio::default());
    assert!(saida.is_empty());
}

#[test]
fn nao_encontrar_nao_e_erro_de_io() {
    let (relatorio, saida) = rodar(b"C\nGo\n", "Rust", Opcoes::default());
    assert_eq!(relatorio, Relatorio { linhas_lidas: 2, linhas_encontradas: 0 });
    assert!(saida.is_empty());
}

#[test]
fn preserva_espacos_e_carriage_return_isolado() {
    let (_, saida) = rodar(b"  Rust  \nRust\r", "Rust", Opcoes::default());
    assert_eq!(saida, "  Rust  \nRust\r\n");
}

#[test]
fn utf8_invalido_retorna_erro() {
    let mut saida = Vec::new();
    let erro = filtrar(
        Cursor::new(&b"Rust\n\xff"[..]),
        &mut saida,
        "Rust",
        Opcoes::default(),
    ).unwrap_err();
    assert_eq!(erro.kind(), io::ErrorKind::InvalidData);
    // A linha válida anterior já pode ter sido emitida.
    assert_eq!(saida, b"Rust\n");
}

struct EscritaFalha;

impl Write for EscritaFalha {
    fn write(&mut self, _bytes: &[u8]) -> io::Result<usize> {
        Err(io::Error::new(io::ErrorKind::BrokenPipe, "falha simulada"))
    }

    fn flush(&mut self) -> io::Result<()> {
        Ok(())
    }
}

#[test]
fn propaga_falha_de_escrita() {
    let erro = filtrar(
        Cursor::new(b"Rust"),
        EscritaFalha,
        "Rust",
        Opcoes::default(),
    ).unwrap_err();
    assert_eq!(erro.kind(), io::ErrorKind::BrokenPipe);
}

struct FlushFalha;

impl Write for FlushFalha {
    fn write(&mut self, bytes: &[u8]) -> io::Result<usize> {
        Ok(bytes.len())
    }

    fn flush(&mut self) -> io::Result<()> {
        Err(io::Error::other("falha simulada no flush"))
    }
}

#[test]
fn flush_falho_impede_sucesso() {
    let resultado = filtrar(
        Cursor::new(b"Rust"),
        FlushFalha,
        "Rust",
        Opcoes::default(),
    );
    assert!(resultado.is_err());
}
```

### O que esses testes demonstram

`Cursor` transforma bytes em um leitor em memória. `Vec<u8>` pode atuar como destino de escrita. Assim, o mesmo filtro que processa arquivos é testado sem depender do sistema de arquivos.

Os escritores simulados representam falhas reais da fronteira de saída. Não basta conferir se a comparação encontrou texto: um programa que perde o erro de escrita poderia informar sucesso sem entregar o resultado.

O teste de UTF-8 inválido também documenta que a operação pode produzir saída parcial antes de falhar. O teste de ponteiro verifica uma propriedade diferente de igualdade de conteúdo: os resultados em memória realmente apontam para o documento original.

## 10. Testando o programa completo

### 10.1 Entrada controlada

Crie `tests/fixtures/notas.txt` em UTF-8, com o seguinte conteúdo:

```text
Rust controla recursos.
C permite acesso direto.
rust aparece em minúsculas.
Ownership ajuda em Rust.
```

### 10.2 tests/programa.rs

```rust
use std::{
    io::Write,
    path::PathBuf,
    process::{Command, Stdio},
};

fn binario() -> Command {
    Command::new(env!("CARGO_BIN_EXE_mini-grep"))
}

fn fixture() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("tests/fixtures/notas.txt")
}

#[test]
fn busca_arquivo_com_numeracao() {
    let saida = binario().args(["-n", "Rust"]).arg(fixture()).output().unwrap();
    assert_eq!(saida.status.code(), Some(0));
    assert_eq!(
        String::from_utf8(saida.stdout).unwrap(),
        "1:Rust controla recursos.\n4:Ownership ajuda em Rust.\n",
    );
    assert!(saida.stderr.is_empty());
}

#[test]
fn ausencia_de_resultado_retorna_um() {
    let saida = binario().arg("inexistente").arg(fixture()).output().unwrap();
    assert_eq!(saida.status.code(), Some(1));
    assert!(saida.stdout.is_empty());
    assert!(saida.stderr.is_empty());
}

#[test]
fn uso_invalido_retorna_dois() {
    let saida = binario().output().unwrap();
    assert_eq!(saida.status.code(), Some(2));
    assert!(String::from_utf8(saida.stderr).unwrap().contains("Uso:"));
}

#[test]
fn ajuda_retorna_zero_sem_abrir_arquivo() {
    let saida = binario().arg("--help").output().unwrap();
    assert_eq!(saida.status.code(), Some(0));
    assert!(String::from_utf8(saida.stdout).unwrap().contains("Uso:"));
}

#[test]
fn le_entrada_padrao_ate_eof() {
    let mut processo = binario()
        .args(["-i", "RUST", "-"])
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .unwrap();

    {
        let mut entrada = processo.stdin.take().unwrap();
        entrada.write_all(b"rust\nC\n").unwrap();
    } // Fecha o pipe: o processo filho poderá observar EOF.

    let saida = processo.wait_with_output().unwrap();
    assert_eq!(saida.status.code(), Some(0));
    assert_eq!(saida.stdout, b"rust\n");
    assert!(saida.stderr.is_empty());
}
```

Cargo fornece `CARGO_BIN_EXE_mini-grep` aos testes de integração que precisam localizar o executável. A fixture é encontrada a partir de `CARGO_MANIFEST_DIR`, evitando depender do diretório de execução do teste.

O teste com stdin mostra ownership de outro recurso: `take()` retira o handle do pipe do `Option`, e a saída do bloco o fecha. Se mantivéssemos o emissor aberto enquanto esperamos um programa que lê até EOF, poderíamos impedir seu término.

O payload desse teste é pequeno. Em um teste que troca grande volume de dados pelos dois sentidos, escrever tudo antes de drenar stdout pode bloquear quando algum pipe encher. Nesse caso, é necessário coordenar leitura e escrita concorrentes ou usar outra estratégia.

Os testes fornecidos cobrem regras de busca, fluxo de saída, contrato da CLI e execução real do programa. Eles não são uma prova de correção para todas as entradas possíveis.

## 11. Executando exemplos reais

Na raiz do projeto Rust:

```sh
cargo fmt
cargo check --all-targets
cargo test
cargo clippy --all-targets -- -D warnings
cargo build --release
```

O código de produção não usa `unsafe`. Os `unwrap` dos testes deixam falhas inesperadas interromperem o caso correspondente; o caminho da aplicação propaga falhas para o código de saída.

### 11.1 Busca sensível à caixa

```sh
cargo run -- Rust tests/fixtures/notas.txt
```

Saída esperada:

```text
Rust controla recursos.
Ownership ajuda em Rust.
```

### 11.2 Numeração e comparação ASCII

```sh
cargo run -- -n -i rust tests/fixtures/notas.txt
```

Saída esperada:

```text
1:Rust controla recursos.
3:rust aparece em minúsculas.
4:Ownership ajuda em Rust.
```

### 11.3 Entrada padrão

Em um shell Unix:

```sh
printf 'Rust\nC\nrust\n' | cargo run -- -n -i rust -
```

Saída da aplicação:

```text
1:Rust
3:rust
```

O Cargo pode imprimir mensagens de compilação em stderr. Para usar apenas o programa já construído, execute o binário em `target/release/` no layout local padrão.

### 11.4 Padrão começando com hífen

```sh
cargo run -- -- -i tests/fixtures/notas.txt
```

O primeiro `--` pertence ao Cargo. O segundo é entregue à nossa aplicação e encerra suas opções. Portanto, o programa procura literalmente `-i`, em vez de ativar a opção de comparação.

Para ler um arquivo chamado `-`, informe um caminho como `./-`, pois `-` sozinho na posição da origem foi reservado para stdin.

### 11.5 Verificando o status no shell

Depois do build, em um shell Unix:

```sh
./target/release/mini-grep inexistente tests/fixtures/notas.txt
echo $?
```

O resultado esperado do segundo comando é `1`. Para um caminho que não existe, o programa deve emitir um diagnóstico em stderr e retornar `2`. Não confunda ausência de resultados com falha ao executar a busca.

## 12. Memória, desempenho e limites

### 12.1 O que é alocado?

| Parte | Estratégia |
| --- | --- |
| Configuração | Possui o padrão e, se aplicável, o caminho |
| Busca em memória | Aloca uma coleção de referências; não copia as linhas |
| Leitura incremental | Reutiliza uma `String` para a linha atual |
| Modo ASCII | Compara janelas de bytes sem produzir versões minúsculas |
| Saída | Usa bufferização antes das escritas ao sistema operacional |

Na leitura incremental, a memória não cresce com a quantidade total de linhas emitidas. Porém, pode crescer com a maior linha lida. Um arquivo inteiro sem `\n` pode exigir um buffer do tamanho do arquivo.

O buffer também pode manter a capacidade de uma linha grande mesmo depois de processar linhas pequenas. `clear` preserva capacidade; não promete devolver memória ao allocator.

### 12.2 Limitar o tamanho da linha exige outra decisão de I/O

Verificar `linha.len()` apenas depois de `read_line` não impede a alocação da linha enorme: a leitura já aconteceu. Para impor um teto real durante a leitura, processe o buffer de entrada em partes, acompanhando o limite antes de acumular tudo, ou use um mecanismo de leitura limitada cuidadosamente projetado.

Ao fazer isso, decida como tratar sequências UTF-8 divididas entre blocos, uma linha excedente, o restante da entrada e a política de saída parcial. A validação de recursos deve acontecer no momento em que o recurso é consumido.

### 12.3 Por que não usar lowercase em tudo?

Converter todo texto e padrão para minúsculas parece uma solução curta, mas cria novos buffers e não equivale automaticamente a toda política desejada de comparação Unicode. Mapeamentos podem alterar comprimentos e interagir com normalização.

Nossa opção ASCII tem limites claros. Uma versão Unicode deve escolher explicitamente se precisa de case folding, normalização e preservação de offsets. Não use offsets calculados em uma string transformada como se necessariamente fossem posições correspondentes na original.

### 12.4 Por que não usar threads imediatamente?

O programa tem um fluxo sequencial simples. Antes de paralelizar, meça onde está o custo: leitura, comparação ou escrita. Dividir por blocos exige resolver linhas atravessando fronteiras, ordem de saída e numeração global.

Para múltiplos arquivos independentes, a divisão pode ser mais natural, mas ainda exige um limite de concorrência e uma política de apresentação. Mais threads não eliminam o custo de escrever uma única saída ordenada.

### 12.5 O que ainda não implementamos

Esta versão não oferece regex, busca recursiva, múltiplos arquivos, tratamento especial de conteúdo binário, cores, contexto antes/depois da linha nem equivalência completa com ferramentas existentes. Ela aceita texto UTF-8 e normaliza os terminadores de saída para LF, inclusive acrescentando LF a uma última linha selecionada que originalmente não tinha terminador.

O programa também pode continuar esperando se stdin permanecer aberto sem terminar uma linha ou indicar EOF. Esse é um aspecto do contrato de leitura, não um erro de lifetime.

## 13. Evoluções e exercícios

### Exercício 1 — Inverter a seleção

Implemente `-v` para emitir linhas que não contêm o padrão. Atualize opções, parser, função de seleção e testes. Defina o comportamento de `-v` com padrão vazio e arquivo vazio antes de escrever o código.

### Exercício 2 — Contar resultados

Implemente `-c` para emitir apenas a quantidade de linhas selecionadas. Evite executar uma busca completa para imprimir linhas e depois executar tudo novamente para contar.

O contrato do código de saída continua dependendo da quantidade encontrada, não de a string do contador ter sido escrita.

### Exercício 3 — Vários arquivos

Aceite várias origens e exiba o nome do arquivo em cada resultado. Defina a política quando um arquivo falha e os demais podem ser processados: continuar ou parar? Qual status resume o conjunto?

Evite concatenar arquivos de modo que a última linha de um se misture à primeira do seguinte. Trate as fronteiras explicitamente.

### Exercício 4 — Erro simulado de leitura

Implemente um `BufRead` de teste que falha depois de fornecer algumas linhas. Verifique a propagação do erro e a política de saída parcial. Esse teste complementa o de UTF-8 inválido, pois representa uma falha do recurso de I/O.

### Exercício 5 — Limite de linha

Defina um limite de bytes por linha e implemente leitura incremental que o respeite antes de alocar uma linha inteira. Teste uma linha no limite, outra com um byte a mais e sequências UTF-8 próximas à fronteira.

### Exercício 6 — API que retém resultados

Crie uma função que recebe um leitor incremental e devolve todas as linhas selecionadas como `Vec<String>`. Compare sua política de memória com `buscar`, que devolve referências, e com `filtrar`, que escreve imediatamente.

Explique por que uma assinatura `Vec<&str>` não pode simplesmente apontar para a mesma string reutilizada a cada leitura.

### Exercício 7 — Saída estruturada

Separe a seleção da apresentação para permitir texto simples e outro formato, como JSON. Trate escaping corretamente com uma biblioteca de serialização quando introduzir o formato. Não monte JSON concatenando entrada arbitrária sem escapar caracteres.

## 14. Revisão e referências

O programa usa três contratos de propriedade distintos:

```text
Config: possui argumentos necessários à execução
buscar: empresta o documento e devolve visões de suas linhas
filtrar: possui ou empresta I/O, reutiliza buffer e devolve números
```

A escolha entre esses contratos determina quais resultados podem ser guardados, quando um buffer pode mudar e onde uma alocação é necessária. O fato de o compilador aceitar os empréstimos não dispensa testes de comportamento, tratamento de falhas ou limites de recursos.

Fontes para aprofundar:

- [Projeto de I/O do Rust Book](https://doc.rust-lang.org/book/ch12-00-an-io-project.html): outra progressão didática para uma ferramenta de busca.
- [BufRead](https://doc.rust-lang.org/std/io/trait.BufRead.html): contratos das operações de leitura bufferizada.
- [BufWriter](https://doc.rust-lang.org/std/io/struct.BufWriter.html): bufferização e tratamento de flush.
- [ExitCode](https://doc.rust-lang.org/std/process/struct.ExitCode.html): resultado do processo.
- [String](https://doc.rust-lang.org/std/string/struct.String.html): armazenamento UTF-8 e operações sobre o buffer.

Retome [[Rust/Ownership e borrowing na prática|Ownership e borrowing na prática]] para rever transferências e empréstimos, [[Rust/Lifetimes|Lifetimes]] para revisar resultados emprestados e [[Rust/estrutura|Estrutura]] para ampliar a organização do projeto.
