```slq
  

-- Insert

INSERT INTO PRESIDENTE (id, nome, cpf, email, telefone)

VALUES (31,'teste','123','teste', 123233);

  

SELECT * FROM PRESIDENTE p WHERE id = 31;

  

-- update

UPDATE PRESIDENTE SET nome = 'Rodolfo' WHERE id = 31;

  

  

-- delete

DELETE FROM PRESIDENTE WHERE id = 31;

  

-- caso for foreign keys nao e possivel simplesmente apagar a linha

-- tem que na constraint por on delete cascade/set null/set default/no action

  

  

CREATE TABLE teste_temp(

cod NUMBER(4),

name varchar2(30),

atleta_fk number(4),

CONSTRAINT teste_pk PRIMARY KEY (cod),

CONSTRAINT teste_fk foreign KEY (atleta_fk) REFERENCES atleta(id)

);

  

-- fluxo de alteracao de constraint

ALTER TABLE teste_temp DROP CONSTRAINT teste_fk;

  

ALTER TABLE teste_temp ADD CONSTRAINT teste_fk FOREIGN KEY (atleta_fk) REFERENCES atleta(id) ON DELETE CASCADE;

  

  

  

-- data do sistema

SELECT sysdate FROM dual;

  

  

--1. Crie uma sequence que será usada como PK da tabela TESTE. A

--sequence deve começar com o valor 100 e ter um valor máximo

--999. O incremento a cada valor deve ser 23. Não utilize valor de

--cache. Chame a sequence TESTE_NRO_SEQ.

  

CREATE SEQUENCE seq_teste_pk

START WITH 1

INCREMENT BY 23

MAXVALUE 999

CYCLE

nocache;

  

DROP SEQUENCE seq_teste_pk;

  

  

--2. Insira 3 registros na tabela TESTE, utilizando a sequence criada

--nos comandos INSERTS.

  

INSERT INTO teste_temp (cod, name) VALUES (seq_teste_pk.NEXTVAL, 'teste2');

  

INSERT INTO teste_temp (cod, name) VALUES (seq_teste_pk.NEXTVAL, 'teste3');

  

SELECT seq_teste_pk.currval FROM dual;

  

SELECT * FROM teste_temp;

  

--3. Altere o valor de incremento da sequence para 12.

ALTER SEQUENCE seq_teste_pk INCREMENT BY 12;

  

--4. Insira mais 2 registros na tabela TESTE, utilizando a sequence

--criada nos comandos INSERTS.

INSERT INTO teste_temp (cod, name) VALUES (seq_teste_pk.NEXTVAL, 'teste4');

INSERT INTO teste_temp (cod, name) VALUES (seq_teste_pk.NEXTVAL, 'teste5');

  

  

--5. Como você faria para reiniciar a sequence a partir do valor 1?

  

DROP SEQUENCE seq_teste_pk;

  

CREATE SEQUENCE seq_teste_pk

START WITH 1

INCREMENT BY 12

MAXVALUE 999

CYCLE

nocache;

  

  

--Liste o nome (em maiúsculo), a data de nascimento, o bônus por idade

--(calculado), o endereço e o tipo de logradouro (calculado) dos atletas. O

--bônus por idade funciona assim: se o empregado nasceu anteriormente a

--1990, receberá 5000, se nasceu anteriormente a 2000 receberá 3000, senão

--não receberá nada. O tipo de logradouro é calculado com base nas últimas 6

--letras do logradouro: se for “Avenue”, deve mostrar “Avenida”, se for “Street”

--deve mostrar “Rua”, senão deve mostrar “Outro”. Use case e decode.

SELECT * FROM ATLETA a ;

  

SELECT UPPER(nome),

datanasc,

CASE

WHEN datanasc < to_date('01/01/1990', 'dd/mm/yyyy') THEN 5000

WHEN datanasc < to_date('01/01/2000', 'dd/mm/yyyy') THEN 3000

ELSE 0

END AS bonus,

endereco,

CASE

WHEN SUBSTR(endereco, -6) = 'Avenue' THEN 'Avenida'

WHEN SUBSTR(endereco, -6) = 'Street' THEN 'Rua'

ELSE 'Outro'

END AS tipo_end

FROM ATLETA;

  

  

  

SELECT UPPER(nome),

datanasc,

CASE

WHEN datanasc < to_date('01/01/1990', 'dd/mm/yyyy') THEN 5000

WHEN datanasc < to_date('01/01/2000', 'dd/mm/yyyy') THEN 3000

ELSE 0

END AS bonus,

endereco,

DECODE(SUBSTR(ENDERECO,-6), 'Avenue', 'Avenida', 'Street','Rua', 'Outro') AS tipo_end

FROM ATLETA;

  

  

--Liste o nome, o endereço (substituindo “Avenue” por “Av.” e “Street” por “St.”

--na exibição), o id do clube (sendo que é preciso exibir “Não possui” quando

--não possuir clube) e o salário formatado para exibir com uma casa obrigatória

--antes da vírgula e duas casas decimais obrigatórias)

  

SELECT nome,

REPLACE(REPLACE (endereco, 'Avenue', 'Av.' ), 'Street', 'St.'),

NVL(to_char(id_clube), 'Nao tem'),

to_char(salario, '$999,990.00')

FROM atleta;

  

  

--1. Liste o valor total de premiação distribuída no campeonato de id 19;

  

SELECT id_campeonato,

SUM(VALOR_PREMIACAO) AS val_total

FROM PARTICIPA

WHERE ID_CAMPEONATO = 19

GROUP BY id_campeonato;

  

  

  

--2. Liste a média de valor de premiação por campeonato para os

--campeonatos 2, 8, e 14. Arredonde para exibir com 1 casa decimal;

SELECT id_campeonato,

ROUND(AVG(VALOR_PREMIACAO), 1)

FROM participa

WHERE id_campeonato IN (2,8,14)

GROUP BY id_campeonato;

  

  

--3. Encontre a quantidade de atletas que pratica cada modalidade

--esportiva;

SELECT p.ID_MODALIDADE,

m.DESCRICAO,

COUNT(p.ID_ATLETA) AS qtd_atleta

FROM pratica p, modalidade m

WHERE p.id_modalidade = m.id

GROUP BY p.ID_MODALIDADE, m.DESCRICAO;

  

--4. Para cada modalidade esportiva praticada, liste o maior e o menor

--tempo de expriência. Ordene os resultados por id de modalidade.

SELECT MAX(experiencia),

MIN(experiencia)

FROM PRATICA

GROUP BY ID_MODALIDADE;

  

SELECT

id_modalidade,

MAX(SYSDATE - data_inicio) AS maior_experiencia,

MIN(SYSDATE - data_inicio) AS menor_experiencia

FROM pratica

GROUP BY id_modalidade

ORDER BY id_modalidade;

  

--5. Liste o id do campeonato e a quantidade de atletas que participaram

--deles, exibindo somente os campeonatos com mais de 3 participantes.

--Ordene os resultados por quantidade de participantes

--decrescentemente;

  

SELECT ID_CAMPEONATO,

COUNT (registro_atleta)

FROM PARTICIPA

GROUP BY ID_CAMPEONATO

HAVING COUNT(registro_atleta) > 3

ORDER BY COUNT(registro_atleta) desc;

  

--6. Liste a média de colocação dos atletas participantes de campeonatos,

--exibindo o número de registro do atleta e sua colocação média

--truncada sem casas decimais. Descarte as tuplas em que não houve

--valor de premiação. Deixe na listagem apenas os atletas com colocação

--média até o décimo lugar. Ordene os resultados por colocação média.

  

  

SELECT ID_CAMPEONATO,

REGISTRO_ATLETA,

TRUNC(AVG(COLOCACAO))

FROM PARTICIPA

WHERE VALOR_PREMIACAO IS NOT NULL

GROUP BY ID_CAMPEONATO, REGISTRO_ATLETA, VALOR_PREMIACAO

HAVING AVG(COLOCACAO) <= 10

ORDER BY TRUNC(AVG(COLOCACAO));

  

  

  

  

  

  

--1) Liste o id, nome e salário dos atletas, o id e nome do clube a que

--pertencem e o id e nome do presidente de seu clube.

SELECT a.id AS id_atleta,

a.NOME,

a.SALARIO,

c.ID AS id_clube,

c.NOME,

p.ID AS id_presidente,

p.nome

FROM ATLETA a, CLUBE c, presidente p

WHERE a.ID_CLUBE = c.id AND p.id = c.ID_PRESIDENTE ;

  

  

--2) Liste o nome, CPF, salário, endereço, deficiência e o nível de

--deficiência dos atletas paraolímpicos;

SELECT a.nome,

a.cpf,

a.salario,

a.endereco,

p.deficiencia,

p.nivel

FROM ATLETA a, PARAOLIMPICO p

WHERE a.ID = p.ID_ATLETA ;

  

--3) Liste os ids e descrições das modalidades e os nomes dos atletas que

--as praticam;

SELECT m.id,

m.descricao,

a.nome

FROM MODALIDADE m, ATLETA a, PRATICA p

WHERE a.ID = p.ID_ATLETA AND p.ID_MODALIDADE = m.ID;

  

  

--4) Liste o registro do atleta, seu nome, a descrição da modalidade que

--disputa e a melhor colocação dele dentre os campeonatos que

--disputou para cada modalidade;

SELECT p.registro_atleta,

a.nome,

m.descricao,

MIN(p.colocacao) AS melhor_colocacao

FROM PARTICIPA p, ATLETA a, MODALIDADE m, ESPORTE e

WHERE p.REGISTRO_ATLETA = e.REGISTRO_ATLETA

AND e.ID_ATLETA = a.id

AND e.ID_MODALIDADE = m.ID

GROUP BY p.REGISTRO_ATLETA, a.nome, m.DESCRICAO

ORDER BY melhor_colocacao;

  

  

--5) Liste o nome, data de início e data de término dos campeonatos e o

--registro de atletas que participaram dele, se houver (incluir na

--listagem campeonatos que ninguém participou);

  

SELECT c.NOME ,

c.DATA_INICIO,

c.DATA_FIM,

p.REGISTRO_ATLETA

FROM CAMPEONATO c

LEFT JOIN PARTICIPA p

ON c.ID = p.ID_CAMPEONATO;

  

--6) Liste o nome do atleta, o nome do clube a que pertence, a descrição

--da modalidade que pratica, o tempo de experiência na modalidade,

--seu registro de atleta, o nome do campeonato que disputou, a sua

--colocação e valor da premiação recebida para os atletas olímpicos

  

SELECT a.nome,

c.nome,

m.descricao,

pra.experiencia,

e.registro_atleta,

cam.nome,

par.colocacao,

par.valor_premiacao

FROM ATLETA a,

CLUBE c,

MODALIDADE m,

PRATICA pra,

ESPORTE e,

CAMPEONATO cam,

PARTICIPA par

WHERE a.ID_CLUBE = c.ID

AND pra.ID_ATLETA = a.id

AND pra.ID_MODALIDADE = m.ID

AND e.ID_ATLETA = a.ID

AND cam.ID = par.ID_CAMPEONATO

AND par.REGISTRO_ATLETA = e.REGISTRO_ATLETA;

  

  

--7) Mostre o nome, salário e data de nascimento dos atletas que

--pertencem ao clube “Tamplight Club”;

  

SELECT nome,

salario,

datanasc

FROM ATLETA

WHERE ID_CLUBE = (SELECT id FROM CLUBE WHERE nome = 'Tamplight Club');

  

  

--8) Liste o id, o nome, o total de atletas e a média salarial dos clubes

--presididos por “Diana Leamon”, “Billie Dargavel” ou “Shantee

--Jouhning”;

  

SELECT c.id,

c.nome,

COUNT(a.id),

avg(a.salario)

FROM ATLETA a, CLUBE c

WHERE a.ID_CLUBE = c.id

AND c.ID_PRESIDENTE IN (SELECT id FROM PRESIDENTE WHERE nome IN ('Diana Leamon', 'Billie Dargavel','Shantee Jouhning'))

GROUP BY c.id, c.nome, c.nome;

  

--9) Liste o id e o nome das modalidades esportivas que possuem mais

--de 2 atletas que a praticam;

  

SELECT id,

DESCRICAO

FROM MODALIDADE

WHERE id IN (SELECT id_modalidade

FROM PRATICA

GROUP BY ID_MODALIDADE

HAVING count(ID_ATLETA) > 2);

  

--10) Liste o nome e salário dos atletas de “Soccer” que ganham mais do

--que os atletas de “Volleyball” e de “Basketball”.

  

SELECT * FROM MODALIDADE m;

  

SELECT a.nome,

a.salario

FROM ATLETA a

WHERE id IN (SELECT ID_ATLETA

FROM PRATICA

WHERE ID_MODALIDADE in (SELECT id

FROM MODALIDADE

WHERE DESCRICAO = 'Soccer' ))

AND a.SALARIO > ALL (SELECT salario

FROM ATLETA

WHERE id IN (SELECT ID_ATLETA

FROM PRATICA

WHERE ID_MODALIDADE in (SELECT id

FROM MODALIDADE

WHERE DESCRICAO in ('Volleyball', 'Basketball'))));

  

--11) Liste o nome dos atletas que já receberam algum valor de premiação

--em qualquer campeonato;

  

SELECT nome

FROM ATLETA

WHERE id IN (SELECT id_atleta

FROM ESPORTE

WHERE REGISTRO_ATLETA IN (SELECT registro_atleta

FROM participa

WHERE valor_premiacao > 0));

  

--12) Liste a descrição da modalidade, o nome do atleta e a data de

--nascimento do atleta mais velho que pratica a modalidade.

  

SELECT m.descricao,

a.nome,

a.datanasc

FROM ATLETA a

JOIN PRATICA p

ON p.ID_ATLETA = a.id

JOIN MODALIDADE m

ON m.ID = p.ID_MODALIDADE

WHERE a.DATANASC = (SELECT MIN(a2.datanasc)

FROM ATLETA a2

JOIN PRATICA p2

ON a2.ID = p2.ID_ATLETA

WHERE p2.ID_MODALIDADE = p.ID_MODALIDADE );

  

  

  

  

-- MView

  

--1. Crie uma visão materializada chamada MV_Campeonato que liste o

--nome do campeonato, a sua data de início e de fim e a quantidade de

--atletas que o disputaram. Utilize atualização completa e sob demanda.

--Teste a MView inserindo registros na tabela Participa.

  

CREATE MATERIALIZED VIEW MV_Campeonato

build IMMEDIATE

refresh complete

ON demand

AS

SELECT c.nome,

c.data_inicio,

c.data_fim,

count(p.REGISTRO_ATLETA) AS qtd_atleta

FROM campeonato c, participa p

WHERE c.id = p.id_campeonato

GROUP BY c.NOME , c.DATA_FIM, c.data_inicio;

  

SELECT * FROM MV_Campeonato;

  

-- Como o refresh é COMPLETE e ON DEMAND, alterações feitas em PARTICIPA

-- não aparecem automaticamente na MView.

  

execute dbms_mview.refresh('MV_Campeonato'); -- apenas apos isso

  

DROP MATERIALIZED VIEW MV_Campeonato;

  

--2. Crie uma visão materializada chamada MV_Atletas_Soccer que liste o

--nome dos atletas que praticam a modalidade Soccer. Ela deve ter

--atualização fast e on commit. Teste a MView inserindo tuplas na tabela

--Pratica. Se não funcionar, tente a atualização force.

  

CREATE MATERIALIZED VIEW LOG

ON atleta;

CREATE MATERIALIZED VIEW LOG

ON pratica;

CREATE MATERIALIZED VIEW LOG

ON modalidade;

  

  

CREATE MATERIALIZED VIEW MV_Atletas_Soccer

BUILD IMMEDIATE

REFRESH FORCE ON COMMIT

AS

SELECT a.nome

FROM atleta a

JOIN pratica p

ON p.id_atleta = a.id

JOIN modalidade m

ON m.id = p.id_modalidade

WHERE m.descricao = 'Soccer';

  

DROP MATERIALIZED VIEW MV_Atletas_Soccer;

  

--3. Crie uma MView chamada MV_Premiacao que liste o valor total de

--premiação recebida por cada atleta, listando o seu nome e valor total

--ganho com 2 casas decimais. A atualização deve ser realizada

--automaticamente a cada 5 minutos. Insira ou atualize registros na tabela

--Participa para testar a MView.

  

CREATE MATERIALIZED VIEW MV_Premiacao

build IMMEDIATE

refresh complete

START WITH SYSDATE + (5 / 1440)

NEXT sysdate + 5/1440

AS

SELECT a.nome,

p.registro_atleta,

trunc(sum(p.valor_premiacao), 2)

FROM ATLETA a, PARTICIPA p, ESPORTE e

WHERE e.ID_ATLETA = a.id AND p.REGISTRO_ATLETA = e.REGISTRO_ATLETA

GROUP BY a.nome, p.REGISTRO_ATLETA ;

  

  

SELECT * FROM MV_Premiacao;

  

SELECT * FROM ATLETA WHERE NOME = 'Yale Buttle';

  

UPDATE participa SET valor_premiacao = 50000 WHERE registro_atleta = 87715634;

  

--4. Crie uma visão materializada chamada MV_Clube_CT que liste o nome

--do clube, além da cidade, UF e telefone de seus centros de treinamento.

--A Mview deve ter atualização defferred, completa e sob demanda. Testar

--se o defferred funcionou adequadamente.

  

CREATE MATERIALIZED VIEW MV_Clube_CT

build deferred

refresh complete

ON demand

as

SELECT c.nome,

ct.cidade,

ct.uf,

ct.fone AS telefone

FROM clube c

JOIN centro_treinamento ct

ON ct.id_clube = c.id;

  

  

SELECT * FROM MV_Clube_CT;

  

execute dbms_mview.refresh('MV_Campeonato');  

```