import module from "node:module";

declare module "node:module" {
    export const enableCompileCache: (() => void) | undefined;
}

module.enableCompileCache?.();

async function run() {
    const { main } = await import("./cli/index.js");
    const { real } = await import("./cli/utils.js");
    await main(await real());
}

void run();
