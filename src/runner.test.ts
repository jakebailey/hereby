import { task } from "./index.js";
import { Runner } from "./runner.js";

test("basic use", async () => {
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

    expect(aRun).toEqual(1);
    expect(bRun).toEqual(1);
});

test("same promise", async () => {
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

    expect(aPromise).toEqual(aPromise2);

    await aPromise;
    await aPromise2;
    await bPromise;

    expect(aRun).toEqual(1);
    expect(bRun).toEqual(1);
});

test("concurrency 1", async () => {
    let aRun = 0;
    let bRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            // Tasks are ordered internally; if concurrency=1, b cannot have run.
            expect(bRun).toEqual(0);
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

    expect(aRun).toEqual(1);
    expect(bRun).toEqual(1);
});

test("dependencies", async () => {
    let aRun = 0;
    let bRun = 0;
    let cRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            expect(bRun).toEqual(0);
            expect(cRun).toEqual(0);
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun++;
            expect(aRun).toEqual(1);
            expect(cRun).toEqual(0);
        },
    });

    const c = task({
        name: "c",
        dependencies: [b],
        run: async () => {
            cRun++;
            expect(aRun).toEqual(1);
            expect(bRun).toEqual(1);
        },
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const runner = new Runner();

    await runner.runTasks(d);

    expect(aRun).toEqual(1);
    expect(bRun).toEqual(1);
    expect(cRun).toEqual(1);
});

test("dependencies with thrown error", async () => {
    let aRun = 0;
    let bRun = 0;
    let cRun = 0;

    const a = task({
        name: "a",
        run: async () => {
            aRun++;
            expect(bRun).toEqual(0);
            expect(cRun).toEqual(0);
        },
    });

    const b = task({
        name: "b",
        dependencies: [a],
        run: async () => {
            bRun++;
            expect(aRun).toEqual(1);
            expect(cRun).toEqual(0);
            throw new Error("Oops");
        },
    });

    const c = task({
        name: "c",
        dependencies: [b],
        run: async () => {
            cRun++;
            expect(aRun).toEqual(1);
            expect(bRun).toEqual(1);
        },
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const runner = new Runner();

    await expect(runner.runTasks(d)).rejects.toThrowError();

    expect(aRun).toEqual(1);
    expect(bRun).toEqual(1);
    expect(cRun).toEqual(0);
});
