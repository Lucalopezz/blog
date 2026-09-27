

# Transação

Uma **transação** é um conjunto de operações SQL executadas como uma unidade.

No final, existem dois caminhos:

```text
COMMIT   → confirma tudo
ROLLBACK → desfaz tudo
```

O material define transação como uma sequência de comandos SQL executados como um conjunto atômico. 

Exemplo:

```sql
UPDATE conta
SET saldo = saldo - 100
WHERE id = 1;

UPDATE conta
SET saldo = saldo + 100
WHERE id = 2;

COMMIT;
```

A ideia é que as duas operações fazem parte de uma mesma lógica.

---

# Quando uma transação começa?

No Oracle, segundo o material, uma transação começa quando é executado um comando DML:

```text
INSERT
UPDATE
DELETE
```



Exemplo:

```sql
UPDATE atleta
SET salario = 8000
WHERE id = 10;
```

A partir daqui existe uma transação aberta.

---

# Quando uma transação termina?

Pode terminar com:

```text
COMMIT
ROLLBACK
DDL
DCL
saída da sessão
falha do sistema
```

O material destaca também que comandos `DDL` e `DCL`, como `GRANT` e `REVOKE`, encerram a transação. 

---

# COMMIT

`COMMIT` torna as alterações permanentes.

```sql
UPDATE atleta
SET salario = 8000
WHERE id = 10;

COMMIT;
```

Depois do `COMMIT`:

```text
alteração fica permanente
outros usuários passam a enxergá-la
não dá mais para voltar com ROLLBACK
```



Pra decorar:

```text
COMMIT = confirmar
```

---

# ROLLBACK

`ROLLBACK` desfaz **todas as alterações pendentes da transação**.

```sql
UPDATE atleta
SET salario = 98000
WHERE id = 199;

ROLLBACK;
```

O salário volta ao valor anterior. 

Pra decorar:

```text
ROLLBACK = voltar
```

---

# Antes do COMMIT

Esse ponto é muito importante.

Imagine duas sessões:

```text
HR
JOSE
```

HR executa:

```sql
UPDATE atleta
SET salario = 8000
WHERE nome = 'Miquela Malloy';
```

Mas ainda **não fez COMMIT**.

Na sessão do próprio HR, ele já enxerga:

```text
8000
```

Mas JOSE ainda enxerga o valor antigo.

O material reforça que outros usuários não veem os resultados dos DML até o `COMMIT`. 

Fluxo:

```text
HR faz UPDATE
      ↓
HR vê alteração

JOSE
      ↓
continua vendo valor antigo

COMMIT
      ↓
JOSE passa a ver o novo valor
```

> Caso o Jose fizer alteraçao no mesmo campo que ainda nao foi dado commit, é bloqueado de fazer a açao

---

#  Exemplo de INSERT sem COMMIT

HR:

```sql
INSERT INTO atleta (id, nome, cpf, salario)
VALUES (199, 'Zé das Medalhas', '888-77-5555', 2500);
```

JOSE:

```sql
SELECT *
FROM hr.atleta
WHERE id = 199;
```

Antes do `COMMIT`:

```text
JOSE não encontra o atleta
```

Depois:

```sql
COMMIT;
```

JOSE passa a encontrá-lo. 

---

# DDL/DCL podem causar COMMIT

A aula mostra um caso interessante.

HR faz:

```sql
UPDATE atleta
SET salario = 4000
WHERE id = 199;
```

Depois executa:

```sql
GRANT SELECT ON clube TO jose;
```

O `GRANT` é DCL e, no cenário apresentado, provoca `COMMIT`.

Então o `UPDATE` anterior também é confirmado. 

Isso é uma boa pegadinha de prova:

```text
DML pendente
     ↓
GRANT / REVOKE
     ↓
COMMIT implícito
```

---

# SAVEPOINT

`SAVEPOINT` cria um **ponto intermediário dentro da transação**.

Exemplo:

```sql
UPDATE atleta
SET salario = 7200
WHERE nome = 'Oren Peers';

SAVEPOINT atualiza;

UPDATE atleta
SET salario = 100000
WHERE nome = 'Zé das Medalhas';
```

Você percebe que o segundo `UPDATE` estava errado.

Em vez de:

```sql
ROLLBACK;
```

que desfaria tudo, pode fazer:

```sql
ROLLBACK TO atualiza;
```

Assim apenas o que aconteceu **depois do SAVEPOINT** é desfeito. 

---

# ROLLBACK x ROLLBACK TO

Imagine:

```sql
INSERT A;

SAVEPOINT SP1;

UPDATE B;

SAVEPOINT SP2;

DELETE C;
```

Se fizer:

```sql
ROLLBACK TO SP2;
```

desfaz:

```text
DELETE C
```

Se fizer:

```sql
ROLLBACK TO SP1;
```

desfaz:

```text
UPDATE B
DELETE C
```

Se fizer:

```sql
ROLLBACK;
```

desfaz tudo desde o início da transação.

O diagrama da página 13 mostra exatamente essa ideia de voltar para diferentes pontos da transação. 

Pra decorar:

```text
ROLLBACK       → volta tudo
ROLLBACK TO X  → volta até o SAVEPOINT X
```

---

# Concorrência

Concorrência ocorre quando **vários usuários acessam ou modificam os mesmos dados ao mesmo tempo**.

Exemplo:

```text
HR   → tenta alterar atleta 10
JOSE → tenta alterar atleta 10
```

O Oracle precisa impedir que os dois modifiquem o mesmo registro simultaneamente de forma inconsistente.

---

# LOCK

Quando um usuário faz um `UPDATE`, o Oracle coloca um **lock no registro modificado**.

Exemplo:

HR:

```sql
UPDATE atleta
SET salario = 7300
WHERE nome = 'Lambert Taffs';
```

Antes de HR executar `COMMIT` ou `ROLLBACK`, JOSE tenta:

```sql
UPDATE hr.atleta
SET salario = 9000
WHERE nome = 'Lambert Taffs';
```

JOSE fica esperando.

Por quê?

```text
HR possui o LOCK daquele registro
```

O material explica que o segundo usuário fica aguardando a finalização da transação do primeiro para garantir consistência. 

---

# Como liberar o LOCK?

A transação do usuário que possui o lock precisa terminar:

```sql
COMMIT;
```

ou:

```sql
ROLLBACK;
```

Depois disso, o outro usuário pode continuar sua operação. 

Mentalmente:

```text
HR UPDATE
   ↓
LOCK
   ↓
JOSE UPDATE
   ↓
espera...

HR COMMIT/ROLLBACK
   ↓
LOCK liberado
   ↓
JOSE continua
```

---

# SELECT fica bloqueado?

Aqui está uma diferença importante.

Se HR está fazendo:

```sql
UPDATE atleta
SET salario = 7000
WHERE nome = 'Juca';
```

MARIA pode fazer:

```sql
SELECT *
FROM hr.atleta;
```

e não precisa ficar esperando o `UPDATE` terminar.

O material chama isso de **Consistência de Leitura**. 

Resumo:

```text
leitor não espera escritor
escritor não espera leitor
```

---

# Como o SELECT vê o valor antigo?

O Oracle mantém o valor anterior na área de **UNDO**.

Exemplo:

```text
valor original:
salario = 5000
```

JOSE executa:

```sql
UPDATE atleta
SET salario = 7000
WHERE nome = 'Juca';
```

Antes do `COMMIT`, MARIA faz:

```sql
SELECT *
FROM JOSE.atleta;
```

Ela pode receber a versão anterior:

```text
salario = 5000
```

porque o Oracle usa o **UNDO** para construir uma imagem consistente do dado. O diagrama da página 21 mostra justamente o leitor sendo direcionado aos dados anteriores mantidos em `Undo Segments`. 

---

# UNDO

Uma forma simples de pensar:

```text
DATA BLOCK
→ dado atual/modificado

UNDO
→ versão anterior do dado
```

Enquanto a transação não termina:

```text
usuário que alterou → vê sua alteração
outros leitores     → podem ver versão anterior consistente
```

Depois do `COMMIT`:

```text
todos passam a enxergar a nova versão
```

---

# Exemplo completo de transação

```sql
UPDATE atleta
SET salario = 5000
WHERE id = 10;

SAVEPOINT sp1;

UPDATE atleta
SET salario = 6000
WHERE id = 20;

SAVEPOINT sp2;

DELETE FROM atleta
WHERE id = 30;
```

Se perceber que apenas o `DELETE` estava errado:

```sql
ROLLBACK TO sp2;
```

Resultado:

```text
UPDATE id 10 → permanece
UPDATE id 20 → permanece
DELETE id 30 → desfeito
```

Depois:

```sql
COMMIT;
```

Os dois updates ficam permanentes.

---

# Resumo dos comandos

```sql
COMMIT;
```

> Confirma todas as alterações da transação.

```sql
ROLLBACK;
```

> Desfaz todas as alterações ainda não confirmadas.

```sql
SAVEPOINT sp1;
```

> Cria um ponto intermediário.

```sql
ROLLBACK TO sp1;
```

> Desfaz somente o que aconteceu depois daquele ponto.

Esses são os três principais comandos de controle de transação apresentados no material. 

---

#  Resumo mental da matéria

```text
DML
INSERT / UPDATE / DELETE
        ↓
inicia transação
        ↓
mudanças ainda não são permanentes
        ↓

 ┌───────────────┬────────────────┐
 │               │                │
COMMIT         ROLLBACK        SAVEPOINT
 │               │                │
confirma        desfaz          marca ponto
 │               │                │
permanente      volta           ROLLBACK TO
```

---

# Concorrência em uma frase

```text
Dois usuários podem ler os mesmos dados,
mas não podem modificar simultaneamente
o mesmo registro sem controle.
```

Quando alguém altera:

```text
UPDATE
  ↓
LOCK na linha
  ↓
outro UPDATE espera
  ↓
COMMIT / ROLLBACK
  ↓
LOCK liberado
```

---
