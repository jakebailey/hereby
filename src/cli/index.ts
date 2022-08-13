import path from "path";
import pc from "picocolors";

import type { Task } from "../index.js";
import { formatTasks } from "./formatTasks.js";
import { findHerebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { getUsage, parseArgs } from "./parseArgs.js";
import { reexecIfNeeded } from "./reexec.js";
import { runTasksWithCLIRunner } from "./runner.js";
import { ExitCodeError, simplifyPath, UserError } from "./utils.js";

async function main(argv: string[]) {
    const args = parseArgs(argv);

    if (args.help) {
        console.log(getUsage());
        return;
    }

    const herebyfilePath = args.herebyfile ?? (await findHerebyfile(process.cwd()));

    await reexecIfNeeded(herebyfilePath);

    process.chdir(path.dirname(herebyfilePath));

    const herebyfile = await loadHerebyfile(herebyfilePath);

    if (args.printTasks) {
        console.log(formatTasks(herebyfile.tasks, herebyfile.defaultTask));
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

    console.log(`Using ${simplifyPath(herebyfilePath)}`);

    try {
        await runTasksWithCLIRunner(...tasks);
    } catch {
        // We will have already printed some message here.
        // Set the error code and let the process run to completion,
        // so we don't end up with an unflushed output.
        throw new ExitCodeError(1);
    }
}

try {
    await main(process.argv.slice(2));
} catch (e) {
    if (e instanceof ExitCodeError) {
        process.exitCode = e.exitCode;
    } else if (e instanceof UserError) {
        console.error(`${pc.red("Error")}: ${e.message}`);
        process.exitCode = 1;
    } else {
        throw e;
    }
}
