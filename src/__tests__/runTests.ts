import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import * as style from "../cli/style.js";
import { clearTests, runRegisteredTests, SnapshotManager, type TestResult } from "./__runner__/index.js";

const dim = style.wrap(style.enabled, "\u001B[2m", "\u001B[22m");

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const distTestsRoot = thisDir;
const projectRoot = path.resolve(thisDir, "..", "..");
const srcTestsRoot = path.join(projectRoot, "src", "__tests__");

const doUpdateSnapshots = process.argv.includes("--update-snapshots");

function parseMatch(): string | undefined {
    const idx = process.argv.findIndex((a) => a === "--match" || a.startsWith("--match="));
    if (idx === -1) return undefined;
    const arg = process.argv[idx];
    if (arg.startsWith("--match=")) return arg.slice("--match=".length);
    return process.argv[idx + 1];
}

const matchSubstring = parseMatch();

// Match the old AVA/@ava/typescript behavior: discover source tests, then run
// their compiled JS output. This prevents stale ignored files in dist from
// being executed after a source test is renamed or deleted.
function findSourceTestFiles(dir: string): string[] {
    const results: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && !entry.name.startsWith("__")) {
            results.push(...findSourceTestFiles(full));
        } else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
            results.push(full);
        }
    }
    return results;
}

function toDistTestFile(sourceTestFile: string): string {
    const relative = path.relative(srcTestsRoot, sourceTestFile);
    return path.join(distTestsRoot, relative.replace(/\.ts$/, ".js"));
}

function getSnapshotInfo(sourceTestFile: string): { dir: string; baseName: string; sourceFile: string; } {
    const relative = path.relative(srcTestsRoot, sourceTestFile);
    const dir = path.join(srcTestsRoot, path.dirname(relative), "__snapshots__");
    const baseName = path.basename(relative);
    // Build a POSIX-style label so the snapshot header is stable across platforms.
    const relDir = path.dirname(relative).split(path.sep).join("/");
    const sourceFile = relDir === "." ? `src/__tests__/${baseName}` : `src/__tests__/${relDir}/${baseName}`;
    return { dir, baseName, sourceFile };
}

async function main() {
    const sourceTestFiles = findSourceTestFiles(srcTestsRoot).sort();

    if (sourceTestFiles.length === 0) {
        console.error("No test files found.");
        process.exitCode = 1;
        return;
    }

    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    const failures: { file: string; name: string; error: unknown; }[] = [];

    for (const sourceTestFile of sourceTestFiles) {
        const testFile = toDistTestFile(sourceTestFile);
        const relative = path.relative(distTestsRoot, testFile);
        const { dir: snapDir, baseName: snapBase, sourceFile } = getSnapshotInfo(sourceTestFile);

        // Reset the runner's module-global registration list before importing
        // the next test file.
        clearTests();
        const snapshots = new SnapshotManager({
            dir: snapDir,
            baseName: snapBase,
            sourceFile,
            update: doUpdateSnapshots,
        });

        try {
            await import(pathToFileURL(testFile).href);
        } catch (e) {
            totalFailed++;
            failures.push({ file: relative, name: "(import)", error: e });
            console.log(`  ${style.red("\u2717")} ${relative} ${style.red("(failed to import)")}`);
            continue;
        }

        const results: TestResult[] = await runRegisteredTests(
            snapshots,
            // If the substring matches the file path, include all tests in the
            // file; otherwise filter by test name. Lets `--match parseArgs`
            // run every test in cli/parseArgs.test.ts without having to spell
            // out individual test names.
            matchSubstring !== undefined && relative.includes(matchSubstring) ? undefined : matchSubstring,
        );

        let passed = 0;
        let failed = 0;
        let skipped = 0;
        for (const r of results) {
            if (r.status === "passed") passed++;
            else if (r.status === "failed") {
                failed++;
                failures.push({ file: relative, name: r.name, error: r.error });
            } else skipped++;
        }
        totalPassed += passed;
        totalFailed += failed;
        totalSkipped += skipped;

        if (results.length === 0 && matchSubstring !== undefined) {
            continue;
        }

        const mark = failed > 0 ? style.red("\u2717") : style.green("\u2713");
        const parts: string[] = [];
        if (passed > 0) parts.push(style.green(`${passed} passed`));
        if (failed > 0) parts.push(style.red(`${failed} failed`));
        if (skipped > 0) parts.push(style.yellow(`${skipped} skipped`));
        console.log(`  ${mark} ${relative} (${parts.join(", ")})`);
    }

    console.log("");

    if (failures.length > 0) {
        console.log(style.red("Failures:\n"));
        const maxLines = failures.length > 5 ? 15 : 30;
        for (const f of failures) {
            console.log(style.red(`  ${f.file} > ${f.name}`));
            const msg = f.error instanceof Error ? (f.error.stack ?? f.error.message) : String(f.error);
            const lines = msg.split("\n");
            for (const line of lines.slice(0, maxLines)) {
                console.log(`    ${line}`);
            }
            if (lines.length > maxLines) {
                console.log(`    ... (${lines.length - maxLines} more lines)`);
            }
            console.log("");
        }
    }

    const total = totalPassed + totalFailed + totalSkipped;
    const summary = [`${total} tests`, style.green(`${totalPassed} passed`)];
    if (totalFailed > 0) summary.push(style.red(`${totalFailed} failed`));
    if (totalSkipped > 0) summary.push(style.yellow(`${totalSkipped} skipped`));
    if (matchSubstring !== undefined) summary.push(dim(`(filtered by --match ${JSON.stringify(matchSubstring)})`));
    const summaryLine = summary.join(", ");
    console.log(style.bold(totalFailed > 0 ? style.red(summaryLine) : summaryLine));

    if (totalFailed > 0) {
        process.exitCode = 1;
    }

    if (total === 0 && matchSubstring !== undefined) {
        console.error(style.red(`No tests matched --match ${JSON.stringify(matchSubstring)}`));
        process.exitCode = 1;
    }
}

void main().catch((e: unknown) => {
    console.error(e);
    process.exitCode = 1;
});
