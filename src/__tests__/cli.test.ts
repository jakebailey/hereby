import test from "ava";
import esmock from "esmock";

import type { System } from "../cli/utils.js";
import { fixESMockPath } from "../testUtils.js";

test("runs main", async (t) => {
    await esmock(fixESMockPath("../cli.js", import.meta.url), {
        [fixESMockPath("../cli/index.js", import.meta.url)]: {
            main: async (system: System) => {
                // eslint-disable-next-line no-restricted-globals
                t.is(system.process, process);
            },
        },
    });
});
