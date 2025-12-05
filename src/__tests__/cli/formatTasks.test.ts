import test from "ava";

import { formatTasks } from "../../cli/formatTasks.js";
import { task } from "../../index.js";
import { normalizeOutput } from "../__helpers__/index.js";

test("printTasks", (t) => {
    const hidden = task({
        name: "hidden",
        description: "This task is hidden",
        run: async () => {},
        hiddenFromTaskList: true,
    });

    const a = task({
        name: "a",
        description: "This is task a. It works pretty well.",
        run: async () => {},
    });

    const b = task({
        name: "b",
        dependencies: [a],
    });

    const c = task({
        name: "c",
        description: "This is task c. ".repeat(10),
        dependencies: [a, b, hidden],
    });

    const d = task({
        name: "d",
        dependencies: [hidden],
        run: async () => {},
    });

    for (const format of ["normal", "simple"] as const) {
        const output = formatTasks(format, [a, c, d, hidden], d);
        // eslint-disable-next-line ava/assertion-arguments
        t.snapshot(normalizeOutput(output), format);
    }
});
