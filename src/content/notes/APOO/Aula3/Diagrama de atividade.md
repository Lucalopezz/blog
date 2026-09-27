
## Definição

O **Diagrama de Atividades** é um diagrama comportamental da UML usado para representar o fluxo de trabalho de um processo computacional ou organizacional. Ele permite descrever:

- ações sequenciais;
- caminhos alternativos;
- decisões condicionais;
- ações executadas em paralelo;
- sincronização entre fluxos paralelos;
- troca ou transformação de objetos;
- sinais e eventos;
- exceções e interrupções.

Durante a **análise**, pode representar um processo existente dentro de um caso de uso ou um processo que reúna múltiplos casos de uso. Durante o **projeto**, também pode detalhar algoritmos sequenciais ou concorrentes complexos, de modo semelhante a um fluxograma.

> [!info] Relação com BPMN  
> O Diagrama de Atividades é o equivalente mais próximo, dentro da UML, à BPMN. Entretanto, a UML mantém o foco no desenvolvimento de software, enquanto a BPMN é especializada em processos de negócio.

## Quando utilizar

Use um Diagrama de Atividades quando precisar:

- compreender o fluxo completo de um processo;
- representar regras de negócio com decisões;
- identificar responsabilidades de atores ou setores;
- mostrar tarefas simultâneas;
- descrever um caso de uso complexo;
- detalhar a lógica de um algoritmo sem entrar diretamente no código.

Ele não é a melhor escolha quando o objetivo principal é representar chamadas entre objetos ou serviços ao longo do tempo. Para isso, use um [[#Parte 2 - Diagrama de Sequência|Diagrama de Sequência]].

## Atividade, pool e swimlane

### Atividade

Uma **atividade** descreve um fluxo completo de ações dentro de um processo. Exemplos:

- saque bancário;
- navegação de um robô;
- compra on-line;
- empréstimo de um livro.

### Pool

A atividade principal pode ser delimitada por uma **pool** ou piscina, que contém o fluxo do processo modelado.

### Swimlane

As **swimlanes**, ou raias, dividem a atividade de acordo com quem é responsável pelas ações. Uma raia pode representar:

- um ator;
- um setor;
- uma unidade organizacional;
- um sistema ou subsistema.

![[Pasted image 20260817100228.png|453]]

> [!tip] Regra prática  
> A posição de uma ação em uma raia responde: **quem executa esta ação?**

## Ação

Uma **ação** é uma unidade de processamento que produz uma saída ou provoca uma mudança de estado.

Exemplos:

- autenticar o cliente;
- verificar o saldo;
- debitar a conta;
- emitir uma nota fiscal;
- separar os produtos.

Uma atividade é, portanto, composta por ações e pelo fluxo de controle que determina a ordem de execução.
![[Pasted image 20260817101243.png]]

## Subatividade - tridente

Uma **subatividade** é uma atividade interna chamada a partir de uma atividade maior. Seu uso indica que existe outro Diagrama de Atividades com detalhes adicionais.

Quando a subatividade é invocada, seu fluxo de ações é incluído no ponto correspondente do fluxo principal.

### Por que usar

- reduzir a poluição visual;
- reutilizar um fluxo;
- separar partes complexas do processo;
- trabalhar com diferentes níveis de abstração.

![[Pasted image 20260817101258.png|499]]

## Nós de controle

### Nó inicial

Marca o começo da execução da atividade. Normalmente é representado por um círculo preenchido.
### Nó final da atividade

Encerra **toda a atividade**, inclusive outros fluxos que possam existir. É normalmente representado por um círculo preenchido dentro de outro círculo.

### Nó final de fluxo

Encerra somente **um caminho específico**, sem finalizar necessariamente toda a atividade. Um diagrama pode conter múltiplos fins de fluxo e múltiplos nós finais.

### Nó de decisão

Divide o fluxo em dois ou mais caminhos alternativos. Cada saída deve apresentar uma **condição de guarda**, como:

- `[pagamento confirmado]`;
- `[saldo suficiente]`;
- `[else]`.

As condições devem ser mutuamente exclusivas ou suficientemente definidas para impedir ambiguidade sobre o próximo caminho.


![[Pasted image 20260817101442.png|571]]

> [!warning] Decisão não é paralelismo  
> Em uma decisão, apenas o caminho cuja condição for satisfeita deve continuar. No fork, vários caminhos começam paralelamente.

## Transição e condição de guarda

Uma **transição** conecta os elementos do diagrama. Quando uma ação termina, a transição conduz imediatamente à próxima ação.

Transições podem receber rótulos para melhorar a leitura. Ao sair de um nó de decisão, devem possuir condições de guarda entre colchetes.

Exemplo conceitual:

```
Verificar pagamento
  ├─ [confirmado] → Emitir nota fiscal
  └─ [else]       → Tratar falha
```

![[Pasted image 20260817101419.png|560]]

## Bifurcação e união: fork e join

### Bifurcação - fork

Uma barra de **bifurcação** inicia dois ou mais fluxos concorrentes. Ela indica que ações independentes podem começar em paralelo.

Carona -> quando chega na faculdade cada um ta livre pra ir em sua aula

### União - join

Uma barra de **união** sincroniza fluxos paralelos. O fluxo posterior só começa quando **todos os fluxos anteriores** tiverem terminado.

Exemplo: após confirmar um pagamento, o vendedor pode emitir a nota fiscal enquanto o depósito despacha os produtos. Se uma ação posterior depender das duas, deve haver um join.

Carona -> eu ja estou liberado mas tenho que esperar os outros pra ir embora

![[Pasted image 20260817101538.png]]
## Objetos e fluxo de objetos

Objetos também podem participar da atividade. Sua movimentação entre ações constitui um **fluxo de objeto**.

Durante o processo, um objeto pode ser:

- criado;
- consultado;
- alterado;
- excluído.

Exemplo: a conclusão de uma compra produz `pedido: Pedido`, que será utilizado pela ação `Processar Pedido`.

![[Pasted image 20260817101627.png|439]]

> [!note] Fluxo de controle x fluxo de objeto
> 
> - **Fluxo de controle:** indica qual ação pode executar em seguida.
>     
> - **Fluxo de objeto:** indica que dado ou objeto é produzido e consumido pelas ações.
>     

## Sinais e eventos

### Envio de sinal

É uma ação que transmite um sinal, geralmente de forma assíncrona. Exemplo: enviar um e-mail de confirmação.

### Recepção de sinal

Representa a espera pela ocorrência de um evento. O fluxo continua quando o sinal esperado é recebido.

### Evento de tempo

É uma variação da recepção de evento disparada por um critério temporal, como `após 2 dias`.

Sinais e eventos são particularmente úteis para representar processos assíncronos, nos quais o sistema não executa tudo em um único fluxo contínuo.

![[Pasted image 20260817101656.png|492]]
## Exceção e região de interrupção

Uma **exceção** representa a interrupção do fluxo normal e o desvio para um tratador, também chamado de _handler_.

Uma **região de interrupção** agrupa as ações durante as quais determinada exceção pode ocorrer. Quando a exceção acontece:

1. o fluxo normal dentro da região é interrompido;
2. a execução segue para o tratador correspondente;
3. o tratador executa a ação de mitigação ou recuperação.

Exemplo: se ocorrer uma falha durante o processamento do pedido, o fluxo pode ser desviado para `Tratar Falha`.

![[Pasted image 20260817101724.png]]

## Resumo dos elementos do Diagrama de Atividades

| Elemento                | Finalidade                                        |
| ----------------------- | ------------------------------------------------- |
| Atividade               | Representar o processo completo                   |
| Pool                    | Delimitar a atividade principal                   |
| Swimlane                | Separar ações por responsável                     |
| Ação                    | Representar um processamento ou mudança de estado |
| Subatividade            | Invocar um fluxo detalhado em outro diagrama      |
| Nó inicial              | Marcar o início da atividade                      |
| Nó final                | Encerrar toda a atividade                         |
| Fim de fluxo            | Encerrar apenas um caminho                        |
| Decisão                 | Escolher um caminho com base em condições         |
| Transição               | Conectar e ordenar os elementos                   |
| Condição de guarda      | Definir quando uma transição pode ocorrer         |
| Fork                    | Iniciar fluxos paralelos                          |
| Join                    | Sincronizar fluxos paralelos                      |
| Objeto                  | Representar dados manipulados pelo processo       |
| Envio/recepção de sinal | Representar comunicação ou espera assíncrona      |
| Evento de tempo         | Continuar o fluxo após uma condição temporal      |
| Exceção                 | Desviar o fluxo em uma situação anormal           |
| Região de interrupção   | Delimitar ações sujeitas a uma interrupção        |

## Exemplo simplificado em Mermaid

```
flowchart TD
    A([Início]) --> B[Receber pedido]
    B --> C{Pagamento confirmado?}
    C -->|Não| D[Tratar falha]
    D --> E([Fim])
    C -->|Sim| F[Emitir nota fiscal]
    C -->|Sim| G[Separar produtos]
    F --> H[Encerrar pedido]
    G --> H
    H --> E
```

> [!important] Limitação do exemplo  
> O Mermaid acima comunica o fluxo, mas não reproduz todos os símbolos formais da UML, especialmente fork/join e swimlanes. Em uma avaliação que exija a notação UML, utilize os símbolos UML ensinados na aula.

## Exercício da aula: jogo de dados

O exercício solicita um Diagrama de Atividades com **swimlanes** e **sinais** para um jogo com estas regras:

- há dois dados de seis faces;
- uma partida possui cinco lançamentos;
- o jogador ganha um lançamento se a soma for `7` ou `11`;
- vence a partida quem obtiver maioria dos lançamentos;
- `JOGAR` inicia o jogo e fica desabilitado;
- `LANÇAR` inicia a desaceleração dos dados até a parada;
- o sistema mostra `VENCEU` ou `PERDEU`, emite um alerta sonoro e informa os lançamentos restantes;
- o próximo lançamento depende de novo acionamento de `LANÇAR`;
- `PARAR` pode encerrar o jogo a qualquer momento e reabilita `JOGAR`.

### Elementos que a solução precisa representar

- raias para separar ações do jogador e da aplicação;
- evento de clique em `JOGAR`, `LANÇAR` e `PARAR`;
- repetição limitada a cinco lançamentos;
- decisão baseada na soma dos dados;
- contagem de vitórias e derrotas;
- decisão final da partida;
- interrupção antecipada pelo botão `PARAR`.