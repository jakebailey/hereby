import pc from "picocolors";

export function exitWithError(message: string): never {
    // TODO: should this be a throw of a custom Error type,
    // such that we can rely on this in the non-CLI part of the code?
    console.error(`${pc.red("Error")}: ${message}`);
    process.exit(0);
}
