#!/usr/bin/env node

import { main } from "./cli/index.js";
import { createSystem } from "./cli/utils.js";

// eslint-disable-next-line no-restricted-globals
await main(createSystem(process));
