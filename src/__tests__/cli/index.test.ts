import path from "node:path";
import { fileURLToPath } from "node:url";

import test from "ava";

import { main, selectTasks } from "../../cli/index.js";
import { loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { type D, UserError } from "../../cli/utils.js";
import { mock, normalizeOutput, normalizeTiming } from "../__helpers__/index.js";

const fixturesPath = fileURLToPath(new URL("__fixtures__", import.meta.url));

function fakeSimplifyPath(p: string): string {
    return `~/simplified/${path.basename(p)}`;
}

test("selectTasks single", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    const tasks = await selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, ["runSomeProgram"]);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks multiple", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);
    const requested = [
        "runSomeProgram",
        "buildCompiler",
    ];

    const tasks = await selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, requested);
    t.is(tasks.length, 2);
    t.is(tasks[0].options.name, requested[0]);
    t.is(tasks[1].options.name, requested[1]);
});

test("selectTasks default", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    const tasks = await selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, []);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks missing", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    await t.throwsAsync(() => selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, ["oops"]), {
        instanceOf: UserError,
        message: 'Task "oops" does not exist or is not exported from ~/simplified/Herebyfile.mjs.',
    });
});

test("selectTasks missing did you mean", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    await t.throwsAsync(
        () => selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, ["buildcompiler"]),
        {
            instanceOf: UserError,
            message:
                'Task "buildcompiler" does not exist or is not exported from ~/simplified/Herebyfile.mjs. Did you mean "buildCompiler"?',
        },
    );
});

test("selectTasks missing default", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "noDefault.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    await t.throwsAsync(() => selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, []), {
        instanceOf: UserError,
        message: "No default task has been exported from ~/simplified/noDefault.mjs; please specify a task name.",
    });
});

test("main usage", async (t) => {
    t.plan(1);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--help"],
        cwd: () => fixturesPath,
        log: (message) => log.push(["log", normalizeOutput(message)]),
    });

    await main(dMock);

    t.snapshot(log);
});

test("main print tasks", async (t) => {
    t.plan(2);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--tasks"],
        cwd: () => fixturesPath,
        log: (message) => log.push(["log", normalizeOutput(message)]),
        chdir: (directory) => t.is(directory, fixturesPath),
        columns: () => 80,
    });

    await main(dMock);

    t.snapshot(log);
});

test("main success", async (t) => {
    t.plan(2);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "success"],
        cwd: () => fixturesPath,
        log: (message) => log.push(["log", normalizeTiming(normalizeOutput(message))]),
        chdir: (directory) => t.is(directory, fixturesPath),
        simplifyPath: fakeSimplifyPath,
    });

    await main(dMock);

    t.snapshot(log);
});

test("main failure", async (t) => {
    t.plan(4);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "failure"],
        cwd: () => fixturesPath,
        log: (message) => log.push(["log", normalizeTiming(normalizeOutput(message))]),
        chdir: (directory) => t.is(directory, fixturesPath),
        simplifyPath: fakeSimplifyPath,
        error: (message) => {
            t.regex(message, /^Error in failure in \d/);
        },
        setExitCode: (code) => {
            t.is(code, 1);
        },
    });

    await main(dMock);

    t.snapshot(log);
});

test("multi failure", async (t) => {
    t.plan(4);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "multiple:failures"],
        cwd: () => fixturesPath,
        log: (message) => log.push(["log", normalizeTiming(normalizeOutput(message))]),
        chdir: (directory) => t.is(directory, fixturesPath),
        simplifyPath: fakeSimplifyPath,
        error: (message) => {
            t.regex(message, /^Error in failure in \d/);
        },
        setExitCode: (code) => {
            t.is(code, 1);
        },
    });

    await main(dMock);

    t.snapshot(log);
});

test("main user error", async (t) => {
    t.plan(3);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "oops"],
        cwd: () => fixturesPath,
        log: (message) => log.push(["log", normalizeTiming(normalizeOutput(message))]),
        chdir: (directory) => t.is(directory, fixturesPath),
        simplifyPath: fakeSimplifyPath,
        error: (message) => log.push(["error", normalizeOutput(message)]),
        setExitCode: (code) => {
            t.is(code, 1);
        },
    });

    await main(dMock);

    t.snapshot(log);
});

test("main random throw", async (t) => {
    t.plan(4);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        get argv(): never {
            throw new Error("test error");
        },
        error: (message) => log.push(["error", normalizeOutput(message)]),
        setExitCode: (code) => {
            t.is(code, 1);
        },
    });

    await main(dMock);

    t.is(log[0][0], "error");
    t.true(log[0][1].includes("test error"));
    t.true(log[0][1].includes("index.test"));
});

test("main random throw no stack", async (t) => {
    t.plan(4);

    const log: [fn: "log" | "error", message: string][] = [];

    const error = new Error("test error");
    delete error.stack;

    const dMock = mock<D>(t, {
        get argv(): never {
            throw error;
        },
        error: (message) => log.push(["error", normalizeOutput(message)]),
        setExitCode: (code) => {
            t.is(code, 1);
        },
    });

    await main(dMock);

    t.is(log[0][0], "error");
    t.true(log[0][1].includes("test error"));
    t.false(log[0][1].includes("index.test"));
});

test("main random throw primitive", async (t) => {
    t.plan(3);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t, {
        get argv(): never {
            throw 1234;
        },
        error: (message) => log.push(["error", normalizeOutput(message)]),
        setExitCode: (code) => {
            t.is(code, 1);
        },
    });

    await main(dMock);

    t.is(log[0][0], "error");
    t.true(log[0][1].includes("1234"));
});

test("main print version", async (t) => {
    t.plan(1);
    const version = "1.0.0";
    const dMock = mock<D>(t, {
        argv: ["node", "cli.js", "--version"],
        version: () => version,
        cwd: () => fixturesPath,
        log: (message) => t.is(message, `hereby ${version}`),
        chdir: (directory) => t.is(directory, fixturesPath),
    });

    await main(dMock);
});
