import assert from "node:assert";

import { serialize } from "./serialize.js";
import type { SnapshotManager } from "./snapshot.js";
import { stripAnsi } from "./stripAnsi.js";

export interface TestContext {
    is(actual: unknown, expected: unknown, message?: string): void;
    true(value: unknown, message?: string): void;
    false(value: unknown, message?: string): void;
    truthy(value: unknown, message?: string): void;
    assert(value: unknown, message?: string): void;
    pass(): void;
    fail(message?: string): never;
    regex(string: string, regex: RegExp, message?: string): void;
    throws(fn: () => unknown, expectations?: ThrowsExpectation): unknown;
    throwsAsync(
        fnOrPromise: (() => Promise<unknown>) | Promise<unknown>,
        expectations?: ThrowsExpectation,
    ): Promise<unknown>;
    snapshot(value: unknown, label?: string): void;
    plan(count: number): void;
    teardown(fn: () => void | Promise<void>): void;
    mock<T extends object>(props: Partial<T>): T;
}

export interface ThrowsExpectation {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    instanceOf?: Function;
    message?: string | RegExp;
}

type TestFn = (t: TestContext) => void | Promise<void>;

export interface TestEntry {
    name: string;
    fn: TestFn;
    skip: boolean;
}

export interface TestResult {
    name: string;
    status: "passed" | "failed" | "skipped";
    error?: unknown;
}

function checkExpectations(error: unknown, expectations?: ThrowsExpectation): void {
    if (!expectations) return;
    if (expectations.instanceOf) {
        assert.ok(
            error instanceof expectations.instanceOf,
            `Expected error to be instance of ${expectations.instanceOf.name}, got ${String(error)}`,
        );
    }
    if (expectations.message !== undefined) {
        const rawMsg = error && typeof error === "object" && "message" in error
            ? (error as { message: string; }).message
            : String(error);
        const msg = stripAnsi(rawMsg);
        if (typeof expectations.message === "string") {
            assert.strictEqual(msg, expectations.message);
        } else {
            // Use a fresh RegExp so we don't mutate the caller's lastIndex.
            const re = new RegExp(expectations.message.source, expectations.message.flags);
            if (!re.test(msg)) {
                assert.fail(`Expected error message "${msg}" to match ${expectations.message}`);
            }
        }
    }
}

class TestContextImpl implements TestContext {
    private _assertionCount = 0;
    private _plannedCount = -1;
    private _snapshotCounter = 0;
    private _teardowns: (() => void | Promise<void>)[] = [];
    private _testName: string;
    private _snapshots: SnapshotManager;

    constructor(testName: string, snapshots: SnapshotManager) {
        this._testName = testName;
        this._snapshots = snapshots;
    }

    checkPlan(): void {
        if (this._plannedCount >= 0 && this._assertionCount !== this._plannedCount) {
            throw new Error(
                `Planned ${this._plannedCount} assertions, but ${this._assertionCount} were run.`,
            );
        }
    }

    async runTeardowns(): Promise<void> {
        const errors: unknown[] = [];
        for (let i = this._teardowns.length - 1; i >= 0; i--) {
            try {
                await this._teardowns[i]();
            } catch (e) {
                errors.push(e);
            }
        }
        if (errors.length === 1) {
            throw errors[0];
        }
        if (errors.length > 1) {
            const messages = errors.map((e, i) => `  Teardown ${i + 1}: ${e instanceof Error ? e.message : String(e)}`);
            const err = new Error(`Multiple teardown failures:\n${messages.join("\n")}`);
            (err as unknown as { errors: unknown[]; }).errors = errors;
            throw err;
        }
    }

    is(actual: unknown, expected: unknown, message?: string): void {
        this._assertionCount++;
        assert.strictEqual(actual, expected, message);
    }

    true(value: unknown, message?: string): void {
        this._assertionCount++;
        assert.strictEqual(value, true, message ?? `Expected true, got ${serialize(value)}`);
    }

    false(value: unknown, message?: string): void {
        this._assertionCount++;
        assert.strictEqual(value, false, message ?? `Expected false, got ${serialize(value)}`);
    }

    truthy(value: unknown, message?: string): void {
        this._assertionCount++;
        assert.ok(value, message ?? `Expected truthy value, got ${serialize(value)}`);
    }

    assert(value: unknown, message?: string): void {
        this._assertionCount++;
        assert.ok(value, message);
    }

    pass(): void {
        this._assertionCount++;
    }

    fail(message?: string): never {
        this._assertionCount++;
        assert.fail(message ?? "Test failed");
    }

    regex(string: string, regex: RegExp, message?: string): void {
        this._assertionCount++;
        // Use a fresh RegExp so we don't mutate the caller's lastIndex.
        const re = new RegExp(regex.source, regex.flags);
        if (!re.test(string)) {
            assert.fail(message ?? `Expected "${string}" to match ${regex}`);
        }
    }

    throws(fn: () => unknown, expectations?: ThrowsExpectation): unknown {
        this._assertionCount++;
        try {
            fn();
        } catch (e) {
            checkExpectations(e, expectations);
            return e;
        }
        assert.fail("Expected function to throw");
    }

    async throwsAsync(
        fnOrPromise: (() => Promise<unknown>) | Promise<unknown>,
        expectations?: ThrowsExpectation,
    ): Promise<unknown> {
        this._assertionCount++;
        try {
            const promise = typeof fnOrPromise === "function" ? fnOrPromise() : fnOrPromise;
            await promise;
        } catch (e) {
            checkExpectations(e, expectations);
            return e;
        }
        assert.fail("Expected promise to reject");
    }

    snapshot(value: unknown, label?: string): void {
        this._assertionCount++;
        this._snapshotCounter++;
        const labelPart = label ?? `Snapshot ${this._snapshotCounter}`;
        if (labelPart.includes(" > ")) {
            throw new Error(`Snapshot label must not contain " > ": ${JSON.stringify(labelPart)}`);
        }
        const key = this._testName + " > " + labelPart;
        const serialized = stripAnsi(serialize(value));
        this._snapshots.assertSnapshot(key, serialized);
    }

    plan(count: number): void {
        this._plannedCount = count;
    }

    teardown(fn: () => void | Promise<void>): void {
        this._teardowns.push(fn);
    }

    mock<T extends object>(props: Partial<T>): T {
        const t = this; // eslint-disable-line @typescript-eslint/no-this-alias
        return new Proxy(props as T, {
            get(target, prop, receiver): unknown {
                if (Object.prototype.hasOwnProperty.call(target, prop)) {
                    return Reflect.get(target, prop, receiver);
                }
                // Don't fail tests on symbol probes (Symbol.toPrimitive,
                // Symbol.toStringTag, util.inspect.custom, etc.) or on the
                // `then` duck-type check used to detect thenables.
                if (typeof prop === "symbol" || prop === "then") {
                    return undefined;
                }
                return t.fail(`Mock for "${prop}" is not implemented`);
            },
        });
    }
}

// Tests are registered into a single module-global list. The runner is
// responsible for calling clearTests() between test files.
let registeredTests: TestEntry[] = [];

function registerTest(
    name: string,
    fn: TestFn,
    skip: boolean,
): void {
    if (name.includes(" > ")) {
        throw new Error(`Test name must not contain " > ": ${JSON.stringify(name)}`);
    }
    if (registeredTests.some((t) => t.name === name)) {
        throw new Error(`Duplicate test name: "${name}"`);
    }
    registeredTests.push({ name, fn, skip });
}

export const test = Object.assign(
    (name: string, fn: TestFn) => {
        registerTest(name, fn, false);
    },
    {
        skip: (name: string, fn: TestFn) => {
            registerTest(name, fn, true);
        },
    },
);

export async function runRegisteredTests(
    snapshots: SnapshotManager,
    matchSubstring?: string,
): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const entry of registeredTests) {
        if (matchSubstring !== undefined && !entry.name.includes(matchSubstring)) {
            // Preserve any snapshots owned by filtered-out tests so a partial
            // run with --match cannot prune them on --update-snapshots.
            snapshots.preserveKeys(entry.name);
            continue;
        }

        if (entry.skip) {
            snapshots.preserveKeys(entry.name);
            results.push({ name: entry.name, status: "skipped" });
            continue;
        }

        const ctx = new TestContextImpl(entry.name, snapshots);
        let status: "passed" | "failed" = "passed";
        let error: unknown;

        try {
            await entry.fn(ctx);
            ctx.checkPlan();
        } catch (e) {
            status = "failed";
            error = e;
        } finally {
            try {
                await ctx.runTeardowns();
            } catch (e) {
                if (status === "passed") {
                    status = "failed";
                    error = e;
                } else {
                    const testMsg = error instanceof Error ? error.message : String(error);
                    const teardownMsg = e instanceof Error ? e.message : String(e);
                    error = new Error(`Test failed: ${testMsg}\nTeardown also failed: ${teardownMsg}`);
                }
            }
        }

        results.push({ name: entry.name, status, error });
    }

    snapshots.save();
    return results;
}

export function clearTests(): void {
    registeredTests = [];
}
