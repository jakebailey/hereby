import module from "node:module";

// oxlint-disable-next-line typescript/no-unnecessary-condition
if (module.enableCompileCache) {
    module.enableCompileCache();
}

async function run() {
    const { main } = await import("./cli/index.js");
    await main();
}

void run();
