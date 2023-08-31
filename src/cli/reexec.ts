import { pathToFileURL } from "node:url";

import { type D, UserError } from "./utils.js";

export type ReExecD = Pick<D, "error" | "resolve">;

const cliExportName = "hereby/cli";

/**
 * Checks to see if we need to re-exec another version of hereby.
 * If this function returns true, the caller should return immediately
 * and do no further work.
 */
export async function reexec(d: ReExecD, herebyfilePath: string): Promise<boolean> {
    // If hereby is installed globally, but run against a Herebyfile in some
    // other package, that Herebyfile's import will resolve to a different
    // installation of the hereby package. There's no guarantee that the two
    // are compatible (in fact, they are guaranteed not to as Task is a class).
    //
    // Rather than trying to fix this by messing around with Node's resolution
    // (which won't work in ESM anyway), instead opt to figure out the location
    // of hereby as imported by the Herebyfile, and then "reexec" it by importing.

    const thisCLI = await d.resolve(cliExportName, import.meta.url);
    let otherCLI: string;

    try {
        otherCLI = await d.resolve(cliExportName, pathToFileURL(herebyfilePath).toString());
    } catch {
        throw new UserError("Unable to find hereby; ensure hereby is installed in your package.");
    }

    if (thisCLI === otherCLI) {
        return false;
    }

    await import(otherCLI);
    return true;
}
