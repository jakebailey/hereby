import test from "ava";
import path from "path";
import { fileURLToPath } from "url";

import { selectTasks } from "../../cli/index.js";
import { loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { UserError } from "../../cli/utils.js";

const fixturesPath = fileURLToPath(new URL("./fixtures", import.meta.url));

test("selectTasks single", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "normal.mjs"));

    const tasks = selectTasks(herebyfile, ["runSomeProgram"]);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks multiple", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "normal.mjs"));

    const tasks = selectTasks(herebyfile, ["runSomeProgram", "buildCompiler"]);
    t.is(tasks.length, 2);
    t.is(tasks[0].options.name, "runSomeProgram");
    t.is(tasks[1].options.name, "buildCompiler");
});

test("selectTasks default", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "normal.mjs"));

    const tasks = selectTasks(herebyfile, undefined);
    t.is(tasks.length, 1);
    t.is(tasks[0].options.name, "runSomeProgram");
});

test("selectTasks missing", async (t) => {
    const herebyfile = await loadHerebyfile(path.join(fixturesPath, "normal.mjs"));

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
