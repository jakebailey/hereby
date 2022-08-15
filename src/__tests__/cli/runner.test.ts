import test from "ava";
import esmock from "esmock";
import { It, Mock } from "moq.ts";

import type * as runner from "../../cli/runner.js";
import type { System } from "../../cli/utils.js";
import { task } from "../../index.js";
import { fixESMockPath } from "../../testUtils.js";

function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

const a = task({
    name: "a",
    run: async () => {
        await sleep(10);
    },
});

const b = task({
    name: "b",
    dependencies: [a],
    run: async () => {
        await sleep(10);
    },
});

const c = task({
    name: "c",
    dependencies: [b],
    run: async () => {
        throw new Error("oops");
    },
});

const d = task({
    name: "d",
    dependencies: [c],
    run: async () => {
        await sleep(10);
    },
});

test("runner", async (t) => {
    const log: any[] = [];

    const system = new Mock<System>()
        .setup((instance) => instance.numCPUs)
        .returns(8)
        .setup((instance) => instance.log(It.IsAny()))
        .callback(({ args: [m] }) => {
            log.push(["log", m]);
        })
        .setup((instance) => instance.error(It.IsAny()))
        .callback(({ args: [m] }) => {
            log.push(["error", m]);
        });

    const runnerModule: typeof runner = await esmock(fixESMockPath("../../cli/runner.js", import.meta.url), {
        "pretty-ms": {
            default: () => "<pretty-ms>",
        },
    });

    await t.throwsAsync(async () => {
        await runnerModule.runTasksWithCLIRunner(system.object(), d);
    });

    t.snapshot(log, "log");
});
