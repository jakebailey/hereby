import test from "ava";
import os from "os";
import path from "path";

import { real, simplifyPath } from "../../cli/utils.js";

function normalizeSlashes(p: string) {
    return p.replace(/\\/g, "/");
}

const macro = test.macro<[string, string]>({
    exec(t, input, expected) {
        t.is(normalizeSlashes(simplifyPath(input)), normalizeSlashes(expected));
    },
    title(providedTitle, input) {
        return providedTitle || input;
    },
});

test(macro, os.homedir(), os.homedir());
test(macro, path.join(os.homedir(), "foo", "bar", "Herebyfile.js"), "~/foo/bar/Herebyfile.js");
test(macro, path.dirname(os.homedir()), path.dirname(os.homedir()));

/* eslint-disable no-restricted-globals */
test.serial("real dependencies", async (t) => {
    const d = await real();
    t.truthy(d.numCPUs);

    const saveExitCode = process.exitCode;
    d.setExitCode(123);
    t.is(process.exitCode, 123);
    process.exitCode = saveExitCode;
});
/* eslint-enable no-restricted-globals */
