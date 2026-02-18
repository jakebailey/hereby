import test from "ava";

import { formatAsColumns, wrapText } from "../cli/textWrapping.js";

const RED = "\u001B[31m";
const RESET = "\u001B[0m";

test("splits text at spaces within max width", (t) => {
    const result = wrapText("Long text that should wrap at spaces", 12);
    t.deepEqual(result, ["Long text", "that should", "wrap at", "spaces"]);
});

test("splits text at hyphens", (t) => {
    const result = wrapText("long-word-with-hyphens", 12);
    t.deepEqual(result, ["long-word-", "with-hyphens"]);
});

test("handles single newlines", (t) => {
    const result = wrapText("Line one\nLine two", 15);
    t.deepEqual(result, ["Line one", "Line two"]);
});

test("handles multiple newlines and preserves empty lines", (t) => {
    const result = wrapText("Line one\n\nLine two", 10);
    t.deepEqual(result, ["Line one", "", "Line two"]);
});

test("splits long words correctly", (t) => {
    const result = wrapText("alone supercalifragilisticexpialidocious", 10);
    t.deepEqual(result, ["alone", "supercalif", "ragilistic", "expialidoc", "ious"]);
});

test("handles ANSI colours without breaking visible width", (t) => {
    const result = wrapText(`Long ${RED}red text${RESET} split`, 10);
    t.deepEqual(result, [`Long ${RED}red`, `text${RESET} split`]);
});

test("handles empty strings", (t) => {
    const result = wrapText("", 10);
    t.deepEqual(result, [""]);
});

test("formatAsColumns formats single line correctly", (t) => {
    const output = formatAsColumns("X", "label", 8, "description", 12);
    t.is(output, `Xlabel      description\n`);
});

test("formatAsColumns handles multiple lines correctly", (t) => {
    const output = formatAsColumns("X", "label", 8, "description on two lines", 12);
    const lines = output.split("\n").filter(Boolean); // Skip empty lines
    t.deepEqual(lines, [
        "Xlabel      description",
        "X           on two lines",
    ]);
});
