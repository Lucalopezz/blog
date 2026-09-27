
# 1. O que é uma Trigger?

Uma **trigger** é disparada automaticamente quando ocorre uma operação DML em uma tabela:

```sql
INSERT
UPDATE
DELETE
```

Exemplo mental:

```text
UPDATE atleta ...
      ↓
Oracle detecta o evento
      ↓
Trigger é executada automaticamente
```

Ela é útil principalmente para:

* auditoria;
* atualização automática de valores;
* validações;
* sincronização de dados derivados;
* execução de regras quando dados mudam.



A principal diferença em relação a uma procedure é:

```text
Procedure → alguém chama explicitamente

Trigger → o banco chama automaticamente
```

---

# 2. Estrutura básica

A sintaxe geral é:

```sql
CREATE OR REPLACE TRIGGER nome_trigger
    BEFORE | AFTER | INSTEAD OF evento
    ON tabela
    [FOR EACH ROW]
    [WHEN (condicao)]
BEGIN

    -- código PL/SQL

END nome_trigger;
```



Exemplo simples:

```sql
CREATE OR REPLACE TRIGGER TR_EXEMPLO
    BEFORE UPDATE ON atleta
BEGIN

    DBMS_OUTPUT.PUT_LINE('Um atleta será atualizado');

END TR_EXEMPLO;
```

Quando alguém executar:

```sql
UPDATE atleta
SET salario = 5000
WHERE id = 1;
```

a trigger será executada automaticamente.

---

# 3. BEFORE, AFTER e INSTEAD OF

Esses comandos determinam **quando** a trigger será executada.

## BEFORE

Executa **antes** da operação.

```sql
BEFORE INSERT
```

Fluxo:

```text
Trigger
  ↓
INSERT
```

Muito útil quando queremos:

* validar dados;
* modificar `:NEW`;
* preencher campos automaticamente.

---

## AFTER

Executa **depois** da operação.

```sql
AFTER UPDATE
```

Fluxo:

```text
UPDATE
  ↓
Trigger
```

Normalmente faz sentido quando queremos:

* registrar log;
* auditoria;
* executar algo depois que a alteração ocorreu.

---

## INSTEAD OF

Executa **no lugar da operação original**.

```sql
INSTEAD OF UPDATE
```

Muito usado em **views**, principalmente quando uma view não pode ser atualizada diretamente.



---

# 4. Trigger por linha vs por instrução

Existem dois níveis.

## Nível de instrução

Sem:

```sql
FOR EACH ROW
```

A trigger executa **uma única vez**, independentemente da quantidade de linhas afetadas.

Imagine:

```sql
UPDATE atleta
SET salario = salario * 1.10
WHERE id_clube = 10;
```

Se 50 atletas forem atualizados:

```text
trigger executa 1 vez
```

---

## Nível de linha

Quando colocamos:

```sql
FOR EACH ROW
```

ela executa uma vez para **cada registro afetado**.

No mesmo `UPDATE` com 50 atletas:

```text
linha 1 → trigger
linha 2 → trigger
linha 3 → trigger
...
linha 50 → trigger
```



Esse conceito é um dos mais importantes da matéria.

---

# 5. `:OLD` e `:NEW`

Em triggers de nível de linha podemos acessar os valores antigos e novos.

```sql
:OLD
:NEW
```

## Em UPDATE

Suponha:

```sql
UPDATE atleta
SET salario = 9000
WHERE id = 1;
```

Antes:

```text
salario = 7000
```

Depois:

```text
salario = 9000
```

Dentro da trigger:

```sql
:OLD.salario
```

é:

```text
7000
```

e:

```sql
:NEW.salario
```

é:

```text
9000
```

Exemplo:

```sql
DBMS_OUTPUT.PUT_LINE(
    'Antigo: ' || :OLD.salario ||
    ' Novo: ' || :NEW.salario
);
```



---

# 6. Regra mental de `OLD` e `NEW`

Uma forma boa de memorizar:

| Operação | `:OLD`                 | `:NEW`               |
| -------- | ---------------------- | -------------------- |
| `INSERT` | não há registro antigo | novo registro        |
| `UPDATE` | valor antigo           | valor novo           |
| `DELETE` | registro removido      | não há novo registro |

Isso ajuda bastante nos exercícios.

---

# 7. Exemplo: preencher campos automaticamente

A aula adiciona campos de auditoria:

```sql
ALTER TABLE atleta
ADD data_ult_alt DATE;

ALTER TABLE atleta
ADD user_ult_alt VARCHAR2(20);
```

Depois cria:

```sql
CREATE OR REPLACE TRIGGER TR_REGISTRA_ALTERACAO
    BEFORE INSERT OR UPDATE ON atleta
    FOR EACH ROW
BEGIN

    :NEW.data_ult_alt := SYSDATE;
    :NEW.user_ult_alt := USER;

END TR_REGISTRA_ALTERACAO;
```



Agora qualquer:

```sql
INSERT INTO atleta ...
```

ou:

```sql
UPDATE atleta ...
```

faz automaticamente:

```text
data_ult_alt = data atual
user_ult_alt = usuário do Oracle
```

A aplicação nem precisa saber que isso existe.

---

# 8. Por que usar `BEFORE` nesse caso?

Porque estamos alterando o valor que **vai ser inserido/atualizado**:

```sql
:NEW.data_ult_alt := SYSDATE;
```

Queremos modificar `:NEW` antes do Oracle efetivamente gravar o registro.

Mentalmente:

```text
dados enviados
      ↓
BEFORE trigger
      ↓
modifica :NEW
      ↓
Oracle salva
```

---

# 9. Trigger de auditoria

Esse é provavelmente o caso mais clássico.

Criamos uma tabela:

```sql
CREATE TABLE audit_atleta_sal (
    id_atleta NUMBER(4),
    sal_antigo NUMBER(8,2),
    sal_novo NUMBER(8,2),
    usuario VARCHAR2(20),
    data_alt TIMESTAMP
);
```

Depois:

```sql
CREATE OR REPLACE TRIGGER TR_AUDIT_ATLETA_SAL
    BEFORE UPDATE OF salario ON atleta
    FOR EACH ROW
    WHEN (NEW.salario <> OLD.salario)
BEGIN

    INSERT INTO audit_atleta_sal
    VALUES (
        :NEW.id,
        :OLD.salario,
        :NEW.salario,
        USER,
        SYSDATE
    );

END TR_AUDIT_ATLETA_SAL;
```



Agora:

```sql
UPDATE atleta
SET salario = 10000
WHERE id = 1;
```

gera automaticamente algo parecido com:

```text
id_atleta | sal_antigo | sal_novo | usuario | data
---------------------------------------------------
1          | 9000       | 10000    | LUCAS   | ...
```

---

# 10. `UPDATE OF coluna`

Podemos especificar qual coluna interessa:

```sql
BEFORE UPDATE OF salario ON atleta
```

Isso significa:

> dispare quando houver um `UPDATE` envolvendo a coluna `salario`.

É mais específico que:

```sql
BEFORE UPDATE ON atleta
```

---

# 11. `WHEN`

Podemos restringir ainda mais:

```sql
WHEN (NEW.salario <> OLD.salario)
```

Significa:

> só execute o corpo da trigger se o salário realmente mudou.

Isso evita gerar auditoria desnecessária.

Exemplo:

```sql
UPDATE atleta
SET salario = 9000
WHERE id = 1;
```

Se já era `9000`, a condição:

```sql
NEW.salario <> OLD.salario
```

será falsa.



Observe um detalhe de sintaxe:

No `WHEN`:

```sql
NEW.salario
OLD.salario
```

No corpo:

```sql
:NEW.salario
:OLD.salario
```

---

# 12. Descobrindo qual DML disparou a trigger

Uma trigger pode responder a vários eventos:

```sql
INSERT OR UPDATE OR DELETE
```

Dentro dela podemos testar:

```sql
INSERTING
UPDATING
DELETING
```



Exemplo:

```sql
IF INSERTING THEN

    ...

ELSIF UPDATING THEN

    ...

ELSIF DELETING THEN

    ...

END IF;
```

---

# 13. Exemplo: quantidade de atletas por clube

A tabela clube recebe:

```sql
ALTER TABLE clube
ADD qtde_atletas NUMBER DEFAULT 0;
```

Depois:

```sql
CREATE OR REPLACE TRIGGER TR_SET_QTDE_ATLETAS_CLUBE
    BEFORE INSERT OR DELETE ON atleta
    FOR EACH ROW
BEGIN

    IF INSERTING THEN

        UPDATE clube
        SET qtde_atletas = qtde_atletas + 1
        WHERE id = :NEW.id_clube;

    ELSIF DELETING THEN

        UPDATE clube
        SET qtde_atletas = qtde_atletas - 1
        WHERE id = :OLD.id_clube;

    END IF;

END TR_SET_QTDE_ATLETAS_CLUBE;
```



Aqui a lógica de `NEW` e `OLD` fica muito clara.

### INSERT

O atleta está entrando:

```sql
:NEW.id_clube
```

é o clube dele.

Então:

```text
qtde_atletas + 1
```

### DELETE

O atleta está sendo apagado.

Precisamos saber de qual clube ele era:

```sql
:OLD.id_clube
```

Então:

```text
qtde_atletas - 1
```

---

# 14. Trigger em nível de instrução

Exemplo da aula:

```sql
CREATE OR REPLACE TRIGGER TR_MODALIDADE_LOG_OP
    AFTER INSERT OR DELETE OR UPDATE ON modalidade

DECLARE

    v_oper MODALIDADE_LOG.OPERACAO%TYPE;

BEGIN

    IF INSERTING THEN
        v_oper := 'Inserção realizada';

    ELSIF UPDATING THEN
        v_oper := 'Atualização realizada';

    ELSIF DELETING THEN
        v_oper := 'Remoção realizada';

    END IF;

    INSERT INTO MODALIDADE_LOG
    VALUES (
        USER,
        SYSDATE,
        v_oper
    );

END TR_MODALIDADE_LOG_OP;
```



Observe que não existe:

```sql
FOR EACH ROW
```

Logo é uma trigger em nível de **instrução**.

Se fizermos:

```sql
UPDATE modalidade
SET olimpica = 'N';
```

e 100 registros forem alterados:

```text
100 registros alterados
        ↓
1 execução da trigger
        ↓
1 registro de log
```

---

# 15. Quando usar cada nível?

Regra prática:

### Se você precisa dos dados de cada registro

```sql
:OLD
:NEW
```

normalmente precisa:

```sql
FOR EACH ROW
```

Exemplos:

```text
auditar salário antigo/novo
atualizar estoque
atualizar contador
validar cada registro
```

### Se interessa apenas saber que uma operação aconteceu

pode usar trigger de instrução.

Exemplo:

```text
"alguém executou UPDATE na tabela modalidade"
```

---

# 16. `INSTEAD OF` em views

A aula cria uma view:

```sql
CREATE OR REPLACE VIEW V_ATLETA_CLUBE AS

SELECT
    c.nome nome_clube,
    a.id,
    a.nome nome_atleta,
    a.salario * 12 sal_anual

FROM clube c
JOIN atleta a
    ON c.id = a.id_clube;
```



Queremos executar:

```sql
UPDATE v_atleta_clube
SET sal_anual = 72000
WHERE id = 21;
```

Mas `sal_anual` é calculado:

```sql
a.salario * 12
```

Então criamos:

```sql
CREATE OR REPLACE TRIGGER TR_CLUBE_ATLETA_SAL
    INSTEAD OF UPDATE ON v_atleta_clube
    FOR EACH ROW
BEGIN

    IF :NEW.sal_anual <> :OLD.sal_anual THEN

        UPDATE atleta
        SET salario = :NEW.sal_anual / 12
        WHERE id = :NEW.id;

    END IF;

END TR_CLUBE_ATLETA_SAL;
```



Agora:

```sql
UPDATE v_atleta_clube
SET sal_anual = 72000
WHERE id = 21;
```

não atualiza diretamente a view.

O fluxo é:

```text
UPDATE na VIEW
      ↓
INSTEAD OF trigger intercepta
      ↓
72000 / 12
      ↓
UPDATE atleta
SET salario = 6000
```

Esse é o sentido de:

```text
INSTEAD OF = em vez de
```

---

# 17. Compound Trigger

A parte mais avançada da matéria é **Compound Trigger**.

Um compound trigger permite colocar vários momentos de execução dentro de uma única trigger:

```text
BEFORE STATEMENT
BEFORE EACH ROW
AFTER EACH ROW
AFTER STATEMENT
```



---

# 18. Por que Compound Trigger existe?

O material apresenta três vantagens principais.

## 1. Evitar `mutating table error`

## 2. Evitar criar várias triggers separadas

## 3. Compartilhar estado entre as fases



---

# 19. Entendendo as fases

Imagine:

```sql
UPDATE atleta
SET salario = salario * 1.10
WHERE id_clube = 10;
```

e 50 atletas são atualizados.

O fluxo de um compound trigger pode ser:

```text
BEFORE STATEMENT
      ↓

BEFORE EACH ROW → atleta 1
AFTER EACH ROW  → atleta 1

BEFORE EACH ROW → atleta 2
AFTER EACH ROW  → atleta 2

...

BEFORE EACH ROW → atleta 50
AFTER EACH ROW  → atleta 50

      ↓
AFTER STATEMENT
```



Isso é muito importante para entender o conceito.

---

# 20. Estrutura mental de um Compound Trigger

```sql
CREATE OR REPLACE TRIGGER nome
FOR evento ON tabela
COMPOUND TRIGGER

    -- variáveis compartilhadas

    BEFORE STATEMENT IS
    BEGIN
        ...
    END BEFORE STATEMENT;


    BEFORE EACH ROW IS
    BEGIN
        ...
    END BEFORE EACH ROW;


    AFTER EACH ROW IS
    BEGIN
        ...
    END AFTER EACH ROW;


    AFTER STATEMENT IS
    BEGIN
        ...
    END AFTER STATEMENT;

END;
```

Não é obrigatório usar todas as fases.

Você usa apenas as necessárias.

---

# 21. Variáveis compartilhadas

Esse é um dos pontos mais interessantes.

Exemplo da aula:

```sql
CREATE OR REPLACE TRIGGER trg_log_salarios

FOR UPDATE OF salario ON atleta

COMPOUND TRIGGER

    v_quantidade NUMBER := 0;
    v_total_antigo NUMBER := 0;
    v_total_novo NUMBER := 0;
```

Essas variáveis ficam disponíveis durante toda a operação.

Depois:

```sql
AFTER EACH ROW IS
BEGIN

    v_quantidade :=
        v_quantidade + 1;

    v_total_antigo :=
        v_total_antigo + :OLD.salario;

    v_total_novo :=
        v_total_novo + :NEW.salario;

END AFTER EACH ROW;
```



Para cada atleta:

```text
quantidade++
soma salário antigo
soma salário novo
```

---

# 22. Processando tudo no final

Depois de percorrer todas as linhas:

```sql
AFTER STATEMENT IS
BEGIN

    INSERT INTO log_alteracao_salario
    VALUES (
        TO_NUMBER(
            TO_CHAR(
                SYSDATE,
                'YYYYMMDDHH24MISS'
            )
        ),
        v_quantidade,
        v_total_antigo,
        v_total_novo
    );

END AFTER STATEMENT;
```



Imagine que 5 atletas foram atualizados.

No final:

```text
v_quantidade = 5

v_total_antigo =
soma dos 5 salários antigos

v_total_novo =
soma dos 5 salários novos
```

E ocorre apenas:

```text
1 INSERT no log
```



---

# 23. Mutating Table Error

Esse problema aparece quando uma trigger de linha tenta consultar a própria tabela que ainda está sendo modificada.

Exemplo problemático:

```sql
CREATE OR REPLACE TRIGGER trg_salario

AFTER UPDATE OF salario ON atleta

FOR EACH ROW

DECLARE
    v_media NUMBER;

BEGIN

    SELECT AVG(salario)
    INTO v_media
    FROM atleta
    WHERE id_clube = :NEW.id_clube;

END;
```

O problema é:

```text
UPDATE atleta
     ↓
trigger da linha está rodando
     ↓
trigger tenta consultar atleta
     ↓
mas atleta ainda está sendo alterada
```

O Oracle pode gerar:

```text
ORA-04091
table is mutating
```



A ideia do Compound Trigger é deixar operações por linha acontecerem e mover determinadas consultas/processamentos para o nível de statement.

---

# 24. Ativar e desativar triggers

## Habilitar

```sql
ALTER TRIGGER nome_trigger ENABLE;
```

## Desabilitar

```sql
ALTER TRIGGER nome_trigger DISABLE;
```

---

## Todas de uma tabela

Habilitar:

```sql
ALTER TABLE atleta
ENABLE ALL TRIGGERS;
```

Desabilitar:

```sql
ALTER TABLE atleta
DISABLE ALL TRIGGERS;
```

---

# 25. Apagar trigger

```sql
DROP TRIGGER nome_trigger;
```



---

# 26. Relação com a matéria anterior

Tudo que você estudou antes continua aparecendo:

```sql
IF
ELSIF
SELECT INTO
UPDATE
INSERT
%TYPE
:=
RAISE_APPLICATION_ERROR
```

A diferença é **quem inicia a execução**.

Antes:

```sql
EXEC minha_procedure(...);
```

Agora:

```sql
UPDATE tabela ...
```

e o banco executa a trigger sozinho.

---

# 27. Procedure vs Trigger

| Procedure               | Trigger                                     |
| ----------------------- | ------------------------------------------- |
| chamada explicitamente  | chamada automaticamente                     |
| pode receber parâmetros | normalmente trabalha com evento e `OLD/NEW` |
| `EXEC procedure(...)`   | disparada por DML                           |
| código reutilizável     | reação a alteração no banco                 |
| fluxo explícito         | comportamento implícito                     |

Exemplo:

```sql
EXEC atualizar_salario(1, 5000);
```

versus:

```sql
UPDATE atleta
SET salario = 5000
WHERE id = 1;
```

No segundo caso, uma trigger pode executar sem que você a chame diretamente.

---

# 28. Fluxo mental principal

Pense sempre em quatro perguntas:

```text
1. Qual evento dispara?
   INSERT / UPDATE / DELETE

2. Quando executa?
   BEFORE / AFTER / INSTEAD OF

3. Quantas vezes executa?
   statement ou FOR EACH ROW

4. Preciso dos valores?
   :OLD / :NEW
```

Exemplo:

```sql
CREATE OR REPLACE TRIGGER TR_AUDIT

    AFTER UPDATE OF salario
    ON atleta

    FOR EACH ROW

BEGIN

    INSERT INTO audit
    VALUES (
        :OLD.salario,
        :NEW.salario
    );

END;
```

Você pode ler isso quase como português:

```text
DEPOIS de um UPDATE do salário
NA tabela atleta
PARA CADA LINHA
registre o salário antigo e o novo.
```

---

# 29. Cola rápida

```sql
-- Trigger básica
CREATE OR REPLACE TRIGGER nome
    BEFORE UPDATE ON tabela
BEGIN
    ...
END;


-- Trigger por linha
CREATE OR REPLACE TRIGGER nome
    BEFORE UPDATE ON tabela
    FOR EACH ROW
BEGIN
    ...
END;


-- Valor antigo
:OLD.coluna


-- Valor novo
:NEW.coluna


-- Somente quando uma coluna for atualizada
UPDATE OF salario


-- Condição
WHEN (NEW.salario <> OLD.salario)


-- Detectar operação
IF INSERTING THEN
    ...

ELSIF UPDATING THEN
    ...

ELSIF DELETING THEN
    ...

END IF;


-- INSTEAD OF para view
CREATE OR REPLACE TRIGGER nome
    INSTEAD OF UPDATE ON view
    FOR EACH ROW
BEGIN
    ...
END;


-- Habilitar
ALTER TRIGGER nome ENABLE;


-- Desabilitar
ALTER TRIGGER nome DISABLE;


-- Todos da tabela
ALTER TABLE tabela
ENABLE ALL TRIGGERS;

ALTER TABLE tabela
DISABLE ALL TRIGGERS;


-- Excluir
DROP TRIGGER nome;
```

---

# 30. O que eu focaria para exercício/prova

A parte mais importante é conseguir identificar qual trigger criar a partir do enunciado.

### Caso 1 — “Sempre que inserir…”

Pense:

```sql
BEFORE INSERT
```

ou:

```sql
AFTER INSERT
```

---

### Caso 2 — “Para cada registro…”

```sql
FOR EACH ROW
```

---

### Caso 3 — “Valor anterior e novo…”

```sql
:OLD
:NEW
```

---

### Caso 4 — “Só se o salário mudar…”

```sql
UPDATE OF salario
```

e/ou:

```sql
WHEN (NEW.salario <> OLD.salario)
```

---

### Caso 5 — “Descubra se inseriu ou removeu…”

```sql
IF INSERTING THEN

ELSIF DELETING THEN
```

---

### Caso 6 — “Atualizar por meio de uma view…”

```sql
INSTEAD OF
```

---

### Caso 7 — “Preciso processar várias linhas e guardar valores entre elas…”

```sql
COMPOUND TRIGGER
```

---

# Resumo final

A lógica inteira da matéria pode ser reduzida a:

```text
                 TRIGGER
                    │
             evento acontece
                    │
       ┌────────────┼─────────────┐
       │            │             │
     INSERT       UPDATE        DELETE
                    │
             quando executar?
                    │
       ┌────────────┼────────────┐
       │            │            │
     BEFORE        AFTER      INSTEAD OF
                    │
          executar quantas vezes?
                    │
          ┌─────────┴─────────┐
          │                   │
      STATEMENT           EACH ROW
                              │
                         :OLD / :NEW
```

E o **Compound Trigger** estende isso permitindo reunir:

```text
BEFORE STATEMENT
      ↓
BEFORE EACH ROW
      ↓
AFTER EACH ROW
      ↓
AFTER STATEMENT
```

em uma única estrutura, compartilhando estado entre essas etapas. 
