import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

interface CLIOptions {
    help?: boolean | undefined;
    run?: string[] | undefined;
    herebyfile?: string | undefined;
    printTasks?: "normal" | "simple" | undefined;
    printTasksSimple?: boolean | undefined;
    version?: boolean | undefined;
}

export function parseArgs(argv: string[]): CLIOptions {
    const idx = argv.indexOf("--");
    if (idx !== -1) {
        argv = argv.slice(0, idx);
    }

    const options = commandLineArgs(
        [
            { name: "run", multiple: true, defaultOption: true, type: String },
            { name: "herebyfile", type: String },
            { name: "tasks", alias: "T", type: Boolean },
            { name: "tasks-simple", type: Boolean },
            { name: "help", alias: "h", type: Boolean },
            { name: "version", type: Boolean },
        ],
        {
            argv,
            stopAtFirstUnknown: true,
        },
    );

    return {
        help: options["help"],
        run: options["run"],
        herebyfile: options["herebyfile"],
        printTasks: options["tasks"] ? "normal" : options["tasks-simple"] ? "simple" : undefined,
        version: options["version"],
    };
}

export function getUsage(): string {
    const usage = commandLineUsage([
        {
            header: "hereby",
            content: "A simple task runner.",
        },
        {
            header: "Synopsis",
            content: "$ hereby <task>",
        },
        {
            header: "Options",
            optionList: [
                {
                    name: "help",
                    description: "Display this usage guide.",
                    alias: "h",
                    type: Boolean,
                },
                {
                    name: "herebyfile",
                    description: "A path to a Herebyfile. Optional.",
                    type: String,
                    defaultOption: true,
                    typeLabel: "{underline path}",
                },
                {
                    name: "tasks",
                    description: "Print a listing of the available tasks.",
                    alias: "T",
                    type: Boolean,
                },
                {
                    name: "version",
                    description: "Print the current hereby version.",
                    type: Boolean,
                },
            ],
        },
        {
            header: "Example usage",
            content: [
                "$ hereby build",
                "$ hereby build lint",
                "$ hereby test --skip someTest --lint=false",
                "$ hereby --tasks",
            ],
        },
    ]);

    return usage;
}
