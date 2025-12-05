import pc from "picocolors";

import type { Task } from "../index.js";
import { formatAsColumns, visibleLength } from "./textWrapping.js";
import { compareTaskNames } from "./utils.js";

interface TaskInfo {
    name: string;
    description: string | undefined;
}

export type TaskFormat = "normal" | "simple";

export function formatTasks(format: TaskFormat, tasks: Iterable<Task>, defaultTask: Task | undefined) {
    const visibleTasks = [...tasks].filter(isTaskVisible).sort(compareTaskNames);

    if (format === "simple") {
        return visibleTasks.map((task) => task.options.name).join("\n");
    }

    const taskInfos: TaskInfo[] = visibleTasks.map((task) => {
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
    });

    return `
${pc.bold(pc.underline("Available tasks"))}

${formatTasksAsColumns(taskInfos)}`;
}

function isTaskVisible(task: Task) {
    return !task.options.hiddenFromTaskList;
}

function formatTasksAsColumns(tasks: TaskInfo[]): string {
    if (tasks.length === 0) {
        return "";
    }

    // There's a 2 space indent plus 3 spaces between columns, hence take away 5
    // padding spaces from the available width
    const maxTotalWidth = (process.stdout.columns ?? 80) - 5;
    const maxNameWidth = Math.max(...tasks.map((task) => visibleLength(task.name)));

    // Check the name doesn't take up more than half the space
    const nameWidth = Math.min(maxNameWidth, maxTotalWidth >> 1);
    const descriptionWidth = maxTotalWidth - nameWidth;
    const formatted = tasks.map((x) => formatAsColumns("  ", x.name, nameWidth, x.description ?? "", descriptionWidth));
    return formatted.join("");
}
