---
title: "Refatoração, dívida técnica e code smells"
description: "Como reconhecer problemas de design e aplicar refatorações pequenas sem alterar o comportamento do software."
category: "APOO"
tags: [apoo, refatoracao, divida-tecnica, code-smells, design-de-software]
---

# Refatoração, dívida técnica e code smells

## 1. Ideia central da aula

Um programa pode **atender aos requisitos hoje** e ainda assim ser difícil de modificar amanhã. A aula apresenta três conceitos relacionados:

1. **Dívida técnica:** custo futuro associado a decisões de design que dificultam a manutenção.
2. **Code smell:** sinal observável no código que merece investigação.
3. **Refatoração:** mudança na estrutura interna que preserva o comportamento externo.

O objetivo prático é identificar uma dificuldade concreta, escolher uma transformação pequena e verificar que o sistema continua funcionando antes de avançar para a próxima mudança.

## 2. Dívida técnica: por que uma mudança fica cara?

A metáfora da **dívida técnica** compara uma decisão que acelera a entrega agora com um custo que será pago em mudanças posteriores (slide 4). Prazos curtos, pressão, pouca experiência, ausência de testes e escolhas de design podem contribuir para esse custo. Quando o código exige cada vez mais trabalho para alterações simples, a equipe paga os “juros” da dívida.

> [!example] Exemplo próprio
> Uma regra de desconto foi copiada para três serviços para entregar uma funcionalidade rapidamente. Quando o percentual muda, é necessário localizar e editar três trechos. Se um deles for esquecido, o sistema passa a apresentar resultados divergentes. A duplicação criou custo de manutenção e risco de erro.

Nem toda dívida exige uma reescrita. A decisão depende do impacto atual e provável: uma parte estável e isolada pode custar menos que uma área alterada frequentemente. O slide 4 alerta para situações extremas em que a evolução se torna muito cara, mas isso não torna uma nova versão a resposta automática para todo código difícil.

## 3. Code smells: pistas, não diagnósticos finais

**Code smell** é um sinal de que pode existir um problema de design (slide 5). Ele pede uma pergunta: *qual mudança este trecho dificulta?* Um método longo, por exemplo, pode misturar responsabilidades; mas a quantidade de linhas, sozinha, não prova que uma extração melhorará o código.

Os slides 6–11 organizam os smells em cinco famílias:

| Família | O que observar | Exemplos dos slides |
| --- | --- | --- |
| **Bloaters** | Métodos, classes ou dados que cresceram e ficaram difíceis de entender. | `Long Method`, `Large Class`, `Primitive Obsession`, `Long Parameter List`, `Data Clumps` |
| **Object-orientation Abusers** | Uso incompleto ou inadequado de mecanismos de orientação a objetos. | `Switch Statements`, `Temporary Field`, `Refused Bequest`, classes equivalentes com interfaces diferentes |
| **Change Preventers** | Uma mudança localizada exige alterações em lugares demais. | `Divergent Change`, `Shotgun Surgery`, `Parallel Inheritance Hierarchies` |
| **Dispensables** | Elementos sem contribuição suficiente para o comportamento ou entendimento. | `Duplicate Code`, `Lazy Class`, `Dead Code`, `Speculative Generality` |
| **Couplers** | Conhecimento ou dependência excessiva entre objetos; também pode haver delegação demais. | `Feature Envy`, `Inappropriate Intimacy`, `Message Chains`, `Middle Man` |

### Exemplos que ajudam a reconhecer cada família

- **Bloaters:** um método recebe `rua`, `numero`, `bairro`, `cidade` e `cep` em vários pontos; talvez esses dados formem um `Endereco`. Isso é uma hipótese de `Data Clumps`, a confirmar pelo uso conjunto dos valores.
- **Object-orientation Abusers:** diferentes métodos repetem o mesmo `switch` sobre o tipo de peça para calcular preço, prazo e descrição. Uma nova categoria exige revisar todos os `switch`.
- **Change Preventers:** alterar uma regra de preço exige editar cálculo, exportação e interface em classes espalhadas. Isso se aproxima de `Shotgun Surgery`.
- **Dispensables:** um método privado não é chamado por nenhum fluxo e não é usado por testes ou integração; pode ser `Dead Code`.
- **Couplers:** `pedido.getCliente().getEndereco().getCidade()` atravessa vários objetos para obter um dado; é uma `Message Chain`. A melhor solução depende de quem deveria responder à pergunta.

> [!important] Atenção aos nomes dos smells
> Um comentário que explica **por que** uma regra existe pode ser valioso. Um `switch` curto e isolado pode ser claro. Uma classe de dados pode ser adequada para transporte de informações. Os nomes do catálogo orientam a investigação; não são uma ordem automática para apagar código ou criar abstrações.

Ferramentas como analisadores estáticos e IDEs podem apontar duplicações e outros indícios (slide 5). A decisão de refatorar ainda exige entender o contexto e o comportamento esperado.

## 4. O que é refatoração?

**Refatorar** é melhorar a estrutura interna de um software **sem modificar seu comportamento externo** (slide 12). Para o usuário ou para outro sistema que chama a mesma operação, os resultados e efeitos relevantes continuam os mesmos. Adicionar exportação em HTML, por exemplo, é uma **nova funcionalidade**; extrair o cálculo do preço para um método sem mudar o valor devolvido é uma **refatoração**.

Os slides recomendam separar os passos: primeiro estabelecer que o comportamento atual funciona e está protegido por testes; depois refatorar em mudanças pequenas; por fim implementar o requisito novo. Essa separação ajuda a descobrir se uma falha veio da transformação interna ou da funcionalidade adicionada.

```text
Comportamento conhecido → testes de regressão → pequena refatoração
                    → testes passam → próxima refatoração → nova funcionalidade
```

**Testes de regressão** comparam o comportamento antes e depois. Em código legado, pode ser útil registrar primeiro o comportamento atual com testes de caracterização. Se o comportamento atual está errado, a correção do defeito deve ser identificada separadamente da refatoração.

### Relação entre smell e refatoração

O slide 13 dá dois exemplos: `Long Method` pode sugerir **Extract Method**; `Data Clumps` pode sugerir **Extract Class** ou **Introduce Parameter Object**. A escolha depende da responsabilidade que está confusa, da frequência de mudança e dos testes disponíveis. Não existe uma única refatoração obrigatória para cada smell.

## 5. O catálogo de refatorações da aula

Os slides 14–20 agrupam as transformações em **seis categorias**. Os prints abaixo trazem os nomes usados no material; o texto destaca quando cada grupo pode ajudar.

### Composing Methods: organizar métodos

![[Slide 15 - Composing Methods.png|1000]]

*Slide 15: catálogo de transformações para estruturar métodos, incluindo `Extract Method`, `Inline Method` e `Replace Temp with Query`.*

**Extract Method** retira um bloco com uma responsabilidade identificável e dá a ele um nome. **Inline Method** faz o inverso quando a indireção deixou de ajudar. **Extract Variable** nomeia uma parte complexa de uma expressão. A regra prática é buscar um fluxo de leitura mais claro, não criar o maior número possível de métodos.

### Moving Features Between Objects: atribuir responsabilidades

![[Slide 16 - Moving Features.png|1000]]

*Slide 16: `Move Method`, `Move Field`, `Extract Class`, `Hide Delegate` e outras mudanças entre objetos.*

**Move Method** pode ser útil quando um método usa principalmente dados de outro objeto (`Feature Envy`). **Extract Class** separa responsabilidades que variam por motivos diferentes. **Hide Delegate** pode encurtar uma cadeia de mensagens; **Remove Middle Man** elimina uma classe que só repassa chamadas. Essas duas últimas apontam custos opostos e exigem avaliação do contexto.

### Organizing Data: representar dados com clareza

![[Slide 17 - Organizing Data.png|1000]]

*Slide 17: catálogo para organizar dados, com `Replace Data Value with Object`, `Encapsulate Collection`, `Replace Magic Number with Symbolic Constant` e `Replace Type Code with State/Strategy`.*

Um valor simples pode precisar de um objeto próprio quando há regras associadas a ele. Uma constante com nome pode explicar o significado de um número repetido. A substituição de código de tipo por objetos de estado lembra o [[APOO/Aula11/Diagrama de Estados e Padrão State|padrão State]] estudado na aula anterior: ela faz sentido quando o comportamento muda de acordo com o estado e as condições estão se espalhando.

### Simplifying Conditional Expressions: tornar decisões legíveis

![[Slide 18 - Conditional Expressions.png|1000]]

*Slide 18: alternativas para condicionais, como `Decompose Conditional`, `Replace Nested Conditional with Guard Clauses` e `Replace Conditional with Polymorphism`.*

**Guard clauses** tratam casos de saída antecipada e reduzem aninhamento. **Decompose Conditional** nomeia partes de uma expressão difícil. **Replace Conditional with Polymorphism** desloca decisões entre variantes para implementações diferentes quando existe uma variação de comportamento estável. Uma única condição simples não precisa de polimorfismo.

### Simplifying Method Calls: simplificar a comunicação

![[Slide 19 - Method Calls.png|1000]]

*Slide 19: mudanças na interface dos métodos, incluindo `Rename Method`, `Introduce Parameter Object` e `Separate Query from Modifier`.*

**Rename Method** esclarece a intenção. **Introduce Parameter Object** reúne parâmetros que sempre circulam juntos. **Separate Query from Modifier** separa uma consulta de uma alteração de estado quando misturá-las surpreende o cliente. Mudanças de assinatura podem exigir atualizar os chamadores, mesmo quando o resultado funcional permanece igual.

### Dealing with Generalization: ajustar hierarquias

![[Slide 20 - Generalization.png|1000]]

*Slide 20: catálogo de mudanças em hierarquias, como `Pull Up Method`, `Extract Interface`, `Collapse Hierarchy` e `Replace Inheritance with Delegation`.*

**Pull Up Method** coloca uma implementação realmente comum na superclasse. **Extract Interface** destaca um contrato compartilhado. **Collapse Hierarchy** remove uma divisão que já não traz benefício. Herança e delegação têm custos diferentes; a escolha depende da relação entre os objetos e de como as variantes mudam. O slide repete `Pull Up Constructor Body` em duas células; trata-se de um único nome de refatoração.

## 6. Code smells e refatorações em Java: antes e depois

Os exemplos a seguir são **originais e didáticos**, inspirados nas relações entre problema e técnica apresentadas nos slides e no [catálogo de smells do Refactoring.Guru](https://refactoring.guru/refactoring/smells). Usam recursos do **Java 17 ou mais recente**, como `record` e expressões `switch`. Cada par mostra o mesmo comportamento para as entradas citadas; algumas classes auxiliares e importações foram omitidas. Os valores de locação são inventados e **não representam os preços do exercício da aula**. Ao aplicar a técnica em um projeto real, é preciso conferir todos os chamadores e executar os testes após cada passo.

| Família do slide | Sinal no código | Refatoração ilustrada abaixo |
| --- | --- | --- |
| Bloaters | Método com etapas misturadas; parâmetros que sempre aparecem juntos. | `Extract Method`; `Introduce Parameter Object` |
| Object-orientation Abusers | Vários `switch` sobre a mesma categoria. | `Replace Conditional with Polymorphism` |
| Change Preventers | Uma regra espalhada exige editar várias classes. | Concentrar a regra em uma classe e mover os chamadores |
| Dispensables | Mesmo trecho copiado em dois métodos. | `Extract Method` |
| Couplers | Método depende dos dados de outro objeto; cadeia de getters. | `Move Method`; `Hide Delegate` |

### 6.1 `Long Method` → `Extract Method`

**Problema:** o método calcula a diária, multiplica pelos dias e monta o texto. Quando a regra de preço cresce, fica difícil localizar cada responsabilidade. O [catálogo de `Long Method`](https://refactoring.guru/smells/long-method) sugere extrair blocos com uma intenção clara.

**Antes:**

```java
String resumo(Categoria categoria, int dias) {
    double diaria;
    if (categoria == Categoria.LANCAMENTO) {
        diaria = 30;
    } else if (categoria == Categoria.REMANUFATURADA) {
        diaria = 12;
    } else {
        diaria = 20;
    }
    double total = diaria * dias;
    return "Diária: " + diaria + "; total: " + total;
}
```

**Depois:** `resumo` descreve o fluxo, e `diariaDa` concentra a escolha do preço.

```java
String resumo(Categoria categoria, int dias) {
    double diaria = diariaDa(categoria);
    return "Diária: " + diaria + "; total: " + (diaria * dias);
}

private double diariaDa(Categoria categoria) {
    if (categoria == Categoria.LANCAMENTO) return 30;
    if (categoria == Categoria.REMANUFATURADA) return 12;
    return 20;
}
```

**Confira:** `resumo(LANCAMENTO, 2)` continua produzindo `Diária: 30.0; total: 60.0`. A condição por categoria ainda existe: extrair o método é **um passo**, não a solução automática para todo `switch`. Fonte da técnica: [Extract Method](https://refactoring.guru/extract-method).

### 6.2 `Data Clumps` e `Long Parameter List` → `Introduce Parameter Object`

**Problema:** `rua`, `numero`, `cidade` e `uf` viajam juntos entre métodos. Repetir essa lista aumenta a chance de trocar argumentos de mesma forma e dificulta adicionar uma informação ao endereço. O [catálogo de `Data Clumps`](https://refactoring.guru/smells/data-clumps) propõe um objeto quando o grupo tem significado próprio.

**Antes:**

```java
String etiqueta(String rua, int numero, String cidade, String uf) {
    return rua + ", " + numero + " - " + cidade + "/" + uf;
}

boolean entregaLocal(String rua, int numero, String cidade, String uf) {
    return cidade.equals("São Carlos") && uf.equals("SP");
}
```

**Depois:** os métodos recebem um `Endereco` imutável. Nenhuma validação nova foi adicionada ao `record`, pois isso mudaria o comportamento desta etapa.

```java
record Endereco(String rua, int numero, String cidade, String uf) {}

String etiqueta(Endereco endereco) {
    return endereco.rua() + ", " + endereco.numero()
        + " - " + endereco.cidade() + "/" + endereco.uf();
}

boolean entregaLocal(Endereco endereco) {
    return endereco.cidade().equals("São Carlos")
        && endereco.uf().equals("SP");
}
```

**Confira:** para `new Endereco("Rua A", 10, "São Carlos", "SP")`, a etiqueta continua `Rua A, 10 - São Carlos/SP` e `entregaLocal` continua `true`. A assinatura mudou; os chamadores devem passar o novo objeto, ou uma API pública deve manter um adaptador temporário. Fonte da técnica: [Introduce Parameter Object](https://refactoring.guru/introduce-parameter-object).

### 6.3 `Switch Statements` → `Replace Conditional with Polymorphism`

**Problema:** a mesma decisão sobre `Categoria` aparece em mais de uma operação. Adicionar uma categoria exigiria localizar todos os `switch`. Isso é o sinal descrito em [`Switch Statements`](https://refactoring.guru/smells/switch-statements), especialmente quando as variantes têm comportamentos distintos.

**Antes:**

```java
enum Categoria { PADRAO, LANCAMENTO, REMANUFATURADA }

double diaria(Categoria categoria) {
    return switch (categoria) {
        case PADRAO -> 20;
        case LANCAMENTO -> 30;
        case REMANUFATURADA -> 12;
    };
}

double multaPorDia(Categoria categoria) {
    return switch (categoria) {
        case PADRAO -> 5;
        case LANCAMENTO -> 8;
        case REMANUFATURADA -> 3;
    };
}
```

**Depois:** cada constante implementa os dois comportamentos da sua categoria; os chamadores pedem a operação ao objeto.

```java
enum Categoria {
    PADRAO {
        double diaria() { return 20; }
        double multaPorDia() { return 5; }
    },
    LANCAMENTO {
        double diaria() { return 30; }
        double multaPorDia() { return 8; }
    },
    REMANUFATURADA {
        double diaria() { return 12; }
        double multaPorDia() { return 3; }
    };

    abstract double diaria();
    abstract double multaPorDia();
}

double total(Categoria categoria, int dias) {
    return categoria.diaria() * dias;
}
```

**Confira:** `total(LANCAMENTO, 2)` continua `60.0`, e a multa por dia continua `8.0`. Se existe só um `switch` simples, a troca pode acrescentar complexidade sem benefício. Para estados que mudam durante a execução, veja também a [[APOO/Aula11/Diagrama de Estados e Padrão State|aula de State]]. Fonte da técnica: [Replace Conditional with Polymorphism](https://refactoring.guru/replace-conditional-with-polymorphism).

### 6.4 `Shotgun Surgery` → concentrar a regra que muda junto

**Problema:** o mesmo desconto é calculado em várias classes. Alterar o percentual exige várias edições; esquecer uma faz checkout e relatório discordarem. O sinal de [`Shotgun Surgery`](https://refactoring.guru/smells/shotgun-surgery) é **uma única mudança de regra espalhada por várias classes**.

**Antes:**

```java
class Checkout {
    double total(double subtotal) { return subtotal * 0.90; }
}

class Relatorio {
    double total(double subtotal) { return subtotal * 0.90; }
}
```

**Depois:** uma classe é dona da regra e os dois pontos de uso a chamam.

```java
class PoliticaDesconto {
    double aplicar(double subtotal) { return subtotal * 0.90; }
}

class Checkout {
    private final PoliticaDesconto politica = new PoliticaDesconto();
    double total(double subtotal) { return politica.aplicar(subtotal); }
}

class Relatorio {
    private final PoliticaDesconto politica = new PoliticaDesconto();
    double total(double subtotal) { return politica.aplicar(subtotal); }
}
```

**Confira:** os dois métodos continuam devolvendo `90.0` para `100.0`. A próxima alteração na regra fica em `PoliticaDesconto`. Em código real, confirme primeiro que os dois percentuais representam **a mesma regra de negócio**, pois valores iguais por acaso não precisam ser unidos.

### 6.5 `Duplicate Code` → `Extract Method`

**Problema:** a mesma construção de texto foi copiada dentro de uma classe. Se o formato do identificador mudar, será preciso lembrar dos dois locais. Para duplicação dentro da mesma classe, o [Refactoring.Guru sugere `Extract Method`](https://refactoring.guru/smells/duplicate-code).

**Antes:**

```java
String email(int id, String cliente) {
    String cabecalho = "Pedido #" + id + " de " + cliente;
    return cabecalho + " enviado por e-mail";
}

String sms(int id, String cliente) {
    String cabecalho = "Pedido #" + id + " de " + cliente;
    return cabecalho + " enviado por SMS";
}
```

**Depois:** cada canal mantém sua parte específica e compartilha apenas o cabeçalho.

```java
String email(int id, String cliente) {
    return cabecalho(id, cliente) + " enviado por e-mail";
}

String sms(int id, String cliente) {
    return cabecalho(id, cliente) + " enviado por SMS";
}

private String cabecalho(int id, String cliente) {
    return "Pedido #" + id + " de " + cliente;
}
```

**Confira:** `email(7, "Ana")` ainda devolve `Pedido #7 de Ana enviado por e-mail`; `sms(7, "Ana")` continua terminando em `SMS`. Uma extração desse tipo preserva as partes que diferem.

### 6.6 `Feature Envy` → `Move Method`

**Problema:** `Relatorio` conhece os pontos do cliente e decide o desconto a partir deles, embora a decisão use apenas dados de `Cliente`. Esse é o caso típico de [`Feature Envy`](https://refactoring.guru/smells/feature-envy).

**Antes:**

```java
class Relatorio {
    double percentualDesconto(Cliente cliente) {
        return cliente.pontos() >= 100 ? 0.10 : 0.0;
    }
}
```

**Depois:** a decisão fica junto dos dados usados por ela.

```java
class Cliente {
    private final int pontos;

    Cliente(int pontos) { this.pontos = pontos; }

    double percentualDesconto() {
        return pontos >= 100 ? 0.10 : 0.0;
    }
}

class Relatorio {
    double percentualDesconto(Cliente cliente) {
        return cliente.percentualDesconto();
    }
}
```

**Confira:** clientes com `99` e `100` pontos continuam recebendo `0.0` e `0.10`, respectivamente. A delegação em `Relatorio` pode ser mantida enquanto houver chamadores do método antigo; depois, ela pode ser removida se não fizer mais falta. Fonte da técnica: [Move Method](https://refactoring.guru/move-method).

### 6.7 `Message Chains` → `Hide Delegate`

**Problema:** a camada que monta a etiqueta navega pelo cliente e pelo endereço para descobrir a cidade. Se essa estrutura interna mudar, muitos chamadores podem precisar de edição. Veja [`Message Chains`](https://refactoring.guru/smells/message-chains).

**Antes:**

```java
String cidade = pedido.getCliente().getEndereco().getCidade();
```

**Depois:** `Pedido` oferece a informação relevante para esse uso.

```java
// No chamador:
String cidade = pedido.cidadeDeEntrega();

// Em Pedido:
String cidadeDeEntrega() {
    return cliente.getEndereco().getCidade();
}
```

**Confira:** a cidade retornada é a mesma. Só adote `cidadeDeEntrega` se o endereço do cliente for, de fato, o endereço usado na entrega; o nome do método deve refletir a regra real. Fonte da técnica: [Hide Delegate](https://refactoring.guru/hide-delegate).

### 6.8 Condicionais aninhadas → `Replace Nested Conditional with Guard Clauses`

**Antes:** o caminho principal fica escondido dentro de dois `if`.

```java
String status(Pedido pedido) {
    if (pedido != null) {
        if (pedido.pago()) {
            return "Pronto para envio";
        } else {
            return "Aguardando pagamento";
        }
    } else {
        return "Pedido ausente";
    }
}
```

**Depois:** os casos de saída antecipada aparecem primeiro.

```java
String status(Pedido pedido) {
    if (pedido == null) return "Pedido ausente";
    if (!pedido.pago()) return "Aguardando pagamento";
    return "Pronto para envio";
}
```

**Confira:** `null`, pedido não pago e pedido pago continuam produzindo, nessa ordem, `Pedido ausente`, `Aguardando pagamento` e `Pronto para envio`. Essa técnica melhora a leitura sem criar classes novas. Fonte: [Replace Nested Conditional with Guard Clauses](https://refactoring.guru/replace-nested-conditional-with-guard-clauses).

## 7. Exercícios propostos nos slides

### Exercício I: locação de ferramentas (slide 22)

O sistema permite alugar várias ferramentas por períodos diferentes. Há peças **padrão**, **lançamento** e **remanufaturadas**; o preço depende da categoria e dos dias. Já existe exportação do sumário em texto plano, e um novo cliente pede **HTML**. A proposta é clonar o sistema indicado na aula, identificar fragilidades, refatorar em passos sucessivos e fazer **um commit por refatoração**.

Um roteiro para trabalhar no repositório do exercício é: caracterizar com testes o cálculo e o texto atual; localizar a lógica de preço e de formatação; escolher uma mudança interna por vez; executar os testes e registrar cada passo; só então adicionar a saída HTML e testá-la. **A exportação HTML é uma funcionalidade nova**, portanto seu commit deve ficar distinguível dos commits de refatoração. A aula não fornece o código-fonte nesse PDF, então não é possível afirmar quais classes concretas precisam mudar apenas pelo enunciado.

### Exercício II: bot de Truco (slide 23)

O exercício pede obter a última versão do CTruco e revisar o bot `com.aah.refactor.me.RefactorMePleaseBot`. O colega já criou testes; a tarefa é melhorar o design com refatorações sucessivas, **executando todos os casos de teste após cada passo** para confirmar que o comportamento externo não mudou.

Uma sequência de investigação é: ler os testes e identificar decisões repetidas, métodos longos ou responsabilidades misturadas; selecionar uma transformação pequena; rodar a suíte; comparar o comportamento; registrar a alteração. O enunciado não inclui o código do bot, então qualquer diagnóstico específico de classe ou solução pronta sem abrir esse projeto seria uma suposição.

## 8. Revisão rápida

- Dívida técnica é o **custo de evolução** associado a decisões anteriores.
- Code smells são **pistas** de problemas de design, não provas automáticas de defeito.
- Refatoração altera a **estrutura interna** e preserva o **comportamento externo**.
- Testes de regressão e passos pequenos ajudam a detectar mudanças acidentais.
- Um smell pode ter várias refatorações possíveis; escolha conforme a responsabilidade e a mudança que precisa ficar mais fácil.
- No exercício das ferramentas, **refatorar** o design e **adicionar HTML** são passos com objetivos diferentes.

**Fonte da aula:** PDF “Aula 10 — Refactoring”, slides 1–24, Prof. Dr. Lucas Bueno R. Oliveira, IFSP, câmpus São Carlos. Os exemplos de código e os roteiros dos exercícios nesta nota são elaborados para estudo; os prints e a lista do catálogo vêm dos slides.
