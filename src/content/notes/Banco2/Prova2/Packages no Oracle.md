---
title: "Packages no Oracle"
description: "Especificação, corpo, visibilidade e uso de packages em PL/SQL, com os exercícios de Produto e Atleta."
category: "Banco de Dados II"
tags: [oracle, plsql, packages, procedures, functions]
---

# Packages no Oracle

## 1. O que é uma package?

Uma **package** agrupa elementos PL/SQL relacionados, como procedures, functions, tipos, variáveis e cursores. Pense nela como um módulo: quem a utiliza conhece a interface pública, enquanto os detalhes de implementação ficam no corpo.

Ela ajuda a organizar e reutilizar código, esconder rotinas internas e alterar a implementação sem mudar a interface. O Oracle também pode manter a package carregada na sessão depois do primeiro uso.

## 2. Especificação e corpo

| Parte | Papel | Visibilidade |
| --- | --- | --- |
| `PACKAGE` (especificação ou cabeçalho) | Declara o que o módulo oferece | Pública |
| `PACKAGE BODY` (corpo) | Implementa as declarações e pode conter outras rotinas | Rotinas extras são privadas |

Uma rotina declarada na especificação precisa ter implementação compatível no corpo. O corpo pode chamar rotinas privadas que não aparecem na especificação.

```sql
CREATE OR REPLACE PACKAGE Exemplo_Pkg AS
    FUNCTION Dobro(p_valor NUMBER) RETURN NUMBER;
END Exemplo_Pkg;
/

CREATE OR REPLACE PACKAGE BODY Exemplo_Pkg AS
    FUNCTION Dobro(p_valor NUMBER) RETURN NUMBER IS
    BEGIN
        RETURN p_valor * 2;
    END Dobro;
END Exemplo_Pkg;
/

SELECT Exemplo_Pkg.Dobro(3) FROM dual;
```

O `/` em uma linha separada executa o bloco recém-definido ao rodar um *script* em clientes como SQL Developer. O `;` continua fazendo parte da sintaxe PL/SQL.

## 3. Como usar

- Procedure: `EXEC nome_pkg.nome_procedure(...);` ou chamada dentro de `BEGIN ... END;`.
- Function escalar: `SELECT nome_pkg.nome_function(...) FROM dual;` ou atribuição a uma variável PL/SQL.
- Function que retorna `SYS_REFCURSOR`: abra o resultado por meio da função, percorra-o com `FETCH` e feche-o com `CLOSE`.
- Para ver `DBMS_OUTPUT.PUT_LINE` no cliente, habilite `SET SERVEROUTPUT ON;` ou o painel DBMS Output.

Para recompilar, a aula usa `ALTER PACKAGE nome_pkg COMPILE;` para a especificação e `ALTER PACKAGE nome_pkg COMPILE BODY;` para o corpo. Ao mudar a interface pública, objetos dependentes podem precisar de recompilação.

## 4. Exercício 1 — `Produto_Pkg`

O enunciado da aula pede uma tabela de produtos, uma procedure de cadastro e uma function para contar os produtos. **A solução enviada** também recebe o `id` no cadastro, pois a tabela define `id` como chave primária sem geração automática, e acrescenta `Lista_Produtos`, que devolve um cursor com os registros.

O script abaixo mantém essas escolhas. A solução original começa com `DROP TABLE produto;`: execute esse comando separadamente **somente** se a tabela já existir e você quiser apagar seus dados antes de recriá-la.

```sql
DROP TABLE produto;
```

```sql
SET SERVEROUTPUT ON;

CREATE TABLE produto (
    id    NUMBER,
    nome  VARCHAR2(30),
    preco NUMBER(10,2),
    CONSTRAINT produto_pk PRIMARY KEY (id)
);

CREATE OR REPLACE PACKAGE Produto_Pkg AS
    PROCEDURE Cadastrar_Produto(
        p_id    produto.id%TYPE,
        p_nome  produto.nome%TYPE,
        p_preco produto.preco%TYPE
    );

    FUNCTION Qtde_Prod RETURN NUMBER;

    FUNCTION Lista_Produtos RETURN SYS_REFCURSOR;
END Produto_Pkg;
/

CREATE OR REPLACE PACKAGE BODY Produto_Pkg AS
    PROCEDURE Cadastrar_Produto(
        p_id    produto.id%TYPE,
        p_nome  produto.nome%TYPE,
        p_preco produto.preco%TYPE
    ) IS
    BEGIN
        INSERT INTO produto (id, nome, preco)
        VALUES (p_id, p_nome, p_preco);

        DBMS_OUTPUT.PUT_LINE('Produto cadastrado');
    EXCEPTION
        WHEN DUP_VAL_ON_INDEX THEN
            DBMS_OUTPUT.PUT_LINE('Produto já cadastrado');
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Erro: ' || SQLERRM);
    END Cadastrar_Produto;

    FUNCTION Qtde_Prod RETURN NUMBER IS
        v_qtdeprod NUMBER;
    BEGIN
        SELECT COUNT(*) INTO v_qtdeprod
        FROM produto;

        RETURN v_qtdeprod;
    END Qtde_Prod;

    FUNCTION Lista_Produtos RETURN SYS_REFCURSOR IS
        c_produtos SYS_REFCURSOR;
    BEGIN
        OPEN c_produtos FOR
            SELECT id, nome, preco FROM produto ORDER BY id;

        RETURN c_produtos;
    END Lista_Produtos;
END Produto_Pkg;
/

EXEC Produto_Pkg.Cadastrar_Produto(1, 'Sabonete Dove', 5.25);
EXEC Produto_Pkg.Cadastrar_Produto(2, 'Creme Dental Colgate', 9.42);
EXEC Produto_Pkg.Cadastrar_Produto(3, 'Papel Higiênico Neve', 21.75);
EXEC Produto_Pkg.Cadastrar_Produto(4, 'Sabonete Lux', 3.17);

SELECT Produto_Pkg.Qtde_Prod AS quantidade FROM dual;

DECLARE
    v_prod  SYS_REFCURSOR;
    v_id    produto.id%TYPE;
    v_nome  produto.nome%TYPE;
    v_preco produto.preco%TYPE;
BEGIN
    v_prod := Produto_Pkg.Lista_Produtos;

    LOOP
        FETCH v_prod INTO v_id, v_nome, v_preco;
        EXIT WHEN v_prod%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Id: ' || v_id || ', Nome: ' || v_nome || ', Preço: ' || v_preco
        );
    END LOOP;

    CLOSE v_prod;
END;
/

SELECT * FROM produto;
```

Depois das quatro inserções, `Qtde_Prod` retorna **4**, desde que a tabela estivesse vazia e todos os cadastros tenham funcionado. Repetir um `id` aciona `DUP_VAL_ON_INDEX`. O bloco `WHEN OTHERS` da solução exibe o erro e encerra a procedure sem repassá-lo ao chamador; isso é útil para observar o exercício, mas exige cuidado em código de aplicação.

## 5. Exercício 2 — `Atleta_Pkg`

Este exercício usa as tabelas `atleta` e `clube` já criadas nas aulas anteriores. `Calcular_Salario` busca o salário do atleta e soma o bônus. `Get_Clube` busca o nome do clube ou retorna `Sem contrato` quando `id_clube` é nulo.

```sql
CREATE OR REPLACE PACKAGE Atleta_Pkg AS
    FUNCTION Calcular_Salario(
        p_id_atleta atleta.id%TYPE,
        p_bonus NUMBER
    ) RETURN NUMBER;

    FUNCTION Get_Clube(
        p_id_atleta atleta.id%TYPE
    ) RETURN VARCHAR2;
END Atleta_Pkg;
/

CREATE OR REPLACE PACKAGE BODY Atleta_Pkg AS
    FUNCTION Calcular_Salario(
        p_id_atleta atleta.id%TYPE,
        p_bonus NUMBER
    ) RETURN NUMBER IS
        v_salario atleta.salario%TYPE;
    BEGIN
        SELECT salario INTO v_salario
        FROM atleta
        WHERE id = p_id_atleta;

        RETURN v_salario + p_bonus;
    END Calcular_Salario;

    FUNCTION Get_Clube(
        p_id_atleta atleta.id%TYPE
    ) RETURN VARCHAR2 IS
        v_id_clube   atleta.id_clube%TYPE;
        v_nome_clube clube.nome%TYPE;
    BEGIN
        SELECT id_clube INTO v_id_clube
        FROM atleta
        WHERE id = p_id_atleta;

        IF v_id_clube IS NULL THEN
            RETURN 'Sem contrato';
        ELSE
            SELECT nome INTO v_nome_clube
            FROM clube
            WHERE id = v_id_clube;

            RETURN v_nome_clube;
        END IF;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RETURN 'Atleta não cadastrado!';
    END Get_Clube;
END Atleta_Pkg;
/

SELECT Atleta_Pkg.Calcular_Salario(5, 1500) AS valor FROM dual;

SELECT Atleta_Pkg.Get_Clube(1) FROM dual;
SELECT Atleta_Pkg.Get_Clube(24) FROM dual;
SELECT Atleta_Pkg.Get_Clube(200) FROM dual;
```

Os resultados dessas consultas dependem dos dados existentes. Na solução enviada, `Calcular_Salario` não trata `NO_DATA_FOUND`: consultar um atleta inexistente gera erro. Em `Get_Clube`, o mesmo tratamento cobre tanto um atleta inexistente quanto um `id_clube` sem linha correspondente na tabela `clube`, retornando a mesma mensagem nos dois casos.

## Para lembrar

```text
Especificação = interface pública
Corpo = implementação + rotinas privadas
Procedure = executa uma ação
Function = devolve um valor
SYS_REFCURSOR = devolve linhas para percorrer com FETCH
```

### Referência

- Material da aula: *BD2_11_Packages_Oracle.pdf*.
