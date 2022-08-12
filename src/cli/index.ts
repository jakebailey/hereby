import path from "path";

import type { Task } from "../index.js";
import { findHerebyfile, loadHerebyfile } from "./loadHerebyfile.js";
import { parseArgs } from "./parseArgs.js";
import { printTasks } from "./printTasks.js";
import { runTasksWithCLIRunner } from "./runner.js";
import { exitWithError, simplifyPath } from "./utils.js";

const args = parseArgs(process.argv.slice(2));

const herebyfilePath = args.herebyfile ?? (await findHerebyfile(process.cwd()));
process.chdir(path.dirname(herebyfilePath));

const herebyfile = await loadHerebyfile(herebyfilePath);

if (args.printTasks) {
    printTasks(herebyfile.tasks, herebyfile.defaultTask);
    process.exit(0);
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
            exitWithError(`Task ${name} does not exist or is not exported in the Herebyfile.`);
        }
        return task;
    });
} else {
    if (!herebyfile.defaultTask) {
        exitWithError("No default task defined; please specify a task name.");
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
