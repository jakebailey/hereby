import path from "node:path";
import { performance } from "node:perf_hooks";
import { types } from "node:util";

import pc from "picocolors";

import type { Task } from "../index.js";
import { formatTasks } from "./formatTasks.js";
import { findHerebyfile, type Herebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { getUsage, parseArgs } from "./parseArgs.js";
import { reexec } from "./reexec.js";
import { Runner } from "./runner.js";
import { type D, UserError } from "./utils.js";

export async function main(d: D) {
    try {
        await mainWorker(d);
    } catch (e) {
        if (e instanceof UserError) {
            d.error(`${pc.red("Error")}: ${e.message}`);
        } else if (types.isNativeError(e) && e.stack) {
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

    let herebyfilePath = args.herebyfile ?? findHerebyfile(d.cwd());
    herebyfilePath = path.resolve(d.cwd(), herebyfilePath);

    if (await reexec(d, herebyfilePath)) {
        return;
    }

    if (args.version) {
        d.log(`hereby ${d.version()}`);
        return;
    }

    d.chdir(path.dirname(herebyfilePath));

    const herebyfile = await loadHerebyfile(herebyfilePath);

    if (args.printTasks) {
        d.log(formatTasks(args.printTasks, herebyfile.tasks.values(), herebyfile.defaultTask));
        return;
    }

    const tasks = await selectTasks(d, herebyfile, herebyfilePath, args.run);
    const taskNames = tasks.map((task) => pc.blue(task.options.name)).join(", ");
    d.log(`Using ${pc.yellow(d.simplifyPath(herebyfilePath))} to run ${taskNames}`);

    const start = performance.now();

    let errored = false;
    try {
        const runner = new Runner(d);
        await runner.runTasks(...tasks);
    } catch {
        errored = true;
        // We will have already printed some message here.
        // Set the error code and let the process run to completion,
        // so we don't end up with an unflushed output.
        d.setExitCode(1);
    } finally {
        const took = performance.now() - start;
        d.log(`Completed ${taskNames}${errored ? pc.red(" with errors") : ""} in ${d.prettyMilliseconds(took)}`);
    }
}

// Exported for testing.
export async function selectTasks(
    d: Pick<D, "simplifyPath">,
    herebyfile: Herebyfile,
    herebyfilePath: string,
    taskNames: string[],
): Promise<Task[]> {
    if (taskNames.length === 0) {
        if (!herebyfile.defaultTask) {
            throw new UserError(
                `No default task has been exported from ${d.simplifyPath(herebyfilePath)}; please specify a task name.`,
            );
        }
        return [herebyfile.defaultTask];
    }

    const tasks: Task[] = [];

    for (const name of taskNames) {
        const task = herebyfile.tasks.get(name);
        if (!task) {
            let message = `Task "${name}" does not exist or is not exported from ${d.simplifyPath(herebyfilePath)}.`;

            const { closest, distance } = await import("fastest-levenshtein");

            const candidate = closest(name, [...herebyfile.tasks.keys()]);
            if (distance(name, candidate) < name.length * 0.4) {
                message += ` Did you mean "${candidate}"?`;
            }

            throw new UserError(message);
        }
        tasks.push(task);
    }

    return tasks;
}
