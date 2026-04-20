import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { ExecutionContext } from "ava";

const maxRetries = process.platform === "win32" ? 10 : 0;

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- fs.promises.rm doesn't exist on Node 12
const rmRecursive: (p: string) => Promise<void> = fs.promises.rm
    ? (p) => fs.promises.rm(p, { recursive: true, force: true, maxRetries })
    : (p) => (fs.promises.rmdir as (p: string, opts: { recursive: boolean; }) => Promise<void>)(p, { recursive: true });

export function useTmpdir(t: ExecutionContext): string {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hereby-"));
    t.teardown(() => rmRecursive(dir));
    return dir;
}

/**
 * Creates a mock whose unset properties fail the current test and throw.
 */
export function mock<T extends object>(t: ExecutionContext, props: Partial<T>): T {
    return new Proxy(props as T, {
        get(target, prop, receiver) {
            if (Object.prototype.hasOwnProperty.call(target, prop)) {
                return Reflect.get(target, prop, receiver);
            }
            // Don't fail tests on symbol probes (Symbol.toPrimitive,
            // Symbol.toStringTag, util.inspect.custom, etc.) or on the
            // `then` duck-type check used to detect thenables.
            if (typeof prop === "symbol" || prop === "then") {
                return undefined;
            }
            const message = `Mock for "${prop}" is not implemented`;
            t.fail(message);
            throw new Error(message);
        },
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
    return message.replace(/\b(\d+(\.\d+)? *(ms|m|s|h) *)+/g, "<time>");
}
