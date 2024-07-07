import os from "node:os";
import path from "node:path";

import test from "ava";

import { ExitCodeError, real, simplifyPath, UserError } from "../../cli/utils.js";

function normalizeSlashes(p: string) {
    return p.replace(/\\/g, "/");
}

const macro = test.macro<[string, string]>({
    exec(t, input, expected) {
        t.is(normalizeSlashes(simplifyPath(input)), normalizeSlashes(expected));
    },
    title(providedTitle, input) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return providedTitle || input;
    },
});

test(macro, os.homedir(), os.homedir());
test(macro, path.join(os.homedir(), "foo", "bar", "Herebyfile.js"), "~/foo/bar/Herebyfile.js");
test(macro, `${os.homedir()}////foo/bar/../bar/Herebyfile.js`, "~/foo/bar/Herebyfile.js");
test(macro, path.dirname(os.homedir()), path.dirname(os.homedir()));

test.serial("real dependencies", async (t) => {
    const d = await real();

    /* eslint-disable no-restricted-globals */
    const saveExitCode = process.exitCode;
    d.setExitCode(123);
    t.is(process.exitCode, 123);
    process.exitCode = saveExitCode;
    /* eslint-enable no-restricted-globals */
});

test("UserError", (t) => {
    const e = new UserError("message");
    t.is(e.message, "message");
});

test("ExitCodeError", (t) => {
    const e = new ExitCodeError(1);
    t.is(e.exitCode, 1);
});
