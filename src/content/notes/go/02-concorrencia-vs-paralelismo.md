---
title: "02. Concorrência e paralelismo em Go"
description: Entenda a diferença com exemplos de operações de espera e de trabalho de CPU.
category: Go
tags: [go, concorrencia, paralelismo, performance]
---

**Concorrência** organiza tarefas independentes para que possam progredir em períodos sobrepostos. **Paralelismo** significa que cálculos acontecem literalmente ao mesmo tempo, em recursos de execução diferentes. Um programa pode ser concorrente mesmo se só uma tarefa executa instruções por vez.

| Situação | Por que usar concorrência? | Quando há paralelismo? |
| --- | --- | --- |
| Buscar dados de três serviços | Sobrepor tempo de espera de rede | Não é necessário para obter ganho |
| Processar partes de uma imagem | Dividir um cálculo independente | Quando núcleos conseguem executar partes simultaneamente |
| Atualizar um contador compartilhado | Várias tarefas precisam registrar eventos | Só com sincronização correta; paralelismo não corrige races |

## Exemplo de espera: três operações independentes

`time.Sleep` representa espera por I/O. As três goroutines podem aguardar ao mesmo tempo; isso não demonstra uso simultâneo de três núcleos.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func fetch(name string) string {
    time.Sleep(200 * time.Millisecond) // Simula rede ou disco.
    return name + " pronto"
}

func main() {
    services := []string{"perfil", "pedidos", "estoque"}
    results := make([]string, len(services))
    var wg sync.WaitGroup

    start := time.Now()
    for i, service := range services {
        wg.Add(1)
        go func(index int, name string) {
            defer wg.Done()
            results[index] = fetch(name)
        }(i, service)
    }
    wg.Wait()

    fmt.Println(results)
    fmt.Println("duração aproximada:", time.Since(start))
}
```

Execute com `go run main.go`. A duração tende a ficar próxima da espera de **uma** operação, em vez da soma das três, mas o tempo exato depende da máquina e do escalonamento.

## Exemplo de CPU: dividir um cálculo

As faixas abaixo são independentes. Duas goroutines contam números primos e enviam os totais por um canal:

```go
package main

import (
    "fmt"
    "runtime"
)

func countPrimes(start, end int) int {
    total := 0
    for n := start; n < end; n++ {
        if n < 2 {
            continue
        }
        prime := true
        for divisor := 2; divisor <= n/divisor; divisor++ {
            if n%divisor == 0 {
                prime = false
                break
            }
        }
        if prime {
            total++
        }
    }
    return total
}

func main() {
    totals := make(chan int, 2)
    go func() { totals <- countPrimes(2, 25_000) }()
    go func() { totals <- countPrimes(25_000, 50_000) }()

    fmt.Println("primos abaixo de 50.000:", <-totals+<-totals)
    fmt.Println("GOMAXPROCS:", runtime.GOMAXPROCS(0))
}
```

Execute com `go run main.go`. `GOMAXPROCS` informa quantas goroutines podem executar código Go simultaneamente, conforme a configuração do processo. Ter duas goroutines **permite** paralelismo; não garante ganho: divisão desigual, custo de coordenação e quantidade de CPUs afetam o resultado. Compare versões sequencial e concorrente com benchmarks antes de otimizar.

Concorrência introduz coordenação e possíveis races. Use-a quando houver tarefas independentes e um ganho claro de organização ou desempenho. Veja [[03-goroutines|goroutines]], [[04-channels|channels]] e [[05-race-condition-mutex-sync-map|sincronização]].

## Para continuar

- [Concurrency is not parallelism](https://go.dev/blog/waza-talk)
- [Effective Go: parallelization](https://go.dev/doc/effective_go#parallel)
