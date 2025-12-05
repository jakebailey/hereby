import type { ExecutionContext } from "ava";
import { It, Mock } from "moq.ts";

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
