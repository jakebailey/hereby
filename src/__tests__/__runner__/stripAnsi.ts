// Match SGR sequences with any number of numeric parameters (e.g. `\e[1;31m`).
// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\u001B\[[0-9;]*m/g;
export function stripAnsi(s: string): string {
    return s.replace(ANSI_REGEX, "");
}
