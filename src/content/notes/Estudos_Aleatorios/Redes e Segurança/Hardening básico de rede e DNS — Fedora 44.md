

> Documento consolidado das configurações de segurança aplicadas ao **PC Fedora Workstation** e ao **notebook Fedora KDE**.
>
> A ideia é registrar não apenas os comandos, mas principalmente **qual problema cada configuração resolve**, **o que muda entre uma máquina fixa e uma máquina móvel** e **quais pontos ainda estão pendentes**.

## Visão geral

Os dois computadores utilizam Fedora 44, SELinux e `firewalld`, mas possuem perfis de risco diferentes:

- **PC Workstation:** permanece em casa, conectado principalmente por Ethernet, em uma rede que controlo.
- **Notebook:** conecta-se a redes diferentes, incluindo eduroam/IFSP e outras redes que não controlo.

Por isso, o notebook foi configurado com uma política mais conservadora:

```text
PC fixo
└── rede conhecida
    └── firewall restritivo

Notebook
├── rede de casa conhecida
│   └── home-secure
│       ├── KDE Connect permitido
│       └── LocalSend permitido
│
└── qualquer outra rede
    └── public
        └── praticamente nenhuma conexão de entrada permitida
```

A regra geral passou a ser:

> **uma rede só ganha permissões extras quando eu a classifico explicitamente como confiável.**

---

# Parte I — PC Fedora Workstation

Este documento registra as configurações realizadas no meu PC Fedora 44 para melhorar a segurança da rede e a privacidade das consultas DNS.

O objetivo não foi transformar o computador em uma máquina extremamente restritiva, mas aplicar medidas práticas que façam sentido para uma workstation de desenvolvimento:

- reduzir serviços expostos para outros dispositivos da rede;
- manter o firewall em uma configuração mais restritiva;
- entender quais processos realmente estão escutando a rede;
- manter Docker isolado corretamente;
- evitar DNS fornecido automaticamente pelo provedor;
- criptografar as consultas DNS;
- manter IPv4 e IPv6 configurados de maneira consistente;
- preservar funcionalidades úteis do desktop sem desativar serviços aleatoriamente.

---

# 1. Estado inicial do sistema

Primeiro foi verificada a versão do Fedora:

```bash
cat /etc/fedora-release

```

Resultado:

```text
Fedora release 44 (Forty Four)

```

Isso é relevante porque configurações de `firewalld`, NetworkManager, `systemd-resolved` e outras ferramentas podem variar entre distribuições e versões.

---

# 2. Verificação do SELinux

Foi executado:

```bash
getenforce

```

Resultado:

```text
Enforcing

```

## O que é SELinux?

SELinux significa:

```text
Security-Enhanced Linux

```

Ele adiciona uma camada de controle de acesso além das permissões tradicionais do Linux.

Normalmente pensamos nas permissões:

```text
usuário
grupo
rwx

```

Por exemplo:

```text
-rw-r-----

```

Mas o SELinux adiciona regras que dizem quais processos podem acessar determinados recursos, independentemente de algumas permissões tradicionais.

A ideia é limitar o impacto caso algum software seja comprometido.

Por exemplo:

```text
aplicação vulnerável
        ↓
atacante consegue controlar o processo
        ↓
SELinux restringe o que esse processo pode acessar

```

Existem três estados principais:

```text
Enforcing
Permissive
Disabled

```

### Enforcing

As políticas são efetivamente aplicadas.

```text
getenforce
→ Enforcing

```

Era exatamente o estado desejado.

Portanto nenhuma alteração foi necessária.

---

# 3. Verificação do firewall

Foi verificado se o `firewalld` estava ativo:

```bash
firewall-cmd --state

```

Resultado:

```text
running

```

O Fedora usa `firewalld` como solução padrão de firewall.

Não foi necessário instalar `ufw`.

---

# 4. Como funciona o firewall do Fedora

O `firewalld` organiza as interfaces de rede através de **zonas**.

Uma zona representa aproximadamente o nível de confiança que temos naquela rede.

Exemplos:

```text
trusted
home
work
public
drop
block

```

Cada zona possui regras diferentes.

É possível ter, por exemplo:

```text
Ethernet física → public

Docker → docker

VPN → outra zona

```

Isso é útil porque cada tipo de interface possui necessidades diferentes.

---

# 5. Estado inicial das zonas

Foi executado:

```bash
firewall-cmd --get-active-zones

```

Inicialmente:

```text
FedoraWorkstation (default)
  interfaces: enp8s0

docker
  interfaces: br-a3e34fcd0b97 docker0

```

A interface Ethernet física do computador era:

```text
enp8s0

```

E estava na zona:

```text
FedoraWorkstation

```

---

# 6. Problema com a zona FedoraWorkstation

Foi executado:

```bash
firewall-cmd --list-all

```

A configuração mostrava:

```text
FedoraWorkstation

services:
dhcpv6-client
samba-client
ssh

ports:
1025-65535/udp
1025-65535/tcp

```

O principal ponto de atenção era:

```text
1025-65535/tcp
1025-65535/udp

```

Isso significa que a zona permitia conexões de entrada em praticamente todas as portas altas.

## Por que isso importa?

Imagine que durante desenvolvimento eu execute:

```text
NestJS      → porta 3000
Vite        → porta 5173
Laravel     → porta 8000
PostgreSQL  → porta 5432
Redis       → porta 6379

```

Se algum desses serviços estiver escutando:

```text
0.0.0.0:PORTA

```

ele potencialmente aceita conexões através das interfaces de rede da máquina.

Uma zona permitindo:

```text
1025-65535

```

reduz bastante a proteção oferecida pelo firewall para esses serviços.

---

# 7. Diferença entre 127.0.0.1 e 0.0.0.0

Esse é um conceito importante para desenvolvimento.

## 127.0.0.1

Exemplo:

```text
127.0.0.1:5432

```

Significa aproximadamente:

```text
somente este computador pode acessar

```

O endereço pertence à interface de loopback.

Fluxo:

```text
Meu PC
  │
  └──→ 127.0.0.1:5432

```

Outro computador da rede não consegue acessar esse endereço diretamente.

---

## 0.0.0.0

Exemplo:

```text
0.0.0.0:5432

```

Significa que o processo está escutando em todas as interfaces IPv4 disponíveis.

Por exemplo:

```text
lo       → 127.0.0.1
enp8s0   → 192.168.0.10
docker0  → 172.17.0.1

```

Portanto:

```text
0.0.0.0:5432

```

pode incluir:

```text
192.168.0.10:5432

```

e consequentemente outros dispositivos da LAN podem tentar se conectar.

---

# 8. Auditoria dos serviços ouvindo portas

Foi executado:

```bash
sudo ss -lntup

```

As principais entradas encontradas foram relacionadas a:

- `systemd-resolved`;
- `cupsd`;
- `chronyd`;
- `avahi-daemon`;
- `systemd-resolved`/LLMNR;
- `wsdd`.

Não havia aplicações de desenvolvimento importantes ouvindo publicamente.

---

# 9. systemd-resolved

Foram encontrados:

```text
127.0.0.53:53
127.0.0.54:53

```

Esses endereços pertencem ao:

```text
systemd-resolved

```

Ele fornece resolução DNS local para o sistema.

Como estão vinculados a:

```text
127.0.0.x

```

não representam um servidor DNS exposto para toda a rede.

---

# 10. CUPS

Foi encontrado:

```text
127.0.0.1:631
[::1]:631

```

O processo era:

```text
cupsd

```

CUPS é o sistema de impressão utilizado pelo Linux.

Como estava ouvindo somente em:

```text
127.0.0.1
::1

```

não estava exposto à LAN.

Portanto não houve necessidade de desabilitá-lo.

---

# 11. Chrony

Também foi encontrado:

```text
127.0.0.1:323

```

O processo:

```text
chronyd

```

é responsável pela sincronização de horário.

Novamente:

```text
127.0.0.1

```

significa comunicação local.

Não havia necessidade de removê-lo.

---

# 12. Docker

Foi executado:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'

```

Resultado:

```text
NAMES     PORTS

```

Nenhum container estava executando naquele momento.

As interfaces:

```text
docker0
br-a3e34fcd0b97

```

continuaram associadas à zona:

```text
docker

```

Isso é desejável.

Não devemos simplesmente mover as bridges Docker para `public`, porque o Docker administra sua própria estrutura de rede e regras.

A arquitetura ficou aproximadamente:

```text
               Fedora
                  │
        ┌─────────┴──────────┐
        │                    │
     enp8s0               docker0
        │                    │
     public                docker
        │                    │
    LAN física          containers

```

---

# 13. Cuidado ao publicar portas Docker

Para desenvolvimento, existe uma diferença importante.

## Publicação comum

```yaml
ports:
  - "5432:5432"

```

Isso normalmente equivale a algo como:

```text
0.0.0.0:5432

```

Consequentemente o serviço pode ficar acessível pela LAN.

---

## Publicação somente local

É preferível, quando acesso remoto não for necessário:

```yaml
ports:
  - "127.0.0.1:5432:5432"

```

Assim:

```text
Host
 │
 └── 127.0.0.1:5432
           │
           ▼
      Container
        :5432

```

Outro computador da rede não consegue acessar diretamente.

Para bancos utilizados exclusivamente durante desenvolvimento local, essa geralmente é a configuração desejável.

---

# 14. Mudança da interface física para a zona public

Primeiro foi identificado o nome da conexão:

```bash
nmcli -f NAME,TYPE,DEVICE connection show --active

```

Resultado:

```text
NAME               TYPE      DEVICE
Conexão cabeada 1  ethernet  enp8s0

```

Foi então alterada a zona da conexão:

```bash
sudo nmcli connection modify "Conexão cabeada 1" connection.zone public

```

Depois a conexão foi reiniciada:

```bash
sudo nmcli connection down "Conexão cabeada 1"
sudo nmcli connection up "Conexão cabeada 1"

```

O resultado passou a ser:

```text
docker
  interfaces: br-a3e34fcd0b97 docker0

public
  interfaces: enp8s0

FedoraWorkstation (default)

```

O ponto principal é:

```text
enp8s0 → public

```

A interface física não está mais usando as permissões extremamente abertas da `FedoraWorkstation`.

---

# 15. Estado da zona public

Foi consultado:

```bash
sudo firewall-cmd --zone=public --list-all

```

O resultado relevante foi:

```text
services:
dhcpv6-client
mdns
ssh

ports:
nenhuma

```

Essa zona não possui aquela regra:

```text
1025-65535

```

que existia na `FedoraWorkstation`.

Isso reduz consideravelmente a superfície de ataque.

---

# 16. O conceito por trás dessa mudança

Antes:

```text
LAN
 │
 ▼
enp8s0
 │
 ▼
FedoraWorkstation
 │
 ├── 1025
 ├── 3000
 ├── 5432
 ├── 8000
 ├── ...
 └── 65535

```

Muitas portas altas eram permitidas pelo firewall.

Agora:

```text
LAN
 │
 ▼
enp8s0
 │
 ▼
public
 │
 ├── serviços explicitamente permitidos
 │
 └── restante bloqueado

```

O princípio utilizado é:

> negar por padrão e permitir somente aquilo que realmente precisa receber conexões.

---

# 17. SSH

A zona `public` atualmente possui:

```text
ssh

```

como serviço permitido.

Isso significa que o firewall permite tráfego destinado à porta SSH padrão.

Porém durante a auditoria:

```bash
sudo ss -lntup

```

não apareceu nenhum:

```text
:22

```

ouvindo.

Portanto atualmente:

```text
Firewall permite SSH
        +
sshd não está ouvindo
        =
não existe servidor SSH acessível

```

## Importante

Existe diferença entre:

### Usar SSH como cliente

```text
Meu PC ─────────→ Servidor
       SSH

```

Exemplo:

```bash
ssh usuario@servidor

```

Isso não exige abrir a porta 22 de entrada.

---

### Usar SSH como servidor

```text
Outro PC ───────→ Meu PC
          SSH

```

Nesse caso é necessário:

- `sshd` executando;
- firewall permitindo a conexão.

---

## Situação desejada para este PC

O objetivo definido é:

```text
PC → Notebook      permitido

Notebook → PC      não permitido

```

Portanto a permissão `ssh` na zona `public` é uma **pendência**.

Se este PC realmente nunca deve aceitar SSH de entrada, pode ser removida posteriormente:

```bash
sudo firewall-cmd --permanent --zone=public --remove-service=ssh
sudo firewall-cmd --reload

```

Isso ainda não foi registrado como executado neste documento.

---

# 18. WSDD

Inicialmente apareceram várias portas relacionadas a:

```text
wsdd

```

principalmente:

```text
UDP 3702

```

Foi verificado o serviço:

```bash
systemctl status wsdd

```

Resultado:

```text
Loaded: loaded
Active: inactive (dead)
disabled

```

Portanto o daemon `wsdd.service` do sistema não estava ativo.

Mesmo assim existia um processo `wsdd`.

Foi investigado com:

```bash
ps -o pid,ppid,user,cmd -p 10769

```

Resultado:

```text
/usr/bin/python3 /usr/bin/wsdd \
--no-host \
--discovery \
--listen /run/user/1000/gvfsd/wsdd

```

Depois:

```bash
pstree -sp 10769

```

Resultado:

```text
systemd
 └── systemd
      └── gvfsd
           └── gvfsd-wsdd
                └── wsdd

```

Isso mostrou que o processo não vinha de:

```text
wsdd.service

```

Ele estava sendo iniciado pelo:

```text
GVFS / GNOME

```

para descoberta de recursos de rede.

Além disso, existe um detalhe importante:

```text
--no-host
--discovery

```

Ou seja, ele está sendo utilizado principalmente para **descobrir outros dispositivos**, não para anunciar este computador como um servidor WSDD.

Portanto não houve necessidade de continuar tentando eliminar esse processo.

---

# 19. Por que não desativar qualquer serviço que aparece na rede?

Hardening não significa:

```text
ver porta
↓
matar processo

```

Primeiro precisamos descobrir:

```text
qual processo?
para que serve?
quem iniciou?
qual endereço está ouvindo?
o firewall permite acesso?
eu utilizo essa funcionalidade?

```

Somente depois decidir.

Essa abordagem evita quebrar funcionalidades do sistema sem obter ganho significativo de segurança.

---

# 20. DNS antes da mudança

Inicialmente o computador recebia DNS automaticamente pela rede.

Normalmente isso ocorre via:

```text
DHCP

```

ou, no caso de IPv6:

```text
Router Advertisement
DHCPv6

```

A arquitetura poderia ser:

```text
PC
 │
 │ DNS
 ▼
Roteador
 │
 ▼
DNS fornecido pelo ISP

```

Dependendo da configuração, essas consultas poderiam utilizar DNS tradicional.

DNS tradicional normalmente usa:

```text
UDP/53
TCP/53

```

e não fornece criptografia do transporte por padrão.

---

# 21. O que uma consulta DNS faz?

Quando navegamos para:

```text
example.com

```

o computador precisa descobrir para qual IP deve enviar a conexão.

Simplificando:

```text
example.com
     │
     ▼
    DNS
     │
     ▼
93.184.x.x

```

Somente depois ocorre algo como:

```text
PC
 │
 │ HTTPS
 ▼
93.184.x.x

```

Portanto DNS é uma etapa anterior à conexão com muitos serviços.

---

# 22. DNS-over-TLS

Foi configurado:

```text
DNS-over-TLS

```

ou:

```text
DoT

```

A arquitetura passa a ser:

```text
PC
 │
 │ DNS criptografado com TLS
 ▼
Quad9
 │
 ▼
DNS autoritativos

```

Em vez de:

```text
PC
 │
 │ DNS sem criptografia
 ▼
resolvedor DNS

```

DoT normalmente utiliza:

```text
TCP/853

```

e cria uma conexão TLS entre o computador e o resolvedor DNS.

---

# 23. Limitação importante do DNS criptografado

DoT não transforma toda a conexão em uma VPN.

Ele protege:

```text
consultas DNS

```

Não protege completamente:

```text
todo tráfego IP

```

Portanto:

```text
DoT ≠ VPN

```

O provedor deixa de conseguir simplesmente observar suas consultas DNS em texto puro, mas ainda é responsável por transportar seus pacotes até a Internet.

Ele continua vendo informações de rede como:

- IPs com os quais sua conexão se comunica;
- horários;
- quantidade de tráfego;
- duração das conexões.

O conteúdo HTTPS continua protegido pela criptografia HTTPS.

---

# 24. Escolha do Quad9

Foram utilizados os resolvedores seguros do Quad9.

IPv4:

```text
9.9.9.9
149.112.112.112

```

IPv6:

```text
2620:fe::fe
2620:fe::9

```

Hostname utilizado para autenticação TLS:

```text
dns.quad9.net

```

O hostname é importante porque TLS não serve apenas para criptografar.

Ele também permite verificar com qual servidor estamos estabelecendo a conexão.

Conceitualmente:

```text
9.9.9.9
   │
   ├── conexão TLS
   │
   └── certificado esperado:
       dns.quad9.net

```

---

# 25. Configuração DNS IPv4

Foi executado:

```bash
sudo nmcli connection modify "Conexão cabeada 1" \
  ipv4.ignore-auto-dns yes \
  ipv4.dns "9.9.9.9#dns.quad9.net,149.112.112.112#dns.quad9.net" \
  connection.dns-over-tls yes

```

Vamos separar cada configuração.

---

## ipv4.ignore-auto-dns

```text
ipv4.ignore-auto-dns yes

```

Significa:

> não utilize automaticamente os servidores DNS recebidos pela configuração IPv4 da rede.

Antes poderia ocorrer:

```text
DHCP
 │
 ├── IP: 192.168.0.10
 ├── Gateway: 192.168.0.1
 └── DNS: servidor do ISP

```

Depois dessa configuração:

```text
DNS recebido automaticamente
            ↓
         ignorado

```

---

## ipv4.dns

Foi configurado:

```text
9.9.9.9#dns.quad9.net
149.112.112.112#dns.quad9.net

```

O formato:

```text
IP#hostname

```

informa tanto:

```text
IP do servidor DNS

```

quanto:

```text
nome esperado no TLS

```

---

## connection.dns-over-tls

Foi configurado:

```text
connection.dns-over-tls yes

```

Isso habilita DNS-over-TLS na conexão.

---

# 26. Reinicialização da conexão

Depois das mudanças:

```bash
sudo nmcli connection down "Conexão cabeada 1"
sudo nmcli connection up "Conexão cabeada 1"

```

Isso força o NetworkManager a reaplicar toda a configuração.

É semelhante conceitualmente a:

```text
config antiga
    ↓
desconecta
    ↓
NetworkManager lê nova configuração
    ↓
conecta novamente

```

---

# 27. Verificação do DoT

Foi executado:

```bash
resolvectl status enp8s0

```

Foi encontrado:

```text
Protocols:
+DNSOverTLS

```

E:

```text
Current DNS Server:
9.9.9.9#dns.quad9.net

```

Isso indicou que `systemd-resolved` estava utilizando DNS-over-TLS.

---

# 28. Teste prático

Também foi executado:

```bash
dig +short txt proto.on.quad9.net

```

Resultado:

```text
"dot"

```

Isso confirma que a consulta chegou ao Quad9 através de:

```text
DNS-over-TLS

```

Portanto não foi verificada apenas a configuração local.

Foi realizado um teste do comportamento efetivo.

---

# 29. Descoberta de DNS IPv6 do provedor

Após a primeira configuração, `resolvectl` ainda mostrava:

```text
9.9.9.9#dns.quad9.net
149.112.112.112#dns.quad9.net

2804:14d:1:0:181:213:132:2
2804:14d:1:0:181:213:132:3

```

Os primeiros eram os Quad9 IPv4 configurados manualmente.

Mas também existiam dois servidores IPv6 recebidos automaticamente.

Isso ocorreu porque inicialmente foi definido somente:

```text
ipv4.ignore-auto-dns yes

```

O IPv6 continuava aceitando DNS automático.

---

# 30. Verificação de IPv6

Foi executado:

```bash
ip -6 addr show dev enp8s0

```

A interface possuía endereços:

```text
2804:14d:...

```

com:

```text
scope global

```

Isso confirmou que o computador realmente possui conectividade IPv6 global.

Portanto não seria correto simplesmente ignorar IPv6.

---

# 31. Por que configurar IPv6 também?

Quando uma máquina possui:

```text
IPv4 + IPv6

```

os dois protocolos coexistem.

Se configurarmos somente:

```text
DNS seguro IPv4

```

mas deixarmos:

```text
DNS automático IPv6

```

podemos criar um caminho alternativo.

Exemplo:

```text
                  ┌─ IPv4 → Quad9 DoT
PC ───────────────┤
                  └─ IPv6 → DNS automático

```

Isso reduz a consistência da configuração.

A solução é configurar ambos.

---

# 32. Configuração DNS IPv6

Foi executado:

```bash
sudo nmcli connection modify "Conexão cabeada 1" \
  ipv6.ignore-auto-dns yes \
  ipv6.dns "2620:fe::fe#dns.quad9.net,2620:fe::9#dns.quad9.net"

```

## ipv6.ignore-auto-dns

```text
ipv6.ignore-auto-dns yes

```

Impede que DNS IPv6 fornecido automaticamente pela rede seja utilizado.

---

## ipv6.dns

Foram definidos:

```text
2620:fe::fe
2620:fe::9

```

novamente associados ao hostname:

```text
dns.quad9.net

```

---

# 33. Estado final do DNS

Depois de reiniciar a conexão novamente:

```bash
sudo nmcli connection down "Conexão cabeada 1"
sudo nmcli connection up "Conexão cabeada 1"

```

foi executado:

```bash
resolvectl status enp8s0

```

Resultado:

```text
Protocols:
+DefaultRoute
LLMNR=resolve
-mDNS
+DNSOverTLS
DNSSEC=no/unsupported

Current DNS Server:
9.9.9.9#dns.quad9.net

DNS Servers:
9.9.9.9#dns.quad9.net
149.112.112.112#dns.quad9.net
2620:fe::fe#dns.quad9.net
2620:fe::9#dns.quad9.net

```

Agora não aparecem mais os servidores DNS automáticos IPv6 anteriores.

A configuração ficou consistente:

```text
                    Fedora
                       │
                 systemd-resolved
                       │
                  DNS-over-TLS
                       │
          ┌────────────┴─────────────┐
          │                          │
        IPv4                       IPv6
          │                          │
     9.9.9.9                  2620:fe::fe
 149.112.112.112             2620:fe::9
          │                          │
          └────────── Quad9 ─────────┘

```

---

# 34. Teste final do Quad9

Novamente:

```bash
dig +short txt proto.on.quad9.net

```

Resultado:

```text
"dot"

```

Isso confirma a configuração funcionando.

---

# 35. DNSSEC=no/unsupported

O resultado mostra:

```text
DNSSEC=no/unsupported

```

Isso não significa necessariamente:

```text
DNSSEC inexistente na resolução

```

Significa que nessa configuração o `systemd-resolved` não está realizando/indicando validação DNSSEC local.

A arquitetura atual é aproximadamente:

```text
PC
 │
 │ TLS autenticado
 ▼
Quad9
 │
 │ validação/resolução
 ▼
DNS

```

Portanto não foi necessário alterar isso neste momento.

---

# 36. LLMNR

Ainda aparece:

```text
LLMNR=resolve

```

LLMNR significa:

```text
Link-Local Multicast Name Resolution

```

É uma forma de descobrir/resolver nomes dentro da rede local sem utilizar o DNS tradicional.

Exemplo simplificado:

```text
"Quem é notebook?"
        │
        ├── multicast na LAN
        │
        └── outro dispositivo responde

```

Ele continua habilitado.

Não foi alterado nesta etapa.

Pode ser estudado posteriormente como uma etapa adicional de hardening.

---

# 37. mDNS

No `resolvectl` aparece:

```text
-mDNS

```

para aquela configuração do `systemd-resolved`.

Por outro lado, a zona `public` contém:

```text
mdns

```

e existe `avahi-daemon` no sistema.

mDNS é utilizado em funcionalidades como:

```text
hostname.local
impressoras
descoberta de serviços
dispositivos da LAN

```

Também não foi desativado, porque eliminar serviços de descoberta sem avaliar seu uso poderia quebrar funcionalidades desktop sem ganho significativo.

---

# 38. Arquitetura final do PC

A configuração pode ser resumida assim:

```text
                         INTERNET
                            │
                            │
                        ROTEADOR
                            │
                     rede 192.168.0.x
                            │
                         enp8s0
                            │
                      ┌─────▼─────┐
                      │ firewalld │
                      │  public   │
                      └─────┬─────┘
                            │
                       Fedora 44
                            │
              ┌─────────────┼──────────────┐
              │             │              │
           SELinux      Aplicações     Docker
          Enforcing         │              │
                            │          docker0/br-*
                            │              │
                            │        zona "docker"
                            │
                    systemd-resolved
                            │
                       DNS-over-TLS
                            │
                          Quad9
                   ┌────────┴────────┐
                   │                 │
                 IPv4              IPv6

```

---

# 39. O que cada camada protege

É importante não confundir as responsabilidades.

## SELinux

Protege principalmente contra:

```text
processo comprometido
        ↓
acesso indevido ao sistema

```

---

## Firewall

Protege principalmente contra:

```text
outro dispositivo
      │
      │ conexão não autorizada
      ▼
     PC

```

---

## Bind em localhost

Reduz exposição de serviços:

```text
127.0.0.1:5432

em vez de

0.0.0.0:5432

```

---

## DNS-over-TLS

Protege:

```text
consulta DNS
    │
    │ criptografia
    ▼
resolvedor

```

---

## HTTPS

Protege a comunicação com aplicações web:

```text
browser
   │
   │ HTTPS
   ▼
website

```

---

## VPN

Seria outra camada diferente:

```text
PC
 │
 │ túnel criptografado
 ▼
VPN
 │
 ▼
Internet

```

Não foi configurada nesta etapa.

---

# 40. Estado atual confirmado

## Sistema

```text
Fedora 44

```

## SELinux

```text
Enforcing

```

## Firewall

Interface física:

```text
enp8s0 → public

```

Docker:

```text
docker0 → docker
br-a3e34fcd0b97 → docker

```

A antiga zona `FedoraWorkstation` não está mais sendo utilizada pela interface física.

## DNS IPv4

```text
9.9.9.9#dns.quad9.net
149.112.112.112#dns.quad9.net

```

## DNS IPv6

```text
2620:fe::fe#dns.quad9.net
2620:fe::9#dns.quad9.net

```

## DNS automático

```text
IPv4: ignorado
IPv6: ignorado

```

## DNS-over-TLS

```text
ativado

```

Teste:

```text
proto.on.quad9.net → "dot"

```

## Docker

Nenhum container estava expondo portas durante a auditoria.

## WSDD

`wsdd.service`:

```text
disabled
inactive

```

Existe um `wsdd` do GVFS/GNOME funcionando em modo de descoberta.

---

# 41. Pendência: SSH de entrada neste PC

A zona `public` foi observada com:

```text
services:
dhcpv6-client
mdns
ssh

```

Como o objetivo é:

```text
PC → Notebook       permitido
Notebook → PC       não permitido

```

a permissão de SSH de entrada neste PC deve ser revisada.

Se nenhuma aplicação exigir servidor SSH neste computador:

```bash
sudo firewall-cmd --permanent \
  --zone=public \
  --remove-service=ssh

sudo firewall-cmd --reload

```

Depois:

```bash
firewall-cmd --zone=public --list-services

```

O esperado seria algo como:

```text
dhcpv6-client mdns

```

Isso não impede:

```bash
ssh usuario@outro-servidor

```

porque conexões SSH de saída são diferentes de permitir conexões SSH entrando no computador.

---

# 42. Comandos úteis para auditorias futuras

## Ver zonas ativas

```bash
firewall-cmd --get-active-zones

```

---

## Ver regras da zona public

```bash
firewall-cmd --zone=public --list-all

```

---

## Ver portas sendo escutadas

```bash
sudo ss -lntup

```

Esse é um dos comandos mais importantes para auditoria de uma workstation.

---

## Ver containers expondo portas

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'

```

Prestar atenção principalmente em:

```text
0.0.0.0:PORTA
[::]:PORTA

```

---

## Ver configuração DNS

```bash
resolvectl status enp8s0

```

Esperado:

```text
+DNSOverTLS

```

e somente Quad9 como DNS.

---

## Testar Quad9 DoT

```bash
dig +short txt proto.on.quad9.net

```

Esperado:

```text
"dot"

```

---

## Ver IPv4

```bash
ip addr show dev enp8s0

```

---

## Ver IPv6

```bash
ip -6 addr show dev enp8s0

```

---

## Ver conexões NetworkManager

```bash
nmcli -f NAME,TYPE,DEVICE connection show --active

```

---

# 43. Checklist rápido

Para verificar futuramente se a configuração continua correta:

```text
[ ] Fedora atualizado

[ ] SELinux = Enforcing

[ ] firewalld = running

[ ] enp8s0 está na zona public

[ ] docker0 / bridges Docker estão na zona docker

[ ] nenhuma aplicação desnecessária ouvindo em 0.0.0.0

[ ] nenhum banco de desenvolvimento exposto desnecessariamente

[ ] containers locais preferencialmente publicados em 127.0.0.1

[ ] DNS automático IPv4 ignorado

[ ] DNS automático IPv6 ignorado

[ ] Quad9 configurado para IPv4

[ ] Quad9 configurado para IPv6

[ ] DNSOverTLS habilitado

[ ] proto.on.quad9.net retorna "dot"

[ ] SSH de entrada permitido somente onde realmente necessário

```

---

# 44. Princípios aprendidos

A principal ideia deste hardening não é decorar comandos.

É entender algumas regras.

## Regra 1 — Exponha somente o necessário

```text
não precisa receber conexão?
        ↓
não exponha

```

---

## Regra 2 — Prefira localhost para serviços locais

```text
127.0.0.1

é preferível a

0.0.0.0

```

quando somente a própria máquina precisa acessar.

---

## Regra 3 — Firewall é uma segunda camada

Mesmo que um serviço esteja configurado incorretamente:

```text
serviço → 0.0.0.0

```

um firewall restritivo ainda pode impedir:

```text
LAN → serviço

```

A melhor configuração utiliza as duas proteções:

```text
bind correto
+
firewall correto

```

---

## Regra 4 — IPv6 também é Internet

Não devemos pensar:

```text
configurei IPv4
=
terminei a configuração

```

Se IPv6 estiver ativo, ele também precisa ser considerado.

Neste computador existe IPv6 global real.

Por isso DNS IPv4 e IPv6 foram configurados.

---

## Regra 5 — DNS criptografado não é VPN

```text
DoT

```

protege DNS.

```text
HTTPS

```

protege a comunicação HTTPS.

```text
VPN

```

túnela tráfego.

Cada ferramenta resolve um problema diferente.

---

## Regra 6 — Segurança não é desativar tudo

Antes de remover algo:

```text
identificar
   ↓
entender
   ↓
avaliar exposição
   ↓
avaliar necessidade
   ↓
decidir

```

O caso do `wsdd` demonstrou isso bem.

Inicialmente parecia um servidor estranho ouvindo UDP 3702.

Depois da investigação:

```text
PID
↓
PPID
↓
pstree
↓
GVFS
↓
wsdd --no-host --discovery

```

foi possível entender que era parte da descoberta de rede do ambiente GNOME.

Esse processo de investigação é muito mais útil do que simplesmente executar:

```bash
kill

```

em qualquer processo desconhecido.

---

# 45. Resultado

A máquina passou de uma configuração onde a interface física utilizava uma zona bastante permissiva:

```text
enp8s0
   ↓
FedoraWorkstation
   ↓
TCP/UDP 1025-65535 permitidos

```

para:

```text
enp8s0
   ↓
public
   ↓
somente serviços explicitamente permitidos

```

Além disso, o caminho DNS passou de uma configuração automática para:

```text
                    ┌── Quad9 IPv4
Fedora ── DoT ──────┤
                    └── Quad9 IPv6

```

com:

```text
DNS automático do IPv4 → ignorado
DNS automático do IPv6 → ignorado
DNS-over-TLS            → habilitado
Quad9 DoT               → testado

```

O resultado é uma workstation com uma superfície de rede menor e uma configuração DNS mais privada e previsível, sem adicionar ferramentas desnecessárias ou alterar agressivamente funcionalidades normais do Fedora.

---

# Parte II — Notebook Fedora KDE

## 46. Objetivo específico do notebook

O notebook precisa de uma política diferente do PC porque ele não permanece apenas na rede doméstica.

Ele pode ser conectado a:

```text
Wi-Fi de casa
eduroam
IFSP
hotspot do celular
hotel
café
rede cabeada desconhecida
outras redes futuras
```

Em uma máquina móvel, não é seguro assumir:

```text
"estou conectado numa rede local, então posso confiar nos outros dispositivos"
```

A política escolhida foi o inverso:

```text
rede nova/desconhecida
        ↓
      public
        ↓
entrada bloqueada por padrão
```

Somente redes domésticas selecionadas recebem uma zona diferente.

Isso implementa um princípio importante:

> **confiança deve ser concedida explicitamente; não presumida.**

---

# 47. Auditoria inicial do notebook

Antes de alterar qualquer configuração, foram verificadas as mesmas camadas utilizadas no PC.

## Fedora

```bash
cat /etc/fedora-release
```

Resultado:

```text
Fedora release 44 (Forty Four)
```

## SELinux

```bash
getenforce
```

Resultado:

```text
Enforcing
```

Portanto, assim como no PC:

```text
SELinux = Enforcing
```

Nenhuma alteração foi necessária.

---

# 48. Estado inicial do firewalld no notebook

Foi executado:

```bash
firewall-cmd --state
firewall-cmd --get-default-zone
firewall-cmd --get-active-zones
```

O estado inicial era:

```text
running

Default:
FedoraWorkstation

FedoraWorkstation
  interfaces: wlp0s20f3

docker
  interfaces:
    br-592d7f597dda
    br-c776cdc21a01
    docker0
```

A interface Wi-Fi física do notebook é:

```text
wlp0s20f3
```

Ela estava utilizando:

```text
FedoraWorkstation
```

que era também a zona padrão.

---

# 49. Por que FedoraWorkstation era inadequada para o notebook

A zona foi inspecionada:

```bash
firewall-cmd --zone=FedoraWorkstation --list-all
```

Ela permitia:

```text
services:
dhcpv6-client
samba-client
ssh

ports:
1025-65535/udp
1025-65535/tcp
```

O problema é o mesmo observado no PC:

```text
1025-65535/tcp
1025-65535/udp
```

são praticamente todas as portas altas.

Isso é particularmente inadequado em um notebook.

Imagine o notebook conectado ao eduroam:

```text
                rede da faculdade
                       │
       ┌───────────────┼───────────────┐
       │               │               │
   usuário A       usuário B       meu notebook
                                       │
                              FedoraWorkstation
                                       │
                              portas altas abertas
```

Se um programa estivesse escutando em:

```text
0.0.0.0:3000
0.0.0.0:5173
0.0.0.0:5432
0.0.0.0:8000
```

a zona `FedoraWorkstation` reduziria bastante a proteção contra tentativas de conexão vindas da rede local.

Por isso, no notebook, a mudança não foi apenas:

```text
Wi-Fi atual → public
```

Foi feita uma mudança mais importante:

```text
default zone → public
```

---

# 50. Tornando `public` a zona padrão

Foi executado:

```bash
sudo firewall-cmd --set-default-zone=public
```

Verificação:

```bash
firewall-cmd --get-default-zone
```

Resultado:

```text
public
```

Essa é uma das diferenças mais importantes em relação ao PC.

Agora, uma conexão que não possua `connection.zone` explicitamente configurada cai automaticamente em:

```text
public
```

A lógica é:

```text
NetworkManager cria/usa uma conexão
             │
             ▼
Existe connection.zone?
      │              │
     sim            não
      │              │
      ▼              ▼
usa zona         usa zona default
específica             │
                       ▼
                     public
```

Isso vale para conexões Wi-Fi e também para perfis Ethernet que não possuam uma zona explícita.

Portanto:

```text
Wi-Fi nova        ─┐
Hotspot novo      ─┤
Ethernet genérica ─┤
Hotel             ─┤
Café              ─┤
                  ▼
                public
```

Não é necessário cadastrar manualmente cada rede futura como `public`.

---

# 51. Estado da zona `public`

Depois do hardening, a zona foi verificada:

```bash
firewall-cmd --zone=public --list-all
```

Resultado relevante:

```text
services:
dhcpv6-client

ports:
nenhuma
```

Portanto não estão liberados na zona pública:

```text
SSH
mDNS
Samba
KDE Connect
LocalSend
portas altas genéricas
```

A ideia é:

```text
rede não confiável
       │
       │ conexão iniciada por outro host
       ▼
   firewalld/public
       │
       X
       │
    notebook
```

Enquanto conexões iniciadas pelo próprio notebook continuam funcionando normalmente.

---

# 52. Criação da zona `home-secure`

Uma zona separada foi criada especificamente para redes domésticas confiáveis:

```bash
sudo firewall-cmd --permanent --new-zone=home-secure
sudo firewall-cmd --reload
```

Depois foi permitido o cliente DHCPv6:

```bash
sudo firewall-cmd --permanent \
  --zone=home-secure \
  --add-service=dhcpv6-client

sudo firewall-cmd --reload
```

A zona passou inicialmente a conter:

```text
services:
dhcpv6-client
```

---

# 53. Por que criar uma zona própria em vez de usar `home`

Foi criada uma zona chamada:

```text
home-secure
```

em vez de simplesmente confiar em uma zona pré-definida mais permissiva.

Isso permite construir exatamente a política necessária:

```text
começar bloqueando
      ↓
liberar somente o que realmente uso
```

Em vez de:

```text
começar com várias permissões
      ↓
tentar descobrir o que remover
```

É uma abordagem de **allowlist**:

```text
necessário?
   │
   ├── sim → permitir
   │
   └── não → continuar bloqueado
```

---

# 54. KDE Connect permitido somente em casa

O notebook utiliza KDE Plasma e possui:

```text
kdeconnectd
```

escutando na rede.

Na auditoria:

```bash
sudo ss -lntup
```

apareceu:

```text
*:1716 TCP
*:1716 UDP
```

O KDE Connect precisa receber conexões locais para descobrir e conversar com dispositivos pareados.

Não queremos liberar isso no eduroam.

Por isso ele foi adicionado **somente** à zona doméstica:

```bash
sudo firewall-cmd --permanent \
  --zone=home-secure \
  --add-service=kdeconnect

sudo firewall-cmd --reload
```

O comportamento passa a ser:

```text
CASA

Celular
   │
   │ KDE Connect
   ▼
Notebook
home-secure
   │
   └── permitido
```

mas:

```text
EDUROAM / REDE PÚBLICA

Outro dispositivo
   │
   │ tentativa KDE Connect
   ▼
Notebook
public
   │
   X
```

O programa pode continuar rodando.

O firewall controla **onde** ele pode receber tráfego.

---

# 55. LocalSend permitido somente em casa

Também foi decidido utilizar LocalSend na rede doméstica.

Foram abertas apenas as portas necessárias na zona `home-secure`:

```bash
sudo firewall-cmd --permanent \
  --zone=home-secure \
  --add-port=53317/tcp

sudo firewall-cmd --permanent \
  --zone=home-secure \
  --add-port=53317/udp

sudo firewall-cmd --reload
```

A zona passou a ter:

```text
services:
dhcpv6-client
kdeconnect

ports:
53317/tcp
53317/udp
```

Isso significa:

```text
Casa
└── LocalSend permitido

eduroam
IFSP
rede nova
└── LocalSend bloqueado
```

O programa não precisa ser desinstalado ou manualmente ligado/desligado a cada troca de rede.

A própria zona de firewall faz essa distinção.

---

# 56. Estado atual da zona `home-secure`

Foi confirmado:

```bash
firewall-cmd --zone=home-secure --list-all
```

Resultado:

```text
home-secure
  services:
    dhcpv6-client
    kdeconnect

  ports:
    53317/tcp
    53317/udp
```

Não foram adicionadas liberações genéricas de:

```text
SSH
Samba
mDNS
1025-65535
```

Portanto mesmo a rede de casa continua seguindo uma política relativamente restritiva.

---

# 57. Associação das redes domésticas à zona `home-secure`

Foram configurados explicitamente como confiáveis os perfis:

```text
fedora_5.0
fedora_2.4
JULIA
```

Comandos:

```bash
sudo nmcli connection modify \
  "fedora_5.0" \
  connection.zone home-secure
```

```bash
sudo nmcli connection modify \
  "fedora_2.4" \
  connection.zone home-secure
```

```bash
sudo nmcli connection modify \
  "JULIA" \
  connection.zone home-secure
```

Depois disso, estando conectado à rede:

```text
fedora_5.0
```

foi confirmado:

```bash
firewall-cmd --get-active-zones
```

Resultado:

```text
docker
  interfaces:
    br-592d7f597dda
    br-c776cdc21a01
    docker0

home-secure
  interfaces:
    wlp0s20f3

public (default)
```

Isso comprova que a interface Wi-Fi física:

```text
wlp0s20f3
```

mudou automaticamente para `home-secure` porque o perfil ativo `fedora_5.0` está associado a essa zona.

---

# 58. A diferença entre interface e perfil de conexão

É importante distinguir:

```text
interface física
```

de:

```text
perfil NetworkManager
```

A interface física é sempre:

```text
wlp0s20f3
```

Mas ela pode carregar diferentes perfis:

```text
wlp0s20f3
   │
   ├── fedora_5.0
   ├── fedora_2.4
   ├── eduroam
   ├── IFSP
   ├── JULIA
   └── rede futura
```

Cada perfil pode declarar:

```text
connection.zone
```

Então:

```text
wlp0s20f3
     │
     ├── fedora_5.0
     │       ↓
     │   home-secure
     │
     ├── fedora_2.4
     │       ↓
     │   home-secure
     │
     ├── eduroam
     │       ↓
     │     public
     │
     └── rede nova
             ↓
       nenhuma zona explícita
             ↓
          default
             ↓
           public
```

O NetworkManager faz essa troca automaticamente.

Não é necessário alterar o firewall manualmente toda vez que mudo de Wi-Fi.

---

# 59. eduroam e IFSP configurados como `public`

Os perfis da faculdade foram explicitamente configurados:

```bash
sudo nmcli connection modify \
  "eduroam" \
  connection.zone public
```

```bash
sudo nmcli connection modify \
  "IFSP" \
  connection.zone public
```

Verificação:

```bash
nmcli -g connection.zone connection show "eduroam"
nmcli -g connection.zone connection show "IFSP"
```

Resultado:

```text
public
public
```

Tecnicamente eles poderiam simplesmente depender da zona padrão `public`.

A configuração explícita foi mantida porque deixa clara a intenção:

```text
eduroam = rede não confiável para conexões de entrada
IFSP    = rede não confiável para conexões de entrada
```

---

# 60. Redes novas também utilizam `public`

Esse ponto é particularmente importante.

Não é necessário executar:

```bash
nmcli connection modify "NOVA_REDE" connection.zone public
```

para cada nova rede.

Como:

```text
default-zone = public
```

qualquer perfil sem zona explícita utiliza `public`.

Por exemplo:

```text
Hotel
   │
   └── connection.zone vazio
             ↓
           public
```

```text
Hotspot
   │
   └── connection.zone vazio
             ↓
           public
```

```text
Conexão cabeada 1
   │
   └── connection.zone vazio
             ↓
           public
```

Esse comportamento é desejável porque uma rede desconhecida nunca recebe automaticamente as permissões de `home-secure`.

---

# 61. Cuidado especial com Ethernet no notebook

O notebook possui também o perfil:

```text
Conexão cabeada 1
```

Uma conexão Ethernet genérica pode ser reutilizada pelo NetworkManager em locais diferentes.

Por exemplo:

```text
hoje:
Notebook ──cabo──> minha casa

amanhã:
Notebook ──cabo──> laboratório/faculdade
```

Por isso **não foi definido `home-secure` globalmente para o perfil Ethernet genérico**.

Mantendo a zona vazia:

```text
Ethernet desconhecida
       ↓
default zone
       ↓
public
```

Essa é uma escolha deliberadamente conservadora.

---

# 62. LLMNR e mDNS desativados nos perfis da faculdade

Os perfis:

```text
eduroam
IFSP
```

foram configurados com:

```bash
sudo nmcli connection modify \
  "eduroam" \
  connection.llmnr no \
  connection.mdns no
```

```bash
sudo nmcli connection modify \
  "IFSP" \
  connection.llmnr no \
  connection.mdns no
```

Isso evita utilizar esses mecanismos de resolução/descoberta local nessas redes.

---

# 63. O que é LLMNR

LLMNR significa:

```text
Link-Local Multicast Name Resolution
```

Ele permite perguntar à rede local algo semelhante a:

```text
"quem possui o nome computador-x?"
```

Fluxo simplificado:

```text
Notebook
   │
   │ multicast
   ▼
rede local
   │
   ├── dispositivo A
   ├── dispositivo B
   └── dispositivo C
```

Em uma rede doméstica pequena isso pode ser conveniente.

Em uma rede grande, compartilhada e não controlada, há menos motivo para anunciar/fazer consultas locais dessa forma.

Por isso foi explicitamente desabilitado no eduroam e IFSP.

---

# 64. O que é mDNS

mDNS significa:

```text
Multicast DNS
```

É outro mecanismo utilizado para descoberta local.

É comum em funcionalidades como:

```text
nome.local
impressoras
descoberta de dispositivos
serviços da LAN
```

Novamente, não havia necessidade de permitir essa descoberta em redes acadêmicas.

Por isso:

```text
eduroam → mDNS off
IFSP    → mDNS off
```

---

# 65. Distinção entre processo escutando e firewall permitindo

Durante a auditoria apareceram:

```text
avahi-daemon
systemd-resolved
kdeconnectd
passimd
```

escutando portas.

Isso não significa automaticamente:

```text
qualquer dispositivo consegue acessar
```

Existem duas camadas diferentes:

```text
processo
   │
   │ listen()
   ▼
porta local
   │
   ▼
firewall
   │
   ├── permitido → pacote chega
   └── bloqueado → pacote não chega
```

Por exemplo, o KDE Connect pode permanecer rodando:

```text
*:1716
```

mas a zona `public` não permite o serviço.

Então no eduroam:

```text
outro host
   │
   │ TCP/UDP 1716
   ▼
public
   │
   X
kdeconnectd
```

Em casa:

```text
celular
   │
   │ KDE Connect
   ▼
home-secure
   │
   ✓
kdeconnectd
```

Essa é uma das principais vantagens das zonas.

---

# 66. Serviços encontrados no notebook

A auditoria:

```bash
sudo ss -lntup
```

mostrou principalmente:

```text
systemd-resolved
avahi-daemon
chronyd
cupsd
kdeconnectd
passimd
```

Não havia servidores de desenvolvimento relevantes expostos naquele momento.

---

# 67. systemd-resolved

Assim como no PC:

```text
127.0.0.53:53
127.0.0.54:53
```

são endereços locais utilizados pelo `systemd-resolved`.

Não representam um servidor DNS aberto para a LAN.

---

# 68. Chrony e CUPS

Foram encontrados:

```text
chronyd:
127.0.0.1:323
[::1]:323
```

e:

```text
cupsd:
127.0.0.1:631
[::1]:631
```

Eles estão vinculados ao loopback.

Portanto:

```text
outro computador → não acessa diretamente
```

Nenhuma alteração foi necessária.

---

# 69. Avahi

O `avahi-daemon` estava ouvindo:

```text
0.0.0.0:5353
[::]:5353
```

Avahi implementa descoberta mDNS.

O processo pode continuar instalado e executando.

Em redes `public`, o firewall não possui `mdns` liberado.

Além disso, nos perfis `eduroam` e `IFSP`, mDNS foi explicitamente desabilitado pelo NetworkManager.

Portanto não houve necessidade de simplesmente remover o Avahi do sistema.

---

# 70. KDE Connect

Foi encontrado:

```text
TCP *:1716
UDP *:1716
```

via:

```text
kdeconnectd
```

A decisão foi:

```text
não matar o programa
não liberar globalmente
liberar apenas em home-secure
```

Isso preserva a funcionalidade onde ela é desejada sem expô-la em redes acadêmicas.

---

# 71. Passim

Foi encontrado:

```text
0.0.0.0:27500
```

via:

```text
passimd
```

Não foi criada nenhuma regra para liberar essa porta em `public` ou `home-secure`.

Portanto o serviço permanece protegido pelo firewall.

A lógica utilizada foi novamente:

> um serviço pode continuar instalado sem precisar ser exposto em todas as redes.

---

# 72. Docker no notebook

A auditoria mostrou interfaces:

```text
docker0
br-592d7f597dda
br-c776cdc21a01
```

na zona:

```text
docker
```

Foi executado:

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

Resultado:

```text
NAMES     PORTS
```

Nenhum container estava executando/publicando portas naquele momento.

Assim como no PC, as bridges Docker permanecem separadas da interface física.

---

# 73. SSH no notebook

Foi verificado:

```bash
systemctl status sshd --no-pager
```

Resultado:

```text
Loaded: loaded
disabled
Active: inactive (dead)
```

Portanto:

```text
sshd tradicional = desligado
```

Esse é um estado adequado neste momento.

Não existe necessidade de abrir SSH na zona `public`.

O plano é utilizar posteriormente uma rede overlay, como Tailscale, para acesso remoto seguro.

---

# 74. Por que não abrir SSH diretamente no eduroam

Uma configuração simples seria:

```text
public
└── ssh permitido
```

Mas isso significaria que qualquer dispositivo capaz de alcançar o IP do notebook naquela rede poderia pelo menos tentar iniciar uma conexão com o servidor SSH.

Mesmo com autenticação forte, não existe vantagem em expor o serviço quando não é necessário.

A política escolhida é:

```text
rede física public
       │
       X
      SSH
```

e futuramente:

```text
PC
 │
 │ rede Tailscale criptografada
 ▼
Notebook
 │
 └── SSH pela tailnet
```

---

# 75. Wi-Fi e Ethernet na mesma LAN

Quando o notebook estiver no Wi-Fi de casa e o PC estiver cabeado:

```text
                 ROTEADOR / AP
                 /          \
                /            \
         Ethernet            Wi-Fi
             │                 │
             PC             Notebook
```

normalmente ambos fazem parte da mesma LAN.

Não existe problema pelo simples fato de:

```text
PC = Ethernet
Notebook = Wi-Fi
```

O access point faz a ponte entre o segmento wireless e a LAN.

O que poderia impedir comunicação seria uma política como:

```text
AP Isolation
Guest isolation
VLANs diferentes
regra de firewall
```

Na rede principal doméstica, AP Isolation foi mantido desabilitado.

---

# 76. Por que Tailscale faz sentido para PC → notebook

O problema muda quando:

```text
PC = casa
Notebook = eduroam
```

Eles deixam de compartilhar a mesma LAN.

Uma arquitetura futura com Tailscale seria:

```text
PC em casa
   │
   │ Tailscale / WireGuard
   │
   ├─────────────────────────┐
                             │
                             ▼
                     Notebook no eduroam
```

Cada dispositivo recebe um endereço virtual da tailnet.

Assim o caminho lógico continua existindo independentemente da rede física usada pelo notebook.

Isso evita:

```text
port forwarding TCP/22
DMZ
UPnP
exposição direta do SSH na Internet
```

Essa configuração ainda é **pendente** neste documento.

---

# 77. Estado da criptografia de disco do notebook

Foi executado:

```bash
lsblk -f
```

O armazenamento principal apareceu diretamente como:

```text
nvme0n1p3
└── btrfs
```

e o disco adicional:

```text
sda1
└── ext4
```

Não apareceu uma camada:

```text
crypto_LUKS
```

Portanto, conforme a auditoria atual:

```text
SSD principal → sem LUKS
disco de dados → sem LUKS
```

Isso merece atenção maior no notebook porque ele é um equipamento transportado fisicamente.

---

# 78. Por que LUKS é especialmente importante no notebook

Senha de login e criptografia de disco resolvem problemas diferentes.

Sem criptografia:

```text
Notebook roubado
      │
      ▼
SSD removido
      │
      ▼
conectado em outro Linux
      │
      ▼
filesystem lido diretamente
```

Nesse cenário, a senha da conta local não protege necessariamente os arquivos armazenados no disco.

Com criptografia:

```text
SSD
 │
 ▼
LUKS
 │
 │ chave necessária
 X
 │
filesystem
```

Por isso a criptografia de disco é uma melhoria futura importante.

Nenhuma tentativa de conversão foi feita durante este hardening.

Uma alteração desse tipo deve ser planejada com:

```text
backup
verificação
migração/reinstalação adequada
teste de recuperação
```

---

# 79. DNS do notebook — estado atual

No PC, Quad9 + DNS-over-TLS já foi configurado e testado. No notebook tambêm.  

A  configuração:

```text
IPv4:
9.9.9.9
149.112.112.112

IPv6:
2620:fe::fe
2620:fe::9

TLS hostname:
dns.quad9.net
```

com:

```text
connection.dns-over-tls = yes
```

Para o eduroam, a configuração deve ser testada na própria rede antes de ser considerada concluída, porque uma rede externa pode aplicar políticas diferentes.

Portanto:

```text
PC DNS DoT       → concluído
Notebook DNS DoT → feita sem ser no edoruam
```

---

# 80. Comparação direta — PC vs Notebook

| Item | PC Workstation | Notebook Fedora KDE | Motivo da diferença |
|---|---|---|---|
| Fedora | 44 | 44 | Mesma base |
| SELinux | Enforcing | Enforcing | Mesma camada de contenção |
| firewalld | Ativo | Ativo | Mesma camada de firewall |
| Zona inicial | FedoraWorkstation | FedoraWorkstation | Padrão inicial do Fedora |
| Zona da interface principal | `public` | depende do perfil | Notebook troca de rede |
| Zona default | não confirmada como alterada neste documento original | `public` | Notebook precisa tratar redes novas como não confiáveis |
| Rede doméstica especial | não necessária | `home-secure` | Notebook precisa alternar automaticamente entre ambientes |
| KDE Connect | não aplicável/documentado | somente `home-secure` | Recurso local útil apenas em rede confiável |
| LocalSend | não documentado | TCP/UDP 53317 somente `home-secure` | Evita exposição em redes externas |
| eduroam/IFSP | não aplicável | `public` | Redes não controladas |
| LLMNR/mDNS em eduroam | não aplicável | desativados | Reduz descoberta/resolução local desnecessária |
| Docker | zona `docker` | zona `docker` | Bridges não devem ser misturadas com a interface física |
| Containers expostos na auditoria | nenhum | nenhum | Estado seguro no momento da análise |
| SSH server | não havia porta 22 escutando; remoção da permissão `ssh` permaneceu como pendência no documento original | `sshd` disabled/inactive e `public` sem SSH | Notebook não deve oferecer SSH na rede física pública |
| DNS Quad9 DoT | configurado/testado | pendente | PC permanece em ambiente previsível; notebook precisa tratar redes diferentes |
| IPv6 | considerado no DNS | ainda deve ser considerado no DNS futuro | IPv6 não deve ser ignorado |
| LUKS | não confirmado no documento original | não presente | Risco físico é maior no notebook |
| Acesso PC → Notebook | planejado | planejado | Tailscale é a estratégia preferida |

---

# 81. Diferença conceitual mais importante entre as duas máquinas

## PC

O PC é essencialmente:

```text
máquina fixa
   │
   ▼
rede doméstica
   │
   ▼
ambiente relativamente previsível
```

Por isso sua configuração pode ser mais estática:

```text
enp8s0
   ↓
public
```

O foco principal foi:

```text
reduzir portas expostas
+
criptografar DNS
+
manter Docker separado
```

---

## Notebook

O notebook é:

```text
máquina móvel
    │
    ├── casa
    ├── faculdade
    ├── hotspot
    ├── hotel
    └── redes futuras
```

Então o problema principal deixa de ser apenas:

```text
"qual zona minha interface usa?"
```

e passa a ser:

```text
"qual zona esta conexão específica deve usar?"
```

Por isso a solução utilizou os perfis do NetworkManager.

---

# 82. Modelo de confiança utilizado no notebook

A política pode ser resumida como:

```text
                       NOTEBOOK
                          │
                          ▼
               Qual perfil está ativo?
                    /              \
                   /                \
          rede confiável        outra rede
                │                   │
                ▼                   ▼
          home-secure             public
                │                   │
        permissões locais       mínimo necessário
           explícitas
```

Hoje:

```text
home-secure
├── dhcpv6-client
├── kdeconnect
├── 53317/tcp
└── 53317/udp
```

Enquanto:

```text
public
└── dhcpv6-client
```

Essa é a principal diferença de hardening em relação ao PC.

---

# 83. O princípio de "default seguro"

No notebook foi aplicada uma ideia importante:

> **o comportamento padrão deve ser o comportamento mais seguro.**

Em vez de:

```text
rede nova
   ↓
permissiva
   ↓
preciso lembrar de endurecer
```

temos:

```text
rede nova
   ↓
public automaticamente
   ↓
restritiva
```

E somente quando eu tenho certeza:

```text
esta rede é confiável
```

faço:

```bash
nmcli connection modify \
  "NOME_DA_REDE" \
  connection.zone home-secure
```

Essa estratégia reduz a dependência de memória e intervenção manual.

---

# 84. Comandos úteis para auditar o notebook

## Zona padrão

```bash
firewall-cmd --get-default-zone
```

Esperado:

```text
public
```

---

## Zonas ativas

```bash
firewall-cmd --get-active-zones
```

Em casa:

```text
home-secure
  interfaces: wlp0s20f3
```

Em uma rede comum não confiável:

```text
public
  interfaces: wlp0s20f3
```

---

## Estado da zona pública

```bash
firewall-cmd --zone=public --list-all
```

Estado atual desejado:

```text
services:
dhcpv6-client
```

---

## Estado da zona doméstica

```bash
firewall-cmd --zone=home-secure --list-all
```

Estado atual:

```text
services:
dhcpv6-client kdeconnect

ports:
53317/tcp 53317/udp
```

---

## Ver os perfis e dispositivos

```bash
nmcli -f NAME,TYPE,DEVICE connection show
```

---

## Ver a zona de um perfil

```bash
nmcli -g connection.zone connection show "fedora_5.0"
```

Esperado:

```text
home-secure
```

---

## Ver eduroam

```bash
nmcli -g connection.zone connection show "eduroam"
```

Esperado:

```text
public
```

---

## Ver serviços escutando

```bash
sudo ss -lntup
```

---

## Ver servidor SSH

```bash
systemctl status sshd --no-pager
```

Estado atual:

```text
disabled
inactive
```

---

## Ver Docker

```bash
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```

---

## Ver criptografia dos discos

```bash
lsblk -f
```

Procurar:

```text
crypto_LUKS
```

---

# 85. Checklist atual do notebook

```text
[x] Fedora 44

[x] SELinux = Enforcing

[x] firewalld = running

[x] default-zone = public

[x] FedoraWorkstation deixou de ser a política padrão

[x] public sem SSH

[x] public sem mDNS

[x] public sem portas altas genéricas

[x] home-secure criada

[x] DHCPv6 permitido em home-secure

[x] KDE Connect permitido somente em home-secure

[x] LocalSend TCP 53317 permitido somente em home-secure

[x] LocalSend UDP 53317 permitido somente em home-secure

[x] fedora_5.0 → home-secure

[x] fedora_2.4 → home-secure

[x] JULIA → home-secure

[x] eduroam → public

[x] IFSP → public

[x] LLMNR desativado no eduroam

[x] mDNS desativado no eduroam

[x] LLMNR desativado no IFSP

[x] mDNS desativado no IFSP

[x] Docker separado na zona docker

[x] Nenhum container exposto durante a auditoria

[x] sshd tradicional disabled/inactive

[ ] DNS Quad9 + DoT nas redes domésticas

[ ] Testar estratégia DNS no eduroam

[ ] Configurar Tailscale

[ ] Configurar acesso SSH PC → Notebook via Tailscale

[ ] Avaliar criptografia LUKS do SSD principal

[ ] Avaliar criptografia do disco de dados
```

---

# 86. Checklist conjunto PC + Notebook

```text
CAMADAS COMUNS
────────────────────────────────

[x] Fedora 44
[x] SELinux Enforcing
[x] firewalld ativo
[x] zona FedoraWorkstation permissiva evitada nas interfaces principais
[x] Docker mantido em zona própria
[x] auditoria com ss -lntup
[x] revisão de serviços antes de simplesmente desativá-los


PC
────────────────────────────────

[x] enp8s0 em public
[x] Quad9 IPv4
[x] Quad9 IPv6
[x] DNS-over-TLS
[x] teste Quad9 = "dot"
[x] nenhum container exposto na auditoria
[ ] confirmar/remover definitivamente SSH da zona public se ainda presente


NOTEBOOK
────────────────────────────────

[x] public como default
[x] redes novas caem automaticamente em public
[x] home-secure para redes confiáveis
[x] KDE Connect somente em casa
[x] LocalSend somente em casa
[x] eduroam/IFSP explicitamente public
[x] LLMNR/mDNS desativados nas redes acadêmicas
[x] sshd tradicional desligado
[x] nenhum container exposto na auditoria
[ ] Quad9/DoT
[ ] Tailscale SSH
[ ] criptografia LUKS
```

---

# 87. Arquitetura atual consolidada

```text
                          INTERNET
                              │
                         ROTEADOR CASA
                         /           \
                        /             \
                 Ethernet             Wi-Fi
                    │                   │
                    ▼                   ▼
               PC Workstation       Notebook
                    │                   │
                 public          fedora_5.0
                    │                   │
                    │              home-secure
                    │                   │
               Quad9 DoT          ┌─────┴─────┐
                                  │           │
                             KDE Connect   LocalSend
```

Quando o notebook sai de casa:

```text
                        NOTEBOOK
                           │
                     eduroam/IFSP
                           │
                           ▼
                         public
                           │
              ┌────────────┼────────────┐
              │            │            │
            SSH ❌      LocalSend ❌  KDE Connect ❌
              │
              └── conexões de saída normais continuam funcionando
```

E futuramente:

```text
PC Workstation
     │
     │ Tailscale / WireGuard
     │
     └──────────────────────────┐
                                │
                                ▼
                            Notebook
                         em qualquer rede
                                │
                                ▼
                               SSH
```

---

# 88. Conclusão

O hardening das duas máquinas segue os mesmos princípios, mas não deve ser idêntico.

No PC, o foco principal foi:

```text
redução da superfície exposta
+
firewall mais restritivo
+
DNS criptografado
```

No notebook, além disso, foi necessário resolver o problema de **mudança constante de ambiente de rede**.

A solução foi transformar:

```text
public
```

na política padrão e criar:

```text
home-secure
```

somente para redes confiáveis.

Assim, a segurança não depende de eu lembrar manualmente de mudar o firewall ao chegar à faculdade, conectar em um hotel ou usar uma nova rede.

A política passa a acompanhar automaticamente o perfil de conexão do NetworkManager.

O resultado desejado é:

```text
rede desconhecida
    ↓
restritiva automaticamente

rede confiável
    ↓
permissões locais explícitas
```

Esse modelo é mais apropriado para uma máquina móvel e mantém funcionalidades úteis como KDE Connect e LocalSend sem expô-las desnecessariamente em redes externas.