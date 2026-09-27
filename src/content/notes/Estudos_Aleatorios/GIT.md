---
title: "Git: modelo mental e comandos essenciais"
description: "Conceitos de repositório local, branches, remotos e comandos para trabalhar com Git."
category: "Git"
tags: [git, versionamento, branches, remotos]
---

# 1. Primeiro: o modelo mental que evita 80% da confusão

Você normalmente tem três coisas diferentes:

```text
Seu repositório local
├── main
├── feature/login
└── feature/dashboard

Referências do remoto que seu Git conhece
├── origin/main
├── origin/feature/login
└── origin/feature/dashboard

GitHub
├── main
├── feature/login
└── feature/dashboard
```

Isso é importante porque:

```bash
main
```

é sua branch **local**.

Enquanto:

```bash
origin/main
```

não é literalmente “a branch que está no GitHub”.

É a **última informação que seu Git local possui sobre a `main` do remoto**.

Por isso existe:

```bash
git fetch
```

Ele atualiza essas referências.

---

# 2. `fetch` vs `pull`

Essa é uma das coisas mais importantes para entender.

## `git fetch`

Busca as alterações do remoto, mas **não modifica sua branch atual**.

```bash
git fetch origin
```

Exemplo:

Antes:

```text
main
A---B
     \
      origin/main
```

Alguém fez commits no GitHub:

```text
GitHub:
A---B---C---D
```

Você roda:

```bash
git fetch origin
```

Agora:

```text
main
A---B
     \
      C---D origin/main
```

Sua `main` continua onde estava.

Só `origin/main` foi atualizado.

Isso é seguro.

---

## `git pull`

O `pull` basicamente faz:

```bash
git fetch
git merge
```

Mais precisamente, por padrão algo próximo de:

```bash
git fetch origin
git merge origin/<branch>
```

Então:

```bash
git pull
```

pode alterar seu histórico imediatamente.

Por isso, quando você quer entender melhor o que está acontecendo, eu prefiro:

```bash
git fetch
git status
```

e depois decidir o que fazer.

---

# 3. Como pegar uma branch criada no remoto

Imagine que alguém criou:

```text
feature/auth
```

no GitHub.

Primeiro:

```bash
git fetch origin
```

Depois veja as branches:

```bash
git branch -a
```

Pode aparecer:

```text
* main
  feature/dashboard

  remotes/origin/main
  remotes/origin/feature/auth
  remotes/origin/feature/dashboard
```

Agora crie sua branch local baseada nela:

```bash
git switch feature/auth
```

Em versões modernas do Git, ele geralmente detecta automaticamente `origin/feature/auth`.

Se quiser fazer explicitamente:

```bash
git switch -c feature/auth --track origin/feature/auth
```

O equivalente antigo seria:

```bash
git checkout -b feature/auth origin/feature/auth
```

Eu recomendo usar `switch`.

---

# 4. `git branch`, `git switch` e `git checkout`

Historicamente o Git usava:

```bash
git checkout
```

para várias coisas.

Hoje temos comandos mais específicos:

```bash
git switch
```

para trocar de branch.

```bash
git restore
```

para restaurar arquivos.

Então prefira:

```bash
git switch main
```

em vez de:

```bash
git checkout main
```

---

# 5. Cenário: a `main` mudou e quero trazer para minha branch

Esse é provavelmente o seu cenário mais comum.

Você tem:

```text
A---B---C main
     \
      D---E---F feature
```

Depois a `main` recebe alterações:

```text
A---B---C---G---H main
     \
      D---E---F feature
```

Você quer trazer `G` e `H` para sua feature.

Existem **duas estratégias principais**:

```text
merge
rebase
```

E essa diferença é extremamente importante.

---

# 6. Opção 1 — Merge da `main` na sua branch

Entre na sua feature:

```bash
git switch feature
```

Atualize informações do remoto:

```bash
git fetch origin
```

Depois:

```bash
git merge origin/main
```

Resultado:

```text
A---B---C---G---H
     \           \
      D---E---F---M
```

`M` é um merge commit.

A vantagem é que você **não reescreve nenhum commit existente**.

É muito seguro para branches compartilhadas.

---

# 7. Opção 2 — Rebase da sua branch em cima da `main`

Você também pode fazer:

```bash
git switch feature
git fetch origin
git rebase origin/main
```

Antes:

```text
A---B---C---G---H
     \
      D---E---F
```

Depois:

```text
A---B---C---G---H---D'---E'---F'
```

O Git pega seus commits:

```text
D
E
F
```

e recria eles depois da `main`.

Visualmente fica muito mais limpo.

---

# 8. Merge vs Rebase

Uma regra prática boa:

### Merge

```bash
git merge origin/main
```

Use quando:

- branch é compartilhada;
    
- várias pessoas estão trabalhando nela;
    
- você não quer reescrever histórico;
    
- quer máxima segurança.
    

### Rebase

```bash
git rebase origin/main
```

Use quando:

- a branch é sua;
    
- você quer manter o histórico linear;
    
- quer preparar a branch antes de abrir/atualizar um PR.
    

Para feature branches pessoais, eu geralmente prefiro rebase.

---

# 9. Por que rebase pode ser perigoso

Imagine:

```text
feature
D---E---F
```

Você já deu:

```bash
git push
```

Então outra pessoa baixou esses commits.

Depois você faz:

```bash
git rebase main
```

Agora seus commits viraram:

```text
D'---E'---F'
```

Eles têm hashes diferentes.

Então o histórico remoto e o local divergem.

Você provavelmente precisará:

```bash
git push --force-with-lease
```

Nunca prefira:

```bash
git push --force
```

O `--force-with-lease` verifica se ninguém alterou a branch remotamente desde sua última sincronização.

---

# 10. Seu cenário específico

Você falou:

> fiz uma alteração na main e quero puxar ela pra minha branch que tá na frente da main

Vamos supor:

```text
main:
A---B---C---D

feature:
A---B---C---E---F
```

Você quer colocar `D` na feature.

Minha sequência seria:

```bash
git switch main

git pull --ff-only

git switch feature

git rebase main
```

Resultado:

```text
A---B---C---D---E'---F'
```

Ou, se não quiser rebase:

```bash
git switch feature
git merge main
```

---

# 11. Mas existe uma opção ainda melhor: usar `origin/main`

Você não precisa necessariamente atualizar sua `main` local.

Pode fazer:

```bash
git fetch origin
git switch feature
git rebase origin/main
```

Isso é muito útil.

Porque:

```text
origin/main
```

representa a versão atualizada da `main` no remoto depois do fetch.

Então seu fluxo fica:

```bash
git fetch origin
git rebase origin/main
```

Muito comum em branches de PR.

---

# 12. Como fazer merge de uma branch

Imagine:

```text
main
A---B---C

feature
A---B---C---D---E
```

Você quer incorporar a feature na main.

```bash
git switch main
git merge feature
```

Se não houve mudança na main:

```text
A---B---C---D---E
```

Isso é um:

```text
fast-forward
```

Nenhum merge commit foi necessário.

---

# 13. Merge commit

Agora imagine:

```text
      D---E feature
     /
A---B---C---F main
```

Rodando:

```bash
git switch main
git merge feature
```

fica:

```text
      D---E
     /     \
A---B---C---F---M
```

Aqui existe um merge commit:

```text
M
```

---

# 14. O que o GitHub faz quando você aperta Merge PR

No GitHub existem normalmente três opções:

```text
Create a merge commit
Squash and merge
Rebase and merge
```

Elas produzem históricos diferentes.

Imagine o PR:

```text
A---B main
     \
      C---D---E feature
```

### Merge commit

```text
A---B-------M
     \     /
      C---D---E
```

Mantém toda a história da branch.

### Squash and merge

```text
A---B---S
```

`C + D + E` viram um único commit:

```text
S
```

### Rebase and merge

```text
A---B---C'---D'---E'
```

Mantém os commits individuais, mas sem merge commit.

---

# 15. Para projeto de faculdade eu provavelmente usaria Squash Merge

Principalmente quando os commits dos membros são algo como:

```text
fix
fix2
agora vai
teste
arrumei
```

Com:

```text
Squash and merge
```

a `main` pode ficar:

```text
feat: add authentication
feat: add user profile
fix: validate project creation
```

Muito mais legível.

Como TL, isso facilita muito sua vida.

---

# 16. Fluxo que eu recomendaria para seu projeto

Algo próximo disso:

```text
main
 │
 ├── feature/login
 ├── feature/dashboard
 ├── fix/navbar
 └── feature/projects
```

Cada tarefa vira uma branch.

Exemplo:

```bash
git switch main

git pull --ff-only

git switch -c feature/login
```

A pessoa trabalha:

```bash
git add .
git commit -m "feat: implement login form"
git push -u origin feature/login
```

Depois abre PR.

---

# 17. Como TL, antes de mergear um PR

Suponha que você esteja revisando:

```text
feature/login
```

Você pode baixar e testar localmente:

```bash
git fetch origin
git switch feature/login
```

Ou:

```bash
git switch --track origin/feature/login
```

Depois roda aplicação/testes.

---

# 18. Atualizando uma branch de PR que ficou desatualizada

Imagine:

```text
main
A---B---C---D---E

feature
A---B---C---F---G
```

Você pode:

```bash
git fetch origin
git switch feature
git rebase origin/main
```

resolver conflitos.

Depois:

```bash
git push --force-with-lease
```

Se a branch for sua.

Se for branch de outra pessoa, eu evitaria rebase sem combinar com ela.

Nesse caso:

```bash
git merge origin/main
```

é mais conservador.

---

# 19. Conflito de merge

Você roda:

```bash
git rebase origin/main
```

Git responde:

```text
CONFLICT
```

Arquivo:

```text
<<<<<<< HEAD
codigo da main
=======
codigo da feature
>>>>>>> commit
```

Você edita manualmente:

```text
codigo final desejado
```

Depois:

```bash
git add arquivo
```

Se for rebase:

```bash
git rebase --continue
```

Se quiser desistir:

```bash
git rebase --abort
```

---

Se fosse merge:

```bash
git merge --abort
```

---

# 20. `pull` correto

Não existe um único “pull correto”.

Mas um fluxo previsível é:

```bash
git switch main
git pull --ff-only
```

O:

```bash
--ff-only
```

é excelente.

Ele diz:

> só atualize se for possível fazer fast-forward.

Se sua `main` local tiver commits divergentes, ele não cria um merge inesperado.

Isso evita aquele clássico:

```text
Merge branch 'main' of github.com...
```

que ninguém queria.

---

# 21. Configuração que eu recomendo

Você pode fazer:

```bash
git config --global pull.ff only
```

Agora:

```bash
git pull
```

se comporta como:

```bash
git pull --ff-only
```

Eu gosto bastante dessa configuração.

---

# 22. Remotos

Veja os remotos:

```bash
git remote -v
```

Exemplo:

```text
origin  git@github.com:lucas/projeto.git (fetch)
origin  git@github.com:lucas/projeto.git (push)
```

---

## Adicionar remoto

```bash
git remote add origin git@github.com:usuario/projeto.git
```

---

## Alterar remoto

```bash
git remote set-url origin git@github.com:usuario/novo-projeto.git
```

---

## Remover

```bash
git remote remove origin
```

---

## Renomear

```bash
git remote rename origin github
```

---

# 23. `origin` não tem nada de especial

Isso costuma gerar confusão.

`origin` é só um nome.

Poderia ser:

```text
github
usp
faculdade
upstream
```

Por exemplo:

```bash
git remote add faculdade git@github.com:faculdade/projeto.git
```

Depois:

```bash
git fetch faculdade
```

---

# 24. `origin` e `upstream`

Isso aparece muito em forks.

Imagine que existe:

```text
Professor/projeto
```

Você faz fork:

```text
Lucas/projeto
```

Seu repositório:

```text
origin
→ Lucas/projeto
```

Projeto original:

```text
upstream
→ Professor/projeto
```

Configuração:

```bash
git remote add upstream git@github.com:Professor/projeto.git
```

Agora:

```bash
git fetch upstream
```

e:

```bash
git rebase upstream/main
```

Isso aparece bastante em projetos open source.

---

# 25. Tracking branch

Quando você faz:

```bash
git push -u origin feature/login
```

o:

```text
-u
```

significa:

```text
--set-upstream
```

Você está dizendo:

```text
feature/login local
↓ acompanha
origin/feature/login
```

Depois disso basta:

```bash
git push
```

e:

```bash
git pull
```

sem especificar branch.

---

# 26. Como descobrir o que sua branch está acompanhando

```bash
git branch -vv
```

Exemplo:

```text
* feature/login  abc123 [origin/feature/login] login form
  main           def456 [origin/main] update README
```

Esse comando é muito útil.

---

# 27. Ver branches remotas

```bash
git branch -r
```

Resultado:

```text
origin/main
origin/feature/login
origin/feature/dashboard
```

Todas:

```bash
git branch -a
```

---

# 28. Uma branch foi deletada no GitHub mas continua aparecendo

Muito comum.

Você roda:

```bash
git fetch --prune
```

ou:

```bash
git remote prune origin
```

Isso remove referências antigas como:

```text
origin/feature-que-ja-foi-deletada
```

---

# 29. Apagar branch local

Depois que o PR foi mergeado:

```bash
git branch -d feature/login
```

Se o Git reclamar e você realmente quiser excluir:

```bash
git branch -D feature/login
```

Mas `-D` força a exclusão.

---

# 30. Apagar branch remota

```bash
git push origin --delete feature/login
```

---

# 31. `git log` que realmente ajuda

O log padrão não é muito útil.

Use:

```bash
git log --oneline --graph --decorate --all
```

Você vai ver algo como:

```text
* 71fd12a (HEAD -> feature/login) feat: validation
* 0ac8821 feat: login form
| * a03dd41 (origin/main, main) fix: navbar
|/
* 83ad119 init project
```

Esse comando é praticamente obrigatório quando você está confuso com branches.

Eu até criaria um alias:

```bash
git config --global alias.tree "log --oneline --graph --decorate --all"
```

Depois:

```bash
git tree
```

---

# 32. `git diff`

Antes de commit:

```bash
git diff
```

Mostra mudanças ainda não adicionadas.

Depois de:

```bash
git add .
```

use:

```bash
git diff --staged
```

Isso mostra exatamente o que irá entrar no commit.

Muito útil para não commitar coisa errada.

---

# 33. Comparar sua branch com a main

Esse comando é ótimo para PR:

```bash
git diff origin/main...HEAD
```

Você vê:

> tudo que minha branch introduziu comparada à main.

E:

```bash
git log origin/main..HEAD --oneline
```

mostra os commits que existem na sua branch e não na `main`.

---

# 34. Descobrir se sua branch está na frente ou atrás

```bash
git status
```

Pode aparecer:

```text
Your branch is ahead of 'origin/feature' by 3 commits.
```

ou:

```text
behind by 2 commits
```

ou:

```text
have diverged
```

---

# 35. `ahead`, `behind` e `diverged`

### Ahead

```text
origin/feature:
A---B

local:
A---B---C---D
```

Você precisa:

```bash
git push
```

---

### Behind

```text
local:
A---B

origin:
A---B---C---D
```

Você precisa trazer mudanças:

```bash
git pull
```

---

### Diverged

```text
      C---D local
     /
A---B
     \
      E---F remote
```

Aqui existe uma decisão real:

```text
merge
ou
rebase
```

Não é simplesmente “dar pull”.

---

# 36. `git stash`

Situação clássica:

```bash
git switch main
```

Git:

```text
error: Your local changes would be overwritten
```

Você ainda não quer commitar.

Use:

```bash
git stash
```

Agora troca:

```bash
git switch main
```

Depois volta:

```bash
git switch feature
git stash pop
```

---

Você também pode nomear:

```bash
git stash push -m "WIP login"
```

Ver:

```bash
git stash list
```

---

# 37. `git cherry-pick`

Esse é um comando que provavelmente vai ser muito útil para você como TL.

Imagine:

```text
main
A---B

feature-a
A---B---C---D

feature-b
A---B---E
```

Você quer apenas o commit `D` dentro de `feature-b`.

Pegue o hash:

```bash
git log --oneline
```

Depois:

```bash
git switch feature-b
git cherry-pick <hash-do-D>
```

Resultado:

```text
feature-b
A---B---E---D'
```

Você trouxe **um commit específico**, não a branch toda.

---

# 38. `git reset`

Esse aqui merece cuidado.

Imagine:

```text
A---B---C
        HEAD
```

Você quer voltar para `B`.

### Soft

```bash
git reset --soft HEAD~1
```

Remove o commit, mas mantém alterações staged.

```text
commit removido
arquivos continuam preparados
```

---

### Mixed

```bash
git reset HEAD~1
```

ou:

```bash
git reset --mixed HEAD~1
```

Remove commit e staged, mas mantém arquivos modificados.

---

### Hard

```bash
git reset --hard HEAD~1
```

Remove:

```text
commit
staging
alterações
```

Muito mais destrutivo.

---

# 39. `git revert`

Para commits que já foram publicados, geralmente é melhor:

```bash
git revert <hash>
```

Imagine:

```text
A---B---C
```

Você quer desfazer `C`.

O Git cria:

```text
A---B---C---D
```

Onde:

```text
D = inverso de C
```

Histórico permanece intacto.

Isso é muito melhor que `reset` em `main`.

---

# 40. Regra importante para TL

Em branch compartilhada:

```text
main
develop
release
```

evite:

```bash
git reset
git rebase
git push --force
```

Porque esses comandos podem reescrever histórico.

Prefira:

```bash
git revert
```

---

# 41. Um fluxo que eu recomendo para você como TL

Quando começa o dia:

```bash
git switch main
git fetch origin
git pull --ff-only
```

Criando feature:

```bash
git switch -c feature/project-create
```

Durante trabalho:

```bash
git status
git diff
git add .
git diff --staged
git commit
```

Publicar:

```bash
git push -u origin feature/project-create
```

---

Antes de abrir ou atualizar PR:

```bash
git fetch origin
git rebase origin/main
```

Se houver conflito:

```bash
# resolver arquivos

git add .
git rebase --continue
```

Depois:

```bash
git push --force-with-lease
```

---

Depois do merge:

```bash
git switch main
git pull --ff-only
git branch -d feature/project-create
git fetch --prune
```

---

# 42. Para revisar PRs como TL

Eu faria mentalmente esta sequência:

```text
1. O que essa branch deveria fazer?

2. Que commits ela introduziu?

3. O que mudou nos arquivos?

4. Está atualizada com a main?

5. Existem conflitos?

6. Os testes passam?

7. O PR está misturando responsabilidades?

8. O histórico está aceitável?

9. Squash, rebase ou merge?

10. Merge.
```

Comandos:

```bash
git fetch origin
git log origin/main..origin/feature --oneline
git diff origin/main...origin/feature
```

Isso é extremamente útil.

---

# 43. Os comandos que eu realmente decoraria

Você não precisa decorar 100 comandos. Para o seu nível, eu teria esse arsenal:

```bash
git status

git branch
git branch -a
git branch -vv

git switch branch
git switch -c nova-branch

git fetch
git fetch --prune

git pull --ff-only

git add
git commit
git push
git push -u origin branch

git merge

git rebase
git rebase --continue
git rebase --abort

git log --oneline --graph --decorate --all

git diff
git diff --staged

git stash
git stash pop

git cherry-pick

git revert

git remote -v
git remote add
git remote set-url
```

E eu trataria estes como comandos que exigem atenção extra:

```bash
git reset --hard

git push --force

git rebase
```

Especialmente em branch compartilhada.

---

# 44. O principal salto de conhecimento

No básico você pensa:

```text
alterei
→ commit
→ push
```

No Git intermediário você começa a pensar:

```text
Onde HEAD está?

Qual branch estou?

Qual é o ancestral comum?

Minha branch está ahead/behind?

origin/main está atualizado?

Estou integrando históricos com merge ou rebase?

Estou movendo uma referência ou criando um commit?

Esse histórico já foi compartilhado?
```

Quando você começa a enxergar Git dessa forma, os comandos deixam de parecer mágicos.

Para sua situação de TL, os próximos assuntos que mais valem estudar depois disso são **merge base e `HEAD`**, **rebase interativo (`git rebase -i`)**, **recuperação com `git reflog`**, **cherry-pick na prática**, e principalmente **como diagnosticar branches divergentes sem sair rodando `pull`/`push --force` no escuro**. Esses são justamente os pontos que costumam separar quem “sabe usar Git” de quem consegue resolver os problemas do time.