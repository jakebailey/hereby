// @ts-check

import { task } from "../../index.js";

/**
 * @param {number} ms
 */
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

/**
 * @param {string} dir
 */
async function runTsc(dir) {
    console.log(`runTsc ${dir} ...`);
    await sleep(1200);
    console.log(`runTsc ${dir} done`);
}

async function execa(_path, _args) {}

export const a = task({
    name: "a",
    run: async () => {
        await sleep(900);
        // Do a bunch of FS stuff
    },
});

export const b = task({
    name: "b",
    description:
        "This is some long description of b. It's pretty long, and goes into detail about why we want to do b.",
    run: async () => {
        await sleep(800);
        // throw new Error("oopsie");
    },
});

export const c = task({
    name: "c",
    dependencies: [b],
    run: async () => {
        await sleep(700);
    },
});

export const buildCompiler = task({
    name: "buildCompiler",
    description: "This thing builds the compiler. Neat, right?",
    dependencies: [a, b, c],
    run: async () => {
        await runTsc("./compiler");
    },
});

export const runSomeProgram = task({
    name: "runSomeProgram",
    dependencies: [buildCompiler],
    run: async () => {
        // await execa("cat", ["/etc/os-release"]);
        await execa("sh", ["-c", "echo 'hey'; sleep 1; exit 2"]);
    },
});

export default runSomeProgram;
