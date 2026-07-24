module.exports = {
    // oxlint-disable-next-line typescript/no-unused-vars
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
        if (dependencyName === "npm") return "minor";
        if (major === "0") return "minor";
        return "latest";
    },
    // oxlint-disable-next-line typescript/no-unused-vars
    reject: (name, semver) => {
        return false;
    },
};
