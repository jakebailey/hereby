# hereby

[![npm](https://img.shields.io/npm/v/hereby.svg)](https://npmjs.com/package/hereby)
[![node](https://img.shields.io/node/v/hereby.svg)](https://nodejs.org)
[![install size](https://packagephobia.com/badge?p=hereby)](https://packagephobia.com/result?p=hereby)
[![tokei](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/jakebailey/hereby/gh-pages/tokei.json)](https://github.com/XAMPPRocky/tokei)
[![ci](https://github.com/jakebailey/hereby/actions/workflows/ci.yml/badge.svg)](https://github.com/jakebailey/hereby/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jakebailey/hereby/branch/main/graph/badge.svg?token=YL2Z1uk5dh)](https://codecov.io/gh/jakebailey/hereby)

> _I hereby declare thee built._

`hereby` is a simple task runner.

```console
$ npm i -D hereby
$ yarn add -D hereby
```

## Herebyfile.mjs

Tasks are defined in `Herebyfile.mjs`. Exported tasks are available to run at
the CLI, with support for `export default`.

For example:

```js
import { execa } from "execa";
import { task } from "hereby";

export const build = task({
    name: "build",
    run: async () => {
        await execa("tsc", ["-b", "./src"]);
    },
});

export const test = task({
    name: "test",
    dependencies: [build],
    run: async () => {
        await execa("node", ["./out/test.js"]);
    },
});

export const lint = task({
    name: "lint",
    run: async () => {
        await runLinter(...);
    },
});

export const testAndLint = task({
    name: "testAndLint",
    dependencies: [test, lint],
});

export default testAndLint;

export const bundle = task({
    name: "bundle",
    dependencies: [build],
    run: async () => {
        await execa("esbuild", [
            "--bundle",
            "./out/index.js",
            "--outfile=./out/bundled.js",
        ]);
    },
});
```

## Running tasks

Given the above Herebyfile:

```console
$ hereby build        # Run the "build" task
$ hereby test         # Run the "test" task, which depends on "build".
$ hereby              # Run the default exported task.
$ hereby test bundle  # Run the "test" and "bundle" tasks in parallel.
```

## Flags

`hereby` also supports a handful of flags:

```console
-h, --help          Display this usage guide.
--herebyfile path   A path to a Herebyfile. Optional.
-T, --tasks         Print a listing of the available tasks.
```

## ESM

`hereby` is implemented in ES modules. But, don't fret! This does not mean that
your project must be ESM-only, only that your `Herebyfile` must be ESM module so
that `hereby`'s `task` function can be imported. It's recommended to use the
filename `Herebyfile.mjs` to ensure that it is treated as ESM. This will work in
a CommonJS project; ES modules can import CommonJS modules.

If your package already sets `"type": "module"`, `Herebyfile.js` will work as
well.

## Caveats

### No serial tasks

`hereby` does not support running tasks in series; specifying multiple tasks at
the CLI or as dependencies of another task will run them in parallel. This
matches the behavior of tools like `make`, which like `hereby` intend to encode
a dependency graph of tasks, not act as a script.

In general, if you're trying to emulate a serial task, you will likely be better
served by writing out explicit dependencies for your tasks.

### Tasks only run once

`hereby` will only run each task once during its execution. This means that
tasks which consist of other tasks run in order like a script cannot be
constructed. For example, it's not possible to run "build", then "clean", then
"build" again within the same invocation of `hereby`, since "build" will only be
executed once (and the lack of serial tasks prevents such a construction
anyway).

To run tasks in a specific order and more than once, run `hereby` multiple
times:

```console
$ hereby build
$ hereby clean
$ hereby build
```
