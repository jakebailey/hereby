import fs from "fs/promises";
import path from "path";

import { Task } from "../index.js";
import { forEachTask } from "../utils.js";

const filenames = ["Herebyfile", "herebyfile"];
const extensions = ["js", "mjs"];
const allFilenames = new Set(filenames.map((f) => extensions.map((e) => `${f}.${e}`)).flat());

export interface Herebyfile {
    path: string;
    tasks: Task[];
    defaultTask?: Task | undefined;
}

export async function loadHerebyfile(herebyfilePath: string): Promise<Herebyfile> {
    const herebyfile = await import(herebyfilePath); // TODO: try catch and nice error

    const tasks: Task[] = [];
    let defaultTask: Task | undefined;

    for (const [key, value] of Object.entries(herebyfile)) {
        if (value instanceof Task) {
            tasks.push(value);
            if (key === "default") {
                defaultTask = value;
            }
        } else if (Task.__isHerebyTask(value)) {
            // TODO: explain how to fix, or maybe reexec under the other one?
            throw new Error("The config file loaded a different version of hereby.");
        }
    }

    if (tasks.length === 0) {
        throw new Error("Unable to find any tasks.");
    }

    assertUniqueNames(tasks);
    tasks.sort((a, b) => stringCompare(a.options.name, b.options.name));

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
            throw new Error(`Task "${name}" was declared twice.`);
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
                throw new Error(`Found ${matching.join(", ")} in ${dir}; please resolve this ambiguity.`);
            }
            if (matching.length === 1) {
                const candidate = path.join(dir, matching[0]);
                const stat = await fs.stat(candidate);
                if (!stat.isFile()) {
                    throw new Error(`${candidate} is not a file.`);
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

    throw new Error("Unable to find Herebyfile.");
}

function stringCompare(a: string, b: string): number {
    if (a === b) {
        return 0;
    }

    // TODO: I'm sure there's a less silly way to do this.
    return [a, b].sort()[0] === a ? -1 : 1;
}
