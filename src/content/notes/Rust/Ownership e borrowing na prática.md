# Ownership e borrowing na prática

Em C, você já controla quais ponteiros possuem memória, quais apenas observam e quais podem modificar um objeto. Rust torna boa parte desses contratos verificável pelo compilador. A dificuldade inicial costuma ser expressar uma relação de propriedade que antes existia apenas na sua cabeça.

Esta é a primeira de uma sequência prática: depois dela, leia [[Rust/Lifetimes|Lifetimes]] e [[Rust/Construindo um grep|Construindo um grep]]. Para a visão geral da linguagem, consulte [[Rust/Introdução|Introdução ao Rust]].

> [!note] Como experimentar
> Use um projeto de estudo com edition 2024. Cada bloco com `fn main()` é um programa independente, salvo indicação contrária. Blocos marcados como **não compila** são exercícios de diagnóstico: não devem ser misturados ao programa correto. Os demais exemplos evitam dependências externas.

## Sumário

1. [Comece pelo dono do recurso](#1-comece-pelo-dono-do-recurso)
2. [Move não significa cópia profunda](#2-move-não-significa-cópia-profunda)
3. [Copy e Clone respondem a perguntas diferentes](#3-copy-e-clone-respondem-a-perguntas-diferentes)
4. [Escolhendo a assinatura de uma função](#4-escolhendo-a-assinatura-de-uma-função)
5. [Empréstimos e seus últimos usos](#5-empréstimos-e-seus-últimos-usos)
6. [Por que o vetor não deixa você manter o ponteiro](#6-por-que-o-vetor-não-deixa-você-manter-o-ponteiro)
7. [Acessos mutáveis a regiões diferentes](#7-acessos-mutáveis-a-regiões-diferentes)
8. [Mover campos e retirar valores](#8-mover-campos-e-retirar-valores)
9. [Iteração e captura por closures](#9-iteração-e-captura-por-closures)
10. [Coleções e transformações sem clones desnecessários](#10-coleções-e-transformações-sem-clones-desnecessários)
11. [Ownership compartilhado e mutabilidade interior](#11-ownership-compartilhado-e-mutabilidade-interior)
12. [Um exercício completo com filas](#12-um-exercício-completo-com-filas)
13. [Um método para resolver erros](#13-um-método-para-resolver-erros)
14. [Exercícios e referências](#14-exercícios-e-referências)

## 1. Comece pelo dono do recurso

Considere o contrato de uma função C que recebe `char *`. Ela pode ler, modificar, liberar, guardar o endereço ou assumir que recebeu uma cópia independente. O tipo sozinho não revela todas essas possibilidades.

Antes de escrever uma API em Rust, responda:

1. Quem é responsável pelo recurso agora?
2. A próxima operação precisa ficar com ele depois da chamada?
3. Ela precisa modificar o recurso ou somente observá-lo?
4. O resultado depende da memória da entrada?

Um arquivo aberto, uma string e um lock possuem ciclos de vida, mesmo que representem recursos distintos. Um valor proprietário pode transferir a responsabilidade ou emprestar acesso temporário.

```rust
fn consumir(mensagem: String) {
    println!("Consumindo: {mensagem}");
}

fn observar(mensagem: &str) {
    println!("Observando: {mensagem}");
}

fn editar(mensagem: &mut String) {
    mensagem.push('!');
}

fn main() {
    let mut mensagem = String::from("Estudar Rust");
    observar(&mensagem);
    editar(&mut mensagem);
    consumir(mensagem);
}
```

As três operações comunicam intenções distintas na assinatura. `observar` e `editar` devolvem o controle ao proprietário sem precisar retornar a string. `consumir` recebe a propriedade e a string é destruída ao final da chamada, pois ela não a transfere novamente.

Rust não executa um contador de empréstimos para cada `&T` comum. As restrições desses empréstimos são verificadas estaticamente. Abstrações como `RefCell` acrescentam verificações em runtime, mas são escolhas específicas.

## 2. Move não significa cópia profunda

### 2.1 Uma transferência de responsabilidade

```rust
fn main() {
    let origem = String::from("um buffer");
    let destino = origem;

    println!("{destino}");
    // println!("{origem}"); // NÃO COMPILA: origem foi movida.
}
```

O conteúdo da string não precisa ser duplicado. A operação transfere o controle sobre o armazenamento, deixando o antigo proprietário indisponível.

```text
antes:   origem  ──► descritor ──► bytes da string
depois:  destino ──► descritor ──► mesmos bytes
         origem não pode mais ser usada como dona desse valor
```

O desenho é conceitual: não promete uma ordem de campos nem uma movimentação física específica. O compilador pode otimizar a representação. A regra semântica permanece mesmo que nenhum byte precise mudar de endereço.

Em C, copiar uma struct com ponteiro para memória alocada e depois liberar por ambas as cópias pode produzir double free. O move impede que as duas associações continuem sendo usadas como proprietárias independentes do mesmo recurso.

### 2.2 Uma variável pode receber outro valor depois do move

```rust
fn main() {
    let mut entrada = String::from("primeiro");
    let processado = entrada;
    entrada = String::from("segundo");

    assert_eq!(processado, "primeiro");
    assert_eq!(entrada, "segundo");
}
```

O nome `entrada` não fica proibido para sempre. Ele precisa voltar a conter um valor válido antes do próximo uso. Isso é diferente de acessar a string que já foi transferida.

### 2.3 Move também existe sem heap

Uma struct composta apenas por números pode não implementar `Copy`. Nesse caso, operações por valor podem movê-la. A localização física dos dados não define automaticamente a política de cópia.

Uma struct com um descritor de arquivo também não deveria ser duplicada implicitamente só porque o descritor cabe em um inteiro. O significado do recurso importa mais que seu tamanho.

## 3. Copy e Clone respondem a perguntas diferentes

`Copy` autoriza duplicação implícita de um valor. `Clone` oferece uma operação explícita, cujo comportamento é definido pelo tipo.

```rust
#[derive(Debug, Clone, Copy)]
struct Dimensoes {
    largura: u32,
    altura: u32,
}

fn main() {
    let a = Dimensoes { largura: 800, altura: 600 };
    let b = a;
    assert_eq!(a.largura, b.largura);
    assert_eq!(a.altura, b.altura);

    let original = String::from("texto");
    let mut copia = original.clone();
    copia.push('!');
    assert_eq!(original, "texto");
    assert_eq!(copia, "texto!");
}
```

Uma referência compartilhada `&T` pode ser copiada sem copiar `T`. Isso duplica uma forma de observar o mesmo dado. Já `&mut T` não é `Copy`, porque uma autorização exclusiva não deve ser duplicada livremente.

Uma `String` clonada ganha armazenamento independente. Um `Arc<String>` clonado ganha outro handle para o mesmo objeto, com incremento da contagem de referências. Logo, não suponha que todo clone tenha o mesmo custo ou produza independência.

> [!tip] Clone pode ser a decisão correta
> Se um histórico precisa preservar um texto enquanto o editor continua modificando sua versão, duas cópias independentes podem fazer parte do requisito. O problema é clonar automaticamente sem decidir se você quer independência, empréstimo ou compartilhamento.

## 4. Escolhendo a assinatura de uma função

| Parâmetro | O que a função recebe | Quando usar |
| --- | --- | --- |
| `String` | Propriedade de texto | Guardar, transformar consumindo ou transferir |
| `&str` | Visão compartilhada de texto | Ler ou analisar sem possuir |
| `&mut String` | Acesso exclusivo à string | Crescer, substituir ou modificar texto |
| `Vec<T>` | Propriedade dos elementos e do buffer | Consumir ou guardar a coleção |
| `&[T]` | Visão de elementos | Examinar arrays, vetores e fatias |
| `&mut [T]` | Acesso exclusivo aos elementos | Alterar valores sem controlar capacidade |
| `&mut Vec<T>` | Acesso exclusivo ao vetor | Adicionar, remover ou reservar elementos |

### Uma API que lê não precisa escolher o armazenamento

```rust
fn contar_nao_vazias(linhas: &[String]) -> usize {
    linhas.iter().filter(|linha| !linha.trim().is_empty()).count()
}

fn main() {
    let fixo = [String::from("Rust"), String::from(" ")];
    let dinamico = vec![String::from("C"), String::from("Go")];

    assert_eq!(contar_nao_vazias(&fixo), 1);
    assert_eq!(contar_nao_vazias(&dinamico), 2);
}
```

Usar `&[String]` evita exigir especificamente um `Vec<String>`. Entretanto, ainda escolhemos elementos `String`; poderíamos generalizar para outros tipos de texto quando surgisse essa necessidade. Nem toda API precisa começar com todos os generics possíveis.

### Consumir pode evitar cópias

```rust
fn acrescentar_extensao(mut nome: String) -> String {
    nome.push_str(".md");
    nome
}

fn main() {
    let nome = String::from("ownership");
    let nome = acrescentar_extensao(nome);
    assert_eq!(nome, "ownership.md");
}
```

A função reutiliza o armazenamento recebido quando a capacidade permite. Pode haver realocação no crescimento, mas não é necessário duplicar uma string inteira apenas para preservar uma origem que o chamador não quer mais usar.

## 5. Empréstimos e seus últimos usos

Para a mesma região, referências compartilhadas comuns permitem observação; um empréstimo mutável estabelece acesso exclusivo enquanto necessário. Mutabilidade interior é uma exceção controlada por tipos específicos, tratada adiante.

### 5.1 O empréstimo pode terminar antes do escopo

```rust
fn main() {
    let mut nome = String::from("Rust");
    let leitura = &nome;
    println!("Antes: {leitura}");

    // leitura não será usada novamente.
    nome.push_str(" na prática");
    println!("Depois: {nome}");
}
```

O compilador considera os usos necessários da referência, não apenas a chave final do bloco. Essa capacidade é associada a non-lexical lifetimes.

Agora o programa **não compila**:

```rust
fn main() {
    let mut nome = String::from("Rust");
    let leitura = &nome;
    nome.clear();
    println!("{leitura}");
}
```

O `println!` exige que o empréstimo compartilhado continue válido depois da alteração. O conflito está nessa sobreposição. Trocar o nome da variável ou envolver `clear` em outro bloco não muda o contrato.

### 5.2 Reborrow não é cópia da exclusividade

```rust
fn incluir_ponto(texto: &mut String) {
    texto.push('.');
}

fn main() {
    let mut texto = String::from("fim");
    let acesso = &mut texto;

    incluir_ponto(acesso);
    incluir_ponto(acesso);
    assert_eq!(acesso.as_str(), "fim..");
}
```

Nessas chamadas, Rust pode criar reempréstimos temporários. A referência original volta a ser utilizável depois que o reempréstimo termina. Isso não autoriza manter dois acessos mutáveis independentes em uso simultâneo.

As regras e os diagnósticos básicos estão documentados em [References and Borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).

## 6. Por que o vetor não deixa você manter o ponteiro

Este programa **não compila**:

```rust
fn main() {
    let mut tarefas = vec![String::from("ler")];
    let primeira = &tarefas[0];
    tarefas.push(String::from("praticar"));
    println!("{primeira}");
}
```

`push` exige acesso exclusivo ao vetor. Crescer também pode realocar o buffer, invalidando endereços de elementos. Em C, esse seria um dos problemas ao guardar um ponteiro e depois chamar `realloc`.

Reservar capacidade previamente não elimina o contrato `&mut self` de `push`. O compilador não libera o padrão só porque você acredita que uma realocação será desnecessária naquela execução.

### Solução A: terminar a observação antes de modificar

```rust
fn main() {
    let mut tarefas = vec![String::from("ler")];
    println!("{}", &tarefas[0]);
    tarefas.push(String::from("praticar"));
}
```

### Solução B: guardar uma posição e consultar depois

```rust
fn main() {
    let mut tarefas = vec![String::from("ler")];
    let indice = 0;
    tarefas.push(String::from("praticar"));
    println!("{}", &tarefas[indice]);
}
```

Um índice não empresta o vetor. Mas ele também não promete identidade permanente: remoção, reordenação ou reutilização de posições podem fazê-lo apontar para outro elemento. Neste exemplo só acrescentamos ao final, preservando a posição existente.

### Solução C: preservar uma cópia independente

```rust
fn main() {
    let mut tarefas = vec![String::from("ler")];
    let primeira_original = tarefas[0].clone();
    tarefas[0].push_str(" documentação");
    assert_eq!(primeira_original, "ler");
}
```

Aqui a cópia é deliberada: queremos um snapshot do texto anterior. A decisão se baseia no comportamento necessário, não em silenciar o erro.

## 7. Acessos mutáveis a regiões diferentes

### 7.1 Campos diferentes de uma struct

```rust
struct Par {
    esquerda: i32,
    direita: i32,
}

fn main() {
    let mut par = Par { esquerda: 10, direita: 20 };
    let a = &mut par.esquerda;
    let b = &mut par.direita;
    *a += 1;
    *b += 2;
    assert_eq!((par.esquerda, par.direita), (11, 22));
}
```

O compilador consegue reconhecer a separação desses campos. A regra não é “uma única referência mutável no programa inteiro”; é a incompatibilidade de acessos à região emprestada.

### 7.2 Elementos escolhidos por índices

Para índices calculados, use uma API que expresse a disjunção. Neste exemplo, queremos mover unidades entre dois elementos, validando tudo antes de modificar:

```rust
fn transferir(saldos: &mut [u32], origem: usize, destino: usize, valor: u32)
    -> Result<(), &'static str>
{
    if origem >= saldos.len() || destino >= saldos.len() {
        return Err("índice inválido");
    }
    if origem == destino {
        return Err("origem e destino precisam ser distintos");
    }

    let (a, b) = if origem < destino {
        let (antes, depois) = saldos.split_at_mut(destino);
        (&mut antes[origem], &mut depois[0])
    } else {
        let (antes, depois) = saldos.split_at_mut(origem);
        (&mut depois[0], &mut antes[destino])
    };

    let nova_origem = a.checked_sub(valor).ok_or("saldo insuficiente")?;
    let novo_destino = b.checked_add(valor).ok_or("destino excederia o limite")?;
    *a = nova_origem;
    *b = novo_destino;
    Ok(())
}

fn main() {
    let mut saldos = [100, 20, 0];
    transferir(&mut saldos, 0, 1, 30).unwrap();
    assert_eq!(saldos, [70, 50, 0]);

    assert!(transferir(&mut saldos, 2, 0, 1).is_err());
    assert_eq!(saldos, [70, 50, 0]);
}
```

O primeiro cuidado é de memória: os empréstimos não se sobrepõem. O segundo é de lógica: calcular os dois valores antes de escrever evita debitar uma origem e descobrir depois que o crédito falhou.

Borrow checking não prova esse requisito transacional. A ausência de acessos inválidos e a preservação da regra de negócio são responsabilidades distintas.

## 8. Mover campos e retirar valores

### 8.1 Um move pode ser parcial

```rust
struct Pedido {
    titulo: String,
    prioridade: u8,
}

fn main() {
    let pedido = Pedido { titulo: "estudar".into(), prioridade: 2 };
    let titulo = pedido.titulo;
    assert_eq!(pedido.prioridade, 2);
    println!("{titulo}");
    // Usar pedido inteiro aqui não é permitido: titulo foi movido.
}
```

Campos ainda disponíveis podem ser utilizados, mas o objeto inteiro já não está completo. Tipos que implementam `Drop` têm restrições adicionais a moves de campos, pois seu destrutor precisa observar um valor válido.

### 8.2 Não deixe um buraco atrás de &mut

Ao receber `&mut Vec<String>`, você não pode simplesmente mover o vetor para fora da referência, deixando o proprietário original sem um valor válido. Substitua-o ao retirar:

```rust
fn retirar_todas(pendentes: &mut Vec<String>) -> Vec<String> {
    std::mem::take(pendentes)
}

fn main() {
    let mut pendentes = vec![String::from("A"), String::from("B")];
    let lote = retirar_todas(&mut pendentes);
    assert!(pendentes.is_empty());
    assert_eq!(lote.len(), 2);
}
```

`mem::take` coloca `Default::default()` no lugar e devolve o valor antigo. Para o vetor, o buffer anterior vai junto com o lote; a origem recebe um vetor vazio. Isso não é uma clonagem dos elementos. Se a origem precisa manter capacidade para uso futuro, avalie outra estratégia. [Contrato de mem::take](https://doc.rust-lang.org/std/mem/fn.take.html).

`mem::replace` permite escolher o substituto. `mem::swap` troca dois valores existentes. Para estado opcional, `Option::take` comunica muito bem a retirada:

```rust
struct Agendador {
    proxima: Option<String>,
}

impl Agendador {
    fn retirar(&mut self) -> Option<String> {
        self.proxima.take()
    }
}

fn main() {
    let mut agenda = Agendador { proxima: Some("revisar".into()) };
    assert_eq!(agenda.retirar().as_deref(), Some("revisar"));
    assert!(agenda.retirar().is_none());
}
```

O campo continua válido como `None`. A ausência se torna parte explícita do estado, em vez de uma convenção de ponteiro ou um recurso liberado ainda acessível. [Option::take](https://doc.rust-lang.org/std/option/enum.Option.html#method.take).

## 9. Iteração e captura por closures

### 9.1 Observar, modificar ou consumir uma coleção

```rust
fn main() {
    let mut nomes = vec![String::from("ana"), String::from("bia")];

    for nome in &nomes {
        println!("Observação: {nome}");
    }

    for nome in &mut nomes {
        nome.make_ascii_uppercase();
    }

    let tamanhos: Vec<usize> = nomes.into_iter().map(|nome| nome.len()).collect();
    assert_eq!(tamanhos, [3, 3]);
    // nomes foi consumido; suas strings foram descartadas no processamento.
}
```

No primeiro laço, cada item é `&String`. No segundo, `&mut String`. Na última operação, o iterador recebe o vetor e entrega cada `String` por valor.

`into_iter` aplicado a uma referência tem outro comportamento: o receptor determina qual implementação de trait será usada. Leia o tipo envolvido, não apenas o nome do método.

### 9.2 Capturar por move não significa chamar uma única vez

```rust
fn main() {
    let prefixo = String::from("Aviso");
    let exibir = move |texto: &str| println!("{prefixo}: {texto}");

    exibir("primeiro");
    exibir("segundo");
}
```

A closure possui `prefixo`, mas só o observa a cada chamada. Já esta outra retira a captura quando é chamada:

```rust
fn main() {
    let mensagem = String::from("entrega única");
    let entregar = move || mensagem;
    let recebido = entregar();
    assert_eq!(recebido, "entrega única");
    // entregar(); // NÃO COMPILA: a chamada anterior consumiu a closure.
}
```

`move` governa a entrada das capturas. `Fn`, `FnMut` e `FnOnce` descrevem como o corpo precisa acessar ou consumir esse ambiente durante as chamadas.

## 10. Coleções e transformações sem clones desnecessários

### 10.1 Remover enquanto percorre

Tentar manter um iterador compartilhado e remover itens do mesmo vetor conflita com as permissões de acesso. Uma transformação direta pode ser mais simples:

```rust
fn main() {
    let mut tarefas = vec![String::from("ler"), String::new(), String::from("praticar")];
    tarefas.retain(|tarefa| !tarefa.trim().is_empty());
    assert_eq!(tarefas, ["ler", "praticar"]);
}
```

`retain` administra a operação no próprio vetor. Outra alternativa é consumir a entrada e coletar uma nova sequência; isso pode mudar o comportamento de alocação, mas não exige clonar cada elemento.

### 10.2 Atualizar um mapa com entry

```rust
use std::collections::HashMap;

fn main() {
    let texto = "rust c rust";
    let mut contagem: HashMap<&str, usize> = HashMap::new();

    for palavra in texto.split_whitespace() {
        *contagem.entry(palavra).or_insert(0) += 1;
    }

    assert_eq!(contagem.get("rust"), Some(&2));
}
```

As chaves emprestam o texto. `entry` oferece uma operação apropriada para decidir entre inserir e alterar sem carregar referências obtidas em buscas separadas.

Se o mapa precisa sobreviver à entrada, use chaves possuídas. Não transforme essa necessidade em uma lifetime artificialmente longa: escolha um proprietário para os bytes.

### 10.3 Observar um Option sem consumir seu conteúdo

```rust
fn main() {
    let nome = Some(String::from("Rust"));
    let tamanho = nome.as_ref().map(|texto| texto.len());
    let visao: Option<&str> = nome.as_deref();

    assert_eq!(tamanho, Some(4));
    assert_eq!(visao, Some("Rust"));
    println!("Ainda possuído: {nome:?}");
}
```

`nome.map(...)` consumiria o `Option<String>`. `as_ref` muda a operação para um `Option<&String>` emprestado. `as_deref` aproveita a visão `&str`. A diferença está no receptor do método e em quem permanece responsável pelo conteúdo.

## 11. Ownership compartilhado e mutabilidade interior

Se vários componentes realmente precisam manter um recurso vivo, `Rc` ou `Arc` podem representar essa propriedade compartilhada. Isso é diferente de emprestar temporariamente um valor que já tem um proprietário suficiente.

```rust
use std::{cell::RefCell, rc::Rc};

fn main() {
    let historico = Rc::new(RefCell::new(Vec::<String>::new()));
    let painel = Rc::clone(&historico);

    {
        let mut escrita = historico.borrow_mut();
        escrita.push("aberto".into());
    }

    let leitura = painel.borrow();
    assert_eq!(leitura.len(), 1);
    assert!(historico.try_borrow_mut().is_err());
}
```

Há duas decisões: `Rc` compartilha a propriedade; `RefCell` verifica permissões de empréstimo em runtime. Um guard mantém seu empréstimo ativo até ser descartado. `borrow_mut` em conflito causa panic; `try_borrow_mut` permite tratar a falha.

Isso não habilita concorrência entre threads. Também não evita ciclos de referências fortes. Para relações de retorno sem propriedade, `Weak` pode ser apropriado.

Antes de adotar esse arranjo, verifique se a operação poderia simplesmente receber `&mut Estado`. Um proprietário claro e empréstimos curtos costumam reduzir o número de invariantes que você precisa acompanhar.

## 12. Um exercício completo com filas

Aqui o consumidor retira uma tarefa da fila, transforma o texto e guarda o resultado. Cada texto muda de proprietário, sem clonagem.

```rust
use std::collections::VecDeque;

#[derive(Default)]
struct Processador {
    pendentes: VecDeque<String>,
    concluidas: Vec<String>,
}

impl Processador {
    fn agendar(&mut self, tarefa: String) {
        self.pendentes.push_back(tarefa);
    }

    fn processar_proxima(&mut self) -> bool {
        let Some(mut tarefa) = self.pendentes.pop_front() else {
            return false;
        };

        tarefa.push_str(" [concluída]");
        self.concluidas.push(tarefa);
        true
    }

    fn concluidas(&self) -> &[String] {
        &self.concluidas
    }
}

fn main() {
    let mut processador = Processador::default();
    processador.agendar("ler".into());
    processador.agendar("praticar".into());

    while processador.processar_proxima() {}

    assert_eq!(processador.concluidas(), ["ler [concluída]", "praticar [concluída]"]);
}
```

O caminho de propriedade é:

```text
chamador → pendentes → variável local tarefa → concluidas
```

`pop_front` devolve propriedade; `front` devolveria apenas uma referência. Escolher a operação correta muda o que o restante da função consegue fazer.

O método `concluidas` oferece uma visão de leitura e preserva o controle sobre a coleção. Se o cliente mantiver essa visão em uso, não poderá chamar livremente uma operação que pede `&mut self` do mesmo processador. Isso decorre da assinatura, ainda que uma implementação específica pareça modificar apenas outra parte.

O exemplo não possui operações falíveis no processamento além das condições gerais de alocação. Se processar uma tarefa puder retornar erro, defina antes se ela volta à fila, vai para uma lista de falhas ou é descartada. A propriedade ajuda a implementar a política; não escolhe a política por você.

## 13. Um método para resolver erros

Quando aparecer um erro de ownership, siga o fluxo do valor:

| Diagnóstico comum | Pergunta útil | Possível mudança |
| --- | --- | --- |
| Uso após move | A chamada precisava possuir? | Receber referência ou aceitar o consumo |
| Move através de uma referência | O que ficará no lugar? | `take`, `replace`, `Option` ou retirar da coleção |
| Leitura e escrita incompatíveis | A leitura precisa continuar depois? | Encurtar o empréstimo ou preservar só um resultado |
| Dois empréstimos mutáveis | As regiões são realmente disjuntas? | Dividir a estrutura por APIs apropriadas |
| Referência a valor local retornada | Quem manterá os bytes vivos? | Retornar valor possuído ou emprestar do chamador |
| Conflito com método de &mut self | O método está pedindo acesso amplo demais? | Passar campos específicos ou separar operações |

Leia também a assinatura dos métodos chamados: um método que recebe `self` consome o receptor, enquanto `&self` e `&mut self` emprestam. O diagnóstico pode começar longe do ponto em que a transferência aconteceu.

Nem todo programa rejeitado teria necessariamente um bug na execução específica que você imaginou. A análise é conservadora e trabalha com contratos que precisam valer para os usos permitidos. Reorganizar a API pode tornar demonstrável uma propriedade que antes estava apenas implícita.

## 14. Exercícios e referências

1. Modifique `Processador` para devolver todas as tarefas concluídas por propriedade, deixando uma coleção válida no lugar. Compare `mem::take` com um método que consome o processador inteiro.
2. Acrescente testes para `transferir`: índice inválido, índices iguais, saldo insuficiente, overflow no destino e transferência no sentido inverso. Em cada erro, verifique que ambos os saldos permanecem iguais aos anteriores.
3. Escreva uma função que recebe `Vec<String>`, remove textos vazios e devolve os restantes. Depois escreva uma versão que recebe `&mut Vec<String>`. Explique como muda o contrato do chamador.
4. Faça um contador de palavras emprestado e outro com chaves possuídas. Mostre em qual momento o texto original pode ser destruído em cada versão.
5. Provoque um erro mantendo `processador.concluidas()` em uso enquanto chama `agendar`. Explique o empréstimo que o método de leitura devolve.

Referências para os contratos utilizados:

- [Ownership](https://doc.rust-lang.org/book/ch04-01-what-is-ownership.html).
- [Referências e borrowing](https://doc.rust-lang.org/book/ch04-02-references-and-borrowing.html).
- [Vec e suas operações](https://doc.rust-lang.org/std/vec/struct.Vec.html).
- [mem::take](https://doc.rust-lang.org/std/mem/fn.take.html).
- [Option](https://doc.rust-lang.org/std/option/enum.Option.html).

Próxima etapa: [[Rust/Lifetimes|Lifetimes — como expressar a relação entre referências e seus proprietários]].
