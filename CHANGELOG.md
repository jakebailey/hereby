# hereby

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
