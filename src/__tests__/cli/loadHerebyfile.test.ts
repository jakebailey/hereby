import test from "ava";
import path from "path";
import { fileURLToPath } from "url";

import { loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { UserError } from "../../cli/utils.js";

const fixturesPath = fileURLToPath(new URL("./fixtures", import.meta.url));

test("normal file", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "normal.mjs");

    const herebyfile = await loadHerebyfile(herebyfilePath);
    t.snapshot(herebyfile);
});

test("duplicate export", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "duplicate.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: 'Task "a" has been exported twice.' },
    );
});

test("duplicate name", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "duplicateNames.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: 'Task "a" was declared twice.' },
    );
});

test("no exports", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "noExports.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: "No tasks found. Did you forget to export your tasks?" },
    );
});
