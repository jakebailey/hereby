module.exports = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
        if (dependencyName === "ava") return "patch"; // Trying to support Node 12.
        if (dependencyName === "@ava/typescript") return "minor"; // Trying to support Node 12.
        if (dependencyName === "execa") return "patch"; // Trying to support Node 12.
        if (dependencyName === "npm") return "minor";
        if (major === "0") return "minor";
        return "latest";
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reject: (name, semver) => {
        if (name === "picocolors") return true;
        return false;
    },
};
