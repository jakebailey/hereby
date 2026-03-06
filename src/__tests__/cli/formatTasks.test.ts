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
        const output = formatTasks(format, [a, c, d, hidden], d, 80);
        // eslint-disable-next-line ava/assertion-arguments
        t.snapshot(normalizeOutput(output), format);
    }
});

test("printTasks with empty tasks", (t) => {
    const output = formatTasks("normal", [], undefined, 80);
    t.is(output.trim(), "Available tasks");
});

test("wraps long descriptions across lines", (t) => {
    const a = task({
        name: "a",
        description: "word ".repeat(20).trim(),
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 30);
    t.snapshot(normalizeOutput(output));
});

test("wraps at hyphens in descriptions", (t) => {
    const a = task({
        name: "a",
        description: "compile-and-run-all-the-tests-now",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 35);
    t.snapshot(normalizeOutput(output));
});

test("breaks long words in descriptions", (t) => {
    const a = task({
        name: "a",
        description: "supercalifragilisticexpialidocious",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 25);
    t.snapshot(normalizeOutput(output));
});

test("breaks long words after short words", (t) => {
    const a = task({
        name: "a",
        description: "hi supercalifragilisticexpialidocious",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 25);
    t.snapshot(normalizeOutput(output));
});

test("handles multiline descriptions", (t) => {
    const a = task({
        name: "a",
        description: "Line one\nLine two",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 80);
    t.snapshot(normalizeOutput(output));
});

test("handles task with no description", (t) => {
    const a = task({
        name: "a",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 80);
    t.snapshot(normalizeOutput(output));
});

test("formats dependencies in description", (t) => {
    const dep = task({
        name: "dep",
        run: async () => {},
    });

    const main = task({
        name: "main",
        dependencies: [dep],
        run: async () => {},
    });

    const output = formatTasks("normal", [dep, main], undefined, 80);
    t.snapshot(normalizeOutput(output));
});
