import test from "ava";

import { Task, task } from "../index.js";
import { forEachTask } from "../utils.js";

test("visits each once", (t) => {
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
