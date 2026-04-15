import fs from "node:fs";
import os from "node:os";
import path from "node:path";

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

export function prettyMilliseconds(ms: number): string {
    if (ms < 1000) return `${Math.ceil(ms)}ms`;

    const seconds = (ms / 1000) % 60;
    const minutes = Math.floor(ms / 60_000) % 60;
    const hours = Math.floor(ms / 3_600_000);
    // Round to one decimal, with an epsilon to avoid floating point errors (e.g. 5.0000001 -> 5).
    const roundedSeconds = Math.floor(seconds * 10 + 0.000_000_1) / 10;

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (roundedSeconds > 0) {
        parts.push(roundedSeconds % 1 === 0 ? `${roundedSeconds}s` : `${roundedSeconds.toFixed(1)}s`);
    }
    return parts.join(" ");
}

/**
 * UserError is a special error that, when caught in the CLI will be printed
 * as a message only, without stacktrace. Use this instead of process.exit.
 */
export class UserError extends Error {}

/** Contains all dependencies, for mocking. */
export interface D {
    // Globals.
    readonly columns: () => number;
    readonly log: (message: string) => void;
    readonly error: (message: string) => void;
    readonly cwd: () => string;
    readonly chdir: (directory: string) => void;
    readonly simplifyPath: (p: string) => string;
    readonly argv: readonly string[];
    readonly setExitCode: (code: number) => void;
    readonly version: () => string;
}

export function real(): D {
    /* eslint-disable no-restricted-globals */
    return {
        columns: () => process.stdout.isTTY && process.stdout.columns || 80,
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
    };
    /* eslint-enable no-restricted-globals */
}
