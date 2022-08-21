import test from "ava";
import { execa } from "execa";
import { fileURLToPath } from "url";

const cliPath = fileURLToPath(new URL("../cli.js", import.meta.url));

test("run cli", async (t) => {
    // Coverage carries through to children; run and check that it doesn't break.
    // eslint-disable-next-line no-restricted-globals
    await execa(process.execPath, [cliPath, "--help"]);
    t.pass();
});
