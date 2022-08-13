import test from "ava";
import path from "path";
import { fileURLToPath } from "url";

import { loadHerebyfile } from "../../cli/loadHerebyfile.js";

const testdataPath = fileURLToPath(new URL("./herebyfiles", import.meta.url));

test("loadHerebyfile", async (t) => {
    const herebyfilePath = path.join(testdataPath, "normal.mjs");

    const herebyfile = await loadHerebyfile(herebyfilePath);
    t.snapshot(herebyfile);
});
