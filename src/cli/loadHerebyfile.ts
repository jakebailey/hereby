import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import pc from "picocolors";

import { Task } from "../index.js";
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
    readonly tasks: ReadonlyMap<Task, string>;
    readonly defaultTask: Task | undefined;
}

export function getTaskName(herebyfile: Herebyfile, task: Task) {
    if (task.options.name) {
        return task.options.name;
    }

    return herebyfile.tasks.get(task) ?? "";
}

export async function loadHerebyfile(herebyfilePath: string): Promise<Herebyfile> {
    // Note: calling pathToFileURL is required on Windows to disambiguate URLs
    // from drive letters.
    const herebyfileImport = await import(pathToFileURL(herebyfilePath).toString());

    const exportedTasks = new Map<Task, string>();
    let defaultTask: Task | undefined;

    for (const [key, value] of Object.entries(herebyfileImport)) {
        if (!(value instanceof Task)) continue;

        if (key === "default") {
            defaultTask = value;
        } else if (exportedTasks.has(value)) {
            const name = value.options.name ?? key;
            throw new UserError(`Task "${pc.blue(name)}" has been exported twice.`);
        } else {
            exportedTasks.set(value, key);
        }
    }

    if (defaultTask) {
        exportedTasks.set(defaultTask, "");
    }

    if (exportedTasks.size === 0) {
        throw new UserError("No tasks found. Did you forget to export your tasks?");
    }

    // We check this here by walking the DAG, as some dependencies may not be
    // exported and therefore would not be seen by the above loop.
    const herebyfile: Herebyfile = { defaultTask, tasks: exportedTasks };
    checkTaskInvariants(herebyfile);
    return herebyfile;
}

function checkTaskInvariants(herebyfile: Herebyfile) {
    const checkedTasks = new Set<Task>();
    const taskStack = new Set<Task>();
    const seenNames = new Set<string>();

    checkTaskInvariantsWorker(herebyfile.tasks.keys());

    function checkTaskInvariantsWorker(tasks: Iterable<Task>) {
        for (const task of tasks) {
            if (checkedTasks.has(task)) continue;

            const name = getTaskName(herebyfile, task);
            if (taskStack.has(task)) {
                throw new UserError(`Task "${pc.blue(name)}" references itself.`);
            }

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
