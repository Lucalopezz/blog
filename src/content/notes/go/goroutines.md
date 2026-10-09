---
title: Goroutines em Go
description: Execute tarefas independentes, espere sua conclusão e limite o trabalho simultâneo com exemplos práticos.
category: Go
tags: [go, goroutines, concorrencia, waitgroup]
---

Uma **goroutine** executa uma função concorrentemente com as demais. Basta colocar `go` antes da chamada. A função que iniciou a goroutine continua sem esperar por ela; se `main` terminar, o programa termina também.

## Processar tarefas e esperar o resultado

Este exemplo simula três tarefas independentes. Cada goroutine escreve em uma posição diferente de `results`, e `Wait` garante que a leitura aconteça depois de todas terminarem.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    tasks := []string{"imagem", "relatório", "backup"}
    results := make([]string, len(tasks))
    var wg sync.WaitGroup

    for i, task := range tasks {
        wg.Add(1)
        go func(index int, name string) {
            defer wg.Done()
            time.Sleep(100 * time.Millisecond) // Simula uma operação demorada.
            results[index] = name + " concluído"
        }(i, task)
    }

    wg.Wait()
    for _, result := range results {
        fmt.Println(result)
    }
}
```

Execute com `go run main.go`. A ordem em que as tarefas **terminam** não é garantida; a impressão segue a ordem do slice. Passar `i` e `task` como argumentos também deixa explícito qual valor pertence a cada execução.

`WaitGroup` serve para aguardar a conclusão. Ele não transporta resultados nem cancela tarefas. Para passar valores entre goroutines, veja [[channels|channels]].

## Limitar tarefas simultâneas

Criar uma goroutine para cada item de uma lista enorme pode consumir recursos demais. Aqui, um canal com capacidade 2 limita o número de tarefas em andamento. O envio para `limit` ocorre **antes** de criar a próxima goroutine, então o laço espera quando os dois lugares estão ocupados.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func main() {
    tasks := []string{"A", "B", "C", "D", "E"}
    limit := make(chan struct{}, 2)
    var wg sync.WaitGroup

    for _, task := range tasks {
        limit <- struct{}{}
        wg.Add(1)
        go func(name string) {
            defer wg.Done()
            defer func() { <-limit }()
            time.Sleep(100 * time.Millisecond)
            fmt.Println("terminou", name)
        }(task)
    }

    wg.Wait()
}
```

A ordem das mensagens pode variar. Para um fluxo contínuo de tarefas, um conjunto fixo de workers lendo de um canal costuma ser mais conveniente; há um exemplo em [[channels|Channels em Go]].

Veja também [[fan-out-fan-in|Fan-Out e Fan-In em Go]] para distribuir tarefas entre workers, reunir seus canais de resultados e coordenar o encerramento.

## Cuidados

- Não use `time.Sleep` para *esperar* uma goroutine: o tempo de execução é variável. Use `WaitGroup` ou um canal.
- Uma goroutine bloqueada para sempre continua ocupando recursos. Defina como ela termina e como a operação pode ser cancelada.
- Goroutines não tornam automaticamente seguro o acesso à mesma variável. Veja [[race-condition-mutex-sync-map|race condition, mutex e sync.Map]].

## Para continuar

- [Effective Go: goroutines](https://go.dev/doc/effective_go#goroutines)
- [Documentação de sync.WaitGroup](https://pkg.go.dev/sync#WaitGroup)
