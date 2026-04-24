import test from "ava";

import { getUsage, parseArgs } from "../../cli/parseArgs.js";
import { UserError } from "../../cli/utils.js";
import { normalizeOutput } from "../__helpers__/index.js";

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
    ["--tasks-simple", "false"],
    ["--tasks-simple=false"],
    ["--tasks-simple", "--tasks=false"],
    ["--tasks", "--tasks-simple=false"],
    ["build", "test", "--light=false"],
    ["build", "test", "--", "--light=false"],
    ["build", "test", "--", "not-a-task", "--light=false"],
    ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false"],
    ["--herebyfile=path/to/Herebyfile.js", "build", "test"],
    ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false", "not-a-task"],
];

for (const argv of argvTests) {
    test(macro, argv);
}

const errorMacro = test.macro<[string[], string]>({
    exec(t, input, message) {
        t.throws(() => parseArgs(input), { instanceOf: UserError, message });
    },
    title(providedTitle, input) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return providedTitle || `error: ${input.join(" ")}`;
    },
});

test(errorMacro, ["--herebyfile"], "Option --herebyfile requires a value.");
test(errorMacro, ["--herebyfile="], "Option --herebyfile requires a value.");
test(errorMacro, ["--herebyfile", "--tasks", "build"], "Option --herebyfile requires a value.");

test.serial("usage", (t) => {
    t.snapshot(normalizeOutput(getUsage()));
});
