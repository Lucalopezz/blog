---
title: Channels em Go
description: Envie valores entre goroutines com um pool de workers e entenda bloqueio, fechamento e cancelamento.
category: Go
tags: [go, channels, concorrencia, workers]
---

Um **channel** conecta goroutines por meio de valores. Em `jobs <- valor` você envia; em `valor := <-jobs` você recebe. Um canal sem buffer sincroniza emissor e receptor. Com buffer, o envio pode prosseguir enquanto houver espaço.

## Exemplo prático: dois workers

O programa distribui números para dois workers, calcula seus quadrados e reúne os resultados. O produtor fecha `jobs` após enviar tudo. A goroutine que espera os workers fecha `results` somente depois do último envio.

```go
package main

import (
    "fmt"
    "sync"
)

func main() {
    jobs := make(chan int)
    results := make(chan int)
    var wg sync.WaitGroup

    for worker := 0; worker < 2; worker++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for number := range jobs {
                results <- number * number
            }
        }()
    }

    go func() {
        for number := 1; number <= 5; number++ {
            jobs <- number
        }
        close(jobs)
    }()

    go func() {
        wg.Wait()
        close(results)
    }()

    for square := range results {
        fmt.Println(square)
    }
}
```

Execute com `go run main.go`. Você verá `1`, `4`, `9`, `16` e `25`, mas a ordem pode mudar. `range results` só termina quando `results` for fechado **e** seus valores tiverem sido recebidos. Fechar o canal de entrada sinaliza que não haverá mais tarefas; não é preciso fechar todo canal.

## Buffer e bloqueio

```go
queue := make(chan string, 2)
queue <- "primeiro"
queue <- "segundo" // Cabe no buffer, mesmo sem receptor agora.

fmt.Println(<-queue)
fmt.Println(<-queue)
```

Um terceiro envio nesse ponto bloquearia até alguém receber. O buffer ajuda a desacoplar ritmos, mas não substitui um plano de encerramento. Evite fechar um canal do lado receptor enquanto outro lado ainda pode enviar: isso causa `panic`.

## Cancelar uma espera

`select` aguarda uma entre várias operações de canal. Em trabalho real, passe um `context.Context` para permitir que o chamador cancele a espera:

```go
func waitResult(ctx context.Context, results <-chan string) (string, error) {
    select {
    case result := <-results:
        return result, nil
    case <-ctx.Done():
        return "", ctx.Err()
    }
}
```

Este trecho usa `import "context"`. Se `results` puder ser fechado sem enviar, receba com `result, ok := <-results` e trate `!ok`. O cancelamento da espera também precisa ser comunicado a quem produz o resultado; caso contrário, essa goroutine pode ficar presa tentando enviar.

## Escolha rápida

| Necessidade | Recurso |
| --- | --- |
| Sinalizar que um trabalho terminou | `WaitGroup` ou canal |
| Entregar valores entre goroutines | Channel |
| Proteger estado compartilhado | `sync.Mutex` |
| Cancelar uma operação | `context.Context` e `select` |

Veja também [[goroutines|Goroutines em Go]] e [[race-condition-mutex-sync-map|race condition e mutex]].

## Para continuar

- [Effective Go: channels](https://go.dev/doc/effective_go#channels)
- [Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines)
