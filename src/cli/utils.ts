import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { Task } from "../index.js";

export function compareTaskNames(a: Task, b: Task): number {
    return compareStrings(a.options.name, b.options.name);
}

// eslint-disable-next-line @typescript-eslint/unbound-method
const compareStrings = new Intl.Collator(undefined, { numeric: true }).compare;

// Exported for testing.
export function simplifyPath(p: string) {
    p = path.normalize(p);
    const homedir = path.normalize(os.homedir() + path.sep);

    if (p.startsWith(homedir)) {
        p = p.slice(homedir.length);
        return `~${path.sep}${p}`;
    }

    return p;
}

export function findUp<T extends {}>(dir: string, predicate: (dir: string) => T | undefined): T | undefined {
    const root = path.parse(dir).root;

    while (true) {
        const result = predicate(dir);
        if (result !== undefined) return result;
        if (dir === root) break;
        dir = path.dirname(dir);
    }

    return undefined;
}

/**
 * UserError is a special error that, when caught in the CLI will be printed
 * as a message only, without stacktrace. Use this instead of process.exit.
 */
export class UserError extends Error {}

/** Contains all dependencies, for mocking. */
export interface D {
    // Globals.
    readonly log: (message: string) => void;
    readonly error: (message: string) => void;
    readonly cwd: () => string;
    readonly chdir: (directory: string) => void;
    readonly simplifyPath: (p: string) => string;
    readonly argv: readonly string[];
    readonly setExitCode: (code: number) => void;
    readonly version: () => string;

    // Third-party package imports.
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
        version: () => {
            const packageJsonURL = new URL("../../package.json", import.meta.url);
            const packageJson = fs.readFileSync(packageJsonURL, "utf8");
            return JSON.parse(packageJson).version;
        },
        prettyMilliseconds,
    };
    /* eslint-enable no-restricted-globals */
}
