import path from "node:path";
import { performance } from "node:perf_hooks";
import { types } from "node:util";

import type { Task } from "../index.js";
import { findHerebyfile, type Herebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { getUsage, parseArgs } from "./parseArgs.js";
import { reexec } from "./reexec.js";
import { Runner } from "./runner.js";
import * as style from "./style.js";
import { type D, findSimilar, prettyMilliseconds, UserError } from "./utils.js";

export async function main(d: D) {
    try {
        await mainWorker(d);
    } catch (e) {
        if (e instanceof UserError) {
            d.error(`${style.red("Error")}: ${e.message}`);
        } else if (types.isNativeError(e) && e.stack) { // eslint-disable-line @typescript-eslint/no-deprecated
            d.error(e.stack);
        } else {
            d.error(`${e}`);
        }
        d.setExitCode(1);
    }
}

async function mainWorker(d: D) {
    const args = parseArgs(d.argv.slice(2));

    if (args.help) {
        d.log(getUsage());
        return;
    }

    const herebyfilePath = path.resolve(d.cwd(), args.herebyfile ?? findHerebyfile(d.cwd()));

    if (await reexec(herebyfilePath)) return;

    if (args.version) {
        d.log(`hereby ${d.version()}`);
        return;
    }

    d.chdir(path.dirname(herebyfilePath));

    const herebyfile = await loadHerebyfile(herebyfilePath);

    if (args.printTasks) {
        const { formatTasks } = await import("./formatTasks.js");
        d.log(formatTasks(args.printTasks, herebyfile.tasks.values(), herebyfile.defaultTask, d.columns()));
        return;
    }

    const tasks = await selectTasks(d, herebyfile, herebyfilePath, args.run);
    const taskNames = tasks.map((task) => style.blue(task.options.name)).join(", ");
    d.log(`Using ${style.yellow(d.simplifyPath(herebyfilePath))} to run ${taskNames}`);

    const start = performance.now();

    const runner = new Runner(d);
    try {
        await runner.runTasks(...tasks);
    } catch {
        // We will have already printed some message here.
        // Set the error code and let the process run to completion,
        // so we don't end up with an unflushed output.
        d.setExitCode(1);
    } finally {
        const took = performance.now() - start;
        const failed = runner.failedTasks.length > 0;
        d.log(`Completed ${taskNames}${failed ? style.red(" with errors") : ""} in ${prettyMilliseconds(took)}`);
        if (failed) {
            const names = runner.failedTasks.sort().map((task) => style.red(task)).join(", ");
            d.log(`Failed tasks: ${names}`);
        }
    }
}

// Exported for testing.
export async function selectTasks(
    d: Pick<D, "simplifyPath">,
    herebyfile: Herebyfile,
    herebyfilePath: string,
    taskNames: readonly string[],
): Promise<readonly Task[]> {
    if (taskNames.length === 0) {
        if (herebyfile.defaultTask) return [herebyfile.defaultTask];
        throw new UserError(
            `No default task has been exported from ${d.simplifyPath(herebyfilePath)}; please specify a task name.`,
        );
    }

    return taskNames.map((name) => {
        const task = herebyfile.tasks.get(name);
        if (task) return task;
        const suggestion = findSimilar(name, herebyfile.tasks.keys());
        throw new UserError(
            `Task "${name}" does not exist or is not exported from ${d.simplifyPath(herebyfilePath)}.`
                + (suggestion ? ` Did you mean "${suggestion}"?` : ""),
        );
    });
}
