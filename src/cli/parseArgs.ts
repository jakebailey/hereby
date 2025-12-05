import minimist from "minimist";
import pc from "picocolors";

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
    const header = (text: string) => pc.bold(pc.underline(text));

    return `
${header("hereby")}

  A simple task runner.

${header("Synopsis")}

  $ hereby <task>

${header("Options")}

  ${pc.bold('-h, --help')}          Display this usage guide.
  ${pc.bold('--herebyfile')} ${pc.underline('path')}   A path to a Herebyfile. Optional.
  ${pc.bold('-T, --tasks')}         Print a listing of the available tasks.
  ${pc.bold('--version')}           Print the current hereby version.

${header("Example usage")}

  $ hereby build
  $ hereby build lint
  $ hereby test --skip someTest --lint=false
  $ hereby --tasks
`;
}
