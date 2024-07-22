import path from "node:path";
import url from "node:url";

import { withCodSpeed } from "@codspeed/tinybench-plugin";
import { Bench } from "tinybench";

import { main } from "../../cli/index.js";
import { type D, real } from "../../cli/utils.js";

const __filename = url.fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);

function noop() {}

async function depsForBenchmark(argv: readonly string[], cwd: string): Promise<D> {
    const realD = await real();

    return {
        ...realD,
        log: noop,
        error: noop,
        cwd: () => cwd,
        chdir: (dir: string) => {
            cwd = dir;
        },
        argv,
        setExitCode: noop,
    };
}

export const bench = withCodSpeed(new Bench());

type BenchmarkOptions = Parameters<Bench["add"]>[2] & {
    cwd?: string;
};

function registerBenchmark(name: string, argv: readonly string[], opts: BenchmarkOptions = {}) {
    let deps: D;
    const cwd = opts.cwd ?? process.cwd();
    bench.add(name, () => main(deps), {
        ...opts,
        beforeEach: async function(this) {
            if (opts.beforeEach) {
                await opts.beforeEach.bind(this)();
            }
            deps = await depsForBenchmark(argv, cwd);
        },
    });
}

const fixturesDir = path.join(__dirname, "..", "cli", "__fixtures__");

registerBenchmark(
    "main print version",
    ["node", "cli.js", "--version"],
);

registerBenchmark(
    "main print tasks",
    ["node", "cli.js", "--tasks"],
    { cwd: fixturesDir },
);

registerBenchmark(
    "main print tasks simple",
    ["node", "cli.js", "--tasks-simple"],
    { cwd: fixturesDir },
);

registerBenchmark(
    "main run wrong name",
    ["node", "cli.js", "buildCompile"],
    { cwd: fixturesDir },
);

await bench.run();
console.table(bench.table());
