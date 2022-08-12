import fs from "fs/promises";
import path from "path";
import pc from "picocolors";

import { Task } from "../index.js";
import { forEachTask } from "../utils.js";
import { exitWithError } from "./utils.js";

// The order of these doesn't matter; we error below when our choice would be ambiguous.
const filenames = ["Herebyfile", "herebyfile"];
const extensions = ["js", "mjs"];
const allFilenames = new Set(filenames.map((f) => extensions.map((e) => `${f}.${e}`)).flat());

export interface Herebyfile {
    path: string;
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
                exitWithError(`Task ${pc.blue(value.options.name)} has been exported twice.`);
            } else {
                exportedTasks.add(value);
            }
        } else if (Task.__isHerebyTask(value)) {
            // TODO: Instead of doing this, we should instead re-exec hereby within the context
            // of the Herebyfile, or, somehow hijack its import to import the current version.
            exitWithError(
                "The Herebyfile appears to have imported a different version of hereby than the CLI.\nEnsure you are running hereby within your package.",
            );
        }
    }

    if (defaultTask) {
        exportedTasks.add(defaultTask);
    }

    if (exportedTasks.size === 0) {
        exitWithError("No tasks found.");
    }

    const tasks = Array.from(exportedTasks.values());

    // We check this here by walking the DAG, as some dependencies may not be
    // exported and therefore would not be seen by the above loop.
    assertUniqueNames(tasks);

    return {
        path: herebyfilePath,
        tasks,
        defaultTask,
    };
}

function assertUniqueNames(tasks: Task[]) {
    const names = new Set<string>();
    forEachTask(tasks, (task) => {
        const name = task.options.name;
        if (names.has(name)) {
            exitWithError(`Task "${pc.blue(name)}" was declared twice.`);
        }
        names.add(name);
    });
}

export async function findHerebyfile(dir: string): Promise<string> {
    while (dir) {
        try {
            const entries = await fs.readdir(dir);
            const matching = entries.filter((e) => allFilenames.has(e));
            if (matching.length > 1) {
                exitWithError(`Found ${matching.join(", ")} in ${dir}; please resolve this ambiguity.`);
            }
            if (matching.length === 1) {
                const candidate = path.join(dir, matching[0]);
                const stat = await fs.stat(candidate);
                if (!stat.isFile()) {
                    exitWithError(`${candidate} is not a file.`);
                }
                return candidate;
            }
            if (entries.includes("package.json")) {
                break;
            }
        } catch {
            // Continue
        }

        const parent = path.dirname(dir);
        if (parent === dir) {
            break;
        }
        dir = parent;
    }

    exitWithError("Unable to find Herebyfile.");
}
