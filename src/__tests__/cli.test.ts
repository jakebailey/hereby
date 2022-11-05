import test from "ava";
import { execaNode } from "execa";
import fs from "fs";
import path from "path";
import tmp from "tmp";
import { fileURLToPath } from "url";

const cliPath = fileURLToPath(new URL("../cli.js", import.meta.url));

// Coverage carries through to children; run and check that it doesn't break.

test("run cli --help", async (t) => {
    await execaNode(cliPath, ["--help"]);
    t.pass();
});

test("run cli --version", async (t) => {
    await execaNode(cliPath, ["--version"]);
    t.pass();
});

test("run cli reexec", async (t) => {
    const tmpdir = tmp.dirSync({ unsafeCleanup: true });
    t.teardown(tmpdir.removeCallback);
    const dir = tmpdir.name;

    const fakeHereby = path.join(dir, "node_modules", "hereby");
    await fs.promises.mkdir(fakeHereby, { recursive: true });

    await fs.promises.writeFile(
        path.join(fakeHereby, "package.json"),
        JSON.stringify({
            name: "hereby",
            type: "module",
            exports: {
                "./cli": "./fake.js",
            },
        }),
    );

    await fs.promises.writeFile(path.join(fakeHereby, "fake.js"), "console.log('It works!')");

    await fs.promises.writeFile(
        path.join(dir, "package.json"),
        JSON.stringify({
            name: "test",
            type: "module",
        }),
    );

    await fs.promises.writeFile(path.join(dir, "Herebyfile.mjs"), "export {};");

    const { stdout } = await execaNode(cliPath, { cwd: dir });
    t.is(stdout, "It works!");
});
