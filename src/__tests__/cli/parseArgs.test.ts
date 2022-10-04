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
test(macro, ["-T"]);
test(macro, ["--tasks-simple"]);
test(macro, ["build", "test", "--light=false"]);
test(macro, ["build", "test", "--", "--light=false"]);
test(macro, ["--herebyfile", "path/to/Herebyfile.js", "build", "test", "--light=false"]);

test.serial("usage", (t) => {
    t.snapshot(getUsage().replace(/\r/g, ""));
});
