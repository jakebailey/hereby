import os from "node:os";
import path from "node:path";

import test from "ava";

import { findSimilar, prettyMilliseconds, real, simplifyPath, UserError } from "../../cli/utils.js";

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

test.serial("real dependencies", (t) => {
    const d = real();

    const saveExitCode = process.exitCode;
    d.setExitCode(123);
    t.is(process.exitCode, 123);
    process.exitCode = saveExitCode;
});

test("UserError", (t) => {
    const e = new UserError("message");
    t.is(e.message, "message");
});

const pmsMacro = test.macro<[number, string]>({
    exec(t, input, expected) {
        t.is(prettyMilliseconds(input), expected);
    },
    title(providedTitle, input) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return providedTitle || `prettyMilliseconds(${input})`;
    },
});

// Sub-second
test(pmsMacro, 0, "0ms");
test(pmsMacro, 1, "1ms");
test(pmsMacro, 0.1, "1ms");
test(pmsMacro, 15, "15ms");
test(pmsMacro, 150, "150ms");
test(pmsMacro, 999, "999ms");

// Seconds
test(pmsMacro, 1000, "1s");
test(pmsMacro, 1500, "1.5s");
test(pmsMacro, 5432, "5.4s");
test(pmsMacro, 59_999, "59.9s");

// Minutes
test(pmsMacro, 60_000, "1m");
test(pmsMacro, 61_500, "1m 1.5s");
test(pmsMacro, 125_000, "2m 5s");

// Hours
test(pmsMacro, 3_600_000, "1h");
test(pmsMacro, 3_661_000, "1h 1m 1s");
test(pmsMacro, 7_200_000, "2h");

const findSimilarMacro = test.macro<[string, string[], string | undefined]>({
    exec(t, target, candidates, expected) {
        t.is(findSimilar(target, candidates), expected);
    },
    title(providedTitle, target, candidates) {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        return providedTitle || `findSimilar(${JSON.stringify(target)}, ${JSON.stringify(candidates)})`;
    },
});

// Threshold = ceil(len * 0.4); a candidate matches when its edit distance is strictly less.

// Typo correction within threshold.
test(findSimilarMacro, "buld", ["build", "test", "lint"], "build");
test(findSimilarMacro, "tes", ["build", "test", "lint"], "test");

// Picks the first candidate at the minimum distance on ties.
test(findSimilarMacro, "buil", ["build", "built", "lint"], "build");
test(findSimilarMacro, "buil", ["lint", "built", "build"], "built");

// No candidate within threshold.
test(findSimilarMacro, "completely-different", ["build", "test"], undefined);

// Empty inputs.
test(findSimilarMacro, "build", [], undefined);
test(findSimilarMacro, "", ["build"], undefined);
test(findSimilarMacro, "build", [""], undefined);

// Exact match.
test(findSimilarMacro, "build", ["build", "test"], "build");

// Accepts any iterable, not just arrays (e.g. Map.keys()).
test("findSimilar accepts iterables", (t) => {
    const tasks = new Map([["build", 1], ["test", 2]]);
    t.is(findSimilar("buld", tasks.keys()), "build");
});
