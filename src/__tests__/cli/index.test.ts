import test from "ava";
import { resolve } from "import-meta-resolve";
import { It, Mock } from "moq.ts";
import path from "path";
import { fileURLToPath } from "url";

import { main, selectTasks } from "../../cli/index.js";
import { loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { D, UserError } from "../../cli/utils.js";

const fixturesPath = fileURLToPath(new URL("./__fixtures__", import.meta.url));

test("selectTasks single", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "Herebyfile.mjs"));

    const tasks = selectTasks(herebyfile, ["runSomeProgram"]);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks multiple", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "Herebyfile.mjs"));

    const tasks = selectTasks(herebyfile, ["runSomeProgram", "buildCompiler"]);
    t.is(tasks.length, 2);
    t.is(tasks[0].options.name, "runSomeProgram");
    t.is(tasks[1].options.name, "buildCompiler");
});

test("selectTasks default", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "Herebyfile.mjs"));

    const tasks = selectTasks(herebyfile, undefined);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks missing", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "Herebyfile.mjs"));

    t.throws(() => selectTasks(herebyfile, ["oops"]), {
        instanceOf: UserError,
        message: 'Task "oops" does not exist or is not exported in the Herebyfile.',
    });
});

test("selectTasks missing default", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "noDefault.mjs"));

    t.throws(() => selectTasks(herebyfile, undefined), {
        instanceOf: UserError,
        message: "No default task defined; please specify a task name.",
    });
});

test("main usage", async (t) => {
    t.plan(1);
    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--help"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => t.truthy(message));

    await main(dMock.object());
});

test("main print tasks", async (t) => {
    t.plan(3);
    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--tasks"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => t.truthy(message))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath));

    await main(dMock.object());
});

test("main success", async (t) => {
    t.plan(4);
    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "success"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => t.truthy(message))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath))
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>");

    await main(dMock.object());
});

test("main failure", async (t) => {
    t.plan(5);
    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "failure"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => t.truthy(message))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath))
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>")
        .setup((d) => d.error)
        .returns((message) => {
            t.is(message, "Error in failure\nError: failure!");
        })
        .setup((d) => d.setExitCode)
        .returns((code) => {
            t.is(code, 1);
        });

    await main(dMock.object());
});

test("main user error", async (t) => {
    t.plan(4);
    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
        .setup((d) => d.numCPUs)
        .returns(1)
        .setup((d) => d.argv)
        .returns(["node", "cli.js", "--herebyfile", path.join(fixturesPath, "cliTest.mjs"), "oops"])
        .setup((d) => d.cwd)
        .returns(() => fixturesPath)
        .setup((d) => d.log)
        .returns((message) => t.truthy(message))
        .setup((d) => d.resolve)
        .returns(resolve)
        .setup((d) => d.chdir)
        .returns((directory) => t.is(directory, fixturesPath))
        .setup((d) => d.prettyMilliseconds)
        .returns(() => "<pretty-ms>")
        .setup((d) => d.error)
        .returns((message) => {
            t.is(message, 'Error: Task "oops" does not exist or is not exported in the Herebyfile.');
        })
        .setup((d) => d.setExitCode)
        .returns((code) => {
            t.is(code, 1);
        });

    await main(dMock.object());
});

test("main random throw", async (t) => {
    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
        .setup((d) => d.argv)
        .throws(new Error("test error"));

    await t.throwsAsync(() => main(dMock.object()), {
        message: "test error",
    });
});

test("main reexec", async (t) => {
    t.plan(2);

    let callCount = 0;
    const cliIndexURL = new URL("../../cli/index.js", import.meta.url).toString();
    const wrongCliIndexURL = new URL("../../other/cli/index.js", import.meta.url).toString();

    const dMock = new Mock<D>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `${String(name)} not implemented`;
            t.fail(message);
            throw new Error(message);
        })
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
        .setup((d) => d.error)
        .returns((m) => t.truthy(m))
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
