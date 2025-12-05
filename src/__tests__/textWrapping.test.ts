import test from "ava";
import { wrapText } from "../cli/textWrapping.js";

const RED = "\x1b[31m";
const RESET = "\x1b[0m";

test("splits text at spaces within max width", (t) => {
    const result = wrapText("Long text that should wrap at spaces", 12);
    t.deepEqual(result, ["Long text", "that should", "wrap at", "spaces"]);
});

test("splits text at hyphens", (t) => {
    const result = wrapText("long-word-with-hyphens", 12);
    t.deepEqual(result, ["long-word-", "with-hyphens"]);
});

test("handles multiple newlines and preserves empty lines", (t) => {
    const result = wrapText("Line one\n\nLine two", 10);
    t.deepEqual(result, ["Line one", "", "Line two"]);
});

test("splits long words correctly", (t) => {
    const result = wrapText("supercalifragilisticexpialidocious", 10);
    t.deepEqual(result, ["supercalif", "ragilistic", "expialidoc", "ious"]);
});

test("handles ANSI colours without breaking visible width", (t) => {
    const result = wrapText(`Long ${RED}red text${RESET} split`, 10);
    t.deepEqual(result, [`Long ${RED}red${RESET}`, `${RED}text${RESET} split`]);
});

test("handles long coloured word split correctly", (t) => {
    const coloured = `super${RED}califragilisticexpialidoci${RESET}ous`;
    const result = wrapText(coloured, 10);
    t.deepEqual(result, [
        `super${RED}calif${RESET}`,
        `${RED}ragilistic${RESET}`,
        `${RED}expialidoc${RESET}`,
        `${RED}i${RESET}ous`,
    ]);
});
