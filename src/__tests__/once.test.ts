import { once } from "../once.js";

test("executes only once", () => {
    let count = 0;

    const fn = once(() => {
        count++;
    });

    fn();
    fn();

    expect(count).toEqual(1);
});

test("works with promises", async () => {
    let count = 0;

    const fn = once(async () => {
        count++;
    });

    const promise1 = fn();
    const promise2 = fn();

    expect(promise1).toEqual(promise2);

    await promise1;

    expect(count).toEqual(1);
});
