import os from "node:os";
import path from "node:path";

import { findSimilar, prettyMilliseconds, real, simplifyPath, UserError } from "../../cli/utils.js";
import { test } from "../__runner__/index.js";

function normalizeSlashes(p: string) {
    return p.replace(/\\/g, "/");
}

const simplifyPathTests: [string, string][] = [
    [os.homedir(), os.homedir()],
    [path.join(os.homedir(), "foo", "bar", "Herebyfile.js"), "~/foo/bar/Herebyfile.js"],
    [`${os.homedir()}////foo/bar/../bar/Herebyfile.js`, "~/foo/bar/Herebyfile.js"],
    [path.dirname(os.homedir()), path.dirname(os.homedir())],
];

for (const [input, expected] of simplifyPathTests) {
    test(input, (t) => {
        t.is(normalizeSlashes(simplifyPath(input)), normalizeSlashes(expected));
    });
}

test("real dependencies", (t) => {
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

const prettyMillisecondsTests: [number, string][] = [
    // Sub-second
    [0, "0ms"],
    [1, "1ms"],
    [0.1, "1ms"],
    [15, "15ms"],
    [150, "150ms"],
    [999, "999ms"],
    // Seconds
    [1000, "1s"],
    [1500, "1.5s"],
    [5432, "5.4s"],
    [59_999, "59.9s"],
    // Minutes
    [60_000, "1m"],
    [61_500, "1m 1.5s"],
    [125_000, "2m 5s"],
    // Hours
    [3_600_000, "1h"],
    [3_661_000, "1h 1m 1s"],
    [7_200_000, "2h"],
];

for (const [input, expected] of prettyMillisecondsTests) {
    test(`prettyMilliseconds(${input})`, (t) => {
        t.is(prettyMilliseconds(input), expected);
    });
}

const findSimilarTests: [string, string[], string | undefined][] = [
    // Threshold = ceil(len * 0.4); a candidate matches when its edit distance is strictly less.
    // Typo correction within threshold.
    ["buld", ["build", "test", "lint"], "build"],
    ["tes", ["build", "test", "lint"], "test"],
    // Picks the first candidate at the minimum distance on ties.
    ["buil", ["build", "built", "lint"], "build"],
    ["buil", ["lint", "built", "build"], "built"],
    // No candidate within threshold.
    ["completely-different", ["build", "test"], undefined],
    // Empty inputs.
    ["build", [], undefined],
    ["", ["build"], undefined],
    ["build", [""], undefined],
    // Exact match.
    ["build", ["build", "test"], "build"],
];

for (const [target, candidates, expected] of findSimilarTests) {
    test(`findSimilar(${JSON.stringify(target)}, ${JSON.stringify(candidates)})`, (t) => {
        t.is(findSimilar(target, candidates), expected);
    });
}

test("findSimilar accepts iterables", (t) => {
    const tasks = new Map([["build", 1], ["test", 2]]);
    t.is(findSimilar("buld", tasks.keys()), "build");
});
