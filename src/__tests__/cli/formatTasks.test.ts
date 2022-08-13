import anyTest, { TestFn } from "ava";

import { formatTasks } from "../../cli/formatTasks.js";
import { task } from "../../index.js";

interface TestContext {
    columns: number;
    isTTY: boolean;
}

const test = anyTest as TestFn<TestContext>;

// All tests are serial as we are modifying process.stdout.

test.serial.before((t) => {
    t.context.columns = process.stdout.columns;
    t.context.isTTY = process.stdout.isTTY;
});

test.serial.after((t) => {
    // TODO: Is this cleanup needed? Does ava run this file in its own process?
    process.stdout.columns = t.context.columns;
    process.stdout.isTTY = t.context.isTTY;
});

test.serial("printTasks", (t) => {
    const a = task({
        name: "a",
        description: "This is task a. It works pretty well.",
    });

    const b = task({
        name: "b",
        dependencies: [a],
    });

    const c = task({
        name: "c",
        description: "This is task c. ".repeat(10),
        dependencies: [a, b],
    });

    const d = task({
        name: "d",
    });

    const output = formatTasks([a, c, d], d);
    t.snapshot(output);
});
