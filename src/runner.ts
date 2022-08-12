import PQueue from "p-queue";

import type { Task } from "./index.js";

export interface RunnerOptions {
    concurrency?: number | undefined;
}

export class Runner {
    private _addedTasks = new WeakMap<Task, Promise<void>>();
    private _queue: PQueue;

    constructor(options?: RunnerOptions) {
        this._queue = new PQueue({ concurrency: options?.concurrency ?? Infinity });
    }

    async runTask(task: Task): Promise<void> {
        const cached = this._addedTasks.get(task);
        if (cached) {
            return cached;
        }

        const promise = this._runTask(task);
        this._addedTasks.set(task, promise);
        return promise;
    }

    async runTasks(...tasks: Task[]): Promise<void> {
        await Promise.all(tasks.map((t) => this.runTask(t)));
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

        return this._queue.add(async () => {
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
