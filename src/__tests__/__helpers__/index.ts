import { execFile } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { TestContext } from "../__runner__/index.js";
import { stripAnsi } from "../__runner__/stripAnsi.js";

const maxRetries = process.platform === "win32" ? 10 : 0;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- fs.promises.rm doesn't exist on Node 12
const rmRecursive: (p: string) => Promise<void> = fs.promises.rm
    ? (p) => fs.promises.rm(p, { recursive: true, force: true, maxRetries })
    : (p) =>
        (fs.promises.rmdir as (p: string, opts: { recursive: boolean; maxRetries: number; }) => Promise<void>)(p, {
            recursive: true,
            maxRetries,
        });

export function useTmpdir(t: TestContext): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hereby-"));
    t.teardown(() => rmRecursive(dir));
    return dir;
}

/**
 * Normalizes the console output to standardise trailing whitespace and newlines.
 * @param output The console output
 * @returns The normalized string
 */
export function normalizeOutput(output: string) {
    return stripAnsi(output).replace(/\r|([ \r]+$)/gm, "");
}

/**
 * Replaces real timing values like "12ms", "1.5s", "2m 5s" with "<time>"
 * so snapshots are deterministic.
 */
export function normalizeTiming(message: string) {
    return stripAnsi(message).replace(/\b(\d+(\.\d+)? *(ms|m|s|h) *)+/g, "<time>");
}

export interface ExecResult {
    exitCode: number;
    stdout: string;
    stderr: string;
}

export class ExecError extends Error {
    exitCode: number;
    stdout: string;
    stderr: string;

    constructor(result: ExecResult) {
        // Truncate stderr in the message so a runaway child doesn't produce a
        // multi-megabyte error message; the full output is still available on
        // the .stderr property.
        const maxStderr = 4000;
        const trimmed = result.stderr.length > maxStderr
            ? result.stderr.slice(0, maxStderr) + `\n... (${result.stderr.length - maxStderr} more bytes truncated)`
            : result.stderr;
        super(`Process exited with code ${result.exitCode}\n${trimmed}`);
        this.exitCode = result.exitCode;
        this.stdout = result.stdout;
        this.stderr = result.stderr;
    }
}

export function execNode(
    script: string,
    args?: string[],
    opts?: { cwd?: string; nodeOptions?: string[]; reject?: boolean; },
): Promise<ExecResult> {
    const nodeArgs = [...(opts?.nodeOptions ?? []), script, ...(args ?? [])];
    const shouldReject = opts?.reject !== false;
    return new Promise((resolve, rej) => {
        execFile(
            process.execPath,
            nodeArgs,
            { cwd: opts?.cwd, maxBuffer: 100 * 1024 * 1024 },
            (error, stdout, stderr) => {
                // execFile's error.code can be:
                //   - a number: the child's exit code
                //   - a string (e.g., "ENOENT"): a spawn failure; we cannot produce a useful ExecResult
                //   - null/undefined: the child was killed by a signal; error.signal will be set
                if (
                    error
                    && (typeof error.code === "string"
                        || (typeof error.code !== "number" && typeof error.signal === "string"))
                ) {
                    // execFile always passes an Error subclass when error is non-null.
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    rej(error);
                    return;
                }
                const exitCode = error && typeof error.code === "number" ? error.code : (error ? 1 : 0);
                // Normalize CRLF so snapshots are stable across platforms.
                const result: ExecResult = {
                    exitCode,
                    stdout: stdout.replace(/\r\n/g, "\n").replace(/\n$/, ""),
                    stderr: stderr.replace(/\r\n/g, "\n").replace(/\n$/, ""),
                };
                if (shouldReject && exitCode !== 0) {
                    rej(new ExecError(result));
                } else {
                    resolve(result);
                }
            },
        );
    });
}
