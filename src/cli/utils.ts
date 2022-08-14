import os from "os";
import path from "path";

import type { Task } from "../index.js";

export function taskSorter(a: Task, b: Task): number {
    return stringSorter(a.options.name, b.options.name);
}

export function stringSorter(a: string, b: string): number {
    return a.localeCompare(b);
}

export function simplifyPath(p: string) {
    let homedir = os.homedir();
    if (!p.endsWith(path.sep)) {
        homedir += path.sep;
    }

    if (p.startsWith(homedir)) {
        p = p.slice(homedir.length);
        return `~${path.sep}${p}`;
    }

    return p;
}

/**
 * UserError is a special error that, when caught in the CLI will be printed
 * as a message only, without stacktrace. Use this instead of process.exit.
 */
export class UserError extends Error {}

/**
 * When thrown, ExitCodeError causes the process to exit with a specific error code,
 * without logging anything.
 */
export class ExitCodeError {
    constructor(public exitCode: number) {}
}

export type Process = Pick<NodeJS.Process, "stdout" | "stderr" | "cwd" | "chdir" | "argv" | "exitCode">;

export interface System {
    log(message: string): void;
    error(message: string): void;
    process: Process;
    numCPUs: number;
}

export function createSystem(process: Process): System {
    return {
        log(message) {
            process.stdout.write(message + "\n");
        },
        error(message) {
            process.stderr.write(message + "\n");
        },
        process,
        numCPUs: os.cpus().length,
    };
}
