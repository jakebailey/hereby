// TODO: submit this to DT

declare module "foreground-child" {
    function foregroundChild(program: string | string[], cb?: CloseHandler);
    function foregroundChild(program: string, args: string[], cb?: CloseHandler);
    function foregroundChild(program: string, ...args: string[], cb?: CloseHandler);

    export = foregroundChild;
}
