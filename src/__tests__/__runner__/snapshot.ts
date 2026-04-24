import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

export interface SnapshotConfig {
    dir: string;
    baseName: string;
    sourceFile: string;
    update: boolean;
}

export class SnapshotManager {
    private _dir: string;
    private _baseName: string;
    private _sourceFile: string;
    private _update: boolean;
    private _snapshots = new Map<string, string>();
    private _usedKeys = new Set<string>();
    private _changed = false;

    constructor(config: SnapshotConfig) {
        this._dir = config.dir;
        this._baseName = config.baseName;
        this._sourceFile = config.sourceFile;
        this._update = config.update;
        this._load();
    }

    private _filePath(): string {
        return path.join(this._dir, this._baseName + ".md");
    }

    private _load(): void {
        const filePath = this._filePath();
        if (fs.existsSync(filePath)) {
            this._snapshots = parseMarkdownSnapshots(fs.readFileSync(filePath, "utf8"));
        }
    }

    save(): void {
        if (!this._changed && !this._update) return;

        if (this._usedKeys.size === 0) {
            // Only delete the snapshot file when explicitly updating snapshots,
            // to avoid surprising destructive writes during a normal test run.
            if (this._update) {
                const filePath = this._filePath();
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }
            return;
        }

        fs.mkdirSync(this._dir, { recursive: true });
        fs.writeFileSync(this._filePath(), this._generateMarkdown());
    }

    assertSnapshot(key: string, serialized: string): void {
        this._usedKeys.add(key);

        const existing = this._snapshots.get(key);
        if (existing === undefined) {
            if (!this._update) {
                // Fail rather than silently recording: otherwise a new
                // t.snapshot(...) call would pass on first run with no
                // baseline ever reviewed, which is especially bad in CI.
                assert.fail(
                    `No snapshot recorded for "${key}". Run with --update-snapshots to record it.`,
                );
            }
            this._snapshots.set(key, serialized);
            this._changed = true;
        } else if (this._update) {
            if (existing !== serialized) {
                this._changed = true;
                this._snapshots.set(key, serialized);
            }
        } else {
            assert.strictEqual(serialized, existing, `Snapshot mismatch for "${key}"`);
        }
    }

    preserveKeys(testName: string): void {
        const prefix = testName + " > ";
        for (const key of this._snapshots.keys()) {
            if (key.startsWith(prefix)) {
                this._usedKeys.add(key);
            }
        }
    }

    private _generateMarkdown(): string {
        const groups = new Map<string, { label: string; value: string; }[]>();
        for (const [key, value] of this._snapshots) {
            // When updating, drop unused keys so stale entries get cleaned up.
            // Otherwise preserve them so a partial run can't delete snapshots
            // belonging to tests that didn't execute.
            if (this._update && !this._usedKeys.has(key)) continue;
            const sepIdx = key.indexOf(" > ");
            if (sepIdx === -1) continue;
            const testName = key.slice(0, sepIdx);
            const label = key.slice(sepIdx + 3);
            // Tripwire: the parser uses column-0 "## " and "> " as structural
            // markers. Values are written indented by 4 spaces, so this can
            // only fire if a test name or label sneaks past the " > " checks
            // in registerTest / snapshot.
            if (testName.startsWith("## ") || testName.startsWith("> ")) {
                throw new Error(`Test name would break snapshot round-trip: ${JSON.stringify(testName)}`);
            }
            if (label.startsWith("## ") || label.startsWith("> ")) {
                throw new Error(`Snapshot label would break snapshot round-trip: ${JSON.stringify(label)}`);
            }
            let group = groups.get(testName);
            if (!group) {
                group = [];
                groups.set(testName, group);
            }
            group.push({ label, value });
        }

        const lines: string[] = [`# Snapshot report for \`${this._sourceFile}\``, ""];

        for (const [testName, entries] of groups) {
            lines.push(`## ${testName}`, "");
            for (const entry of entries) {
                lines.push(`> ${entry.label}`, "", ...entry.value.split("\n").map((l) => "    " + l), "");
            }
        }

        return lines.join("\n");
    }
}

function parseMarkdownSnapshots(content: string): Map<string, string> {
    const result = new Map<string, string>();
    const lines = content.split("\n");
    let currentTest = "";
    let currentLabel = "";
    let collecting = false;
    let hasContent = false;
    let valueLines: string[] = [];

    function flush(): void {
        if (currentTest && currentLabel) {
            const value = valueLines.join("\n");
            result.set(currentTest + " > " + currentLabel, value);
        }
        valueLines = [];
        collecting = false;
        hasContent = false;
    }

    for (const line of lines) {
        if (line.startsWith("## ")) {
            flush();
            currentTest = line.slice(3);
            currentLabel = "";
        } else if (line.startsWith("> ") && currentTest) {
            flush();
            currentLabel = line.slice(2);
            collecting = true;
        } else if (collecting) {
            if (line.startsWith("    ")) {
                hasContent = true;
                valueLines.push(line.slice(4));
            } else if (line === "") {
                // Unindented blank lines are separators inserted by the writer
                // for readability and are never part of a value (the writer
                // always emits "    " for blank lines inside a value). Ignore
                // them so the round-trip preserves trailing newlines.
            } else if (hasContent) {
                flush();
            }
        }
    }
    flush();

    return result;
}
