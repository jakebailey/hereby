import test from "ava";
import { resolve } from "import-meta-resolve";
import path from "path";
import { fileURLToPath } from "url";

import { main, selectTasks } from "../../cli/index.js";
import { loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { D, UserError } from "../../cli/utils.js";
import { mock } from "../__helpers__/index.js";

const fixturesPath = fileURLToPath(new URL("./__fixtures__", import.meta.url));

function fakeSimplifyPath(p: string): string {
    return `~/simplified/${path.basename(p)}`;
}

test("selectTasks single", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    const tasks = selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, ["runSomeProgram"]);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks multiple", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    const tasks = selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, [
        "runSomeProgram",
        "buildCompiler",
    ]);
    t.is(tasks.length, 2);
    t.is(tasks[0].options.name, "runSomeProgram");
    t.is(tasks[1].options.name, "buildCompiler");
});

test("selectTasks default", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    const tasks = selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, undefined);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks missing", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    t.throws(() => selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, ["oops"]), {
        instanceOf: UserError,
        message: 'Task "oops" does not exist or is not exported from ~/simplified/Herebyfile.mjs.',
    });
});

test("selectTasks missing did you mean", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    t.throws(() => selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, ["buildcompiler"]), {
        instanceOf: UserError,
        message:
            'Task "buildcompiler" does not exist or is not exported from ~/simplified/Herebyfile.mjs. Did you mean "buildCompiler"?',
    });
});

test("selectTasks missing default", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "noDefault.mjs");
    const herebyfile = await loadHerebyfile(herebyfilePath);

    t.throws(() => selectTasks({ simplifyPath: fakeSimplifyPath }, herebyfile, herebyfilePath, undefined), {
        instanceOf: UserError,
        message: "No default task has been exported from ~/simplified/noDefault.mjs; please specify a task name.",
    });
});

test("main usage", async (t) => {
    t.plan(1);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--help"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => log.push(["log", message.replace(/\r/g, "")]));

    await main(dMock.object());

    t.snapshot(log);
});

test("main print tasks", async (t) => {
    t.plan(2);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--tasks"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => log.push(["log", message.replace(/\r/g, "")]))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath));

    await main(dMock.object());

    t.snapshot(log);
});

test("main success", async (t) => {
    t.plan(2);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t)
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "success"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => log.push(["log", message.replace(/\r/g, "")]))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath))
        .setup((d) => d.simplifyPath)
        .returns(fakeSimplifyPath)
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    await main(dMock.object());

    t.snapshot(log);
});

test("main failure", async (t) => {
    t.plan(4);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t)
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "failure"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => log.push(["log", message.replace(/\r/g, "")]))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath))
        .setup((d) => d.simplifyPath)
        .returns(fakeSimplifyPath)
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>")
        .setup((d) => d.error)
        .returns((message) => {
            t.is(message, "Error in failure in <pretty-ms>\nError: failure!");
        })
        .setup((d) => d.setExitCode)
        .returns((code) => {
            t.is(code, 1);
        });

    await main(dMock.object());

    t.snapshot(log);
});

test("main user error", async (t) => {
    t.plan(3);

    const log: [fn: "log" | "error", message: string][] = [];

    const dMock = mock<D>(t)
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "oops"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => log.push(["log", message.replace(/\r/g, "")]))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath))
        .setup((d) => d.simplifyPath)
        .returns(fakeSimplifyPath)
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>")
        .setup((d) => d.error)
        .returns((message) => log.push(["error", message.replace(/\r/g, "")]))
        .setup((d) => d.setExitCode)
        .returns((code) => {
            t.is(code, 1);
        });

    await main(dMock.object());

    t.snapshot(log);
});

test("main random throw", async (t) => {
    const dMock = mock<D>(t)
        .setup((d) => d.argv)
        .throws(new Error("test error"));

    await t.throwsAsync(() => main(dMock.object()), {
        message: "test error",
    });
});

test("main reexec", async (t) => {
    t.plan(1);

    let callCount = 0;
    const cliIndexURL = new URL("../../cli/index.js", import.meta.url).toString();
    const wrongCliIndexURL = new URL("../../other/cli/index.js", import.meta.url).toString();

    const dMock = mock<D>(t)
        .setup((d) => d.argv)
        .returns(["node", "cli.js"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.resolve)
        .returns(async () => {
            callCount++;
            switch (callCount) {
                case 1:
                    return cliIndexURL;
                case 2:
                    return wrongCliIndexURL;
                default:
                    t.fail();
                    throw new Error("too many calls");
            }
        })
        .setup((d) => d.execPath)
        .returns("cool")
        .setup((d) => d.execArgv)
        .returns([])
        .setup((d) => d.argv)
        .returns([])
        .setup((d) => d.foregroundChild)
        .returns((program) => {
            t.is(program, "cool");
        });

    await main(dMock.object());
});

test("main print version", async (t) => {
    t.plan(1);
    const version = "1.0.0";
    const dMock = mock<D>(t)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--version"])
        .setup((d) => d.version)
        .returns(version)
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => t.is(message, `hereby ${version}`))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath));

    await main(dMock.object());
});
