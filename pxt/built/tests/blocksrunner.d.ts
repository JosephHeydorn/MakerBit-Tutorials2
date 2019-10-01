/// <reference path="../../localtypings/pxtblockly.d.ts" />
/// <reference path="../pxtblocks.d.ts" />
/// <reference path="../pxtcompiler.d.ts" />
/// <reference path="../pxteditor.d.ts" />
declare const WEB_PREFIX = "http://localhost:9876";
interface BlockTestCase {
    packageName: string;
    testFiles: {
        testName: string;
        contents: string;
    }[];
}
declare const testJSON: {
    libsTests: BlockTestCase[];
    commonTests: BlockTestCase[];
};
declare class BlocklyCompilerTestHost implements pxt.Host {
    static cachedFiles: pxt.Map<string>;
    static createTestHostAsync(): Promise<BlocklyCompilerTestHost>;
    constructor();
    readFile(module: pxt.Package, filename: string): string;
    writeFile(module: pxt.Package, filename: string, contents: string): void;
    getHexInfoAsync(extInfo: pxtc.ExtensionInfo): Promise<pxtc.HexInfo>;
    cacheStoreAsync(id: string, val: string): Promise<void>;
    cacheGetAsync(id: string): Promise<string>;
    downloadPackageAsync(pkg: pxt.Package): Promise<void>;
}
declare function fail(msg: string): void;
declare let cachedBlocksInfo: pxtc.BlocksInfo;
declare function getBlocksInfoAsync(): Promise<pxtc.BlocksInfo>;
declare function testXmlAsync(blocksfile: string): Promise<void>;
declare function mkLink(el: Element): string;
declare function compareBlocklyTrees(a: Element, b: Element, prev?: string[]): {
    chain: string;
    reason: string;
};
declare function getMatchingChild(searchFor: Element, parent: Element): Node;
declare function shallowEquals(a: Element, b: Element): boolean;
declare let init: boolean;
declare function initAsync(): Promise<void>;
declare function encode(testcase: string): string;
