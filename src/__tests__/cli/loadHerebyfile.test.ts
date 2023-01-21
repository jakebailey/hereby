import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import test from "ava";
import tmp from "tmp";

import { findHerebyfile, loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { UserError } from "../../cli/utils.js";

const fixturesPath = fileURLToPath(new URL("__fixtures__", import.meta.url));

test("normal file", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "Herebyfile.mjs");

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

test("findHerebyfile", async (t) => {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    t.teardown(tmpdir.removeCallback);
    const dir = tmpdir.name;
    const deepest = path.join(dir, "source", "package", "src", "cli");
    const src = path.join(dir, "source", "package", "src");
    const packageRoot = path.join(dir, "source", "package");
    const expectedHerebyFile = path.join(src, "Herebyfile.mjs");
    const unexpectedHerebyFile = path.join(src, "Herebyfile.js");

    await fs.promises.mkdir(deepest, { recursive: true });
    await fs.promises.writeFile(path.join(packageRoot, "package.json"), "{}");
    await fs.promises.writeFile(expectedHerebyFile, "export {}");

    await t.throwsAsync(async () => await findHerebyfile(dir), {
        instanceOf: UserError,
        message: "Unable to find Herebyfile.",
    });

    await t.throwsAsync(async () => await findHerebyfile(path.join(dir, "source")), {
        instanceOf: UserError,
        message: "Unable to find Herebyfile.",
    });

    await t.throwsAsync(async () => await findHerebyfile(packageRoot), {
        instanceOf: UserError,
        message: "Unable to find Herebyfile.",
    });

    t.is(await findHerebyfile(deepest), expectedHerebyFile);
    t.is(await findHerebyfile(src), expectedHerebyFile);

    await fs.promises.mkdir(path.join(deepest, "Herebyfile.js"));

    await t.throwsAsync(async () => await findHerebyfile(deepest), {
        instanceOf: UserError,
        message: "Herebyfile.js is not a file.",
    });

    await fs.promises.writeFile(unexpectedHerebyFile, "export {}");

    await t.throwsAsync(async () => await findHerebyfile(src), {
        instanceOf: UserError,
        message: "Found more than one Herebyfile: Herebyfile.js, Herebyfile.mjs",
    });
});

test("cycle", async (t) => {
    const herebyfilePath = path.join(fixturesPath, "cycle.mjs");

    await t.throwsAsync(
        async () => {
            await loadHerebyfile(herebyfilePath);
        },
        { instanceOf: UserError, message: 'Task "a" references itself.' },
    );
});
