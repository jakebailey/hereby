import test from "ava";

import { Task, task } from "../index.js";

test("task returns instance of Task", (t) => {
    const foo = task({ name: "foo", run: async () => {} });
    t.true(foo instanceof Task);
});

test("no names that start with a dash", (t) => {
    t.throws(() => task({ name: "-" }));
    t.throws(() => task({ name: "-foo" }));
    t.throws(() => task({ name: "--" }));
    t.throws(() => task({ name: "--foo" }));
});

test("missing info", (t) => {
    t.throws(() => task({ name: "", run: async () => {} }));
    t.throws(() => task({ name: "foo" }));
    t.throws(() => task({ name: "foo", dependencies: [] }));
});

test("non-async run", (t) => {
    t.truthy(task({ name: "a", run: () => {} }));
});
