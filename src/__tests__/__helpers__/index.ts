import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ExecutionContext } from "ava";
import { It, Mock } from "moq.ts";

const maxRetries = process.platform === "win32" ? 10 : 0;

const rmRecursive: (p: string) => Promise<void> = fs.promises.rm
    ? (p) => fs.promises.rm(p, { recursive: true, force: true, maxRetries })
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    : (p) => (fs.promises.rmdir as (p: string, opts: { recursive: boolean; }) => Promise<void>)(p, { recursive: true });

export function useTmpdir(t: ExecutionContext): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hereby-"));
    t.teardown(() => rmRecursive(dir));
    return dir;
}

/**
 * Creates a new moq.ts mock whose properties default to failing the current
 * test and throwing an error.
 * @param t The ava task context
 */
export function mock<T>(t: ExecutionContext) {
    return new Mock<T>()
        .setup(() => It.IsAny())
        .callback(({ name }) => {
            const message = `Mock for "${String(name)}" is not implemented`;
            t.fail(message);
            throw new Error(message);
        });
}

/**
 * Normalizes the console output to standardise trailing whitespace and newlines.
 * @param output The console output
 * @returns The normalized string
 */
export function normalizeOutput(output: string) {
    return output.replace(/\r|([ \r]+$)/gm, "");
}

/**
 * Replaces real timing values like "12ms", "1.5s", "2m 5s" with "<time>"
 * so snapshots are deterministic.
 */
export function normalizeTiming(message: string) {
    return message.replace(/\b(\d+(\.\d+)? *(ms|s|h) *)+/g, "<time>");
}
