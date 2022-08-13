import path from "path";
import pc from "picocolors";

import type { Task } from "../index.js";
import { findHerebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { parseArgs } from "./parseArgs.js";
import { printTasks } from "./printTasks.js";
import { reexecIfNeeded } from "./reexec.js";
import { runTasksWithCLIRunner } from "./runner.js";
import { simplifyPath, UserError } from "./utils.js";

async function main() {
    const args = parseArgs(process.argv.slice(2));

    const herebyfilePath = args.herebyfile ?? (await findHerebyfile(process.cwd()));

    await reexecIfNeeded(herebyfilePath);

    process.chdir(path.dirname(herebyfilePath));

    const herebyfile = await loadHerebyfile(herebyfilePath);

    if (args.printTasks) {
        printTasks(herebyfile.tasks, herebyfile.defaultTask);
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

    console.log(`Using ${simplifyPath(herebyfile.path)}`);

    try {
        await runTasksWithCLIRunner(...tasks);
    } catch {
        // We will have already printed some message here.
        // Set the error code and let the process run to completion,
        // so we don't end up with an unflushed output.
        process.exitCode = 1;
    }
}

try {
    await main();
} catch (e) {
    if (e instanceof UserError) {
        console.error(`${pc.red("Error")}: ${e.message}`);
        process.exitCode = 1;
    } else {
        throw e;
    }
}
