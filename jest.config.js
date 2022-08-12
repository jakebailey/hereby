// @ts-check
/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
const config = {
    preset: "ts-jest/presets/default-esm", // or other ESM presets
    globals: {
        "ts-jest": {
            useESM: true,
        },
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    testEnvironment: "node",
    roots: ["<rootDir>/src/__tests__"],
    collectCoverageFrom: ["src/**/*.ts"],
    coveragePathIgnorePatterns: ["\\.d\\.ts"],
};

export default config;
