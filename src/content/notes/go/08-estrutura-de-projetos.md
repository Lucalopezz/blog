---
title: "08. Estrutura de projetos em Go"
description: Organize um módulo pequeno e evolua para uma API de tarefas com cmd, internal e pacotes por responsabilidade.
category: Go
tags: [go, modulos, pacotes, estrutura-de-projetos]
---

Em Go, um **módulo** começa no `go.mod` e contém um ou mais **pacotes**. Arquivos `.go` no mesmo diretório pertencem ao mesmo pacote. A estrutura deve acompanhar o tamanho da aplicação: um programa pequeno pode começar com `go.mod` e `main.go`, sem uma árvore de pastas obrigatória.

## Quando a aplicação cresce

Imagine uma API de tarefas. Uma estrutura possível, seguindo a convenção descrita na documentação oficial, é:

```text
tasks-api/
├── go.mod
├── cmd/
│   └── api/
│       └── main.go          # inicia o servidor
└── internal/
    ├── task/
    │   └── store.go        # regra e armazenamento em memória
    └── httpapi/
        └── handler.go      # entrada e saída HTTP
```

`cmd/api` guarda o executável. `internal/task` guarda o comportamento de tarefas; `internal/httpapi` adapta esse comportamento ao HTTP. `internal` impede importações por projetos fora da árvore permitida pelo módulo. Não é preciso criar diretórios `pkg`, `service`, `repository` ou `utils` antes de haver código que justifique a separação.

### 1. Declare o módulo

Em `go.mod`, substitua o caminho pelo endereço do **seu** repositório:

```go
module github.com/seu-usuario/tasks-api

go 1.22
```

Na prática, crie esse arquivo com `go mod init github.com/seu-usuario/tasks-api`. O caminho do módulo determina o prefixo dos imports internos.

### 2. Escreva a regra em `internal/task/store.go`

```go
package task

import (
    "errors"
    "strings"
    "sync"
)

type Task struct {
    ID    int    `json:"id"`
    Title string `json:"title"`
}

type Store struct {
    mu     sync.Mutex
    nextID int
    tasks  []Task
}

func NewStore() *Store {
    return &Store{nextID: 1}
}

func (s *Store) Add(title string) (Task, error) {
    title = strings.TrimSpace(title)
    if title == "" {
        return Task{}, errors.New("título obrigatório")
    }

    s.mu.Lock()
    defer s.mu.Unlock()
    item := Task{ID: s.nextID, Title: title}
    s.nextID++
    s.tasks = append(s.tasks, item)
    return item, nil
}

func (s *Store) List() []Task {
    s.mu.Lock()
    defer s.mu.Unlock()
    return append([]Task{}, s.tasks...)
}
```

O `Mutex` protege as operações no slice, inclusive a cópia feita por `List`. Os dados existem só na memória e somem quando o processo termina.

### 3. Conecte a regra ao HTTP em `internal/httpapi/handler.go`

```go
package httpapi

import (
    "encoding/json"
    "net/http"

    "github.com/seu-usuario/tasks-api/internal/task"
)

func Register(mux *http.ServeMux, store *task.Store) {
    mux.HandleFunc("GET /tasks", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        _ = json.NewEncoder(w).Encode(store.List())
    })

    mux.HandleFunc("POST /tasks", func(w http.ResponseWriter, r *http.Request) {
        var input struct {
            Title string `json:"title"`
        }
        if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
            http.Error(w, "JSON inválido", http.StatusBadRequest)
            return
        }

        created, err := store.Add(input.Title)
        if err != nil {
            http.Error(w, err.Error(), http.StatusBadRequest)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        w.WriteHeader(http.StatusCreated)
        _ = json.NewEncoder(w).Encode(created)
    })
}
```

Os padrões `"GET /tasks"` e `"POST /tasks"` do `ServeMux` exigem Go 1.22 ou mais recente. O handler recebe a dependência `Store` ao ser registrado; não precisa de uma variável global.

### 4. Inicie o programa em `cmd/api/main.go`

```go
package main

import (
    "log"
    "net/http"

    "github.com/seu-usuario/tasks-api/internal/httpapi"
    "github.com/seu-usuario/tasks-api/internal/task"
)

func main() {
    mux := http.NewServeMux()
    httpapi.Register(mux, task.NewStore())

    log.Println("API em http://localhost:8080")
    log.Fatal(http.ListenAndServe(":8080", mux))
}
```

Da raiz do módulo, rode `go run ./cmd/api`. Em outro terminal, experimente:

```sh
curl -X POST http://localhost:8080/tasks -H 'Content-Type: application/json' -d '{"title":"Estudar Go"}'
curl http://localhost:8080/tasks
go test ./...
```

O primeiro comando retorna uma tarefa com `id: 1`; o segundo lista as tarefas do processo em execução. `go test ./...` cobre os pacotes quando você adicionar testes. Esta é uma estrutura **possível**, não uma regra para todo projeto. Comece simples e separe pacotes quando surgir uma responsabilidade distinta.

## Para continuar

- [Organizing a Go module](https://go.dev/doc/modules/layout)
- [Tutorial: Create a Go module](https://go.dev/doc/tutorial/create-module)
