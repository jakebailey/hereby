import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import pc from "picocolors";

import { Task } from "../index.js";
import { UserError } from "./utils.js";

function isHerebyfile(p: string) {
    p = p.toLowerCase();
    return p === "herebyfile.mjs" || p === "herebyfile.js";
}

export function findHerebyfile(dir: string): string {
    const root = path.parse(dir).root;

    while (true) {
        const entries = fs.readdirSync(dir);
        const matching = entries.filter(isHerebyfile);
        if (matching.length > 1) {
            throw new UserError(`Found more than one Herebyfile: ${matching.join(", ")}`);
        }
        if (matching.length === 1) {
            const candidate = path.join(dir, matching[0]);
            const stat = fs.statSync(candidate);
            if (!stat.isFile()) {
                throw new UserError(`${matching[0]} is not a file.`);
            }
            return candidate;
        }
        if (entries.includes("package.json")) {
            break; // TODO: Is this actually desirable? What about monorepos?
        }

        if (dir === root) break;
        dir = path.dirname(dir);
    }

    throw new UserError("Unable to find Herebyfile.");
}

export interface Herebyfile {
    readonly tasks: ReadonlyMap<string, Task>;
    readonly defaultTask: Task | undefined;
}

export async function loadHerebyfile(herebyfilePath: string): Promise<Herebyfile> {
    // Note: calling pathToFileURL is required on Windows to disambiguate URLs
    // from drive letters.
    const herebyfile = await import(pathToFileURL(herebyfilePath).toString());

    const exportedTasks = new Set<Task>();
    let defaultTask: Task | undefined;

    for (const [key, value] of Object.entries(herebyfile)) {
        if (value instanceof Task) {
            if (key === "default") {
                defaultTask = value;
            } else if (exportedTasks.has(value)) {
                throw new UserError(`Task "${pc.blue(value.options.name)}" has been exported twice.`);
            } else {
                exportedTasks.add(value);
            }
        }
    }

    if (defaultTask) {
        exportedTasks.add(defaultTask);
    }

    if (exportedTasks.size === 0) {
        throw new UserError("No tasks found. Did you forget to export your tasks?");
    }

    // We check this here by walking the DAG, as some dependencies may not be
    // exported and therefore would not be seen by the above loop.
    checkTaskInvariants(exportedTasks);

    const tasks = new Map([...exportedTasks.values()].map((task) => [task.options.name, task]));

    return { tasks, defaultTask };
}

function checkTaskInvariants(tasks: Iterable<Task>) {
    const checkedTasks = new Set<Task>();
    const taskStack = new Set<Task>();
    const seenNames = new Set<string>();

    checkTaskInvariantsWorker(tasks);

    function checkTaskInvariantsWorker(tasks: Iterable<Task>) {
        for (const task of tasks) {
            if (checkedTasks.has(task)) {
                continue;
            }

            if (taskStack.has(task)) {
                throw new UserError(`Task "${pc.blue(task.options.name)}" references itself.`);
            }

            const name = task.options.name;
            if (seenNames.has(name)) {
                throw new UserError(`Task "${pc.blue(name)}" was declared twice.`);
            }
            seenNames.add(name);

            if (task.options.dependencies) {
                taskStack.add(task);
                checkTaskInvariantsWorker(task.options.dependencies);
                taskStack.delete(task);
            }

            checkedTasks.add(task);
        }
    }
}
