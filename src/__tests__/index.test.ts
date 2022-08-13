import test from "ava";

import { Task, task } from "../index.js";

test("Task looks like task", (t) => {
    const foo = task({ name: "foo", run: async () => {} });
    t.true(foo instanceof Task);
});

test("Name that starts with a dash", (t) => {
    t.throws(() => task({ name: "-" }));
    t.throws(() => task({ name: "-foo" }));
    t.throws(() => task({ name: "--" }));
    t.throws(() => task({ name: "--foo" }));
});

test("Task missing info", (t) => {
    t.throws(() => task({ name: "", run: async () => {} }));
    t.throws(() => task({ name: "foo" }));
    t.throws(() => task({ name: "foo", dependencies: [] }));
});
