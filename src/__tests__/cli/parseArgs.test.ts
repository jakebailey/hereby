import test from "ava";

import { getUsage, parseArgs } from "../../cli/parseArgs.js";

const macro = test.macro<[string[]]>({
    exec(t, input) {
        t.snapshot(parseArgs(input));
    },
    title(providedTitle, input) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return providedTitle || input.join(" ") || "no args";
    },
});

const argvTests = [
    [],
    ["--help"],
    ["-h"],
    ["--tasks"],
    ["--tasks", "true"],
    ["--tasks=true"],
    ["--tasks", "TRUE"],
    ["--tasks", "yes"],
    ["--tasks", "1"],
    ["--tasks", "false"],
    ["--tasks=false"],
    ["--tasks", "FALSE"],
    ["--tasks", "0"],
    ["-T"],
    ["-T", "true"],
    ["-T", "false"],
    ["--tasks-simple"],
    ["--tasks-simple", "true"],
    ["build", "test", "--light=false"],
    ["build", "test", "--", "--light=false"],
    ["build", "test", "--", "not-a-task", "--light=false"],
    ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false"],
    ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false", "not-a-task"],
];

for (const argv of argvTests) {
    test(macro, argv);
}

test.serial("usage", (t) => {
    t.snapshot(getUsage().replace(/\r/g, ""));
});
