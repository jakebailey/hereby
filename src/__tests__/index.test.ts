import { Task, task } from "../index.js";

test("Task looks like task", () => {
    const foo = task({ name: "foo" });
    expect(foo instanceof Task).toEqual(true);
    expect(Task.__isHerebyTask(foo)).toEqual(true);
});
