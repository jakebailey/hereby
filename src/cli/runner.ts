import assert from "node:assert";

import pc from "picocolors";

import type { Task } from "../index.js";
import type { D } from "./utils.js";

export type RunnerD = Pick<D, "log" | "error" | "prettyMilliseconds">;

export class Runner {
    private _addedTasks = new Map<Task, Promise<void>>();

    private _errored = false;
    private _startTimes = new Map<Task, number>();
    private _d: RunnerD;

    constructor(d: RunnerD) {
        this._d = d;
    }

    async runTasks(...tasks: Task[]): Promise<void> {
        // Using allSettled here so that we don't immediately exit; it could be
        // the case that a task has code that needs to run before, e.g. a
        // cleanup function in a "finally" or something.
        const results = await Promise.allSettled(
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

        if (!run) {
            return;
        }

        try {
            this.onTaskStart(task);
            await run();
            this.onTaskFinish(task);
        } catch (e) {
            this.onTaskError(task, e);
            throw e;
        }
    }

    protected onTaskStart(task: Task): void {
        this._startTimes.set(task, Date.now());

        if (this._errored) {
            return; // Skip logging.
        }

        this._d.log(`Starting ${pc.blue(task.options.name)}`);
    }

    protected onTaskFinish(task: Task): void {
        if (this._errored) {
            return; // Skip logging.
        }

        const took = Date.now() - checkDefined(this._startTimes.get(task));
        this._d.log(`Finished ${pc.green(task.options.name)} in ${this._d.prettyMilliseconds(took)}`);
    }

    protected onTaskError(task: Task, e: unknown): void {
        if (this._errored) {
            return; // Skip logging.
        }

        this._errored = true;
        const took = Date.now() - checkDefined(this._startTimes.get(task));
        this._d.error(`Error in ${pc.red(task.options.name)} in ${this._d.prettyMilliseconds(took)}\n${e}`);
    }
}

function checkDefined<T>(value: T | undefined | null): T {
    assert(value);
    return value;
}
