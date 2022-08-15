import test from "ava";
import esmock from "esmock";
import { It, Mock, Times } from "moq.ts";
import { fileURLToPath } from "url";

import type * as reexec from "../../cli/reexec.js";
import type { Process, System } from "../../cli/utils.js";

const cliIndexURL = new URL("../../cli/index.js", import.meta.url).toString();
const wrongCliIndexURL = new URL("../../other/cli/index.js", import.meta.url).toString();
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
                        return cliIndexURL;
                    case 2:
                        return cliIndexURL;
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

    // This is a workaround for a bug in esmock; esmock appears to follow
    // source maps, so I pass "../../cli/reexec.js" directly, it uses src/...
    // rather than dist/...
    //
    // TODO: Remove once https://github.com/iambumblehead/esmock/issues/113 is fixed.
    const modulePath = new URL("../../cli/reexec.js", import.meta.url);
    const reexecModule: typeof reexec = await esmock(fileURLToPath(modulePath), {
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
