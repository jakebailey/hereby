import { getUsage, parseArgs } from "../../cli/parseArgs.js";
import { UserError } from "../../cli/utils.js";
import { normalizeOutput } from "../__helpers__/index.js";
import { test } from "../__runner__/index.js";

const argvTests: string[][] = [
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
    test(argv.join(" ") || "no args", (t) => {
        t.snapshot(parseArgs(argv));
    });
}

const errorTests: [string[], string][] = [
    [["--herebyfile"], "Option --herebyfile requires a value."],
    [["--herebyfile="], "Option --herebyfile requires a value."],
    [["--herebyfile", "--tasks", "build"], "Option --herebyfile requires a value."],
];

for (const [argv, message] of errorTests) {
    test(`error: ${argv.join(" ")}`, (t) => {
        t.throws(() => parseArgs(argv), { instanceOf: UserError, message });
    });
}

test("usage", (t) => {
    t.snapshot(normalizeOutput(getUsage()));
});
