import chalk from "chalk";
import { closest, distance } from "fastest-levenshtein";
import path from "path";

import type { Task } from "../index.js";
import { formatTasks } from "./formatTasks.js";
import { findHerebyfile, Herebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { getUsage, parseArgs } from "./parseArgs.js";
import { reexec } from "./reexec.js";
import { Runner } from "./runner.js";
import { D, ExitCodeError, simplifyPath, UserError } from "./utils.js";

export async function main(d: D) {
    try {
        await mainWorker(d);
    } catch (e) {
        if (e instanceof ExitCodeError) {
            d.setExitCode(e.exitCode);
        } else if (e instanceof UserError) {
            d.error(`${chalk.red("Error")}: ${e.message}`);
            d.setExitCode(1);
        } else {
            throw e;
        }
    }
}

async function mainWorker(d: D) {
    const args = parseArgs(d.argv.slice(2));

    if (args.help) {
        d.log(getUsage());
        return;
    }

    let herebyfilePath = args.herebyfile ?? (await findHerebyfile(d.cwd()));
    herebyfilePath = path.resolve(d.cwd(), herebyfilePath);

    if (await reexec(d, herebyfilePath)) {
        return;
    }

    d.chdir(path.dirname(herebyfilePath));

    d.log(`Using ${simplifyPath(herebyfilePath)}`);

    const herebyfile = await loadHerebyfile(herebyfilePath);

    if (args.printTasks) {
        d.log(formatTasks(herebyfile.tasks, herebyfile.defaultTask));
        return;
    }

    const tasks = selectTasks(herebyfile, args.run);

    try {
        const runner = new Runner(d);
        await runner.runTasks(...tasks);
    } catch (e) {
        // We will have already printed some message here.
        // Set the error code and let the process run to completion,
        // so we don't end up with an unflushed output.
        throw new ExitCodeError(1, e);
    }
}

export function selectTasks(herebyfile: Herebyfile, taskNames: string[] | undefined): Task[] {
    const allTasks = new Map<string, Task>();
    for (const task of herebyfile.tasks) {
        allTasks.set(task.options.name, task);
    }

    if (taskNames && taskNames.length > 0) {
        return taskNames.map((name) => {
            const task = allTasks.get(name);
            if (!task) {
                let message = `Task "${name}" does not exist or is not exported in the Herebyfile.`;

                const candidate = closest(name, Array.from(allTasks.keys()));
                if (distance(name, candidate) < name.length * 0.4) {
                    message += ` Did you mean "${candidate}"?`;
                }

                throw new UserError(message);
            }
            return task;
        });
    }

    if (!herebyfile.defaultTask) {
        throw new UserError("No default task defined; please specify a task name.");
    }
    return [herebyfile.defaultTask];
}
