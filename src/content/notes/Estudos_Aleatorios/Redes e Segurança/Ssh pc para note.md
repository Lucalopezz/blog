---
title: "SSH seguro entre PC e notebook Fedora na rede local"
description: "Configuração de SSH por chave entre dois computadores Fedora na rede local."
category: "Redes e Segurança"
tags: [ssh, fedora, redes, seguranca]
---
````markdown
---
tags:
  - linux
  - fedora
  - ssh
  - redes
  - segurança
  - homelab
---

# SSH seguro entre PC e Notebook Fedora na rede local

## Objetivo

Configurar SSH nos dois sentidos:

```text
PC Fedora                         Notebook Fedora
192.168.0.2  ←────── SSH ──────→ 192.168.0.3
````

Requisitos definidos:

* SSH funcionando nos dois sentidos;
* acesso permitido somente pela rede local `192.168.0.0/24`;
* sem exposição da porta 22 diretamente para a Internet;
* autenticação por chave SSH;
* autenticação por senha desativada;
* login SSH como `root` desativado;
* IPs fixos dentro da rede doméstica;
* aliases:

  * PC → `ssh note`
  * Notebook → `ssh pc`
* futuramente o acesso externo poderá ser feito com Tailscale.

---

# 1. Estado inicial da rede

## PC

Interface:

```text
enp8s0
```

IP inicial via DHCP:

```text
192.168.0.10/24
```

MAC:

```text
f4:b5:20:64:42:45
```

## Notebook

Interface Wi-Fi:

```text
wlp0s20f3
```

IP inicial via DHCP:

```text
192.168.0.18/24
```

Posteriormente, após alterar o MAC utilizado pelo Wi-Fi:

```text
192.168.0.20/24
```

MAC físico da placa:

```text
5c:87:9c:8a:2d:ed
```

A rede doméstica é:

```text
192.168.0.0/24
```

Gateway:

```text
192.168.0.1
```

---

# 2. Verificando o servidor SSH

Nos dois computadores foi verificado o estado do `sshd`:

```bash
systemctl status sshd --no-pager
```

Inicialmente estava:

```text
inactive (dead)
disabled
```

Também verificamos se havia algo escutando na porta 22:

```bash
sudo ss -lntp | grep ':22 ' || echo "porta 22 não está escutando"
```

## Lógica

O pacote `openssh-server` estar instalado não significa que o computador está aceitando SSH.

Para aceitar conexões são necessárias três coisas:

```text
openssh-server instalado
        +
sshd em execução
        +
firewall permitindo a conexão
```

---

# 3. Firewall: permitir SSH apenas dentro da LAN

Não quisemos simplesmente liberar:

```bash
firewall-cmd --add-service=ssh
```

porque isso libera SSH para qualquer origem que consiga chegar naquela interface.

Em vez disso, foi utilizada uma **rich rule** permitindo SSH somente para:

```text
192.168.0.0/24
```

Ou seja:

```text
192.168.0.1
192.168.0.2
192.168.0.3
...
192.168.0.254
```

são considerados parte da LAN.

---

## PC

A interface Ethernet estava na zona:

```text
public
```

Primeiro removemos uma eventual liberação genérica de SSH:

```bash
sudo firewall-cmd \
  --zone=public \
  --remove-service=ssh \
  --permanent
```

Depois adicionamos a regra restrita à LAN:

```bash
sudo firewall-cmd \
  --zone=public \
  --permanent \
  --add-rich-rule='rule family="ipv4" source address="192.168.0.0/24" service name="ssh" accept'
```

Aplicar:

```bash
sudo firewall-cmd --reload
```

Verificar:

```bash
sudo firewall-cmd --zone=public --list-all
```

O importante é encontrar algo como:

```text
rich rules:
    rule family="ipv4" source address="192.168.0.0/24" service name="ssh" accept
```

---

## Notebook

O notebook já tinha uma zona customizada:

```text
home-secure
```

associada à interface:

```text
wlp0s20f3
```

Adicionamos:

```bash
sudo firewall-cmd \
  --zone=home-secure \
  --permanent \
  --add-rich-rule='rule family="ipv4" source address="192.168.0.0/24" service name="ssh" accept'
```

Aplicar:

```bash
sudo firewall-cmd --reload
```

Verificar:

```bash
sudo firewall-cmd --zone=home-secure --list-all
```

---

## Por que isso protege o SSH?

O `sshd` pode estar escutando:

```text
0.0.0.0:22
```

mas isso não significa automaticamente que qualquer dispositivo consegue acessá-lo.

Temos duas camadas:

```text
sshd
  ↓
escuta porta 22
  ↓
firewalld
  ↓
aceita apenas origem 192.168.0.0/24
```

Assim o serviço continua disponível dentro de casa, mas não está genericamente liberado em outras redes.

---

# 4. Ativando o servidor SSH

Nos dois computadores:

```bash
sudo systemctl enable --now sshd
```

Esse comando faz duas coisas:

```text
enable → inicia automaticamente no boot
--now  → inicia imediatamente
```

Verificação:

```bash
systemctl status sshd --no-pager
```

Esperado:

```text
Active: active (running)
```

E:

```bash
sudo ss -lntp | grep ':22 '
```

---

# 5. Teste inicial usando IP

Antes de configurar aliases, testamos diretamente pelos IPs.

Do PC para o notebook:

```bash
ssh lucaslopes@192.168.0.18
```

Posteriormente o IP do notebook foi alterado.

Do notebook para o PC:

```bash
ssh lucaslopes@192.168.0.10
```

Na primeira conexão aparece algo semelhante a:

```text
The authenticity of host ... can't be established.
Are you sure you want to continue connecting?
```

Após conferir que estamos acessando a máquina correta:

```text
yes
```

A chave pública do host é então armazenada em:

```text
~/.ssh/known_hosts
```

---

# 6. Autenticação usando chave SSH

O objetivo é não depender da senha do usuário para SSH.

No PC já existia:

```text
~/.ssh/id_ed25519
~/.ssh/id_ed25519.pub
```

A chave privada:

```text
id_ed25519
```

**nunca deve ser enviada para outro computador**.

A chave pública:

```text
id_ed25519.pub
```

é a que pode ser instalada no servidor remoto.

---

## Copiando a chave

Exemplo PC → Notebook:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub lucaslopes@IP_DO_NOTEBOOK
```

No outro sentido:

```bash
ssh-copy-id -i ~/.ssh/id_ed25519.pub lucaslopes@IP_DO_PC
```

O `ssh-copy-id` adiciona a chave pública em:

```text
~/.ssh/authorized_keys
```

na máquina remota.

---

## Testando

PC → notebook:

```bash
ssh lucaslopes@IP_DO_NOTEBOOK
```

Notebook → PC:

```bash
ssh lucaslopes@IP_DO_PC
```

Depois que ambos funcionaram por chave, foi possível desativar autenticação por senha.

> [!IMPORTANT]
> Nunca desabilitar senha antes de confirmar que o login por chave funciona.
>
> Caso contrário, é fácil se bloquear para fora do servidor SSH.

---

# 7. Endurecendo a configuração do SSH

Em vez de alterar diretamente:

```text
/etc/ssh/sshd_config
```

foi utilizado um arquivo separado:

```text
/etc/ssh/sshd_config.d/10-local-secure.conf
```

Criar:

```bash
sudo nano /etc/ssh/sshd_config.d/10-local-secure.conf
```

Conteúdo:

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
```

## Significado

### Bloquear SSH como root

```text
PermitRootLogin no
```

Mesmo que alguém possua credenciais de `root`, não pode fazer login SSH diretamente como ele.

Quando necessário:

```bash
sudo comando
```

é utilizado depois do login com usuário normal.

---

### Permitir autenticação por chave

```text
PubkeyAuthentication yes
```

Permite autenticação usando:

```text
chave privada → cliente
chave pública → servidor
```

---

### Desabilitar senha

```text
PasswordAuthentication no
```

Impede login usando a senha normal da conta.

---

### Desabilitar keyboard-interactive

```text
KbdInteractiveAuthentication no
```

Evita outro mecanismo interativo que poderia permitir autenticação semelhante a senha dependendo da configuração do sistema.

---

# 8. Validar antes de aplicar

Antes de recarregar o SSH:

```bash
sudo sshd -t
```

Se o comando não retornar nada:

```text
configuração válida
```

Se houver algum erro, ele será mostrado.

Só então:

```bash
sudo systemctl reload sshd
```

Foi utilizado `reload` porque não é necessário derrubar completamente o serviço para aplicar essas alterações.

---

# 9. Problema com IPs dinâmicos

Inicialmente tínhamos:

```text
PC       → 192.168.0.10
Notebook → 192.168.0.18
```

Esses endereços eram entregues por DHCP.

O problema é que:

```text
IP DHCP ≠ garantia de IP permanente
```

O roteador pode entregar outro IP posteriormente.

Isso quebraria uma configuração como:

```text
ssh note
```

caso `note` estivesse apontando para um endereço antigo.

---

# 10. Tentativa de usar DHCP Reservation

A primeira ideia foi criar no roteador:

```text
MAC → IP reservado
```

Por exemplo:

```text
f4:b5:20:64:42:45 → 192.168.0.10
5c:87:9c:8a:2d:ed → 192.168.0.18
```

Porém o painel fornecido pelo roteador da Claro não apresentava uma opção de:

```text
DHCP Reservation
Static Lease
IP/MAC Binding
```

A página de DHCP permitia apenas configurar coisas como:

```text
início do DHCP
quantidade de clientes
tempo de lease
```

---

# 11. Descobrindo o pool DHCP

O roteador estava configurado com:

```text
Gateway:       192.168.0.1
Início DHCP:   192.168.0.10
```

Portanto:

```text
192.168.0.2
até
192.168.0.9
```

estão fora do pool dinâmico.

Isso torna esses endereços bons candidatos para IPs estáticos.

Escolhemos:

```text
192.168.0.1 → roteador
192.168.0.2 → PC
192.168.0.3 → notebook

192.168.0.10+ → DHCP
```

---

# 12. Verificando se os IPs estavam livres

Antes de configurar `.2` e `.3`, usamos ARP Duplicate Address Detection:

```bash
sudo arping -D -I enp8s0 -c 3 192.168.0.2
sudo arping -D -I enp8s0 -c 3 192.168.0.3
```

Resultado:

```text
Recebida(s) 0 resposta(s)
```

Isso indicou que nenhum dispositivo respondeu como proprietário desses endereços naquele momento.

## Por que `arping`?

Um simples:

```bash
ping 192.168.0.2
```

não é uma garantia suficiente.

Um dispositivo pode estar usando o IP e simplesmente ignorar ICMP.

O ARP atua diretamente dentro da LAN e é mais apropriado para detectar conflito de IPv4 local.

---

# 13. MAC aleatório do notebook

Foi identificado um detalhe importante no notebook.

O comando:

```bash
ip link show wlp0s20f3
```

mostrou:

```text
link/ether de:dd:c3:4f:38:30
permaddr 5c:87:9c:8a:2d:ed
```

Portanto:

```text
de:dd:c3:4f:38:30
```

era o MAC utilizado naquele momento, enquanto:

```text
5c:87:9c:8a:2d:ed
```

era o MAC físico permanente da placa.

---

# 14. Utilizando o MAC permanente nas redes de casa

Nos perfis Wi-Fi domésticos:

```text
fedora_5.0
fedora_2.4
```

foi configurado:

```bash
sudo nmcli connection modify "fedora_5.0" \
  802-11-wireless.cloned-mac-address permanent
```

E:

```bash
sudo nmcli connection modify "fedora_2.4" \
  802-11-wireless.cloned-mac-address permanent
```

Reconectamos:

```bash
nmcli connection down "fedora_5.0"
nmcli connection up "fedora_5.0"
```

Depois:

```bash
cat /sys/class/net/wlp0s20f3/address
```

passou a retornar:

```text
5c:87:9c:8a:2d:ed
```

## Lógica

A alteração foi feita somente nos perfis Wi-Fi de casa.

Isso permite ter:

```text
rede doméstica → MAC físico permanente
outras redes   → comportamento padrão do NetworkManager
```

---

# 15. IP estático do PC

Perfil:

```text
Conexão cabeada 1
```

Antes:

```text
ipv4.method: auto
```

Configuramos:

```bash
sudo nmcli connection modify "Conexão cabeada 1" \
  ipv4.method manual \
  ipv4.addresses 192.168.0.2/24 \
  ipv4.gateway 192.168.0.1
```

Aplicamos:

```bash
sudo nmcli connection down "Conexão cabeada 1"
sudo nmcli connection up "Conexão cabeada 1"
```

---

# 16. IP estático do notebook

Para o perfil de 5 GHz:

```bash
sudo nmcli connection modify "fedora_5.0" \
  ipv4.method manual \
  ipv4.addresses 192.168.0.3/24 \
  ipv4.gateway 192.168.0.1
```

Aplicar:

```bash
sudo nmcli connection down "fedora_5.0"
sudo nmcli connection up "fedora_5.0"
```

Para deixar o mesmo IP quando estiver no Wi-Fi 2.4 GHz de casa:

```bash
sudo nmcli connection modify "fedora_2.4" \
  ipv4.method manual \
  ipv4.addresses 192.168.0.3/24 \
  ipv4.gateway 192.168.0.1
```

Não existe conflito porque o notebook não estará conectado simultaneamente aos dois perfis pela mesma interface Wi-Fi.

---

# 17. DNS não foi alterado

Já existia uma configuração manual de Quad9.

Exemplo:

```text
9.9.9.9#dns.quad9.net
149.112.112.112#dns.quad9.net
```

E:

```text
ipv4.ignore-auto-dns: yes
```

Ao transformar o IP em manual, alteramos somente:

```text
ipv4.method
ipv4.addresses
ipv4.gateway
```

Não redefinimos:

```text
ipv4.dns
```

Assim a configuração de DNS anterior foi preservada.

---

# 18. Testando a rede após configurar IP estático

## Ver IP

PC:

```bash
ip -br addr show enp8s0
```

Esperado:

```text
192.168.0.2/24
```

Notebook:

```bash
ip -br addr show wlp0s20f3
```

Esperado:

```text
192.168.0.3/24
```

---

## Ver rota

```bash
ip route
```

Deve existir algo equivalente a:

```text
default via 192.168.0.1
```

---

## Testar roteador

```bash
ping -c 3 192.168.0.1
```

---

## Testar Internet sem depender de DNS

```bash
ping -c 3 9.9.9.9
```

Se funcionar:

```text
roteamento para Internet está funcionando
```

---

## Testar DNS

```bash
ping -c 3 google.com
```

Se `9.9.9.9` funciona mas `google.com` não:

```text
problema provavelmente está no DNS
```

---

# 19. Topologia final

```text
                        Internet
                           │
                           │
                    ┌─────────────┐
                    │   Roteador  │
                    │ 192.168.0.1 │
                    └──────┬──────┘
                           │
             LAN 192.168.0.0/24
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌───────────┐             ┌───────────┐
        │    PC     │             │ Notebook  │
        │192.168.0.2│ ←── SSH ──→ │192.168.0.3│
        └───────────┘             └───────────┘
              │                         │
         Ethernet                    Wi-Fi
```

O DHCP do roteador continua atendendo os outros dispositivos:

```text
192.168.0.10+
```

---

# 20. Criando os aliases SSH

Agora que os IPs são previsíveis, podemos criar nomes simples.

---

## PC → Notebook

No PC:

```bash
nano ~/.ssh/config
```

Adicionar:

```sshconfig
Host note
    HostName 192.168.0.3
    User lucaslopes
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Corrigir permissões:

```bash
chmod 600 ~/.ssh/config
```

Agora:

```bash
ssh note
```

é equivalente a:

```bash
ssh -i ~/.ssh/id_ed25519 lucaslopes@192.168.0.3
```

---

## Notebook → PC

No notebook:

```bash
nano ~/.ssh/config
```

Adicionar:

```sshconfig
Host pc
    HostName 192.168.0.2
    User lucaslopes
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Permissões:

```bash
chmod 600 ~/.ssh/config
```

Agora:

```bash
ssh pc
```

é equivalente a:

```bash
ssh -i ~/.ssh/id_ed25519 lucaslopes@192.168.0.2
```

---

# 21. O que `IdentitiesOnly yes` faz?

Com:

```text
IdentityFile ~/.ssh/id_ed25519
IdentitiesOnly yes
```

estamos dizendo explicitamente:

> Para esse host, tente autenticação utilizando essa identidade SSH.

Isso é útil principalmente quando existem várias chaves dentro de:

```text
~/.ssh/
```

ou várias identidades carregadas no `ssh-agent`.

---

# 22. Resultado final

No PC:

```bash
ssh note
```

leva para:

```text
192.168.0.3
```

No notebook:

```bash
ssh pc
```

leva para:

```text
192.168.0.2
```

Fluxo:

```text
PC
$ ssh note
     │
     └──────────────────────────→ Notebook


Notebook
$ ssh pc
     │
     └──────────────────────────→ PC
```

---

# 23. Segurança obtida

A configuração final possui várias camadas:

```text
1. IPs privados
        ↓
2. acesso SSH apenas na LAN 192.168.0.0/24
        ↓
3. firewalld filtrando porta 22
        ↓
4. autenticação por chave Ed25519
        ↓
5. autenticação por senha desativada
        ↓
6. login root via SSH desativado
```

Não foi configurado:

```text
Port Forwarding
DMZ
UPnP para SSH
porta 22 exposta na WAN
```

Portanto o objetivo atual é:

> SSH disponível dentro da rede doméstica, mas sem publicar diretamente o serviço SSH na Internet.

---

# 24. Comandos úteis de diagnóstico

## Ver IPs

```bash
ip -br addr
```

## Ver gateway e rotas

```bash
ip route
```

## Ver interfaces

```bash
ip link
```

## Ver conexões do NetworkManager

```bash
nmcli connection show
```

## Ver conexões ativas

```bash
nmcli connection show --active
```

## Descobrir qual perfil está associado a uma interface

Exemplo:

```bash
nmcli -g GENERAL.CONNECTION device show wlp0s20f3
```

## Ver configuração IPv4

```bash
nmcli connection show "NOME_DO_PERFIL" \
  | grep -E '^(ipv4\.method|ipv4\.addresses|ipv4\.gateway|ipv4\.dns:|ipv4\.ignore-auto-dns)'
```

## Estado do SSH

```bash
systemctl status sshd --no-pager
```

## Ver porta 22

```bash
sudo ss -lntp | grep ':22 '
```

## Validar configuração SSH

```bash
sudo sshd -t
```

## Ver firewall

```bash
sudo firewall-cmd --get-active-zones
```

```bash
sudo firewall-cmd --zone=public --list-all
```

ou no notebook:

```bash
sudo firewall-cmd --zone=home-secure --list-all
```

## Ver fingerprint de uma chave pública

```bash
ssh-keygen -lf ~/.ssh/id_ed25519.pub
```

---

# 25. Arquivos importantes

## Cliente SSH

```text
~/.ssh/config
```

Define aliases como:

```text
note
pc
```

---

## Chave privada

```text
~/.ssh/id_ed25519
```

> [!DANGER]
> Nunca compartilhar ou copiar essa chave para terceiros.

---

## Chave pública

```text
~/.ssh/id_ed25519.pub
```

Pode ser distribuída para servidores que devem aceitar essa identidade.

---

## Chaves autorizadas

Na máquina que recebe a conexão:

```text
~/.ssh/authorized_keys
```

---

## Hosts conhecidos

```text
~/.ssh/known_hosts
```

Armazena as chaves dos servidores SSH já conhecidos pelo cliente.

Ajuda a detectar situações em que um servidor anteriormente conhecido aparece posteriormente com outra chave.

---

## Configuração customizada do servidor

```text
/etc/ssh/sshd_config.d/10-local-secure.conf
```

Conteúdo:

```text
PermitRootLogin no
PubkeyAuthentication yes
PasswordAuthentication no
KbdInteractiveAuthentication no
```

---

# 26. Próximo passo: Tailscale

A configuração local deve continuar existindo mesmo quando Tailscale for instalado.

A ideia futura será ter duas redes:

```text
LAN
192.168.0.x

Tailscale
100.x.x.x
```

Em casa:

```text
PC ←→ Notebook
pela LAN
```

Fora de casa:

```text
PC ←→ Notebook
pela rede privada do Tailscale
```

Sem precisar fazer:

```text
Internet
   ↓
port forwarding :22
   ↓
PC/Notebook
```

Isso mantém o SSH sem exposição direta da porta 22 na Internet.

---

# Resumo rápido

```text
Rede:       192.168.0.0/24
Gateway:    192.168.0.1

PC:
IP:         192.168.0.2
Interface:  enp8s0
SSH alias:  note → 192.168.0.3

Notebook:
IP:         192.168.0.3
Interface:  wlp0s20f3
SSH alias:  pc → 192.168.0.2

Firewall:
SSH permitido somente de 192.168.0.0/24

Autenticação:
Ed25519 / chave pública

Senha SSH:
desabilitada

Root SSH:
desabilitado

Acesso externo:
não configurado

Próximo passo:
Tailscale
```

```

Um ponto que vale guardar conceitualmente: **IP estático, firewall e SSH resolvem problemas diferentes**. O IP estático faz as máquinas serem fáceis de encontrar; o firewall determina *quem pode chegar* ao serviço; e a autenticação por chave determina *quem pode entrar* depois que conseguiu chegar ao SSH.
```
