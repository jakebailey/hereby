import commandLineArgs from "command-line-args";
import commandLineUsage from "command-line-usage";

interface CLIOptions {
    run?: string[] | undefined;
    herebyfile?: string | undefined;
    printTasks?: boolean | undefined;
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
            { name: "help", alias: "h", type: Boolean },
        ],
        {
            argv,
            stopAtFirstUnknown: true,
        },
    );

    if (options["help"]) {
        printUsage();
    }

    return {
        run: options["run"],
        herebyfile: options["herebyfile"],
        printTasks: options["tasks"],
    };
}

function printUsage(): never {
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

    console.log(usage);
    process.exit(0);
}
