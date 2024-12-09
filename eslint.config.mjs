// @ts-check
import eslint from "@eslint/js";
import eslintPluginAva from "eslint-plugin-ava";
import eslintPluginSimpleImportSort from "eslint-plugin-simple-import-sort";
import eslintPluginUnicorn from "eslint-plugin-unicorn";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    {
        files: ["**/*.{ts,tsx,cts,mts,js,cjs,mjs}"],
    },
    {
        ignores: [
            "**/dist/**",
            "**/node_modules/**",
            "bin/**",
            "coverage/**",
            "Herebyfile.mjs",
        ],
    },
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    eslintPluginUnicorn.configs["flat/recommended"],
    eslintPluginAva.configs["flat/recommended"],
    {
        languageOptions: {
            parserOptions: {
                warnOnUnsupportedTypeScriptVersion: false,
                ecmaVersion: "latest",
                sourceType: "module",
                project: true,
            },
            globals: globals.node,
        },
        plugins: {
            "simple-import-sort": eslintPluginSimpleImportSort,
        },
    },
    {
        "rules": {
            "eqeqeq": "error",
            "no-constant-condition": "off",
            "no-inner-declarations": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
            "no-restricted-globals": ["error", "console", "process", "Date"],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "@typescript-eslint/no-import-type-side-effects": "error",
            // In theory good, but less good when declaring a new interface and
            // stopping to think about its contents.
            "@typescript-eslint/no-empty-interface": "off",
            "@typescript-eslint/no-namespace": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
            "@typescript-eslint/no-use-before-define": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unsafe-argument": "off",
            "@typescript-eslint/no-unsafe-assignment": "off",
            "@typescript-eslint/no-unsafe-call": "off",
            "@typescript-eslint/no-unsafe-member-access": "off",
            "@typescript-eslint/no-unsafe-return": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/require-await": "off",
            "@typescript-eslint/restrict-template-expressions": "off",
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    "selector": [
                        "classProperty",
                        "typeProperty",
                        "parameterProperty",
                        "classMethod",
                        "typeMethod",
                        "accessor",
                    ],
                    "modifiers": ["private"],
                    "leadingUnderscore": "require",
                    "format": ["camelCase"],
                    "filter": {
                        "regex": "^(test_| )",
                        "match": false,
                    },
                },
                {
                    "selector": [
                        "classProperty",
                        "typeProperty",
                        "parameterProperty",
                        "classMethod",
                        "typeMethod",
                        "accessor",
                    ],
                    "modifiers": ["protected"],
                    "leadingUnderscore": "allow",
                    "format": ["camelCase"],
                    "filter": {
                        "regex": "^(test_| )",
                        "match": false,
                    },
                },
                {
                    "selector": [
                        "classProperty",
                        "typeProperty",
                        "parameterProperty",
                        "classMethod",
                        "typeMethod",
                        "accessor",
                    ],
                    "modifiers": ["public"],
                    "leadingUnderscore": "forbid",
                    "format": ["camelCase"],
                    "filter": {
                        "regex": "^(test_| )",
                        "match": false,
                    },
                },
            ],
            "@typescript-eslint/no-unnecessary-condition": ["error", {
                "allowConstantLoopConditions": true,
            }],
            "unicorn/catch-error-name": "off",
            "unicorn/filename-case": "off",
            "unicorn/no-array-callback-reference": "off",
            "unicorn/no-await-expression-member": "off",
            "unicorn/no-useless-undefined": "off",
            "unicorn/prefer-top-level-await": "off", // Reenable once Node 12 is dropped.
            "unicorn/prevent-abbreviations": "off",
            "unicorn/switch-case-braces": "off",
            "unicorn/prefer-string-replace-all": "off", // Bad suggestion for old targets
        },
    },
    { "files": ["Herebyfile.*", "**/__fixtures__/**"], "rules": { "no-restricted-globals": "off" } },
    {
        "files": ["**/__tests__/**"],
        "rules": {
            "@typescript-eslint/no-empty-function": "off",
            "no-restricted-globals": "off",
            "ava/no-import-test-files": "off",
        },
    },
    {
        files: [
            ".ncurc.cjs",
            "eslint.config.mjs",
        ],
        extends: [tseslint.configs.disableTypeChecked],
    },
);
