module.exports = {
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
        if (dependencyName === "@types/node") return "minor";
        if (dependencyName === "ava") return "patch"; // Trying to support Node 12.
        if (dependencyName === "moq.ts") return "minor"; // v10 is typed wrong for node ESM
        if (dependencyName === "execa") return "patch"; // Trying to support Node 12.
        if (major === "0") return "minor";
        return "latest";
    },
};
