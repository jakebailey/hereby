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
     * A list of tasks that must has been run to completion before
     * this task can execute.
     */
    dependencies?: Task[] | undefined;

    /**
     * A function to execute when this task is run.
     */
    run?: (() => Promise<void>) | undefined;
}

/**
 * A hereby Task. To get an instance, call `test`.
 */
export class Task {
    /* @internal */
    options: TaskOptions;

    /* @internal */
    static create(options: TaskOptions): Task {
        return new Task(options);
    }

    private constructor(options: TaskOptions) {
        if (options.name.startsWith("-")) {
            throw new Error("task name must not start with '-'");
        }
        this.options = options;
    }
}

/**
 * Creates a new Task.
 */
export function task(options: TaskOptions): Task {
    return Task.create(options);
}
