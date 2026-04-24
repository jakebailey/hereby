import type { Task } from "../index.js";
import * as style from "./style.js";
import { compareTaskNames } from "./utils.js";

export type TaskFormat = "normal" | "simple";

export function formatTasks(format: TaskFormat, tasks: Iterable<Task>, defaultTask: Task | undefined, columns: number) {
    const visibleTasks = [...tasks].filter(isTaskVisible).sort(compareTaskNames);

    if (format === "simple") {
        return visibleTasks.map((task) => task.options.name).join("\n");
    }

    const names = visibleTasks.map((task) =>
        task === defaultTask ? `${style.green(task.options.name)} (default)` : style.blue(task.options.name)
    );

    const descriptions = visibleTasks.map((task) => {
        let parts = task.options.description ? [task.options.description] : undefined;
        const deps = task.options.dependencies?.filter(isTaskVisible).sort(compareTaskNames);
        if (deps?.length) {
            const depNames = deps.map((task) => style.blue(task.options.name));
            (parts ??= []).push(`Depends on: ${depNames.join(", ")}`);
        }
        return parts?.join("\n") ?? "";
    });

    // There's a 2 space indent plus 3 spaces between columns, hence take away 5
    // padding spaces from the available width
    const maxTotalWidth = columns - 5;
    const maxNameWidth = Math.max(...names.map(visibleLength));

    // Check the name doesn't take up more than half the space
    const nameWidth = Math.min(maxNameWidth, maxTotalWidth >> 1);
    const descriptionWidth = maxTotalWidth - nameWidth;
    const formatted = names.map((name, i) => formatAsColumns("  ", name, nameWidth, descriptions[i], descriptionWidth));

    return `
${style.bold(style.underline("Available tasks"))}

${formatted.join("")}`;
}

function isTaskVisible(task: Task) {
    return !task.options.hiddenFromTaskList;
}

function formatAsColumns(
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
        const paddedLeft = leftPart + " ".repeat(Math.max(0, leftWidth - visibleLength(leftPart)));
        result += `${indent}${paddedLeft}   ${rightPart}\n`;
    }
    return result;
}

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\u001B\[([0-9]{1,2})m/g;

function visibleLength(str: string): number {
    return str.replace(ANSI_REGEX, "").length;
}

const TOKEN_REGEX = /[^\s-]+?-\b|\S+|\s+/g;

function wrapText(text: string, maxWidth: number): string[] {
    const result: string[] = [];
    for (const line of text.split(/\r?\n/)) {
        let current = "";
        for (const token of line.match(TOKEN_REGEX) ?? []) {
            if (visibleLength(current) + visibleLength(token) > maxWidth && current.trim()) {
                result.push(current.trim());
                current = "";
            }
            if (visibleLength(token) > maxWidth) {
                // eslint-disable-next-line @typescript-eslint/no-misused-spread
                const chars = [...token];
                while (chars.length > 0) result.push(chars.splice(0, maxWidth).join(""));
            } else {
                current += /^\s/.test(token) && !current ? "" : token;
            }
        }
        if (current.trim()) result.push(current.trim());
    }
    return result.length > 0 ? result : [""];
}
