import { task } from "hereby";

export const success = task({
    name: "success",
    run: () => {},
});

export const failure = task({
    name: "failure",
    run: () => {
        throw new Error("failure!");
    },
});

export const otherFailure = task({
    name: "other:failure",
    run: () => {
        throw new Error("failure!");
    },
});

export const multipleFailures = task({
    name: "multiple:failures",
    dependencies: [failure, otherFailure],
});
