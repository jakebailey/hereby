import { main } from "./cli/index.js";
import { createSystem } from "./cli/utils.js";

await main(createSystem(process));
