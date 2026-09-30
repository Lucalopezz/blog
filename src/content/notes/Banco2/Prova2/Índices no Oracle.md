---
title: "Índices no Oracle"
description: "B-tree, bitmap, índices por função e compostos, planos de execução e exercícios de consultas."
category: "Banco de Dados II"
tags: [oracle, sql, indices, desempenho, explain-plan]
---

# Índices no Oracle

## 1. O que é um índice?

Um índice ajuda o banco a localizar linhas por valores de uma ou mais colunas, como o índice de um livro ajuda a achar um assunto. O otimizador **pode** usá-lo para evitar ler a tabela inteira, mas escolhe o caminho que estima ser mais barato para cada consulta.

Índices ocupam espaço e precisam ser mantidos quando os dados mudam por `INSERT`, `UPDATE` ou `DELETE`. Por isso, criar um índice só faz sentido quando o ganho nas consultas compensa esse custo. Uma busca que devolve grande parte da tabela ou uma tabela muito pequena podem continuar usando `TABLE ACCESS FULL`.

Uma `PRIMARY KEY` normalmente já é atendida por um índice criado ou reutilizado pelo Oracle. Não crie outro índice idêntico sem verificar os existentes. Uma **chave estrangeira não recebe automaticamente** seu próprio índice: filtre, faça junções e confira o plano antes de decidir indexá-la.

> [!important] Regra prática, não garantia
> A aula cita filtros que recuperam até 10% das linhas como bons candidatos. Esse percentual é apenas uma aproximação didática: tamanho da tabela, distribuição dos valores, estatísticas e custo de acesso às linhas também influenciam a escolha do otimizador.

## 2. B-tree e bitmap

| Tipo | Como funciona | Uso típico |
| --- | --- | --- |
| B-tree | Árvore **balanceada** que organiza chaves e referências às linhas | Igualdade, intervalos e colunas mais seletivas, como CPF ou nome |
| Bitmap | Representa as linhas de cada valor por bits | Poucos valores distintos e carga analítica com poucas alterações concorrentes |

No material, `sexo` e `cor_olhos` aparecem como colunas de baixa cardinalidade, enquanto `nome` distingue melhor as linhas. Um índice B-tree em `sexo` pode não ajudar uma busca por metade dos atletas. Um índice bitmap pode servir para análises em um *data warehouse*, mas costuma ser inadequado em tabelas com atualizações frequentes e concorrentes.

```sql
CREATE INDEX pessoa_nome_ix ON pessoa (nome);

CREATE BITMAP INDEX pessoa_olhos_bmix ON pessoa (cor_olhos);
```

O slide escreve `CREATE [OR REPLACE] INDEX`; para os exemplos desta nota, use a sintaxe `CREATE INDEX` ou `CREATE BITMAP INDEX`. Se o índice já existir, avalie `ALTER INDEX` ou remova-o antes de recriar.

## 3. Quando o índice pode ajudar?

### Filtro seletivo

```sql
SELECT * FROM pessoa WHERE nome = 'João 062000';

CREATE INDEX pessoa_nome_ix ON pessoa (nome);
```

Se cada nome identificar poucas linhas, o plano pode trocar uma leitura completa por `INDEX RANGE SCAN` e, quando precisar de outras colunas, `TABLE ACCESS BY INDEX ROWID`.

### Filtro pouco seletivo

```sql
SELECT * FROM pessoa WHERE sexo = 'M';
```

No exemplo da aula, metade das 100 mil pessoas tem esse valor. Ler a tabela inteira pode custar menos do que percorrer um índice B-tree e buscar milhares de linhas. Criar o índice não obriga o Oracle a usá-lo.

### Junções

```sql
SELECT p.nome, c.descricao
FROM pessoa p
JOIN categoria c ON c.categ_id = p.categ_id
WHERE p.categ_id = 12;
```

O índice da chave primária `categoria.categ_id` ajuda a localizar a categoria. Dependendo da quantidade de pessoas por categoria, um índice em `pessoa.categ_id` também pode ser útil; o índice da PK da outra tabela não substitui esse índice na FK. Sem filtro seletivo, o otimizador pode preferir varreduras completas e `HASH JOIN`.

## 4. Índice baseado em função

Aplicar uma função à coluna muda a expressão pesquisada:

```sql
SELECT * FROM pessoa WHERE UPPER(nome) = 'JOÃO 062000';
```

Um índice comum em `nome` geralmente não atende a essa expressão. Se a consulta for frequente e seletiva, crie o índice com a mesma expressão:

```sql
CREATE INDEX pessoa_nome_maiusc_ix ON pessoa (UPPER(nome));
```

O otimizador ainda decide se vale usá-lo. Esse índice atende à expressão `UPPER(nome)`; uma consulta por `nome` sem função pode precisar de outro índice. Outra opção é manter os dados padronizados para consultar sem a função.

## 5. Índice composto e ordem das colunas

```sql
CREATE INDEX pessoa_cat_nome_ix ON pessoa (categ_id, nome);

SELECT *
FROM pessoa
WHERE categ_id = 1 AND nome LIKE 'João 09%';
```

O índice é organizado primeiro por `categ_id` e depois por `nome`. Uma busca só por `categ_id` ainda pode aproveitá-lo. Uma busca só por `nome` não faz o acesso direto usual pela primeira coluna; em certas condições o Oracle pode escolher um `INDEX SKIP SCAN`, portanto dizer que **nunca** o usará seria incorreto.

Em filtros com intervalos, como `salario BETWEEN ...` junto de `datanasc > ...`, a ordem das colunas e a seletividade de cada condição importam. Compare planos e custo antes de fixar um índice composto.

## 6. Lendo o plano de execução

No SQL Developer, a aula usa **F10** ou o botão *Explain Plan*. Pelo SQL:

```sql
EXPLAIN PLAN FOR
    SELECT * FROM pessoa WHERE nome = 'João 062000';

SELECT PLAN_TABLE_OUTPUT
FROM TABLE(DBMS_XPLAN.DISPLAY());
```

É possível identificar um plano:

```sql
EXPLAIN PLAN SET STATEMENT_ID = 'Plano_01' FOR
    SELECT * FROM pessoa WHERE nome = 'João 062000';

SELECT PLAN_TABLE_OUTPUT
FROM TABLE(DBMS_XPLAN.DISPLAY(NULL, 'Plano_01', 'BASIC'));
```

| Operação | Leitura rápida |
| --- | --- |
| `TABLE ACCESS FULL` | Lê a tabela inteira |
| `INDEX UNIQUE SCAN` | Busca uma chave única |
| `INDEX RANGE SCAN` | Lê uma faixa de chaves |
| `INDEX FULL SCAN` / `INDEX FAST FULL SCAN` | Percorre o índice inteiro por métodos diferentes |
| `TABLE ACCESS BY INDEX ROWID` | Busca linhas da tabela a partir do índice |
| `NESTED LOOPS` / `HASH JOIN` | Estratégias de junção |
| `SORT` / `FILTER` | Ordenação ou aplicação de filtro |

`EXPLAIN PLAN` apresenta uma **estimativa**. Compare os planos antes e depois de criar um índice, sem concluir que um plano com `TABLE ACCESS FULL` é necessariamente pior. A aula também mostra `ALTER INDEX nome_ix RENAME TO novo_nome_ix;`, `ALTER INDEX nome_ix REBUILD;` e `DROP INDEX nome_ix;` para manutenção.

## 7. Exercícios da aula de índices

Os enunciados pedem consultas e a avaliação de possíveis índices. Os SQLs abaixo seguem **os enunciados**. A última lâmina do PDF traz respostas, mas nas questões 2 e 7 usa tabelas de outros exercícios e, na 3, menciona `departamento`; por isso, essas partes estão corrigidas aqui. Os índices são **candidatos para testar com `EXPLAIN PLAN`**, não ordens para criar todos de uma vez. Pressupõem as tabelas e colunas usadas na aula.

### 1. ID e nome dos atletas do clube 10

```sql
SELECT id, nome FROM atleta WHERE id_clube = 10;

-- Candidato se o filtro for seletivo:
CREATE INDEX atl_clube_ix ON atleta (id_clube);
```

### 2. Atletas com menos de 20 anos

```sql
SELECT *
FROM atleta
WHERE datanasc > ADD_MONTHS(TRUNC(SYSDATE), -20 * 12);

-- Candidato para a busca por data de nascimento:
CREATE INDEX atl_dtnasc_ix ON atleta (datanasc);
```

A resposta do slide consulta `dependente` e usa `365 * 12`, o que não responde ao enunciado e não representa 20 anos. Aqui o corte usa meses de calendário; `>` exclui quem completa 20 anos hoje.

### 3. Clube 30, seu presidente e a fundação

```sql
SELECT c.nome AS clube, p.nome AS presidente, c.data_fundacao
FROM clube c
JOIN presidente p ON p.id = c.id_presidente
WHERE c.id = 30;
```

As chaves primárias de `clube.id` e `presidente.id` normalmente já têm índices. A referência a `departamento` no comentário do gabarito é um erro de nomenclatura.

### 4. Clube Alpha Team e seus centros de treinamento

```sql
SELECT c.nome, ct.*
FROM clube c
JOIN centro_treinamento ct ON ct.id_clube = c.id
WHERE c.nome = 'Alpha Team';

-- Candidatos se os planos e os dados justificarem:
CREATE INDEX clube_nome_ix ON clube (nome);
CREATE INDEX ct_clube_ix ON centro_treinamento (id_clube);
```

### 5. Atletas do sexo masculino

```sql
SELECT * FROM atleta WHERE sexo = 'M';
```

O gabarito sugere `CREATE BITMAP INDEX atl_sexo_bmix ON atleta (sexo);`. Considere isso apenas em uma tabela voltada à análise e com poucas alterações concorrentes. Se a consulta traz grande parte dos atletas, uma varredura completa pode ser melhor.

### 6. Atleta PERNELL BOORER, comparando com `UPPER`

```sql
SELECT *
FROM atleta
WHERE UPPER(nome) = 'PERNELL BOORER';

CREATE INDEX atl_nomemaiusc_ix ON atleta (UPPER(nome));
```

### 7. ID do clube e quantidade de centros de treinamento

```sql
SELECT c.id AS id_clube, COUNT(ct.id_clube) AS quantidade_centros
FROM clube c
LEFT JOIN centro_treinamento ct ON ct.id_clube = c.id
GROUP BY c.id;
```

`LEFT JOIN` mantém clubes sem centro, com contagem zero. A resposta do slide usa `projeto` e `depto_num`, que pertencem a outro contexto. Um índice em `centro_treinamento(id_clube)` pode ajudar certas junções ou consultas por clube; para agregar **todos** os clubes, confirme no plano se ele realmente traz ganho.

### 8. Salário entre 40 mil e 50 mil, nascimento após 01/01/1990

```sql
SELECT *
FROM atleta
WHERE salario BETWEEN 40000 AND 50000
  AND datanasc > DATE '1990-01-01';

-- Candidato do gabarito, sujeito à comparação de planos:
CREATE INDEX atl_sal_dtnasc_ix ON atleta (salario, datanasc);
```

`BETWEEN` inclui os limites salariais. `>` segue literalmente “depois de 1 de janeiro de 1990”. O índice composto pode ajudar, mas a primeira condição é um intervalo; teste também outras ordens de coluna se esse filtro for importante.

## Para lembrar

```text
Índice acelera algumas leituras, mas custa espaço e manutenção.
Crie candidatos a partir das consultas reais e confirme com o plano.
PK costuma ter índice; FK não ganha índice automaticamente.
UPPER(coluna) pede índice na expressão, quando necessário.
Bitmap é mais apropriado para análise com poucas alterações.
```

### Referências

- Material da aula: *BD2_12_Indices_Oracle.pdf*.
- [Oracle: CREATE INDEX](https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/CREATE-INDEX.html).
- [Oracle: caminhos de acesso do otimizador](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/optimizer-access-paths.html).
- [Oracle: planos de execução](https://docs.oracle.com/en/database/oracle/oracle-database/19/tgsql/generating-and-displaying-execution-plans.html).
