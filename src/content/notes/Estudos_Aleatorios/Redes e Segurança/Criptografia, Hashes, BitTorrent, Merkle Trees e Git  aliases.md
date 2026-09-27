---
title: "Criptografia, hashes, BitTorrent, Merkle Trees e Git"
description: "Conceitos de segurança e estruturas de hashes que conectam criptografia, BitTorrent e Git."
category: "Redes e Segurança"
tags: [criptografia, hashes, bittorrent, merkle-trees, git]
---


> [!abstract] Ideia central  
> O vídeo constrói uma sequência de conceitos:
> 
> **criptografia simétrica → criptografia assimétrica → certificados → hashes → assinaturas digitais → fragmentação de arquivos → BitTorrent → DHT → Merkle Trees → Git → sistemas distribuídos**
> 
> A ideia principal é mostrar que vários sistemas aparentemente diferentes reutilizam os mesmos blocos fundamentais: **chaves, hashes, assinaturas, estruturas content-addressable e árvores de hashes**.

---

# 1. O problema que a criptografia tenta resolver

Segurança não é uma única coisa.

Dependendo do problema, queremos propriedades diferentes:

|Propriedade|Pergunta|
|---|---|
|**Confidencialidade**|Alguém não autorizado consegue ler os dados?|
|**Integridade**|Os dados foram modificados?|
|**Autenticidade**|Quem enviou isso é realmente quem diz ser?|
|**Autorização**|Essa pessoa pode executar essa operação?|
|**Disponibilidade**|O serviço continua acessível?|

O vídeo se concentra principalmente nas três primeiras.

Uma forma útil de visualizar:

```text
AES
 ↓
Confidencialidade

Hash
 ↓
Integridade

Assinatura digital
 ↓
Integridade + autenticidade

Certificados
 ↓
Associação entre identidade e chave pública
```

---

# 2. Criptografia simétrica

## Conceito

Na criptografia simétrica existe uma única chave secreta.

```text
          chave K
             ↓

Texto original
      ↓
   AES(K)
      ↓
Ciphertext
      ↓
   AES(K)
      ↓
Texto original
```

A mesma chave precisa estar disponível para quem cifra e para quem decifra.

Exemplo:

```text
mensagem.txt
      ↓
AES + chave secreta
      ↓
mensagem.enc
```

Sem a chave, o objetivo é que recuperar o conteúdo original seja computacionalmente inviável.

---

## AES

Um dos algoritmos simétricos mais utilizados é o **AES — Advanced Encryption Standard**.

Alguns tamanhos de chave possíveis:

```text
AES-128
AES-192
AES-256
```

AES-256 utiliza uma chave de:

```text
256 bits
= 32 bytes
```

Uma chave gerada corretamente nesse espaço possui uma quantidade astronomicamente grande de combinações possíveis.

---

# 3. Criptografia de disco

Sistemas modernos podem utilizar criptografia para proteger os dados armazenados.

Exemplos:

```text
Windows → BitLocker
macOS   → FileVault
Linux   → LUKS/dm-crypt
```

O ponto importante é:

> **Senha de login não é a mesma coisa que criptografia de disco.**

Imagine um notebook sem criptografia.

Um atacante pode:

```text
Notebook
   ↓
remover SSD
   ↓
conectar SSD em outra máquina
   ↓
montar filesystem
   ↓
ler arquivos
```

A senha da conta do sistema operacional não necessariamente protege os bytes armazenados fisicamente.

Com criptografia de disco:

```text
SSD
 ↓
dados criptografados
 ↓
chave necessária
 ↓
filesystem legível
```

Por isso, **Full Disk Encryption é particularmente importante em notebooks e dispositivos que podem ser roubados**.

---

> [!warning] Correção — não é correto dizer que todos esses sistemas simplesmente usam "AES-256"  
> AES é extremamente comum, mas cada solução possui uma arquitetura própria, modos de operação e gerenciamento de chaves diferentes.
> 
> Por exemplo, o FileVault moderno utiliza **AES-XTS** e integra o gerenciamento de chaves ao Secure Enclave em Macs compatíveis.
> 
> Portanto:
> 
> ```text
> "usa AES"
> ```
> 
> é uma boa simplificação inicial.
> 
> Mas:
> 
> ```text
> BitLocker = FileVault = LUKS = AES-256
> ```
> 
> não é tecnicamente correto.

---

# 4. Segurança não deve depender de esconder o algoritmo

O vídeo comenta sobre VeraCrypt permitir escolher diferentes algoritmos, como AES, Serpent e Twofish.

Isso é válido.

O problema está na ideia de que um atacante **não saber qual algoritmo foi utilizado** aumentaria exponencialmente a segurança.

Esse não é um princípio desejável em criptografia.

Um sistema criptográfico deve permanecer seguro mesmo quando o atacante conhece:

- algoritmo;
    
- formato;
    
- implementação;
    
- protocolo;
    
- modo de operação.
    

O segredo deve estar essencialmente na:

```text
CHAVE
```

Esse princípio está relacionado ao **Princípio de Kerckhoffs**.

Modelo mental:

```text
Algoritmo → público
Código     → pode ser público
Protocolo  → público

Chave      → segredo
```

> [!warning] Correção  
> A segurança de VeraCrypt não vem de "o atacante não saber qual algoritmo foi usado".
> 
> Combinações/cascatas de algoritmos podem fazer parte do projeto, mas **security through obscurity não substitui segurança criptográfica**.

---

# 5. Aleatoriedade e geração de chaves

Uma chave criptográfica precisa ser imprevisível.

Não adianta possuir:

```text
256 bits
```

se esses bits forem previsíveis.

Exemplo ruim:

```text
chave = SHA256(data_de_nascimento)
```

Apesar de o resultado possuir 256 bits, o espaço real que o atacante precisa testar é muito menor.

---

## PRNG e CSPRNG

Programas normalmente utilizam geradores pseudoaleatórios.

```text
estado interno
     ↓
algoritmo
     ↓
sequência aparentemente aleatória
```

Para criptografia precisamos de um:

**CSPRNG — Cryptographically Secure Pseudo-Random Number Generator**

Ele deve possuir propriedades como:

- imprevisibilidade;
    
- resistência à reconstrução do estado;
    
- dificuldade de prever valores futuros;
    
- dificuldade de reconstruir valores anteriores.
    

O sistema operacional coleta entropia de várias fontes e mantém um gerador criptograficamente seguro.

---

> [!warning] Atualização — `/dev/random`  
> O vídeo apresenta `/dev/random` como a principal fonte utilizada por aplicações como OpenSSL e recomenda aumentar sua entropia usando `rngd`.
> 
> Isso representa melhor sistemas Linux mais antigos.
> 
> Em Linux moderno, aplicações normalmente utilizam interfaces como:
> 
> ```text
> getrandom()
> ```
> 
> ou a fonte equivalente a:
> 
> ```text
> /dev/urandom
> ```
> 
> depois que o CSPRNG do kernel foi inicializado.
> 
> `/dev/random` hoje é considerado uma interface **legada para a maioria dos usos**.
> 
> Também não é normalmente necessário instalar `rngd` em uma máquina moderna apenas para que OpenSSL produza chaves seguras.

---

## Existe aleatoriedade "verdadeira"?

O vídeo diz que não existe número verdadeiramente aleatório.

Isso é simplificado demais.

Computadores determinísticos utilizam PRNGs, mas existem fontes físicas de entropia e **TRNGs — True Random Number Generators**, baseados em fenômenos físicos.

Na prática:

```text
fontes físicas de entropia
          ↓
kernel
          ↓
CSPRNG
          ↓
aplicações
```

Aplicações normalmente não consomem diretamente grandes volumes de "aleatoriedade física".

A entropia é usada principalmente para **inicializar e alimentar o CSPRNG**.

---

# 6. TPM

**TPM — Trusted Platform Module** é um componente de segurança utilizado para operações como:

- geração/armazenamento protegido de chaves;
    
- sealing de chaves;
    
- medição do processo de boot;
    
- atestação;
    
- integração com BitLocker;
    
- proteção de credenciais.
    

É importante pensar no TPM como uma **raiz de confiança de hardware**, não simplesmente como um "gerador de números aleatórios".

---

> [!warning] Correção — Windows 11  
> O vídeo afirma que a Microsoft teria recuado da exigência do TPM por causa das reclamações.
> 
> Isso está desatualizado/incorreto.
> 
> **Windows 11 continua exigindo oficialmente TPM 2.0 como requisito mínimo.**

---

> [!warning] Correção — TPM não "bloqueia rootkits" sozinho  
> Possuir um TPM não significa automaticamente que rootkits ou malware serão bloqueados.
> 
> Ele participa de arquiteturas maiores como:
> 
> ```text
> UEFI
> + Secure Boot
> + measured boot
> + TPM
> + políticas do sistema operacional
> ```
> 
> O conjunto pode dificultar ataques e detectar estados inesperados durante o boot.

---

# 7. Apple T2 e Secure Enclave

O vídeo apresenta o T2 como equivalente ao TPM em Macs e iPhones.

Hoje isso precisa ser atualizado.

O **Apple T2** foi utilizado principalmente em determinados Macs Intel.

Dispositivos modernos Apple utilizam o **Secure Enclave integrado ao SoC**.

```text
iPhone
iPad
Apple Silicon (M1, M2, M3, M4, M5...)
        ↓
Secure Enclave
```

Portanto:

```text
T2 em todo Mac/iPhone
```

não é mais uma descrição correta da arquitetura Apple.

---

# 8. Modos de operação do AES

AES sozinho é um **block cipher**.

Ele transforma blocos de tamanho fixo.

Para cifrar dados maiores, precisamos definir como os blocos serão utilizados.

Isso gera os chamados **modes of operation**.

Exemplos:

```text
ECB
CBC
CFB
OFB
CTR
GCM
```

---

## ECB

ECB é geralmente inadequado para dados estruturados porque blocos iguais de plaintext geram blocos iguais de ciphertext.

Isso pode revelar padrões.

---

## CBC

**CBC — Cipher Block Chaining** encadeia os blocos.

Simplificando:

```text
P1 + IV → AES → C1
P2 + C1 → AES → C2
P3 + C2 → AES → C3
```

Ele evita alguns dos problemas óbvios do ECB.

Porém CBC sozinho oferece:

```text
confidencialidade
```

mas não fornece automaticamente:

```text
integridade/autenticidade
```

Implementações incorretas podem ser vulneráveis a ataques como **padding oracle**.

---

# 9. AES-GCM e AEAD

Hoje é comum preferir modos **AEAD — Authenticated Encryption with Associated Data**.

Um exemplo importante:

```text
AES-GCM
```

Ele fornece simultaneamente:

```text
confidencialidade
+
integridade/autenticidade da mensagem
```

Simplificadamente:

```text
plaintext
   +
key
   +
nonce
   ↓
AES-GCM
   ↓
ciphertext + authentication tag
```

Durante a descriptografia:

```text
ciphertext
    +
authentication tag
    ↓
verificação
    ↓
válido → plaintext

inválido → rejeitar
```

---

> [!warning] Correção importante — authentication tag não precisa ser secreta  
> O vídeo sugere que a tag do GCM precisa ser transportada de maneira secreta.
> 
> **Não precisa.**
> 
> A tag pode viajar junto com o ciphertext.
> 
> O objetivo da tag é permitir detectar alteração.
> 
> O ponto crítico em AES-GCM é principalmente:
> 
> **não reutilizar o mesmo nonce com a mesma chave.**
> 
> ```text
> mesmo key + mesmo nonce
> ```
> 
> pode destruir propriedades de confidencialidade e autenticidade do GCM.

---

## Salt, IV e nonce não são a mesma coisa

É importante separar:

### Salt

Normalmente utilizado em funções de derivação de chave.

```text
senha + salt
      ↓
KDF
      ↓
chave
```

Evita que entradas iguais produzam sempre o mesmo resultado e dificulta ataques pré-computados.

---

### IV / nonce

Utilizado pela cifra/modo.

```text
key + nonce + plaintext
```

Dependendo do algoritmo, possui requisitos específicos.

No GCM, **unicidade do nonce para cada chave é crítica**.

---

> [!warning] Correção  
> Dizer que:
> 
> ```text
> "CBC com salt é mais seguro que CBC"
> ```
> 
> mistura conceitos.
> 
> O salt pode melhorar **como uma chave é derivada de uma senha**, mas não corrige sozinho as limitações criptográficas do CBC.

---

# 10. Não invente criptografia

Uma das mensagens mais importantes do vídeo é:

> **desenvolvedores não devem criar suas próprias decisões criptográficas sem entender profundamente as consequências.**

Algoritmos modernos possuem vários parâmetros:

```text
algoritmo
modo
nonce
IV
KDF
salt
tamanho da chave
padding
MAC
assinatura
key exchange
```

Escolher uma combinação aparentemente razoável pode criar uma vulnerabilidade grave.

Por isso, prefira:

- bibliotecas maduras;
    
- protocolos consolidados;
    
- configurações seguras por padrão;
    
- primitivas de alto nível;
    
- AEAD em vez de montar "AES + alguma coisa" manualmente.
    

---

## JWT

O vídeo cita JWT como exemplo histórico de uma tecnologia onde escolhas criptográficas ruins poderiam ser feitas por desenvolvedores.

A crítica conceitual é válida: permitir escolhas inseguras ou interpretações erradas de algoritmos cria riscos.

> [!warning] Correção de nomenclatura  
> JWT significa:
> 
> **JSON Web Token**
> 
> e não **JSON Web Authentication**.
> 
> Além disso, JWT não é necessariamente um protocolo de autenticação. É um formato para transportar **claims**, normalmente protegido utilizando JWS ou JWE.

---

# 11. O problema da criptografia simétrica

Imagine:

```text
Alice ───── internet ───── Bob
```

Alice quer enviar mensagens usando AES.

Ambos precisam da mesma chave:

```text
K
```

Mas surge um problema:

> Como Bob recebe `K` com segurança?

Se Alice simplesmente enviar:

```text
email → K
```

um atacante poderia interceptar a chave.

Esse é o **key distribution problem**.

---

# 12. Criptografia assimétrica

A criptografia assimétrica utiliza um par de chaves:

```text
private key
public key
```

A chave pública pode ser distribuída.

A chave privada precisa permanecer protegida.

No caso clássico de RSA:

```text
public key
    ↓
encripta
    ↓
ciphertext
    ↓
private key
    ↓
decripta
```

Isso permite criar sistemas híbridos.

---

# 13. Por que usamos criptografia híbrida?

Criptografia assimétrica é geralmente muito mais cara que criptografia simétrica.

Portanto, em vez de:

```text
RSA(arquivo de 10 GB)
```

utilizamos:

```text
arquivo
   ↓
AES
   ↓
ciphertext
```

e protegemos apenas a pequena chave AES usando criptografia assimétrica.

```text
AES key
   ↓
RSA public key
   ↓
encrypted AES key
```

O destinatário:

```text
encrypted AES key
       ↓
RSA private key
       ↓
AES key
       ↓
arquivo
```

Esse conceito de combinar primitivas é fundamental em sistemas criptográficos reais.

---

# 14. RSA

O RSA é baseado em propriedades matemáticas relacionadas à fatoração de números muito grandes.

Simplificando a geração:

```text
escolher dois primos grandes

p
q
 ↓
n = p × q
```

`n` é chamado de **modulus**.

A partir desses valores são construídos:

```text
public key
private key
```

A chave pública contém informações como:

```text
n
e
```

e a chave privada possui informações relacionadas ao expoente privado e aos fatores utilizados durante a geração.

A segurança depende da dificuldade prática de recuperar os fatores secretos a partir do módulo suficientemente grande.

---

# 15. RSA × ECC

O vídeo compara RSA com:

**ECC — Elliptic Curve Cryptography**

ECC consegue oferecer níveis de segurança elevados utilizando chaves muito menores.

Uma aproximação útil:

```text
ECC P-256 ≈ RSA 3072
```

em nível de segurança clássico.

---

> [!warning] Correção  
> Dizer:
> 
> ```text
> ECC 256 é "mais forte" que RSA 3072
> ```
> 
> não é uma comparação muito precisa.
> 
> Aproximadamente, **P-256 e RSA-3072 ficam na mesma faixa de segurança clássica (~128 bits)**.
> 
> A grande vantagem da ECC é conseguir isso com chaves e operações muito mais compactas.

---

## ECC não é normalmente usada para "criptografar um arquivo"

ECC costuma participar de operações como:

```text
ECDH  → acordo de chaves
ECDSA → assinatura
```

Em sistemas modernos, uma curva elíptica geralmente ajuda duas partes a **derivar um segredo compartilhado**.

Depois:

```text
segredo compartilhado
        ↓
KDF
        ↓
chaves simétricas
        ↓
AES-GCM / ChaCha20-Poly1305
```

---

# 16. PEM

Chaves e certificados frequentemente aparecem em arquivos:

```text
.pem
```

PEM vem de:

**Privacy Enhanced Mail**

Formato típico:

```text
-----BEGIN PUBLIC KEY-----
...
-----END PUBLIC KEY-----
```

ou:

```text
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

Os dados binários normalmente são representados utilizando **Base64**.

---

> [!warning] Correção — Base64  
> O vídeo descreve Base64 como uma conversão de "8 bits para 7 bits".
> 
> Uma descrição melhor é:
> 
> ```text
> 3 bytes = 24 bits
> ```
> 
> são divididos em:
> 
> ```text
> 4 grupos × 6 bits
> ```
> 
> e cada grupo é representado por um caractere do alfabeto Base64.
> 
> Por isso os dados ficam aproximadamente **33% maiores**.

---

# 17. "Criptografar com a chave privada"

É comum ouvir a simplificação:

```text
public encrypts → private decrypts
private encrypts → public decrypts
```

A segunda parte é uma analogia ruim.

**Assinatura digital não deve ser entendida simplesmente como "criptografar com a chave privada".**

Protocolos modernos utilizam esquemas específicos.

Exemplo com RSA:

```text
Encryption:
RSA-OAEP

Signature:
RSA-PSS
```

São operações com objetivos e construções diferentes.

---

# 18. O problema ainda não acabou

Mesmo com criptografia assimétrica existe outro problema.

Bob manda sua chave pública:

```text
Bob → public key → Alice
```

Mas um atacante pode interceptar:

```text
Bob
 ↓
public key
 ↓
[ATACANTE]
 ↓
fake public key
 ↓
Alice
```

Alice agora está criptografando informações para o atacante.

Esse é um exemplo de:

**MITM — Man-in-the-Middle Attack**

Portanto não basta possuir criptografia assimétrica.

Precisamos responder:

> **Como sabemos que uma chave pública realmente pertence à identidade que esperamos?**

---

# 19. Certificados digitais

Um certificado digital associa uma identidade a uma chave pública.

Simplificando:

```text
domínio
+
public key
+
metadados
+
assinatura de uma CA
```

Exemplo:

```text
example.com
    ↓
certificado
    ↓
public key
    ↓
assinado por CA
```

---

# 20. Certificate Authority

Uma **CA — Certificate Authority** é uma entidade confiável capaz de assinar certificados.

Exemplos conhecidos:

- Let's Encrypt;
    
- DigiCert;
    
- GlobalSign;
    
- Google Trust Services.
    

O navegador possui um **trust store** contendo certificados raiz considerados confiáveis.

Assim podemos ter:

```text
Root CA
   ↓ assina
Intermediate CA
   ↓ assina
example.com
```

Isso forma uma:

**certificate chain / chain of trust**

---

# 21. Let's Encrypt e Certbot

O vídeo utiliza Let's Encrypt para demonstrar a emissão de certificados.

Uma ferramenta muito conhecida é:

```text
certbot
```

Uma das formas de provar controle sobre um domínio é o:

**DNS-01 challenge**

A CA solicita que o usuário publique um determinado valor em um registro DNS TXT.

Exemplo conceitual:

```text
_acme-challenge.example.com

TXT = valor_fornecido_pela_CA
```

Depois:

```text
Let's Encrypt
      ↓
consulta DNS
      ↓
valor correto?
      ↓
domínio controlado pelo solicitante
```

Então pode ser emitido o certificado.

---

# 22. `fullchain.pem` e `privkey.pem`

Certbot normalmente gera arquivos semelhantes a:

```text
fullchain.pem
privkey.pem
```

### `privkey.pem`

Contém a chave privada correspondente ao certificado.

Precisa ser extremamente protegida.

---

### `fullchain.pem`

Normalmente contém:

```text
certificado do domínio
+
certificado(s) intermediário(s)
```

permitindo que o cliente construa a cadeia até uma raiz confiável.

---

> [!warning] Atualização — Let's Encrypt  
> O vídeo mostra uma cadeia antiga envolvendo **R3**.
> 
> Isso está desatualizado.
> 
> O certificado intermediário **Let's Encrypt R3 expirou em setembro de 2025**.
> 
> Em 2026 a Let's Encrypt utiliza uma hierarquia mais nova, incluindo intermediárias como:
> 
> ```text
> YE1
> YE2
> YR1
> YR2
> ```
> 
> além das raízes históricas:
> 
> ```text
> ISRG Root X1
> ISRG Root X2
> ```
> 
> e novas raízes introduzidas pela ISRG.

---

# 23. TLS

Quando acessamos:

```text
https://example.com
```

o navegador utiliza **TLS — Transport Layer Security**.

O TLS precisa resolver vários problemas:

```text
1. Quem é o servidor?
2. Como criar chaves para esta conexão?
3. Como impedir que terceiros leiam os dados?
4. Como detectar alterações?
```

---

# 24. TLS moderno e troca de chaves

Historicamente existiram cipher suites onde RSA era usado diretamente para transportar um segredo.

Porém isso **não representa TLS 1.3**.

No TLS 1.3 normalmente temos algo conceitualmente parecido com:

```text
Client
  ↓
key share

Server
  ↓
key share

ECDHE
  ↓
segredo compartilhado
  ↓
HKDF
  ↓
session keys
```

O certificado do servidor participa principalmente da:

```text
AUTENTICAÇÃO
```

do handshake.

A chave privada correspondente ao certificado é usada para produzir uma **assinatura do handshake**.

---

> [!warning] Correção importante  
> O modelo:
> 
> ```text
> navegador gera AES key
>       ↓
> criptografa usando public key do certificado
>       ↓
> servidor descriptografa
> ```
> 
> descreve aproximadamente antigos modos de **RSA key exchange**, mas não o TLS 1.3 moderno.
> 
> TLS 1.3 utiliza principalmente:
> 
> ```text
> (EC)DHE
> ```
> 
> para estabelecer o segredo compartilhado.
> 
> Isso também permite **Forward Secrecy** quando chaves efêmeras são utilizadas.

---

# 25. O que HTTPS protege?

Depois que o handshake termina, cliente e servidor possuem chaves simétricas de sessão.

O tráfego HTTP passa a ser protegido.

```text
HTTP
 ↓
TLS
 ↓
TCP
 ↓
IP
```

Um observador intermediário não consegue simplesmente ler:

```text
cookies
headers
body
senha
dados da resposta
```

---

## HTTPS não esconde tudo

Ainda podem existir metadados observáveis, dependendo do protocolo e da rede:

```text
IP de destino
volume de tráfego
timing
DNS, dependendo da configuração
```

Portanto:

```text
HTTPS ≠ anonimato
```

HTTPS fornece principalmente:

- confidencialidade;
    
- integridade;
    
- autenticação do servidor.
    

---

# 26. Confiança não exige sempre uma terceira parte

O vídeo utiliza a ideia de um "triângulo de confiança":

```text
Cliente
  \     
   \   
    CA
   /
  /
Servidor
```

Esse é o modelo da **Web PKI**.

Porém não é a única forma possível de estabelecer confiança.

Também existem:

```text
TOFU — Trust On First Use
```

como ocorre frequentemente com SSH.

Ou:

```text
verificação manual de fingerprint
```

Ou:

```text
pre-shared keys
```

Ou ainda:

```text
certificate/key pinning
```

Portanto:

> confiança sempre exige uma terceira autoridade

é uma simplificação específica do modelo PKI utilizado pela Web.

---

# 27. Hashes

Uma função hash recebe uma entrada arbitrária:

```text
H(mensagem)
```

e produz uma saída de tamanho fixo.

Exemplo:

```text
SHA-512
```

sempre produz:

```text
512 bits
```

independentemente da entrada possuir:

```text
5 bytes
5 MB
5 GB
```

---

# 28. Propriedades desejáveis de hashes criptográficos

Um bom hash criptográfico procura fornecer:

### Determinismo

```text
H(x) = H(x)
```

sempre.

---

### Avalanche

Uma pequena mudança:

```text
Hello World
```

para:

```text
Hello World.
```

produz um resultado completamente diferente.

---

### Resistência à pré-imagem

Dado:

```text
H(x)
```

deve ser impraticável recuperar `x`.

---

### Resistência à segunda pré-imagem

Dado `x`, deve ser impraticável encontrar outro `y` tal que:

```text
H(x) = H(y)
```

---

### Resistência a colisões

Deve ser impraticável encontrar:

```text
x ≠ y
```

com:

```text
H(x) = H(y)
```

---

# 29. Hash como fingerprint

Um hash pode funcionar como uma impressão digital de dados.

```text
arquivo.iso
    ↓
SHA-512
    ↓
fingerprint
```

Se um único bit mudar, espera-se um hash completamente diferente.

Isso permite verificar integridade.

---

> [!note]  
> "Fingerprint" não é literalmente sinônimo de "hash".
> 
> Um fingerprint é normalmente **um hash utilizado como identificador compacto de algum dado**.

---

# 30. Verificação de arquivos

Imagine baixar:

```text
linux.iso
```

O distribuidor publica:

```text
linux.iso
linux.iso.sha512
```

Você calcula:

```text
SHA512(linux.iso)
```

e compara.

```text
calculado == publicado
```

Se forem iguais, temos forte evidência de que o arquivo possui exatamente o conteúdo correspondente ao hash publicado.

---

# 31. Integridade não é autenticidade

Existe um problema:

```text
arquivo malicioso
+
hash do arquivo malicioso
```

Se um atacante substituir **os dois**, a comparação funcionará.

Portanto:

```text
hash sozinho
```

garante integridade **em relação ao hash conhecido**, mas não prova sozinho quem publicou aquele hash.

Precisamos de:

```text
assinatura digital
```

ou de algum canal autenticado confiável.

---

# 32. Assinatura digital

Modelo mental:

```text
documento
   ↓
hash
   ↓
algoritmo de assinatura + private key
   ↓
assinatura
```

Quem possui a chave pública correspondente pode verificar:

```text
documento
+
assinatura
+
public key
    ↓
VERIFY
    ↓
válido / inválido
```

Isso permite verificar:

- integridade;
    
- autenticidade relacionada à chave.
    

---

> [!warning]  
> É comum ensinar assinatura como:
> 
> ```text
> "criptografar o hash com a private key"
> ```
> 
> Isso é útil como primeira intuição para RSA, mas tecnicamente é simplificado demais.
> 
> Algoritmos de assinatura possuem construções próprias, como:
> 
> ```text
> RSA-PSS
> ECDSA
> EdDSA
> ```

---

# 33. MD5 e SHA-1

Algoritmos antigos como:

```text
MD5
SHA-1
```

não são adequados para aplicações criptográficas que dependam de resistência a colisões.

Uma colisão é:

```text
A ≠ B
```

mas:

```text
H(A) = H(B)
```

---

> [!warning] Atualização sobre SHA-1  
> O vídeo trata colisões controladas em SHA-1 como algo pouco prático.
> 
> Hoje isso é uma descrição antiga.
> 
> Ataques práticos contra SHA-1 já foram demonstrados, inclusive técnicas de **chosen-prefix collision**.
> 
> Para novos sistemas criptográficos, SHA-1 deve ser considerado obsoleto.

---

# 34. Senhas não devem usar hash rápido

Nunca devemos armazenar:

```text
password = "123456"
```

diretamente no banco.

Mas isso também é insuficiente:

```text
SHA256(password)
```

Hashes como SHA-256 são deliberadamente rápidos.

Isso favorece brute force.

Para senhas queremos funções deliberadamente caras.

Exemplos:

```text
Argon2id
scrypt
bcrypt
PBKDF2
```

Modelo:

```text
password
   +
salt
   ↓
Password KDF
   ↓
password hash
```

O `salt` deve ser diferente por senha e pode ser armazenado no banco.

---

# 35. GPG / OpenPGP

O vídeo apresenta GPG como mecanismo para verificar assinaturas de arquivos.

Fluxo:

```text
ISO
+
arquivo .sig
+
public key confiável
        ↓
gpg --verify
        ↓
assinatura válida?
```

A ideia é que o atacante possa modificar:

```text
ISO
```

mas não consiga criar uma assinatura válida sem possuir a chave privada do projeto.

---

> [!warning] Correção conceitual  
> OpenPGP não possui necessariamente a mesma estrutura hierárquica:
> 
> ```text
> Root CA → Intermediate CA → Certificate
> ```
> 
> da Web PKI.
> 
> O OpenPGP historicamente utiliza conceitos como:
> 
> ```text
> Web of Trust
> ```
> 
> e também pode utilizar keyrings distribuídos por uma organização como âncoras de confiança.
> 
> Portanto comparar uma chave GPG da distribuição diretamente a um "root certificate" é apenas uma analogia.

---

# 36. VPN em Wi-Fi público

O vídeo recomenda VPN em redes públicas.

Uma VPN pode ser útil porque cria:

```text
dispositivo
    ↓
túnel criptografado
    ↓
servidor VPN
```

e reduz a visibilidade da rede local sobre seu tráfego.

Porém:

> [!warning] Atualização  
> Usar Wi-Fi público **não significa automaticamente que HTTPS deixou de ser seguro**.
> 
> TLS continua autenticando e criptografando a conexão.
> 
> Uma VPN adiciona outra camada de proteção e privacidade, mas também muda quem você precisa confiar:
> 
> ```text
> rede local
>      ↓
> provedor VPN
> ```
> 
> Portanto VPN não é uma substituição para TLS.

---

# 37. Fragmentação de arquivos

Um arquivo pode ser visto simplesmente como uma sequência de bytes.

```text
arquivo
 ↓
bytes
```

Podemos dividi-lo:

```text
arquivo

↓ split

chunk_01
chunk_02
chunk_03
chunk_04
```

Depois reconstruir:

```text
chunk_01
+
chunk_02
+
chunk_03
+
chunk_04
   ↓
arquivo original
```

---

# 38. Hash por fragmento

Podemos calcular:

```text
H(chunk_01)
H(chunk_02)
H(chunk_03)
H(chunk_04)
```

Agora cada fragmento pode ser validado individualmente.

Se:

```text
chunk_03
```

chegar corrompido:

```text
H(recebido) != H(esperado)
```

não precisamos baixar o arquivo inteiro novamente.

Basta baixar:

```text
chunk_03
```

novamente.

Esse conceito é fundamental no BitTorrent.

---

# 39. HTTP, TCP e integridade

O vídeo comenta que downloads modernos conseguem continuar do ponto onde pararam.

HTTP suporta requisições parciais por meio de mecanismos como:

```text
Range Requests
```

TCP também possui mecanismos para detectar corrupção durante transporte e retransmitir segmentos.

Porém é importante separar:

```text
TCP
```

garante transporte confiável entre endpoints.

Ele **não garante que o arquivo publicado pelo servidor seja o arquivo legítimo esperado pelo usuário**.

Para isso precisamos novamente de:

```text
hash
assinatura
TLS
```

dependendo do problema.

---

# 40. BitTorrent

O problema do download tradicional:

```text
              ┌→ cliente
Servidor ─────┼→ cliente
              ├→ cliente
              └→ cliente
```

Todo mundo depende do mesmo servidor.

Isso cria:

- concentração de banda;
    
- gargalo;
    
- ponto de falha;
    
- custo para quem hospeda.
    

BitTorrent distribui essa carga.

---

# 41. Swarm

Em BitTorrent existe um **swarm**:

```text
Peer A ───── Peer B
  │    \      │
  │     \     │
  │      Peer C
  │        │
  └──── Peer D
```

Cada participante pode obter partes do conteúdo de vários outros participantes.

---

# 42. Pieces

Um torrent divide o conteúdo em **pieces**.

Exemplo:

```text
arquivo.iso

piece 0
piece 1
piece 2
piece 3
...
```

Cada peer pode possuir conjuntos diferentes dessas pieces.

```text
Peer A → 0 1 2
Peer B → 2 3 4
Peer C → 0 4 5
```

Um downloader pode buscar:

```text
piece 0 ← Peer A
piece 3 ← Peer B
piece 5 ← Peer C
```

simultaneamente.

---

# 43. Seeder, leecher e peer

### Peer

Qualquer participante do protocolo.

---

### Seeder

Peer que possui **todo o conteúdo** e continua compartilhando.

---

### Leecher / downloader

Peer que ainda está baixando.

---

> [!warning] Correção  
> O vídeo define leecher como alguém que baixa sem contribuir.
> 
> Essa definição é excessivamente negativa.
> 
> Um peer que ainda está baixando pode simultaneamente **fazer upload das pieces que já possui**.
> 
> Portanto:
> 
> ```text
> peer incompleto ≠ necessariamente não contribui
> ```
> 
> Também é incorreto chamar um peer que possui apenas uma piece de **seeder**.
> 
> Ele pode compartilhá-la, mas ainda é um peer incompleto.

---

# 44. Tracker

Um tracker ajuda peers a se encontrarem.

```text
Peer
 ↓
Tracker
 ↓
lista de outros peers
```

O tracker normalmente **não precisa armazenar o arquivo**.

Ele coordena descoberta.

---

# 45. `.torrent`

Um arquivo `.torrent` contém **metadados** sobre o conteúdo.

Entre outras informações podemos ter:

- nomes de arquivos;
    
- tamanhos;
    
- tamanho das pieces;
    
- hashes;
    
- trackers;
    
- outros metadados.
    

Ele não contém necessariamente os dados reais que serão baixados.

---

# 46. InfoHash

Um torrent possui um identificador chamado:

**InfoHash**

No BitTorrent v1 ele é derivado do hash SHA-1 da estrutura `info` do metainfo.

Isso é importante:

> [!warning] Correção  
> O `infohash` não é simplesmente:
> 
> ```text
> SHA1(arquivo.iso)
> ```
> 
> Ele identifica os **metadados `info` do torrent**, que por sua vez descrevem o conteúdo.
> 
> Portanto o mesmo arquivo pode aparecer em torrents diferentes e potencialmente ter infohashes diferentes.

---

# 47. Magnet link

Em vez de distribuir o `.torrent`, podemos utilizar um:

```text
magnet:
```

Um magnet link pode carregar o identificador necessário para encontrar os metadados e peers.

No BitTorrent v1 é comum encontrar:

```text
xt=urn:btih:<infohash>
```

onde:

```text
btih
=
BitTorrent Info Hash
```

Outros parâmetros podem incluir:

- tracker;
    
- nome;
    
- webseed;
    
- outros metadados.
    

---

## BitTorrent v2

BitTorrent v2 introduziu mudanças importantes.

Entre elas:

```text
SHA-256
Merkle Trees
```

Magnets v2 podem utilizar identificadores relacionados a:

```text
btmh
```

em vez do clássico `btih`.

---

# 48. DHT

**DHT — Distributed Hash Table**

permite encontrar peers sem depender exclusivamente de trackers centrais.

O BitTorrent DHT é baseado em ideias do **Kademlia**.

Simplificando:

```text
infohash
   ↓
DHT
   ↓
peers associados
```

Cada node mantém apenas parte das informações necessárias para navegar pelo espaço.

---

# 49. Routing table da DHT

Não é possível que cada computador conheça milhões de nodes da rede.

Então cada node mantém uma **routing table** contendo outros nodes relevantes.

```text
Node A
 ├── Node B
 ├── Node F
 ├── Node Q
 └── Node X
```

Se A não souber diretamente a resposta:

```text
A → B → F → Q → destino
```

A busca converge gradualmente para nodes próximos da chave procurada no espaço de IDs.

---

# 50. O que a DHT do BitTorrent realmente armazena?

Esse é um ponto que o vídeo simplifica bastante.

> [!warning] Correção importante  
> A DHT padrão do BitTorrent não é uma gigantesca tabela contendo:
> 
> ```text
> chunk → hash → arquivo
> ```
> 
> nem armazena o conteúdo dos torrents.
> 
> Ela é utilizada principalmente para armazenar/descobrir **informações de contato de peers associadas a infohashes**.
> 
> Conceitualmente:
> 
> ```text
> infohash
>     ↓
> DHT
>     ↓
> onde existem peers desse torrent?
> ```

Depois que os peers são encontrados, o protocolo BitTorrent propriamente dito é usado para transferência.

---

# 51. PEX

Outra técnica é:

**PEX — Peer Exchange**

Peers que já estão conectados podem compartilhar informações sobre outros peers.

```text
A conhece B

B conhece C e D

B → A:
"também existem C e D"
```

Isso reduz ainda mais a dependência de trackers.

---

# 52. Tracker + DHT + PEX

Clientes modernos podem combinar:

```text
Tracker
   +
DHT
   +
PEX
```

para descobrir peers.

Isso aumenta a resiliência.

```text
Tracker indisponível?
       ↓
DHT / PEX ainda podem funcionar
```

---

> [!warning] Simplificação  
> Dizer que basta existir **um único node em qualquer lugar** para o torrent automaticamente sobreviver é forte demais.
> 
> Ainda precisamos considerar:
> 
> - alguém possuir os dados;
>     
> - conectividade;
>     
> - descoberta;
>     
> - metadata;
>     
> - disponibilidade do peer;
>     
> - NAT/firewalls;
>     
> - bootstrap da DHT.
>     
> 
> A arquitetura é muito resiliente, mas não magicamente indestrutível.

---

# 53. BitTorrent v1 e hashes

No BitTorrent v1, as pieces são verificadas utilizando SHA-1.

Simplificando:

```text
piece 1 → SHA1
piece 2 → SHA1
piece 3 → SHA1
...
```

Os hashes ficam descritos nos metadados do torrent.

Ao receber uma piece:

```text
SHA1(recebido)
      ↓
comparar
      ↓
SHA1 esperado
```

Se não bater:

```text
descartar piece
```

---

# 54. O problema de listas gigantes de hashes

Imagine:

```text
1.000.000 pieces
```

Ter uma lista enorme de hashes e precisar transmitir/verificar muitos deles não é ideal.

Precisamos de uma estrutura que permita provar:

> esta piece pertence ao conjunto original

sem precisar transmitir todos os hashes.

É aqui que entram as:

# Merkle Trees

---

# 55. Merkle Tree

Uma Merkle Tree é uma árvore onde folhas representam hashes de dados.

Exemplo:

```text
        ROOT
       /    \
     H01    H23
    /  \    /  \
   H0  H1  H2  H3
   |   |   |   |
  P0  P1  P2  P3
```

Onde:

```text
H0 = H(P0)
H1 = H(P1)

H01 = H(H0 || H1)
```

e finalmente:

```text
ROOT = H(H01 || H23)
```

---

# 56. Propriedade fundamental

Se qualquer piece mudar:

```text
P2
 ↓
H2 muda
 ↓
H23 muda
 ↓
ROOT muda
```

Portanto a raiz depende criptograficamente de todo o conteúdo abaixo dela.

---

# 57. Merkle Proof

Suponha que queremos verificar apenas:

```text
P0
```

Não precisamos receber todos os hashes da árvore.

Precisamos apenas dos **siblings ao longo do caminho até a raiz**.

Exemplo:

```text
P0
 ↓
H0

precisamos:
H1
H23
```

Então:

```text
H(H0 || H1)
      ↓
H01

H(H01 || H23)
      ↓
ROOT
```

Comparamos com a Merkle Root conhecida.

---

# 58. Complexidade

Em uma árvore balanceada com `N` folhas, uma prova precisa aproximadamente:

```text
O(log₂ N)
```

hashes.

Para:

```text
2048 pieces
```

temos aproximadamente:

```text
log₂(2048)
= 11
```

níveis.

Em vez de precisar de milhares de hashes, precisamos apenas de algo na ordem de dezenas.

Isso permite **proofs of inclusion eficientes**.

---

# 59. BitTorrent e Merkle Trees

Aqui está uma das atualizações mais importantes do vídeo.

> [!warning] Atualização importante  
> O BitTorrent original (**v1**) não foi projetado em torno de Merkle Trees.
> 
> Ele utiliza uma lista de hashes SHA-1 das pieces.
> 
> O **BitTorrent v2**, especificado posteriormente, utiliza:
> 
> ```text
> SHA-256
> +
> Merkle Trees
> ```
> 
> Portanto a explicação do vídeo é excelente para conectar os conceitos, mas deve ser entendida principalmente como uma descrição da evolução para o **BitTorrent v2**, não como funcionamento original de todo torrent.

---

# 60. Git e hashes

Git também utiliza objetos identificados pelo hash de seu conteúdo.

Principais tipos:

```text
blob
tree
commit
tag
```

---

## Blob

Armazena conteúdo de arquivo.

```text
arquivo
 ↓
blob
 ↓
object ID
```

---

## Tree

Representa uma estrutura de diretório.

Pode apontar para:

```text
blob
tree
blob
tree
```

Exemplo:

```text
tree raiz
├── README.md → blob
├── src        → tree
│   ├── app.ts → blob
│   └── db.ts  → blob
```

---

## Commit

Um commit referencia principalmente:

```text
tree
parent(s)
author
committer
mensagem
```

Exemplo:

```text
Commit C
 ├── tree → snapshot
 └── parent → Commit B
```

---

# 61. Git não armazena commits como diffs

Esse é um ponto importante para corrigir.

> [!warning] Correção  
> O vídeo inicialmente descreve commits como:
> 
> ```text
> diffs + trechos modificados + metadata
> ```
> 
> Esse não é o modelo de dados conceitual do Git.
> 
> **Git pensa em snapshots, não em diffs.**
> 
> Um commit aponta para uma `tree`, que representa o estado daquele snapshot.
> 
> `git diff` é uma operação calculada comparando snapshots.
> 
> Conceitualmente:
> 
> ```text
> Commit A → snapshot A
> Commit B → snapshot B
> 
> diff(A, B)
> ```
> 
> O diff é calculado quando necessário.

Internamente, Git pode usar **delta compression** em packfiles para economizar espaço, mas isso é uma otimização de armazenamento, não o modelo lógico dos commits.

---

# 62. Git como Merkle DAG

Objetos do Git referenciam outros objetos por seus hashes.

```text
Commit
  ↓
Tree
 ├── Blob
 └── Tree
      └── Blob
```

Commits também apontam para seus pais:

```text
A ← B ← C
```

Com branches:

```text
      D
     /
A ← B
     \
      C ← E
```

Com merges:

```text
A ← B ← C
     \   \
      D ← M
```

Um merge commit pode possuir múltiplos parents.

Portanto a estrutura não é simplesmente uma árvore.

É um:

**DAG — Directed Acyclic Graph**

Como os nós são identificados pelo conteúdo e referenciam hashes de outros objetos, é comum descrevê-lo como um:

**Merkle DAG**

---

# 63. Reescrever histórico

Se um commit muda:

```text
Commit B
```

seu hash muda.

Se:

```text
Commit C
```

possui o hash de B como parent, C também precisa ser recriado.

Exemplo:

```text
A ← B ← C
```

alteramos B:

```text
A ← B'
```

então o antigo C aponta para B, não B'.

Precisamos criar:

```text
A ← B' ← C'
```

Por isso operações como:

```text
rebase
```

podem gerar novos hashes para commits aparentemente "iguais".

---

# 64. Por que rebase reescreve histórico?

Considere:

```text
A ← B ← C
     \
      D
```

Queremos colocar D depois de C.

Rebase não move fisicamente D.

Ele cria um novo commit:

```text
A ← B ← C ← D'
```

`D'` possui outro parent.

Como o conteúdo do commit inclui a referência ao parent:

```text
hash(D') ≠ hash(D)
```

mesmo que a alteração aplicada ao código seja equivalente.

---

# 65. Hash não impede adulteração do Git

Um ponto muito importante:

```text
hash ≠ autorização
```

É possível reescrever um repositório inteiro e recalcular todos os hashes.

Hashes tornam a modificação **detectável em relação a uma referência conhecida**, mas não impedem que alguém autorizado a substituir refs publique outra história.

---

> [!warning] Correção  
> O vídeo dá a entender que a cadeia de hashes por si só garante que todos perceberão uma adulteração.
> 
> Isso depende de existir uma referência externa confiável.
> 
> Segurança adicional pode vir de:
> 
> ```text
> signed commits
> signed tags
> protected branches
> controle de acesso
> cópias independentes do repositório
> ```
> 
> Se um atacante substituir todo o histórico e também todas as referências que você confia, hashes sozinhos não provam qual história é a legítima.

---

# 66. Git distribuído

Git foi projetado como um **Distributed Version Control System**.

Quando fazemos:

```bash
git clone
```

normalmente obtemos localmente boa parte da estrutura completa necessária para trabalhar com o repositório.

Isso significa que GitHub não é conceitualmente necessário para Git existir.

Poderíamos usar:

```text
Servidor SSH
Pendrive
Servidor próprio
Outro computador
GitHub
GitLab
Forgejo
Gitea
```

GitHub apenas tornou comum um modelo:

```text
DVCS
+
servidor central socialmente escolhido
```

---

# 67. SHA-1 no Git

Git historicamente utiliza SHA-1 para identificar objetos.

Isso se tornou problemático devido às vulnerabilidades conhecidas de SHA-1.

---

> [!warning] Atualização  
> O vídeo fala da migração para SHA-256 como algo que "Git provavelmente fará algum dia".
> 
> Essa transição **já começou tecnicamente há anos**.
> 
> Git possui suporte e especificação para repositórios usando:
> 
> ```text
> SHA-256
> ```
> 
> embora a interoperabilidade e o ecossistema continuem fazendo com que SHA-1 seja muito comum.
> 
> Portanto não é mais apenas uma possibilidade futura; existe uma infraestrutura real de transição.

---

# 68. Git não possui consenso por maioria

Imagine três desenvolvedores:

```text
Alice → história X
Bob   → história X
Carol → história Y
```

Humanos podem concluir:

```text
2 contra 1 → provavelmente X
```

Mas isso **não significa que Git implementa um protocolo de consenso distribuído**.

> [!warning] Correção  
> Git não possui consenso do tipo:
> 
> ```text
> Raft
> Paxos
> Byzantine consensus
> Proof of Work
> ```
> 
> Decidir qual branch ou histórico é "oficial" continua sendo uma decisão social ou feita pelo servidor/políticas utilizadas pela equipe.

---

# 69. DHT e bancos NoSQL

O vídeo compara BitTorrent DHT com bancos distribuídos como:

```text
DynamoDB
Cassandra
```

A analogia é útil porque existem ideias compartilhadas:

- particionamento por chave;
    
- routing;
    
- distribuição;
    
- replicação;
    
- tolerância à entrada/saída de nodes.
    

Modelo:

```text
keyspace

0000 ---------------- FFFF

Node A → parte
Node B → parte
Node C → parte
Node D → parte
```

---

> [!warning] Simplificação  
> Dizer:
> 
> ```text
> "BitTorrent é um grande banco NoSQL distribuído"
> ```
> 
> é uma analogia, não uma equivalência.
> 
> O BitTorrent DHT é um sistema distribuído especializado principalmente em **descoberta de peers**.
> 
> DynamoDB e Cassandra oferecem modelos de armazenamento, consistência, replicação e APIs muito mais ricos.

---

# 70. Content addressing

Uma ideia que aparece repetidamente é:

**Content-addressed storage**

Em vez de identificar algo por:

```text
onde está?
```

identificamos por:

```text
o que é?
```

Exemplo:

```text
conteúdo
   ↓
hash
   ↓
ID
```

Se o conteúdo mudar:

```text
ID muda
```

Essa ideia aparece em diferentes formas em:

- Git;
    
- IPFS;
    
- BitTorrent;
    
- sistemas de objetos;
    
- estruturas Merkle.
    

---

# 71. Merkle Trees no ZFS

ZFS utiliza checksums em sua estrutura de blocos.

Os block pointers carregam checksums que permitem verificar os blocos referenciados.

Isso forma uma estrutura de verificação hierárquica semelhante a uma **Merkle Tree**.

Se houver redundância suficiente, ZFS também pode detectar e reparar certos tipos de corrupção.

---

> [!warning] Correção  
> O vídeo associa diretamente Merkle Trees ao baixo custo de snapshots do ZFS.
> 
> A principal tecnologia que torna snapshots eficientes no ZFS é sua arquitetura **Copy-on-Write**.
> 
> As checksums hierárquicas têm papel fundamental na integridade dos dados, mas não devem ser apresentadas como a única razão pela qual snapshots são baratos.

---

# 72. IPFS

**IPFS — InterPlanetary File System** utiliza fortemente content addressing e estruturas do tipo **Merkle DAG**.

Modelo conceitual:

```text
arquivo
  ↓
chunks
  ↓
hashes
  ↓
DAG
```

Referências são baseadas no conteúdo.

Se um objeto mudar:

```text
hash muda
```

e os objetos superiores que o referenciam também mudam.

É uma ideia extremamente parecida com o modelo do Git.

---

# 73. Merkle Trees em bancos distribuídos

Bancos distribuídos podem utilizar árvores de hashes para comparar réplicas.

Imagine:

```text
Node A dataset
Node B dataset
```

Em vez de transferir tudo:

```text
A → hash root
B → hash root
```

Se:

```text
root A == root B
```

os conjuntos são equivalentes dentro das garantias do hash.

Se forem diferentes, descemos pela árvore:

```text
          root diferente
          /            \
      igual          diferente
                     /       \
                  igual     diferente
```

Assim encontramos apenas a região divergente.

Isso reduz drasticamente a quantidade de dados necessária para sincronização.

Esse processo está relacionado a técnicas de **anti-entropy** em sistemas distribuídos.

---

# 74. Certificate Transparency

Certificados TLS públicos são registrados em sistemas de:

**Certificate Transparency — CT**

Esses logs utilizam **Merkle Hash Trees**.

Isso permite criar:

**proofs of inclusion**

respondendo:

> Este certificado realmente está incluído nesse log?

sem precisar baixar o log inteiro.

É uma aplicação direta da propriedade vista anteriormente.

---

# 75. Bitcoin e Merkle Trees

Um bloco Bitcoin contém várias transações.

Em vez de colocar todas diretamente no header, hashes das transações são organizados em uma Merkle Tree.

```text
TX1  TX2  TX3  TX4
 ↓    ↓    ↓    ↓
H1   H2   H3   H4
 \   /     \   /
 H12       H34
    \     /
    Merkle Root
```

A:

```text
Merkle Root
```

é armazenada no block header.

Isso permite provar que uma transação pertence ao bloco sem transmitir todas as demais.

---

# 76. Blockchain

Cada bloco também referencia o hash do bloco anterior.

Simplificando:

```text
Block A
   ↓ hash
Block B
   ↓ hash
Block C
```

Modificar A muda seu hash.

Então B deixa de apontar corretamente para A.

Alterar B também muda B.

Logo C também fica inconsistente.

```text
A'
 ↓
B'
 ↓
C'
```

Portanto modificar um bloco histórico exige reconstruir tudo que depende dele.

---

# 77. Git × Blockchain

Existe uma semelhança estrutural interessante:

```text
Git commit
   ↓ parent hash
Git commit
```

e:

```text
Bitcoin block
   ↓ previous block hash
Bitcoin block
```

Em ambos:

```text
alteração histórica
      ↓
hash muda
      ↓
descendentes deixam de apontar corretamente
```

---

# 78. Mas blockchain não é apenas "Git com rebase caro"

Essa é uma analogia útil, mas limitada.

Bitcoin adiciona componentes fundamentais que Git não possui:

```text
Proof of Work
consenso Nakamoto
dificuldade
incentivos econômicos
rede peer-to-peer
seleção da cadeia com maior trabalho acumulado
```

---

> [!warning] Correção  
> O vídeo resume a segurança do Bitcoin como:
> 
> ```text
> "rebase fica absurdamente caro por causa da mineração"
> ```
> 
> A intuição é interessante, mas a segurança depende de **todo o mecanismo de consenso e da quantidade de trabalho acumulado**, não simplesmente de tornar o cálculo de hashes caro.
> 
> Além disso, reorganizações:
> 
> ```text
> blockchain reorgs
> ```
> 
> podem acontecer.
> 
> Quanto mais profundo um bloco está na cadeia, mais trabalho precisa ser superado para substituir aquela história.
> 
> Também é importante lembrar:
> 
> **nem toda blockchain utiliza mineração/Proof of Work.**

---

# 79. A grande conexão entre os conceitos

Podemos reconstruir todo o vídeo assim:

```text
AES
│
│ resolve confidencialidade de maneira eficiente
│
▼
Problema: como compartilhar a chave?
│
▼
Criptografia assimétrica
│
│ permite acordo/transporte de segredos
│
▼
Problema: de quem é essa public key?
│
▼
Certificados + assinaturas
│
│ associam identidade a public keys
│
▼
Hashes
│
│ identificam conteúdo e detectam mudanças
│
▼
Hashes por fragmento
│
▼
BitTorrent
│
│ permite transferir fragmentos entre peers
│
▼
DHT + PEX
│
│ ajudam peers a se encontrar
│
▼
Merkle Trees
│
│ permitem verificar inclusão com O(log n)
│
▼
Git / IPFS / CT / bancos distribuídos / Bitcoin
```

---

# 80. Modelo mental: qual ferramenta resolve qual problema?

## Preciso esconder informação

Use:

```text
Encryption
```

Exemplo:

```text
AES-GCM
ChaCha20-Poly1305
```

---

## Preciso descobrir se algo mudou

Use:

```text
Cryptographic hash
```

Exemplo:

```text
SHA-256
SHA-512
```

---

## Preciso saber quem publicou algo

Use:

```text
Digital signature
```

Exemplo:

```text
Ed25519
ECDSA
RSA-PSS
```

---

## Preciso associar um domínio a uma chave pública

Use:

```text
Certificate
+
PKI
```

---

## Preciso verificar uma parte de um conjunto enorme

Use:

```text
Merkle Tree
```

---

## Preciso localizar peers sem servidor central

Use:

```text
DHT
```

---

# 81. Conceitos que não devem ser confundidos

```text
Encoding     ≠ Encryption
Hashing      ≠ Encryption
Signing      ≠ Encryption
Certificate  ≠ Encryption
TLS          ≠ AES
Base64       ≠ Encryption
Hash         ≠ Signature
Password     ≠ Encryption key
Salt         ≠ IV
IV/Nonce     ≠ Secret key
Peer         ≠ Seeder
DHT          ≠ armazenamento dos arquivos
Commit       ≠ Diff
```

Essa lista é provavelmente uma das coisas mais importantes para guardar do conteúdo.

---

# 82. Fluxo completo de uma conexão HTTPS moderna

Uma visão simplificada, mas mais próxima do TLS atual:

```text
Browser
   │
   │ ClientHello
   │ + algoritmos suportados
   │ + key share ECDHE
   ▼
Servidor
   │
   │ ServerHello
   │ + key share
   │ + certificado
   │ + assinatura do handshake
   ▼
Browser
   │
   │ valida certificate chain
   │ valida domínio
   │ valida assinatura
   ▼

ECDHE
   ↓
shared secret
   ↓
HKDF
   ↓
session keys
   ↓

AES-GCM / ChaCha20-Poly1305

Browser ←──── tráfego criptografado ────→ Servidor
```

Aqui aparecem praticamente todos os conceitos da primeira metade do vídeo:

```text
asymmetric crypto
certificates
signatures
hashes
key derivation
symmetric encryption
```

---

# 83. Fluxo simplificado do BitTorrent

```text
Magnet / .torrent
       ↓
    InfoHash
       ↓
 ┌─────┼─────┐
 │     │     │
Tracker DHT  PEX
 │     │     │
 └─────┼─────┘
       ↓
     Peers
       ↓
 ┌─────┼─────┐
 ↓     ↓     ↓
P1    P2    P3
 ↓     ↓     ↓
verificação de integridade
       ↓
arquivo completo
```

No BitTorrent v2:

```text
pieces
  ↓
SHA-256
  ↓
Merkle Tree
  ↓
pieces root
```

---

# 84. Fluxo simplificado do Git

```text
arquivo
  ↓
blob
  ↓
tree
  ↓
commit
  ↓
parent commit
```

Exemplo maior:

```text
Commit C
│
├── parent → Commit B
│             │
│             └── parent → Commit A
│
└── tree
    ├── README → blob
    └── src → tree
              ├── app.ts → blob
              └── db.ts  → blob
```

Todos esses objetos são content-addressed.

Uma alteração profunda pode propagar novos IDs até objetos superiores.

---

# 85. Glossário

|Termo|Significado|
|---|---|
|AES|Advanced Encryption Standard|
|AEAD|Authenticated Encryption with Associated Data|
|CBC|Cipher Block Chaining|
|GCM|Galois/Counter Mode|
|IV|Initialization Vector|
|CSPRNG|Cryptographically Secure Pseudo-Random Number Generator|
|TPM|Trusted Platform Module|
|RSA|Algoritmo de criptografia/assinatura assimétrica|
|ECC|Elliptic Curve Cryptography|
|ECDH|Elliptic Curve Diffie-Hellman|
|ECDSA|Elliptic Curve Digital Signature Algorithm|
|PEM|Privacy Enhanced Mail|
|PKI|Public Key Infrastructure|
|CA|Certificate Authority|
|TLS|Transport Layer Security|
|MITM|Man-in-the-Middle|
|Hash|Função que gera fingerprint de tamanho fixo|
|GPG|GNU Privacy Guard|
|PGP|Pretty Good Privacy|
|Peer|Participante de uma rede P2P|
|Seeder|Peer com conteúdo completo compartilhando|
|Tracker|Serviço de descoberta de peers|
|DHT|Distributed Hash Table|
|PEX|Peer Exchange|
|InfoHash|Identificador dos metadados de um torrent|
|Merkle Tree|Árvore hierárquica de hashes|
|Merkle Root|Hash raiz de uma Merkle Tree|
|Merkle Proof|Prova de inclusão em uma Merkle Tree|
|DAG|Directed Acyclic Graph|
|Merkle DAG|DAG cujos objetos são ligados por hashes|
|Content Addressing|Identificação de dados por seu conteúdo/hash|

---

# 86. O que vale estudar depois

A sequência natural depois deste conteúdo seria:

```text
1. AES e AEAD
   ├── AES-GCM
   └── ChaCha20-Poly1305

2. Key Derivation
   ├── HKDF
   ├── Argon2
   └── PBKDF2

3. Criptografia assimétrica
   ├── RSA
   ├── Diffie-Hellman
   ├── ECDH
   ├── ECDSA
   └── Ed25519 / X25519

4. PKI
   ├── X.509
   ├── Certificate Authorities
   ├── ACME
   └── Certificate Transparency

5. TLS
   ├── TLS 1.2
   ├── TLS 1.3
   ├── handshake
   └── Forward Secrecy

6. Hashes
   ├── SHA-2
   ├── SHA-3
   ├── HMAC
   └── collision resistance

7. Sistemas distribuídos
   ├── Kademlia
   ├── DHT
   ├── BitTorrent
   └── IPFS

8. Estruturas content-addressed
   ├── Git internals
   ├── Merkle Trees
   └── Merkle DAGs

9. Consenso distribuído
   ├── Raft
   ├── Paxos
   └── Nakamoto Consensus
```

---

# 87. Resumo final

Os conceitos fundamentais podem ser reduzidos a algumas ideias:

### Criptografia simétrica

```text
uma chave secreta
→ extremamente eficiente
→ usada para proteger grandes volumes de dados
```

---

### Criptografia assimétrica

```text
public key + private key
→ resolve problemas de estabelecimento de segredos
→ permite assinaturas
```

---

### Certificados

```text
identidade
+
public key
+
assinatura de uma autoridade
```

Permitem estabelecer confiança na Web PKI.

---

### Hashes

```text
dados
→ fingerprint
```

Permitem detectar mudanças e criar identificadores content-addressed.

---

### Assinaturas digitais

```text
dados
+
private key
→ assinatura
```

Permitem verificar integridade e autenticidade relacionada à chave.

---

### BitTorrent

```text
arquivo
→ pieces
→ múltiplos peers
→ transferência paralela
```

Distribui armazenamento/banda entre participantes.

---

### DHT

```text
infohash
→ rede distribuída
→ localização de peers
```

Reduz dependência de trackers centralizados.

---

### Merkle Tree

```text
hashes
→ árvore
→ Merkle Root
```

Permite provar integridade/inclusão usando aproximadamente:

```text
O(log n)
```

informações.

---

### Git

```text
blobs
+
trees
+
commits
+
hashes
```

forma uma estrutura content-addressed semelhante a um **Merkle DAG**.

---

### Bitcoin

Combina:

```text
hashes
Merkle Trees
encadeamento de blocos
assinaturas
rede P2P
Proof of Work
consenso
```

para construir um ledger distribuído.

---

## A ideia mais importante

Muitas tecnologias modernas parecem completamente diferentes quando vistas pela interface:

```text
HTTPS
Git
BitTorrent
IPFS
ZFS
Certificate Transparency
Bitcoin
bancos distribuídos
```

Mas, quando descemos algumas camadas, várias delas reutilizam as mesmas ideias:

```text
hashes
        +
chaves
        +
assinaturas
        +
content addressing
        +
árvores
        +
estruturas distribuídas
```

Entender essas primitivas é mais valioso do que apenas decorar como cada ferramenta funciona individualmente.