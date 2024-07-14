import fs from "node:fs";
import path from "node:path";
import url from "node:url";

import { findUp, UserError } from "./utils.js";

const thisCLI = url.fileURLToPath(new URL("../cli.js", import.meta.url));
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

    const otherCLI = findUp(path.dirname(herebyfilePath), (dir) => {
        const p = path.resolve(dir, expectedCLIPath);
        // This is the typical case; we've walked up and found it in node_modules.
        if (fs.existsSync(p)) return p;

        // Otherwise, we check to see if we're self-resolving. Realistically,
        // this only happens when developing hereby itself.
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

    await import(url.pathToFileURL(otherCLI).toString());
    return true;
}
