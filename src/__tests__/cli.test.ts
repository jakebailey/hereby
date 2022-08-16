import test from "ava";
import esmock from "esmock";

import type { System } from "../cli/utils.js";
import { fixESMockPath } from "../testUtils.js";

// TODO: fixESMockPath doesn't work on Windows; remove once the bug is fixed.
const testSkipIfWindows = process.platform !== "win32" ? test : test.skip;

testSkipIfWindows("runs main", async (t) => {
    await esmock(fixESMockPath("../cli.js", import.meta.url), {
        [fixESMockPath("../cli/index.js", import.meta.url)]: {
            main: async (system: System) => {
                t.is(system.process, process);
            },
        },
    });
});
