import assert from "assert";
import chalk from "chalk";

import type { Task } from "../index.js";
import { Runner } from "../runner.js";
import type { D } from "./utils.js";

export type CLIRunnerD = Pick<D, "log" | "error" | "numCPUs" | "prettyMilliseconds">;

export class CLIRunner extends Runner {
    private _errored = false;
    private _startTimes = new WeakMap<Task, number>();
    private _d: CLIRunnerD;

    constructor(d: CLIRunnerD) {
        super({ concurrency: d.numCPUs });
        this._d = d;
    }

    protected override onTaskStart(task: Task): void {
        this._startTimes.set(task, Date.now());

        if (this._errored) {
            return; // Skip logging.
        }

        this._d.log(`Starting ${chalk.blue(task.options.name)}`);
    }

    protected override onTaskFinish(task: Task): void {
        if (this._errored) {
            return; // Skip logging.
        }

        const took = Date.now() - checkDefined(this._startTimes.get(task));
        this._d.log(`Finished ${chalk.green(task.options.name)} in ${this._d.prettyMilliseconds(took)}`);
    }

    protected override onTaskError(task: Task, e: unknown): void {
        if (this._errored) {
            return; // Skip logging.
        }

        this._errored = true;
        this._d.error(`Error in ${chalk.red(task.options.name)}`);
        this._d.error(`${e}`);
    }
}

function checkDefined<T>(value: T | undefined | null): T {
    assert(value);
    return value;
}
