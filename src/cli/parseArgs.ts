import pc from "picocolors";

import type { TaskFormat } from "./formatTasks.js";
import { UserError } from "./utils.js";

interface CLIOptions {
    readonly help: boolean;
    readonly run: readonly string[];
    readonly herebyfile: string | undefined;
    readonly printTasks: TaskFormat | undefined;
    readonly version: boolean;
}

export function parseArgs(argv: string[]): CLIOptions {
    const run: string[] = [];
    let help = false, version = false, collect = true, tasks = false, tasksSimple = false;
    let herebyfile: string | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--") break;
        if (!arg.startsWith("-") || arg === "-") {
            if (collect) run.push(arg);
            continue;
        }
        const eq = arg.indexOf("=");
        const name = (eq === -1 ? arg : arg.slice(0, eq)).replace(/^--?/, "");
        const peek = eq !== -1 ? arg.slice(eq + 1) : argv[i + 1];
        const consume = (pred: (s: string) => boolean) =>
            eq !== -1 || (peek !== undefined && pred(peek) && ++i) ? peek : undefined;
        const bool = () => consume((s) => s === "true" || s === "false") !== "false";
        const str = () => {
            const v = consume((s) => !s.startsWith("-"));
            if (!v) throw new UserError(`Option --${name} requires a value.`);
            return v;
        };
        if (name === "h" || name === "help") help = bool();
        else if (name === "T" || name === "tasks") tasks = bool();
        else if (name === "tasks-simple") tasksSimple = bool();
        else if (name === "version") version = bool();
        else if (name === "herebyfile") herebyfile = str();
        else collect = false;
    }

    return { help, run, herebyfile, printTasks: tasks ? "normal" : tasksSimple ? "simple" : undefined, version };
}

export function getUsage(): string {
    const header = (text: string) => pc.bold(pc.underline(text));

    return `
${header("hereby")}

  A simple task runner.

${header("Synopsis")}

  $ hereby <task>

${header("Options")}

  ${pc.bold("-h, --help")}          Display this usage guide.
  ${pc.bold("--herebyfile")} ${pc.underline("path")}   A path to a Herebyfile. Optional.
  ${pc.bold("-T, --tasks")}         Print a listing of the available tasks.
  ${pc.bold("--version")}           Print the current hereby version.

${header("Example usage")}

  $ hereby build
  $ hereby build lint
  $ hereby test --skip someTest --lint=false
  $ hereby --tasks
`;
}
