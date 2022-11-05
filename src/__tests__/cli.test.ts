import test from "ava";
import { execaNode } from "execa";
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
