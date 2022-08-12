const unset = Symbol("unset");

export function once<T>(fn: () => T): () => T {
    let result: T | typeof unset = unset;

    return () => {
        if (result === unset) {
            result = fn();
        }
        return result;
    };
}
