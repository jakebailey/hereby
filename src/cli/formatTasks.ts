import commandLineUsage from "command-line-usage";
import pc from "picocolors";

import type { Task } from "../index.js";
import { compareStrings, compareTaskNames } from "./utils.js";

export type TaskFormat = "normal" | "simple";

export function formatTasks(format: TaskFormat, tasks: Task[], defaultTask?: Task) {
    tasks = [...tasks]
        .filter((task) => !task.options.hiddenFromTaskList)
        .sort(compareTaskNames);

    if (format === "simple") {
        return tasks.map((task) => task.options.name).join("\n");
    }

    return commandLineUsage({
        header: "Available tasks",
        content: tasks.map((task) => {
            const name = task === defaultTask
                ? `${pc.green(task.options.name)} (default)`
                : pc.blue(task.options.name);

            const descriptionParts: string[] = [];
            if (task.options.description) {
                descriptionParts.push(task.options.description);
            }

            const deps = task.options.dependencies?.filter((task) => !task.options.hiddenFromTaskList);

            if (deps && deps.length > 0) {
                const depNames = deps
                    .map((task) => task.options.name)
                    .sort(compareStrings)
                    .map((v) => pc.blue(v));
                descriptionParts.push(`Depends on: ${depNames.join(", ")}`);
            }

            return { name, description: descriptionParts.join("\n") };
        }),
    });
}
