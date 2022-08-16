import assert from "assert";
import chalk from "chalk";
import prettyMilliseconds from "pretty-ms";

import type { Task } from "../index.js";
import { Runner, RunnerOptions } from "../runner.js";
import type { System } from "./utils.js";

export function runTasksWithCLIRunner(system: System, ...tasks: Task[]) {
    return new CLIRunner({ system, concurrency: system.numCPUs }).runTasks(...tasks);
}

interface CLIRunnerOptions extends RunnerOptions {
    system: System;
}

class CLIRunner extends Runner {
    private _errored = false;
    private _startTimes = new WeakMap<Task, number>();
    private _system: System;

    constructor(options: CLIRunnerOptions) {
        super(options);
        this._system = options.system;
    }

    protected override onTaskStart(task: Task): void {
        this._startTimes.set(task, Date.now());

        if (this._errored) {
            return; // Skip logging.
        }

        this._system.log(`Starting ${chalk.blue(task.options.name)}`);
    }

    protected override onTaskFinish(task: Task): void {
        if (this._errored) {
            return; // Skip logging.
        }

        const took = Date.now() - checkDefined(this._startTimes.get(task));
        this._system.log(`Finished ${chalk.green(task.options.name)} in ${prettyMilliseconds(took)}`);
    }

    protected override onTaskError(task: Task, e: unknown): void {
        if (this._errored) {
            return; // Skip logging.
        }

        this._errored = true;
        this._system.error(`Error in ${chalk.red(task.options.name)}`);
        this._system.error(`${e}`);
    }
}

function checkDefined<T>(value: T | undefined | null): T {
    assert(value);
    return value;
}
