import test from "ava";
import esmock from "esmock";
import { It, Mock, Times } from "moq.ts";
import { fileURLToPath } from "url";

import type * as reexec from "../../cli/reexec.js";
import type { System } from "../../cli/utils.js";

const cliIndexPath = new URL("../../cli/index.js", import.meta.url).toString();
const wrongCliIndexPath = new URL("../../other/cli/index.js", import.meta.url).toString();
const herebyfilePath = fileURLToPath(new URL("./fixtures/normal.mjs", import.meta.url));

test("no re-exec", async (t) => {
    let callCount = 0;

    const systemMock = new Mock<System>();

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

    const returnNow = await reexecModule.reexec(systemMock.object(), herebyfilePath);
    t.false(returnNow);
});

test("re-exec", async (t) => {
    let callCount = 0;

    const systemMock = new Mock<System>().setup((instance) => instance.error(It.IsAny())).returns();

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

    const returnNow = await reexecModule.reexec(systemMock.object(), herebyfilePath);
    t.true(returnNow);

    systemMock.verify(
        (instance) => instance.error("Warning: re-running hereby as imported by the Herebyfile."),
        Times.Once(),
    );
});
