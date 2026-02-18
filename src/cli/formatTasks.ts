import pc from "picocolors";
import Wordwrap from "wordwrapjs";

import type { Task } from "../index.js";
import { compareTaskNames, type Output } from "./utils.js";

export type TaskFormat = "normal" | "simple";

export function formatTasks(
    format: TaskFormat,
    tasks: Iterable<Task>,
    defaultTask: Task | undefined,
    output: Output | undefined,
) {
    const visibleTasks = [...tasks].filter(isTaskVisible).sort(compareTaskNames);

    if (format === "simple") {
        return visibleTasks.map((task) => task.options.name).join("\n");
    }

    const names = visibleTasks.map((task) =>
        task === defaultTask
            ? `${pc.green(task.options.name)} (default)`
            : pc.blue(task.options.name)
    );

    const descriptions = visibleTasks.map((task) => {
        let parts = task.options.description ? [task.options.description] : undefined;
        const deps = task.options.dependencies?.filter(isTaskVisible).sort(compareTaskNames);
        if (deps?.length) {
            const depNames = deps.map((task) => pc.blue(task.options.name));
            (parts ??= []).push(`Depends on: ${depNames.join(", ")}`);
        }
        return parts?.join("\n") ?? "";
    });

    // There's a 2 space indent plus 3 spaces between columns, hence take away 5
    // padding spaces from the available width
    const maxTotalWidth = getOutputWidth(output) - 5;
    const maxNameWidth = Math.max(...names.map(visibleLength));

    // Check the name doesn't take up more than half the space
    const nameWidth = Math.min(maxNameWidth, maxTotalWidth >> 1);
    const descriptionWidth = maxTotalWidth - nameWidth;
    const formatted = names.map((name, i) => formatAsColumns("  ", name, nameWidth, descriptions[i], descriptionWidth));

    return `
${pc.bold(pc.underline("Available tasks"))}

${formatted.join("")}`;
}

export function getOutputWidth(output: Output | undefined): number {
    return output?.isTTY && output.columns ? output.columns : 80;
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
        const paddedLeft = leftPart.padEnd(leftWidth, " ");
        result += `${indent}${paddedLeft}   ${rightPart}\n`;
    }
    return result;
}

// eslint-disable-next-line no-control-regex
const ANSI_REGEX = /\u001B\[([0-9]{1,2})m/g;

function visibleLength(str: string): number {
    return str.replace(ANSI_REGEX, "").length;
}

function wrapText(text: string, maxWidth: number): string[] {
    return Wordwrap.lines(text, { width: maxWidth, break: true });
}
