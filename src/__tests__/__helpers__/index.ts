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
