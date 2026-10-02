---
title: "Tmux — atalhos, sessões e persistência"
description: "Guia prático de tmux com comandos, atalhos para sessões, janelas e painéis e persistência com TPM, Resurrect e Continuum."
category: "Ferramentas"
tags: [tmux, terminal, atalhos, sessoes, produtividade]
---
# Tmux — atalhos, sessões e persistência

> `<prefixo>` = `Ctrl+b`

O tmux mantém vários terminais organizados dentro de um único terminal. Sua estrutura tem três níveis:

```text
Sessão
└── Janela
    ├── Painel
    └── Painel
```

- **Sessão**: o ambiente de trabalho completo, que pode continuar ativo depois que o terminal é fechado.
- **Janela**: funciona como uma aba dentro da sessão.
- **Painel**: uma divisão da janela atual.

> [!tip] Como digitar os atalhos
> Pressione `Ctrl+b`, solte as teclas e depois pressione a próxima tecla. Por exemplo, para criar uma janela, use `Ctrl+b`, solte e pressione `c`.

## Instalação no Fedora

```bash
sudo dnf install tmux git
```

Confira as versões instaladas:

```bash
tmux -V
git --version
```

## Sessões

### Comandos principais

| Comando | Ação |
| --- | --- |
| `tmux` | Criar uma sessão sem nome definido. |
| `tmux new -s estudos` | Criar e entrar na sessão `estudos`. |
| `tmux new-session -d -s estudos` | Criar a sessão `estudos` sem entrar nela. |
| `tmux ls` | Listar as sessões existentes. |
| `tmux attach -t estudos` | Entrar novamente na sessão `estudos`. |
| `tmux switch-client -t estudos` | Trocar para `estudos` estando dentro do tmux. |
| `tmux rename-session -t estudos dev` | Renomear a sessão `estudos` para `dev`. |
| `tmux kill-session -t estudos` | Encerrar somente a sessão `estudos`. |
| `tmux kill-server` | Encerrar o servidor e todas as sessões. |

Também é possível abreviar alguns comandos:

```bash
tmux new -s estudos
tmux ls
tmux a -t estudos
```

### Atalhos de sessão

| Atalho | Ação |
| --- | --- |
| `<prefixo> d` | Desanexar da sessão sem encerrá-la. |
| `<prefixo> s` | Listar e escolher uma sessão. |
| `<prefixo> $` | Renomear a sessão atual. |
| `<prefixo> (` | Ir para a sessão anterior. |
| `<prefixo> )` | Ir para a próxima sessão. |

Para sair e deixar os programas funcionando, use `<prefixo> d`. O terminal volta ao shell normal, mas a sessão permanece ativa. Depois, entre novamente com:

```bash
tmux attach -t estudos
```

> [!warning] `exit` e desanexar não são a mesma coisa
> O comando `exit` fecha o shell atual. Se ele for o último painel da última janela, a sessão termina. Use `<prefixo> d` quando quiser sair do tmux e manter a sessão ativa.

## Janelas

| Atalho | Ação |
| --- | --- |
| `<prefixo> c` | Criar uma janela. |
| `<prefixo> ,` | Renomear a janela atual. |
| `<prefixo> w` | Listar e escolher janelas. |
| `<prefixo> n` | Ir para a próxima janela. |
| `<prefixo> p` | Ir para a janela anterior. |
| `<prefixo> 0` até `9` | Ir para a janela indicada. |
| `<prefixo> l` | Voltar para a última janela usada. |
| `<prefixo> &` | Fechar a janela atual após confirmação. |

Uma janela também pode ser criada por comando:

```bash
tmux new-window -t estudos -n servidor
```

Isso cria, na sessão `estudos`, uma janela chamada `servidor`.

## Painéis

| Atalho | Ação |
| --- | --- |
| `<prefixo> %` | Dividir a janela verticalmente, criando painéis lado a lado. |
| `<prefixo> "` | Dividir a janela horizontalmente, criando um painel em cima e outro embaixo. |
| `<prefixo> ←/↓/↑/→` | Mover o foco entre os painéis. |
| `<prefixo> o` | Ir para o próximo painel. |
| `<prefixo> q` | Mostrar o número de cada painel. |
| `<prefixo> z` | Maximizar ou restaurar o painel atual. |
| `<prefixo> x` | Fechar o painel atual após confirmação. |
| `<prefixo> {` | Mover o painel atual para a esquerda. |
| `<prefixo> }` | Mover o painel atual para a direita. |
| `<prefixo> Space` | Alternar entre layouts prontos. |

Para redimensionar um painel, pressione o prefixo e segure `Ctrl` enquanto usa uma seta:

```text
Ctrl+b → Ctrl+←/↓/↑/→
```

O comportamento exato do redimensionamento pode variar de acordo com a versão do tmux e os mapeamentos da configuração.

## Modo de cópia e rolagem

| Atalho | Ação |
| --- | --- |
| `<prefixo> [` | Entrar no modo de cópia e rolagem. |
| `↑` / `↓` ou `Page Up` / `Page Down` | Navegar pelo histórico no modo de cópia. |
| `q` | Sair do modo de cópia. |
| `<prefixo> ]` | Colar o texto copiado pelo tmux. |

As teclas de seleção dependem do modo configurado. Consulte os atalhos ativos com:

```bash
tmux list-keys -T copy-mode
tmux list-keys -T copy-mode-vi
```

No modo `vi`, `Space` inicia a seleção e `Enter` copia o trecho. No modo `emacs`, os atalhos correspondentes podem ser diferentes.

## Linha de comandos do tmux

Use `<prefixo> :` para abrir a linha de comandos. Exemplos:

```tmux
new-window -n logs
split-window -h
rename-session dev
source-file ~/.tmux.conf
```

O último comando recarrega a configuração sem precisar encerrar as sessões:

```text
Ctrl+b → :
source-file ~/.tmux.conf
Enter
```

Também é possível recarregar pelo shell:

```bash
tmux source-file ~/.tmux.conf
```

## Fluxo prático

Crie uma sessão nomeada para um projeto:

```bash
tmux new -s meu-projeto
```

Dentro dela:

```text
Ctrl+b → c       cria outra janela
Ctrl+b → ,       dá um nome para a janela
Ctrl+b → %       cria um painel ao lado
Ctrl+b → "       cria um painel abaixo
Ctrl+b → d       sai e mantém a sessão ativa
```

Para voltar mais tarde:

```bash
tmux attach -t meu-projeto
```

Se existir apenas uma sessão disponível, basta executar:

```bash
tmux attach
```

## O que o tmux mantém

Enquanto o servidor tmux continua rodando, os programas dentro das sessões permanecem ativos mesmo que você feche o terminal ou desanexe da sessão.

Depois que o servidor tmux é encerrado ou o computador é reiniciado, as sessões deixam de existir na memória. Para reconstruí-las, use os plugins `tmux-resurrect` e `tmux-continuum`.

| Item | Pode ser restaurado pelos plugins? |
| --- | --- |
| Diretórios de trabalho | Sim. |
| Janelas e painéis | Sim. |
| Nomes e layout | Sim. |
| Alguns comandos em execução | Podem ser reiniciados. |
| Conexão SSH ativa | Não. É necessário conectar novamente. |
| Variáveis de um REPL Python | Não. |
| Estado em memória de um processo Node.js | Não. |

Os plugins restauram a estrutura do ambiente e reiniciam comandos compatíveis. Eles não salvam o conteúdo da memória RAM dos programas.

## Persistência das sessões com plugins

O TPM é o gerenciador de plugins do tmux. O `tmux-resurrect` salva e restaura sessões, enquanto o `tmux-continuum` faz salvamentos periódicos e solicita a restauração quando o tmux inicia.

### 1. Instalar o TPM

```bash
git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm
```

### 2. Instalar os plugins configurados

Depois de criar o arquivo `~/.tmux.conf` com a configuração da próxima seção, inicie o tmux:

```bash
tmux
```

Dentro do tmux, instale os plugins:

```text
Ctrl+b → I
```

Use `I` maiúsculo. O TPM exibirá o andamento da instalação.

Confira os diretórios criados:

```bash
ls ~/.tmux/plugins
```

O resultado deve incluir:

```text
tmux-continuum
tmux-resurrect
tpm
```

### 3. Salvar e restaurar manualmente

| Atalho | Ação |
| --- | --- |
| `<prefixo> Ctrl+s` | Salvar as sessões com o Resurrect. |
| `<prefixo> Ctrl+r` | Restaurar o último estado salvo. |

Para testar:

1. Crie algumas janelas e painéis.
2. Use `<prefixo> Ctrl+s` para salvar.
3. Execute `tmux kill-server` fora do tmux ou a partir de outro terminal.
4. Inicie novamente com `tmux`.
5. Se a restauração automática ainda não ocorreu, use `<prefixo> Ctrl+r`.

> [!note] Persistência automática
> Com o Continuum configurado abaixo, o estado é salvo a cada 15 minutos. Quando um novo servidor tmux inicia e carrega a configuração, o plugin tenta restaurar o último estado salvo. Isso não inicia o tmux sozinho durante o boot do Fedora; a restauração acontece quando você executa `tmux` após entrar no sistema.

## Configuração completa dos plugins

Abra o arquivo:

```bash
nvim ~/.tmux.conf
```

Coloque esta configuração no final do arquivo. A inicialização do TPM precisa permanecer depois das declarações de plugins:

```tmux
# TPM
set -g @plugin 'tmux-plugins/tpm'

# Salvar e restaurar sessões do tmux
set -g @plugin 'tmux-plugins/tmux-resurrect'

# Salvar periodicamente e restaurar ao iniciar o tmux
set -g @plugin 'tmux-plugins/tmux-continuum'

# Salvar a cada 15 minutos
set -g @continuum-save-interval '15'

# Restaurar automaticamente quando o tmux iniciar
set -g @continuum-restore 'on'

# O TPM precisa ficar no final da configuração de plugins
run '~/.tmux/plugins/tpm/tpm'
```
