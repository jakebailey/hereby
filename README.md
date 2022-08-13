# hereby

`hereby` is a simple task runner.

# Herebyfile.mjs

Tasks are defined in `Herebyfile.mjs`, like:

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
})

export const testAndLint = task({
    name: "testAndLint",
    dependencies: [test, lint],
})

export default testAndLint;
```

# Running tasks

Given the above Herebyfile:

```
$ hereby build  # Run only build
$ hereby test   # Run test, which depends on build.
$ hereby        # Run the default exported task.
```

# Flags

`hereby` also supports a handful of flags:

```
  -h, --help          Display this usage guide.               
  --herebyfile path   A path to a Herebyfile. Optional.       
  -T, --tasks         Print a listing of the available tasks. 
```
