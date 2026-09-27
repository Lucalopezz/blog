---
title: "Criação de tabelas no Oracle"
description: "Sintaxe de CREATE TABLE, tipos de dados, valores padrão e restrições no Oracle."
category: "Banco de Dados II"
tags: [oracle, sql, tabelas, constraints]
---


# Criação de tabelas no Oracle

```sql
CREATE TABLE nome_tabela (
    coluna TIPO,
    coluna TIPO,

    CONSTRAINT nome_constraint PRIMARY KEY (...),
    CONSTRAINT nome_constraint FOREIGN KEY (...) REFERENCES tabela(...),
    CONSTRAINT nome_constraint UNIQUE (...),
    CONSTRAINT nome_constraint CHECK (...)
);
```

As principais constraints são:
- PRIMARY KEY: identifica unicamente cada registro.
- FOREIGN KEY: cria relacionamento com outra tabela.
- UNIQUE: impede valores repetidos.
- CHECK: impõe uma condição ao valor.
- NOT NULL: obriga a coluna a possuir valor. -> não precisa  por em constraint
## Tipos de dados
> Mais usados em aula

```sql
salario NUMBER(8,2)
nome VARCHAR2(60)
sexo CHAR(1)
data_nasc DATE
```

## Default

Valor padrão:
```sql
olimpica CHAR(1) DEFAULT 'N'
```




# Alter Table

Modifica a estrutura da tabela:
```sql
-- Adiciona coluna
ALTER TABLE atleta
ADD idade NUMBER(3);

-- Modifica coluna
ALTER TABLE atleta
MODIFY idade NUMBER(4);

-- Remove coluna
ALTER TABLE atleta
DROP COLUMN idade;

-- Adicionar constraint 

ALTER TABLE atleta
ADD CONSTRAINT atleta_clube_fk
FOREIGN KEY (id_clube)
REFERENCES clube(id);
```

> Não é possivel alterar uma constraint, deve-se dropar a constraint e criar novamente com a alteração



# Manipulação de dados

Comandos principais:
```text
INSERT → inserir
UPDATE → alterar
DELETE → excluir
SELECT → consultar
```

### INSERT

```sql
INSERT INTO atleta (
    id,
    nome,
    salario
)
VALUES (
    1,
    'Lucas',
    10000
);
```

> Cuidado com datas, para elas, usa-se:

```sql
TO_DATE('27/10/1990', 'DD/MM/YYYY')
```

Por exemplo:

```sql
INSERT INTO atleta (
    id,
    nome,
    datanasc
)
VALUES (
    1,
    'Lucas',
    TO_DATE('12/08/2000', 'DD/MM/YYYY')
);
```

### UPDATE

> Uso obrigatorio de where, sem ele, a alteração é aplicada em todas as linhas

```sql
UPDATE atleta
SET id_clube = 10
WHERE nome = 'Lucas';
```

### DELETE
> Mesma logica do update em relação ao where

```sql
DELETE FROM atleta
WHERE id = 10;
```

# Foreign Keys e DELETE CASCADE

Quando existe FK, não é possível simplesmente apagar qualquer registro que esteja sendo referenciado.

### Sem cascade

É gerado um erro, se por exemplo, um atleta referencia o clube 20, excluir o clube pode gerar erro. Por default ela vem com `RESTRICT` que gera erro.

### ON DELETE CASCADE

```sql
-- Remove a constraint para editar
ALTER TABLE atleta
DROP CONSTRAINT atleta_clube_fk;

-- Adiciona a constraint com cascade on delete
ALTER TABLE atleta
ADD CONSTRAINT atleta_clube_fk
FOREIGN KEY (id_clube)
REFERENCES clube(id)
ON DELETE CASCADE;
```


### Outras Opções

Seguindo a mesma lógica de cascade: `NO ACTION`, `SET NULL` e `SET DEFAULT`.


---

# SELECT básico

A segunda parte começa a aprofundar consultas.

Todas as colunas:

```sql
SELECT *
FROM atleta;
```

Algumas colunas:

```sql
SELECT id, nome, salario
FROM atleta;
```

Alias:

```sql
SELECT
    id AS id_atleta,
    nome AS nome_atleta
FROM atleta;
```

O material também mostra a forma sem `AS`:

```sql
SELECT id ID_CLUBE, nome NOME_CLUBE
FROM clube;
```

---

# WHERE

É o filtro da consulta.

```sql
SELECT nome, salario
FROM atleta
WHERE salario < 10000;
```

### BETWEEN

```sql
WHERE salario BETWEEN 15000 AND 25000
```

Inclui os extremos.

### IN

```sql
WHERE id_clube IN (12, 15, 24)
```

Equivale aproximadamente a:

```sql
WHERE id_clube = 12
   OR id_clube = 15
   OR id_clube = 24
```

### NULL

Não use:

```sql
id_clube = NULL
```

Use:

```sql
id_clube IS NULL
```

ou:

```sql
id_clube IS NOT NULL
```

---

# LIKE

Serve para busca por padrões.

Nome começando com `R`:

```sql
WHERE nome LIKE 'R%'
```

`%` significa **zero ou vários caracteres**.

`_` significa **exatamente um caractere**.

Exemplo do material:

```sql
WHERE nome LIKE '%t_'
```

Procura nomes em que `t` é o penúltimo caractere.

---

# ORDER BY

Ordenação:

```sql
ORDER BY nome;
```

Crescente:

```sql
ORDER BY salario ASC;
```

Decrescente:

```sql
ORDER BY salario DESC;
```

Também pode ordenar por múltiplas colunas:

```sql
ORDER BY id_clube, nome;
```

---

# DUAL no Oracle

No Oracle, quando você quer executar uma consulta que não depende de uma tabela real, utiliza-se `DUAL`.

Exemplo:

```sql
SELECT SYSDATE
FROM dual;
```

ou:

```sql
SELECT 2 + 2
FROM dual;
```

---

# SEQUENCES

Esse é um conceito bastante importante no Oracle.

Uma **sequence gera números sequenciais**, sendo útil principalmente para IDs/chaves primárias.

Exemplo:

```sql
CREATE SEQUENCE atleta_seq
START WITH 1
INCREMENT BY 1;
```

Pode configurar:

```sql
START WITH -> inicio
INCREMENT BY -> qtd de incremento
MAXVALUE -> valor maximo que a sequencia pode gerar (pode usar NOMAXVALUE 10**28-1)
MINVALUE -> valor minimo da sequencia
CYCLE / NOCYCLE -> especifica se a sequencia continua apos chegar no valor maximo, asc -> gera do valor minimo, desc -> gera do valor maximo
CACHE / NOCACHE -> define quantos valores futuros da sequence o Oracle deixa pré-carregados na memória para gerar números mais rápido.
```

> A ideia é desempenho: se a sequence é usada com muita frequência, não precisar preparar/buscar cada próximo valor individualmente pode ser mais eficiente.

Exemplo completo:

```sql
CREATE SEQUENCE teste_seq
START WITH 1
INCREMENT BY 10
MAXVALUE 9999
CYCLE
NOCACHE;
```

### NEXTVAL

Pega o próximo número:

```sql
atleta_seq.NEXTVAL
```

Exemplo:

```sql
INSERT INTO atleta (id, nome)
VALUES (atleta_seq.NEXTVAL, 'Lucas');
```

### CURRVAL

Mostra o valor atual:

```sql
SELECT atleta_seq.CURRVAL
FROM dual;
```

**Importante:** precisa executar `NEXTVAL` antes de utilizar `CURRVAL` naquela sessão.

Para alterar:

```sql
ALTER SEQUENCE atleta_seq
INCREMENT BY 10;
```

Para remover:

```sql
DROP SEQUENCE atleta_seq;
```

O material destaca que alterações só afetam valores futuros e, no contexto apresentado nas aulas, para reiniciar com outro valor a sequence é removida e recriada.

É possível alterar o valor de incremento, valor máximo,
valor mínimo, opções de ciclo ou cache.

```sql
ALTER SEQUENCE teste_seq INCREMENT BY 20
MAXVALUE 999999 NOCACHE CYCLE;
```

–  Apenas números futuros de uma sequence são afetados.
– A sequence deve ser eliminada e re-criada para reiniciar a sequence com um valor diferente.
– Alguma validação é executada (ex: máximo).

---

# Funções de texto

Você precisa reconhecer principalmente estas:

### LOWER

```sql
LOWER(nome)
```

Transforma em minúsculas.

### UPPER

```sql
UPPER(nome)
```

Maiúsculas.

### INITCAP

```sql
INITCAP(nome)
```

Primeira letra das palavras em maiúscula.

### CONCAT

```sql
CONCAT(nome, sobrenome)
```

O material destaca que `CONCAT` aceita dois argumentos e normalmente usa-se:

```sql
nome || sobrenome
```

para concatenações maiores.

```sql
SELECT nome || ' - ' || endereco AS dados_atleta
FROM atleta;
```

### SUBSTR

Recorta uma string:

```sql
SUBSTR(nome, 1, 5)
```

significa:

- `nome` → texto/coluna de onde você quer extrair
- `1` → posição inicial -> começa no 1
- `5` → quantidade de caracteres que serão retornados

### LENGTH

```sql
LENGTH(nome)
```

Retorna o tamanho.

### TRIM

Remove espaços no começo/fim:

```sql
TRIM(nome)
```

### REPLACE

```sql
REPLACE(nome, 'a', 'o')
```

Substitui texto.

### TRANSLATE

Permite substituir vários caracteres.

---

# Funções numéricas

### ROUND

Arredonda:

```sql
ROUND(salario, 2)
```

### TRUNC

Corta as casas sem arredondar:

```sql
TRUNC(salario, 2)
```

Exemplo:

```text
12.567

ROUND(..., 2) → 12.57
TRUNC(..., 2) → 12.56
```

As duas aparecem juntas nos exemplos da matéria.

---

# NVL

Muito importante no Oracle.

Serve para tratar `NULL`.

```sql
NVL(id_clube, 0)
```

Significa:

> Se `id_clube` for NULL, devolva `0`.

Exemplo:

```sql
SELECT nome, NVL(id_clube, 0)
FROM atleta;
```

---

# CASE

Estrutura condicional dentro do SQL.

```sql
SELECT
    nome,
    CASE sexo
        WHEN 'M' THEN 'Masculino'
        WHEN 'F' THEN 'Feminino'
        ELSE 'Não informado'
    END
FROM atleta;
```

Também pode usar condições:

```sql
CASE
    WHEN salario > 50000 THEN 0.30
    WHEN salario > 25000 THEN 0.20
    ELSE 0
END
```

---

# DECODE

É uma alternativa do Oracle ao `CASE` para comparações de igualdade.

```sql
DECODE(
    sexo,
    'M', 'Masculino',
    'F', 'Feminino',
    'Não informado'
)
```

É mais compacto, porém o material destaca que é voltado para comparações por igualdade.

---

# Funções de agregação

Aqui começa uma parte muito importante.

Principais:

```sql
COUNT()
SUM()
AVG()
MAX()
MIN()
```

Exemplo:

```sql
SELECT
    MAX(salario),
    MIN(salario),
    AVG(salario),
    SUM(salario),
    COUNT(*)
FROM atleta;
```

### COUNT(*) x COUNT(coluna)

```sql
COUNT(*)
```

Conta linhas.

```sql
COUNT(id_clube)
```

Conta somente valores **não nulos** daquela coluna.

---

# GROUP BY

Agrupa linhas antes de aplicar funções de agregação.

Exemplo:

```sql
SELECT sexo, COUNT(*)
FROM atleta
GROUP BY sexo;
```

Resultado conceitual:

```text
M | 15
F | 12
```

Outro:

```sql
SELECT id_clube, AVG(salario)
FROM atleta
GROUP BY id_clube;
```

Pode agrupar por várias colunas:

```sql
SELECT
    id_clube,
    sexo,
    AVG(salario)
FROM atleta
GROUP BY id_clube, sexo;
```

---

# WHERE x HAVING

Isso merece decorar.

### WHERE

Filtra **linhas antes do agrupamento**.

```sql
WHERE id_clube IN (12,15,24)
```

### HAVING

Filtra **os grupos resultantes**.

```sql
SELECT id_clube, SUM(salario)
FROM atleta
GROUP BY id_clube
HAVING SUM(salario) > 200000;
```

O próprio material enfatiza:

> Filtro envolvendo função de agrupamento deve ficar no `HAVING`, e não no `WHERE`.

Uma forma boa de pensar:

```text
WHERE  → filtra registros
GROUP BY → cria grupos
HAVING → filtra grupos
```

Um exemplo bom é pensar em uma tabela `atleta` assim:

```text
nome      id_clube   salario
Ana       12         10000
Bruno     12         20000
Carlos    12         30000
Daniel    15         50000
Eva       15         60000
Felipe    24         8000
```


> Mostrar apenas os clubes 12 e 15 cuja soma dos salários seja maior que 50000.

```sql
SELECT id_clube, SUM(salario) AS total_salarios
FROM atleta
WHERE id_clube IN (12, 15)
GROUP BY id_clube
HAVING SUM(salario) > 50000;
```

A execução pode ser pensada assim:

```text
1. WHERE
   mantém apenas os atletas dos clubes 12 e 15

2. GROUP BY
   agrupa os atletas por clube

3. SUM
   clube 12 → 10000 + 20000 + 30000 = 60000
   clube 15 → 50000 + 60000 = 110000

4. HAVING
   mantém apenas os grupos cuja soma > 50000
```

Resultado:

```text
id_clube   total_salarios
12         60000
15         110000
```

A diferença principal é esta:

```sql
WHERE salario > 10000
```

Aqui você está perguntando:

> Quais **atletas** têm salário maior que 10000?

Já:

```sql
HAVING SUM(salario) > 50000
```

é:

> Quais **clubes**, depois de agrupados, possuem soma salarial maior que 50000?

---

# INNER JOIN

A Parte 3 entra pesado em junções.

Um `INNER JOIN` retorna registros que possuem correspondência nas duas tabelas.

```sql
SELECT
    c.nome,
    a.nome
FROM atleta a
JOIN clube c
    ON a.id_clube = c.id;
```

Mentalmente:

```text
ATLETA             CLUBE

id_clube = 10 ---> id = 10
```

Você também pode juntar várias tabelas:

```sql
SELECT
    a.nome,
    m.descricao,
    p.data_inicio
FROM pratica p
JOIN atleta a
    ON p.id_atleta = a.id
JOIN modalidade m
    ON p.id_modalidade = m.id;
```

Essa provavelmente é uma das habilidades mais importantes da matéria: **descobrir o caminho das FKs e construir os JOINs**.

---

# LEFT JOIN

Mantém **todos os registros da tabela da esquerda**, mesmo sem correspondência.

```sql
SELECT
    a.nome,
    c.nome
FROM atleta a
LEFT JOIN clube c
    ON a.id_clube = c.id;
```

Dessa forma, aparecem também atletas sem clube.

Mentalmente:

```text
LEFT JOIN

A ✓
A ✓
A ✓
A sem B → continua aparecendo
```

---

# RIGHT JOIN

Faz o contrário: preserva a tabela da direita.

```sql
SELECT c.nome, p.nome
FROM clube c
RIGHT JOIN presidente p
    ON c.id_presidente = p.id;
```

Assim aparecem inclusive presidentes que não presidem clube algum.

---

# FULL OUTER JOIN

Preserva registros dos **dois lados**, mesmo sem correspondência.

```sql
SELECT c.nome, p.nome
FROM clube c
FULL OUTER JOIN presidente p
    ON c.id_presidente = p.id;
```

Resumo:

```text
INNER → só correspondências

LEFT → todos da esquerda

RIGHT → todos da direita

FULL → todos dos dois lados
```

---

# Subconsultas

É basicamente colocar um `SELECT` dentro de outro.

Exemplo:

> atletas que ganham mais que Hoyt Hawker.

Primeiro você precisa descobrir o salário dele:

```sql
SELECT salario
FROM atleta
WHERE nome = 'Hoyt Hawker';
```

Depois:

```sql
SELECT cpf, nome, salario
FROM atleta
WHERE salario > (
    SELECT salario
    FROM atleta
    WHERE nome = 'Hoyt Hawker'
);
```

A lógica é:

```text
consulta interna → descobre um valor
        ↓
consulta externa → usa esse valor
```

---

# IN em subconsultas

Se uma subconsulta pode retornar vários valores:

```sql
SELECT nome
FROM atleta
WHERE id_clube IN (
    SELECT id
    FROM clube
    WHERE ...
);
```

Você não pode usar simplesmente:

```sql
salario > (subconsulta com vários salários)
```

porque `>` espera um único valor.

### `ALL`

A condição precisa ser verdadeira para **todos os valores** retornados.

Exemplo:

```sql
SELECT nome, salario
FROM atleta
WHERE salario > ALL (
    SELECT salario
    FROM atleta
    WHERE nome IN ('Pernell Boorer', 'Yale Buttle')
);
```

Se a subconsulta retornar:

```text
20000
30000
```

então:

```sql
salario > ALL (20000, 30000)
```

significa, na prática:

```text
salario > 30000
```

Ou seja: tem que ganhar mais que **os dois**. Esse é o exemplo do material.

### `ANY`

A condição precisa ser verdadeira para **pelo menos um** dos valores.

```sql
SELECT nome, salario
FROM atleta
WHERE salario > ANY (
    SELECT salario
    FROM atleta
    WHERE nome IN ('Pernell Boorer', 'Yale Buttle')
);
```

Se a subconsulta retornar:

```text
20000
30000
```

então:

```sql
salario > ANY (20000, 30000)
```

basta ser maior que um deles. Na prática:

```text
salario > 20000
```

O material usa `ANY` justamente para a ideia de ganhar mais que um **ou** outro.

Pra decorar:

```text
IN  → está entre esses valores?
ALL → condição vale para TODOS?
ANY → condição vale para PELO MENOS UM?
```

Exemplo rápido:

```text
subconsulta retorna: 10, 20, 30

x IN (...)     → x é 10, 20 ou 30
x > ALL (...)  → x > 30
x > ANY (...)  → x > 10
```

---


# Cuidado com NOT IN + NULL

Isso é uma pegadinha importante.

```sql
WHERE id NOT IN (
    SELECT id_presidente
    FROM clube
)
```

Se a subconsulta retornar algum `NULL`, o resultado pode não funcionar como esperado.

O material destaca esse problema explicitamente.

Uma solução apresentada é:

```sql
SELECT NVL(id_presidente, 0)
```

ou:

```sql
WHERE id_presidente IS NOT NULL
```

na subconsulta.

---

# EXISTS

`EXISTS` pergunta:

> Existe pelo menos uma linha que satisfaz essa condição?

```sql
SELECT nome
FROM atleta a
WHERE EXISTS (
    SELECT 1
    FROM pratica p
    WHERE p.id_atleta = a.id
);
```

Significa:

> Mostre atletas para os quais existe pelo menos uma prática cadastrada.

---

# NOT EXISTS

É o inverso:

```sql
SELECT nome
FROM atleta a
WHERE NOT EXISTS (
    SELECT 1
    FROM pratica p
    WHERE p.id_atleta = a.id
);
```

Significa:

> atletas para os quais não existe nenhuma prática.

---

# UNION

Junta os resultados de duas consultas e **remove duplicados**.

```sql
SELECT id_atleta
FROM olimpico

UNION

SELECT id_atleta
FROM paraolimpico;
```

Pensamento:

```text
A ∪ B
```

---

# UNION ALL

Faz praticamente a mesma coisa, mas **mantém duplicados**.

```sql
SELECT id
FROM tabela1

UNION ALL

SELECT id
FROM tabela2;
```

O material também destaca que, por não eliminar duplicidades, pode ser mais rápido.

---

# INTERSECT

Retorna os valores presentes **nos dois resultados**.

```sql
SELECT registro_atleta
FROM esporte

INTERSECT

SELECT registro_atleta
FROM participa;
```

Mentalmente:

```text
A ∩ B
```

---

# MINUS

Retorna registros existentes na primeira consulta e **não existentes na segunda**.

```sql
SELECT id
FROM atleta

MINUS

SELECT id_atleta
FROM olimpico;
```

O exemplo do material combina inclusive `MINUS` com `UNION` para encontrar atletas que não são nem olímpicos nem paraolímpicos.

---







