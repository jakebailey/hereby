import chalk from "chalk";
import { fileURLToPath, pathToFileURL } from "url";

import { D, UserError } from "./utils.js";

export type ReExecD = Pick<D, "error" | "execArgv" | "argv" | "execPath" | "foregroundChild" | "resolve">;

export async function reexec(d: ReExecD, herebyfilePath: string): Promise<boolean> {
    // If hereby is installed globally, but run against a Herebyfile in some
    // other package, that Herebyfile's import will resolve to a different
    // installation of the hereby package. There's no guarantee that the two
    // are compatible (in fact, are guaranteed not to be as Task is a class).
    //
    // Rather than trying to fix this by messing around with Node's resolution
    // (which won't work in ESM anyway), instead opt to figure out the location
    // of hereby as imported by the Herebyfile, and fork to execute it instead.
    //
    // TODO: Rather than spawning a child process, perhaps we could instead
    // import the CLI from the other version and run it.

    const thisCLI = await resolveToPath("hereby/cli", new URL(import.meta.url));
    let otherCLI: string;

    try {
        otherCLI = await resolveToPath("hereby/cli", pathToFileURL(herebyfilePath));
    } catch {
        throw new UserError("Unable to find hereby; ensure hereby is installed in your package.");
    }

    if (thisCLI === otherCLI) {
        return false;
    }

    // TODO: If this turns out to be common, remove this warning.
    d.error(`${chalk.yellow("Warning")}: re-running hereby as imported by the Herebyfile.`);

    const args = [...d.execArgv, otherCLI, ...d.argv.slice(2)];
    d.foregroundChild(d.execPath, args);
    return true;

    async function resolveToPath(specifier: string, url: URL) {
        return fileURLToPath(new URL(await d.resolve(specifier, url.toString())));
    }
}
