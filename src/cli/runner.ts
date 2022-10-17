import assert from "assert";
import chalk from "chalk";

import type { Task } from "../index.js";
import type { D } from "./utils.js";

export type RunnerD = Pick<D, "log" | "error" | "prettyMilliseconds">;

export type Limiter = (fn: () => Promise<void>) => Promise<void>;

export class Runner {
    private _addedTasks = new WeakMap<Task, Promise<void>>();

    private _errored = false;
    private _startTimes = new WeakMap<Task, number>();
    private _d: RunnerD;

    constructor(d: RunnerD) {
        this._d = d;
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

        this._d.log(`Starting ${chalk.blue(task.options.name)}`);
    }

    protected onTaskFinish(task: Task): void {
        if (this._errored) {
            return; // Skip logging.
        }

        const took = Date.now() - checkDefined(this._startTimes.get(task));
        this._d.log(`Finished ${chalk.green(task.options.name)} in ${this._d.prettyMilliseconds(took)}`);
    }

    protected onTaskError(task: Task, e: unknown): void {
        if (this._errored) {
            return; // Skip logging.
        }

        this._errored = true;
        const took = Date.now() - checkDefined(this._startTimes.get(task));
        this._d.error(`Error in ${chalk.red(task.options.name)} in ${this._d.prettyMilliseconds(took)}\n${e}`);
    }
}

function checkDefined<T>(value: T | undefined | null): T {
    assert(value);
    return value;
}
