import { main } from "./cli/index.js";
import { real } from "./cli/utils.js";

await main(await real());
