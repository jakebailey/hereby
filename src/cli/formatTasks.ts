import commandLineUsage from "command-line-usage";
import pc from "picocolors";

import type { Task } from "../index.js";
import { compareTaskNames } from "./utils.js";

export type TaskFormat = "normal" | "simple";

export function formatTasks(format: TaskFormat, tasks: Iterable<Task>, defaultTask: Task | undefined) {
    const visibleTasks = [...tasks].filter(isTaskVisible).sort(compareTaskNames);

    if (format === "simple") {
        return visibleTasks.map((task) => task.options.name).join("\n");
    }

    return commandLineUsage({
        header: "Available tasks",
        content: visibleTasks.map((task) => {
            const name = task === defaultTask
                ? `${pc.green(task.options.name)} (default)`
                : pc.blue(task.options.name);

            let descriptionParts = task.options.description ? [task.options.description] : undefined;
            const deps = task.options.dependencies?.filter(isTaskVisible).sort(compareTaskNames);
            if (deps?.length) {
                const depNames = deps.map((task) => pc.blue(task.options.name));
                (descriptionParts ??= []).push(`Depends on: ${depNames.join(", ")}`);
            }

            return { name, description: descriptionParts?.join("\n") };
        }),
    });
}

function isTaskVisible(task: Task) {
    return !task.options.hiddenFromTaskList;
}
