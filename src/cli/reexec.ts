import { pathToFileURL } from "url";

import { D, UserError } from "./utils.js";

export type ReExecD = Pick<D, "error" | "resolve" | "isPnP">;

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

    if (d.isPnP) {
        // When we are running within PnP, we can't really figure out what to
        // do. import-meta-resolve doesn't implement this, so we can't do
        // anything until import.meta.resolve is no longer experimental.
        //
        // Just assume that everything is okay; we will error later if there's
        // a mismatch.
        return false;
    }

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
