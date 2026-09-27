
## Definição

O **Diagrama de Sequência** representa as mensagens trocadas entre os participantes de uma interação ao longo do tempo.

Na etapa de projeto, ele ajuda a detalhar como o sistema responde internamente às interações externas. Pode ser utilizado em diferentes níveis:
- comunicação entre sistemas;
- comunicação entre subsistemas;
- interação entre camadas da arquitetura;
- chamadas entre objetos e métodos;
- comportamento próximo ao código-fonte.'
Em processos tradicionais, costuma-se produzir um diagrama para cada caso de uso relevante. Em abordagens ágeis, o uso tende a ser pontual, especialmente nos fluxos mais complexos ou arriscados.

## Quando utilizar

Use um Diagrama de Sequência quando precisar:
- detalhar internamente um caso de uso;
- mostrar a ordem das chamadas;
- identificar responsabilidades entre componentes;
- documentar uma integração entre serviços;
- visualizar chamadas síncronas e assíncronas;
- representar alternativas, repetições e operações opcionais;
- discutir arquitetura ou desenho de uma funcionalidade.

##  Participantes e atores

Os elementos que participam da interação aparecem horizontalmente no topo do diagrama.

### Atores

São participantes externos ao sistema. Exemplos:
- usuário;
- cliente do banco;
- sistema externo;
- microsserviço que solicita uma funcionalidade.
### Participantes internos

Podem representar:
- objetos;
- classes;
- controladores;
- serviços;
- repositórios;
- APIs;
- subsistemas.
Exemplo: `Atendente`, `LibraryApp`, `BookAPI`, `BookService` e `BookRepository`.

![[Pasted image 20260817081603.png|333]]


## Linha da vida

A **linha da vida** representa a existência de um participante durante a interação. O tempo avança de cima para baixo:
- mensagens mais altas acontecem antes;
- mensagens mais baixas acontecem depois;
- a posição vertical expressa ordem temporal e precedência.

![[Pasted image 20260817081749.png|340]]

> [!tip] Como ler  
> Leia o diagrama de cima para baixo, acompanhando horizontalmente o emissor e o receptor de cada mensagem.


## Caixa de ativação

A **caixa de ativação** indica o intervalo no qual um participante está executando uma operação ou possui o controle da interação.

Ela ajuda a perceber:

- quando uma chamada começou;
- por quanto tempo o participante permanece ativo;
- chamadas aninhadas;
- quando o controle retorna ao chamador.

##  Mensagens

Uma **mensagem** representa uma comunicação entre participantes. O conjunto ordenado das mensagens descreve o comportamento interno do sistema em determinada interação.
![[Pasted image 20260817082049.png|439]]

---
### Mensagem síncrona
O emissor chama uma operação e aguarda sua conclusão antes de continuar. É comum em chamadas de método e em requisições cujo resultado é necessário imediatamente.

### Mensagem assíncrona
O emissor envia a mensagem e pode continuar sem aguardar a conclusão do receptor.

Exemplo da aula: solicitar a criação de um relatório, receber um identificador da solicitação e continuar enquanto o relatório é processado.

![[Pasted image 20260817082249.png|503]]

---
### Mensagem de resposta
Representa o retorno de uma chamada. É opcional e deve ser mostrada quando ajuda a compreender o fluxo ou o valor devolvido. É a tracejada

### Automensagem
O participante envia uma mensagem para si mesmo, normalmente para representar a execução de um método interno.


---
### Mensagem de criação
Indica que um participante cria outro. A linha da vida do novo participante começa no ponto de criação.

### Destruição
Indica o fim da existência de um participante durante a interação.

![[Pasted image 20260817082550.png]]

---

## Fragmentos combinados

Fragmentos combinados delimitam partes do diagrama submetidas a uma regra de controle.

### `alt` - alternativas

Representa alternativas mutuamente exclusivas, funcionando de modo semelhante a `if/else`.
![[Pasted image 20260817082914.png|448]]
```
alt [livro disponível]
    atualizar estado para emprestado
else [livro indisponível]
    retornar mensagem de erro
```

### `loop` - repetição

Representa mensagens executadas repetidamente, equivalentes a estruturas como `for` ou `while`.

Exemplo: atualizar o estado de cada livro devolvido.
![[Pasted image 20260817082948.png|517]]

### `opt` - execução opcional

Representa um trecho que pode ou não acontecer, semelhante a um `if` sem `else`.

Exemplo: validar um captcha apenas depois de uma tentativa adicional.

![[Pasted image 20260817083009.png|535]]

### `neg` - interação inválida

Marca uma sequência de mensagens que representa um comportamento inválido, uma falha ou um cenário que não deveria ocorrer.

Exemplo: uma requisição à API resultar em _timeout_ em um trecho considerado inválido.
![[Pasted image 20260817083031.png|566]]

### `ref` - referência a outra interação

Permite invocar uma interação detalhada em outro modelo. É usado para:
- dividir diagramas grandes;
- reutilizar uma interação;
- esconder detalhes secundários;
- trabalhar em diferentes níveis de abstração.

![[Pasted image 20260817083059.png|510]]
    

> [!warning] Uso incorreto de `ref`  
> O fragmento `ref` não deve funcionar como um `goto` arbitrário entre diagramas. Ele referencia uma interação coesa e definida separadamente.

## Diagrama de sequência detalhado - Esse vai cair na prova

Um diagrama pode detalhar mensagens com:
- nome da operação;
- parâmetros;
- tipos dos parâmetros;
- tipo de retorno;
- atribuição do valor retornado;
- criação de objetos;
- exceções;
- estruturas equivalentes a `if/else`, `for` e `while`.

Exemplo:

![[Pasted image 20260817083240.png]]


### Nível de detalhamento e manutenção

Quanto mais próximo do código estiver o diagrama, maior será o custo de mantê-lo atualizado. Um modelo útil deve incluir detalhe suficiente para explicar decisões e responsabilidades, mas evitar repetir mecanicamente tudo o que o código já mostra.

> [!important] Critério prático  
> Detalhe as interações importantes, regras, alternativas e limites arquiteturais. Evite transformar o diagrama em uma transcrição de cada linha de código.






