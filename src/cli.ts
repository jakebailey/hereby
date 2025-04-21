import module from "node:module";

if (module.enableCompileCache) {
    module.enableCompileCache();
}

async function run() {
    const { main } = await import("./cli/index.js");
    const { real } = await import("./cli/utils.js");
    await main(await real());
}

void run();
