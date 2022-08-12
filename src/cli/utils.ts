import os from "os";
import path from "path";
import pc from "picocolors";

import type { Task } from "../index.js";

export function exitWithError(message: string): never {
    // TODO: should this be a throw of a custom Error type,
    // such that we can rely on this in the non-CLI part of the code?
    console.error(`${pc.red("Error")}: ${message}`);
    process.exit(0);
}

export function taskSorter(a: Task, b: Task): number {
    return stringSorter(a.options.name, b.options.name);
}

export function stringSorter(a: string, b: string): number {
    return a.localeCompare(b);
}

export function simplifyPath(p: string) {
    let homedir = os.homedir();
    if (!p.endsWith(path.sep)) {
        homedir += path.sep;
    }

    if (p.startsWith(homedir)) {
        p = p.slice(homedir.length);
        return `~${path.sep}${p}`;
    }

    return p;
}