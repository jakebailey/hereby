import os from "os";
import pc from "picocolors";
import prettyMilliseconds from "pretty-ms";

import type { Task } from "../index.js";
import { Runner, RunnerOptions } from "../runner.js";

const numCPUs = os.cpus().length;

export function runTasksWithCLIRunner(...tasks: Task[]) {
    return new CLIRunner({ concurrency: numCPUs }).runTasks(...tasks);
}

interface CLIRunnerOptions extends RunnerOptions {}

class CLIRunner extends Runner {
    private _errored = false;
    private _startTimes = new Map<Task, number>();

    constructor(options?: CLIRunnerOptions) {
        super(options);
    }

    protected override onTaskStart(task: Task): void {
        this._startTimes.set(task, Date.now());

        if (this._errored) {
            return; // Skip logging.
        }

        console.log(`Starting ${pc.blue(task.options.name)}`);
    }

    protected override onTaskFinish(task: Task): void {
        if (this._errored) {
            return; // Skip logging.
        }

        const took = Date.now() - this._startTimes.get(task)!;
        console.log(`Finished ${pc.green(task.options.name)} in ${prettyMilliseconds(took)}`);
    }

    protected override onTaskError(task: Task, e: unknown): void {
        if (this._errored) {
            return; // Skip logging.
        }

        this._errored = true;
        console.error(`Error in ${pc.red(task.options.name)}`);
        console.error(`${e}`);
    }
}
