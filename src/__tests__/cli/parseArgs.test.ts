import test from "ava";

import { getUsage, parseArgs } from "../../cli/parseArgs.js";

const macro = test.macro<[string[]]>({
    exec(t, input) {
        t.snapshot(parseArgs(input));
    },
    title(providedTitle, input) {
        return providedTitle || `${input.join(" ")}` || "no args";
    },
});

test(macro, []);
test(macro, ["--help"]);
test(macro, ["-h"]);
test(macro, ["--tasks"]);
test(macro, ["--tasks", "true"]);
test(macro, ["--tasks=true"]);
test(macro, ["--tasks", "TRUE"]);
test(macro, ["--tasks", "yes"]);
test(macro, ["--tasks", "1"]);
test(macro, ["--tasks", "false"]);
test(macro, ["--tasks=false"]);
test(macro, ["--tasks", "FALSE"]);
test(macro, ["--tasks", "0"]);
test(macro, ["-T"]);
test(macro, ["-T", "true"]);
test(macro, ["-T", "false"]);
test(macro, ["--tasks-simple"]);
test(macro, ["--tasks-simple", "true"]);
test(macro, ["build", "test", "--light=false"]);
test(macro, ["build", "test", "--", "--light=false"]);
test(macro, ["build", "test", "--", "not-a-task", "--light=false"]);
test(macro, ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false"]);
test(macro, ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false", "not-a-task"]);

test.serial("usage", (t) => {
    t.snapshot(getUsage().replace(/\r/g, ""));
});
