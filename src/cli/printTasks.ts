import commandLineUsage from "command-line-usage";
import pc from "picocolors";

import type { Task } from "../index.js";
import { stringSorter, taskSorter } from "./utils.js";

export function printTasks(tasks: Task[], defaultTask?: Task) {
    tasks = tasks.slice(0).sort(taskSorter);

    const sections: commandLineUsage.Section[] = [];
    sections.push({
        header: "Available tasks",
        content: tasks.map((task) => {
            const blueName = pc.blue(task.options.name);
            const name = task !== defaultTask ? blueName : `${blueName} (default)`;

            const descriptionParts: string[] = [];
            if (task.options.description) {
                descriptionParts.push(task.options.description);
            }

            if (task.options.dependencies && task.options.dependencies.length > 0) {
                const deps = task.options.dependencies
                    .map((task) => task.options.name)
                    .sort(stringSorter)
                    .map(pc.blue);
                descriptionParts.push(`Depends on: ${deps.join(", ")}`);
            }

            return { name, description: descriptionParts.join("\n") };
        }),
    });

    console.log(commandLineUsage(sections));
}
