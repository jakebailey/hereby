import type { Task } from "./index.js";

export function forEachTask(tasks: Task[], fn: (task: Task) => void, seen = new Set<Task>()): void {
    tasks.forEach(visit);
    return;

    function visit(task: Task) {
        if (seen.has(task)) {
            return;
        }

        seen.add(task);
        fn(task);

        task.options.dependencies?.forEach(visit);
    }
}
