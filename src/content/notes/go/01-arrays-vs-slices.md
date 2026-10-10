---
title: "01. Arrays vs Slices in Go"
description: Understand fixed-size arrays, flexible slices, and what happens when they share memory.
date: 2026-09-26
updatedDate: 2026-09-26
category: Go
tags: [go, arrays, slices, fundamentals]
---

Arrays and slices both hold ordered elements of the same type. An array contains its elements, while a slice describes a section of an underlying array.

## Arrays have a fixed size

An array’s length is part of its type. `[3]int` and `[4]int` are different types, and an existing array cannot grow.

```go
numbers := [3]int{10, 20, 30}
duplicate := numbers
duplicate[0] = 99

fmt.Println(numbers)   // [10 20 30]
fmt.Println(duplicate) // [99 20 30]
```

Assigning an array copies its elements. Changing `duplicate` above does not change `numbers`. Run each example separately inside `func main()` in a file with `package main` and `import "fmt"`.

## Slices refer to an underlying array

A slice type uses empty brackets: `[]int`. A slice has a length and a capacity, and contains a reference to its backing array.

```go
numbers := [4]int{10, 20, 30, 40}
middle := numbers[1:3]
middle[0] = 99

fmt.Println(middle)       // [99 30]
fmt.Println(numbers)      // [10 99 30 40]
fmt.Println(len(middle))  // 2
fmt.Println(cap(middle))  // 3
```

The lower bound is inclusive and the upper bound is exclusive. Here, `middle` shares storage with `numbers`, so writing through the slice changes the array too.

## Length, capacity, and append

- **Length** is the number of elements currently in the slice.
- **Capacity** is the number of elements available from the slice’s start to the end of its accessible backing storage.
- **`append`** returns a slice containing the added elements. Always keep that returned value.

```go
values := make([]int, 0, 2)
values = append(values, 10, 20)
fmt.Println(len(values), cap(values)) // 2 2

values = append(values, 30)
fmt.Println(values) // [10 20 30]
```

When capacity is sufficient, `append` reuses the backing array. Otherwise, it allocates a new array and copies the existing elements. Do not rely on a particular capacity growth factor.

> Assigning or passing a slice copies the slice descriptor, not its backing elements. Two slices can still refer to the same storage.

## Make an independent copy

Use `make` and `copy` when changes to one slice should not affect the other:

```go
original := []int{10, 20, 30}
independent := make([]int, len(original))
copy(independent, original)
independent[0] = 99

fmt.Println(original)    // [10 20 30]
fmt.Println(independent) // [99 20 30]
```

This copies the elements. If those elements contain pointers or slices, their referenced data is still shared.

## Quick reference

| Property | Array | Slice |
| --- | --- | --- |
| Example type | `[3]int` | `[]int` |
| Length part of type | Yes | No |
| Assignment | Copies elements | Copies slice descriptor |
| Can use `append` | No | Yes |
| Typical use | Fixed-size data | Variable-length sequences |

Use slices for most collections passed between functions. Use arrays when a fixed size is meaningful, such as a 32-byte hash.

## Further reading

- [Go Slices: usage and internals](https://go.dev/blog/slices-intro)
- [A Tour of Go: slices](https://go.dev/tour/moretypes/7)
