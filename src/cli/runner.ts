import micoSpinner from "mico-spinner";
import os from "os";
import pc from "picocolors";
import prettyMilliseconds from "pretty-ms";

import type { Task } from "../index.js";
import { Runner } from "../runner.js";
import { stringSorter } from "./utils.js";

const defaultConcurrency = os.cpus().length;

export function runTasksWithCLIRunner(...tasks: Task[]) {
    return new CLIRunner({ concurrency: defaultConcurrency }).runTasks(...tasks);
}

type Spinner = ReturnType<typeof micoSpinner>;

const noSpinner = !process.stdout.isTTY;

class CLIRunner extends Runner {
    private _spinner: Spinner | undefined;
    private _errored = false;
    private _finishedTasks = 0;
    private _totalTasks = 0;
    private _runningTasks = new Set<Task>();
    private _startTimes = new Map<Task, number>();

    protected override onTaskAdd(task: Task): void {
        this._totalTasks++;
    }

    protected override onTaskStart(task: Task): void {
        this._runningTasks.add(task);
        this._startTimes.set(task, Date.now());

        if (this._errored) {
            return; // Skip logging.
        }

        if (noSpinner) {
            console.log(`Starting ${pc.blue(task.options.name)}`);
        }

        this._updateSpinner();
    }

    protected override onTaskFinish(task: Task): void {
        this._finishedTasks++;
        this._runningTasks.delete(task);

        if (this._errored) {
            return; // Skip logging.
        }

        const took = Date.now() - this._startTimes.get(task)!;
        console.log(`Finished ${pc.green(task.options.name)} in ${prettyMilliseconds(took)}`);

        if (this._finishedTasks === this._totalTasks) {
            this._clearSpinner();
        } else {
            this._updateSpinner();
        }
    }

    protected override onTaskError(task: Task, e: unknown): void {
        this._finishedTasks++;
        this._runningTasks.delete(task);

        if (this._errored) {
            return; // Skip logging.
        }

        this._errored = true;
        this._clearSpinner();
        console.error(`Error in ${pc.red(task.options.name)}`);
        console.error(`${e}`);
    }

    private _updateSpinner() {
        if (noSpinner) {
            return;
        }

        const prefix = "Running: ";
        const maxWidth = 75; // Roughly the max width of the terminal
        const names = [];
        let charCount = prefix.length + 2;
        let dotDotDot = false;

        for (const task of this._runningTasks) {
            const name = task.options.name;
            const newCharCount = charCount + name.length + 2;

            if (newCharCount > maxWidth) {
                dotDotDot = true;
                break;
            }

            names.push(name);
            charCount = newCharCount;
        }

        names.sort(stringSorter);
        if (dotDotDot) {
            names.push("...");
        }

        if (this._spinner) {
            this._spinner.stop();
        }

        const text = prefix + names.join(", ");
        this._spinner = micoSpinner(text);
        this._spinner.start();
    }

    private _clearSpinner() {
        if (this._spinner) {
            this._spinner.stop();
            this._spinner = undefined;
        }
    }
}
