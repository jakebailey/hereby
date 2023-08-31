import { fileURLToPath } from "node:url";

import test from "ava";

import { reexec, type ReExecD } from "../../cli/reexec.js";
import { UserError } from "../../cli/utils.js";
import { mock } from "../__helpers__/index.js";

const cliIndexURL = new URL("../../cli/index.js", import.meta.url).toString();
const herebyfilePath = fileURLToPath(new URL("__fixtures__/Herebyfile.mjs", import.meta.url));

test("no re-exec", async (t) => {
    let callCount = 0;

    const dMock = mock<ReExecD>(t)
        .setup((d) => d.resolve)
        .returns(async () => {
            callCount++;
            switch (callCount) {
                case 1:
                    return cliIndexURL;
                case 2:
                    return cliIndexURL;
                default:
                    t.fail();
                    throw new Error("too many calls");
            }
        });

    const returnNow = await reexec(dMock.object(), herebyfilePath);
    t.false(returnNow);
});

test("fail to resolve other", async (t) => {
    let callCount = 0;

    const dMock = mock<ReExecD>(t)
        .setup((d) => d.resolve)
        .returns(async () => {
            callCount++;
            switch (callCount) {
                case 1:
                    return cliIndexURL;
                case 2:
                    throw new Error("Cannot find package 'hereby' imported from ...");
                default:
                    t.fail();
                    throw new Error("too many calls");
            }
        });

    await t.throwsAsync(async () => await reexec(dMock.object(), herebyfilePath), {
        instanceOf: UserError,
        message: "Unable to find hereby; ensure hereby is installed in your package.",
    });
});
