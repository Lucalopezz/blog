---
title: "PL/SQL, procedures e functions na prática"
description: "Introdução ao PL/SQL com variáveis, blocos, procedures e functions no Oracle."
category: "Banco de Dados II"
tags: [oracle, plsql, procedures, functions]
---

# Aula 1 — Introdução ao PL/SQL

## 1. O que é PL/SQL?

PL/SQL é a linguagem procedural do Oracle. Enquanto SQL puro é utilizado principalmente para consultar e modificar dados, PL/SQL adiciona recursos de uma linguagem de programação:

- variáveis;
- condicionais;
- loops;
- tratamento de erros;
- procedures;
- functions;
- triggers.

A ideia é poder escrever lógica como:

```sql
BUSCAR dados
↓
VERIFICAR uma condição
↓
ALTERAR dados
↓
TRATAR possíveis erros
```

---

## 2. Estrutura básica de um bloco PL/SQL

Um programa PL/SQL normalmente segue esta estrutura:

```sql
DECLARE
    -- variáveis

BEGIN
    -- código executável

EXCEPTION
    -- tratamento de erros

END;
```

`DECLARE` e `EXCEPTION` são opcionais. `BEGIN` e `END` delimitam o código executável.

Exemplo:

```sql
SET SERVEROUTPUT ON;

DECLARE
    altura NUMBER := 3;
    base NUMBER := 2;
    area NUMBER;
BEGIN
    area := (base * altura) / 2;

    DBMS_OUTPUT.PUT_LINE(
        'Area do triangulo = ' || area
    );
END;
```

### `SET SERVEROUTPUT ON`

```sql
SET SERVEROUTPUT ON;
```

Ativa a exibição das mensagens produzidas por:

```sql
DBMS_OUTPUT.PUT_LINE(...);
```

Sem isso, dependendo da ferramenta utilizada, o programa pode executar mas as mensagens não aparecerem.

---

# 3. Variáveis

São declaradas dentro de `DECLARE`.

```sql
DECLARE
    v_id NUMBER;
    v_nome VARCHAR2(100);
    v_salario NUMBER(10,2);
    v_data DATE;
BEGIN
    ...
END;
```

Para atribuir valores, PL/SQL usa:

```sql
:=
```

Exemplo:

```sql
v_salario := 5000;
```

Não confundir:

```text
:=   atribuição
=    comparação
```

---

## `%TYPE`

Em vez de repetir manualmente o tipo de uma coluna:

```sql
v_nome VARCHAR2(100);
```

podemos utilizar:

```sql
v_nome atleta.nome%TYPE;
```

Isso significa:

> `v_nome` terá o mesmo tipo da coluna `nome` da tabela `atleta`.

Exemplo:

```sql
DECLARE
    v_nome atleta.nome%TYPE;
    v_salario atleta.salario%TYPE;
BEGIN
    ...
END;
```

É útil porque, se o tipo da coluna mudar, a variável acompanha essa definição automaticamente.

---

# 4. Exibindo informações

O principal comando utilizado nas aulas é:

```sql
DBMS_OUTPUT.PUT_LINE();
```

Exemplo:

```sql
DBMS_OUTPUT.PUT_LINE('Hello World');
```

Para concatenar valores utiliza-se:

```sql
||
```

Exemplo:

```sql
DBMS_OUTPUT.PUT_LINE(
    'Nome: ' || v_nome || ', salário: ' || v_salario
);
```

É semelhante a:

```text
"Nome: " + nome
```

em outras linguagens.

---

# 5. IF / ELSIF / ELSE

Estrutura:

```sql
IF condicao THEN

    ...

ELSIF outra_condicao THEN

    ...

ELSE

    ...

END IF;
```

Exemplo:

```sql
IF v_saldo > 0 THEN

    DBMS_OUTPUT.PUT_LINE('Saldo positivo');

ELSIF v_saldo = 0 THEN

    DBMS_OUTPUT.PUT_LINE('Saldo zero');

ELSE

    DBMS_OUTPUT.PUT_LINE('Saldo negativo');

END IF;
```

O fluxo é o mesmo de linguagens como Java, PHP ou Go:

```text
testa condição
      ↓
verdadeira?
 ├─ sim → executa bloco
 └─ não → testa próxima condição
```

---

# 6. CASE

Quando queremos comparar um mesmo valor com várias possibilidades:

```sql
CASE estado_civil

    WHEN 'C' THEN
        v_estado := 'Casado';

    WHEN 'S' THEN
        v_estado := 'Solteiro';

    WHEN 'D' THEN
        v_estado := 'Divorciado';

    ELSE
        v_estado := 'Não informado';

END CASE;
```

É parecido com `switch` em outras linguagens.

---

# 7. Loops

PL/SQL possui três formas principais vistas na aula.

## LOOP simples

```sql
DECLARE
    v_contador NUMBER := 0;
BEGIN

    LOOP

        v_contador := v_contador + 1;

        DBMS_OUTPUT.PUT_LINE(v_contador);

        EXIT WHEN v_contador = 5;

    END LOOP;

END;
```

A parte importante é:

```sql
EXIT WHEN condicao;
```

Ela determina quando sair do loop.

Sem uma condição de saída adequada, você pode criar um loop infinito.

---

## WHILE

```sql
WHILE v_contador < 5 LOOP

    v_contador := v_contador + 1;

    DBMS_OUTPUT.PUT_LINE(v_contador);

END LOOP;
```

A condição é verificada antes de cada execução.

---

## FOR

Normalmente é o mais simples quando já sabemos quantas vezes queremos repetir algo:

```sql
FOR i IN 1..10 LOOP

    DBMS_OUTPUT.PUT_LINE(i);

END LOOP;
```

Não é necessário declarar `i`.

Exemplo da tabuada:

```sql
DECLARE
    numero NUMBER := 5;
BEGIN

    FOR i IN 1..10 LOOP

        DBMS_OUTPUT.PUT_LINE(
            numero || ' x ' || i || ' = ' || numero * i
        );

    END LOOP;

END;
```

Também existe:

```sql
FOR i IN REVERSE 1..5 LOOP

    DBMS_OUTPUT.PUT_LINE(i);

END LOOP;
```

que percorre:

```text
5
4
3
2
1
```

---

## `CONTINUE`

Pula a iteração atual:

```sql
IF v_contador = 3 THEN
    CONTINUE;
END IF;
```

Ou diretamente:

```sql
CONTINUE WHEN v_contador = 3;
```

---

# 8. SELECT INTO

Dentro de PL/SQL não fazemos apenas:

```sql
SELECT nome
FROM atleta
WHERE id = 1;
```

Quando queremos guardar o resultado em uma variável usamos:

```sql
SELECT coluna
INTO variavel
FROM tabela
WHERE ...;
```

Exemplo:

```sql
DECLARE
    v_nome clube.nome%TYPE;
    v_data_fund clube.data_fundacao%TYPE;

BEGIN

    SELECT nome, data_fundacao
    INTO v_nome, v_data_fund
    FROM clube
    WHERE id = 1;

END;
```

A relação é:

```text
SELECT nome, data_fundacao
       ↓         ↓
INTO v_nome, v_data_fund
```

O número de colunas precisa corresponder ao número de variáveis.

Essa forma de `SELECT INTO` deve recuperar **exatamente uma linha**. Para trabalhar com várias linhas, a aula introduz os **cursores**.

---

# 9. Recebendo valores do usuário

## `&`

Pode ser utilizado para solicitar um valor:

```sql
SELECT nome
INTO v_nome
FROM clube
WHERE id = &v_id;
```

Ao executar, a ferramenta solicitará um valor para `v_id`.

Uma forma mais organizada é:

```sql
DECLARE
    v_id clube.id%TYPE;

BEGIN

    v_id := &v_id;

    ...

END;
```

Assim o valor digitado fica armazenado em `v_id`.

---

## Strings

Para texto:

```sql
v_nome := '&v_nome';
```

As aspas são importantes porque o valor precisa virar uma string dentro do código SQL.

---

## `&&`

`&&` permite reutilizar um valor de substituição:

```sql
&&v_id
```

Sem isso, diferentes ocorrências de:

```sql
&v_id
```

podem solicitar o valor novamente.

---

## `UNDEFINE`

Para limpar um valor armazenado:

```sql
UNDEFINE v_id;
```

Assim o Oracle solicita o valor novamente na próxima execução.

---

# 10. Cursores

Aqui aparece uma diferença importante.

`SELECT INTO` é utilizado para **uma linha**.

Quando queremos percorrer várias linhas:

```sql
SELECT id, nome, salario
FROM atleta;
```

podemos utilizar um **cursor**.

---

## Fluxo de um cursor

```text
DECLARE CURSOR
      ↓
OPEN
      ↓
FETCH
      ↓
processar linha
      ↓
FETCH
      ↓
...
      ↓
CLOSE
```

A aula mostra explicitamente essas etapas.

---

## Exemplo completo

```sql
DECLARE

    v_id atleta.id%TYPE;
    v_nome atleta.nome%TYPE;
    v_salario atleta.salario%TYPE;

    CURSOR c_atleta IS
        SELECT id, nome, salario
        FROM atleta
        ORDER BY id;

BEGIN

    OPEN c_atleta;

    LOOP

        FETCH c_atleta
        INTO v_id, v_nome, v_salario;

        EXIT WHEN c_atleta%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Id: ' || v_id ||
            ', Nome: ' || v_nome ||
            ', Salário: ' || v_salario
        );

    END LOOP;

    CLOSE c_atleta;

END;
```

### `OPEN`

```sql
OPEN c_atleta;
```

Abre o cursor para começar a percorrer o resultado.

### `FETCH`

```sql
FETCH c_atleta
INTO v_id, v_nome, v_salario;
```

Pega a próxima linha do resultado e coloca seus valores nas variáveis.

### `%NOTFOUND`

```sql
EXIT WHEN c_atleta%NOTFOUND;
```

Quando não houver mais linhas, encerra o loop.

### `CLOSE`

```sql
CLOSE c_atleta;
```

Fecha o cursor.

---

# 11. `%ROWTYPE`

Se você precisa guardar uma linha inteira:

```sql
v_atleta atleta%ROWTYPE;
```

Agora `v_atleta` possui todos os campos de um registro da tabela.

Exemplo:

```sql
v_atleta.id
v_atleta.nome
v_atleta.salario
```

Com cursor:

```sql
DECLARE

    v_atleta atleta%ROWTYPE;

    CURSOR c_atleta IS
        SELECT *
        FROM atleta;

BEGIN

    OPEN c_atleta;

    LOOP

        FETCH c_atleta INTO v_atleta;

        EXIT WHEN c_atleta%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(v_atleta.nome);

    END LOOP;

    CLOSE c_atleta;

END;
```

---

# 12. Cursor com FOR — forma mais simples

A aula apresenta uma forma bem mais prática:

```sql
DECLARE

    CURSOR c_atleta IS
        SELECT *
        FROM atleta
        ORDER BY id;

BEGIN

    FOR v_atleta IN c_atleta LOOP

        DBMS_OUTPUT.PUT_LINE(
            v_atleta.id || ' - ' ||
            v_atleta.nome
        );

    END LOOP;

END;
```

Nesse caso não precisamos escrever:

```sql
OPEN
FETCH
EXIT WHEN
CLOSE
```

O `FOR` controla o cursor automaticamente.

Na prática, é uma das formas mais simples para percorrer resultados.

---

# 13. Tratamento de exceções

Estrutura:

```sql
BEGIN

    ...

EXCEPTION

    WHEN alguma_excecao THEN
        ...

    WHEN OTHERS THEN
        ...

END;
```

Quando ocorre uma exceção, a execução pula para `EXCEPTION`. Depois de tratar o erro, o bloco é encerrado; ele não retorna ao ponto onde aconteceu a exceção.

---

## Exceções importantes

```sql
NO_DATA_FOUND
```

`SELECT INTO` não encontrou uma linha.

```sql
TOO_MANY_ROWS
```

`SELECT INTO` encontrou mais de uma linha.

```sql
DUP_VAL_ON_INDEX
```

Tentativa de inserir valor duplicado em uma restrição como `PRIMARY KEY` ou `UNIQUE`.

```sql
ZERO_DIVIDE
```

Divisão por zero.

```sql
INVALID_NUMBER
```

Erro ao converter algo para número.

```sql
VALUE_ERROR
```

Erro envolvendo valor, conversão, tamanho etc.

```sql
OTHERS
```

Captura os demais erros não tratados anteriormente.

---

## Exemplo

```sql
DECLARE
    v_id atleta.id%TYPE;

BEGIN

    SELECT id
    INTO v_id
    FROM atleta
    WHERE id = 111;

    UPDATE atleta
    SET nome = 'Maria'
    WHERE id = 111;

    COMMIT;

EXCEPTION

    WHEN NO_DATA_FOUND THEN

        DBMS_OUTPUT.PUT_LINE(
            'Atleta não encontrado'
        );

    WHEN OTHERS THEN

        DBMS_OUTPUT.PUT_LINE(
            'Erro: ' || SQLERRM
        );

END;
```

### `SQLERRM`

```sql
SQLERRM
```

retorna a mensagem do erro ocorrido.

A aula combina tratamento de exceção com operações como `INSERT`, `UPDATE` e `COMMIT`.

---

# 14. Um detalhe importante sobre cursores

A própria aula destaca:

> **Cursor vazio não gera `NO_DATA_FOUND`.**

Ou seja, isso:

```sql
SELECT ...
INTO ...
```

pode gerar:

```sql
NO_DATA_FOUND
```

Mas percorrer um cursor sem registros simplesmente não gera nenhuma iteração.

---

# 15. Blocos aninhados

É possível colocar um bloco PL/SQL dentro de outro:

```sql
BEGIN

    BEGIN

        ...

    EXCEPTION

        WHEN ZERO_DIVIDE THEN
            ...

    END;

    DBMS_OUTPUT.PUT_LINE(
        'Bloco externo continua'
    );

END;
```

Uma exceção tratada no bloco interno encerra aquele bloco, permitindo que o bloco externo continue.

---

# 16. `RAISE_APPLICATION_ERROR`

Permite criar um erro próprio da aplicação:

```sql
RAISE_APPLICATION_ERROR(
    -20101,
    'Era esperado o clube ter ao menos 5 atletas'
);
```

Os códigos definidos dessa forma ficam entre:

```text
-20000
e
-20999
```

Exemplo:

```sql
IF qtde_atletas < 5 THEN

    RAISE_APPLICATION_ERROR(
        -20101,
        'O clube deve ter ao menos 5 atletas'
    );

END IF;
```

Isso é útil para transformar uma **regra de negócio** em um erro compreensível pela aplicação que está utilizando o banco.

---

# Aula 2 — Procedures e Functions

Agora os conceitos anteriores começam a ser reutilizados.

Até aqui fazíamos:

```sql
DECLARE
    ...
BEGIN
    ...
EXCEPTION
    ...
END;
```

executávamos o bloco e ele acabava.

Com procedures e functions, podemos **armazenar esse código no banco e chamá-lo posteriormente**. Elas contêm instruções PL/SQL e podem receber parâmetros.

---

# 17. Procedure

Uma procedure representa uma rotina armazenada no banco.

Estrutura:

```sql
CREATE OR REPLACE PROCEDURE nome_procedure (
    parametros
)
IS

    -- variáveis locais

BEGIN

    -- código PL/SQL

EXCEPTION

    -- tratamento de erros

END nome_procedure;
```

A procedure **não possui um valor de retorno como uma function**. Ela pode, porém, devolver valores através de parâmetros `OUT`.

---

## `CREATE OR REPLACE`

```sql
CREATE OR REPLACE PROCEDURE ...
```

Se não existir:

```text
cria
```

Se já existir:

```text
substitui pela nova definição
```

Isso evita ter que apagar a procedure toda vez que quiser modificá-la.

---

# 18. Parâmetros de procedures

Existem três modos:

```text
IN
OUT
IN OUT
```

---

## `IN`

Valor entra na procedure.

```sql
p_id IN atleta.id%TYPE
```

Exemplo:

```sql
CREATE OR REPLACE PROCEDURE mostrar_atleta (
    p_id IN atleta.id%TYPE
)
IS

BEGIN

    DBMS_OUTPUT.PUT_LINE(
        'ID recebido: ' || p_id
    );

END;
```

Fluxo:

```text
aplicação
   ↓
 p_id
   ↓
procedure
```

---

## `OUT`

A procedure coloca um resultado no parâmetro.

```sql
p_media OUT NUMBER
```

Exemplo da aula:

```sql
CREATE OR REPLACE PROCEDURE PR_SAL_CLUBE (
    p_clube IN atleta.id_clube%TYPE,
    p_media_sal OUT NUMBER
)
IS

BEGIN

    SELECT AVG(salario)
    INTO p_media_sal
    FROM atleta
    WHERE id_clube = p_clube;

END;
```

Para chamar:

```sql
DECLARE

    v_clube NUMBER := 10;
    v_media NUMBER;

BEGIN

    PR_SAL_CLUBE(
        v_clube,
        v_media
    );

    DBMS_OUTPUT.PUT_LINE(v_media);

END;
```

A lógica é:

```text
v_clube
   ↓ IN
procedure
   ↓ OUT
v_media
```

---

# 19. `IN OUT`

O valor entra, é alterado e volta.

```text
valor original
     ↓
 procedure
     ↓
valor modificado
```

Exemplo da aula:

```sql
CREATE OR REPLACE PROCEDURE PR_TROCA_VAL (
    p_valor1 IN OUT NUMBER,
    p_valor2 IN OUT NUMBER
)
IS

    v_aux NUMBER;

BEGIN

    v_aux := p_valor1;

    p_valor1 := p_valor2;

    p_valor2 := v_aux;

END;
```

Se:

```text
valor1 = 5
valor2 = 10
```

após executar:

```text
valor1 = 10
valor2 = 5
```

---

# 20. Executando uma procedure

Externamente:

```sql
EXEC nome_procedure(...);
```

ou:

```sql
CALL nome_procedure(...);
```

Exemplo:

```sql
EXEC PR_ALTERA_ATLETA_END_CLUBE(
    20,
    'Rua do IFSP, 325',
    14
);
```

Dentro de um bloco PL/SQL não precisamos de `EXEC` nem `CALL`:

```sql
BEGIN

    PR_ALTERA_ATLETA_END_CLUBE(
        20,
        'Rua do IFSP, 325',
        14
    );

END;
```

---

# 21. Formas de passar parâmetros

## Posicional

Segue a ordem definida na procedure:

```sql
EXEC minha_procedure(
    20,
    'Rua A',
    14
);
```

Se a definição é:

```sql
p_id
p_end
p_clube
```

então:

```text
20       → p_id
'Rua A'  → p_end
14       → p_clube
```

---

## Nomeada

Usa:

```sql
=>
```

Exemplo:

```sql
EXEC PR_ALTERA_ATLETA_END_CLUBE(
    p_end   => 'Rua A',
    p_clube => 13,
    p_id    => 20
);
```

Aqui a ordem deixa de ser importante porque cada valor indica explicitamente seu parâmetro.

---

## Mista

Mistura as duas formas:

```sql
EXEC PR_ALTERA_ATLETA_END_CLUBE(
    20,
    p_clube => 12,
    p_end   => 'Rua A'
);
```

---

# 22. Parâmetros opcionais

Podemos definir valor padrão:

```sql
p_sal IN atleta.salario%TYPE DEFAULT 1000
```

Se enviarmos:

```sql
p_sal => 5000
```

fica:

```text
5000
```

Se omitirmos:

```text
1000
```

A aula usa notação nomeada ou mista para omitir parâmetros opcionais.

Exemplo:

```sql
EXEC pr_altera_dados(
    18,
    'Teste',
    p_cpf => '444',
    p_dtnasc => TO_DATE(
        '10/02/1995',
        'dd/mm/yyyy'
    )
);
```

O parâmetro de salário não foi informado, portanto utiliza seu `DEFAULT`.

---

# 23. Exemplo completo de procedure

```sql
CREATE OR REPLACE PROCEDURE PR_ALTERA_ATLETA (
    p_id IN atleta.id%TYPE,
    p_end IN atleta.endereco%TYPE
)
IS

    v_aux NUMBER;

BEGIN

    SELECT COUNT(*)
    INTO v_aux
    FROM atleta
    WHERE id = p_id;

    IF v_aux > 0 THEN

        UPDATE atleta
        SET endereco = p_end
        WHERE id = p_id;

        COMMIT;

        DBMS_OUTPUT.PUT_LINE(
            'Atleta atualizado'
        );

    ELSE

        DBMS_OUTPUT.PUT_LINE(
            'Atleta não encontrado'
        );

    END IF;

EXCEPTION

    WHEN OTHERS THEN

        DBMS_OUTPUT.PUT_LINE(
            'Erro: ' || SQLERRM
        );

        ROLLBACK;

END PR_ALTERA_ATLETA;
```

Aqui praticamente tudo da primeira aula aparece:

```text
%TYPE
   ↓
SELECT INTO
   ↓
IF
   ↓
UPDATE
   ↓
COMMIT
   ↓
EXCEPTION
   ↓
SQLERRM / ROLLBACK
```

Esse é o principal motivo para estudar **PL/SQL antes de procedures**.

---

# 24. Encontrando erros de compilação

Depois de criar uma procedure, se houver erro:

```sql
SHOW ERRORS;
```

Isso mostra os erros de compilação encontrados pelo Oracle.

Fluxo prático:

```sql
CREATE OR REPLACE PROCEDURE ...
```

Se houver erro:

```sql
SHOW ERRORS;
```

Corrige o código e executa novamente:

```sql
CREATE OR REPLACE PROCEDURE ...
```

---

# 25. Excluindo uma procedure

```sql
DROP PROCEDURE nome_procedure;
```

Exemplo:

```sql
DROP PROCEDURE PR_ALTERA_ATLETA_END_CLUBE;
```

---

# 26. Functions

Uma function é semelhante a uma procedure, mas **deve retornar um valor**.

Estrutura:

```sql
CREATE OR REPLACE FUNCTION nome_funcao (
    parametros
)
RETURN tipo
IS

    -- variáveis

BEGIN

    ...

    RETURN valor;

END nome_funcao;
```

As duas partes mais importantes são:

```sql
RETURN NUMBER
```

define o tipo retornado.

E:

```sql
RETURN v_resultado;
```

retorna efetivamente o valor.

---

# 27. Exemplo de function

```sql
CREATE FUNCTION area_circulo (
    p_raio IN NUMBER
)
RETURN NUMBER
AS

    v_pi NUMBER := 3.1415926;
    v_area NUMBER;

BEGIN

    v_area := v_pi * (
        p_raio * p_raio
    );

    RETURN v_area;

END area_circulo;
```

Se entrar:

```text
raio = 2
```

a function:

```text
recebe 2
   ↓
calcula área
   ↓
RETURN resultado
```

---

# 28. Executando functions

Uma function pode ser utilizada em `SELECT`:

```sql
SELECT area_circulo(2)
FROM dual;
```

Também com parâmetro nomeado:

```sql
SELECT area_circulo(
    p_raio => 4
)
FROM dual;
```

`DUAL` aparece aqui como forma de executar uma expressão/function sem precisar consultar uma tabela da aplicação.

---

# 29. Function utilizando dados do banco

Exemplo da aula:

```sql
CREATE FUNCTION FU_GET_MEDIA_SAL (
    p_clube atleta.id_clube%TYPE
)
RETURN NUMBER
IS

    v_media NUMBER;

BEGIN

    SELECT AVG(salario)
    INTO v_media
    FROM atleta
    WHERE id_clube = p_clube;

    RETURN v_media;

END FU_GET_MEDIA_SAL;
```

Chamando:

```sql
SELECT FU_GET_MEDIA_SAL(8)
FROM dual;
```

Ou utilizando a function para cada clube:

```sql
SELECT
    id,
    nome,
    ROUND(
        FU_GET_MEDIA_SAL(id),
        2
    ) AS media_sal_atletas
FROM clube;
```

Essa segunda forma é especialmente importante:

```text
cada linha de clube
       ↓
FU_GET_MEDIA_SAL(id)
       ↓
function consulta atletas
       ↓
retorna média
       ↓
resultado aparece no SELECT
```

---

# 30. Excluindo uma function

```sql
DROP FUNCTION nome_funcao;
```

Exemplo:

```sql
DROP FUNCTION area_circulo;
```

---

# Procedure vs Function

||Procedure|Function|
|---|---|---|
|Criada com|`CREATE PROCEDURE`|`CREATE FUNCTION`|
|Retorno obrigatório|Não|Sim|
|`RETURN tipo`|Não|Sim|
|`RETURN valor`|Não|Sim|
|Pode usar `IN`|Sim|Sim|
|Pode usar `OUT` / `IN OUT`|Sim|Sim, segundo a sintaxe apresentada na aula|
|Chamada direta|`EXEC procedure(...)`|normalmente usada como função|
|Pode aparecer em `SELECT`|Não como uma function|Sim|

A diferença central apresentada no material é: **function deve retornar um valor; procedure não possui retorno obrigatório e pode fornecer saídas através de parâmetros**.

---

# Fluxo mental das duas aulas

```text
SQL
│
│ SELECT / INSERT / UPDATE
│
▼
PL/SQL
│
├── DECLARE
│
├── variáveis
│
├── %TYPE / %ROWTYPE
│
├── BEGIN / END
│
├── SELECT INTO
│
├── IF / CASE
│
├── LOOP / WHILE / FOR
│
├── CURSOR
│
└── EXCEPTION
     │
     ▼
código que já possui lógica
     │
     ▼
PROCEDURE / FUNCTION
     │
     ├── parâmetros
     │     ├── IN
     │     ├── OUT
     │     └── IN OUT
     │
     ├── CREATE OR REPLACE
     │
     ├── lógica PL/SQL
     │
     └── tratamento de erros
```

# Cola rápida de comandos

```sql
-- Mostrar saída
SET SERVEROUTPUT ON;


-- Bloco PL/SQL
DECLARE
    ...
BEGIN
    ...
EXCEPTION
    ...
END;


-- Atribuição
v_valor := 10;


-- Mesmo tipo de uma coluna
v_nome atleta.nome%TYPE;


-- Registro inteiro
v_atleta atleta%ROWTYPE;


-- Print
DBMS_OUTPUT.PUT_LINE('Texto');


-- Concatenação
'Nome: ' || v_nome;


-- SELECT para variável
SELECT nome
INTO v_nome
FROM atleta
WHERE id = 1;


-- IF
IF condicao THEN
    ...
ELSIF outra_condicao THEN
    ...
ELSE
    ...
END IF;


-- FOR
FOR i IN 1..10 LOOP
    ...
END LOOP;


-- LOOP
LOOP
    ...
    EXIT WHEN condicao;
END LOOP;


-- WHILE
WHILE condicao LOOP
    ...
END LOOP;


-- Cursor
CURSOR c_atleta IS
    SELECT * FROM atleta;


-- Abrir cursor
OPEN c_atleta;


-- Próxima linha
FETCH c_atleta INTO v_atleta;


-- Detectar fim
EXIT WHEN c_atleta%NOTFOUND;


-- Fechar
CLOSE c_atleta;


-- Forma simplificada de cursor
FOR v_atleta IN c_atleta LOOP
    ...
END LOOP;


-- Tratamento
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ...

    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(SQLERRM);


-- Erro personalizado
RAISE_APPLICATION_ERROR(
    -20001,
    'Mensagem'
);


-- Procedure
CREATE OR REPLACE PROCEDURE minha_procedure (
    p_id IN NUMBER
)
IS
BEGIN
    ...
END minha_procedure;


-- Executar procedure
EXEC minha_procedure(1);


-- Parâmetro nomeado
EXEC minha_procedure(
    p_id => 1
);


-- Mostrar erro de compilação
SHOW ERRORS;


-- Apagar procedure
DROP PROCEDURE minha_procedure;


-- Function
CREATE OR REPLACE FUNCTION minha_funcao (
    p_id IN NUMBER
)
RETURN NUMBER
IS
    v_resultado NUMBER;
BEGIN
    ...
    RETURN v_resultado;
END minha_funcao;


-- Executar function
SELECT minha_funcao(1)
FROM dual;


-- Apagar function
DROP FUNCTION minha_funcao;
```

## O que eu priorizaria para a prova/prática

O núcleo das duas aulas é conseguir enxergar esta evolução:

```sql
-- 1. Buscar um valor
SELECT salario
INTO v_salario
FROM atleta
WHERE id = 1;

-- 2. Tomar uma decisão
IF v_salario > 5000 THEN
    ...
END IF;

-- 3. Trabalhar com várias linhas
FOR v_atleta IN c_atleta LOOP
    ...
END LOOP;

-- 4. Tratar erro
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        ...

-- 5. Encapsular tudo para reutilização
CREATE OR REPLACE PROCEDURE ...
```

Depois disso, **procedure e function deixam de parecer um assunto novo**: elas são principalmente uma maneira de dar nome, parâmetros e reutilização à lógica PL/SQL aprendida na primeira aula.