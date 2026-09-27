---
title: Race condition, mutex e sync.Map em Go
description: Identifique uma data race, proteja um map com mutex e saiba quando usar sync.Map.
category: Go
tags: [go, race-condition, mutex, sync-map]
---

Uma **race condition** é um erro cujo resultado depende da ordem em que tarefas acontecem. Uma **data race** é um caso específico: goroutines acessam a mesma variável ao mesmo tempo, pelo menos uma escreve, e não há sincronização adequada. `map` comum não aceita leituras e escritas concorrentes sem proteção.

## Um incremento incorreto

```go
count := 0
for i := 0; i < 1000; i++ {
    go func() {
        count++ // Leitura e escrita sem sincronização.
    }()
}
```

`count++` envolve mais de uma etapa; várias goroutines podem ler o mesmo valor antes de escrever. Este trecho também não espera as goroutines. Mesmo com `WaitGroup`, o acesso continuaria inseguro. Para investigar caminhos executados pelos seus testes, rode `go test -race ./...` ou `go run -race main.go`. O detector encontra races que **acontecem durante a execução**, não prova que todos os caminhos estão corretos.

## Proteger um map com Mutex

Este contador guarda o `map` e o lock juntos. Tanto a escrita quanto a leitura usam o mesmo mutex:

```go
package main

import (
    "fmt"
    "sync"
)

type Counters struct {
    mu     sync.Mutex
    values map[string]int
}

func (c *Counters) Add(key string) {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.values[key]++
}

func (c *Counters) Value(key string) int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.values[key]
}

func main() {
    counters := &Counters{values: make(map[string]int)}
    var wg sync.WaitGroup

    for i := 0; i < 1000; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counters.Add("visitas")
        }()
    }

    wg.Wait()
    fmt.Println(counters.Value("visitas")) // 1000
}
```

Execute com `go run -race main.go`. O lock cobre a operação completa `values[key]++`, preservando o incremento. Em funções reais, mantenha a região protegida curta e não copie uma struct que contém `sync.Mutex` depois de começar a usá-la.

## O map especializado: sync.Map

`sync.Map` permite operações concorrentes sem um mutex externo para cada `Load`, `Store` ou `LoadOrStore`. É útil, por exemplo, para um cache em que cada chave é gravada uma vez e lida muitas vezes.

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    var cache sync.Map
    var wg sync.WaitGroup

    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            cache.LoadOrStore("config:tema", "escuro")
        }()
    }

    wg.Wait()
    value, ok := cache.Load("config:tema")
    if ok {
        fmt.Println(value.(string)) // escuro
    }
}
```

`sync.Map` armazena chaves e valores como `any`, então perdemos parte da segurança de tipos. Além disso, fazer `Load`, somar 1 e depois `Store` **não** transforma as três etapas em um incremento atômico. Para contadores e invariantes que envolvem vários valores, prefira um `map` tipado com `Mutex` ou `RWMutex`. Um `sync.Map` guarda operações individuais seguras, não a lógica composta da aplicação.

## Para continuar

- [Data Race Detector](https://go.dev/doc/articles/race_detector)
- [Documentação de sync.Map](https://pkg.go.dev/sync#Map)
- [Go maps in action: concurrency](https://go.dev/blog/maps#concurrency)
