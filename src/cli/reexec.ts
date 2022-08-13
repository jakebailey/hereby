import cp from "child_process";
import { resolve } from "import-meta-resolve";
import pc from "picocolors";
import { fileURLToPath, pathToFileURL } from "url";

import { ExitCodeError } from "./utils.js";

export async function reexecIfNeeded(herebyfilePath: string) {
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
    const otherCLI = await resolveToPath("hereby/cli", pathToFileURL(herebyfilePath));

    if (thisCLI === otherCLI) {
        return;
    }

    // TODO: If this turns out to be common, remove this warning.
    console.error(`${pc.yellow("Warning")}: re-running hereby as imported by the Herebyfile.`);

    // cp.fork is asynchronous and requires setting up a callback in order to
    // capture the exit state. Since we want the current process to exit at the
    // end of this function anyway, just use the synchronous spawnSync and exit
    // with its code instead.
    const args = [...process.execArgv, otherCLI, ...process.argv.slice(2)];
    const { status } = cp.spawnSync(process.execPath, args, { stdio: "inherit" });
    // If status is null, then the child process was killed via a signal. Ensure
    // our exit code indicates an error.
    throw new ExitCodeError(status ?? 1);
}

async function resolveToPath(specifier: string, url: URL) {
    return fileURLToPath(new URL(await resolve(specifier, url.toString())));
}
