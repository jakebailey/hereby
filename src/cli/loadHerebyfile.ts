import fs from "fs/promises";
import path from "path";
import pc from "picocolors";

import { Task } from "../index.js";
import { forEachTask } from "../utils.js";
import { UserError } from "./utils.js";

// The order of these doesn't matter; we error below when our choice would be ambiguous.
const filenames = ["Herebyfile", "herebyfile"];
const extensions = ["js", "mjs"];
const allFilenames = new Set(filenames.map((f) => extensions.map((e) => `${f}.${e}`)).flat());

export async function findHerebyfile(dir: string): Promise<string> {
    while (dir) {
        const entries = await fs.readdir(dir);
        const matching = entries.filter((e) => allFilenames.has(e));
        if (matching.length > 1) {
            throw new UserError(`Found ${matching.join(", ")} in ${dir}; please resolve this ambiguity.`);
        }
        if (matching.length === 1) {
            const candidate = path.join(dir, matching[0]);
            const stat = await fs.stat(candidate);
            if (!stat.isFile()) {
                throw new UserError(`${candidate} is not a file.`);
            }
            return candidate;
        }
        if (entries.includes("package.json")) {
            break;
        }

        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }

    throw new UserError("Unable to find Herebyfile.");
}

export interface Herebyfile {
    tasks: Task[];
    defaultTask?: Task | undefined;
}

export async function loadHerebyfile(herebyfilePath: string): Promise<Herebyfile> {
    const herebyfile = await import(herebyfilePath);

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

    const tasks = Array.from(exportedTasks.values());

    // We check this here by walking the DAG, as some dependencies may not be
    // exported and therefore would not be seen by the above loop.
    assertUniqueNames(tasks);

    return {
        tasks,
        defaultTask,
    };
}

function assertUniqueNames(tasks: Task[]) {
    const names = new Set<string>();
    forEachTask(tasks, (task) => {
        const name = task.options.name;
        if (names.has(name)) {
            throw new UserError(`Task "${pc.blue(name)}" was declared twice.`);
        }
        names.add(name);
    });
}
