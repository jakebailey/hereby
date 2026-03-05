import assert from "node:assert";

export interface TaskOptions {
    /**
     * The name of the task, as referenced in logs and the CLI.
     *
     * This name must not start with a "-" in order to prevent conflicts
     * with flags.
     */
    name: string;

    /**
     * A description of the task, for display in the CLI.
     */
    description?: string | undefined;

    /**
     * A list of tasks that must have been run to completion before
     * this task can execute.
     */
    dependencies?: readonly Task[] | undefined;

    /**
     * A function to execute when this task is run. If this function
     * returns a promise, the task will not be marked as finished until
     * that promise resolves.
     */
    // See: https://github.com/microsoft/TypeScript/issues/49755, https://github.com/microsoft/TypeScript/issues/12871
    run?: (() => void) | (() => PromiseLike<void>) | undefined;

    /**
     * If true, this task will be hidden from `hereby --tasks`.
     */
    hiddenFromTaskList?: boolean | undefined;
}

/**
 * A hereby Task. To get an instance, call `test`.
 */
export class Task {
    // This prevents d.ts emit from emitting an empty class; all other declarations are internal.
    private _!: never;

    /* @internal */
    readonly options: TaskOptions;

    /* @internal */
    static create(options: TaskOptions): Task {
        return new Task(options);
    }

    // Note: private such that "private constructor();" is emitted in the d.ts files,
    // which prevents extending or direct instantiation.
    private constructor(options: TaskOptions) {
        // Runtime typecheck; consumers of hereby may not have enabled
        // typechecking, so this is helpful.

        /* eslint-disable @typescript-eslint/no-unnecessary-condition */
        assert.ok(typeof options.name === "string", "Task name is not a string.");
        assert.ok(
            typeof options.description === "string" || options.description === undefined,
            "Task description is not a string or undefined.",
        );
        assert.ok(
            Array.isArray(options.dependencies) || options.dependencies === undefined,
            "Task dependencies is not an array or undefined.",
        );
        for (const dep of options.dependencies ?? []) {
            assert.ok(dep instanceof Task, "Task dependency is not a task.");
        }
        assert.ok(
            typeof options.run === "function" || options.run === undefined,
            "Task run is not a function or undefined.",
        );
        /* eslint-enable @typescript-eslint/no-unnecessary-condition */

        // Non-type checks.
        assert.ok(options.name !== "", "Task name must not be empty.");
        assert.ok(!options.name.startsWith("-"), 'Task name must not start with "-".');
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        assert.ok(!!(options.dependencies?.length || options.run), "Task must have a run function or dependencies.");

        this.options = options;
    }
}

/**
 * Creates a new Task.
 */
export function task(options: TaskOptions): Task {
    return Task.create(options);
}
