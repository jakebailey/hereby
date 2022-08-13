process.env["FORCE_COLOR"] = "1";

import { mockConsoleLog } from "jest-mock-process";

import { task } from "../index.js";
import { printTasks } from "./printTasks.js";

test("printTasks", () => {
    const a = task({
        name: "a",
        description: "This is task a. It works pretty well.",
    });

    const b = task({
        name: "b",
        dependencies: [a],
    });

    const c = task({
        name: "c",
        description: "This is task c. ".repeat(10),
        dependencies: [a, b],
    });

    const d = task({
        name: "d",
    });

    const saveColumns = process.stdout.columns;
    const saveTty = process.stdout.isTTY;
    process.stdout.columns = 80;
    process.stdout.isTTY = false;
    const mockLog = mockConsoleLog();

    const lines: string[] = [];

    mockLog.mockImplementation((message) => lines.push(message));

    printTasks([a, c, d], d);

    mockLog.mockRestore();
    process.stdout.columns = saveColumns;
    process.stdout.isTTY = saveTty;

    const stdout = lines.join("\n");
    expect(stdout).toMatchSnapshot("stdout");
});
