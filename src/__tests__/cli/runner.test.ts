import test from "ava";

import { Runner, type RunnerD } from "../../cli/runner.js";
import { Task, task } from "../../index.js";
import { mock } from "../__helpers__/index.js";

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

    const dMock = mock<RunnerD>(t)
        .setup((d) => d.log)
        .returns((m) => log.push(["log", m]))
        .setup((d) => d.error)
        .returns((m) => log.push(["error", m]))
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new Runner(dMock.object());

    await t.throwsAsync(async () => {
        await runner.runTasks(d);
    });

    t.snapshot(log, "log");
});

class TestRunner extends Runner {
    override async runTasks(...tasks: Task[]): Promise<void> {
        for (const [i, task] of tasks.entries()) {
            this.onTaskStart(task);

            if (i % 2 === 0) {
                this.onTaskFinish(task);
            } else {
                this.onTaskError(task, new Error("test error"));
            }
        }
    }
}

test("runner direct", async (t) => {
    const log: any[] = [];

    const dMock = mock<RunnerD>(t)
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

test("basic use", async (t) => {
    let aRun = 0;
    let bRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
        },
    });

    const b = task({
        name: "b",
        run: async () => {
            bRun++;
        },
    });

    const dMock = mock<RunnerD>(t)
        .setup((d) => d.log)
        .returns(() => {})
        .setup((d) => d.error)
        .returns(() => {})
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new Runner(dMock.object());

    await runner.runTasks(a, b);

    t.is(aRun, 1);
    t.is(bRun, 1);
});

test("multiple calls", async (t) => {
    let aRun = 0;
    let bRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun++;
        },
    });

    const dMock = mock<RunnerD>(t)
        .setup((d) => d.log)
        .returns(() => {})
        .setup((d) => d.error)
        .returns(() => {})
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new Runner(dMock.object());

    const aPromise = runner.runTasks(a);
    const aPromise2 = runner.runTasks(a);
    const bPromise = runner.runTasks(b);

    await aPromise;
    await aPromise2;
    await bPromise;

    t.is(aRun, 1);
    t.is(bRun, 1);
});

test("dependencies", async (t) => {
    let aRun = 0;
    let bRun = 0;
    let cRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            t.is(bRun, 0);
            t.is(cRun, 0);
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun++;
            t.is(aRun, 1);
            t.is(cRun, 0);
        },
    });

    const c = task({
        name: "c",
        dependencies: [b],
        run: async () => {
            cRun++;
            t.is(aRun, 1);
            t.is(bRun, 1);
        },
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const dMock = mock<RunnerD>(t)
        .setup((d) => d.log)
        .returns(() => {})
        .setup((d) => d.error)
        .returns(() => {})
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new Runner(dMock.object());

    await runner.runTasks(d);

    t.is(aRun, 1);
    t.is(bRun, 1);
    t.is(cRun, 1);
});

test("dependencies with thrown error", async (t) => {
    let aRun = 0;
    let bRun = 0;
    let cRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            t.is(bRun, 0);
            t.is(cRun, 0);
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun++;
            t.is(aRun, 1);
            t.is(cRun, 0);
            throw new Error("Oops");
        },
    });

    const c = task({
        name: "c",
        dependencies: [b],
        run: async () => {
            cRun++;
            t.is(aRun, 1);
            t.is(bRun, 1);
        },
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const dMock = mock<RunnerD>(t)
        .setup((d) => d.log)
        .returns(() => {})
        .setup((d) => d.error)
        .returns(() => {})
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new Runner(dMock.object());

    await t.throwsAsync(runner.runTasks(d));

    t.is(aRun, 1);
    t.is(bRun, 1);
    t.is(cRun, 0);
});

test("sibling tasks and thrown error", async (t) => {
    let aRun = 0;
    let bRun = 0;
    let cRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            throw new Error("Oops");
        },
    });

    const b = task({
        name: "b",
        run: async () => {
            bRun++;
        },
    });

    const c = task({
        name: "c",
        dependencies: [a, b],
        run: async () => {
            cRun++;
        },
    });

    const dMock = mock<RunnerD>(t)
        .setup((d) => d.log)
        .returns(() => {})
        .setup((d) => d.error)
        .returns(() => {})
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    const runner = new Runner(dMock.object());

    await t.throwsAsync(runner.runTasks(c));

    t.is(aRun, 1);
    t.is(bRun, 1);
    t.is(cRun, 0);
});
