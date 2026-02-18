import Wordwrap from "wordwrapjs";

export function formatAsColumns(
    indent: string,
    leftText: string,
    leftWidth: number,
    rightText: string,
    rightWidth: number,
): string {
    const leftLines = wrapText(leftText, leftWidth);
    const rightLines = wrapText(rightText, rightWidth);
    const maxLines = Math.max(leftLines.length, rightLines.length);
    let result = "";
    for (let i = 0; i < maxLines; i++) {
        const leftPart = leftLines[i] || "";
        const rightPart = rightLines[i] || "";
        const paddedLeft = leftPart.padEnd(leftWidth, " ");
        result += `${indent}${paddedLeft}   ${rightPart}\n`;
    }
    return result;
}

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\u001B\[([0-9]{1,2})m/g;

export function visibleLength(str: string): number {
    return str.replace(ANSI_REGEX, "").length;
}

export function wrapText(text: string, maxWidth: number): string[] {
    return Wordwrap.lines(text, { width: maxWidth, break: true });
}
