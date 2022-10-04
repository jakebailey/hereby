import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";

import { Task } from "../index.js";
import { UserError } from "./utils.js";

const filenames = ["Herebyfile", "herebyfile"];
const extensions = ["mjs", "js"];
const allFilenames = new Set(extensions.map((e) => filenames.map((f) => `${f}.${e}`)).flat());

export async function findHerebyfile(dir: string): Promise<string> {
    const root = path.parse(dir).root;

    for (; dir !== root; dir = path.dirname(dir)) {
        const entries = await fs.readdir(dir);
        const matching = entries.filter((e) => allFilenames.has(e));
        if (matching.length > 1) {
            throw new UserError(`Found more than one Herebyfile: ${matching.join(", ")}`);
        }
        if (matching.length === 1) {
            const candidate = path.join(dir, matching[0]);
            const stat = await fs.stat(candidate);
            if (!stat.isFile()) {
                throw new UserError(`${matching[0]} is not a file.`);
            }
            return candidate;
        }
        if (entries.includes("package.json")) {
            break;
        }
    }

    throw new UserError("Unable to find Herebyfile.");
}

export interface Herebyfile {
    tasks: Task[];
    defaultTask?: Task | undefined;
}

export async function loadHerebyfile(herebyfilePath: string): Promise<Herebyfile> {
    const herebyfile = await import(pathToFileURL(herebyfilePath).toString());

    const exportedTasks = new Set<Task>();
    let defaultTask: Task | undefined;

    for (const [key, value] of Object.entries(herebyfile)) {
        if (value instanceof Task) {
            if (key === "default") {
                defaultTask = value;
            } else if (exportedTasks.has(value)) {
                throw new UserError(`Task "${chalk.blue(value.options.name)}" has been exported twice.`);
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

    const tasks = Array.from(exportedTasks.values());

    // We check this here by walking the DAG, as some dependencies may not be
    // exported and therefore would not be seen by the above loop.
    checkTaskInvariants(tasks);

    return {
        tasks,
        defaultTask,
    };
}

function checkTaskInvariants(tasks: readonly Task[]) {
    const checkedTasks = new Set<Task>();
    const taskStack = new Set<Task>();
    const seenNames = new Set<string>();

    checkTaskInvariantsWorker(tasks);

    function checkTaskInvariantsWorker(tasks: readonly Task[]) {
        for (const task of tasks) {
            if (checkedTasks.has(task)) {
                continue;
            }

            if (taskStack.has(task)) {
                throw new UserError(`Task "${chalk.blue(task.options.name)}" references itself.`);
            }

            const name = task.options.name;
            if (seenNames.has(name)) {
                throw new UserError(`Task "${chalk.blue(name)}" was declared twice.`);
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
