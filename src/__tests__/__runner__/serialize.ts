export function serialize(value: unknown, indent = 0, seen?: WeakSet<object>): string {
    const pad = "  ".repeat(indent);
    const padInner = "  ".repeat(indent + 1);

    if (value === undefined) return "undefined";
    if (value === null) return "null";
    if (typeof value === "number" || typeof value === "boolean") {
        if (Object.is(value, -0)) return "-0";
        return String(value);
    }
    if (typeof value === "string") {
        if (/[\n\r]/.test(value)) {
            const escaped = value.replace(/\\/g, "\\\\").replace(/`/g, "\\`")
                .replace(/\r/g, "\u240D")
                .replace(/\n/g, "\u240A\n" + pad);
            return "`" + escaped + "`";
        }
        return "'" + value.replace(/\\/g, "\\\\").replace(/'/g, String.raw`\'`) + "'";
    }
    if (typeof value === "function") {
        const name = value.constructor.name;
        return name === "AsyncFunction" ? "AsyncFunction []" : "Function []";
    }
    if (value instanceof RegExp) return String(value);
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "symbol") return value.toString();

    // Track ancestors to detect circular references (not just shared refs)
    seen ??= new WeakSet();
    if (seen.has(value)) return "[Circular]";
    seen.add(value);

    let result: string;
    if (value instanceof Map) {
        const entries = [...value.entries()];
        if (entries.length === 0) {
            result = "Map {}";
        } else {
            // Preserve insertion order; Map iteration order is meaningful.
            const items = entries.map(([k, v]) =>
                padInner + serialize(k, indent + 1, seen) + " => " + serialize(v, indent + 1, seen) + ","
            );
            result = "Map {\n" + items.join("\n") + "\n" + pad + "}";
        }
    } else if (value instanceof Set) {
        const entries = [...value];
        if (entries.length === 0) {
            result = "Set {}";
        } else {
            const items = entries.map((v) => padInner + serialize(v, indent + 1, seen) + ",");
            result = "Set {\n" + items.join("\n") + "\n" + pad + "}";
        }
    } else if (value instanceof Date) {
        result = `Date ${value.toISOString()}`;
    } else if (value instanceof Error) {
        const name = value.constructor.name || "Error";
        result = `${name} { message: ${serialize(value.message, indent + 1, seen)} }`;
    } else if (Array.isArray(value)) {
        if (value.length === 0) {
            result = "[]";
        } else {
            const items = value.map((v) => padInner + serialize(v, indent + 1, seen) + ",").join("\n");
            result = "[\n" + items + "\n" + pad + "]";
        }
    } else if (typeof value === "object") {
        const proto = Object.getPrototypeOf(value) as { constructor?: { name?: string; }; } | null;
        const className = proto?.constructor?.name;
        const prefix = className && className !== "Object" ? className + " " : "";
        const keys = Object.keys(value).sort();
        if (keys.length === 0) {
            result = prefix + "{}";
        } else {
            const items = keys.map((k) => {
                let v: unknown;
                try {
                    v = (value as Record<string, unknown>)[k];
                } catch {
                    v = "[Throws]";
                }
                return padInner + k + ": " + serialize(v, indent + 1, seen) + ",";
            }).join("\n");
            result = prefix + "{\n" + items + "\n" + pad + "}";
        }
    } else {
        result = typeof value;
    }

    seen.delete(value);
    return result;
}
