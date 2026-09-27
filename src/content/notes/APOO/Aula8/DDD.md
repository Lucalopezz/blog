# Resumo — Domain-Driven Design (DDD)

## 1. Visão geral do DDD

O **Domain-Driven Design (DDD)** é um conjunto de princípios para desenvolver sistemas cujo projeto seja centrado no **domínio de negócio**, isto é, no problema real que o software precisa resolver. 

A ideia principal é que o software não deve ser modelado primeiro pensando em:

* framework;
* banco de dados;
* arquitetura;
* linguagem de programação;
* detalhes de infraestrutura.

O foco inicial deve ser o **negócio** e suas regras.

Por isso, no DDD, os desenvolvedores precisam adquirir conhecimento profundo sobre o domínio. Esse conhecimento é obtido por meio de conversas frequentes com os **especialistas do domínio**, ou seja, pessoas que conhecem o negócio que está sendo informatizado. 

### Quando o DDD é especialmente útil?

O material destaca que ele é vantajoso principalmente em sistemas de **média e grande complexidade**, nos quais as regras de negócio são difíceis de compreender e gerenciar. 

Em um sistema muito simples, a aplicação rigorosa de todos os conceitos de DDD pode não trazer o mesmo benefício.

---

# 2. Linguagem Ubíqua

A **Linguagem Ubíqua** (*Ubiquitous Language*) é um dos fundamentos centrais do DDD.

Ela consiste em estabelecer um conjunto comum de termos e conceitos que devem ser compreendidos e utilizados tanto por:

* desenvolvedores;
* analistas;
* especialistas do domínio.

O objetivo é que todos estejam literalmente **falando a mesma língua** ao discutir o sistema. 

Essa linguagem não deve aparecer apenas nas reuniões ou documentação. Ela também deve ser refletida diretamente no código.

Segundo o material, os termos da linguagem ubíqua devem ser utilizados nos nomes de:

* classes;
* métodos;
* atributos;
* pacotes;
* módulos;
* tabelas;
* documentos do banco de dados;
* rotas de APIs;
* microsserviços. 

### Exemplo

Suponha um sistema acadêmico.

Se os especialistas utilizam os termos:

```text
Aluno
Matrícula
Disciplina
Turma
Trancamento
```

o software deveria refletir esses mesmos conceitos:

```java
class Aluno
class Matricula
class Disciplina
class Turma
```

em vez de utilizar nomes genéricos ou puramente técnicos como:

```java
UserData
RegistrationObject
SubjectManager
```

A ideia é diminuir a distância entre o **modelo mental do negócio** e o **modelo implementado no software**.

---

# 3. Model-Driven Design

O DDD busca criar um modelo profundamente conectado ao domínio do negócio.

Esse modelo precisa então ser transformado em código.

O material destaca justamente uma dificuldade importante:

> compreender o domínio não é suficiente; é necessário conseguir expressá-lo adequadamente no código.

Por isso, a colaboração entre analistas e desenvolvedores durante a modelagem é importante para evitar uma grande diferença entre o modelo criado e a implementação real. 

O conteúdo também associa o DDD à **Programação Orientada a Objetos**, por ela oferecer um bom suporte para representar os conceitos do domínio. 

---

# 4. Blocos de construção do DDD

O material apresenta diversos elementos utilizados para expressar o modelo de domínio:

* Arquitetura em camadas;
* Entidades;
* Objetos de Valor;
* Serviços;
* Eventos de Domínio;
* Módulos;
* Agregados;
* Fábricas;
* Repositórios;
* Serviços de Aplicação.

Esses elementos trabalham juntos para criar uma representação organizada do domínio. 

---

# 5. Arquitetura em Camadas

Nem tudo que existe em um sistema pertence ao domínio.

Também existem aspectos relacionados a:

* interface;
* banco de dados;
* comunicação externa;
* infraestrutura;
* bibliotecas;
* detalhes técnicos.

Misturar essas partes diretamente com as regras de negócio aumenta o acoplamento, dificulta a compreensão e prejudica os testes. 

Por isso, o material divide o sistema em quatro camadas principais.

## 5.1 Apresentação

Responsável pela interação com o usuário.

Exemplos:

```text
Controllers
Views
Interfaces Web
Endpoints
```

Sua função é fornecer informações ao usuário e interpretar seus comandos. 

---

## 5.2 Aplicação

Coordena as ações executadas pelo sistema.

Ela organiza um caso de uso, mas **não deve conter as regras principais do negócio**.

Por exemplo:

```text
Cadastrar aluno
Realizar matrícula
Finalizar pedido
Criar conta
```

O serviço de aplicação coordena os objetos necessários para executar essas ações. 

---

## 5.3 Domínio

É a camada central para o DDD.

Nela ficam:

* regras de negócio;
* entidades;
* objetos de valor;
* agregados;
* serviços de domínio;
* eventos de domínio.

A camada de domínio deve ser independente dos detalhes técnicos. 

---

## 5.4 Infraestrutura

Responsável por detalhes técnicos utilizados pelas demais camadas.

Exemplos:

```text
Banco de dados
ORM
HTTP
Mensageria
E-mail
APIs externas
Persistência
```

Ela deve apoiar as demais camadas sem contaminar o domínio com preocupações técnicas. 

---

# 6. Entidades

Uma **Entidade** é um objeto definido principalmente por sua **identidade única**.

Duas entidades podem possuir exatamente os mesmos atributos e ainda assim serem objetos diferentes porque possuem identificadores diferentes. 

Exemplo:

```text
Cliente A
id = 123
nome = Lucas

Cliente B
id = 456
nome = Lucas
```

Mesmo possuindo o mesmo nome, são clientes diferentes.

### Características importantes

A identidade deve:

* ser única;
* permanecer a mesma durante todo o ciclo de vida da entidade.

A entidade, por outro lado, pode alterar seu estado.

Exemplos dados no material: 

| Entidade | Possível identidade           |
| -------- | ----------------------------- |
| Produto  | SKU ou ID                     |
| Usuário  | CPF, e-mail, username ou UUID |
| Partida  | UUID ou ID do banco           |

---

## 6.1 Exemplo de entidade

O material apresenta uma classe `Customer`:

```java
public class Customer {

    private final UUID id;
    private String name;

    public Customer(String name) {
        this.id = UUID.randomUUID();
        setName(name);
    }

    public void setName(String name) {
        Objects.requireNonNull(name);

        if (name.isBlank()) {
            throw new IllegalArgumentException();
        }

        this.name = name;
    }
}
```

Um ponto fundamental é que:

```java
private final UUID id;
```

a identidade não é modificada posteriormente.

Além disso, `equals()` e `hashCode()` utilizam a identidade da entidade, e não necessariamente todos os seus atributos. 

Conceitualmente:

```java
customer1.equals(customer2)
```

depende do:

```java
customer1.id == customer2.id
```

---

# 7. Objetos de Valor

Um **Objeto de Valor** (*Value Object*) é diferente de uma entidade.

Ele **não possui identidade própria**.

O que define um objeto de valor é exclusivamente o seu **estado**, isto é, os valores contidos nos seus atributos. 

Por exemplo:

```text
Endereco(
    cidade = "São Carlos",
    estado = "SP",
    rua = "X",
    numero = "100"
)
```

Se dois endereços possuem exatamente esses mesmos valores, eles podem ser considerados equivalentes.

---

## 7.1 Entidade × Objeto de Valor

Essa distinção é extremamente importante:

| Entidade                    | Objeto de Valor            |
| --------------------------- | -------------------------- |
| Possui identidade           | Não possui identidade      |
| Comparada pela identidade   | Comparado pelo estado      |
| Pode mudar durante sua vida | Preferencialmente imutável |
| Ex.: Cliente                | Ex.: Endereço              |
| Ex.: Pedido                 | Ex.: Dinheiro              |
| Ex.: Produto                | Ex.: E-mail                |

---

# 8. Imutabilidade dos Objetos de Valor

Como os objetos de valor são definidos pelo estado, o material recomenda que sejam **imutáveis**. 

Assim, depois de criado:

```java
Address address = new Address(...);
```

seus valores não deveriam ser alterados.

Em vez de:

```java
address.setCity("São Paulo");
```

deveria ser criado outro objeto:

```java
Address newAddress = new Address(
    "São Paulo",
    state,
    street,
    number
);
```

Consequentemente, um objeto de valor precisa nascer válido.

---

# 9. Validação nos Objetos de Valor

O exemplo de `Address` apresentado no material valida seus valores no próprio construtor:

```java
public Address(
    String city,
    String state,
    String street,
    String number
) {

    if (!isValid(city, state, street, number)) {
        throw new IllegalArgumentException("Invalid values.");
    }

    this.city = city;
    this.state = state;
    this.street = street;
    this.number = number;
}
```

Isso impede a existência de um:

```text
Address inválido
```

dentro do sistema. 

---

# 10. Comparação de Objetos de Valor

Como eles não possuem identidade, o método `equals()` deve comparar seus atributos.

Exemplo apresentado:

```java
@Override
public boolean equals(Object o) {

    if (this == o)
        return true;

    if (o == null || getClass() != o.getClass())
        return false;

    Address address = (Address) o;

    return Objects.equals(city, address.city)
        && Objects.equals(state, address.state)
        && Objects.equals(street, address.street)
        && Objects.equals(number, address.number);
}
```

O `hashCode()` também é baseado no estado. 

---

# 11. Objetos de Valor com `record`

O material também mostra que o `record` do Java é bastante adequado para objetos de valor.

Exemplo:

```java
public record Address(
    String city,
    String state,
    String street,
    String number
) {

    public Address {

        if (!isValid(city, state, street, number)) {
            throw new IllegalArgumentException("Invalid values.");
        }
    }
}
```

O `record` já fornece implicitamente funcionalidades como:

```text
equals()
hashCode()
toString()
getters/acessores
```

o que combina bem com a ideia de objetos de valor imutáveis. 

---

# 12. Vantagens dos Objetos de Valor

O material apresenta várias vantagens de utilizar objetos de valor em vez de depender excessivamente de tipos primitivos. 

### 1. Imutabilidade

Os dados não são alterados depois da criação.

### 2. Restrição dos valores possíveis

Um objeto pode garantir suas próprias regras.

Por exemplo:

```java
Email email = new Email("teste@gmail.com");
```

A classe `Email` pode garantir que o conteúdo seja sempre válido.

### 3. Centralização da validação

Sem objeto de valor:

```java
if (!email.contains("@")) ...
```

essa validação pode se repetir em diversos lugares.

Com um `Email`:

```java
new Email(value);
```

a validação fica concentrada em um único ponto.

### 4. Legibilidade

Compare:

```java
void register(String email)
```

com:

```java
void register(Email email)
```

O segundo deixa o significado mais explícito.

### 5. Tipagem mais forte

Considere:

```java
send(String from, String to)
```

É possível trocar os parâmetros por engano.

Objetos específicos tornam esse tipo de erro menos provável.

### 6. Maior consistência

Como objetos inválidos não podem ser criados, diminui-se a possibilidade de colocar entidades ou agregados em estados inconsistentes.

---

# 13. Serviços de Domínio

Um **Serviço de Domínio** representa uma operação importante do negócio que não pertence naturalmente a uma entidade nem a um objeto de valor. 

Ele normalmente é:

* sem estado;
* relacionado diretamente às regras de negócio;
* capaz de receber entidades ou objetos de valor como parâmetros;
* incapaz de armazená-los permanentemente como atributos.

Exemplos fornecidos no conteúdo:

* conversão de texto em um blog;
* moderação de posts;
* aplicação de preços promocionais a produtos. 

### Exemplo conceitual

```java
public class PromotionService {

    public Money calculateDiscount(
        Customer customer,
        Product product
    ) {
        ...
    }
}
```

A regra depende de vários objetos e não pertence claramente apenas ao `Customer` nem somente ao `Product`.

---

# 14. Eventos de Domínio

Um **Evento de Domínio** representa algo significativo que **já aconteceu** no domínio. 

Por isso, seus nomes normalmente aparecem no passado:

```text
ConsultaAgendada
ConsultaCancelada
AtendimentoFinalizado

InvestimentoRealizado
AgendamentoEfetivado
LimiteUtilizado
```

Os eventos podem ser utilizados para:

* auditoria;
* registrar alterações significativas;
* iniciar ações posteriores;
* comunicar módulos;
* executar processos assíncronos;
* permitir processamento paralelo. 

### Exemplo

Imagine:

```text
PedidoFinalizado
```

Esse evento poderia provocar:

```text
PedidoFinalizado
      |
      +--> emitir nota fiscal
      |
      +--> enviar e-mail
      |
      +--> atualizar estoque
      |
      +--> iniciar entrega
```

Assim, os componentes não precisam estar diretamente acoplados uns aos outros.

---

# 15. Módulos

Em sistemas de médio ou grande porte, o domínio pode ser dividido em **módulos** para diminuir a complexidade. 

Um módulo deve reunir classes que:

* são relacionadas;
* trabalham juntas;
* possuem responsabilidades semelhantes.

O objetivo é:

```text
alta coesão dentro do módulo
+
baixo acoplamento entre módulos
```

Os módulos também devem refletir a linguagem do domínio.

Em vez de algo genérico:

```text
utils
managers
helpers
services2
models
```

um sistema poderia possuir módulos mais significativos como:

```text
pedido
pagamento
cliente
estoque
entrega
```

Isso faz com que a estrutura do sistema ajude a **contar a história do domínio**. 

---

# 16. Agregados

Um **Agregado** é um conjunto de objetos relacionados que deve ser tratado como uma única unidade em relação às mudanças de estado. 

Existe um limite claro:

```text
┌────────── Agregado ──────────┐
│                              │
│      Aggregate Root          │
│            |                 │
│        Entidade              │
│        /       \             │
│ Value Object  Entidade       │
│                              │
└──────────────────────────────┘
```

---

# 17. Aggregate Root

Todo agregado possui uma **raiz do agregado** (*Aggregate Root*).

Ela é a entidade responsável por controlar o acesso ao restante do agregado. 

O material determina que:

* a raiz é a entidade acessível externamente;
* ela mantém as invariantes do agregado;
* objetos internos são manipulados por meio dela;
* se a raiz desaparecer, os elementos internos também deixam de existir;
* entidades internas podem possuir identidade apenas local;
* apenas a raiz deve manter referências à identidade de outro agregado. 

---

# 18. Exemplo de agregado `Customer`

O material apresenta algo semelhante a:

```text
Customer <<AggregateRoot>>
│
├── Address
├── PhoneNumber
└── Email
```

O `Customer` funciona como raiz.

Os outros objetos fazem parte do agregado. 

Uma possível representação:

```java
public class Customer {

    private final UUID id;

    private String name;

    private Address address;

    private PhoneNumber phone;

    private Email email;
}
```

O exemplo também mostra uma vantagem dos objetos de valor:

```java
Customer(
    String name,
    Address address,
    PhoneNumber number,
    Email email
)
```

Como `Address`, `PhoneNumber` e `Email` são tipos diferentes, torna-se impossível passar um `Email` no parâmetro de `Address` por engano. 

---

# 19. Invariantes

Um conceito importante relacionado aos agregados é o de **invariante**.

Uma invariante é uma condição que precisa permanecer verdadeira para o agregado continuar em um estado válido.

Por exemplo, em um pedido:

```text
quantidade > 0
total >= 0
pedido finalizado não pode receber novo item
```

A Aggregate Root deve proteger essas regras.

Em vez de permitir:

```java
pedido.getItems().add(item);
```

o modelo poderia disponibilizar:

```java
pedido.addItem(item);
```

Assim, `Pedido` controla as alterações e consegue garantir suas regras.

Isso corresponde ao papel da raiz descrito no material: garantir o limite de consistência e as invariantes do conjunto de objetos. 

---

# 20. Fábricas

Uma **Fábrica** encapsula o processo de criação de objetos complexos. 

Ela é particularmente útil para a criação de agregados.

Isso ocorre porque a criação de um agregado deve ser **atômica**:

> todos os objetos necessários precisam ser criados e relacionados corretamente.

A fábrica esconde essa complexidade do restante da aplicação.

### Exemplo

Em vez de:

```java
Customer customer = new Customer(...);
Address address = new Address(...);
PhoneNumber phone = new PhoneNumber(...);
Email email = new Email(...);

customer.setAddress(address);
customer.setPhone(phone);
customer.setEmail(email);
```

poderia existir:

```java
Customer customer =
    customerFactory.create(data);
```

---

## 20.1 Padrões relacionados

O material cita como possibilidades para implementar fábricas: 

```text
Factory Method
Abstract Factory
Builder
```

Além disso, a própria Aggregate Root pode possuir métodos fábrica.

---

# 21. Repositórios

Um **Repositório** abstrai a forma como objetos do domínio são armazenados e recuperados. 

Para o domínio, a ideia deve parecer aproximadamente uma coleção:

```java
repository.save(customer);

repository.findById(id);

repository.remove(customer);
```

O domínio não precisa saber se os dados estão em:

```text
PostgreSQL
MySQL
MongoDB
arquivo
memória
API externa
```

---

## 21.1 Interface no domínio, implementação na infraestrutura

O material faz uma separação importante.

A abstração pode pertencer ao domínio:

```java
public interface CustomerRepository {

    void save(Customer customer);

    Optional<Customer> findById(UUID id);
}
```

Enquanto a implementação concreta fica na infraestrutura:

```java
public class JpaCustomerRepository
        implements CustomerRepository {
    ...
}
```

Dessa maneira:

```text
Domínio
    ↓
CustomerRepository

Infraestrutura
    ↓
JpaCustomerRepository
    ↓
Banco de Dados
```

O domínio permanece desacoplado do mecanismo de persistência. 

---

# 22. Repositório e agregado

Uma regra apresentada na aula é:

> via de regra, existe um repositório para cada agregado.

Isso ocorre porque o agregado deve ser tratado como uma unidade de consistência. 

Por exemplo, se temos:

```text
Pedido <<AggregateRoot>>
├── ItemPedido
├── EnderecoEntrega
└── Pagamento
```

provavelmente teríamos:

```java
PedidoRepository
```

e não:

```text
ItemPedidoRepository
EnderecoEntregaRepository
```

para objetos internos do agregado.

---

# 23. Serviços de Aplicação

Os **Serviços de Aplicação** também podem ser entendidos como implementações dos **casos de uso** do sistema. 

Eles são responsáveis por **orquestrar**:

* objetos do domínio;
* repositórios;
* infraestrutura;
* execução de um caso de uso.

Entretanto:

> eles não devem implementar as regras centrais do negócio.

Essas regras continuam pertencendo ao domínio. 

---

## 23.1 Exemplo

Imagine:

```text
CadastrarCliente
```

Um serviço poderia fazer:

```java
public class CustomerService {

    private final CustomerRepository repository;
    private final CustomerFactory factory;

    public void registerCustomer(CustomerData data) {

        Customer customer =
            factory.create(data);

        repository.save(customer);
    }
}
```

Observe as responsabilidades:

```text
CustomerService
    ↓
orquestra o caso de uso

CustomerFactory
    ↓
cria o agregado

Customer
    ↓
garante suas regras

CustomerRepository
    ↓
persiste o agregado
```

A sequência apresentada no diagrama da aula segue justamente essa lógica: cliente → serviço → fábrica → entidade → repositório → banco de dados. 

---

# 24. Serviço de Domínio × Serviço de Aplicação

Essa diferença é especialmente importante.

| Serviço de Domínio           | Serviço de Aplicação                 |
| ---------------------------- | ------------------------------------ |
| Pertence ao domínio          | Pertence à camada de aplicação       |
| Implementa regra de negócio  | Orquestra casos de uso               |
| Trabalha com entidades e VOs | Coordena domínio + infraestrutura    |
| Não representa fluxo externo | Representa uma operação da aplicação |
| Não guarda estado            | Normalmente também não guarda estado |

### Exemplo

Regra:

> calcular o preço promocional de produtos.

Pode ser um:

```text
PricingDomainService
```

Caso de uso:

> usuário finaliza uma compra.

Pode ser:

```text
CheckoutApplicationService
```

O segundo utiliza os objetos e serviços necessários para completar o fluxo.

---

# 25. Preocupações transversais

Como serviços de aplicação ficam fora do domínio, eles também podem tratar preocupações como:

```text
autenticação
autorização
```

sem poluir as regras de negócio. 

---

# 26. Boas práticas de associação entre os elementos

A aula apresenta algumas regras importantes sobre relacionamentos. 

### Entidade

Pode referenciar:

```text
Entidades
Objetos de Valor
```

### Objeto de Valor

Deve referenciar apenas:

```text
Objetos de Valor
```

### Serviços de domínio e fábricas

Podem referenciar:

```text
Agregados
Entidades
Objetos de Valor
```

O sentido contrário normalmente deve ser evitado.

Em outras palavras:

```text
Serviço de domínio → Entidade
```

é adequado.

Mas:

```text
Entidade → Serviço de domínio
```

não costuma ser desejável.

---

# 27. Inversão de Dependência

Quando fábricas ou serviços de aplicação precisarem utilizar repositórios ou outras abstrações, o material recomenda utilizar **inversão de dependência**. 

Em vez de:

```java
class CustomerService {

    private MySqlCustomerRepository repository =
        new MySqlCustomerRepository();
}
```

é melhor depender de:

```java
class CustomerService {

    private final CustomerRepository repository;

    CustomerService(CustomerRepository repository) {
        this.repository = repository;
    }
}
```

Então:

```text
CustomerService
       ↓
CustomerRepository
       ↑
JpaCustomerRepository
```

O serviço conhece a abstração, não uma implementação específica.

---

# 28. DDD Estratégico

Até aqui, boa parte dos conceitos pertence ao que podemos enxergar como a modelagem interna do domínio.

Em projetos grandes surge outro problema:

```text
vários times
+
vários modelos
+
várias tecnologias
+
muitas regras
```

Manter um único modelo global torna-se difícil. 

Por isso, o **DDD Estratégico** aborda como diferentes modelos de domínio podem coexistir.

A ideia é permitir que os modelos:

* tenham consistência;
* não apresentem termos contraditórios;
* evoluam de maneira relativamente independente;
* possam ser integrados quando necessário. 

---

# 29. Contexto Delimitado — Bounded Context

Um **Contexto Delimitado** (*Bounded Context*) é uma partição lógica independente de um sistema maior. 

Cada contexto representa um conjunto específico de responsabilidades do negócio.

Por exemplo:

```text
Sistema de hospedagem

├── Contexto de Reservas
├── Contexto de Avaliações
├── Contexto de Pagamentos
└── Contexto de Atendimento
```

O material mostra como exemplo os contextos:

```text
Contexto de Reservas
Contexto de Avaliações
```

Cada um possui seu próprio modelo. 

---

# 30. Cada contexto possui sua própria linguagem

Uma característica fundamental é que:

> cada Bounded Context possui sua própria Linguagem Ubíqua.

Portanto, a mesma palavra pode ter representações diferentes dependendo do contexto. 

Por exemplo:

```text
Cliente
```

no contexto de vendas pode ter informações como:

```text
nome
endereço
limite
```

No contexto de marketing:

```text
nome
segmento
preferências
```

Não é obrigatório que ambos utilizem exatamente o mesmo modelo de `Cliente`.

---

# 31. Mapa de Contexto

Um **Mapa de Contexto** (*Context Map*) representa os diferentes contextos delimitados e as relações existentes entre eles. 

Exemplo:

```text
┌──────────────┐
│    Vendas    │
└──────┬───────┘
       │
       │ integração
       ▼
┌──────────────┐
│  Marketing   │
└──────────────┘
```

O objetivo é permitir que todos entendam:

* quais contextos existem;
* quem depende de quem;
* como ocorre a comunicação.

A aula apresenta três formas de integração:

```text
Kernel Compartilhado
Produtor-Consumidor
Camada Anticorrupção
```



---

# 32. Kernel Compartilhado

O **Shared Kernel / Kernel Compartilhado** é um conjunto de objetos do domínio utilizado por mais de um contexto delimitado. 

Visualmente:

```text
Contexto A
     \
      \ Shared Kernel
      /
Contexto B
```

Sua principal finalidade é evitar:

* duplicação do mesmo conceito;
* traduções desnecessárias entre contextos.

Entretanto, surge um problema:

> modificar o Shared Kernel pode afetar vários contextos.

Por isso, mudanças no conteúdo compartilhado precisam ser feitas cuidadosamente e aprovadas pelos times envolvidos. 

---

# 33. Produtor-Consumidor

Existe uma relação de **Produtor-Consumidor** quando um contexto depende unilateralmente de outro. 

```text
Produtor
   │
   │ fornece informações
   ▼
Consumidor
```

O produtor fornece informações necessárias para que o consumidor funcione.

Exemplos apresentados:

```text
Vendas
  ↓
Marketing
```

Marketing é consumidor de Vendas.

E:

```text
Matrícula
  ↓
Relatórios
```

Relatórios é consumidor de Matrícula. 

O material também alerta que essa dependência pode gerar conflitos entre equipes.

Nesses casos aparecem padrões como:

```text
Conformista
Caminhos Separados
```



---

# 34. Camada Anticorrupção — Anti-Corruption Layer

Uma **Camada Anticorrupção** é utilizada quando um contexto precisa se comunicar com:

* sistema legado;
* aplicação externa;
* modelo pertencente a outro sistema.

O objetivo é impedir que o modelo externo contamine o modelo interno. 

Por exemplo:

```text
Nosso domínio
     |
     v
Camada Anticorrupção
     |
     v
Sistema legado
```

Se o sistema externo possui:

```json
{
    "usr_nm": "Lucas",
    "usr_mail": "x@x.com"
}
```

o domínio não precisa começar a utilizar nomes como:

```text
usr_nm
usr_mail
```

A camada anticorrupção pode transformar isso em:

```java
Customer(
    Name name,
    Email email
)
```

---

# 35. Componentes da Camada Anticorrupção

A aula apresenta três tipos de classes dentro dessa camada. 

## Classes de serviço

Fornecem uma interface adequada ao domínio cliente.

```text
Cliente
  ↓
Serviço
```

## Adaptadores

Convertem os modelos externos para o modelo interno:

```text
ExternalCustomer
       ↓
    Adapter
       ↓
Customer
```

## Fachadas

Simplificam o acesso ao sistema externo.

```text
Domínio
 ↓
Facade
 ↓
Sistema externo complexo
```

A estrutura apresentada na aula é aproximadamente:

```text
Cliente
   ↓
Serviço
   ↓
Adaptador
   ↓
Fachada
   ↓
Aplicação Externa
```



---

# 36. Visão completa dos elementos do DDD

Uma forma de juntar os conceitos da aula é pensar assim:

```text
DOMAIN-DRIVEN DESIGN
│
├── Linguagem Ubíqua
│
├── Model-Driven Design
│
│   ├── Entidades
│   ├── Objetos de Valor
│   ├── Serviços de Domínio
│   ├── Eventos de Domínio
│   ├── Módulos
│   ├── Agregados
│   │    └── Aggregate Root
│   ├── Fábricas
│   └── Repositórios
│
├── Arquitetura em Camadas
│   ├── Apresentação
│   ├── Aplicação
│   │    └── Serviços de Aplicação
│   ├── Domínio
│   └── Infraestrutura
│
└── DDD Estratégico
    ├── Bounded Context
    └── Context Map
         ├── Shared Kernel
         ├── Produtor-Consumidor
         └── Anti-Corruption Layer
```

---

# 37. Relação entre os principais objetos

Outra forma útil para memorizar:

```text
             Serviço de Aplicação
                      │
          coordena um caso de uso
                      │
             ┌────────▼────────┐
             │ Aggregate Root │
             └────────┬────────┘
                      │
             protege o agregado
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
   Entidades     Value Objects   Regras internas

       ▲
       │ cria
    Factory

       ▲
       │ recupera / salva
   Repository
       │
       ▼
Infraestrutura / Banco
```

E, quando acontece algo relevante:

```text
Aggregate
    │
    └──> Domain Event
             │
             ├──> outro módulo
             ├──> ação assíncrona
             └──> auditoria
```

---

# 38. Diferenças que vale decorar para prova

## Entidade × Value Object

**Entidade:**

```text
identidade importa
```

**Value Object:**

```text
estado importa
```

---

## Domain Service × Application Service

**Domain Service:**

```text
regra de negócio que não cabe naturalmente em entidade/VO
```

**Application Service:**

```text
orquestra um caso de uso
```

---

## Repository × Factory

**Repository:**

```text
encontra / recupera / persiste agregados
```

**Factory:**

```text
constrói objetos ou agregados
```

---

## Aggregate × Entity

Uma entidade é um objeto com identidade.

Um agregado é:

```text
um conjunto de objetos
+
um limite de consistência
+
uma Aggregate Root
```

---

## Module × Bounded Context

Um **módulo** organiza partes relacionadas do modelo.

Um **Bounded Context** estabelece uma fronteira maior dentro da qual existe:

```text
um modelo
+
uma linguagem ubíqua
+
um significado consistente para os conceitos
```

---

# 39. Fluxo típico em uma aplicação DDD

Um fluxo como **cadastrar cliente** poderia ser representado assim:

```text
1. Usuário envia requisição
            ↓
2. Camada de apresentação
            ↓
3. Serviço de aplicação
            ↓
4. Factory cria Customer
            ↓
5. Customer garante suas invariantes
            ↓
6. Repository salva Customer
            ↓
7. Infraestrutura persiste no banco
```

Caso ocorra algo importante:

```text
CustomerCreated
```

pode surgir um evento de domínio:

```text
CustomerRegistered
        ↓
    assinantes
        ↓
 ┌─────────────┐
 │ enviar email│
 ├─────────────┤
 │ auditoria   │
 └─────────────┘
```

Essa visão resume bem como os conceitos apresentados na aula podem trabalhar em conjunto.

---

# 40. Resumo final da aula

A própria aula sintetiza os pontos centrais da seguinte forma:

* **Linguagem Ubíqua:** formaliza os conceitos do domínio utilizados pelo projeto.
* **Entidades:** objetos definidos de maneira inequívoca por sua identidade.
* **Objetos de Valor:** objetos imutáveis comparados pelo estado.
* **Serviços de Domínio:** objetos sem estado responsáveis por funcionalidades relacionadas ao domínio.
* **Agregados:** conjuntos de objetos tratados externamente como uma unidade.
* **Fábricas:** encapsulam a criação de objetos do domínio.
* **Repositórios:** abstraem a recuperação e persistência de objetos do domínio.
* **Serviços de Aplicação:** orquestram os objetos do domínio, mas delegam a eles as regras de negócio.
* **DDD Estratégico:** ajuda a organizar a integração entre diferentes contextos delimitados de sistemas grandes.

A ideia central pode ser condensada em:

```text
DDD não começa pelo banco,
não começa pelo framework
e não começa pela API.

DDD começa entendendo o negócio.

Negócio
   ↓
Linguagem Ubíqua
   ↓
Modelo de Domínio
   ↓
Entidades + Value Objects + Agregados
   ↓
Serviços + Eventos
   ↓
Factories + Repositories
   ↓
Casos de Uso
   ↓
Infraestrutura
```

## Exercício proposto na aula

Ao final, o material propõe modelar um **contexto delimitado para gestão de fichas de treino de usuários de uma academia**. O exercício pede identificar agregados, entidades, objetos de valor e eventos; avaliar a necessidade de fábricas e repositórios; modelar relacionamentos e responsabilidades; implementar o domínio em Java; e definir serviços de aplicação capazes de criar e atribuir uma ficha de treino a um usuário.

Esse exercício é especialmente útil porque força a aplicar praticamente quase todos os conceitos apresentados na aula.
