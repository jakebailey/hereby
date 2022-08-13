// @ts-check
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const config = {
    preset: "ts-jest/presets/default-esm-legacy",
    globals: {
        "ts-jest": {
            useESM: true,
        },
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    coverageProvider: "v8",
    collectCoverageFrom: ["src/**/*.ts"],
    coveragePathIgnorePatterns: ["\\.test\\.ts", "\\.d\\.ts"],
};

export default config;
