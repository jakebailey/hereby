import { Task, task } from "../index.js";

test("Task looks like task", () => {
    const foo = task({ name: "foo" });
    expect(foo instanceof Task).toEqual(true);
});

test("Name that starts with a dash", () => {
    expect(() => task({ name: "-" })).toThrow();
    expect(() => task({ name: "-foo" })).toThrow();
    expect(() => task({ name: "--" })).toThrow();
    expect(() => task({ name: "--foo" })).toThrow();
});
