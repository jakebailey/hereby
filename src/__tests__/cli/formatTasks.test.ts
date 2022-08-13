import test from "ava";

import { formatTasks } from "../../cli/formatTasks.js";
import { task } from "../../index.js";

test("printTasks", (t) => {
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
