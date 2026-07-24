import { formatTasks } from "../../cli/formatTasks.js";
import { task } from "../../index.js";
import { normalizeOutput } from "../__helpers__/index.js";
import { test } from "../__runner__/index.js";
import { stripAnsi } from "../__runner__/stripAnsi.js";

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
        t.snapshot(normalizeOutput(output), format);
    }
});

test("printTasks with empty tasks", (t) => {
    const output = formatTasks("normal", [], undefined, 80);
    t.is(normalizeOutput(output).trim(), "Available tasks");
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

test("handles very narrow columns", (t) => {
    const a = task({
        name: "a",
        description: "description",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 5);
    t.regex(normalizeOutput(output), /Available tasks[\s\S]*a/);
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

test("handles astral characters in task names", (t) => {
    // Long tokens are chunked by code point, but widths are measured in UTF-16
    // code units, so astral characters can overshoot the column width.
    const a = task({
        name: "😀".repeat(20),
        description: "description",
        run: async () => {},
    });

    const output = formatTasks("normal", [a], undefined, 80);
    t.snapshot(normalizeOutput(output));
});

test("does not emit trailing whitespace", (t) => {
    const a = task({
        name: "a",
        run: async () => {},
    });

    const b = task({
        name: "b",
        description: "This is task b.",
        run: async () => {},
    });

    // Note: deliberately not normalized, as normalizeOutput strips trailing whitespace.
    const output = stripAnsi(formatTasks("normal", [a, b], a, 80));
    t.false(/[ \t]+$/m.test(output), `Output has trailing whitespace: ${JSON.stringify(output)}`);
});
