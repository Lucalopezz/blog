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

## 6. Exemplos próprios em Java: antes e depois

Os exemplos abaixo foram criados para estudar as técnicas. São **fragmentos didáticos**; os tipos auxiliares foram omitidos para destacar a transformação. Em cada par, a intenção é manter o mesmo resultado para as mesmas entradas.

### Extract Method para um cálculo difícil de ler

**Antes:** uma operação mistura a escolha do valor diário com o cálculo final.

```java
double total(Categoria categoria, int dias) {
    double diaria;
    if (categoria == Categoria.LANCAMENTO) diaria = 30;
    else if (categoria == Categoria.REMANUFATURADA) diaria = 12;
    else diaria = 20;
    return diaria * dias;
}
```

**Depois:** a regra da diária ganha um nome; para cada categoria e quantidade de dias, `total` devolve o mesmo valor.

```java
double total(Categoria categoria, int dias) {
    return diariaDa(categoria) * dias;
}

private double diariaDa(Categoria categoria) {
    if (categoria == Categoria.LANCAMENTO) return 30;
    if (categoria == Categoria.REMANUFATURADA) return 12;
    return 20;
}
```

O `switch`/`if` por categoria **ainda existe**. Esta etapa reorganiza o método; substituir condicionais por polimorfismo seria outra decisão, a avaliar e testar separadamente. Os números são apenas dados inventados para o exemplo, não preços do exercício da aula.

### Introduce Parameter Object para dados que andam juntos

**Antes:** várias operações internas recebem as mesmas partes de um período:

```java
int dias(LocalDate inicio, LocalDate fim) {
    return (int) ChronoUnit.DAYS.between(inicio, fim);
}
```

**Depois:** um tipo representa o período e mantém o cálculo:

```java
record Periodo(LocalDate inicio, LocalDate fim) {
    int dias() {
        return (int) ChronoUnit.DAYS.between(inicio, fim);
    }
}
```

O resultado continua igual se `inicio` e `fim` forem os mesmos. A criação de `Periodo` só se justifica quando esse conjunto aparece repetidamente e possui significado no domínio. Ajustar quem chama o método faz parte da mudança de assinatura.

### Guard clauses para reduzir aninhamento

**Antes:**

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

**Depois:** os casos especiais terminam cedo; as três saídas continuam iguais.

```java
String status(Pedido pedido) {
    if (pedido == null) return "Pedido ausente";
    if (!pedido.pago()) return "Aguardando pagamento";
    return "Pronto para envio";
}
```

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
