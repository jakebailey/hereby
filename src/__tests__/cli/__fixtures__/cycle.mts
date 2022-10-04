import { Task, task } from "hereby";

const deps: Task[] = [];

export const a = task({
    name: "a",
    dependencies: deps,
    run: async () => {},
});

export const b = task({
    name: "b",
    dependencies: [a],
    run: async () => {},
});

deps.push(b);
