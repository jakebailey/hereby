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
 * A hereby Task. In order to get an instance, call `test`; this
 * type is designed to be opaque and should not be instantiated directly.
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

/**
 * Creates a group of tasks. This is shorthand for creating a task
 * that depends on all of the provided tasks without a run function.
 */
export function group(name: string, ...tasks: Task[]): Task {
    // TODO: is this worth having in the API? It seems trivial to do,
    // and this function doesn't accept a description, which would be helpful.
    return task({
        name,
        dependencies: tasks,
    });
}
