import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Task } from "../index.js";

export function compareTaskNames(a: Task, b: Task): number {
    return compareStrings(a.options.name, b.options.name);
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const compareStrings = new Intl.Collator(undefined, { numeric: true }).compare;

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
export class UserError extends Error {}

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
    readonly setExitCode: (code: number) => void;
    readonly version: () => Promise<string>;

    // Third-party package imports.
    readonly resolve: (specifier: string, parent: string) => Promise<string>;
    readonly prettyMilliseconds: (milliseconds: number) => string;
}

export async function real(): Promise<D> {
    const { default: prettyMilliseconds } = await import("pretty-ms");

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
        setExitCode: (code) => {
            process.exitCode = code;
        },
        version: async () => {
            const { resolve } = await import("import-meta-resolve");
            const packageJsonPath = fileURLToPath(await resolve("hereby/package.json", import.meta.url));
            const packageJson = await fs.promises.readFile(packageJsonPath, "utf8");
            const { version } = JSON.parse(packageJson);
            return version;
        },
        resolve: async (specifier, parent) => {
            const { resolve } = await import("import-meta-resolve");
            return resolve(specifier, parent);
        },
        prettyMilliseconds,
    };
    /* eslint-enable no-restricted-globals */
}
