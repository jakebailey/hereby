import test from "ava";
import { It, Mock, Times } from "moq.ts";
import { fileURLToPath } from "url";

import { reexec, ReExecD } from "../../cli/reexec.js";
import { UserError } from "../../cli/utils.js";

const cliIndexURL = new URL("../../cli/index.js", import.meta.url).toString();
const wrongCliIndexURL = new URL("../../other/cli/index.js", import.meta.url).toString();
const herebyfilePath = fileURLToPath(new URL("./fixtures/Herebyfile.mjs", import.meta.url));

test("no re-exec", async (t) => {
    let callCount = 0;

    const dMock = new Mock<ReExecD>()
        .setup((d) => d.foregroundChild)
        .returns(() => {
            throw new Error("Should not be called.");
        })
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

test("re-exec", async (t) => {
    let callCount = 0;

    const execPath = "node";
    const execArgv = ["--loader=my-cool-loader"];
    const argv = [execPath, fileURLToPath(cliIndexURL), "build", "test", "--lint", "--lkg"];

    const dMock = new Mock<ReExecD>()
        .setup((d) => d.execPath)
        .returns(execPath)
        .setup((d) => d.execArgv)
        .returns(execArgv)
        .setup((d) => d.argv)
        .returns(argv)
        .setup((d) => d.error(It.IsAny()))
        .returns()
        .setup((d) => d.foregroundChild)
        .returns((program, args) => {
            t.is(program, execPath);
            t.deepEqual(args, [...execArgv, fileURLToPath(wrongCliIndexURL), ...argv.slice(2)]);
        })
        .setup((d) => d.resolve)
        .returns(async () => {
            callCount++;
            switch (callCount) {
                case 1:
                    return cliIndexURL;
                case 2:
                    return wrongCliIndexURL;
                default:
                    t.fail();
                    throw new Error("too many calls");
            }
        });

    const returnNow = await reexec(dMock.object(), herebyfilePath);
    t.true(returnNow);

    dMock.verify((d) => d.error("Warning: re-running hereby as imported by the Herebyfile."), Times.Once());
});

test("fail to resolve other", async (t) => {
    let callCount = 0;

    const dMock = new Mock<ReExecD>()
        .setup((d) => d.foregroundChild)
        .returns(() => {
            throw new Error("Should not be called.");
        })
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
