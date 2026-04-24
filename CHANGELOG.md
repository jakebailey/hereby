# hereby

## 1.15.0

### Minor Changes

- ba95607: Replace fastest-levenshtein with local implementation
- 20c8970: Replace minimist with small local CLI parser
- 5c85ede: Simplify some code
- 86a816f: Replace picocolors with local helpers

## 1.14.0

### Minor Changes

- 7ca84de: Update picocolors
- b6d1222: Replace wordwrapjs with small local helper
- 81c67b9: Lazily load task formatting code

### Patch Changes

- 3817716: Fix task formatting bug

## 1.13.0

### Minor Changes

- 68b31e1: Simplify task runner
- b91a16b: Remove pretty-ms dep, use small local replacement

## 1.12.0

### Minor Changes

- 5087031: Replace `command-line-usage` dependency

## 1.11.1

### Patch Changes

- 47e86c7: Enable OIDC publishing

## 1.11.0

### Minor Changes

- dbb7d94: Support typescript herebyfiles (in runtimes that support typescript)
- 71ecd72: Print list of failed tasks when completing with errors

## 1.10.0

### Minor Changes

- b3bc063: Enable V8 compile caching where available (`enableCompileCache`)

## 1.9.0

### Minor Changes

- 23cf557: Swap import-meta-resolve for plain filesystem walking; this makes startup
  roughly 10-20% faster and prevents a deprecation warning in Node 22+
- 5342e20: Use `performance.now` instead of `Date.now`

## 1.8.9

### Patch Changes

- 2bd71a5: Minor refactors
- a74c7fb: Fix the (unlikely) case of a Herebyfile at the FS root

## 1.8.8

### Patch Changes

- b0b00a6: Fix Herebyfile finding for root of FS
