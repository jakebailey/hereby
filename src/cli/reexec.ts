import { fileURLToPath, pathToFileURL } from "url";

import { D, UserError } from "./utils.js";

export type ReExecD = Pick<D, "error" | "execArgv" | "argv" | "execPath" | "foregroundChild" | "resolve" | "isPnP">;

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

    if (d.isPnP) {
        // When we are running within PnP, we can't really figure out what to
        // do. import-meta-resolve doesn't implement this, so we can't do
        // anything until import.meta.resolve is no longer experimental.
        //
        // Just assume that everything is okay; we will error later if there's
        // a mismatch.
        return false;
    }

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

    const args = [...d.execArgv, otherCLI, ...d.argv.slice(2)];
    await d.foregroundChild(d.execPath, args);
    return true;

    async function resolveToPath(specifier: string, url: URL) {
        return fileURLToPath(new URL(await d.resolve(specifier, url.toString())));
    }
}
