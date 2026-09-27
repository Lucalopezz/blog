
## 1. Objetivo

O objetivo desta configuração foi melhorar a segurança da rede doméstica sem adicionar complexidade desnecessária.

O cenário inicial era:

```text
Internet / Claro
       │
       ▼
Technicolor TC7337
       │
       ├── Modem DOCSIS
       ├── Roteador
       ├── NAT
       ├── Firewall
       ├── DHCP
       ├── DNS
       ├── Wi-Fi 2.4 GHz
       └── Wi-Fi 5 GHz
              │
              ▼
        Rede doméstica
```

O TC7337 estava acumulando praticamente todas as funções da rede.

Isso é perfeitamente normal em uma instalação residencial, mas significa que a segurança da borda da rede depende bastante desse único equipamento.

O objetivo imediato foi endurecer sua configuração.

No futuro, a ideia é retirar dele a responsabilidade de controlar a rede e utilizá-lo apenas como modem da Claro.

---

# 2. Equipamento atual

O equipamento fornecido pela Claro é:

```text
Technicolor TC7337
DOCSIS 3.0
HW 3.00
Fabricação: 10/2018
Firmware: 08.89.17.23.03
```

O endereço administrativo da rede é:

```text
192.168.0.1
```

Esse endereço pertence à LAN.

Portanto:

```text
PC
 │
 ├── 192.168.0.10
 │
 ▼
192.168.0.1
 │
 ▼
Roteador
```

Não é um endereço válido na Internet pública.

---

# 3. Diferença entre modem e roteador

Embora o TC7337 esteja fazendo tudo dentro da mesma caixa, existem funções conceitualmente diferentes.

## Modem

A função de modem é fazer a comunicação com a infraestrutura da operadora.

No nosso caso:

```text
Rede DOCSIS da Claro
        │
        ▼
      Modem
        │
        ▼
     Ethernet/IP
```

O cabo coaxial da Claro não pode ser conectado diretamente em um roteador Ethernet comum.

Por isso o TC7337 continuará sendo necessário mesmo se comprarmos um roteador próprio.

---

## Roteador

O roteador controla a comunicação entre redes.

Simplificando:

```text
Internet
   │
   ▼
Roteador
   │
   ▼
192.168.0.0/24
```

Além de rotear pacotes, um roteador doméstico normalmente também executa:

```text
NAT
Firewall
DHCP
DNS forwarding
Wi-Fi
Port forwarding
VPN
```

No TC7337, modem e roteador estão dentro da mesma caixa.

---

# 4. Troca das credenciais administrativas

Uma das primeiras medidas foi identificar as credenciais administrativas do equipamento e definir a troca da senha padrão.

A senha administrativa do roteador é diferente da senha do Wi-Fi.

Temos dois mecanismos de autenticação distintos:

```text
Senha administrativa
        │
        └── protege o painel 192.168.0.1

Senha Wi-Fi
        │
        └── permite entrar na rede wireless
```

A senha administrativa deve ser:

```text
única
longa
aleatória
não reutilizada em nenhum outro serviço
```

O ideal é armazená-la em um gerenciador de senhas.

Se alguém obtém acesso ao painel administrativo do roteador, o problema é muito maior que simplesmente conseguir usar o Wi-Fi.

Essa pessoa poderia potencialmente alterar:

```text
DNS
DHCP
Port forwarding
Firewall
Wi-Fi
UPnP
DMZ
```

Por isso a credencial administrativa é particularmente importante.

---

# 5. Senha Wi-Fi

Também definimos como política utilizar uma senha Wi-Fi forte e diferente da senha administrativa.

Por exemplo:

```text
Senha do roteador != Senha do Wi-Fi
```

Não há necessidade de alterar a senha Wi-Fi periodicamente sem motivo.

É preferível ter:

```text
uma senha longa + única + forte
```

do que ficar trocando senhas fracas constantemente.

---

# 6. Separação das redes 2.4 GHz e 5 GHz

Inicialmente o modem estava utilizando:

```text
REDE WI-FI ÚNICA
```

Nesse modo:

```text
um SSID
   │
   ├── 2.4 GHz
   └── 5 GHz
```

e o roteador utiliza **band steering** para tentar decidir em qual frequência cada cliente deve permanecer.

Decidimos separar as duas bandas.

Exemplo:

```text
fedora_2.4
fedora_5
```

e desativar:

```text
Band Steering
```

A vantagem é ter controle explícito sobre qual frequência será utilizada.

---

# 7. Diferença entre 2.4 GHz e 5 GHz

A rede 2.4 GHz normalmente possui:

```text
maior alcance
melhor penetração através de paredes
menor velocidade
maior interferência
```

Já 5 GHz normalmente oferece:

```text
menor alcance
maior velocidade
mais canais disponíveis
menos interferência
```

Portanto uma distribuição possível seria:

```text
PC
Notebook
Celular
    │
    ▼
5 GHz
```

enquanto:

```text
IoT
equipamentos antigos
dispositivos distantes
    │
    ▼
2.4 GHz
```

Separar os SSIDs **não significa separar as redes logicamente**.

Mesmo com:

```text
fedora_2.4
fedora_5
```

normalmente continuamos com:

```text
             192.168.0.0/24

fedora_2.4 ───────┐
                  ├── mesma LAN
fedora_5 ─────────┘
```

Portanto um dispositivo no 2.4 GHz ainda pode conversar com outro no 5 GHz.

Para isolamento real precisamos de outra técnica, como VLAN.

---

# 8. SSID oculto

Mantivemos:

```text
Rede Oculta: Desligada
```

Ocultar o SSID não é uma medida de segurança relevante.

A rede continua existindo e pode ser detectada por alguém monitorando os frames Wi-Fi.

Portanto:

```text
SSID visível
+
WPA2/WPA3 correto
+
senha forte
```

é preferível a tentar depender de SSID oculto.

---

# 9. AP Isolation na rede principal

Mantivemos:

```text
AP isolado: Desativado
```

na rede principal.

AP isolation impede que determinados clientes wireless conversem diretamente uns com os outros.

Por exemplo:

```text
PC ───X─── Notebook
```

Isso seria interessante em uma rede pública ou de convidados.

Mas não queremos isso na rede principal, porque futuramente queremos fazer coisas como:

```text
PC
 │
 │ SSH
 ▼
Notebook
```

e acessar servidores internos.

Na rede principal:

```text
AP Isolation = OFF
```

faz sentido.

Na futura rede IoT/Guest, a lógica pode ser exatamente o contrário.

---

# 10. Segurança Wi-Fi

A configuração inicial estava em modo:

```text
WPA / WPA2 - PSK
```

Esse é um modo de compatibilidade.

Simplificando:

```text
cliente suporta WPA2?
        │
        ├── sim → WPA2
        │
        └── não → WPA antigo
```

O problema é que WPA original é tecnologia legada.

Portanto definimos como configuração desejada:

```text
WPA 2 - PSK: ATIVADO
WPA / WPA2 - PSK: DESATIVADO
```

---

# 11. O que significa PSK

PSK significa:

```text
Pre-Shared Key
```

É simplesmente o modelo residencial em que todos os dispositivos utilizam uma senha compartilhada.

```text
Celular ───────┐
Notebook ──────┤
PC ────────────┤
               ▼
            mesma PSK
               │
               ▼
            Wi-Fi
```

Isso é diferente de WPA2 Enterprise, no qual normalmente existe autenticação individual através de um servidor RADIUS.

Para uma residência:

```text
WPA2-PSK
```

é perfeitamente adequado.

---

# 12. WPS

Encontramos também a configuração de:

```text
Wi-Fi Protected Setup
WPS
```

O equipamento possuía inclusive WPS por PIN e botão físico.

A interface oferecia:

```text
HABILITAR
INCAPACITAR
```

Definimos:

```text
WPS = INCAPACITADO
```

---

# 13. Por que desativar WPS

WPS foi criado para facilitar a conexão de dispositivos.

Em vez de digitar uma senha Wi-Fi longa, um dispositivo poderia utilizar:

```text
botão físico
```

ou:

```text
PIN WPS
```

Isso adiciona outro mecanismo de entrada na rede.

Como não precisamos dessa conveniência:

```text
WPS
 │
 └── superfície adicional
```

pode simplesmente ser removido.

A lógica utilizada foi:

> Se uma funcionalidade de autenticação não é necessária, não há motivo para mantê-la disponível.

---

# 14. Administração remota

Nas opções avançadas encontramos:

```text
GERENCIAMENTO DA CONFIGURAÇÃO REMOTA (USE HTTPS)
```

e ele estava desativado.

Mantivemos:

```text
Remote Management = OFF
```

Essa é uma configuração muito importante.

Queremos:

```text
Minha LAN
   │
   ▼
192.168.0.1
   │
   ▼
Painel administrativo
        ✅
```

mas não queremos:

```text
Internet
   │
   X
   ▼
Painel administrativo
```

O painel administrativo não precisa estar exposto à Internet.

---

# 15. Bloqueio WAN

Encontramos:

```text
BLOQUEIO WAN
```

e mantivemos habilitado.

WAN significa:

```text
Wide Area Network
```

Nesse contexto representa o lado externo do roteador:

```text
           WAN
Internet ─────── Roteador ─────── LAN
                             192.168.0.x
```

Queremos que conexões novas vindas da Internet sejam bloqueadas, exceto quando existe uma regra explícita permitindo.

A filosofia é:

```text
Internet
    │
    │ conexão inesperada
    X
    │
 Roteador
```

---

# 16. UPnP

Encontramos:

```text
UPNP ATIVAR
```

desmarcado.

Mantivemos:

```text
UPnP = OFF
```

UPnP permite que aplicações da rede solicitem automaticamente alterações no NAT.

Por exemplo:

```text
Aplicação
    │
    │ "abra a porta 32400"
    ▼
Roteador
    │
    ▼
Port Forwarding automático
```

Isso é conveniente para:

```text
jogos
consoles
P2P
alguns servidores
```

mas diminui o controle sobre o que está sendo exposto.

Com UPnP desligado:

```text
aplicação
    │
    X
    │ não cria mapeamento automaticamente
```

Se um serviço precisar ser exposto no futuro, podemos configurar conscientemente.

---

# 17. IPsec Pass Through

Encontramos:

```text
IPSEC PASS THROUGH
```

habilitado.

Mantivemos essa opção.

Essa configuração não significa que o roteador está executando um servidor VPN IPsec.

Ela permite que clientes internos utilizem determinadas VPNs IPsec através do NAT.

Exemplo:

```text
Notebook
    │
    │ VPN IPsec
    ▼
Roteador
    │
    ▼
Servidor VPN da empresa
```

Como ainda é uma tecnologia utilizada, não havia um motivo forte para desabilitá-la.

---

# 18. PPTP Pass Through

Também encontramos:

```text
PPTP PASS THROUGH
```

habilitado.

Definimos sua desativação:

```text
PPTP Pass Through = OFF
```

PPTP é uma tecnologia VPN bastante antiga e obsoleta.

Como não existe necessidade conhecida de utilizar PPTP:

```text
não utilizamos
     +
tecnologia legada
     =
desativar
```

---

# 19. Multicast

A opção:

```text
MULTICAST ATIVAR
```

estava desativada.

Mantivemos assim.

Multicast possui usos legítimos, por exemplo:

```text
IPTV
descoberta
streaming específico
protocolos de rede
```

mas não existe motivo para habilitar funcionalidades extras sem necessidade.

Se algum serviço futuro exigir multicast através do roteador, podemos revisar essa decisão.

---

# 20. Firewall IPv4

Na configuração de segurança encontramos:

```text
Proteção por firewall IPv4: Baixo
```

Decidimos manter:

```text
IPv4 Firewall = Baixo
```

Nesse equipamento, aumentar agressivamente o nível do firewall pode começar a restringir também determinados tráfegos legítimos.

Como utilizamos:

```text
SSH
Git
Docker
VPN
desenvolvimento
homelab
```

não queremos criar regras genéricas que posteriormente causem problemas difíceis de diagnosticar.

O objetivo é:

```text
bloquear conexões externas inesperadas
```

sem restringir arbitrariamente conexões iniciadas pela LAN.

---

# 21. NAT e proteção IPv4

No IPv4 temos algo semelhante a:

```text
Internet
   │
   ▼
IP público
   │
   ▼
Roteador
   │
   │ NAT
   ▼
192.168.0.0/24
```

Os computadores utilizam endereços privados:

```text
192.168.0.10
192.168.0.11
...
```

O roteador traduz essas conexões para o endereço utilizado na WAN.

Isso é NAT:

```text
Network Address Translation
```

NAT não deve ser tratado como substituto de firewall, mas naturalmente dificulta conexões não solicitadas entrando diretamente em hosts IPv4 privados.

---

# 22. Firewall IPv6

Encontramos:

```text
Proteção por firewall IPv6: Ligado
```

e mantivemos:

```text
IPv6 Firewall = ON
```

Isso é particularmente importante porque já verificamos no Fedora que a Claro fornece IPv6 global.

O PC recebeu endereços semelhantes a:

```text
2804:14d:...
```

Diferentemente do cenário IPv4 tradicional, IPv6 não depende de NAT para fornecer conectividade global.

Portanto não queremos depender de:

```text
"meu endereço é privado"
```

como barreira.

Queremos:

```text
Internet IPv6
      │
      │ conexão nova
      X
      │
Firewall IPv6
      │
      ▼
     PC
```

Por isso **não desativamos IPv6**.

Configuramos corretamente sua proteção.

---

# 23. Detecção de varredura de portas

Definimos a ativação de:

```text
DETECÇÃO DE VARREDURA DE PORTAS
```

Uma varredura pode ser algo semelhante a:

```text
IP
│
├── :21?
├── :22?
├── :23?
├── :80?
├── :443?
├── :8080?
└── ...
```

O objetivo de um scanner é descobrir quais serviços estão disponíveis.

Isso não significa necessariamente um ataque — ferramentas como `nmap` fazem exatamente isso e são extremamente úteis para administração.

Mas detectar padrões de scanning vindos de redes não confiáveis é razoável.

Uma observação para o futuro é lembrar dessa configuração caso estejamos estudando `nmap` dentro do homelab.

---

# 24. Detecção de IP Flood

Também definimos:

```text
DETECÇÃO DE IP FLOOD = ON
```

Flood significa um volume anormalmente grande de pacotes.

Simplificando:

```text
normal:

pacote
   ↓
pacote
   ↓
pacote
```

versus:

```text
flood:

↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      roteador
```

Essa proteção pode ajudar o equipamento a detectar alguns padrões anormais.

Ela não consegue proteger contra qualquer DDoS.

Se alguém saturar fisicamente a largura de banda da sua conexão, o roteador não consegue recuperar largura de banda que já foi ocupada.

---

# 25. Fragmentação IP

Decidimos **não habilitar**:

```text
BLOQUEAR PACOTES IP FRAGMENTADOS
```

Portanto:

```text
Block fragmented packets = OFF
```

Fragmentação não significa automaticamente tráfego malicioso.

Um pacote pode ser fragmentado legitimamente por questões relacionadas a:

```text
MTU
tamanho de pacote
caminho da rede
```

Bloquear absolutamente todo tráfego fragmentado seria uma regra muito grosseira e poderia criar problemas sem ganho proporcional de segurança.

---

# 26. Log remoto

Encontramos uma opção de:

```text
Syslog remoto
```

com categorias como:

```text
Conexões permitidas
Conexões bloqueadas
Ataques conhecidos
Eventos de configuração
```

Não configuramos esse recurso.

Isso não tem relação com administração remota.

Syslog remoto significa:

```text
Roteador
    │
    │ logs
    ▼
Servidor Syslog
192.168.0.X:514
```

No futuro isso pode ser interessante para o homelab.

Por exemplo:

```text
Roteador ─────┐
Pi-hole ──────┤
Servidor ─────┤──→ centralização de logs
Containers ───┘
```

Mas não precisamos disso para o hardening atual.

---

# 27. Rede de convidados / IoT

O TC7337 oferece:

```text
Rede Convidados / IoT
```

Porém não ativamos simplesmente por existir.

Antes precisamos saber se essa rede realmente implementa isolamento.

O comportamento desejado seria:

```text
IoT
 │
 ├──→ Internet ✅
 │
 └──X→ PC/Notebook ❌
```

Se ela simplesmente criar:

```text
SSID diferente
```

mas continuar colocando tudo em:

```text
192.168.0.0/24
```

o ganho de segurança pode ser pequeno.

Esse problema será resolvido de maneira muito mais clara futuramente com VLANs.

---

# 28. Port Forwarding e DMZ

Essas configurações são particularmente importantes:

```text
Encaminhamento de porta
DMZ Host
```

O estado ideal enquanto não hospedamos serviços publicamente é:

```text
Port Forwarding = nenhuma regra

DMZ Host = desativado
```

Essas telas ainda devem ser verificadas explicitamente antes de considerar a auditoria completa.

## Port forwarding

Uma regra poderia fazer:

```text
Internet
    │
    │ TCP/22
    ▼
Roteador
    │
    ▼
192.168.0.10:22
```

Isso exporia um serviço interno.

---

## DMZ Host

Em roteadores domésticos, DMZ Host normalmente significa encaminhar grande parte do tráfego de entrada não tratado para um determinado dispositivo.

Exemplo:

```text
Internet
    │
    ▼
Roteador
    │
    └────→ PC configurado como DMZ
```

Não queremos isso para computadores comuns.

---

# 29. Estado desejado do TC7337 após o hardening

A configuração resultante é aproximadamente:

```text
Technicolor TC7337
│
├── senha administrativa forte
├── senha Wi-Fi forte
│
├── 2.4 GHz separado
├── 5 GHz separado
├── Band Steering OFF
├── SSID visível
│
├── WPA2-PSK
├── WPA antigo OFF
├── WPS OFF
│
├── Remote Management OFF
├── UPnP OFF
├── PPTP Pass Through OFF
├── IPsec Pass Through ON
├── Multicast OFF
├── Bloqueio WAN ON
│
├── Firewall IPv4 ON / Low
├── Firewall IPv6 ON
├── Port Scan Detection ON
├── IP Flood Detection ON
├── Block Fragments OFF
│
├── Remote Syslog não configurado
│
├── Port Forwarding: verificar
└── DMZ: verificar
```

---

# 30. Princípio geral utilizado

O padrão que seguimos foi:

```text
preciso dessa funcionalidade?
        │
        ├── SIM → manter/configurar corretamente
        │
        └── NÃO → reduzir/desativar
```

Isso é redução de:

```text
superfície de ataque
```

Quanto menos serviços e mecanismos desnecessários estiverem disponíveis, menos coisas existem para:

```text
configurar incorretamente
ficarem vulneráveis
serem exploradas
```

Hardening não significa simplesmente:

```text
ativar todas as opções que parecem "segurança"
```

Também evitamos coisas como:

```text
bloquear todos os fragmentos
colocar firewall no máximo
desativar IPv6
ocultar SSID
```

porque podem adicionar problemas sem benefício proporcional.

O objetivo é uma rede compreensível e previsível.

---

# 31. Limitação da arquitetura atual

Mesmo endurecido, o TC7337 continua acumulando:

```text
DOCSIS
+
roteamento
+
firewall
+
DHCP
+
Wi-Fi
+
NAT
```

em um equipamento antigo fornecido pela operadora.

Existe uma evolução mais interessante:

> Separar a infraestrutura da operadora da infraestrutura da minha rede.

Isso pode ser feito em dois níveis.

---

# Upgrade futuro 1 — TC7337 em bridge + um roteador próprio

A primeira evolução mantém uma arquitetura simples.

```text
             INTERNET
                 │
                 ▼
         Rede DOCSIS Claro
                 │
                 ▼
       Technicolor TC7337
           MODO BRIDGE
                 │
                 │ Ethernet
                 ▼
          WAN DO ROTEADOR
                 │
                 ▼
          ROTEADOR PRÓPRIO
                 │
        ┌────────┼────────┐
        │        │        │
       PC     Notebook  Servidor
        │
        └──── Wi-Fi ──────┘
```

## O que acontece com o TC7337

Hoje ele executa:

```text
DOCSIS
NAT
DHCP
Firewall
Wi-Fi
Routing
```

Em bridge ele passa a fazer essencialmente:

```text
DOCSIS
   │
   ▼
Ethernet
```

Ele funciona como a ponte entre:

```text
infraestrutura da Claro
```

e:

```text
meu roteador
```

---

# 32. O que significa bridge

Bridge pode ser entendido aqui como:

```text
Claro
 │
 ▼
TC7337
 │
 │ passa a conexão
 ▼
Meu roteador
```

O TC7337 deixa de criar uma segunda rede doméstica atrás dele.

O novo roteador passa a receber a conexão WAN.

Na Claro a configuração geralmente será algo semelhante a:

```text
WAN
Type: DHCP / Dynamic IP
```

Não devemos configurar PPPoE sem uma necessidade específica da operadora.

---

# 33. Por que evitar dois roteadores

Uma alternativa ruim seria:

```text
Internet
   │
TC7337
 NAT #1
   │
192.168.0.x
   │
Novo roteador
 NAT #2
   │
192.168.1.x
```

Isso cria:

```text
Double NAT
```

Não significa necessariamente que a Internet deixa de funcionar, mas adiciona complexidade.

Pode complicar:

```text
VPN
port forwarding
jogos
P2P
acesso remoto
diagnóstico de rede
```

Com bridge:

```text
Internet
   │
TC7337 bridge
   │
Novo roteador
   │
único NAT/firewall
   │
LAN
```

fica muito mais claro.

---

# 34. Responsabilidades do novo roteador

O novo equipamento passa a controlar:

```text
NAT
Firewall
DHCP
DNS
IPv6
Wi-Fi
VPN
Port Forwarding
VLANs, se suportadas
```

Então:

```text
Claro
 │
 └── fornece conectividade

Minha infraestrutura
 │
 └── controla minha rede
```

Essa separação é a grande vantagem.

---

# 35. Exemplo de uma nova LAN

O roteador poderia criar:

```text
192.168.10.0/24
```

com:

```text
Gateway:
192.168.10.1

DHCP:
192.168.10.100
até
192.168.10.200
```

E reservar endereços para infraestrutura:

```text
192.168.10.10  PC

192.168.10.20  servidor

192.168.10.53  Pi-hole
```

Os números não fornecem segurança por si mesmos.

A vantagem é organização.

---

# 36. DNS nessa arquitetura

Inicialmente:

```text
Clientes
   │
   ▼
Novo roteador
   │
   ▼
DNS escolhido
```

Depois, com Pi-hole:

```text
PC ────────┐
Notebook ──┤
Celular ───┤
TV ────────┤
           ▼
        Pi-hole
           │
           │ DNS criptografado
           ▼
         Quad9
```

O DHCP do roteador pode informar aos clientes:

```text
DNS = endereço do Pi-hole
```

---

# 37. VPN nessa arquitetura

Também podemos colocar WireGuard no roteador.

Então:

```text
Celular fora de casa
        │
        │ 4G/5G
        ▼
      Internet
        │
        │ WireGuard 🔒
        ▼
   Roteador de casa
        │
        ├── servidor
        ├── Pi-hole
        └── demais serviços internos
```

Isso é muito melhor do que simplesmente expor:

```text
SSH
banco
interfaces administrativas
```

diretamente para a Internet.

---

# 38. CGNAT continua sendo relevante

Colocar o modem em bridge **não remove CGNAT da operadora**.

Podemos ter:

```text
Internet
   │
CGNAT da Claro
   │
nosso roteador
```

Se futuramente quisermos hospedar WireGuard diretamente, devemos verificar:

```text
IP WAN do roteador
```

versus:

```text
IP público observado na Internet
```

Se forem incompatíveis com uma conexão IPv4 pública direta, pode existir CGNAT.

Nesse cenário podemos estudar:

```text
IPv6
Tailscale
ZeroTier
VPS
solicitação de IP público
```

---

# 39. Upgrade futuro 2 — Gateway + switch gerenciável + access point

A segunda evolução separa ainda mais as responsabilidades.

Em vez de:

```text
uma caixa fazendo tudo
```

teríamos:

```text
               INTERNET
                   │
                   ▼
             Claro / DOCSIS
                   │
                   ▼
            TC7337 BRIDGE
                   │
                   ▼
               GATEWAY
                   │
             Firewall/Router
                   │
                   ▼
          SWITCH GERENCIÁVEL
             /      │       \
            /       │        \
          PC     Servidor     AP
                             / | \
                            /  |  \
                        Trusted IoT Guest
```

Isso se aproxima muito mais da arquitetura encontrada em redes profissionais.

---

# 40. Equipamento 1 — Gateway

O gateway fica responsável principalmente por:

```text
roteamento
firewall
NAT
DHCP
VPN
VLANs
regras entre redes
```

Por exemplo:

```text
Internet
   │
   ▼
Gateway
   │
   ├── VLAN 10
   ├── VLAN 20
   ├── VLAN 30
   └── VLAN 40
```

O gateway decide quem pode conversar com quem.

---

# 41. Equipamento 2 — Switch gerenciável

O switch não substitui o roteador.

Sua função principal é interligar os dispositivos da LAN.

Um switch gerenciável também entende VLANs.

Podemos ter:

```text
                 SWITCH
              /     |      \
             /      |       \
           PC     Server     AP
```

mas cada porta pode pertencer a uma rede diferente.

---

# 42. VLAN

VLAN significa:

```text
Virtual LAN
```

Ela permite criar várias redes logicamente separadas utilizando a mesma infraestrutura física.

Por exemplo:

```text
VLAN 10 — TRUSTED
192.168.10.0/24

PC
Notebook
Celular
```

```text
VLAN 20 — SERVERS
192.168.20.0/24

Pi-hole
Docker
NAS
Homelab
```

```text
VLAN 30 — IOT
192.168.30.0/24

TV
lâmpadas
IoT
```

```text
VLAN 40 — GUEST
192.168.40.0/24

Visitantes
```

Fisicamente:

```text
todo mundo usa os mesmos equipamentos
```

logicamente:

```text
são redes diferentes
```

---

# 43. Trunk

Um único cabo pode transportar várias VLANs.

Por exemplo:

```text
Gateway
   │
   │ VLAN 10
   │ VLAN 20
   │ VLAN 30
   │ VLAN 40
   ▼
Switch
```

Esse link é normalmente chamado de:

```text
trunk
```

Os frames possuem identificação indicando a qual VLAN pertencem.

---

# 44. Portas Access

Uma porta destinada a um computador comum pode ser:

```text
Switch
  │
  │ Access VLAN 10
  ▼
 PC
```

O computador nem precisa saber que VLAN existe.

Para ele:

```text
"estou conectado numa Ethernet normal"
```

O switch cuida da associação.

---

# 45. Access Point separado

O terceiro equipamento seria o Access Point.

Ele cuida especificamente do Wi-Fi.

Exemplo:

```text
            Access Point
             /    |    \
            /     |     \
       Casa     IoT    Guest
       VLAN10  VLAN30  VLAN40
```

Então podemos mapear:

```text
SSID "Casa"
   ↓
VLAN 10
```

```text
SSID "IoT"
   ↓
VLAN 30
```

```text
SSID "Guest"
   ↓
VLAN 40
```

Agora SSIDs diferentes representam **redes realmente diferentes**, não apenas nomes diferentes para a mesma LAN.

---

# 46. Regras de firewall entre VLANs

Criar VLAN sem definir regras entre elas resolve apenas parte do problema.

É o firewall no gateway que determina o isolamento.

Um exemplo:

```text
TRUSTED → Internet     ✅
TRUSTED → Servers      ✅
TRUSTED → IoT          ✅

Servers → Internet     ✅
Servers → Trusted      ❌

IoT → Internet         ✅
IoT → Trusted          ❌
IoT → Servers          ❌

Guest → Internet       ✅
Guest → Trusted        ❌
Guest → Servers        ❌
Guest → IoT            ❌
```

Isso permite, por exemplo:

```text
Meu celular
    │
    ▼
TV
```

quando explicitamente desejado, sem permitir que:

```text
TV comprometida
    │
    X
    ▼
PC
```

tenha acesso irrestrito à rede principal.

---

# 47. Por que separar gateway, switch e access point

Na arquitetura doméstica:

```text
┌─────────────────────┐
│ Roteador doméstico  │
│                     │
│ Router              │
│ Firewall            │
│ Switch              │
│ Access Point        │
│ DHCP                │
│ VPN                 │
└─────────────────────┘
```

tudo está dentro da mesma caixa.

Na arquitetura separada:

```text
Gateway
  │
  └── roteamento/firewall

Switch
  │
  └── Ethernet/VLAN

Access Point
  │
  └── Wi-Fi
```

Cada equipamento possui uma responsabilidade mais específica.

---

# 48. Vantagem para manutenção

Se futuramente o padrão Wi-Fi mudar:

```text
Wi-Fi 6
   ↓
Wi-Fi 7
   ↓
Wi-Fi futuro
```

não precisamos necessariamente substituir:

```text
firewall
switch
roteador
```

Podemos trocar somente:

```text
Access Point
```

Da mesma forma, se precisarmos de mais portas:

```text
troca/adiciona switch
```

sem mexer no Wi-Fi.

Essa separação facilita crescimento e manutenção.

---

# 49. Vantagem para aprendizado

Essa segunda arquitetura também força o entendimento real de:

```text
Layer 2
Layer 3
VLAN
802.1Q
trunk
access port
DHCP
DNS
routing
firewall
NAT
VPN
Wi-Fi
```

É muito próxima dos conceitos encontrados em infraestrutura empresarial.

Por isso ela é particularmente interessante como homelab.

---

# 50. Omada Controller

Utilizando equipamentos Omada, existe também a possibilidade de gerenciamento centralizado.

Não é obrigatório comprar outro equipamento físico para isso.

O controller pode futuramente ser executado no próprio homelab:

```text
Servidor
   │
   ▼
Omada Software Controller
   │
   ├── Gateway
   ├── Switch
   └── Access Point
```

Assim não precisamos necessariamente adicionar um quarto appliance somente para gerenciamento.

---

# 51. Comparação das duas evoluções

## Opção 1 — Simples

```text
Claro
 │
 ▼
TC7337
bridge
 │
 ▼
Roteador próprio
 │
 ├── Firewall
 ├── DHCP
 ├── DNS
 ├── VPN
 ├── Wi-Fi
 └── LAN
```

Vantagens:

```text
mais barato
menos equipamentos
menos cabos
configuração mais simples
grande evolução sobre o TC7337 sozinho
```

É uma excelente arquitetura residencial.

---

## Opção 2 — Homelab / arquitetura modular

```text
Claro
 │
 ▼
TC7337
bridge
 │
 ▼
Gateway
 │
 ▼
Switch gerenciável
 │
 ├── PC
 ├── Servidor
 │
 └── Access Point
       │
       ├── Trusted
       ├── IoT
       └── Guest
```

Vantagens:

```text
segmentação real
VLANs
controle fino de firewall
equipamentos especializados
expansão fácil
melhor laboratório de redes
arquitetura próxima de ambiente profissional
```

---

# 52. Equipamentos sugeridos e preços

Preços encontrados em **29/08/2026** e sujeitos a variação.

## Opção 1 — TC7337 bridge + roteador único

**GL.iNet Flint 2 (GL-MT6000) — aproximadamente R$ 882,86.** ([Pricearchive.org][1])

### [GL.iNet GL-MT6000 Flint 2]()

*R$882.86*

Arquitetura:

```text
Claro
 │
 ▼
TC7337
bridge
 │
 ▼
GL.iNet Flint 2
 │
 ├── PC
 ├── Notebook
 ├── Celular
 └── Homelab
```

---

## Opção 2 — Gateway + switch + access point

**TP-Link Omada ER605 — aproximadamente R$ 459,99.** ([Leroy Merlin][2])

**TP-Link Omada TL-SG2008 — aproximadamente R$ 617,42.**

**TP-Link Omada EAP610 — aproximadamente R$ 787,64.**

### [TP-Link Omada ER605]()

*R$459.99*

### [TP-Link Omada TL-SG2008]()

*R$617.42 now*

### [TP-Link Omada EAP610]()

*R$787.64 now*

Arquitetura:

```text
                    INTERNET
                        │
                        ▼
                 Claro / DOCSIS
                        │
                        ▼
                   TC7337
                    BRIDGE
                        │
                        ▼
                     ER605
                 Gateway/Firewall
                        │
                        ▼
                   TL-SG2008
                Switch gerenciável
                   /     │      \
                  /      │       \
                PC    Servidor   EAP610
                                 │
                          ┌──────┼──────┐
                          │      │      │
                       Trusted  IoT   Guest
```

---

# 53. Caminho de evolução

A rede pode evoluir gradualmente:

```text
ETAPA ATUAL
────────────────────────
TC7337
├── firewall endurecido
├── Wi-Fi configurado
├── WPS desligado
├── UPnP desligado
└── DNS seguro nos clientes


ETAPA 2
────────────────────────
TC7337 bridge
       │
       ▼
Roteador próprio


ETAPA 3
────────────────────────
VLAN Trusted
VLAN Servers
VLAN IoT
VLAN Guest


ETAPA 4
────────────────────────
Pi-hole
DNS centralizado
DoT/DoH


ETAPA 5
────────────────────────
WireGuard
acesso remoto seguro


ETAPA 6
────────────────────────
Gateway
   │
Switch gerenciável
   │
Access Point
   │
VLANs / SSIDs


ETAPA 7
────────────────────────
Syslog
monitoramento
observabilidade
homelab
```

A ideia mais importante por trás dessa evolução é deixar de enxergar a rede doméstica simplesmente como:

```text
"um Wi-Fi que fornece Internet"
```

e começar a enxergá-la como uma pequena infraestrutura composta por:

```text
WAN
LAN
roteamento
firewall
segmentação
DNS
DHCP
Wi-Fi
VPN
serviços
monitoramento
```

A primeira arquitetura mantém tudo simples e centralizado em um roteador próprio. A segunda separa as responsabilidades e transforma a rede em um laboratório muito mais próximo da forma como infraestrutura de redes é organizada profissionalmente.

[1]: https://pt.pricearchive.org/aliexpress.com/item/1005008647253445?utm_source=chatgpt.com "Roteador doméstico e de escritório GL.iNet Flint 2 (GL-MT6000), tecnologia Wi-Fi 6"
[2]: https://www.leroymerlin.com.br/roteador-omada-multi-wan-vpn-gigabit-er605-tp-link_1571911404?utm_source=chatgpt.com "Roteador Omada Multi-wan Vpn Gigabit Er605 Tp-link | Leroy Merlin"
