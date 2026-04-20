import { task } from "hereby";

export const inlineExport = task({
    run: () => {},
});

const explicitExport = task({
    run: () => {},
});

export { explicitExport };

export const nameOverride = task({
    name: "name:override",
    run: () => {},
});
