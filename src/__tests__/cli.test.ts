import test from "ava";
import { execaNode } from "execa";
import { fileURLToPath } from "url";

const cliPath = fileURLToPath(new URL("../cli.js", import.meta.url));

test("run cli", async (t) => {
    // Coverage carries through to children; run and check that it doesn't break.
    await execaNode(cliPath, ["--help"]);
    t.pass();
});
