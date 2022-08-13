import test from "ava";
import path from "path";
import { fileURLToPath } from "url";

import { loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { UserError } from "../../cli/utils.js";

const testdataPath = fileURLToPath(new URL("./herebyfiles", import.meta.url));

test("normal file", async (t) => {
    const herebyfilePath = path.join(testdataPath, "normal.mjs");

    const herebyfile = await loadHerebyfile(herebyfilePath);
    t.snapshot(herebyfile);
});

test("duplicate export", async (t) => {
    const herebyfilePath = path.join(testdataPath, "duplicate.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: 'Task "a" has been exported twice.' },
    );
});

test("duplicate name", async (t) => {
    const herebyfilePath = path.join(testdataPath, "duplicateNames.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: 'Task "a" was declared twice.' },
    );
});

test("no exports", async (t) => {
    const herebyfilePath = path.join(testdataPath, "noExports.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: "No tasks found. Did you forget to export your tasks?" },
    );
});
