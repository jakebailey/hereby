import { fileURLToPath } from "url";

    // This is a workaround for a bug in esmock; esmock appears to follow
    // source maps, so I pass "../../cli/reexec.js" directly, it uses src/...
    // rather than dist/...
    //
    // TODO: Remove once https://github.com/iambumblehead/esmock/issues/113 is fixed.
export function fixESMockPath(path: string, importMetaUrl: string): string {
    const url = new URL(path, importMetaUrl);
    return fileURLToPath(url);
}
