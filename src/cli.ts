import { main } from "./cli/index.js";
import { real } from "./cli/utils.js";

async function run() {
    try {
        await main(await real());
    } catch (e) {
        // eslint-disable-next-line no-restricted-globals
        console.error(e);
        // eslint-disable-next-line no-restricted-globals
        process.exitCode = 1;
    }
}

void run();
