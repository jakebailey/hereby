import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import type { Task } from "../index.js";

export function taskSorter(a: Task, b: Task): number {
    return stringSorter(a.options.name, b.options.name);
}

export function stringSorter(a: string, b: string): number {
    return a.localeCompare(b);
}

// Exported for testing.
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
    constructor(public exitCode: number, public reason?: any) {}
}

/** Contains all dependencies, for mocking. */
export interface D {
    // Globals.
    readonly log: (message: string) => void;
    readonly error: (message: string) => void;
    readonly cwd: () => string;
    readonly chdir: (directory: string) => void;
    readonly simplifyPath: (p: string) => string;
    readonly argv: string[];
    readonly execArgv: string[];
    readonly execPath: string;
    readonly setExitCode: (code: number) => void;
    readonly version: string;
    readonly isPnP: boolean;

    // Third-party package imports.
    readonly foregroundChild: (program: string, args: string[]) => void;
    readonly resolve: (specifier: string, parent: string) => Promise<string>;
    readonly prettyMilliseconds: (milliseconds: number) => string;
}

export async function real(): Promise<D> {
    const { default: foregroundChild } = await import("foreground-child");
    const { resolve } = await import("import-meta-resolve");
    const { default: prettyMilliseconds } = await import("pretty-ms");

    const packageJsonPath = fileURLToPath(await resolve("hereby/package.json", import.meta.url));
    const packageJson = await fs.promises.readFile(packageJsonPath, "utf-8");
    const { version } = JSON.parse(packageJson);

    /* eslint-disable no-restricted-globals */
    return {
        log: console.log,
        error: console.error,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        cwd: process.cwd,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        chdir: process.chdir,
        simplifyPath,
        argv: process.argv,
        execArgv: process.execArgv,
        execPath: process.execPath,
        setExitCode: (code) => {
            process.exitCode = code;
        },
        version,
        isPnP: !!process.versions["pnp"],
        foregroundChild,
        resolve,
        prettyMilliseconds,
    };
    /* eslint-enable no-restricted-globals */
}
