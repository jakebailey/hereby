import minimist from "minimist";

import type { Task } from "../index.js";
import { loadHerebyfile } from "./loadHerebyfile.js";
import { CLIRunner } from "./runner.js";

const {
    _: tasksToRun,
    help: helpFlag,
    tasks: tasksFlag,
    herebyfile: herebyfileFlag,
} = minimist(process.argv.slice(2), { "--": true });

if (helpFlag) {
    // TODO: we can do better.
    console.log("Usage: hereby [--herebyfile path/to/herebyfile.mjs] <task name> ...");
    process.exit(0);
}

if (herebyfileFlag !== undefined && typeof herebyfileFlag !== "string") {
    throw new Error("--herebyfile is not a string");
}

const herebyfile = await loadHerebyfile(herebyfileFlag || undefined);

if (tasksFlag) {
    if (herebyfile.defaultTask) {
        console.log(`Default task: ${herebyfile.defaultTask.options.name}`);
    }

    console.log("Available tasks:");
    for (const task of herebyfile.tasks) {
        if (task === herebyfile.defaultTask) {
            continue;
        }
        console.log(`    ${task.options.name}`);
    }

    // TODO: offer some sort of visual representation?
    process.exit(0);
}

const allTasks = new Map<string, Task>();
for (const task of herebyfile.tasks) {
    allTasks.set(task.options.name, task);
}

for (const name of tasksToRun) {
    if (!allTasks.has(name)) {
        throw new Error(`Task ${name} does not exist or is not exported in the Herebyfile.`);
    }
}

let tasks: Task[];
if (tasksToRun.length > 0) {
    tasks = tasksToRun.map((name) => allTasks.get(name)!);
} else {
    if (!herebyfile.defaultTask) {
        throw new Error("No default task defined; please specify a task name.");
    }
    tasks = [herebyfile.defaultTask];
}

// TODO: log path to herebyfile

try {
    await new CLIRunner().runTasks(...tasks);
} catch {
    // We will have already printed some message here.
    // Set the error code and let the process run to completion,
    // so we don't end up with an unflushed output.
    process.exitCode = 1;
}
