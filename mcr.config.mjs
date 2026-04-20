/** @type {import("monocart-coverage-reports").CoverageReportOptions} */
export default {
    outputDir: "./coverage",
    reports: [
        "console-details",
        "lcov",
        "codecov",
    ],
    all: {
        dir: ["./src"],
        filter: {
            "**/__tests__/**": false,
            "**/*.ts": true,
            "**/*.mts": true,
        },
    },
    entryFilter: {
        "**/node_modules/**": false,
        "**": true,
    },
    sourceFilter: {
        "**/__tests__/**": false,
        "**": true,
    },
};
