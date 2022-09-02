import { default as throat } from "throat";

import type { Task } from "./index.js";

export interface RunnerOptions {
    concurrency?: number | undefined;
}

export class Runner {
    private _addedTasks = new WeakMap<Task, Promise<void>>();
    private _throat = (fn: () => Promise<void>) => fn();

    constructor(options?: RunnerOptions) {
        const concurrency = options?.concurrency;
        if (concurrency !== undefined) {
            this._throat = throat(concurrency);
        }
    }

    async runTasks(...tasks: Task[]): Promise<void> {
        await Promise.all(
            tasks.map((task) => {
                const cached = this._addedTasks.get(task);
                if (cached) {
                    return cached;
                }

                const promise = this._runTask(task);
                this._addedTasks.set(task, promise);
                return promise;
            }),
        );
    }

    private async _runTask(task: Task): Promise<void> {
        this.onTaskAdd?.(task);

        const { dependencies, run } = task.options;

        if (dependencies) {
            await this.runTasks(...dependencies);
        }

        if (!run) {
            return;
        }

        return this._throat(async () => {
            try {
                this.onTaskStart?.(task);
                await run();
                this.onTaskFinish?.(task);
            } catch (e) {
                this.onTaskError?.(task, e);
                throw e;
            }
        });
    }

    protected onTaskAdd?(task: Task): void;
    protected onTaskStart?(task: Task): void;
    protected onTaskFinish?(task: Task): void;
    protected onTaskError?(task: Task, e: unknown): void;
}
