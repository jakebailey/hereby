module.exports = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    target: (dependencyName, [{ semver, version, operator, major, minor, patch, release, build }]) => {
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
