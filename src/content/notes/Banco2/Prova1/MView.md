
## O que é uma Materialized View?

Uma **Materialized View (MView)** é uma consulta cujo **resultado fica armazenado fisicamente no banco**.

Ou seja, diferente de uma `VIEW` normal, ela realmente guarda os dados resultantes da consulta.

Mentalmente:

```text
Tabela(s)
   ↓
SELECT complexo
   ↓
resultado armazenado fisicamente
   ↓
MATERIALIZED VIEW
```

Exemplo conceitual:

```sql
CREATE MATERIALIZED VIEW mv_clubes AS
SELECT id_clube, COUNT(*)
FROM atleta
GROUP BY id_clube;
```

Agora o resultado dessa consulta fica armazenado na `mv_clubes`.

---

# VIEW x MATERIALIZED VIEW

Essa diferença é essencial.

### VIEW

```text
não armazena os dados
        ↓
armazena apenas o SELECT
        ↓
executa o SELECT quando consultada
```

### MATERIALIZED VIEW

```text
executa o SELECT
        ↓
armazena fisicamente o resultado
        ↓
resultado é atualizado através de REFRESH
```

O material define exatamente essa diferença: a `VIEW` é virtual, enquanto a MView ocupa espaço e mantém uma cópia dos dados da consulta.

Uma forma boa de decorar:

```text
VIEW  → guarda a consulta
MVIEW → guarda o resultado da consulta
```

---

# Por que usar MView?

Principalmente para evitar executar repetidamente uma consulta muito pesada.

Imagine:

```sql
SELECT c.nome,
       COUNT(a.id),
       AVG(a.salario),
       SUM(p.valor_premiacao)
FROM ...
JOIN ...
JOIN ...
GROUP BY ...
```

Se essa consulta demora 30 segundos e é executada centenas de vezes, pode fazer sentido armazenar seu resultado.

Então:

```text
consulta complexa
      ↓
executa periodicamente
      ↓
resultado fica pronto
      ↓
SELECT na MView fica muito mais simples
```

O material aponta uso principalmente em **replicação de dados e ambientes OLAP/Data Warehouse**, mas também cita casos em OLTP quando existem consultas muito pesadas.

---

# Desvantagem: dados podem estar desatualizados

Esse é o principal trade-off.

Se a tabela possui:

```text
salario = 5000
```

e a MView foi atualizada às 10h, mas às 10h05 ocorre:

```sql
UPDATE atleta
SET salario = 6000;
```

a MView pode continuar mostrando:

```text
5000
```

até acontecer o próximo `REFRESH`.

Por isso:

```text
MView
↑ performance

mas

↓ pode não ter dados em tempo real
```

O material ressalta que pode haver diferença de segundos, minutos ou horas entre a MView e as tabelas base, dependendo do refresh configurado.

---

# REFRESH

`REFRESH` é a atualização dos dados da MView.

Mentalmente:

```text
Tabela mudou
    ↓
MView ainda possui dados antigos
    ↓
REFRESH
    ↓
MView atualizada
```

---

# Estrutura básica de uma MView

A estrutura apresentada na aula é:

```sql
CREATE MATERIALIZED VIEW nome
BUILD [IMMEDIATE | DEFERRED]
REFRESH [FAST | COMPLETE | FORCE]
ON [COMMIT | DEMAND]
AS
SELECT ...;
```

Temos três decisões diferentes:

```text
BUILD   → quando ela será populada inicialmente

REFRESH → como os dados serão atualizados

ON      → quando ocorrerá a atualização
```

---

# BUILD IMMEDIATE

```sql
BUILD IMMEDIATE
```

Significa:

> execute a consulta e popule a MView **na criação**.

Exemplo:

```sql
CREATE MATERIALIZED VIEW mv_atleta
BUILD IMMEDIATE
AS
SELECT id, nome
FROM atleta;
```

Logo depois:

```sql
SELECT *
FROM mv_atleta;
```

já possui dados.

---

# BUILD DEFERRED

```sql
BUILD DEFERRED
```

Significa:

> crie a MView agora, mas não carregue seus dados ainda.

Ela será populada somente no primeiro `REFRESH`.

Resumo:

```text
IMMEDIATE → popula agora
DEFERRED  → popula depois
```

---

# REFRESH COMPLETE

```sql
REFRESH COMPLETE
```

O Oracle refaz completamente a MView.

Mentalmente:

```text
dados antigos
    ↓
remove tudo
    ↓
executa novamente o SELECT
    ↓
armazena tudo novamente
```

É mais pesado, porém o material destaca que funciona em todos os casos.

---

# REFRESH FAST

```sql
REFRESH FAST
```

Em vez de recalcular tudo:

> atualiza apenas aquilo que mudou.

Para isso é utilizado um **Materialized View Log**.

```text
Tabela
  ↓
alterações
  ↓
MView Log
  ↓
FAST REFRESH
  ↓
MView
```

O material explica que o `FAST` consulta o log para descobrir o que mudou desde o último refresh, recomendado usar em consultas mais simples.

---

# Materialized View Log

Para permitir `FAST REFRESH`, você pode precisar criar:

```sql
CREATE MATERIALIZED VIEW LOG
ON atleta;
```

O exemplo da aula faz exatamente isso para a tabela `ATLETA`.

Mentalmente:

```text
ATLETA
  ↓ alterações
MVIEW LOG
  ↓
MVIEW
```

O log registra informações necessárias para atualizar somente aquilo que mudou.

---

# REFRESH FORCE

```sql
REFRESH FORCE
```

É uma tentativa inteligente:

```text
tenta FAST
   ↓
funcionou?
   ├── sim → FAST
   └── não → COMPLETE
```

Pra decorar:

```text
FAST     → só mudanças
COMPLETE → refaz tudo
FORCE    → tenta FAST, senão COMPLETE
```

---

# ON COMMIT

```sql
ON COMMIT
```

Atualiza a MView quando ocorre um `COMMIT` nas tabelas base.

Exemplo:

```sql
UPDATE atleta
SET salario = 20000
WHERE id = 10;

COMMIT;
```

O `COMMIT` dispara o refresh.

Vantagem:

```text
dados praticamente em tempo real
```

Desvantagem:

```text
cada COMMIT pode ter um custo extra
```

O material alerta que pode ser caro se as tabelas recebem muitos `INSERT`, `UPDATE` e `DELETE`.

---

# ON DEMAND

```sql
ON DEMAND
```

O refresh não ocorre automaticamente a cada commit.

Ele pode ser:

- manual;
- ou agendado.

Para atualizar manualmente:

```sql
EXECUTE DBMS_MVIEW.REFRESH('MV_CLUBE_INFO');
```

No exemplo da aula, após inserir um atleta, ele ainda não aparece na MView até esse comando ser executado.

Resumo:

```text
ON COMMIT → atualiza no COMMIT
ON DEMAND → atualiza quando solicitado/agendado
```

---

# Exemplo completo

O material apresenta algo desse tipo:

```sql
CREATE MATERIALIZED VIEW MV_CLUBE_INFO
(
    ID_CLUBE,
    NOME_CLUBE,
    QTDE_ATLETAS,
    MEDIA_SAL
)
BUILD IMMEDIATE
REFRESH COMPLETE
ON DEMAND
AS
SELECT
    C.ID,
    C.NOME,
    COUNT(*),
    ROUND(AVG(A.SALARIO), 2)
FROM CLUBE C
JOIN ATLETA A
    ON A.ID_CLUBE = C.ID
GROUP BY C.ID, C.NOME;
```

Interpretando:

```text
BUILD IMMEDIATE
→ popula imediatamente

REFRESH COMPLETE
→ quando atualizar, recalcula tudo

ON DEMAND
→ só atualiza quando solicitado
```

Depois:

```sql
SELECT *
FROM MV_CLUBE_INFO;
```

---

# Refresh periódico

Também podemos definir um intervalo automático.

Dois parâmetros:

```text
START WITH → quando começa
NEXT       → intervalo dos próximos refreshes
```

Como o Oracle considera soma de datas em **dias**:

```text
1 dia    = 1
1 hora   = 1/24
1 minuto = 1/1440
```

Por isso:

### A cada 4 horas

```sql
NEXT SYSDATE + 4/24
```

### A cada 10 minutos

```sql
NEXT SYSDATE + 10/1440
```

O material apresenta exatamente esses cálculos.

---

# Exemplo de refresh periódico

```sql
CREATE MATERIALIZED VIEW MV_ATLETA_QTDE_MOD
REFRESH COMPLETE
START WITH SYSDATE
NEXT SYSDATE + 6/24
AS
SELECT
    A.ID,
    A.NOME,
    A.SALARIO,
    NVL(COUNT(P.ID_MODALIDADE), 0)
FROM ATLETA A
LEFT JOIN PRATICA P
    ON P.ID_ATLETA = A.ID
GROUP BY A.ID, A.NOME, A.SALARIO;
```

Aqui:

```text
START WITH SYSDATE → começa agora

NEXT SYSDATE + 6/24
→ atualiza a cada 6 horas
```

---

# Remover MView

```sql
DROP MATERIALIZED VIEW nome;
```

Exemplo:

```sql
DROP MATERIALIZED VIEW MV_ATLETA_QTDE_MOD;
```

Para remover o log:

```sql
DROP MATERIALIZED VIEW LOG ON atleta;
```

---
# Resumo mental de MViews

```text
MATERIALIZED VIEW
        ↓
resultado de SELECT armazenado fisicamente
        ↓
precisa ser atualizado por REFRESH


BUILD
├── IMMEDIATE → popula agora
└── DEFERRED  → popula no primeiro refresh


REFRESH
├── FAST     → atualiza somente as mudanças
├── COMPLETE → recalcula tudo
└── FORCE    → tenta FAST; se não der, usa COMPLETE


QUANDO
├── ON COMMIT → atualiza automaticamente no COMMIT
├── ON DEMAND → atualiza quando solicitado manualmente
├── START WITH → define quando ocorre o primeiro refresh agendado
└── NEXT       → define quando ocorrerão os próximos refreshes


EXEMPLO DE AGENDAMENTO
START WITH SYSDATE + (5 / 1440)
NEXT SYSDATE + (5 / 1440)

→ primeiro refresh daqui a 5 minutos
→ depois atualiza novamente a cada 5 minutos


REFRESH MANUAL
BEGIN
    DBMS_MVIEW.REFRESH('NOME_MVIEW', 'C');
END;
/

C = COMPLETE
F = FAST
? = FORCE
```

---
