import test from "ava";

import { task } from "../index.js";
import { Runner } from "../runner.js";

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

    const runner = new Runner();

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

    const runner = new Runner();

    const aPromise = runner.runTasks(a);
    const aPromise2 = runner.runTasks(a);
    const bPromise = runner.runTasks(b);

    await aPromise;
    await aPromise2;
    await bPromise;

    t.is(aRun, 1);
    t.is(bRun, 1);
});

test("concurrency 1", async (t) => {
    let aRun = 0;
    let bRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            // Tasks are ordered internally; if concurrency=1, b cannot have run.
            t.is(bRun, 0);
        },
    });

    const b = task({
        name: "b",
        run: async () => {
            bRun++;
        },
    });

    const runner = new Runner({ concurrency: 1 });

    await runner.runTasks(a, b);

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

    const runner = new Runner();

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

    const runner = new Runner();

    await t.throwsAsync(runner.runTasks(d));

    t.is(aRun, 1);
    t.is(bRun, 1);
    t.is(cRun, 0);
});
