---
title: "Diagrama de comunicação e GRASP"
description: "Colaboração entre objetos, mensagens e atribuição de responsabilidades com GRASP."
category: "APOO"
tags: [apoo, uml, diagramas-de-comunicacao, grasp]
---

## 1. Visão geral da aula

A aula aborda dois assuntos diretamente ligados à fase de **projeto de software orientado a objetos**:

1. **Diagramas de Comunicação**, usados para representar como objetos colaboram e trocam mensagens para realizar uma operação.
2. **Padrões GRASP**, usados para decidir **qual objeto deve receber determinada responsabilidade** dentro do sistema.

A ideia central é sair de uma visão mais abstrata do sistema — casos de uso, requisitos e domínio — e começar a definir **como os objetos realmente vão colaborar na implementação**. Aula_05_Diagrama_Comunicao_GRASP

---

# 2. Diagrama de Comunicação

## 2.1 Definição

O **Diagrama de Comunicação** é um diagrama comportamental da UML que representa a interação entre objetos ou partes de um sistema por meio da troca de mensagens.

Ele combina informações provenientes de:

- **Casos de Uso**;
- **Diagramas de Classes**;
- **Diagramas de Sequência**.

Com isso, representa ao mesmo tempo:

- aspectos **estruturais**: quais objetos estão relacionados;
- aspectos **dinâmicos**: quais mensagens são enviadas entre eles.

Ele é principalmente utilizado durante a **etapa de projeto**, pois ajuda a definir como o sistema será construído internamente. Aula_05_Diagrama_Comunicao_GRASP

### Ideia principal

Imagine um caso de uso:

> Finalizar uma venda.

O caso de uso explica **o que deve acontecer**.

O Diagrama de Comunicação começa a responder:

> Quais objetos precisam colaborar para isso acontecer?

Por exemplo:

```
PointOfSale
     |
     | finalize()
     v
    Sale
     |
     | create(amount)
     v
  Payment
```

Assim, o foco não está apenas na sequência temporal, mas principalmente em **quem conhece quem e quem envia mensagens para quem**.

---

# 3. Elementos de um Diagrama de Comunicação

Os principais elementos estudados são:

```
Objeto
   ↓
Ligação
   ↓
Mensagem
   ↓
Número de sequência
```

---

## 3.1 Objetos

O Diagrama de Comunicação é construído utilizando **objetos**, também chamados de **participantes**.

Um objeto normalmente aparece com a seguinte representação:

```
account : Account
```

Onde:

```
account -> nome do objeto
Account -> nome da classe
```

A linha abaixo do nome indica que aquilo representa uma **instância**, e não a classe propriamente dita.

Também pode existir um objeto sem nome:

```
: PaymentController
```

Isso significa:

> Existe uma instância da classe `PaymentController`, mas o nome específico da variável/objeto não é relevante.

A aula também apresenta o conceito de **multiobjeto**, utilizado para representar uma coleção:

```
payments : Payment
```

Um objeto pode atuar tanto como:

- cliente de outro objeto;
- fornecedor de serviços para outro objeto. Aula_05_Diagrama_Comunicao_GRASP

---

# 4. Ligação entre objetos

Para dois objetos trocarem mensagens, deve existir uma **ligação** entre eles.

Essa ligação representa a **visibilidade** entre os objetos.

Em termos práticos:

> O objeto A precisa conhecer o objeto B para conseguir enviar uma mensagem para B.

Segundo o material, essa visibilidade pode existir quando o outro objeto é:

- atributo do objeto;
- parâmetro de um método;
- variável declarada localmente;
- globalmente visível. Aula_05_Diagrama_Comunicao_GRASP

Por exemplo:

```
class Sale {

    private Payment payment;

}
```

`Sale` conhece `Payment` porque existe uma referência para ele.

Outro exemplo:

```
public void finalizar(Payment payment) {
    payment.processar();
}
```

Mesmo sem ser atributo, `Sale` conhece `Payment` naquele contexto porque recebeu o objeto como parâmetro.

---

# 5. Mensagens

A comunicação entre os objetos ocorre através de **mensagens**.

Em programação orientada a objetos, isso corresponde essencialmente à:

> chamada de métodos.

Exemplo:

```
payment.executarPagamento();
```

No Diagrama de Comunicação poderia aparecer como:

```
executarPagamento()
------------------>
Payment
```

Outros exemplos apresentados na aula incluem:

```
p.executarPagamento()
fl.lift(10)
ctrl.liberar(u)
```

A sintaxe geral apresentada é:

```
retorno := mensagem(parâmetro: tipo) : tipoRetorno
```

Por exemplo:

```
code := pay() : int
```

Ou:

```
usuario := buscarUsuario(id: int) : Usuario
```

A mensagem também pode possuir uma **condição de guarda**, determinando quando aquela chamada ocorre. Aula_05_Diagrama_Comunicao_GRASP

---

# 6. Número de sequência

Diferentemente do Diagrama de Sequência, o Diagrama de Comunicação não organiza visualmente os objetos em uma linha temporal.

Por isso, as mensagens precisam ser **numeradas**.

Exemplo:

```
1: payAllScheduled()
1.1: pay()
1.2: clear()
```

Isso significa:

```
Mensagem 1
 ├── Mensagem 1.1
 └── Mensagem 1.2
```

A numeração permite entender a ordem das chamadas.

Uma mensagem gerada como consequência de outra é chamada de:

**mensagem aninhada**.

Por exemplo:

```
1: finalizarVenda()
1.1: calcularTotal()
1.2: criarPagamento()
1.3: salvarVenda()
```

Todos os métodos `1.x` acontecem como parte da execução de `finalizarVenda()`.

Segundo o material, a primeira mensagem que inicia a interação não precisa ser numerada. Aula_05_Diagrama_Comunicao_GRASP

---

# 7. Relação entre o diagrama e o código

Um ponto importante é que as mensagens representadas no diagrama possuem correspondência direta com chamadas no código.

O exemplo apresentado na aula possui a seguinte estrutura:

```
int code = controller.processScheduled(account);
```

Depois:

```
public int processScheduled(Account account) {

    account.payAllScheduled(); // mensagem 1

}
```

E dentro de `Account`:

```
public int payAllScheduled() {

    for (Payment p : payments) {

        if (scheduled) {
            p.pay(); // mensagem 1.1
        }

    }

    payments.clear(); // mensagem 1.2
}
```

Portanto, o diagrama representa algo próximo da estrutura real da implementação. Aula_05_Diagrama_Comunicao_GRASP

---

# 8. Iterações

O Diagrama de Comunicação também consegue representar repetições.

Por exemplo:

```
1*[i = 1..10]: msg2()
```

O `*` indica que a mensagem será executada repetidamente.

Isso pode corresponder a:

```
for (int i = 1; i < 10; i++) {
    b.msg2();
}
```

Também pode aparecer algo como:

```
1*: getTotal()
```

Significando que a mensagem será enviada para múltiplos objetos de uma coleção.

A página 10 mostra explicitamente essa correspondência entre as mensagens de iteração do diagrama e um `for` em Java. Aula_05_Diagrama_Comunicao_GRASP

---

# 9. Condicionais

Também é possível representar estruturas condicionais.

Exemplo:

```
1a [condition]: msg2()

1b [else]: msg3()
```

Isso corresponderia aproximadamente a:

```
if (condition) {
    b.msg2();
} else {
    c.msg3();
}
```

As expressões dentro de:

```
[ ... ]
```

são chamadas de **condições de guarda**.

A mensagem somente é executada quando aquela condição for satisfeita. Aula_05_Diagrama_Comunicao_GRASP

---

# 10. Diagrama de Sequência vs. Diagrama de Comunicação

Os dois diagramas representam praticamente as mesmas interações.

A aula afirma que eles são **isomorfos**, ou seja, existe correspondência entre os elementos representados nos dois modelos. Aula_05_Diagrama_Comunicao_GRASP

Porém, possuem focos diferentes.

|Diagrama de Sequência|Diagrama de Comunicação|
|---|---|
|Foco maior no tempo|Foco maior na relação entre objetos|
|Ordem visual das mensagens|Ordem indicada por números|
|Linha de vida dos objetos|Ligações entre objetos|
|Bom para fluxos temporais complexos|Mais compacto|
|Pode representar cenários complexos de tempo real|Facilita visualizar dependências entre objetos|

Na **página 13**, o material mostra o mesmo cenário de uma máquina/dispenser representado primeiro como Diagrama de Sequência e depois como Diagrama de Comunicação, demonstrando essa equivalência. Aula_05_Diagrama_Comunicao_GRASP

---

# 11. Atribuição de responsabilidades

Essa é uma das partes mais importantes da aula.

Ao projetar o sistema, não basta decidir quais classes existem.

Também precisamos decidir:

> **Quem será responsável por fazer cada coisa?**

As responsabilidades dos objetos normalmente aparecem na forma dos serviços disponibilizados pelos seus métodos.

Existem dois tipos básicos de responsabilidade.

## Responsabilidade de **Fazer**

O objeto pode ser responsável por:

- criar outro objeto;
- realizar uma operação;
- iniciar operações;
- coordenar outros objetos;
- controlar atividades.

Exemplo:

```
Venda → criar ItemVenda
```

## Responsabilidade de **Saber**

O objeto pode ser responsável por:

- conhecer seus próprios dados;
- conhecer objetos relacionados;
- calcular ou derivar informações.

Exemplo:

```
Venda → saber o valor total da venda
```

A qualidade do projeto depende diretamente de essas responsabilidades serem atribuídas aos objetos adequados. Aula_05_Diagrama_Comunicao_GRASP

---

# 12. GRASP

**GRASP** significa:

> **General Responsibility Assignment Software Patterns**

São padrões utilizados para ajudar a decidir como distribuir responsabilidades entre objetos.

Os principais estudados nesta aula são:

1. **Especialista — Expert**
2. **Criador — Creator**
3. **Fraco Acoplamento — Low Coupling**
4. **Alta Coesão — High Cohesion**
5. **Controlador — Controller**

A ideia de um padrão é oferecer uma solução conhecida para um problema recorrente de projeto. Aula_05_Diagrama_Comunicao_GRASP

---

# 13. GRASP — Especialista

## Problema

> Quem deve receber determinada responsabilidade?

## Solução

Atribua a responsabilidade à classe que possui as **informações necessárias para realizá-la**. Aula_05_Diagrama_Comunicao_GRASP

### Exemplo da aula

Queremos calcular o total de uma venda.

Temos:

```
Sale
 |
 | getTotal()
 v
SaleItem
 |
 | getPrice()
 v
Product
```

Cada objeto conhece aquilo que faz sentido no seu contexto.

### `Product`

Conhece:

```
preço
```

### `SaleItem`

Conhece:

```
quantidade
Product
```

Portanto consegue calcular:

```
quantidade × preço
```

### `Sale`

Conhece os vários `SaleItem`.

Portanto consegue calcular:

```
soma de todos os SaleItem
```

Esse é exatamente o princípio do **Especialista**.

---

## Benefícios do Especialista

Ele tende a:

- preservar encapsulamento;
- favorecer baixo acoplamento;
- aumentar a coesão;
- distribuir comportamento pelas classes adequadas. Aula_05_Diagrama_Comunicao_GRASP

Entretanto, não deve ser aplicado cegamente.

O próprio material levanta a questão:

> Quem deveria salvar uma venda no banco de dados?

Embora `Sale` tenha os dados da venda, colocar persistência dentro de `Sale` pode aumentar acoplamento e diminuir coesão.

Portanto:

```
"possui a informação"
        ↓
não significa automaticamente
        ↓
"deve fazer qualquer operação relacionada à informação"
```

---

# 14. GRASP — Criador

## Problema

> Quem deve ser responsável por criar um objeto A?

## Solução

Uma classe `B` é uma boa candidata para criar `A` quando:

- `B` contém `A`;
- `B` agrega `A`;
- `B` usa objetos de `A`;
- `B` possui as informações necessárias para inicializar `A`. Aula_05_Diagrama_Comunicao_GRASP

---

## Exemplo

Quem deve criar um pagamento?

```
Sale
 |
 | create(amount)
 v
Payment
```

`Sale` possui as informações necessárias para criar o `Payment`.

Portanto:

```
class Sale {

    public void finalizeSale() {
        Payment payment = new Payment(amount);
    }

}
```

O benefício principal é que essa decisão tende a preservar **baixo acoplamento**, porque geralmente o objeto criador já possuía uma relação com o objeto criado. Aula_05_Diagrama_Comunicao_GRASP

---

# 15. GRASP — Fraco Acoplamento

## O que é acoplamento?

Acoplamento representa o grau de **dependência entre elementos do sistema**.

### Acoplamento fraco

```
A depende pouco de B, C e D.
```

### Acoplamento forte

```
A depende fortemente de vários outros elementos.
```

Algumas formas de acoplamento apresentadas são:

- atributo de outra classe;
- parâmetro;
- retorno;
- variável local;
- chamada de serviço de outra classe;
- herança. Aula_05_Diagrama_Comunicao_GRASP

---

## Objetivo

O padrão busca responder:

> Como reduzir o impacto das mudanças e aumentar a possibilidade de reutilização?

A solução é atribuir responsabilidades buscando manter **baixo o acoplamento desnecessário**. Aula_05_Diagrama_Comunicao_GRASP

---

## Exemplo conceitual

Imagine:

```
PointOfSale
   |
   +----> Sale
   |
   +----> Payment
```

`PointOfSale` precisa conhecer os dois objetos.

Outra alternativa:

```
PointOfSale
     |
     v
    Sale
     |
     v
  Payment
```

Se `Sale` já possui uma relação natural com `Payment`, fazer `Sale` cuidar dessa colaboração pode evitar uma dependência desnecessária de `PointOfSale`.

A alternativa marcada como adequada na **página 21** segue justamente essa ideia. Aula_05_Diagrama_Comunicao_GRASP

---

## Benefícios do baixo acoplamento

- mudanças afetam menos partes do sistema;
- classes podem ser entendidas mais isoladamente;
- reutilização se torna mais fácil. Aula_05_Diagrama_Comunicao_GRASP

Mas existe um detalhe importante:

> **Acoplamento mínimo não é necessariamente o objetivo.**

Tentar eliminar todas as dependências pode gerar projetos piores.

O material apresenta como exemplo problemático:

```
a.getB().getC().getD().setE(valor);
```

Esse encadeamento excessivo é chamado de:

**message chain**. Aula_05_Diagrama_Comunicao_GRASP

---

# 16. GRASP — Alta Coesão

## O que é coesão?

Coesão representa o quanto as responsabilidades de uma classe estão **relacionadas entre si**.

### Alta coesão

Uma classe realiza poucas tarefas, mas todas relacionadas ao seu propósito.

```
UserService
├── createUser()
├── updateUser()
└── deactivateUser()
```

### Baixa coesão

Uma classe começa a fazer tudo:

```
SystemManager
├── createUser()
├── sendEmail()
├── calculateTax()
├── createPayment()
├── generatePDF()
└── connectDatabase()
```

As responsabilidades não possuem um foco comum.

Quanto menor a coesão, maior tende a ser a dificuldade de:

- compreender;
- reutilizar;
- manter;
- alterar o objeto. Aula_05_Diagrama_Comunicao_GRASP

---

## Objetivo

A pergunta do padrão é:

> Como manter os objetos focados, compreensíveis e gerenciáveis?

A solução é distribuir responsabilidades de forma que a **coesão permaneça alta**. Aula_05_Diagrama_Comunicao_GRASP

---

## Relação entre coesão e acoplamento

Esses dois conceitos aparecem juntos com muita frequência.

Um bom projeto normalmente busca:

```
Alta Coesão
     +
Baixo Acoplamento
```

Ou seja:

```
cada classe faz poucas coisas relacionadas
              +
cada classe depende do menor número razoável de outras classes
```

A aula destaca como benefícios da alta coesão:

- maior clareza;
- manutenção simplificada;
- maior facilidade para adicionar funcionalidades;
- favorecimento do baixo acoplamento;
- maior possibilidade de reúso. Aula_05_Diagrama_Comunicao_GRASP

---

# 17. GRASP — Controlador

O padrão **Controller** responde à pergunta:

> Qual deve ser o primeiro objeto, após a interface, a receber uma operação do sistema?

A solução é usar um objeto que represente:

- o sistema/subsistema como um todo; ou
- um caso de uso específico.

Esses dois estilos são chamados de:

```
Controlador de fachada
```

e

```
Controlador de caso de uso
```

respectivamente. Aula_05_Diagrama_Comunicao_GRASP

---

## Exemplo

Imagine uma tela:

```
Tela de vendas
```

Em vez de:

```
Tela
 ↓
Sale
```

poderíamos ter:

```
Tela
 ↓
SalesController
 ↓
caso de uso / domínio
```

Exemplo:

```
class SalesController {

    public Response finalizeSale(FinalizeSaleRequest request) {
        ...
    }

}
```

---

# 18. Controller não deve conter toda a regra de negócio

Esse é um ponto particularmente importante da aula.

Embora o Controller receba os eventos/requisições, ele **não deve realizar sozinho as regras de negócio**.

Um Controller muito grande tende a possuir:

```
Baixa coesão
+
Muitas responsabilidades
```

O material recomenda que o controlador **delegue as regras de negócio para os objetos apropriados**. Aula_05_Diagrama_Comunicao_GRASP

---

# 19. Controller vs. Service / Caso de Uso

A aula faz uma separação importante entre:

```
Controller
```

e

```
Service / Use Case
```

## Controller

Responsável principalmente por:

```
receber requisição
      ↓
interpretar parâmetros
      ↓
converter dados
      ↓
chamar o caso de uso
      ↓
devolver resposta
```

## Service / Caso de Uso

Responsável por materializar o processo ou **regra de negócio**.

O fluxo fica aproximadamente:

```
UI / HTTP
   ↓
Controller
   ↓
Service / Use Case
   ↓
Domínio / Entidades
```

Segundo o material, Controllers costumam estar fortemente relacionados à plataforma, enquanto as classes de serviço representam os processos do domínio e manipulam as entidades. Aula_05_Diagrama_Comunicao_GRASP

Isso é especialmente próximo do que aparece em arquiteturas modernas:

```
Route
 ↓
Controller
 ↓
Service / UseCase
 ↓
Repository
 ↓
Banco
```

---

# 20. Como os padrões GRASP se relacionam

Os padrões não devem ser vistos isoladamente.

Normalmente uma decisão de projeto satisfaz vários deles simultaneamente.

Por exemplo:

```
Sale cria Payment
```

Pode ser justificado por:

### Creator

`Sale` possui os dados necessários para criar `Payment`.

### Expert

`Sale` possui informações relacionadas à operação.

### Low Coupling

Evita fazer outro objeto conhecer `Payment` sem necessidade.

### High Cohesion

Mantém a lógica associada à venda próxima da própria venda.

Esse tipo de justificativa é exatamente o que deve ser buscado ao produzir um Diagrama de Comunicação.

---

# 21. Um modo prático de decidir responsabilidades

Ao montar um Diagrama de Comunicação, você pode mentalmente seguir este raciocínio:

```
Preciso realizar uma operação
          ↓
Quem possui as informações necessárias?
          ↓
        Expert
          ↓
Alguém precisa criar um objeto?
          ↓
        Creator
          ↓
Essa escolha cria dependências desnecessárias?
          ↓
     Low Coupling
          ↓
Essa classe está ficando responsável por coisas demais?
          ↓
     High Cohesion
          ↓
Quem recebe o evento vindo da interface?
          ↓
      Controller
```

Esse raciocínio resume grande parte da parte conceitual da aula.

---

# 22. Exemplo da biblioteca apresentado na aula

Ao final, a aula propõe construir um Diagrama de Comunicação para o caso de uso **Emprestar Livros**.

O fluxo fornecido é:

1. O leitor apresenta sua identificação e os livros.
2. O atendente informa a identificação do leitor.
3. O atendente informa os códigos dos livros.
4. A data de devolução é calculada de acordo com o perfil do leitor.
5. Uma transação de empréstimo é criada.
6. Os livros passam para o estado `"emprestado"`.
7. O número de livros emprestados pelo leitor é incrementado.
8. Os dados do empréstimo são apresentados ao atendente. Aula_05_Diagrama_Comunicao_GRASP

Uma possível distribuição conceitual seria:

```
Atendente
    |
    v
EmprestimoController
    |
    v
EmprestimoService
    |
    +----> Leitor
    |
    +----> Livro
    |
    +----> Emprestimo
```

Aplicando os conceitos da aula:

```
EmprestimoController
```

pode seguir **Controller**.

```
Leitor
```

pode ser especialista em informações relacionadas ao seu perfil.

```
Emprestimo
```

pode conhecer seus livros e dados relacionados ao empréstimo.

Quem criar `Emprestimo` deve ser escolhido utilizando o **Creator**, considerando quem possui os dados necessários para inicializá-lo.

Ao mesmo tempo, a escolha deve respeitar:

```
alta coesão
+
baixo acoplamento
```

---

# 23. O que é mais importante memorizar

Para prova ou exercício, eu daria atenção especial a estas relações:

```
Diagrama de Comunicação
→ interação entre objetos por mensagens

Ligação
→ um objeto conhece/tem visibilidade de outro

Mensagem
→ chamada de método

Número de sequência
→ define a ordem das mensagens

1.1, 1.2...
→ mensagens aninhadas

[condição]
→ guarda

*
→ repetição / iteração
```

E, para GRASP:

```
Expert
→ quem possui a informação deve assumir a responsabilidade

Creator
→ quem contém, usa ou possui dados para criar deve criar

Low Coupling
→ minimizar dependências desnecessárias

High Cohesion
→ manter responsabilidades relacionadas dentro da mesma classe

Controller
→ recebe operações vindas da interface e coordena/delega
```

---

# 24. Diferenças que costumam confundir

## Acoplamento vs. Coesão

```
Acoplamento
→ relação ENTRE classes
```

```
Coesão
→ relação ENTRE responsabilidades da MESMA classe
```

Objetivo normalmente desejado:

```
↓ acoplamento
↑ coesão
```

---

## Expert vs. Creator

### Expert

Pergunta:

> Quem deve executar essa responsabilidade?

Resposta:

> Quem possui as informações necessárias.

### Creator

Pergunta:

> Quem deve criar esse objeto?

Resposta:

> Quem contém, utiliza ou possui informações necessárias para inicializá-lo.

---

## Controller vs. Service

### Controller

```
recebe evento/requisição
coordena
converte entrada
delega
```

### Service / Use Case

```
executa o processo de negócio
coordena regras do domínio
manipula entidades
```

Portanto, isto tende a ser problemático:

```
class LoanController {

    public void loanBook() {
        // dezenas de regras de negócio aqui...
    }

}
```

A separação apresentada na aula seria mais próxima de:

```
class LoanController {

    private LoanService service;

    public LoanResponse loan(LoanRequest request) {
        return service.loan(request);
    }
}
```

---

# 25. Resumo final

A ideia central desta matéria pode ser condensada da seguinte forma:

> **O Diagrama de Comunicação mostra quais objetos colaboram e quais mensagens eles trocam para executar uma operação. Os padrões GRASP ajudam a decidir quais desses objetos devem receber cada responsabilidade.**

Um bom projeto deve buscar que:

```
cada responsabilidade
        ↓
esteja no objeto mais apropriado
        ↓
mantendo alta coesão
        +
baixo acoplamento
```

O Diagrama de Comunicação, portanto, não serve apenas para mostrar chamadas de métodos. Ele ajuda a transformar um caso de uso em uma **estrutura de colaboração entre objetos**, enquanto GRASP fornece critérios para que essa colaboração resulte em um projeto mais organizado, compreensível e fácil de manter. Essa é também a síntese apresentada no encerramento da aula: diagramas de comunicação detalham interações na fase de projeto, ligações representam conhecimento entre objetos e a atribuição correta de responsabilidades influencia diretamente a qualidade do sistema. Aula_05_Diagrama_Comunicao_GRASP