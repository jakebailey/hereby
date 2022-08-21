import test from "ava";
import fs from "fs/promises";
import path from "path";
import { temporaryDirectory } from "tempy";
import { fileURLToPath } from "url";

import { findHerebyfile, loadHerebyfile } from "../../cli/loadHerebyfile.js";
import { UserError } from "../../cli/utils.js";

const fixturesPath = fileURLToPath(new URL("./fixtures", import.meta.url));

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
    const dir = temporaryDirectory();
    const deepest = path.join(dir, "source", "package", "src", "cli");
    const src = path.join(dir, "source", "package", "src");
    const packageRoot = path.join(dir, "source", "package");
    const expectedHerebyFile = path.join(src, "Herebyfile.mjs");
    const unexpectedHerebyFile = path.join(src, "Herebyfile.js");

    await fs.mkdir(deepest, { recursive: true });
    await fs.writeFile(path.join(packageRoot, "package.json"), "{}");
    await fs.writeFile(expectedHerebyFile, "export {}");

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

    await fs.mkdir(path.join(deepest, "Herebyfile.js"));

    await t.throwsAsync(async () => await findHerebyfile(deepest), {
        instanceOf: UserError,
        message: "Herebyfile.js is not a file.",
    });

    await fs.writeFile(unexpectedHerebyFile, "export {}");

    await t.throwsAsync(async () => await findHerebyfile(src), {
        instanceOf: UserError,
        message: "Found more than one Herebyfile: Herebyfile.js, Herebyfile.mjs",
    });
});
