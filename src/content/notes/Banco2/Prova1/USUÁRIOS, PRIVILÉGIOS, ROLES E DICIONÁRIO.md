
# Database, Schema e Usuário

Conceitualmente:

```text
Database → contém os dados

Schema → organiza objetos

Usuário → identidade que acessa o SGBD
```

O material ressalta que isso muda dependendo do SGBD.

# Oracle: usuário = schema

Esse é o que realmente importa para essa disciplina.

No Oracle:

> **cada usuário possui um schema de mesmo nome.**

Assim:

```text
usuário JOSE
      ↓
schema JOSE
      ↓
JOSE.tabela
```

Exemplo:

```sql
SELECT *
FROM HR.atleta;
```

Significa:

> acessar a tabela `ATLETA` pertencente ao schema/usuário `HR`.

Por padrão, para acessar objetos de outro schema você precisa indicar seu dono e ter os privilégios necessários.

Pra decorar:

```text
Oracle:

USUÁRIO ≈ SCHEMA
```

---

# Criando usuário

```sql
CREATE USER JOSE
IDENTIFIED BY JOSE;
```

Forma geral:

```sql
CREATE USER usuario
IDENTIFIED BY senha;
```

---

# Criar usuário não significa que ele pode conectar

Essa é uma pegadinha importante.

Criar:

```sql
CREATE USER JOSE
IDENTIFIED BY JOSE;
```

não significa automaticamente que José pode entrar.

Você precisa:

```sql
GRANT CREATE SESSION
TO JOSE;
```

Então:

```text
CREATE USER
→ cria usuário

CREATE SESSION
→ permite login
```

---

# Privilégios de sistema

São permissões sobre operações no próprio Oracle.

Exemplos:

```sql
CREATE SESSION
CREATE TABLE
CREATE SEQUENCE
CREATE VIEW
CREATE PROCEDURE
```

Exemplo:

```sql
GRANT
    CREATE SESSION,
    CREATE TABLE,
    CREATE SEQUENCE,
    CREATE VIEW
TO JOSE;
```

Agora José pode:

```text
entrar
criar tabelas
criar sequences
criar views
```

---

# CREATE TABLE x CREATE ANY TABLE

Essa diferença é importante.

```sql
GRANT CREATE TABLE
TO JOSE;
```

Permite criar tabela no **próprio schema**.

Por exemplo:

```sql
CREATE TABLE teste (...);
```

ou conceitualmente:

```text
JOSE.TESTE
```

Já:

```sql
GRANT CREATE ANY TABLE
TO JOSE;
```

permite criar tabela em **outros schemas**.

Exemplo:

```sql
CREATE TABLE HR.teste (
    id NUMBER
);
```

O material utiliza exatamente esse exemplo.

Mentalmente:

```text
CREATE TABLE
→ meu schema

CREATE ANY TABLE
→ qualquer schema
```

---

# Outros privilégios ANY

O mesmo conceito aparece com:

```sql
CREATE ANY VIEW
DROP ANY VIEW
DROP ANY TABLE
```

Exemplo:

```sql
GRANT DROP ANY TABLE
TO JOSE;
```

permite:

```sql
DROP TABLE HR.teste;
```

---

# Quota

Mesmo tendo:

```sql
GRANT CREATE TABLE TO JOSE;
```

o usuário pode não conseguir criar objetos se não possuir espaço permitido no `tablespace`.

A aula utiliza:

```sql
ALTER USER JOSE
QUOTA UNLIMITED ON USERS;
```

Mentalmente:

```text
CREATE TABLE → permissão

QUOTA → espaço disponível
```

---

# Alterar senha

```sql
	ALTER USER HR
IDENTIFIED BY nova_senha;
```

---

# Travar e destravar usuário

Destravar:

```sql
ALTER USER HR
ACCOUNT UNLOCK;
```

Travar:

```sql
ALTER USER HR
ACCOUNT LOCK;
```

---

# Privilégios de sistema x privilégios de objeto

Essa diferença merece decorar.

### Sistema

Permite fazer alguma coisa no banco:

```text
CREATE TABLE
CREATE VIEW
CREATE SESSION
CREATE SEQUENCE
```

### Objeto

Permite fazer algo **sobre um objeto específico**:

```text
SELECT
INSERT
UPDATE
DELETE
```

O material separa justamente segurança do sistema e segurança dos dados dessa forma.

Mentalmente:

```text
Sistema → "posso criar uma tabela?"

Objeto → "posso consultar ESTA tabela?"
```

---

# GRANT em objetos

Exemplo:

```sql
GRANT SELECT, INSERT
ON HR.atleta
TO JOSE;
```

Significa:

> José pode consultar e inserir dados em `HR.ATLETA`.

Estrutura geral:

```sql
GRANT privilegio
ON objeto
TO usuario;
```

---

# Privilégio em coluna específica

Você também pode restringir um privilégio a certas colunas.

Exemplo da aula:

```sql
GRANT UPDATE (nome, salario)
ON HR.atleta
TO JOSE;
```

Agora José pode alterar:

```text
nome
salario
```

mas não necessariamente as demais colunas.

---

# WITH GRANT OPTION

Isso permite que quem recebeu o privilégio **retransmita esse privilégio**.

```sql
GRANT SELECT, INSERT
ON HR.clube
TO JOSE
WITH GRANT OPTION;
```

Agora José pode fazer:

```sql
GRANT SELECT, INSERT
ON HR.clube
TO MARIA;
```

Mentalmente:

```text
HR
 ↓ GRANT OPTION
JOSE
 ↓ GRANT
MARIA
```

---

# REVOKE

Remove privilégios.

### Sistema

```sql
REVOKE CREATE SESSION, CREATE TABLE
FROM JOSE;
```

### Objeto

```sql
REVOKE SELECT, INSERT
ON HR.clube
FROM JOSE;
```

O material ainda mostra que privilégios repassados via `WITH GRANT OPTION` também podem ser revogados em cascata.

---

# PUBLIC

Você pode conceder algo para:

```sql
PUBLIC
```

Exemplo:

```sql
GRANT SELECT
ON HR.presidente
TO PUBLIC;
```

Significa:

> todos os usuários podem consultar.

O material faz um alerta importante: isso vale inclusive para usuários criados futuramente.

Então:

```text
PUBLIC = TODO MUNDO
```


---

#  Roles

Uma **ROLE** é um grupo de privilégios.

Sem role:

```text
JOSE  → CREATE TABLE
JOSE  → CREATE VIEW
JOSE  → CREATE SEQUENCE

MARIA → CREATE TABLE
MARIA → CREATE VIEW
MARIA → CREATE SEQUENCE

PEDRO → CREATE TABLE
PEDRO → CREATE VIEW
PEDRO → CREATE SEQUENCE
```

Muito repetitivo.

Com role:

```text
        DESENVOLVEDOR
        /     |     \
CREATE TABLE VIEW SEQUENCE
        ↑
   ┌────┼────┐
 JOSE MARIA PEDRO
```

O material define role justamente como um grupo de privilégios relacionados.

---

# Criando uma role

```sql
CREATE ROLE desenvolvedor;
```

Depois:

```sql
GRANT
    CREATE SESSION,
    CREATE TABLE,
    CREATE VIEW,
    CREATE SEQUENCE
TO desenvolvedor;
```

Agora:

```sql
GRANT desenvolvedor
TO MARIA;
```

Maria recebe os privilégios da role.

Fluxo:

```text
privilégios
     ↓
   ROLE
     ↓
 usuários
```

---

# Resumo de GRANT

Você pode conceder privilégio para:

```text
usuário
role
PUBLIC
```

Exemplos:

```sql
GRANT CREATE TABLE
TO JOSE;
```

```sql
GRANT CREATE TABLE
TO desenvolvedor;
```

```sql
GRANT SELECT
ON HR.atleta
TO PUBLIC;
```

---

# Dicionário de Dados

O **Data Dictionary** é um conjunto de tabelas/views mantidas pelo próprio Oracle com informações **sobre o banco de dados**.

Ou seja, são dados sobre os dados.

Pode conter informações sobre:

```text
usuários
tabelas
views
colunas
constraints
sequences
privilégios
auditoria
...
```

É criado e mantido automaticamente pelo Oracle e é somente leitura para consulta.

É o famoso:

> **metadado**.

---

# Dados normais x Dicionário

Imagine:

```text
ATLETA

id | nome | salario
1  | Ana  | 10000
```

Isso é **dado da aplicação**.

Já:

```text
ATLETA possui:
- coluna ID NUMBER
- coluna NOME VARCHAR2
- coluna SALARIO NUMBER
- PK ...
```

isso é **metadado**.

O Dicionário guarda esse segundo tipo de informação.

---

# Prefixos USER, ALL e DBA

Essa divisão é muito importante.

### USER_

Mostra aquilo que **pertence ao seu schema**.

```text
USER = eu sou o dono
```

### ALL_

Mostra aquilo que você **pode acessar**.

```text
ALL = tenho acesso
```

### DBA_

Mostra objetos de **todos os schemas**.

Normalmente usado pelo DBA.

### V$

Informações relacionadas principalmente a desempenho/estado da instância.

O material resume exatamente esses prefixos dessa maneira.

Pra decorar:

```text
USER_ → meus objetos
ALL_  → objetos que posso acessar
DBA_  → todos os objetos
V$    → performance/instância
```

---

# USER_OBJECTS

Mostra os objetos que pertencem ao seu schema.

```sql
SELECT *
FROM USER_OBJECTS;
```

Pode listar coisas como:

```text
TABLE
VIEW
SEQUENCE
...
```

além de criação, última alteração e status.

---

# ALL_OBJECTS

```sql
SELECT *
FROM ALL_OBJECTS;
```

Mostra objetos aos quais o usuário possui acesso, mesmo que não seja o dono.

Então:

```text
USER_OBJECTS
→ meus

ALL_OBJECTS
→ meus + outros que posso acessar
```

---

# Principais views do Dicionário estudadas

O resumo da aula lista:

```text
DICTIONARY         → views/tabelas do dicionário
USER_OBJECTS       → objetos que eu possuo
USER_TABLES        → minhas tabelas
USER_TAB_COLUMNS   → colunas, tipos e NULL
USER_CONSTRAINTS   → nome e tipo das constraints
USER_CONS_COLUMNS  → constraint + coluna
USER_VIEWS         → views + SELECT que as define
USER_SEQUENCES     → sequences + configurações
```

---

# DICTIONARY

Lista as views/tabelas do dicionário de dados.

```sql
SELECT table_name
FROM dictionary;
```

Exemplo de resultado:

```text
USER_TABLES
USER_VIEWS
USER_OBJECTS
USER_SEQUENCES
```

# USER_OBJECTS

Lista os objetos pertencentes ao usuário.

```sql
SELECT object_name, object_type
FROM user_objects;
```

Exemplo de resultado:

```text
ATLETA      TABLE
V_ATLETAS   VIEW
ATLETA_SEQ  SEQUENCE
```

# USER_TABLES

Lista as tabelas do usuário.

```sql
SELECT table_name
FROM user_tables;
```

Exemplo de resultado:

```text
ATLETA
CLUBE
CAMPEONATO
MODALIDADE
```

# USER_TAB_COLUMNS

Lista as colunas das tabelas, seus tipos e se aceitam `NULL`.

```sql
SELECT column_name, data_type, nullable
FROM user_tab_columns
WHERE table_name = 'ATLETA';
```

Exemplo de resultado:

```text
ID        NUMBER    N
NOME      VARCHAR2  N
SALARIO   NUMBER    N
ID_CLUBE  NUMBER    Y
```

# USER_CONSTRAINTS

Lista as constraints das tabelas.

```sql
SELECT constraint_name, constraint_type
FROM user_constraints
WHERE table_name = 'ATLETA';
```

Exemplo de resultado:

```text
ATLETA_PK        P
ATLETA_CPF_UK    U
ATLETA_CLUBE_FK  R
```

# USER_CONS_COLUMNS

Lista as colunas usadas nas constraints.

```sql
SELECT constraint_name, column_name
FROM user_cons_columns
WHERE table_name = 'ATLETA';
```

Exemplo de resultado:

```text
ATLETA_PK        ID
ATLETA_CPF_UK    CPF
ATLETA_CLUBE_FK  ID_CLUBE
```

# USER_VIEWS

Lista as views do usuário e sua definição.

```sql
SELECT view_name, text
FROM user_views;
```

Exemplo de resultado:

```text
V_ATLETAS   SELECT ID, NOME FROM ATLETA
V_CLUBES    SELECT ID, NOME FROM CLUBE
```

# USER_SEQUENCES

Lista as sequences do usuário e suas configurações.

```sql
SELECT sequence_name, increment_by, last_number
FROM user_sequences;
```

Exemplo de resultado:

```text
ATLETA_SEQ  1   51
CLUBE_SEQ   10  130
```

Essas são as principais views do dicionário trabalhadas na aula.

---

# Gerando SQL com o Dicionário

Essa parte é especialmente interessante.

Você pode consultar o Dicionário e **montar comandos SQL como texto**.

Por exemplo:

```sql
SELECT 'DROP TABLE ' || TABLE_NAME || ';'
FROM USER_TABLES;
```

Imagine:

```text
USER_TABLES:

ATLETA
CLUBE
PRATICA
```

A consulta gera:

```sql
DROP TABLE ATLETA;
DROP TABLE CLUBE;
DROP TABLE PRATICA;
```

Ou seja:

```text
Dicionário
    ↓
consulta metadados
    ↓
concatena strings
    ↓
gera SQL
```

---

# Outro exemplo de SQL dinâmico

O material mostra:

```sql
SELECT
    'GRANT SELECT ON '
    || TABLE_NAME
    || ' TO JOSE, MARIA;'
FROM USER_TABLES
WHERE TABLE_NAME IN (
    'ATLETA',
    'PRATICA',
    'MODALIDADE',
    'CLUBE'
);
```

Resultado:

```sql
GRANT SELECT ON ATLETA TO JOSE, MARIA;
GRANT SELECT ON PRATICA TO JOSE, MARIA;
GRANT SELECT ON MODALIDADE TO JOSE, MARIA;
GRANT SELECT ON CLUBE TO JOSE, MARIA;
```

Depois você pode copiar e executar os comandos.

---
