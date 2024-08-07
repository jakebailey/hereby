import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { findUp, UserError } from "./utils.js";

const thisCLI = fileURLToPath(new URL("../cli.js", import.meta.url));
const distCLIPath = path.join("dist", "cli.js");
const expectedCLIPath = path.join("node_modules", "hereby", distCLIPath);

/**
 * Checks to see if we need to re-exec another version of hereby.
 * If this function returns true, the caller should return immediately
 * and do no further work.
 */
export async function reexec(herebyfilePath: string): Promise<boolean> {
    // If hereby is installed globally, but run against a Herebyfile in some
    // other package, that Herebyfile's import will resolve to a different
    // installation of the hereby package. There's no guarantee that the two
    // are compatible (in fact, they are guaranteed not to as Task is a class).
    //
    // Rather than trying to fix this by messing around with Node's resolution
    // (which won't work in ESM anyway), instead opt to figure out the location
    // of hereby as imported by the Herebyfile, and then "reexec" it by importing.
    //
    // This code used to use `import.meta.resolve` to find `hereby/cli`, but
    // manually encoding this behavior is faster and avoids the dependency.
    // If Node ever makes the two-argument form of `import.meta.resolve` unflagged,
    // we could switch to that.

    const otherCLI = findUp(path.dirname(herebyfilePath), (dir) => {
        const p = path.resolve(dir, expectedCLIPath);
        // This is the typical case; we've walked up and found it in node_modules.
        if (fs.existsSync(p)) return p;

        // Otherwise, we check to see if we're self-resolving. Realistically,
        // this only happens when developing hereby itself.
        //
        // Technically, this should go before the above check since self-resolution
        // comes before node_modules resolution, but this could only happen if hereby
        // happened to depend on itself somehow.
        const packageJsonPath = path.join(dir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
            if (packageJson.name === "hereby") {
                return path.resolve(dir, distCLIPath);
            }
        }
        return undefined;
    });

    if (!otherCLI) {
        throw new UserError("Unable to find hereby; ensure hereby is installed in your package.");
    }

    if (fs.realpathSync(thisCLI) === fs.realpathSync(otherCLI)) {
        return false;
    }

    // Note: calling pathToFileURL is required on Windows to disambiguate URLs
    // from drive letters.
    await import(pathToFileURL(otherCLI).toString());
    return true;
}
