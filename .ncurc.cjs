module.exports = {
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
        if (dependencyName === "ava") return "patch"; // Trying to support Node 12.
        if (dependencyName === "@ava/typescript") return "minor"; // Trying to support Node 12.
        if (dependencyName === "execa") return "patch"; // Trying to support Node 12.
        if (dependencyName === "command-line-usage") return "minor"; // Package got big.
        if (dependencyName === "pretty-ms") return "minor"; // For old versions of node.
        if (dependencyName === "eslint") return "minor";
        if (dependencyName === "eslint-plugin-ava") return "minor";
        if (dependencyName === "rimraf") return "minor";
        if (dependencyName === "@typescript-eslint/eslint-plugin") return "minor";
        if (dependencyName === "@typescript-eslint/parser") return "minor";
        if (dependencyName === "tinybench") return "patch";
        if (major === "0") return "minor";
        return "latest";
    },
    reject: (name, semver) => {
        if (name === "tmp") {
            return true;
        }
        return false;
    },
};
