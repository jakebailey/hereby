import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { Task } from "../index.js";
import * as style from "./style.js";
import { findUp, UserError } from "./utils.js";

const herebyfileRegExp = /^herebyfile\.m?[jt]s$/i;

export function findHerebyfile(dir: string): string {
    const result = findUp(dir, (dir) => {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const matching = entries.filter((e) => herebyfileRegExp.test(e.name));
        if (matching.length > 1) {
            throw new UserError(`Found more than one Herebyfile: ${matching.map((e) => e.name).join(", ")}`);
        }
        if (matching.length === 1) {
            const candidate = matching[0];
            if (!candidate.isFile()) {
                throw new UserError(`${candidate.name} is not a file.`);
            }
            return path.join(dir, candidate.name);
        }
        if (entries.some((e) => e.name === "package.json")) {
            return false; // TODO: Is this actually desirable? What about monorepos?
        }
        return undefined;
    });

    if (result) {
        return result;
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
        if (!(value instanceof Task)) continue;

        if (key === "default") {
            defaultTask = value;
        } else if (exportedTasks.has(value)) {
            throw new UserError(`Task "${style.blue(value.options.name)}" has been exported twice.`);
        } else {
            exportedTasks.add(value);
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

    const tasks = new Map([...exportedTasks].map((task) => [task.options.name, task]));

    return { tasks, defaultTask };
}

function checkTaskInvariants(
    tasks: Iterable<Task>,
    checkedTasks = new Set<Task>(),
    taskStack = new Set<Task>(),
    seenNames = new Set<string>(),
): void {
    for (const task of tasks) {
        if (checkedTasks.has(task)) continue;
        if (taskStack.has(task)) {
            throw new UserError(`Task "${style.blue(task.options.name)}" references itself.`);
        }
        const name = task.options.name;
        if (seenNames.has(name)) {
            throw new UserError(`Task "${style.blue(name)}" was declared twice.`);
        }
        seenNames.add(name);
        if (task.options.dependencies) {
            taskStack.add(task);
            checkTaskInvariants(task.options.dependencies, checkedTasks, taskStack, seenNames);
            taskStack.delete(task);
        }
        checkedTasks.add(task);
    }
}
