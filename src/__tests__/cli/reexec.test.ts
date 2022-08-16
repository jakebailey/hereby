import test from "ava";
import esmock from "esmock";
import { It, Mock, Times } from "moq.ts";
import { fileURLToPath } from "url";

import type * as reexec from "../../cli/reexec.js";
import { Process, System, UserError } from "../../cli/utils.js";
import { fixESMockPath } from "../../testUtils.js";

const cliIndexURL = new URL("../../cli/index.js", import.meta.url).toString();
const wrongCliIndexURL = new URL("../../other/cli/index.js", import.meta.url).toString();
const herebyfilePath = fileURLToPath(new URL("./fixtures/normal.mjs", import.meta.url));

// TODO: fixESMockPath doesn't work on Windows; remove once the bug is fixed.
const testSkipIfWindows = process.platform !== "win32" ? test : test.skip;

testSkipIfWindows("no re-exec", async (t) => {
    let callCount = 0;

    const systemMock = new Mock<System>();

    const reexecModule: typeof reexec = await esmock(fixESMockPath("../../cli/reexec.js", import.meta.url), {
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
                        return cliIndexURL;
                    case 2:
                        return cliIndexURL;
                    default:
                        t.fail();
                        throw new Error("too many calls");
                }
            },
        },
    });

    const returnNow = await reexecModule.reexec(systemMock.object(), herebyfilePath);
    t.false(returnNow);
});

testSkipIfWindows("re-exec", async (t) => {
    let callCount = 0;

    const execPath = "node";
    const execArgv = ["--loader=my-cool-loader"];
    const argv = [execPath, fileURLToPath(cliIndexURL), "build", "test", "--lint", "--lkg"];

    const processMock = new Mock<Process>()
        .setup((instance) => instance.execPath)
        .returns(execPath)
        .setup((instance) => instance.execArgv)
        .returns(execArgv)
        .setup((instance) => instance.argv)
        .returns(argv);

    const systemMock = new Mock<System>()
        .setup((instance) => instance.error(It.IsAny()))
        .returns()
        .setup((instance) => instance.process)
        .returns(processMock.object());

    const reexecModule: typeof reexec = await esmock(fixESMockPath("../../cli/reexec.js", import.meta.url), {
        "foreground-child": {
            default: (program: string, args: string[]) => {
                t.is(program, execPath);
                t.deepEqual(args, [...execArgv, fileURLToPath(wrongCliIndexURL), ...argv.slice(2)]);
            },
        },
        "import-meta-resolve": {
            resolve: async () => {
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

testSkipIfWindows("fail to resolve other", async (t) => {
    let callCount = 0;

    const systemMock = new Mock<System>();

    const reexecModule: typeof reexec = await esmock(fixESMockPath("../../cli/reexec.js", import.meta.url), {
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
                        return cliIndexURL;
                    case 2:
                        throw new Error("Cannot find package 'hereby' imported from ...");
                    default:
                        t.fail();
                        throw new Error("too many calls");
                }
            },
        },
    });

    await t.throwsAsync(async () => await reexecModule.reexec(systemMock.object(), herebyfilePath), {
        instanceOf: UserError,
        message: "Unable to find hereby; ensure hereby is installed in your package.",
    });
});
