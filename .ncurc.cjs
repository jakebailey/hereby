module.exports = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
        if (dependencyName === "ava") return "patch"; // Trying to support Node 12.
        if (dependencyName === "@ava/typescript") return "minor"; // Trying to support Node 12.
        if (dependencyName === "execa") return "patch"; // Trying to support Node 12.
        if (dependencyName === "command-line-usage") return "minor"; // Package got big.
        if (dependencyName === "pretty-ms") return "minor"; // For old versions of node.
        if (dependencyName === "rimraf") return "minor";
        if (dependencyName === "npm") return "minor";
        if (major === "0") return "minor";
        return "latest";
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reject: (name, semver) => {
        if (name === "tmp") return true;
        if (name === "picocolors") return true;
        if (name === "@fast-check/ava") return true;
        return false;
    },
};
