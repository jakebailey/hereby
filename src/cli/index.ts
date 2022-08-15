import chalk from "chalk";
import path from "path";

import type { Task } from "../index.js";
import { formatTasks } from "./formatTasks.js";
import { findHerebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { getUsage, parseArgs } from "./parseArgs.js";
import { reexec } from "./reexec.js";
import { runTasksWithCLIRunner } from "./runner.js";
import { ExitCodeError, simplifyPath, System, UserError } from "./utils.js";

export async function main(system: System) {
    try {
        await mainWorker(system);
    } catch (e) {
        if (e instanceof ExitCodeError) {
            system.process.exitCode = e.exitCode;
        } else if (e instanceof UserError) {
            system.error(`${chalk.red("Error")}: ${e.message}`);
            system.process.exitCode = 1;
        } else {
            throw e;
        }
    }
}

async function mainWorker(system: System) {
    const args = parseArgs(system.process.argv.slice(2));

    if (args.help) {
        system.log(getUsage());
        return;
    }

    let herebyfilePath = args.herebyfile ?? (await findHerebyfile(system.process.cwd()));
    herebyfilePath = path.resolve(system.process.cwd(), herebyfilePath);

    if (await reexec(system, herebyfilePath)) {
        return;
    }

    system.process.chdir(path.dirname(herebyfilePath));

    const herebyfile = await loadHerebyfile(herebyfilePath);

    if (args.printTasks) {
        system.log(formatTasks(herebyfile.tasks, herebyfile.defaultTask));
        return;
    }

    const allTasks = new Map<string, Task>();
    for (const task of herebyfile.tasks) {
        allTasks.set(task.options.name, task);
    }

    let tasks: Task[];
    if (args.run && args.run.length > 0) {
        tasks = args.run.map((name) => {
            const task = allTasks.get(name);
            if (!task) {
                throw new UserError(`Task ${name} does not exist or is not exported in the Herebyfile.`);
            }
            return task;
        });
    } else {
        if (!herebyfile.defaultTask) {
            throw new UserError("No default task defined; please specify a task name.");
        }
        tasks = [herebyfile.defaultTask];
    }

    system.log(`Using ${simplifyPath(herebyfilePath)}`);

    try {
        await runTasksWithCLIRunner(system, ...tasks);
    } catch {
        // We will have already printed some message here.
        // Set the error code and let the process run to completion,
        // so we don't end up with an unflushed output.
        throw new ExitCodeError(1);
    }
}
