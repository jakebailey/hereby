import chalk from "chalk";
import commandLineUsage from "command-line-usage";

import type { Task } from "../index.js";
import { stringSorter, taskSorter } from "./utils.js";

export type TaskFormat = "normal" | "simple";

export function formatTasks(format: TaskFormat, tasks: Task[], defaultTask?: Task) {
    tasks = tasks
        .slice(0)
        .filter((task) => !task.options.hiddenFromTaskList)
        .sort(taskSorter);

    if (format === "simple") {
        return tasks.map((task) => task.options.name).join("\n");
    }

    const sections: commandLineUsage.Section[] = [];
    sections.push({
        header: "Available tasks",
        content: tasks.map((task) => {
            const name =
                task !== defaultTask ? chalk.blue(task.options.name) : `${chalk.green(task.options.name)} (default)`;

            const descriptionParts: string[] = [];
            if (task.options.description) {
                descriptionParts.push(task.options.description);
            }

            const deps = task.options.dependencies?.filter((task) => !task.options.hiddenFromTaskList);

            if (deps && deps.length > 0) {
                const depNames = deps
                    .map((task) => task.options.name)
                    .sort(stringSorter)
                    .map((v) => chalk.blue(v));
                descriptionParts.push(`Depends on: ${depNames.join(", ")}`);
            }

            return { name, description: descriptionParts.join("\n") };
        }),
    });

    return commandLineUsage(sections);
}
