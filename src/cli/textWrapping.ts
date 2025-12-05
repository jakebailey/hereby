const ANSI_REGEX = /\x1b\[([0-9]{1,2})m/g;

function addLine(text: string, lines: string[]): string {
    const foreground = getActiveAnsiCode(text);
    const endCode = foreground ? "\x1b[0m" : "";
    lines.push(text + endCode);
    return foreground ?? "";
}

function getActiveAnsiCode(str: string): string | null {
    const matches = Array.from(str.matchAll(ANSI_REGEX));
    if (matches.length === 0) {
        return null;
    }

    const lastMatch = matches[matches.length - 1];
    const code = Number(lastMatch[1]);
    const isEndCode = code === 0 || code === 39;
    return isEndCode ? null : lastMatch[0];
}

function handleLongWord(word: string, maxWidth: number, lines: string[]): string {
    const ansiRegex = new RegExp("^" + ANSI_REGEX.source); // Only want to match at the start
    let startIndex = 0;
    let visibleCount = 0;
    let foreground = "";
    for (let index = 0; index < word.length; index++) {
        const match = ansiRegex.exec(word.substring(index));
        if (match) {
            index += match[0].length - 1;
        } else {
            visibleCount++;
            if (visibleCount === maxWidth) {
                foreground = addLine(foreground + word.substring(startIndex, index + 1), lines);
                startIndex = index + 1;
                visibleCount = 0;
            }
        }
    }

    return foreground + word.substring(startIndex);
}

function processLineChunk(
    chunk: string,
    maxWidth: number,
    lines: string[],
    currentLine: string,
): string {
    const chunkLength = visibleLength(chunk);
    if (chunkLength > maxWidth) {
        const foreground = currentLine ? addLine(currentLine, lines) : "";
        return handleLongWord(foreground + chunk, maxWidth, lines);
    }

    if (!currentLine) {
        return chunk;
    }

    // Is there room for the space and the new word?
    const space = currentLine.endsWith("-") ? "" : " ";
    if (visibleLength(currentLine) + space.length + chunkLength <= maxWidth) {
        return currentLine + space + chunk;
    }

    const foreground = addLine(currentLine, lines);
    return foreground + chunk;
}

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

export function visibleLength(str: string): number {
    return str.replace(ANSI_REGEX, "").length;
}

export function wrapText(text: string, maxWidth: number): string[] {
    const lines: string[] = [];
    let currentLine = "";
    for (const line of (text ?? "").split(/\r?\n/)) {
        const chunks = line.match(/[^\s-]+-|\S+/g) || [];
        for (const chunk of chunks) {
            currentLine = processLineChunk(chunk, maxWidth, lines, currentLine);
        }

        // Finish the line to preserve newlines
        if (currentLine) {
            currentLine = addLine(currentLine, lines);
        }

        // Preserve explicit empty lines
        if (chunks.length === 0) {
            lines.push("");
        }
    }

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}
