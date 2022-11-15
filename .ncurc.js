module.exports = {
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
        if (dependencyName === "@types/node") return "minor";
        if (dependencyName === "typescript") return "patch";
        if (dependencyName === "ava") return "patch"; // Trying to support Node 12.
        if (major === "0") return "minor";
        return "latest";
    },
};
