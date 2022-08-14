import test from "ava";
import esmock from "esmock";
import { fileURLToPath } from "url";

import type * as reexec from "../../cli/reexec.js";

const cliIndexPath = new URL("../../cli/index.js", import.meta.url).toString();
const wrongCliIndexPath = new URL("../../other/cli/index.js", import.meta.url).toString();
const herebyfilePath = fileURLToPath(new URL("./fixtures/normal.mjs", import.meta.url));

test("no re-exec", async (t) => {
    let callCount = 0;

    // This is a workaround for a bug in esmock; esmock appears to follow
    // source maps, so I pass "../../cli/reexec.js" directly, it uses src/...
    // rather than dist/...
    //
    // TODO: Remove once https://github.com/iambumblehead/esmock/issues/113 is fixed.
    const modulePath = new URL("../../cli/reexec.js", import.meta.url);
    const reexecModule: typeof reexec = await esmock(fileURLToPath(modulePath), {
        "foreground-child": {
            default: () => {
                throw new Error("Should not be called.");
            },
        },
        "import-meta-resolve": {
            resolve: async () => {
                callCount++;
                switch (callCount) {
                    case 1:
                        return cliIndexPath;
                    case 2:
                        return cliIndexPath;
                    default:
                        throw new Error("too many calls");
                }
            },
        },
    });

    const returnNow = await reexecModule.reexec(herebyfilePath);
    t.false(returnNow);
});

test("re-exec", async (t) => {
    let callCount = 0;

    // This is a workaround for a bug in esmock; esmock appears to follow
    // source maps, so I pass "../../cli/reexec.js" directly, it uses src/...
    // rather than dist/...
    //
    // TODO: Remove once https://github.com/iambumblehead/esmock/issues/113 is fixed.
    const modulePath = new URL("../../cli/reexec.js", import.meta.url);
    const reexecModule: typeof reexec = await esmock(fileURLToPath(modulePath), {
        "foreground-child": {
            default: () => {},
        },
        "import-meta-resolve": {
            resolve: async () => {
                callCount++;
                switch (callCount) {
                    case 1:
                        return cliIndexPath;
                    case 2:
                        return wrongCliIndexPath;
                    default:
                        throw new Error("too many calls");
                }
            },
        },
    });

    const returnNow = await reexecModule.reexec(herebyfilePath);
    t.true(returnNow);
});
