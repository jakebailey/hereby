import { performance } from "node:perf_hooks";

import pc from "picocolors";

import type { Task } from "../index.js";
import { prettyMilliseconds } from "./utils.js";
import type { D } from "./utils.js";

export type RunnerD = Pick<D, "log" | "error">;

export class Runner {
    private readonly _addedTasks = new Map<Task, Promise<void>>();

    readonly failedTasks: string[] = [];

    constructor(private readonly _d: RunnerD) {}

    async runTasks(...tasks: Task[]): Promise<void> {
        // Using allSettled here so that we don't immediately exit; it could be
        // the case that a task has code that needs to run before, e.g. a
        // cleanup function in a "finally" or something.
        const results = await Promise.allSettled(
            tasks.map((task) => {
                const cached = this._addedTasks.get(task);
                if (cached) return cached;

                const promise = this._runTask(task);
                this._addedTasks.set(task, promise);
                return promise;
            }),
        );
        for (const result of results) {
            if (result.status === "rejected") {
                throw result.reason;
            }
        }
    }

    private async _runTask(task: Task): Promise<void> {
        const { dependencies, run } = task.options;

        if (dependencies) {
            await this.runTasks(...dependencies);
        }

        if (!run) return;

        const start = performance.now();
        try {
            if (this.failedTasks.length === 0) {
                this._d.log(`Starting ${pc.blue(task.options.name)}`);
            }
            await run();
            if (this.failedTasks.length === 0) {
                const took = performance.now() - start;
                this._d.log(`Finished ${pc.green(task.options.name)} in ${prettyMilliseconds(took)}`);
            }
        } catch (e) {
            this.failedTasks.push(task.options.name);
            if (this.failedTasks.length === 1) {
                const took = performance.now() - start;
                this._d.error(`Error in ${pc.red(task.options.name)} in ${prettyMilliseconds(took)}\n${e}`);
            }
            throw e;
        }
    }
}
