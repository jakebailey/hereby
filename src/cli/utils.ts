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
export class UserError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * When thrown, ExitCodeError causes the process to exit with a specific error code,
 * without logging anything.
 */
export class ExitCodeError {
    constructor(public exitCode: number) {}
}

/** Contains all dependencies, for mocking. */
export interface D {
    // Globals.
    log(message: string): void;
    error(message: string): void;
    cwd(): string;
    chdir(directory: string): void;
    argv: string[];
    execArgv: string[];
    execPath: string;
    setExitCode(code: number): void;
    numCPUs: number;

    // Third-party package imports.
    foregroundChild(program: string, args: string[]): void;
    resolve(specifier: string, parent: string): Promise<string>;
    prettyMilliseconds(milliseconds: number): string;
}

/* eslint-disable no-restricted-globals */
export async function real(): Promise<D> {
    const { default: foregroundChild } = await import("foreground-child");
    const { resolve } = await import("import-meta-resolve");
    const { default: prettyMilliseconds } = await import("pretty-ms");

    return {
        log: console.log,
        error: console.error,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        cwd: process.cwd,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        chdir: process.chdir,
        argv: process.argv,
        execArgv: process.execArgv,
        execPath: process.execPath,
        setExitCode: (code) => {
            process.exitCode = code;
        },
        numCPUs: os.cpus().length,
        foregroundChild,
        resolve,
        prettyMilliseconds,
    };
}
/* eslint-enable no-restricted-globals */
