import test from "ava";
import esmock from "esmock";
import { It, Mock } from "moq.ts";

import type * as runner from "../../cli/runner.js";
import type { System } from "../../cli/utils.js";
import { Task, task } from "../../index.js";
import { Runner } from "../../runner.js";
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

const a2 = task({
    name: "a2",
    run: async () => {
        await sleep(10);
    },
});

const b2 = task({
    name: "b2",
    dependencies: [a2],
    run: async () => {
        await sleep(10);
    },
});

const c2 = task({
    name: "c2",
    dependencies: [b2],
    run: async () => {
        await sleep(10);
    },
});

const d = task({
    name: "d",
    dependencies: [c, c2],
    run: async () => {
        await sleep(10);
    },
});

test("runner", async (t) => {
    const log: any[] = [];

    const system = new Mock<System>()
        .setup((instance) => instance.numCPUs)
        .returns(1)
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

class FakeRunner extends Runner {
    override async runTasks(...tasks: Task[]): Promise<void> {
        for (let i = 0; i < tasks.length; i++) {
            const task = tasks[i];

            this.onTaskAdd?.(task);
            this.onTaskStart?.(task);

            if (i % 2 === 0) {
                this.onTaskFinish?.(task);
            } else {
                this.onTaskError?.(task, new Error("test error"));
            }
        }
    }
}

test("runner direct", async (t) => {
    const log: any[] = [];

    const system = new Mock<System>()
        .setup((instance) => instance.numCPUs)
        .returns(1)
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
        [fixESMockPath("../../runner.js", import.meta.url)]: {
            Runner: FakeRunner,
        },
    });

    await runnerModule.runTasksWithCLIRunner(system.object(), a, a2, b, c, d);
    t.snapshot(log, "log");
});
