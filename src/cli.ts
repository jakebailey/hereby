import { main } from "./cli/index.js";
import { real } from "./cli/utils.js";

async function run() {
    await main(await real());
}

void run();
