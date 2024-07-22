import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { withCodSpeed } from "@codspeed/tinybench-plugin";
import { execa } from "execa";
import { Bench } from "tinybench";
import tmp from "tmp";

import { main } from "../../cli/index.js";
import { type D, real } from "../../cli/utils.js";

const __filename = url.fileURLToPath(new URL(import.meta.url));
const __dirname = path.dirname(__filename);

const packageRoot = path.join(__dirname, "..", "..", "..");
const cli = path.join(packageRoot, "dist", "cli.js");

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
        argv: [process.execPath, cli, ...argv],
        setExitCode: noop,
    };
}

export const bench = withCodSpeed(new Bench());

type BenchmarkOptions = Parameters<Bench["add"]>[2] & {
    cwd?: string;
};

function registerDirectBenchmark(name: string, argv: readonly string[], opts: BenchmarkOptions = {}) {
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

registerDirectBenchmark(
    "main print version",
    ["--version"],
);

registerDirectBenchmark(
    "main print tasks",
    ["--tasks"],
    { cwd: fixturesDir },
);

registerDirectBenchmark(
    "main print tasks simple",
    ["--tasks-simple"],
    { cwd: fixturesDir },
);

registerDirectBenchmark(
    "main run wrong name",
    ["buildCompile"],
    { cwd: fixturesDir },
);

async function createTempPackage() {
    const tmpDir = tmp.dirSync({ unsafeCleanup: true });
    const packageJson = {
        name: "test-package",
        version: "1.0.0",
        devDependencies: {
            hereby: `file:${packageRoot}`,
        },
    };
    await fs.promises.writeFile(path.join(tmpDir.name, "package.json"), JSON.stringify(packageJson));
    await fs.promises.cp(path.join(fixturesDir, "Herebyfile.mjs"), path.join(tmpDir.name, "Herebyfile.mjs"));

    await execa("npm", ["install"], { cwd: tmpDir.name });
    return tmpDir;
}

function registerReexecBenchmark(name: string, argv: readonly string[]) {
    let cwd: string;

    bench.add(name, () => execa(process.execPath, [cli, ...argv], { cwd, stdio: "ignore" }), {
        beforeAll: async () => {
            const tmpDir = await createTempPackage();
            cwd = tmpDir.name;
        },
        afterAll: async () => {
            await fs.promises.rm(cwd, { recursive: true, force: true });
        },
    });
}

registerReexecBenchmark("main reexec print tasks", ["--tasks"]);

registerReexecBenchmark("main reexec print tasks simple", ["--tasks-simple"]);

await bench.run();
console.table(bench.table());
