import { task } from "../index.js";
import { Runner } from "../runner.js";

test("basic use", async () => {
    let aRun = false;
    let bRun = false;

    const a = task({
        name: "a",
        run: async () => {
            aRun = true;
        },
    });

    const b = task({
        name: "b",
        run: async () => {
            bRun = true;
        },
    });

    const runner = new Runner();

    await runner.runTasks(a, b);

    expect(aRun).toEqual(true);
    expect(bRun).toEqual(true);
});

test("same promise", async () => {
    let aRun = false;
    let bRun = false;

    const a = task({
        name: "a",
        run: async () => {
            aRun = true;
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun = true;
        },
    });

    const runner = new Runner();

    const aPromise = runner.runTask(a);
    const aPromise2 = runner.runTask(a);
    const bPromise = runner.runTask(b);

    expect(aPromise).toEqual(aPromise2);

    await aPromise;
    await aPromise2;
    await bPromise;

    expect(aRun).toEqual(true);
    expect(bRun).toEqual(true);
});

test("concurrency 1", async () => {
    let aRun = false;
    let bRun = false;

    const a = task({
        name: "a",
        run: async () => {
            aRun = true;
            // Tasks are ordered internally; if concurrency=1, b cannot have run.
            expect(bRun).toEqual(false);
        },
    });

    const b = task({
        name: "b",
        run: async () => {
            bRun = true;
        },
    });

    const runner = new Runner({ concurrency: 1 });

    await runner.runTasks(a, b);

    expect(aRun).toEqual(true);
    expect(bRun).toEqual(true);
});

test("dependencies", async () => {
    let aRun = false;
    let bRun = false;
    let cRun = false;

    const a = task({
        name: "a",
        run: async () => {
            aRun = true;
            expect(bRun).toEqual(false);
            expect(cRun).toEqual(false);
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun = true;
            expect(aRun).toEqual(true);
            expect(cRun).toEqual(false);
        },
    });

    const c = task({
        name: "c",
        dependencies: [b],
        run: async () => {
            cRun = true;
            expect(aRun).toEqual(true);
            expect(bRun).toEqual(true);
        },
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const runner = new Runner();

    await runner.runTask(d);

    expect(aRun).toEqual(true);
    expect(bRun).toEqual(true);
    expect(cRun).toEqual(true);
});

test("dependencies with thrown error", async () => {
    let aRun = false;
    let bRun = false;
    let cRun = false;

    const a = task({
        name: "a",
        run: async () => {
            aRun = true;
            expect(bRun).toEqual(false);
            expect(cRun).toEqual(false);
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun = true;
            expect(aRun).toEqual(true);
            expect(cRun).toEqual(false);
            throw new Error("Oops");
        },
    });

    const c = task({
        name: "c",
        dependencies: [b],
        run: async () => {
            cRun = true;
            expect(aRun).toEqual(true);
            expect(bRun).toEqual(true);
        },
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const runner = new Runner();

    await expect(runner.runTask(d)).rejects.toThrowError();

    expect(aRun).toEqual(true);
    expect(bRun).toEqual(true);
    expect(cRun).toEqual(false);
});
