---
title: "JWT em cookie vs. sessão persistida"
description: "Comparação entre autenticação com JWT em cookie e sessões armazenadas no servidor."
category: "Autenticação"
tags: [autenticacao, jwt, cookies, sessoes]
---

A diferença principal é **onde fica o estado da autenticação**.

Se você coloca um **JWT no cookie**, normalmente o servidor não precisa guardar aquela sessão em banco. O JWT já carrega as informações necessárias para validar o usuário:

```text
Browser
   |
   | Cookie: access_token=JWT
   v
Backend
   |
   | verifica assinatura + expiração
   v
Usuário autenticado
```

O cookie é só o **meio de transporte/armazenamento no navegador**. O que autentica de fato é o JWT.

Exemplo:

```http
Set-Cookie: access_token=eyJhbGciOi...
HttpOnly
Secure
SameSite=Lax
```

No Nest, você recebe o cookie, valida:

```ts
jwtService.verify(token);
```

e pronto. Isso é uma autenticação mais **stateless**.

---

Já em uma **sessão persistida**, o cookie normalmente contém apenas um identificador aleatório:

```text
Cookie:
session_id=a8f39c...
```

E o estado real fica no servidor, por exemplo:

```text
sessions

id           user_id   expires_at
a8f39c...    15        2026-08-12
```

O fluxo é:

```text
Browser
   |
   | Cookie: session_id=a8f39c
   v
Backend
   |
   | SELECT session WHERE id = ...
   v
Banco / Redis
   |
   | user_id = 15
   v
Usuário autenticado
```

Então temos uma diferença importante:

|                        | JWT no cookie                         | Sessão persistida            |
| ---------------------- | ------------------------------------- | ---------------------------- |
| Cookie guarda          | JWT                                   | ID/token aleatório           |
| Estado fica            | principalmente no cliente             | servidor                     |
| Consulta ao banco      | geralmente não precisa a cada request | normalmente sim              |
| Revogação              | mais complicada                       | simples                      |
| Logout imediato        | mais difícil                          | fácil                        |
| Múltiplos dispositivos | precisa implementar controle          | natural                      |
| Escalabilidade         | muito boa                             | precisa compartilhar sessões |
| Complexidade           | menor inicialmente                    | um pouco maior               |

### Um exemplo importante

Imagine que seu JWT dure **1 hora**.

O usuário faz:

```text
login
 ↓
JWT válido até 15:00
```

Às 14:20 você quer expulsar aquele usuário.

Com JWT puro, mesmo que você faça logout ou altere alguma coisa no banco:

```text
JWT continua matematicamente válido até 15:00
```

Você teria que implementar blacklist/revogação ou usar tokens de curta duração.

Na sessão persistida:

```sql
DELETE FROM sessions
WHERE id = 'a8f39c';
```

Pronto. A próxima requisição falha.

---

Mas existe uma terceira abordagem que é muito comum:

```text
Access JWT
+
Refresh Session persistida
```

Por exemplo:

```text
Browser
│
├── access_token
│      JWT
│      duração: 15 min
│
└── refresh_token
       token aleatório
       duração: 30 dias
             │
             ↓
         Banco
         sessions
```

O access token serve para requests normais:

```text
GET /api/projects
Cookie access_token=JWT
```

O backend apenas valida o JWT.

Quando ele expira:

```text
POST /auth/refresh
Cookie refresh_token=xyz
```

O servidor consulta:

```text
sessions
────────────────────────────
tokenHash
userId
expiresAt
revokedAt
userAgent
...
```

e gera outro access token.

Isso te dá um meio-termo muito bom:

```text
JWT
→ requests rápidas
→ sem query de sessão em toda chamada

Sessão persistida
→ logout/revogação
→ controle de dispositivos
→ refresh token
→ sessões expiradas
```


