import commandLineUsage from "command-line-usage";
import minimist from "minimist";

import type { TaskFormat } from "./formatTasks.js";

interface CLIOptions {
    readonly help: boolean;
    readonly run: readonly string[];
    readonly herebyfile: string | undefined;
    readonly printTasks: TaskFormat | undefined;
    readonly version: boolean;
}

export function parseArgs(argv: string[]): CLIOptions {
    let parseUnknownAsTask = true;
    const options = minimist(argv, {
        "--": true,
        string: ["herebyfile"],
        boolean: ["tasks", "tasks-simple", "help", "version"],
        alias: {
            "h": "help",
            "T": "tasks",
        },
        unknown: (name) => parseUnknownAsTask && (parseUnknownAsTask = !name.startsWith("-")),
    });

    return {
        help: options["help"],
        run: options._,
        herebyfile: options["herebyfile"],
        printTasks: options["tasks"] ? "normal" : (options["tasks-simple"] ? "simple" : undefined),
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
