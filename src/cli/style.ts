/* eslint-disable no-restricted-globals, @typescript-eslint/prefer-nullish-coalescing */
// NO_COLOR (https://no-color.org) takes precedence over everything when set
// to any non-empty value. FORCE_COLOR=0/false explicitly disables; any other
// truthy value forces colors on. Otherwise we enable colors for TTY stdout
// (excluding TERM=dumb) or when running in CI.
export function isColorEnabled(env: NodeJS.ProcessEnv, isTTY: boolean, platform: NodeJS.Platform): boolean {
    if (env["NO_COLOR"]) return false;
    const forceColor = env["FORCE_COLOR"];
    if (forceColor === "0" || forceColor === "false") return false;
    return !!(forceColor || platform === "win32" || (isTTY && env["TERM"] !== "dumb") || env["CI"]);
}

const enabled = isColorEnabled(process.env, process.stdout.isTTY, process.platform);
/* eslint-enable no-restricted-globals, @typescript-eslint/prefer-nullish-coalescing */

function wrap(open: string, close: string): (s: string) => string {
    return enabled ? (s) => open + s + close : (s) => s;
}

export const red = wrap("\u001B[31m", "\u001B[39m");
export const green = wrap("\u001B[32m", "\u001B[39m");
export const yellow = wrap("\u001B[33m", "\u001B[39m");
export const blue = wrap("\u001B[34m", "\u001B[39m");
export const bold = wrap("\u001B[1m", "\u001B[22m");
export const underline = wrap("\u001B[4m", "\u001B[24m");
