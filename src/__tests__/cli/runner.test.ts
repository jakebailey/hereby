import test from "ava";
import { Mock } from "moq.ts";

import { CLIRunner, CLIRunnerD } from "../../cli/runner.js";
import { Task, task } from "../../index.js";

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

    const dMock = new Mock<CLIRunnerD>()
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.log)
        .returns((m) => log.push(["log", m]))
        .setup((d) => d.error)
        .returns((m) => log.push(["error", m]))
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new CLIRunner(dMock.object());

    await t.throwsAsync(async () => {
        await runner.runTasks(d);
    });

    t.snapshot(log, "log");
});

class TestRunner extends CLIRunner {
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

    const dMock = new Mock<CLIRunnerD>()
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.log)
        .returns((m) => log.push(["log", m]))
        .setup((d) => d.error)
        .returns((m) => log.push(["error", m]))
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new TestRunner(dMock.object());
    await runner.runTasks(a, a2, b, c, d);
    t.snapshot(log, "log");
});
