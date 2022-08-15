import test from "ava";
import { write } from "fs";
import { It, Mock, Times } from "moq.ts";

import { createSystem, ExitCodeError, Process, UserError } from "../cli/utils.js";
import { Task, task } from "../index.js";
import { forEachTask } from "../utils.js";

test("forEachTask visits each once", (t) => {
    const a = task({
        name: "a",
        run: async () => {},
    });

    const b = task({
        name: "b",
        dependencies: [a],
    });

    const c = task({
        name: "c",
        dependencies: [b],
    });

    const d = task({
        name: "d",
        dependencies: [c],
    });

    const e = task({
        name: "e",
        dependencies: [a, b],
    });

    const f = task({
        name: "f",
        dependencies: [e, c],
    });

    const counts = new Map<Task, number>();

    forEachTask([d, f], (task) => {
        const x = counts.get(task) ?? 0;
        counts.set(task, x + 1);
    });

    const allTasks = [a, b, c, d, e, f];

    for (const task of allTasks) {
        t.is(counts.get(task), 1);
        counts.delete(task);
    }

    t.is(counts.size, 0);
});

test("UserError", (t) => {
    const e = new UserError("message");
    t.is(e.message, "message");
});

test("ExitCodeError", (t) => {
    const e = new ExitCodeError(1);
    t.is(e.exitCode, 1);
});

test("createSystem logging", (t) => {
    const stdoutMock = new Mock<Process["stdout"]>()
        .setup((instance) => instance.write(It.IsAny() as string))
        .returns(true);
    const stderrMock = new Mock<Process["stderr"]>()
        .setup((instance) => instance.write(It.IsAny() as string))
        .returns(true);

    const processMock = new Mock<Process>()
        .setup((instance) => instance.stdout)
        .returns(stdoutMock.object())
        .setup((instance) => instance.stderr)
        .returns(stderrMock.object());

    const system = createSystem(processMock.object());

    system.log("log");
    system.error("error");

    stdoutMock.verify((instance) => instance.write(It.Is((v) => v === "log\n")), Times.Once());
    stderrMock.verify((instance) => instance.write(It.Is((v) => v === "error\n")), Times.Once());

    t.pass();
});
