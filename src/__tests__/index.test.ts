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

test("bad options", (t) => {
    /* eslint-disable unicorn/no-null */
    t.throws(() => task({ name: 1234 as any }));
    t.throws(() => task({ name: "name", description: null as any }));
    t.throws(() => task({ name: "name", description: 1234 as any }));
    t.throws(() => task({ name: "name", dependencies: null as any }));
    t.throws(() => task({ name: "name", dependencies: 1234 as any }));
    t.throws(() => task({ name: "name", dependencies: [1234] as any }));
    t.throws(() => task({ name: "name", run: null as any }));
    t.throws(() => task({ name: "name", run: 1234 as any }));
    /* eslint-enable unicorn/no-null */
});

test("returning a non-void value", (t) => {
    t.truthy(task({ name: "a", run: () => 1234 }));
    t.truthy(task({ name: "a", run: async () => 1234 }));
    t.truthy(
        task({
            name: "a",
            run: () => {
                if (Math.random() > 0.5) {
                    return 1234;
                }
                return Promise.resolve("test");
            },
        }),
    );
});
