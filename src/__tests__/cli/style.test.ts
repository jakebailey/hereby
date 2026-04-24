import test from "ava";

import { isColorEnabled, wrap } from "../../cli/style.js";

const cases: [string, NodeJS.ProcessEnv, boolean, NodeJS.Platform, boolean][] = [
    ["NO_COLOR disables", { NO_COLOR: "1", FORCE_COLOR: "1", CI: "1" }, true, "linux", false],
    ["NO_COLOR empty string does not disable", { NO_COLOR: "", CI: "1" }, false, "linux", true],
    ["FORCE_COLOR=0 disables", { FORCE_COLOR: "0" }, true, "linux", false],
    ["FORCE_COLOR=false disables", { FORCE_COLOR: "false" }, true, "linux", false],
    ["FORCE_COLOR=1 enables", { FORCE_COLOR: "1" }, false, "linux", true],
    ["FORCE_COLOR=true enables", { FORCE_COLOR: "true" }, false, "linux", true],
    ["TTY enables", {}, true, "linux", true],
    ["TTY + TERM=dumb disables", { TERM: "dumb" }, true, "linux", false],
    ["CI enables without TTY", { CI: "true" }, false, "linux", true],
    ["CI empty string does not enable", { CI: "" }, false, "linux", false],
    ["win32 enables without TTY", {}, false, "win32", true],
    ["win32 still respects NO_COLOR", { NO_COLOR: "1" }, true, "win32", false],
    ["no env, no TTY, non-win32 disables", {}, false, "linux", false],
];

for (const [name, env, isTTY, platform, expected] of cases) {
    test(name, (t) => {
        t.is(isColorEnabled(env, isTTY, platform), expected);
    });
}

test("wrap enabled wraps with open/close", (t) => {
    t.is(wrap(true, "<", ">")("x"), "<x>");
});

test("wrap disabled returns input unchanged", (t) => {
    t.is(wrap(false, "<", ">")("x"), "x");
});
