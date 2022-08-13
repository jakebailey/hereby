import path from "path";
import { fileURLToPath } from "url";

import { loadHerebyfile } from "./loadHerebyfile.js";

const testdataPath = fileURLToPath(new URL("./__testdata__", import.meta.url));

test("loadHerebyfile", async () => {
    const herebyfilePath = path.join(testdataPath, "normalHerebyfile.mjs");

    const herebyfile = await loadHerebyfile(herebyfilePath);
    expect(herebyfile).toMatchSnapshot("herebyfile");
});
