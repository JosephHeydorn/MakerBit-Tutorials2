/// <reference path="../localtypings/pxtpackage.d.ts" />
/// <reference path="../localtypings/pxtparts.d.ts" />
/// <reference path="../localtypings/pxtarget.d.ts" />
/// <reference path="../localtypings/projectheader.d.ts" />
/// <reference path="typescriptServices.d.ts" />
/// <reference types="marked" />
/// <reference types="web-bluetooth" />
declare namespace pxt {
    function aiTrackEvent(id: string, data?: any, measures?: any): void;
    function aiTrackException(err: any, kind: string, props: any): void;
}
declare namespace pxt.analytics {
    function addDefaultProperties(props: Map<string | number>): void;
    function enable(): void;
    function isCookieBannerVisible(): boolean;
    function enableCookies(): void;
}
declare namespace pxt {
    let appTarget: TargetBundle;
    let appTargetVariant: string;
    let hwVariant: string;
}
declare namespace pxt.AudioContextManager {
    function mute(mute: boolean): void;
    function stop(): void;
    function frequency(): number;
    function tone(frequency: number): void;
}
declare namespace pxt {
    interface TelemetryEventOptions {
        interactiveConsent: boolean;
    }
    /**
     * Track an event.
     */
    let tickEvent: (id: string, data?: Map<string | number>, opts?: TelemetryEventOptions) => void;
}
declare namespace ts.pxtc {
    let __dummy: number;
}
import pxtc = ts.pxtc;
declare namespace ts.pxtc.Util {
    function assert(cond: boolean, msg?: string): void;
    function flatClone<T>(obj: T): T;
    function clone<T>(v: T): T;
    function htmlEscape(_input: string): string;
    function jsStringQuote(s: string): string;
    function jsStringLiteral(s: string): string;
    let localizeLive: boolean;
    /**
     * Returns the current user language, prepended by "live-" if in live mode
     */
    function localeInfo(): string;
    /**
     * Returns current user language iSO-code. Default is `en`.
     */
    function userLanguage(): string;
    function normalizeLanguageCode(code: string): string[];
    function setUserLanguage(localizeLang: string): void;
    function isUserLanguageRtl(): boolean;
    function _localize(s: string): string;
    function getLocalizedStrings(): pxt.Map<string>;
    function setLocalizedStrings(strs: pxt.Map<string>): void;
    function translationsCache(): pxt.Map<pxt.Map<string>>;
    function fmt_va(f: string, args: any[]): string;
    function fmt(f: string, ...args: any[]): string;
    function dumpLocStats(): void;
    function lf_va(format: string, args: any[]): string;
    function lf(format: string, ...args: any[]): string;
    /**
     * Similar to lf but the string do not get extracted into the loc file.
     */
    function rlf(format: string, ...args: any[]): string;
    function lookup<T>(m: pxt.Map<T>, key: string): T;
    function isoTime(time: number): string;
    function userError(msg: string): Error;
    function isPyLangPref(): boolean;
    function getEditorLanguagePref(): string;
    function setEditorLanguagePref(lang: string): void;
    function deq(a: any, b: any): string;
}
declare const lf: typeof pxtc.Util.lf;
declare namespace ts.pxtc {
    /**
     * atob replacement
     * @param s
     */
    let decodeBase64: (s: string) => string;
    /**
     * bota replacement
     * @param s
     */
    let encodeBase64: (s: string) => string;
}
declare namespace ts.pxtc.Util {
    class CancellationToken {
        private pending;
        private cancelled;
        private resolve;
        private deferred;
        private progressHandler;
        startOperation(): void;
        isRunning(): boolean;
        onProgress(progressHandler: (completed: number, total: number) => void): void;
        reportProgress(completed: number, total: number): void;
        cancel(): void;
        cancelAsync(): Promise<void>;
        isCancelled(): boolean;
        throwIfCancelled(): void;
        resolveCancel(): void;
    }
    function codalHash16(s: string): number;
    function bufferSerial(buffers: pxt.Map<string>, data?: string, source?: string, maxBufLen?: number): void;
    function blobReadAsDataURL(blob: Blob): Promise<string>;
    function fileReadAsBufferAsync(f: File): Promise<Uint8Array>;
    function fileReadAsTextAsync(f: File): Promise<string>;
    function repeatMap<T>(n: number, fn: (index: number) => T): T[];
    function listsEqual<T>(a: T[], b: T[]): boolean;
    function oops(msg?: string): Error;
    function reversed<T>(arr: T[]): T[];
    function iterMap<T>(m: pxt.Map<T>, f: (k: string, v: T) => void): void;
    function mapMap<T, S>(m: pxt.Map<T>, f: (k: string, v: T) => S): pxt.Map<S>;
    function mapStringMapAsync<T, S>(m: pxt.Map<T>, f: (k: string, v: T) => Promise<S>): Promise<pxt.Map<S>>;
    function values<T>(m: pxt.Map<T>): T[];
    function pushRange<T>(trg: T[], src: ArrayLike<T>): void;
    function concatArrayLike<T>(arrays: ArrayLike<ArrayLike<T>>): T[];
    function concat<T>(arrays: T[][]): T[];
    function memcpy(trg: Uint8Array, trgOff: number, src: ArrayLike<number>, srcOff?: number, len?: number): void;
    function uint8ArrayConcat(chunks: Uint8Array[]): Uint8Array;
    function jsonTryParse(s: string): any;
    function jsonMergeFrom(trg: any, src: any): void;
    function jsonCopyFrom<T>(trg: T, src: T): void;
    function jsonFlatten(v: any): pxt.Map<any>;
    function jsonUnFlatten(v: pxt.Map<any>): any;
    function strcmp(a: string, b: string): 0 | 1 | -1;
    function stringMapEq(a: pxt.Map<string>, b: pxt.Map<string>): boolean;
    function endsWith(str: string, suffix: string): boolean;
    function startsWith(str: string, prefix: string): boolean;
    function contains(str: string, contains: string): boolean;
    function replaceAll(str: string, old: string, new_: string): string;
    function sortObjectFields<T>(o: T): T;
    function chopArray<T>(arr: T[], chunkSize: number): T[][];
    function unique<T>(arr: T[], f: (t: T) => string): T[];
    function groupBy<T>(arr: T[], f: (t: T) => string): pxt.Map<T[]>;
    function toDictionary<T>(arr: T[], f: (t: T) => string): pxt.Map<T>;
    function toSet<T>(arr: T[], f: (t: T) => string): pxt.Map<boolean>;
    interface ArrayLike<T> {
        [index: number]: T;
        length: number;
    }
    function toArray<T>(a: ArrayLike<T> | ReadonlyArray<T>): T[];
    function indexOfMatching<T>(arr: T[], f: (t: T) => boolean): number;
    function nextTick(f: () => void): void;
    function memoizeString<T>(createNew: (id: string) => T): (id: string) => T;
    function memoize<S, T>(getId: (v: S) => string, createNew: (v: S) => T): (id: S) => T;
    function debounce(func: (...args: any[]) => any, wait: number, immediate?: boolean): any;
    function throttle(func: (...args: any[]) => any, wait: number, immediate?: boolean): any;
    function randomPermute<T>(arr: T[]): void;
    function randomPick<T>(arr: T[]): T;
    function timeSince(time: number): string;
    function unicodeToChar(text: string): string;
    function escapeForRegex(str: string): string;
    function stripUrlProtocol(str: string): string;
    function normalizePath(path: string): string;
    function pathJoin(a: string, b: string): string;
    let isNodeJS: boolean;
    interface HttpRequestOptions {
        url: string;
        method?: string;
        data?: any;
        headers?: pxt.Map<string>;
        allowHttpErrors?: boolean;
        allowGzipPost?: boolean;
        responseArrayBuffer?: boolean;
        forceLiveEndpoint?: boolean;
    }
    interface HttpResponse {
        statusCode: number;
        headers: pxt.Map<string | string[]>;
        buffer?: any;
        text?: string;
        json?: any;
    }
    function requestAsync(options: HttpRequestOptions): Promise<HttpResponse>;
    function httpGetTextAsync(url: string): Promise<string>;
    function httpGetJsonAsync(url: string): Promise<any>;
    function httpPostJsonAsync(url: string, data: any): Promise<any>;
    function stringToUint8Array(input: string): Uint8Array;
    function uint8ArrayToString(input: ArrayLike<number>): string;
    function fromUTF8(binstr: string): string;
    function toUTF8(str: string, cesu8?: boolean): string;
    function toHex(bytes: ArrayLike<number>): string;
    function fromHex(hex: string): Uint8Array;
    class PromiseQueue {
        promises: pxt.Map<(() => Promise<any>)[]>;
        enqueue<T>(id: string, f: () => Promise<T>): Promise<T>;
    }
    class PromiseBuffer<T> {
        private waiting;
        private available;
        drain(): void;
        pushError(v: Error): void;
        push(v: T): void;
        shiftAsync(timeout?: number): Promise<T>;
    }
    function now(): number;
    function nowSeconds(): number;
    let cpuUs: () => number;
    function getMime(filename: string): "text/plain" | "text/html" | "text/css" | "application/javascript" | "image/jpeg" | "image/png" | "image/x-icon" | "text/cache-manifest" | "application/manifest+json" | "application/json" | "image/svg+xml" | "application/vnd.ms-fontobject" | "font/ttf" | "application/font-woff" | "application/font-woff2" | "text/markdown" | "application/xml" | "audio/m4a" | "audio/mp3" | "application/octet-stream";
    function randomUint32(): number;
    function guidGen(): string;
    function downloadLiveTranslationsAsync(lang: string, filename: string, branch?: string, etag?: string): Promise<pxt.Map<string>>;
    const pxtLangCookieId = "PXT_LANG";
    const langCookieExpirationDays = 30;
    interface Language {
        englishName: string;
        localizedName: string;
    }
    const allLanguages: pxt.Map<Language>;
    function isLocaleEnabled(code: string): boolean;
    function updateLocalizationAsync(targetId: string, baseUrl: string, code: string, pxtBranch: string, targetBranch: string, live?: boolean, force?: boolean): Promise<void>;
    enum TranslationsKind {
        Editor = 0,
        Sim = 1,
        Apis = 2,
    }
    function downloadTranslationsAsync(targetId: string, baseUrl: string, code: string, pxtBranch: string, targetBranch: string, live: boolean, translationKind?: TranslationsKind): Promise<pxt.Map<string>>;
    let httpRequestCoreAsync: (options: HttpRequestOptions) => Promise<HttpResponse>;
    let sha256: (hashData: string) => string;
    let getRandomBuf: (buf: Uint8Array) => void;
    function capitalize(n: string): string;
    function uncapitalize(n: string): string;
    function range(len: number): number[];
    function multipartPostAsync(uri: string, data?: any, filename?: string, filecontents?: string): Promise<HttpResponse>;
    function toDataUri(data: string, mimetype?: string): string;
}
declare namespace ts.pxtc.BrowserImpl {
    function sha256buffer(buf: Uint8Array): string;
    function sha256string(s: string): string;
}
declare namespace pxt {
    export import U = pxtc.Util;
    export import Util = pxtc.Util;
    interface TCPIO {
        onData: (v: Uint8Array) => void;
        onError: (e: Error) => void;
        connectAsync(): Promise<void>;
        sendPacketAsync(pkt: Uint8Array): Promise<void>;
        error(msg: string): any;
        disconnectAsync(): Promise<void>;
    }
    type ConversionPass = (opts: pxtc.CompileOptions) => pxtc.KsDiagnostic[];
    let conversionPasses: ConversionPass[];
    let mkTCPSocket: (host: string, port: number) => TCPIO;
    function setAppTarget(trg: TargetBundle): void;
    function savedAppTheme(): AppTheme;
    function setCompileSwitch(name: string, value: boolean): void;
    function setCompileSwitches(names: string): void;
    function bundledSvg(id: string): string;
    function reloadAppTargetVariant(): void;
    function setAppTargetVariant(variant: string, force?: boolean): void;
    let onAppTargetChanged: () => void;
    function setHwVariant(variant: string): void;
    function hasHwVariants(): boolean;
    function getHwVariants(): PackageConfig[];
    interface PxtOptions {
        debug?: boolean;
        light?: boolean;
        wsPort?: number;
    }
    let options: PxtOptions;
    let debug: (msg: any) => void;
    let log: (msg: any) => void;
    let reportException: (err: any, data?: Map<string | number>) => void;
    let reportError: (cat: string, msg: string, data?: Map<string | number>) => void;
    /**
     * Ticks activity events. This event gets aggregated and eventually gets sent.
     */
    function tickActivity(...ids: string[]): void;
    interface WebConfig {
        relprefix: string;
        workerjs: string;
        monacoworkerjs: string;
        gifworkerjs: string;
        pxtVersion: string;
        pxtRelId: string;
        pxtCdnUrl: string;
        commitCdnUrl: string;
        blobCdnUrl: string;
        cdnUrl: string;
        targetUrl: string;
        targetVersion: string;
        targetRelId: string;
        targetId: string;
        simUrl: string;
        partsUrl?: string;
        runUrl?: string;
        docsUrl?: string;
        isStatic?: boolean;
        verprefix?: string;
    }
    function localWebConfig(): WebConfig;
    let webConfig: WebConfig;
    function getOnlineCdnUrl(): string;
    function setupWebConfig(cfg: WebConfig): void;
    interface Host {
        readFile(pkg: Package, filename: string, skipAdditionalFiles?: boolean): string;
        writeFile(pkg: Package, filename: string, contents: string, force?: boolean): void;
        downloadPackageAsync(pkg: Package, deps?: string[]): Promise<void>;
        getHexInfoAsync(extInfo: pxtc.ExtensionInfo): Promise<pxtc.HexInfo>;
        cacheStoreAsync(id: string, val: string): Promise<void>;
        cacheGetAsync(id: string): Promise<string>;
    }
    interface FsFile {
        name: string;
        mtime: number;
        content?: string;
        prevContent?: string;
    }
    interface FsPkg {
        path: string;
        config: pxt.PackageConfig;
        header: pxt.workspace.Header;
        files: FsFile[];
        icon?: string;
        isDeleted?: boolean;
    }
    interface FsPkgs {
        pkgs: FsPkg[];
    }
    interface ICompilationOptions {
    }
    function getEmbeddedScript(id: string): Map<string>;
    function targetConfigAsync(): Promise<pxt.TargetConfig>;
    function packagesConfigAsync(): Promise<pxt.PackagesConfig>;
    const CONFIG_NAME = "pxt.json";
    const SIMSTATE_JSON = ".simstate.json";
    const SERIAL_EDITOR_FILE = "serial.txt";
    const CLOUD_ID = "pxt/";
    const BLOCKS_PROJECT_NAME = "blocksprj";
    const JAVASCRIPT_PROJECT_NAME = "tsprj";
    const PYTHON_PROJECT_NAME = "pyprj";
    function outputName(trg?: pxtc.CompileTarget): "binary.pxt64" | "binary.uf2" | "binary.elf" | "binary.hex";
    function isOutputText(trg?: pxtc.CompileTarget): boolean;
}
declare namespace pxt.blocks {
    const MATH_FUNCTIONS: {
        unary: string[];
        binary: string[];
        infix: string[];
    };
    const ROUNDING_FUNCTIONS: string[];
    interface BlockParameter {
        actualName: string;
        type?: string;
        definitionName: string;
        shadowBlockId?: string;
        defaultValue?: string;
        isOptional?: boolean;
        fieldEditor?: string;
        fieldOptions?: Map<string>;
        shadowOptions?: Map<string>;
        range?: {
            min: number;
            max: number;
        };
    }
    interface BlockCompileInfo {
        parameters: ReadonlyArray<BlockParameter>;
        actualNameToParam: Map<BlockParameter>;
        definitionNameToParam: Map<BlockParameter>;
        handlerArgs?: HandlerArg[];
        thisParameter?: BlockParameter;
    }
    interface HandlerArg {
        name: string;
        type: string;
        inBlockDef: boolean;
    }
    const builtinFunctionInfo: pxt.Map<{
        params: string[];
        blockId: string;
    }>;
    function normalizeBlock(b: string, err?: (msg: string) => void): string;
    function compileInfo(fn: pxtc.SymbolInfo): BlockCompileInfo;
    /**
     * Returns which Blockly block type to use for an argument reporter based
     * on the specified TypeScript type.
     * @param varType The variable's TypeScript type
     * @return The Blockly block type of the reporter to be used
     */
    function reporterTypeForArgType(varType: string): string;
    function defaultIconForArgType(typeName?: string): "calculator" | "text width" | "random" | "align justify";
    interface FieldDescription {
        n: string;
        pre?: string;
        p?: string;
        ni: number;
    }
    function parseFields(b: string): FieldDescription[];
    interface BlockDefinition {
        name: string;
        category: string;
        url: string;
        tooltip?: string | Map<string>;
        operators?: Map<string[]>;
        block?: Map<string>;
        blockTextSearch?: string;
        tooltipSearch?: string;
    }
    function blockDefinitions(): Map<BlockDefinition>;
    function getBlockDefinition(blockId: string): BlockDefinition;
}
declare namespace pxt.BrowserUtils {
    function isIFrame(): boolean;
    function hasNavigator(): boolean;
    function isWindows(): boolean;
    function isWindows10(): boolean;
    function isMobile(): boolean;
    function isIOS(): boolean;
    function isMac(): boolean;
    function isLinux(): boolean;
    function isARM(): boolean;
    function isUwpEdge(): boolean;
    function isEdge(): boolean;
    function isIE(): boolean;
    function isChrome(): boolean;
    function isSafari(): boolean;
    function isFirefox(): boolean;
    function isOpera(): boolean;
    function isMidori(): boolean;
    function isEpiphany(): boolean;
    function isTouchEnabled(): boolean;
    function isPxtElectron(): boolean;
    function isIpcRenderer(): boolean;
    function isElectron(): boolean;
    function isLocalHost(): boolean;
    function isLocalHostDev(): boolean;
    function hasPointerEvents(): boolean;
    function hasSaveAs(): boolean;
    function os(): string;
    function browser(): string;
    function browserVersion(): string;
    function isBrowserSupported(): boolean;
    function devicePixelRatio(): number;
    function browserDownloadBinText(text: string, name: string, contentType?: string, userContextWindow?: Window, onError?: (err: any) => void): string;
    function browserDownloadText(text: string, name: string, contentType?: string, userContextWindow?: Window, onError?: (err: any) => void): string;
    function isBrowserDownloadInSameWindow(): boolean;
    function isBrowserDownloadWithinUserContext(): boolean;
    function browserDownloadDataUri(uri: string, name: string, userContextWindow?: Window): void;
    function browserDownloadUInt8Array(buf: Uint8Array, name: string, contentType?: string, userContextWindow?: Window, onError?: (err: any) => void): string;
    function toDownloadDataUri(b64: string, contentType: string): string;
    function browserDownloadBase64(b64: string, name: string, contentType?: string, userContextWindow?: Window, onError?: (err: any) => void): string;
    function loadImageAsync(data: string): Promise<HTMLImageElement>;
    function loadCanvasAsync(url: string): Promise<HTMLCanvasElement>;
    function imageDataToPNG(img: ImageData): string;
    function resolveCdnUrl(path: string): string;
    function loadStyleAsync(path: string, rtl?: boolean): Promise<void>;
    function loadScriptAsync(path: string): Promise<void>;
    function loadAjaxAsync(url: string): Promise<string>;
    function loadBlocklyAsync(): Promise<void>;
    function patchCdn(url: string): string;
    function initTheme(): void;
    /**
     * Utility method to change the hash.
     * Pass keepHistory to retain an entry of the change in the browser history.
     */
    function changeHash(hash: string, keepHistory?: boolean): void;
    /**
     * Simple utility method to join urls.
     */
    function urlJoin(urlPath1: string, urlPath2: string): string;
    /**
     * Simple utility method to join multiple urls.
     */
    function joinURLs(...parts: string[]): string;
    function storageEstimateAsync(): Promise<{
        quota?: number;
        usage?: number;
    }>;
    const scheduleStorageCleanup: any;
    function stressTranslationsAsync(): Promise<void>;
    interface ITranslationDbEntry {
        id?: string;
        etag: string;
        time: number;
        strings?: pxt.Map<string>;
        md?: string;
    }
    interface ITranslationDb {
        getAsync(lang: string, filename: string, branch: string): Promise<ITranslationDbEntry>;
        setAsync(lang: string, filename: string, branch: string, etag: string, strings?: pxt.Map<string>, md?: string): Promise<void>;
        clearAsync(): Promise<void>;
    }
    type IDBUpgradeHandler = (ev: IDBVersionChangeEvent, request: IDBRequest) => void;
    class IDBWrapper {
        private name;
        private version;
        private upgradeHandler;
        private quotaExceededHandler;
        private _db;
        constructor(name: string, version: number, upgradeHandler?: IDBUpgradeHandler, quotaExceededHandler?: () => void);
        private throwIfNotOpened();
        private errorHandler(err, op, reject);
        private getObjectStore(name, mode?);
        static deleteDatabaseAsync(name: string): Promise<void>;
        openAsync(): Promise<void>;
        getAsync<T>(storeName: string, id: string): Promise<T>;
        getAllAsync<T>(storeName: string): Promise<T[]>;
        setAsync(storeName: string, data: any): Promise<void>;
        deleteAsync(storeName: string, id: string): Promise<void>;
        deleteAllAsync(storeName: string): Promise<void>;
    }
    function translationDbAsync(): Promise<ITranslationDb>;
    function clearTranslationDbAsync(): Promise<void>;
    interface IPointerEvents {
        up: string;
        down: string[];
        move: string;
        enter: string;
        leave: string;
    }
    const pointerEvents: IPointerEvents;
    function popupWindow(url: string, title: string, popUpWidth: number, popUpHeight: number): Window;
    function containsClass(el: SVGElement | HTMLElement, classes: string): boolean;
    function addClass(el: SVGElement | HTMLElement, classes: string): void;
    function removeClass(el: SVGElement | HTMLElement, classes: string): void;
}
declare namespace pxt.commands {
    interface DeployOptions {
        reportError?: (e: string) => void;
        showNotification?: (msg: string) => void;
        reportDeviceNotFoundAsync?: (docPath: string, resp?: ts.pxtc.CompileResult) => Promise<void>;
    }
    type DeployFnAsync = (r: ts.pxtc.CompileResult, d?: DeployOptions) => Promise<void>;
    let deployCoreAsync: DeployFnAsync;
    let deployFallbackAsync: DeployFnAsync;
    let hasDeployFn: () => DeployFnAsync;
    let deployAsync: DeployFnAsync;
    let patchCompileResultAsync: (r: pxtc.CompileResult) => Promise<void>;
    let browserDownloadAsync: (text: string, name: string, contentType: string) => Promise<void>;
    let saveOnlyAsync: (r: ts.pxtc.CompileResult) => Promise<void>;
    let showUploadInstructionsAsync: (fn: string, url: string, confirmAsync: (options: any) => Promise<number>) => Promise<void>;
    let saveProjectAsync: (project: pxt.cpp.HexFile) => Promise<void>;
    let electronDeployAsync: (r: ts.pxtc.CompileResult) => Promise<void>;
    let webUsbPairDialogAsync: (confirmAsync: (options: any) => Promise<number>) => Promise<number>;
    let onTutorialCompleted: () => void;
}
declare namespace pxt {
    function lzmaDecompressAsync(buf: Uint8Array): Promise<string>;
    function lzmaCompressAsync(text: string): Promise<Uint8Array>;
}
declare namespace pxt.cpp {
    function nsWriter(nskw?: string): {
        setNs: (ns: string, over?: string) => void;
        clear: () => void;
        write: (s: string) => void;
        incrIndent: () => void;
        decrIndent: () => void;
        finish: () => string;
    };
    function parseCppInt(v: string): number;
    class PkgConflictError extends Error {
        pkg0: Package;
        pkg1: Package;
        settingName: string;
        isUserError: boolean;
        isVersionConflict: boolean;
        constructor(msg: string);
    }
    function getExtensionInfo(mainPkg: MainPackage): pxtc.ExtensionInfo;
    interface HexFileMeta {
        cloudId: string;
        targetVersions?: pxt.TargetVersions;
        editor: string;
        name: string;
    }
    interface HexFile {
        meta?: HexFileMeta;
        source: string;
    }
    function unpackSourceFromHexFileAsync(file: File): Promise<HexFile>;
    function unpackSourceFromHexAsync(dat: Uint8Array): Promise<HexFile>;
}
declare namespace pxt.hex {
    let showLoading: (msg: string) => void;
    let hideLoading: () => void;
    function storeWithLimitAsync(host: Host, idxkey: string, newkey: string, newval: string, maxLen?: number): Promise<void>;
    function recordGetAsync(host: Host, idxkey: string, newkey: string): Promise<void>;
    function getHexInfoAsync(host: Host, extInfo: pxtc.ExtensionInfo, cloudModule?: any): Promise<pxtc.HexInfo>;
}
declare namespace pxt.crowdin {
    const KEY_VARIABLE = "CROWDIN_KEY";
    interface CrowdinFileInfo {
        name: string;
        fullName?: string;
        id: number;
        node_type: "file" | "directory" | "branch";
        phrases?: number;
        translated?: number;
        approved?: number;
        branch?: string;
        files?: CrowdinFileInfo[];
    }
    interface CrowdinProjectInfo {
        languages: {
            name: string;
            code: string;
        }[];
        files: CrowdinFileInfo[];
    }
    interface DownloadOptions {
        translatedOnly?: boolean;
        validatedOnly?: boolean;
    }
    function downloadTranslationsAsync(branch: string, prj: string, key: string, filename: string, options?: DownloadOptions): Promise<Map<Map<string>>>;
    function createDirectoryAsync(branch: string, prj: string, key: string, name: string, incr?: () => void): Promise<void>;
    function uploadTranslationAsync(branch: string, prj: string, key: string, filename: string, data: string): Promise<void>;
    function projectInfoAsync(prj: string, key: string): Promise<CrowdinProjectInfo>;
    /**
     * Scans files in crowdin and report files that are not on disk anymore
     */
    function listFilesAsync(prj: string, key: string, crowdinPath: string): Promise<{
        fullName: string;
        branch: string;
    }[]>;
    function languageStatsAsync(prj: string, key: string, lang: string): Promise<CrowdinFileInfo[]>;
}
declare namespace pxt.docs {
    function htmlQuote(s: string): string;
    function html2Quote(s: string): string;
    interface BreadcrumbEntry {
        name: string;
        href: string;
    }
    let requireMarked: () => typeof marked;
    interface RenderData {
        html: string;
        theme: AppTheme;
        params: Map<string>;
        filepath?: string;
        versionPath?: string;
        ghEditURLs?: string[];
        finish?: () => string;
        boxes?: Map<string>;
        macros?: Map<string>;
        settings?: Map<string>;
        TOC?: TOCMenuEntry[];
    }
    function prepTemplate(d: RenderData): void;
    interface RenderOptions {
        template: string;
        markdown: string;
        theme?: AppTheme;
        pubinfo?: Map<string>;
        filepath?: string;
        versionPath?: string;
        locale?: Map<string>;
        ghEditURLs?: string[];
        repo?: {
            name: string;
            fullName: string;
            tag?: string;
        };
        throwOnError?: boolean;
        TOC?: TOCMenuEntry[];
    }
    function setupRenderer(renderer: marked.Renderer): void;
    function renderMarkdown(opts: RenderOptions): string;
    function embedUrl(rootUrl: string, tag: string, id: string, height?: number): string;
    function runUrl(url: string, padding: string, id: string): string;
    function codeEmbedUrl(rootUrl: string, id: string, height?: number): string;
    function translate(html: string, locale: Map<string>): {
        text: string;
        missing: Map<string>;
    };
    function buildTOC(summaryMD: string): pxt.TOCMenuEntry[];
    function visitTOC(toc: TOCMenuEntry[], fn: (e: TOCMenuEntry) => void): void;
    function augmentDocs(baseMd: string, childMd: string): string;
}
declare namespace pxt.gallery {
    interface Gallery {
        name: string;
        cards: pxt.CodeCard[];
    }
    interface GalleryProject {
        name: string;
        filesOverride: pxt.Map<string>;
        dependencies: pxt.Map<string>;
        features?: string[];
    }
    function parsePackagesFromMarkdown(md: string): pxt.Map<string>;
    function parseFeaturesFromMarkdown(md: string): string[];
    function parseExampleMarkdown(name: string, md: string): GalleryProject;
    function parseGalleryMardown(md: string): Gallery[];
    function loadGalleryAsync(name: string): Promise<Gallery[]>;
    function loadExampleAsync(name: string, path: string): Promise<GalleryProject>;
}
declare namespace pxt {
    class GDBServer {
        io: pxt.TCPIO;
        private q;
        private dataBuf;
        private numSent;
        private pktSize;
        trace: boolean;
        bmpMode: boolean;
        targetInfo: string;
        private onResponse;
        private onEvent;
        constructor(io: pxt.TCPIO);
        private onData(buf);
        private buildCmd(cmd);
        private decodeResp(resp);
        sendCmdOKAsync(cmd: string): Promise<string>;
        error(msg: string): void;
        sendCmdAsync(cmd: string, respTest?: (resp: string) => boolean): Promise<string>;
        sendRCmdAsync(cmd: string): Promise<string>;
        sendMCmdAsync(cmd: string): Promise<string>;
        write32Async(addr: number, data: number): Promise<void>;
        writeMemAsync(addr: number, data: Uint8Array): Promise<void>;
        readMemAsync(addr: number, bytes: number): Promise<Uint8Array>;
        private initBMPAsync();
        initAsync(): Promise<void>;
    }
}
declare namespace pxt.github {
    interface GHRef {
        ref: string;
        url: string;
        object: {
            sha: string;
            type: string;
            url: string;
        };
    }
    interface UserInfo {
        date: string;
        name: string;
        email: string;
    }
    interface SHAObject {
        url: string;
        sha: string;
    }
    interface TreeEntry extends SHAObject {
        path: string;
        mode: string;
        type: "blob" | "tree";
        size?: number;
        blobContent?: string;
    }
    interface Tree extends SHAObject {
        tree: TreeEntry[];
        truncated: boolean;
    }
    interface Commit extends SHAObject {
        author: UserInfo;
        committer: UserInfo;
        message: string;
        tree: Tree;
        parents: SHAObject[];
        tag?: string;
    }
    let token: string;
    interface RefsResult {
        refs: pxt.Map<string>;
        head?: string;
    }
    interface FileContent {
        encoding: string;
        content: string;
        size: number;
        sha: string;
        download_url: string;
    }
    let forceProxy: boolean;
    function useProxy(): boolean;
    interface CachedPackage {
        files: Map<string>;
    }
    interface IGithubDb {
        loadConfigAsync(repopath: string, tag: string): Promise<pxt.PackageConfig>;
        loadPackageAsync(repopath: string, tag: string): Promise<CachedPackage>;
    }
    class MemoryGithubDb implements IGithubDb {
        private configs;
        private packages;
        private proxyLoadPackageAsync(repopath, tag);
        loadConfigAsync(repopath: string, tag: string): Promise<pxt.PackageConfig>;
        loadPackageAsync(repopath: string, tag: string): Promise<CachedPackage>;
    }
    function downloadTextAsync(repopath: string, commitid: string, filepath: string): Promise<string>;
    let db: IGithubDb;
    function getCommitAsync(repopath: string, sha: string): Promise<Commit>;
    interface CreateBlobReq {
        content: string;
        encoding: "utf-8" | "base64";
    }
    interface CreateTreeReq {
        base_tree: string;
        tree: TreeEntry[];
    }
    interface CreateCommitReq {
        message: string;
        parents: string[];
        tree: string;
    }
    function createObjectAsync(repopath: string, type: string, data: any): Promise<string>;
    function fastForwardAsync(repopath: string, branch: string, commitid: string): Promise<boolean>;
    function putFileAsync(repopath: string, path: string, content: string): Promise<void>;
    function createTagAsync(repopath: string, tag: string, commitid: string): Promise<void>;
    function createPRFromBranchAsync(repopath: string, baseBranch: string, headBranch: string, msg: string): Promise<string>;
    function mergeAsync(repopath: string, branch: string, commitid: string): Promise<string>;
    function getRefAsync(repopath: string, branch: string): Promise<string>;
    function getNewBranchNameAsync(repopath: string, pref?: string): Promise<string>;
    function createNewBranchAsync(repopath: string, branchName: string, commitid: string): Promise<string>;
    function forkRepoAsync(repopath: string, commitid: string, pref?: string): Promise<string>;
    function listRefsAsync(repopath: string, namespace?: string): Promise<string[]>;
    function listRefsExtAsync(repopath: string, namespace?: string): Promise<RefsResult>;
    function pkgConfigAsync(repopath: string, tag?: string): Promise<PackageConfig>;
    function downloadPackageAsync(repoWithTag: string, config: pxt.PackagesConfig): Promise<CachedPackage>;
    interface ParsedRepo {
        owner?: string;
        project?: string;
        fullName: string;
        tag?: string;
    }
    enum GitRepoStatus {
        Unknown = 0,
        Approved = 1,
        Banned = 2,
    }
    interface GitRepo extends ParsedRepo {
        name: string;
        description: string;
        defaultBranch: string;
        status?: GitRepoStatus;
        updatedAt?: number;
        private?: boolean;
        fork?: boolean;
    }
    function listUserReposAsync(): Promise<GitRepo[]>;
    function createRepoAsync(name: string, description: string, priv?: boolean): Promise<GitRepo>;
    function repoIconUrl(repo: GitRepo): string;
    function mkRepoIconUrl(repo: ParsedRepo): string;
    function repoStatus(rr: ParsedRepo, config: pxt.PackagesConfig): GitRepoStatus;
    function repoAsync(id: string, config: pxt.PackagesConfig): Promise<GitRepo>;
    function searchAsync(query: string, config: pxt.PackagesConfig): Promise<GitRepo[]>;
    function parseRepoUrl(url: string): {
        repo: string;
        tag?: string;
        path?: string;
    };
    function parseRepoId(repo: string): ParsedRepo;
    function isGithubId(id: string): boolean;
    function stringifyRepo(p: ParsedRepo): string;
    function noramlizeRepoId(id: string): string;
    function latestVersionAsync(path: string, config: PackagesConfig): Promise<string>;
    interface GitJson {
        repo: string;
        prUrl?: string;
        commit: pxt.github.Commit;
        isFork?: boolean;
    }
    const GIT_JSON = ".git.json";
    interface DiffOptions {
        context?: number;
        ignoreWhitespace?: boolean;
        maxDiffSize?: number;
    }
    function diff(fileA: string, fileB: string, options?: DiffOptions): string[];
    function diff3(fileA: string, fileO: string, fileB: string, lblA?: string, lblB?: string): {
        merged: string;
        numConflicts: number;
    };
}
declare namespace pxt {
    const REFCNT_FLASH = "0xfffe";
    const VTABLE_MAGIC = 249;
    const ValTypeObject = 4;
    enum BuiltInType {
        BoxedString = 1,
        BoxedNumber = 2,
        BoxedBuffer = 3,
        RefAction = 4,
        RefImage = 5,
        RefCollection = 6,
        RefRefLocal = 7,
        RefMap = 8,
        RefMImage = 9,
        User0 = 16,
    }
}
declare namespace pxt.HF2 {
    interface MutableArrayLike<T> {
        readonly length: number;
        [n: number]: T;
    }
    const enum VID {
        ATMEL = 1003,
        ARDUINO = 9025,
        ADAFRUIT = 9114,
        NXP = 3368,
    }
    interface TalkArgs {
        cmd: number;
        data?: Uint8Array;
    }
    interface PacketIO {
        sendPacketAsync(pkt: Uint8Array): Promise<void>;
        onData: (v: Uint8Array) => void;
        onError: (e: Error) => void;
        onEvent: (v: Uint8Array) => void;
        error(msg: string): any;
        reconnectAsync(): Promise<void>;
        disconnectAsync(): Promise<void>;
        isSwitchingToBootloader?: () => void;
        talksAsync?(cmds: TalkArgs[]): Promise<Uint8Array[]>;
        sendSerialAsync?(buf: Uint8Array, useStdErr: boolean): Promise<void>;
        onSerial?: (v: Uint8Array, isErr: boolean) => void;
    }
    let mkPacketIOAsync: () => Promise<pxt.HF2.PacketIO>;
    const HF2_CMD_BININFO = 1;
    const HF2_MODE_BOOTLOADER = 1;
    const HF2_MODE_USERSPACE = 2;
    const HF2_CMD_INFO = 2;
    const HF2_CMD_RESET_INTO_APP = 3;
    const HF2_CMD_RESET_INTO_BOOTLOADER = 4;
    const HF2_CMD_START_FLASH = 5;
    const HF2_CMD_WRITE_FLASH_PAGE = 6;
    const HF2_CMD_CHKSUM_PAGES = 7;
    const HF2_CMD_READ_WORDS = 8;
    const HF2_CMD_WRITE_WORDS = 9;
    const HF2_CMD_DMESG = 16;
    const HF2_FLAG_SERIAL_OUT = 128;
    const HF2_FLAG_SERIAL_ERR = 192;
    const HF2_FLAG_CMDPKT_LAST = 64;
    const HF2_FLAG_CMDPKT_BODY = 0;
    const HF2_FLAG_MASK = 192;
    const HF2_SIZE_MASK = 63;
    const HF2_STATUS_OK = 0;
    const HF2_STATUS_INVALID_CMD = 1;
    const HF2_STATUS_EXEC_ERR = 2;
    const HF2_STATUS_EVENT = 128;
    const HF2_EV_MASK = 8388608;
    function write32(buf: MutableArrayLike<number>, pos: number, v: number): void;
    function write16(buf: MutableArrayLike<number>, pos: number, v: number): void;
    function read32(buf: ArrayLike<number>, pos: number): number;
    function read16(buf: ArrayLike<number>, pos: number): number;
    function encodeU32LE(words: number[]): Uint8Array;
    function decodeU32LE(buf: Uint8Array): number[];
    interface BootloaderInfo {
        Header: string;
        Parsed: {
            Version: string;
            Features: string;
        };
        Model: string;
        BoardID: string;
    }
    function enableLog(): void;
    class Wrapper {
        io: PacketIO;
        private cmdSeq;
        constructor(io: PacketIO);
        private lock;
        rawMode: boolean;
        infoRaw: string;
        info: BootloaderInfo;
        pageSize: number;
        flashSize: number;
        maxMsgSize: number;
        familyID: number;
        bootloaderMode: boolean;
        reconnectTries: number;
        autoReconnect: boolean;
        msgs: U.PromiseBuffer<Uint8Array>;
        eventHandlers: pxt.Map<(buf: Uint8Array) => void>;
        onSerial: (buf: Uint8Array, isStderr: boolean) => void;
        private resetState();
        onEvent(id: number, f: (buf: Uint8Array) => void): void;
        reconnectAsync(first?: boolean): Promise<void>;
        disconnectAsync(): Promise<void>;
        error(m: string): any;
        talkAsync(cmd: number, data?: Uint8Array): Promise<Uint8Array>;
        private sendMsgAsync(buf);
        sendSerialAsync(buf: Uint8Array, useStdErr?: boolean): Promise<void>;
        private sendMsgCoreAsync(buf, serial?);
        switchToBootloaderAsync(): Promise<void>;
        reflashAsync(blocks: pxtc.UF2.Block[]): Promise<void>;
        writeWordsAsync(addr: number, words: number[]): Promise<void>;
        readWordsAsync(addr: number, numwords: number): Promise<Uint8Array>;
        pingAsync(): Promise<void>;
        maybeReconnectAsync(): Promise<void>;
        flashAsync(blocks: pxtc.UF2.Block[]): Promise<void>;
        private initAsync();
    }
    type ReadAsync = (addr: number, len: number) => Promise<ArrayLike<number>>;
    function onlyChangedBlocksAsync(blocks: pxtc.UF2.Block[], readWordsAsync: ReadAsync): Promise<pxtc.UF2.Block[]>;
}
declare namespace pxt.HWDBG {
    import H = pxt.HF2;
    interface StateInfo {
        numGlobals: number;
        globalsPtr: number;
    }
    const taggedUndefined = 0;
    const taggedNull: number;
    const taggedFalse: number;
    const taggedTrue: number;
    let postMessage: (msg: pxsim.DebuggerMessage) => void;
    function decodeValue(n: number): any;
    function heapExpandAsync(v: any): Promise<any>;
    function heapExpandMapAsync(vars: pxsim.Variables): Promise<void>;
    function startDebugAsync(compileRes: pxtc.CompileResult, hidWr: H.Wrapper): Promise<void>;
    function handleMessage(msg: pxsim.DebuggerMessage): void;
    function resumeAsync(into?: boolean): Promise<void>;
    interface HwState {
        staticState: StateInfo;
        globals: Uint8Array;
    }
    function waitForHaltAsync(): Promise<void>;
    function getHwStateAsync(): Promise<HwState>;
}
declare namespace pxt {
    class ImageConverter {
        private palette;
        private start;
        logTime(): void;
        convert(jresURL: string): string;
        genMonochrome(data: string, w: number, h: number): string;
        genColor(data: string, width: number, height: number, intScale: number): string;
    }
}
declare namespace pxt {
    const TS_CONFIG = "{\n    \"compilerOptions\": {\n        \"target\": \"es5\",\n        \"noImplicitAny\": true,\n        \"outDir\": \"built\",\n        \"rootDir\": \".\"\n    },\n    \"exclude\": [\"pxt_modules/**/*test.ts\"]\n}\n";
    function packageFiles(name: string): pxt.Map<string>;
    function packageFilesFixup(files: Map<string>, removeSubdirs?: boolean): void;
}
declare namespace pxt.blocks {
    enum NT {
        Prefix = 0,
        Postfix = 1,
        Infix = 2,
        Block = 3,
        NewLine = 4,
    }
    interface JsNode {
        type: NT;
        children: JsNode[];
        op: string;
        id?: string;
        glueToBlock?: GlueMode;
        canIndentInside?: boolean;
        noFinalNewline?: boolean;
    }
    enum GlueMode {
        None = 0,
        WithSpace = 1,
        NoSpace = 2,
    }
    function backtickLit(s: string): string;
    function stringLit(s: string): string;
    function mkNode(tp: NT, pref: string, children: JsNode[]): JsNode;
    function mkNewLine(): JsNode;
    function mkPrefix(pref: string, children: JsNode[]): JsNode;
    function mkPostfix(children: JsNode[], post: string): JsNode;
    function mkInfix(child0: JsNode, op: string, child1: JsNode): JsNode;
    function mkText(s: string): JsNode;
    function mkBlock(nodes: JsNode[]): JsNode;
    function mkGroup(nodes: JsNode[]): JsNode;
    function mkStmt(...nodes: JsNode[]): JsNode;
    function mkCommaSep(nodes: JsNode[], withNewlines?: boolean): JsNode;
    namespace Helpers {
        function mkArrayLiteral(args: JsNode[]): JsNode;
        function mkNumberLiteral(x: number): JsNode;
        function mkBooleanLiteral(x: boolean): JsNode;
        function mkStringLiteral(x: string): JsNode;
        function mkPropertyAccess(name: string, thisArg: JsNode): JsNode;
        function mkCall(name: string, args: JsNode[], externalInputs?: boolean, method?: boolean): JsNode;
        function stdCall(name: string, args: JsNode[], externalInputs: boolean): JsNode;
        function extensionCall(name: string, args: JsNode[], externalInputs: boolean): JsNode;
        function namespaceCall(namespace: string, name: string, args: JsNode[], externalInputs: boolean): JsNode;
        function mathCall(name: string, args: JsNode[]): JsNode;
        function mkGlobalRef(name: string): JsNode;
        function mkSimpleCall(p: string, args: JsNode[]): JsNode;
        function mkWhile(condition: JsNode, body: JsNode[]): JsNode;
        function mkComment(text: string): JsNode;
        function mkMultiComment(text: string): JsNode;
        function mkAssign(x: JsNode, e: JsNode): JsNode;
        function mkParenthesizedExpression(expression: JsNode): JsNode;
    }
    export import H = Helpers;
    interface SourceInterval {
        id: string;
        start: number;
        end: number;
    }
    function flattenNode(app: JsNode[]): {
        output: string;
        sourceMap: SourceInterval[];
    };
    function isReservedWord(str: string): boolean;
    function isParenthesized(fnOutput: string): boolean;
}
declare namespace pxt {
    class Package {
        id: string;
        _verspec: string;
        parent: MainPackage;
        static getConfigAsync(pkgTargetVersion: string, id: string, fullVers: string): Promise<pxt.PackageConfig>;
        static corePackages(): pxt.PackageConfig[];
        addedBy: Package[];
        config: PackageConfig;
        level: number;
        isLoaded: boolean;
        private resolvedVersion;
        ignoreTests: boolean;
        cppOnly: boolean;
        constructor(id: string, _verspec: string, parent: MainPackage, addedBy: Package);
        invalid(): boolean;
        version(): string;
        verProtocol(): string;
        verArgument(): string;
        targetVersion(): string;
        commonDownloadAsync(): Promise<Map<string>>;
        host(): Host;
        readFile(fn: string): string;
        resolveDep(id: string): Package;
        saveConfig(): void;
        setPreferredEditor(editor: string): void;
        getPreferredEditor(): string;
        parseJRes(allres?: Map<JRes>): Map<JRes>;
        private resolveVersionAsync();
        private downloadAsync();
        loadConfig(): void;
        protected validateConfig(): void;
        isPackageInUse(pkgId: string, ts?: string): boolean;
        private getMissingPackages(config, ts);
        /**
         * For the given package config or ID, looks through all the currently installed packages to find conflicts in
         * Yotta settings and version spec
         */
        findConflictsAsync(pkgOrId: string | PackageConfig, version: string): Promise<cpp.PkgConflictError[]>;
        configureAsInvalidPackage(reason: string): void;
        private parseConfig(cfgSrc, targetVersion?);
        private patchCorePackage();
        dependencies(includeCpp?: boolean): pxt.Map<string>;
        loadAsync(isInstall?: boolean, targetVersion?: string): Promise<void>;
        getFiles(): string[];
        addSnapshot(files: Map<string>, exts?: string[]): void;
        /**
         * Returns localized strings qName -> translation
         */
        packageLocalizationStringsAsync(lang: string): Promise<Map<string>>;
        bundledStringsForFile(lang: string, filename: string): Map<string>;
    }
    class MainPackage extends Package {
        _host: Host;
        deps: Map<Package>;
        private _jres;
        constructor(_host: Host);
        installAllAsync(targetVersion?: string): Promise<void>;
        sortedDeps(includeCpp?: boolean): Package[];
        localizationStringsAsync(lang: string): Promise<Map<string>>;
        getTargetOptions(): pxtc.CompileTarget;
        getJRes(): Map<JRes>;
        private _resolvedBannedCategories;
        resolveBannedCategories(): string[];
        getCompileOptionsAsync(target?: pxtc.CompileTarget): Promise<pxtc.CompileOptions>;
        filesToBePublishedAsync(allowPrivate?: boolean): Promise<Map<string>>;
        saveToJsonAsync(): Promise<pxt.cpp.HexFile>;
        compressToFileAsync(): Promise<Uint8Array>;
        computePartDefinitions(parts: string[]): pxt.Map<pxsim.PartDefinition>;
    }
    function allPkgFiles(cfg: PackageConfig): string[];
    function isPkgBeta(cfg: {
        description?: string;
    }): boolean;
}
declare namespace pxt.patching {
    function computePatches(version: string, kind?: string): ts.pxtc.UpgradePolicy[];
    function upgradePackageReference(pkgTargetVersion: string, pkg: string, val: string): string;
    function patchJavaScript(pkgTargetVersion: string, fileContents: string): string;
}
declare namespace pxt.semver {
    interface Version {
        major: number;
        minor: number;
        patch: number;
        pre: string[];
        build: string[];
    }
    function cmp(a: Version, b: Version): number;
    function parse(v: string): Version;
    function tryParse(v: string): Version;
    function normalize(v: string): string;
    function stringify(v: Version): string;
    function majorCmp(a: string, b: string): number;
    function strcmp(a: string, b: string): number;
    function inRange(rng: string, v: Version): boolean;
    /**
     * Filters and sort tags from latest to oldest (semver wize)
     * @param tags
     */
    function sortLatestTags(tags: string[]): string[];
    function test(): void;
}
declare namespace ts.pxtc {
    const assert: typeof Util.assert;
    const oops: typeof Util.oops;
    export import U = pxtc.Util;
    const ON_START_TYPE = "pxt-on-start";
    const ON_START_COMMENT = "on start";
    const HANDLER_COMMENT = "code goes here";
    const TS_STATEMENT_TYPE = "typescript_statement";
    const TS_DEBUGGER_TYPE = "debugger_keyword";
    const TS_BREAK_TYPE = "break_keyword";
    const TS_CONTINUE_TYPE = "continue_keyword";
    const TS_OUTPUT_TYPE = "typescript_expression";
    const PAUSE_UNTIL_TYPE = "pxt_pause_until";
    const COLLAPSED_BLOCK = "pxt_collapsed_block";
    const BINARY_JS = "binary.js";
    const BINARY_ASM = "binary.asm";
    const BINARY_HEX = "binary.hex";
    const BINARY_UF2 = "binary.uf2";
    const BINARY_ELF = "binary.elf";
    const BINARY_PXT64 = "binary.pxt64";
    const NATIVE_TYPE_THUMB = "thumb";
    const NATIVE_TYPE_VM = "vm";
    interface BlocksInfo {
        apis: ApisInfo;
        blocks: SymbolInfo[];
        blocksById: pxt.Map<SymbolInfo>;
        enumsByName: pxt.Map<EnumInfo>;
        kindsByName: pxt.Map<KindInfo>;
    }
    interface EnumInfo {
        name: string;
        memberName: string;
        blockId: string;
        isBitMask: boolean;
        isHash: boolean;
        firstValue?: number;
        initialMembers: string[];
        promptHint: string;
    }
    interface KindInfo {
        name: string;
        memberName: string;
        createFunctionName: string;
        blockId: string;
        promptHint: string;
        initialMembers: string[];
    }
    interface CompletionEntry {
        name: string;
        kind: string;
        qualifiedName: string;
    }
    interface CompletionInfo {
        entries: SymbolInfo[];
        isMemberCompletion: boolean;
        isNewIdentifierLocation: boolean;
        isTypeLocation: boolean;
    }
    interface LocationInfo {
        fileName: string;
        start: number;
        length: number;
        line: number;
        column: number;
        endLine?: number;
        endColumn?: number;
    }
    interface FunctionLocationInfo extends LocationInfo {
        functionName: string;
        argumentNames?: string[];
    }
    interface KsDiagnostic extends LocationInfo {
        code: number;
        category: DiagnosticCategory;
        messageText: string | DiagnosticMessageChain;
    }
    interface ConfigEntry {
        name: string;
        key: number;
        value: number;
    }
    interface CompileResult {
        outfiles: pxt.Map<string>;
        diagnostics: KsDiagnostic[];
        success: boolean;
        times: pxt.Map<number>;
        breakpoints?: Breakpoint[];
        procDebugInfo?: ProcDebugInfo[];
        blocksInfo?: BlocksInfo;
        usedSymbols?: pxt.Map<SymbolInfo>;
        usedArguments?: pxt.Map<string[]>;
        needsFullRecompile?: boolean;
        saveOnly?: boolean;
        userContextWindow?: Window;
        downloadFileBaseName?: string;
        headerId?: string;
        confirmAsync?: (confirmOptions: {}) => Promise<number>;
        configData?: ConfigEntry[];
    }
    interface Breakpoint extends LocationInfo {
        id: number;
        isDebuggerStmt: boolean;
        binAddr?: number;
    }
    interface CellInfo {
        name: string;
        type: string;
        index: number;
    }
    interface ProcCallInfo {
        procIndex: number;
        callLabel: string;
        addr: number;
        stack: number;
    }
    interface ProcDebugInfo {
        name: string;
        idx: number;
        bkptLoc: number;
        codeStartLoc: number;
        codeEndLoc: number;
        locals: CellInfo[];
        args: CellInfo[];
        localsMark: number;
        calls: ProcCallInfo[];
    }
    const enum BitSize {
        None = 0,
        Int8 = 1,
        UInt8 = 2,
        Int16 = 3,
        UInt16 = 4,
        Int32 = 5,
        UInt32 = 6,
    }
    function computeUsedParts(resp: CompileResult, ignoreBuiltin?: boolean): string[];
    /**
     * Unlocalized category name for a symbol
     */
    function blocksCategory(si: SymbolInfo): string;
    function getBlocksInfo(info: ApisInfo, categoryFilters?: string[]): BlocksInfo;
    let apiLocalizationStrings: pxt.Map<string>;
    function localizeApisAsync(apis: pxtc.ApisInfo, mainPkg: pxt.MainPackage): Promise<pxtc.ApisInfo>;
    function emptyExtInfo(): ExtensionInfo;
    function parseCommentString(cmt: string): CommentAttrs;
    function updateBlockDef(attrs: CommentAttrs): void;
    function parseBlockDefinition(def: string): ParsedBlockDef;
    namespace hex {
        function isSetupFor(extInfo: ExtensionInfo): boolean;
        let currentSetup: string;
        let currentHexInfo: pxtc.HexInfo;
        interface ChecksumBlock {
            magic: number;
            endMarkerPos: number;
            endMarker: number;
            regions: {
                start: number;
                length: number;
                checksum: number;
            }[];
        }
        function parseChecksumBlock(buf: ArrayLike<number>, pos?: number): ChecksumBlock;
    }
    namespace UF2 {
        const UF2_MAGIC_START0 = 171066965;
        const UF2_MAGIC_START1 = 2656915799;
        const UF2_MAGIC_END = 179400496;
        const UF2_FLAG_NONE = 0;
        const UF2_FLAG_NOFLASH = 1;
        const UF2_FLAG_FILE = 4096;
        const UF2_FLAG_FAMILY_ID_PRESENT = 8192;
        interface Block {
            flags: number;
            targetAddr: number;
            payloadSize: number;
            blockNo: number;
            numBlocks: number;
            fileSize: number;
            familyId: number;
            filename?: string;
            data: Uint8Array;
        }
        function parseBlock(block: Uint8Array): Block;
        function parseFile(blocks: Uint8Array): Block[];
        interface ShiftedBuffer {
            start: number;
            buf: Uint8Array;
        }
        function toBin(blocks: Uint8Array, endAddr?: number): ShiftedBuffer;
        function readBytes(blocks: Block[], addr: number, length: number): Uint8Array;
        interface BlockFile {
            currBlock: Uint8Array;
            currPtr: number;
            blocks: Uint8Array[];
            ptrs: number[];
            filename?: string;
            filesize: number;
            familyId: number;
        }
        function newBlockFile(familyId?: string | number): BlockFile;
        function finalizeFile(f: BlockFile): void;
        function concatFiles(fs: BlockFile[]): BlockFile;
        function serializeFile(f: BlockFile): string;
        function readBytesFromFile(f: BlockFile, addr: number, length: number): Uint8Array;
        function writeBytes(f: BlockFile, addr: number, bytes: ArrayLike<number>, flags?: number): void;
        function writeHex(f: BlockFile, hex: string[]): void;
    }
}
declare namespace ts.pxtc.service {
    interface OpArg {
        fileName?: string;
        fileContent?: string;
        infoType?: InfoType;
        position?: number;
        options?: CompileOptions;
        search?: SearchOptions;
        format?: FormatOptions;
        blocks?: BlocksOptions;
        projectSearch?: ProjectSearchOptions;
        snippet?: SnippetOptions;
        runtime?: pxt.RuntimeOptions;
    }
    interface SnippetOptions {
        qName: string;
        python?: boolean;
    }
    interface SearchOptions {
        subset?: pxt.Map<boolean | string>;
        term: string;
        localizedApis?: ApisInfo;
        localizedStrings?: pxt.Map<string>;
    }
    interface FormatOptions {
        input: string;
        pos: number;
    }
    interface SearchInfo {
        id: string;
        name: string;
        qName?: string;
        block?: string;
        namespace?: string;
        jsdoc?: string;
        field?: [string, string];
        localizedCategory?: string;
        builtinBlock?: boolean;
    }
    interface ProjectSearchOptions {
        term: string;
        headers: ProjectSearchInfo[];
    }
    interface ProjectSearchInfo {
        name: string;
        id?: string;
    }
    interface BlocksOptions {
        bannedCategories?: string[];
    }
}
declare namespace pxt.streams {
    interface JsonStreamField {
        name: string;
        sum: number;
        min: number;
        max: number;
        count: number;
    }
    interface JsonStreamMeta {
        fields: JsonStreamField[];
        size: number;
        rows: number;
        batches: number;
    }
    interface JsonStream {
        kind: string;
        id: string;
        time: number;
        name?: string;
        meta: JsonStreamMeta;
        privatekey?: string;
    }
    interface JsonStreamPayload {
        fields: string[];
        values: number[][];
    }
    interface JsonStreamPayloadResponse {
        meta: JsonStreamMeta;
        quotaUsedHere: number;
        quotaLeft: number;
    }
    interface JsonStreamData {
        fields: JsonStreamField[];
        values: number[][];
        continuation?: string;
        continuationUrl?: string;
    }
    function createStreamAsync(target: string, name?: string): Promise<JsonStream>;
    function postPayloadAsync(stream: JsonStream, data: JsonStreamPayload): Promise<void>;
}
declare namespace pxt.svgUtil {
    type Map<T> = {
        [index: string]: T;
    };
    type PointerHandler = () => void;
    enum PatternUnits {
        userSpaceOnUse = 0,
        objectBoundingBox = 1,
    }
    enum LengthUnit {
        em = 0,
        ex = 1,
        px = 2,
        in = 3,
        cm = 4,
        mm = 5,
        pt = 6,
        pc = 7,
        percent = 8,
    }
    class BaseElement<T extends SVGElement> {
        el: T;
        protected titleElement: SVGTitleElement;
        constructor(type: string);
        attr(attributes: Map<string | number | boolean>): this;
        setAttribute(name: string, value: string | number | boolean): this;
        setAttributeNS(ns: string, name: string, value: string | number | boolean): this;
        id(id: string): this;
        setClass(...classes: string[]): this;
        appendClass(className: string): this;
        removeClass(className: string): void;
        title(text: string): void;
        setVisible(visible: boolean): this;
    }
    class DrawContext<T extends SVGElement> extends BaseElement<T> {
        draw(type: "text"): Text;
        draw(type: "circle"): Circle;
        draw(type: "rect"): Rect;
        draw(type: "line"): Line;
        draw(type: "polygon"): Polygon;
        draw(type: "polyline"): Polyline;
        draw(type: "path"): Path;
        element(type: "text", cb: (newElement: Text) => void): this;
        element(type: "circle", cb: (newElement: Circle) => void): this;
        element(type: "rect", cb: (newElement: Rect) => void): this;
        element(type: "line", cb: (newElement: Line) => void): this;
        element(type: "polygon", cb: (newElement: Polygon) => void): this;
        element(type: "polyline", cb: (newElement: Polyline) => void): this;
        element(type: "path", cb: (newElement: Path) => void): this;
        group(): Group;
        appendChild<T extends SVGElement>(child: BaseElement<T>): void;
        onDown(handler: PointerHandler): this;
        onUp(handler: PointerHandler): this;
        onMove(handler: PointerHandler): this;
        onEnter(handler: (isDown: boolean) => void): this;
        onLeave(handler: PointerHandler): this;
        onClick(handler: PointerHandler): this;
    }
    class SVG extends DrawContext<SVGSVGElement> {
        defs: DefsElement;
        constructor(parent?: Element);
        define(cb: (defs: DefsElement) => void): this;
    }
    class Group extends DrawContext<SVGGElement> {
        top: number;
        left: number;
        scaleFactor: number;
        constructor(parent?: SVGElement);
        translate(x: number, y: number): this;
        scale(factor: number): this;
        def(): DefsElement;
        style(): StyleElement;
        private updateTransform();
    }
    class Pattern extends DrawContext<SVGPatternElement> {
        constructor();
        units(kind: PatternUnits): this;
        contentUnits(kind: PatternUnits): this;
        size(width: number, height: number): this;
    }
    class DefsElement extends BaseElement<SVGDefsElement> {
        constructor(parent: SVGElement);
        create(type: "path", id: string): Path;
        create(type: "pattern", id: string): Pattern;
        create(type: "radialGradient", id: string): RadialGradient;
        create(type: "linearGradient", id: string): LinearGradient;
        create(type: "clipPath", id: string): ClipPath;
    }
    class StyleElement extends BaseElement<SVGStyleElement> {
        constructor(parent: SVGElement);
        content(css: string): void;
    }
    class Drawable<T extends SVGElement> extends DrawContext<T> {
        at(x: number, y: number): this;
        moveTo(x: number, y: number): this;
        fill(color: string, opacity?: number): this;
        opacity(opacity: number): this;
        stroke(color: string, width?: number): this;
        strokeWidth(width: number): this;
        strokeOpacity(opacity: number): this;
        clipPath(url: string): this;
    }
    class Text extends Drawable<SVGTextElement> {
        constructor(text?: string);
        text(text: string): this;
        fontFamily(family: string): this;
        fontSize(size: number, units: LengthUnit): this;
        offset(dx: number, dy: number, units: LengthUnit): this;
        anchor(type: "start" | "middle" | "end" | "inherit"): this;
    }
    class Rect extends Drawable<SVGRectElement> {
        constructor();
        width(width: number, unit?: LengthUnit): this;
        height(height: number, unit?: LengthUnit): this;
        corner(radius: number): this;
        corners(rx: number, ry: number): this;
        size(width: number, height: number, unit?: LengthUnit): this;
    }
    class Circle extends Drawable<SVGCircleElement> {
        constructor();
        at(cx: number, cy: number): this;
        radius(r: number): this;
    }
    class Line extends Drawable<SVGLineElement> {
        constructor();
        at(x1: number, y1: number, x2?: number, y2?: number): this;
        from(x1: number, y1: number): this;
        to(x2: number, y2: number): this;
    }
    class PolyElement<T extends SVGPolygonElement | SVGPolylineElement> extends Drawable<T> {
        points(points: string): this;
        with(points: {
            x: number;
            y: number;
        }[]): this;
    }
    class Polyline extends PolyElement<SVGPolylineElement> {
        constructor();
    }
    class Polygon extends PolyElement<SVGPolygonElement> {
        constructor();
    }
    class Path extends Drawable<SVGPathElement> {
        d: PathContext;
        constructor();
        update(): this;
        path(cb: (d: PathContext) => void): this;
    }
    class Image extends Drawable<SVGImageElement> {
        constructor();
        src(url: string): this;
        width(width: number, unit?: LengthUnit): this;
        height(height: number, unit?: LengthUnit): this;
        size(width: number, height: number, unit?: LengthUnit): this;
    }
    class Gradient<T extends SVGGradientElement> extends BaseElement<T> {
        units(kind: PatternUnits): this;
        stop(offset: number, color?: string, opacity?: string): this;
    }
    class LinearGradient extends Gradient<SVGLinearGradientElement> {
        constructor();
        start(x1: number, y1: number): this;
        end(x2: number, y2: number): this;
    }
    class RadialGradient extends Gradient<SVGRadialGradientElement> {
        constructor();
        center(cx: number, cy: number): this;
        focus(fx: number, fy: number, fr: number): this;
        radius(r: number): this;
    }
    class ClipPath extends DrawContext<SVGClipPathElement> {
        constructor();
        clipPathUnits(objectBoundingBox: boolean): this;
    }
    type OperatorSymbol = "m" | "M" | "l" | "L" | "c" | "C" | "q" | "Q" | "T" | "t" | "S" | "s" | "z" | "Z" | "A" | "a";
    interface PathOp {
        op: OperatorSymbol;
        args: number[];
    }
    class PathContext {
        private ops;
        clear(): void;
        moveTo(x: number, y: number): this;
        moveBy(dx: number, dy: number): this;
        lineTo(x: number, y: number): this;
        lineBy(dx: number, dy: number): this;
        cCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): this;
        cCurveBy(dc1x: number, dc1y: number, dc2x: number, dc2y: number, dx: number, dy: number): this;
        qCurveTo(cx: number, cy: number, x: number, y: number): this;
        qCurveBy(dcx: number, dcy: number, dx: number, dy: number): this;
        sCurveTo(cx: number, cy: number, x: number, y: number): this;
        sCurveBy(dcx: number, dcy: number, dx: number, dy: number): this;
        tCurveTo(x: number, y: number): this;
        tCurveBy(dx: number, dy: number): this;
        arcTo(rx: number, ry: number, xRotate: number, large: boolean, sweepClockwise: boolean, x: number, y: number): this;
        arcBy(rx: number, ry: number, xRotate: number, large: boolean, sweepClockwise: boolean, x: number, y: number): this;
        close(): this;
        toAttribute(): string;
        private op(op, ...args);
    }
}
declare namespace pxt.svgUtil.events {
    function isTouchEnabled(): boolean;
    function hasPointerEvents(): boolean;
    function down(el: SVGElement, handler: () => void): void;
    function up(el: SVGElement, handler: () => void): void;
    function enter(el: SVGElement, handler: (isDown: boolean) => void): void;
    function leave(el: SVGElement, handler: () => void): void;
    function move(el: SVGElement, handler: () => void): void;
    function click(el: SVGElement, handler: () => void): void;
}
declare namespace pxt.svgUtil.helpers {
    class CenteredText extends Text {
        protected cx: number;
        protected cy: number;
        protected fontSizePixels: number;
        at(cx: number, cy: number): this;
        text(text: string, fontSizePixels?: number): this;
        protected rePosition(): void;
    }
}
declare namespace pxt.toolbox {
    const blockColors: Map<number | string>;
    const blockIcons: Map<number | string>;
    function appendToolboxIconCss(className: string, i: string): void;
    function getNamespaceColor(ns: string): string;
    function getNamespaceIcon(ns: string): string;
    function advancedTitle(): string;
    function addPackageTitle(): string;
    function recipesTitle(): string;
    /**
     * Convert blockly hue to rgb
     */
    function convertColor(colour: string): string;
    function hueToRgb(hue: number): string;
    function fadeColor(hex: string, luminosity: number, lighten: boolean): string;
}
declare namespace pxt.tutorial {
    function parseTutorial(tutorialmd: string): TutorialInfo;
    function highlight(pre: HTMLPreElement): void;
}
declare namespace ts.pxtc {
    function flattenDiagnosticMessageText(messageText: string | DiagnosticMessageChain, newLine: string): string;
    enum ScriptTarget {
        ES3 = 0,
        ES5 = 1,
        ES6 = 2,
        ES2015 = 2,
        Latest = 2,
    }
    const enum CharacterCodes {
        nullCharacter = 0,
        maxAsciiCharacter = 127,
        lineFeed = 10,
        carriageReturn = 13,
        lineSeparator = 8232,
        paragraphSeparator = 8233,
        nextLine = 133,
        space = 32,
        nonBreakingSpace = 160,
        enQuad = 8192,
        emQuad = 8193,
        enSpace = 8194,
        emSpace = 8195,
        threePerEmSpace = 8196,
        fourPerEmSpace = 8197,
        sixPerEmSpace = 8198,
        figureSpace = 8199,
        punctuationSpace = 8200,
        thinSpace = 8201,
        hairSpace = 8202,
        zeroWidthSpace = 8203,
        narrowNoBreakSpace = 8239,
        ideographicSpace = 12288,
        mathematicalSpace = 8287,
        ogham = 5760,
        _ = 95,
        $ = 36,
        _0 = 48,
        _1 = 49,
        _2 = 50,
        _3 = 51,
        _4 = 52,
        _5 = 53,
        _6 = 54,
        _7 = 55,
        _8 = 56,
        _9 = 57,
        a = 97,
        b = 98,
        c = 99,
        d = 100,
        e = 101,
        f = 102,
        g = 103,
        h = 104,
        i = 105,
        j = 106,
        k = 107,
        l = 108,
        m = 109,
        n = 110,
        o = 111,
        p = 112,
        q = 113,
        r = 114,
        s = 115,
        t = 116,
        u = 117,
        v = 118,
        w = 119,
        x = 120,
        y = 121,
        z = 122,
        A = 65,
        B = 66,
        C = 67,
        D = 68,
        E = 69,
        F = 70,
        G = 71,
        H = 72,
        I = 73,
        J = 74,
        K = 75,
        L = 76,
        M = 77,
        N = 78,
        O = 79,
        P = 80,
        Q = 81,
        R = 82,
        S = 83,
        T = 84,
        U = 85,
        V = 86,
        W = 87,
        X = 88,
        Y = 89,
        Z = 90,
        ampersand = 38,
        asterisk = 42,
        at = 64,
        backslash = 92,
        backtick = 96,
        bar = 124,
        caret = 94,
        closeBrace = 125,
        closeBracket = 93,
        closeParen = 41,
        colon = 58,
        comma = 44,
        dot = 46,
        doubleQuote = 34,
        equals = 61,
        exclamation = 33,
        greaterThan = 62,
        hash = 35,
        lessThan = 60,
        minus = 45,
        openBrace = 123,
        openBracket = 91,
        openParen = 40,
        percent = 37,
        plus = 43,
        question = 63,
        semicolon = 59,
        singleQuote = 39,
        slash = 47,
        tilde = 126,
        backspace = 8,
        formFeed = 12,
        byteOrderMark = 65279,
        tab = 9,
        verticalTab = 11,
    }
    function isIdentifierStart(ch: number, languageVersion: ts.pxtc.ScriptTarget): boolean;
    function isIdentifierPart(ch: number, languageVersion: ts.pxtc.ScriptTarget): boolean;
    const reservedWords: string[];
    function escapeIdentifier(name: string): string;
    function isUnicodeIdentifierStart(code: number, languageVersion: ts.pxtc.ScriptTarget): boolean;
    enum DiagnosticCategory {
        Warning = 0,
        Error = 1,
        Message = 2,
    }
}
declare namespace pxt.webBluetooth {
    function isAvailable(): boolean;
    function hasConsole(): boolean;
    function hasPartialFlash(): boolean;
    function isValidUUID(id: string): boolean;
    class BLERemote {
        id: string;
        aliveToken: pxt.Util.CancellationToken;
        connectionTimeout: number;
        private connectPromise;
        constructor(id: string, aliveToken: pxt.Util.CancellationToken);
        protected debug(msg: string): void;
        protected alivePromise<T>(p: Promise<T>): Promise<T>;
        protected cancelConnect(): void;
        protected createConnectPromise(): Promise<void>;
        connectAsync(): Promise<void>;
        disconnect(): void;
        kill(): void;
    }
    class BLEService extends BLERemote {
        protected device: BLEDevice;
        autoReconnect: boolean;
        autoReconnectDelay: number;
        disconnectOnAutoReconnect: boolean;
        private reconnectPromise;
        private failedConnectionServicesVersion;
        constructor(id: string, device: BLEDevice, autoReconnect: boolean);
        handleDisconnected(event: Event): void;
        private exponentialBackoffConnectAsync(max, delay);
    }
    class BLETXService extends BLEService {
        protected device: BLEDevice;
        private serviceUUID;
        private txCharacteristicUUID;
        service: BluetoothRemoteGATTService;
        txCharacteristic: BluetoothRemoteGATTCharacteristic;
        constructor(id: string, device: BLEDevice, serviceUUID: BluetoothServiceUUID, txCharacteristicUUID: BluetoothServiceUUID);
        protected createConnectPromise(): Promise<void>;
        handlePacket(data: DataView): void;
        private handleValueChanged(event);
        disconnect(): void;
    }
    class HF2Service extends BLETXService {
        protected device: BLEDevice;
        static SERVICE_UUID: BluetoothServiceUUID;
        static CHARACTERISTIC_TX_UUID: BluetoothCharacteristicUUID;
        static BLEHF2_FLAG_SERIAL_OUT: number;
        static BLEHF2_FLAG_SERIAL_ERR: number;
        constructor(device: BLEDevice);
        handlePacket(data: DataView): void;
    }
    class UARTService extends BLETXService {
        protected device: BLEDevice;
        static SERVICE_UUID: BluetoothServiceUUID;
        static CHARACTERISTIC_TX_UUID: BluetoothCharacteristicUUID;
        constructor(device: BLEDevice);
        handlePacket(data: DataView): void;
    }
    class PartialFlashingService extends BLEService {
        protected device: BLEDevice;
        static SERVICE_UUID: string;
        static CHARACTERISTIC_UUID: string;
        static REGION_INFO: number;
        static FLASH_DATA: number;
        static PACKET_OUT_OF_ORDER: number;
        static PACKET_WRITTEN: number;
        static END_OF_TRANSMISSION: number;
        static STATUS: number;
        static RESET: number;
        static MODE_PAIRING: number;
        static MODE_APPLICATION: number;
        static REGION_SOFTDEVICE: number;
        static REGION_DAL: number;
        static REGION_MAKECODE: number;
        static MAGIC_MARKER: Uint8Array;
        static CHUNK_MIN_DELAY: number;
        static CHUNK_MAX_DELAY: number;
        private pfCharacteristic;
        private state;
        private chunkDelay;
        private version;
        private mode;
        private regions;
        private hex;
        private bin;
        private magicOffset;
        private dalHash;
        private makeCodeHash;
        private flashOffset;
        private flashPacketNumber;
        private flashPacketToken;
        private flashResolve;
        private flashReject;
        constructor(device: BLEDevice);
        private clearFlashData();
        protected createConnectPromise(): Promise<void>;
        disconnect(): void;
        private findMarker(offset, marker);
        flashAsync(hex: string): Promise<void>;
        private createFlashPromise(hex);
        private checkStateTransition(cmd, acceptedStates);
        private handleCharacteristic(ev);
        private flashNextPacket();
    }
    class BLEDevice extends BLERemote {
        device: BluetoothDevice;
        uartService: UARTService;
        hf2Service: HF2Service;
        partialFlashingService: PartialFlashingService;
        private services;
        private pendingResumeLogOnDisconnection;
        servicesVersion: number;
        constructor(device: BluetoothDevice);
        startServices(): void;
        pauseLog(): void;
        resumeLogOnDisconnection(): void;
        private resumeLog();
        readonly isPaired: boolean;
        readonly name: string;
        readonly connected: boolean;
        readonly gatt: BluetoothRemoteGATTServer;
        protected createConnectPromise(): Promise<void>;
        handleServiceAdded(event: Event): void;
        handleServiceRemoved(event: Event): void;
        handleServiceChanged(event: Event): void;
        handleDisconnected(event: Event): void;
        disconnect(): void;
    }
    let bleDevice: BLEDevice;
    function isPaired(): boolean;
    function pairAsync(): Promise<void>;
    function flashAsync(resp: pxtc.CompileResult, d?: pxt.commands.DeployOptions): Promise<void>;
}
declare namespace pxt.usb {
    class USBError extends Error {
        constructor(msg: string);
    }
    const enum VID {
        ATMEL = 1003,
        ARDUINO = 9025,
        ADAFRUIT = 9114,
        NXP = 3368,
    }
    interface USBDeviceFilter {
        vendorId?: number;
        productId?: number;
        classCode?: number;
        subclassCode?: number;
        protocolCode?: number;
        serialNumber?: string;
    }
    let filters: USBDeviceFilter[];
    function setFilters(f: USBDeviceFilter[]): void;
    type USBEndpointType = "bulk" | "interrupt" | "isochronous";
    type USBRequestType = "standard" | "class" | "vendor";
    type USBRecipient = "device" | "interface" | "endpoint" | "other";
    type USBTransferStatus = "ok" | "stall" | "babble";
    type USBDirection = "in" | "out";
    type BufferSource = Uint8Array;
    interface USBConfiguration {
        configurationValue: number;
        configurationName: string;
        interfaces: USBInterface[];
    }
    interface USBInterface {
        interfaceNumber: number;
        alternate: USBAlternateInterface;
        alternates: USBAlternateInterface[];
        claimed: boolean;
    }
    interface USBAlternateInterface {
        alternateSetting: number;
        interfaceClass: number;
        interfaceSubclass: number;
        interfaceProtocol: number;
        interfaceName: string;
        endpoints: USBEndpoint[];
    }
    interface USBEndpoint {
        endpointNumber: number;
        direction: USBDirection;
        type: USBEndpointType;
        packetSize: number;
    }
    interface USBDevice {
        vendorId: number;
        productId: number;
        manufacturerName: string;
        productName: string;
        serialNumber: string;
        deviceClass: number;
        deviceSubclass: number;
        deviceProtocol: number;
        deviceVersionMajor: number;
        deviceVersionMinor: number;
        deviceVersionSubminor: number;
        usbVersionMajor: number;
        usbVersionMinor: number;
        usbVersionSubminor: number;
        configurations: USBConfiguration[];
        opened: boolean;
        open(): Promise<void>;
        close(): Promise<void>;
        selectConfiguration(configurationValue: number): Promise<void>;
        claimInterface(interfaceNumber: number): Promise<void>;
        releaseInterface(interfaceNumber: number): Promise<void>;
        selectAlternateInterface(interfaceNumber: number, alternateSetting: number): Promise<void>;
        controlTransferIn(setup: USBControlTransferParameters, length: number): Promise<USBInTransferResult>;
        controlTransferOut(setup: USBControlTransferParameters, data?: BufferSource): Promise<USBOutTransferResult>;
        clearHalt(direction: USBDirection, endpointNumber: number): Promise<void>;
        transferIn(endpointNumber: number, length: number): Promise<USBInTransferResult>;
        transferOut(endpointNumber: number, data: BufferSource): Promise<USBOutTransferResult>;
        isochronousTransferIn(endpointNumber: number, packetLengths: number[]): Promise<USBIsochronousInTransferResult>;
        isochronousTransferOut(endpointNumber: number, data: BufferSource, packetLengths: number[]): Promise<USBIsochronousOutTransferResult>;
        reset(): Promise<void>;
    }
    interface USBControlTransferParameters {
        requestType: USBRequestType;
        recipient: USBRecipient;
        request: number;
        value: number;
        index: number;
    }
    interface USBInTransferResult {
        data: {
            buffer: ArrayBuffer;
        };
        status: USBTransferStatus;
    }
    interface USBOutTransferResult {
        bytesWritten: number;
        status: USBTransferStatus;
    }
    interface USBIsochronousInTransferPacket {
        data: DataView;
        status: USBTransferStatus;
    }
    interface USBIsochronousInTransferResult {
        data: DataView;
        packets: USBIsochronousInTransferPacket[];
    }
    interface USBIsochronousOutTransferPacket {
        bytesWritten: number;
        status: USBTransferStatus;
    }
    interface USBIsochronousOutTransferResult {
        packets: USBIsochronousOutTransferPacket[];
    }
    function pairAsync(): Promise<void>;
    function isPairedAsync(): Promise<boolean>;
    function mkPacketIOAsync(): Promise<HF2.PacketIO>;
    let isEnabled: boolean;
    function setEnabled(v: boolean): void;
    function isAvailable(): boolean;
}
declare namespace pxt.worker {
    function getWorker(workerFile: string): Iface;
    interface Iface {
        opAsync: (op: string, arg: any) => Promise<any>;
        recvHandler: (v: any) => void;
    }
    function wrap(send: (v: any) => void): Iface;
    function makeWebWorker(workerFile: string): Iface;
    function makeWebSocket(url: string, onOOB?: (v: any) => void): Iface;
}
declare namespace ts.pxtc.assembler {
    let debug: boolean;
    interface InlineError {
        scope: string;
        message: string;
        line: string;
        lineNo: number;
        coremsg: string;
        hints: string;
    }
    interface EmitResult {
        stack: number;
        opcode: number;
        opcode2?: number;
        opcode3?: number;
        numArgs?: number[];
        error?: string;
        errorAt?: string;
        labelName?: string;
    }
    function lf(fmt: string, ...args: any[]): string;
    class Instruction {
        opcode: number;
        mask: number;
        is32bit: boolean;
        name: string;
        args: string[];
        friendlyFmt: string;
        code: string;
        protected ei: AbstractProcessor;
        canBeShared: boolean;
        constructor(ei: AbstractProcessor, format: string, opcode: number, mask: number, is32bit: boolean);
        emit(ln: Line): EmitResult;
        toString(): string;
    }
    class Line {
        bin: File;
        text: string;
        type: string;
        lineNo: number;
        words: string[];
        scope: string;
        location: number;
        instruction: Instruction;
        numArgs: number[];
        opcode: number;
        stack: number;
        isLong: boolean;
        constructor(bin: File, text: string);
        getOpExt(): string;
        getOp(): string;
        update(s: string): void;
    }
    class File {
        constructor(ei: AbstractProcessor);
        baseOffset: number;
        finalEmit: boolean;
        reallyFinalEmit: boolean;
        checkStack: boolean;
        inlineMode: boolean;
        lookupExternalLabel: (name: string) => number;
        normalizeExternalLabel: (n: string) => string;
        ei: AbstractProcessor;
        lines: Line[];
        private currLineNo;
        private realCurrLineNo;
        private currLine;
        private scope;
        private scopeId;
        errors: InlineError[];
        buf: number[];
        private labels;
        private equs;
        private userLabelsCache;
        private stackpointers;
        private stack;
        commPtr: number;
        peepOps: number;
        peepDel: number;
        peepCounts: pxt.Map<number>;
        private stats;
        throwOnError: boolean;
        disablePeepHole: boolean;
        stackAtLabel: pxt.Map<number>;
        private prevLabel;
        protected emitShort(op: number): void;
        protected emitOpCode(op: number): void;
        location(): number;
        pc(): number;
        parseOneInt(s: string): number;
        private looksLikeLabel(name);
        private scopedName(name);
        lookupLabel(name: string, direct?: boolean): number;
        private align(n);
        pushError(msg: string, hints?: string): void;
        private directiveError(msg);
        private emitString(l, utf16?);
        private parseNumber(words);
        private parseNumbers(words);
        private emitSpace(words);
        private emitBytes(words);
        private emitHex(words);
        private handleDirective(l);
        private handleOneInstruction(ln, instr);
        private handleInstruction(ln);
        buildLine(tx: string, lst: Line[]): void;
        private prepLines(text);
        private iterLines();
        getSource(clean: boolean, numStmts?: number, flashSize?: number): string;
        private peepHole();
        private clearLabels();
        private peepPass(reallyFinal);
        getLabels(): pxt.Map<number>;
        emit(text: string): void;
    }
    class VMFile extends File {
        constructor(ei: AbstractProcessor);
    }
    interface Encoder {
        name: string;
        pretty: string;
        encode: (v: number) => number;
        isRegister: boolean;
        isImmediate: boolean;
        isRegList: boolean;
        isLabel: boolean;
        isWordAligned?: boolean;
    }
    abstract class AbstractProcessor {
        encoders: pxt.Map<Encoder>;
        instructions: pxt.Map<Instruction[]>;
        file: File;
        constructor();
        toFnPtr(v: number, baseOff: number, lbl: string): number;
        wordSize(): number;
        computeStackOffset(kind: string, offset: number): number;
        is32bit(i: Instruction): boolean;
        emit32(v1: number, v2: number, actual: string): EmitResult;
        postProcessRelAddress(f: File, v: number): number;
        postProcessAbsAddress(f: File, v: number): number;
        peephole(ln: Line, lnNext: Line, lnNext2: Line): void;
        registerNo(actual: string): number;
        getAddressFromLabel(f: File, i: Instruction, s: string, wordAligned?: boolean): number;
        isPop(opcode: number): boolean;
        isPush(opcode: number): boolean;
        isAddSP(opcode: number): boolean;
        isSubSP(opcode: number): boolean;
        testAssembler(): void;
        expandLdlit(f: File): void;
        protected addEnc: (n: string, p: string, e: (v: number) => number) => Encoder;
        protected inrange: (max: number, v: number, e: number) => number;
        protected inminmax: (min: number, max: number, v: number, e: number) => number;
        protected inseq: (seq: number[], v: number) => number;
        protected inrangeSigned: (max: number, v: number, e: number) => number;
        protected addInst: (name: string, code: number, mask: number, is32Bit?: boolean) => Instruction;
    }
    function emitErr(msg: string, tok: string): {
        stack: number;
        opcode: number;
        error: string;
        errorAt: string;
    };
    function expectError(ei: AbstractProcessor, asm: string): void;
    function tohex(n: number): string;
    function expect(ei: AbstractProcessor, disasm: string): void;
}
declare namespace pxt.Cloud {
    import Util = pxtc.Util;
    let apiRoot: string;
    let accessToken: string;
    let localToken: string;
    let onOffline: () => void;
    function hasAccessToken(): boolean;
    function localRequestAsync(path: string, data?: any): Promise<Util.HttpResponse>;
    function privateRequestAsync(options: Util.HttpRequestOptions): Promise<any>;
    function privateGetTextAsync(path: string, headers?: pxt.Map<string>): Promise<string>;
    function privateGetAsync(path: string, forceLiveEndpoint?: boolean): Promise<any>;
    function downloadTargetConfigAsync(): Promise<pxt.TargetConfig>;
    function downloadScriptFilesAsync(id: string): Promise<any>;
    function markdownAsync(docid: string, locale?: string, live?: boolean): Promise<string>;
    function privateDeleteAsync(path: string): Promise<any>;
    function privatePostAsync(path: string, data: any, forceLiveEndpoint?: boolean): Promise<any>;
    function isLoggedIn(): boolean;
    function isNavigatorOnline(): boolean;
    function isOnline(): boolean;
    function getServiceUrl(): string;
    function getUserId(): string;
    function parseScriptId(uri: string): string;
    interface JsonIdObject {
        kind: string;
        id: string;
    }
    interface JsonPublication extends JsonIdObject {
        time: number;
    }
    interface JsonScript extends JsonPublication {
        shortid?: string;
        name: string;
        description: string;
        editor?: string;
        target?: string;
        targetVersion?: string;
        meta?: JsonScriptMeta;
        thumb?: boolean;
    }
}
declare namespace pxtmelody {
    class MelodyArray {
        private tempo;
        private numCols;
        private numRows;
        private melody;
        private polyphonic;
        constructor(tempo?: number);
        setTempo(tempo: number): void;
        getArray(): boolean[][];
        setArray(array: boolean[][]): void;
        getColor(row: number): number;
        getValue(row: number, col: number): boolean;
        getWidth(): number;
        getHeight(): number;
        updateMelody(row: number, col: number): void;
        getStringRepresentation(): string;
        parseNotes(stringNotes: string): void;
        setPolyphonic(isPolyphonic: boolean): void;
        isPolyphonic(): boolean;
        resetMelody(): void;
    }
    function rowToNote(rowNum: number): string;
    function noteToRow(note: string): number;
    function getColorClass(row: number): string;
}
declare namespace pxtmelody {
    class MelodyGallery {
        protected contentDiv: HTMLDivElement;
        protected containerDiv: HTMLDivElement;
        protected itemBorderColor: string;
        protected itemBackgroundColor: string;
        protected value: string;
        protected visible: boolean;
        protected pending: (res: string) => void;
        protected buttons: HTMLElement[];
        private timeouts;
        private numSamples;
        constructor();
        getElement(): HTMLDivElement;
        getValue(): string;
        show(notes: (res: string) => void): void;
        hide(): void;
        clearDomReferences(): void;
        layout(left: number, top: number, height: number): void;
        protected buildDom(): void;
        protected initStyles(): void;
        protected mkButton(sample: pxtmelody.MelodyInfo, i: number, width: string, height: string): void;
        protected handleSelection(sample: pxtmelody.MelodyInfo): void;
        private playNote(note, colNumber, tempo);
        private getDuration(tempo);
        private previewMelody(sample);
        private togglePlay(sample, i);
        stopMelody(): void;
        private resetPlayIcons();
        private createColorBlock(sample);
    }
}
declare namespace pxtmelody {
    class MelodyInfo {
        name: string;
        notes: string;
        tempo: number;
        constructor(name: string, notes: string, tempo: number);
    }
    const SampleMelodies: MelodyInfo[];
}
declare namespace pxtsprite {
    interface Coord {
        x: number;
        y: number;
    }
    /**
     * 16-color sprite
     */
    class Bitmap {
        width: number;
        height: number;
        x0: number;
        y0: number;
        protected buf: Uint8Array;
        constructor(width: number, height: number, x0?: number, y0?: number);
        set(col: number, row: number, value: number): void;
        get(col: number, row: number): number;
        copy(col?: number, row?: number, width?: number, height?: number): Bitmap;
        apply(change: Bitmap, transparent?: boolean): void;
        equals(other: Bitmap): boolean;
        protected coordToIndex(col: number, row: number): number;
        protected getCore(index: number): number;
        protected setCore(index: number, value: number): void;
    }
    class Bitmask {
        width: number;
        height: number;
        protected mask: Uint8Array;
        constructor(width: number, height: number);
        set(col: number, row: number): void;
        get(col: number, row: number): number;
    }
    function resizeBitmap(img: Bitmap, width: number, height: number): Bitmap;
    function imageLiteralToBitmap(text: string, defaultPattern?: string): Bitmap;
    function bitmapToImageLiteral(bitmap: Bitmap, fileType: pxt.editor.FileType): string;
}
declare namespace pxtsprite {
    import svg = pxt.svgUtil;
    interface ButtonGroup {
        root: svg.Group;
        cx: number;
        cy: number;
    }
    interface ToggleProps {
        baseColor: string;
        borderColor: string;
        backgroundColor: string;
        switchColor: string;
        unselectedTextColor: string;
        selectedTextColor: string;
        leftText: string;
        leftIcon: string;
        rightText: string;
        rightIcon: string;
    }
    class Toggle {
        protected leftElement: svg.Group;
        protected leftText: svg.Text;
        protected rightElement: svg.Group;
        protected rightText: svg.Text;
        protected switch: svg.Rect;
        protected root: svg.Group;
        protected props: ToggleProps;
        protected isLeft: boolean;
        protected changeHandler: (left: boolean) => void;
        constructor(parent: svg.SVG, props: Partial<ToggleProps>);
        protected buildDom(): void;
        toggle(quiet?: boolean): void;
        onStateChange(handler: (left: boolean) => void): void;
        layout(): void;
        translate(x: number, y: number): void;
        height(): number;
        width(): number;
    }
    class Button {
        cx: number;
        cy: number;
        root: svg.Group;
        clickHandler: () => void;
        private _title;
        private _shortcut;
        constructor(root: svg.Group, cx: number, cy: number);
        getElement(): svg.Group;
        addClass(className: string): void;
        removeClass(className: string): void;
        onClick(clickHandler: () => void): void;
        translate(x: number, y: number): void;
        title(text: string): void;
        shortcut(text: string): void;
        private setRootTitle();
        setDisabled(disabled: boolean): void;
        setSelected(selected: boolean): void;
        protected layout(): void;
        protected editClass(className: string, add: boolean): void;
    }
    class TextButton extends Button {
        protected textEl: svg.Text;
        constructor(button: ButtonGroup, text: string, className: string);
        setText(text: string): void;
        getComputedTextLength(): number;
    }
    class StandaloneTextButton extends TextButton {
        readonly height: number;
        protected padding: number;
        constructor(text: string, height: number);
        layout(): void;
        width(): number;
    }
    class CursorButton extends Button {
        constructor(root: svg.Group, cx: number, cy: number, width: number);
    }
    function mkIconButton(icon: string, width: number, height?: number): TextButton;
    function mkXIconButton(icon: string, width: number, height?: number): TextButton;
    function mkTextButton(text: string, width: number, height: number): TextButton;
    class CursorMultiButton {
        root: svg.Group;
        selected: number;
        buttons: Button[];
        indexHandler: (index: number) => void;
        constructor(parent: svg.Group, width: number);
        protected handleClick(index: number): void;
        onSelected(cb: (index: number) => void): void;
    }
    interface UndoRedoHost {
        undo(): void;
        redo(): void;
    }
    class UndoRedoGroup {
        root: svg.Group;
        undo: TextButton;
        redo: TextButton;
        host: UndoRedoHost;
        constructor(parent: svg.Group, host: UndoRedoHost, width: number, height: number);
        translate(x: number, y: number): void;
        updateState(undo: boolean, redo: boolean): void;
    }
    function mkText(text: string): svg.Text;
}
declare namespace pxtsprite {
    class CanvasGrid {
        protected palette: string[];
        state: CanvasState;
        protected lightMode: boolean;
        protected cellWidth: number;
        protected cellHeight: number;
        private gesture;
        private context;
        private fadeAnimation;
        private selectAnimation;
        protected backgroundLayer: HTMLCanvasElement;
        protected paintLayer: HTMLCanvasElement;
        protected overlayLayer: HTMLCanvasElement;
        mouseCol: number;
        mouseRow: number;
        scale: number;
        constructor(palette: string[], state: CanvasState, lightMode: boolean, scale: number);
        readonly image: Bitmap;
        setEyedropperMouse(on: boolean): void;
        repaint(): void;
        applyEdit(edit: Edit, cursorCol: number, cursorRow: number, gestureEnd?: boolean): void;
        drawCursor(edit: Edit, col: number, row: number): void;
        bitmap(): Bitmap;
        outerWidth(): number;
        outerHeight(): number;
        writeColor(col: number, row: number, color: number): void;
        drawColor(col: number, row: number, color: number, context?: CanvasRenderingContext2D, transparency?: boolean): void;
        restore(state: CanvasState, repaint?: boolean): void;
        showResizeOverlay(): void;
        showOverlay(): void;
        hideOverlay(): void;
        resizeGrid(rowLength: number, numCells: number): void;
        setCellDimensions(width: number, height: number): void;
        setGridDimensions(width: number, height?: number, lockAspectRatio?: boolean): void;
        down(handler: (col: number, row: number) => void): void;
        up(handler: (col: number, row: number) => void): void;
        drag(handler: (col: number, row: number) => void): void;
        move(handler: (col: number, row: number) => void): void;
        leave(handler: () => void): void;
        updateBounds(top: number, left: number, width: number, height: number): void;
        render(parent: HTMLDivElement): void;
        removeMouseListeners(): void;
        onEditStart(col: number, row: number, edit: Edit): void;
        onEditEnd(col: number, row: number, edit: Edit): void;
        protected drawImage(image?: Bitmap, context?: CanvasRenderingContext2D, left?: number, top?: number, transparency?: boolean): void;
        protected drawBackground(): void;
        /**
         * This calls getBoundingClientRect() so don't call it in a loop!
         */
        protected clientEventToCell(ev: MouseEvent): number[];
        protected drawFloatingLayer(): void;
        protected drawSelectionAnimation(dashOffset?: number): void;
        private clearContext(context);
        private initDragSurface();
        private bindEvents(surface);
        private upHandler;
        private leaveHandler;
        private moveHandler;
        private hoverHandler;
        private startDrag();
        private endDrag();
        private layoutCanvas(canvas, top, left, width, height);
        private stopSelectAnimation();
    }
    interface ClientCoordinates {
        clientX: number;
        clientY: number;
    }
}
declare namespace pxtsprite {
    class CanvasState {
        image: Bitmap;
        floatingLayer: Bitmap;
        layerOffsetX: number;
        layerOffsetY: number;
        constructor(bitmap?: Bitmap);
        readonly width: number;
        readonly height: number;
        copy(): CanvasState;
        equals(other: CanvasState): boolean;
        mergeFloatingLayer(): void;
        copyToLayer(left: number, top: number, width: number, height: number, cut?: boolean): void;
        inFloatingLayer(col: number, row: number): boolean;
    }
}
declare namespace pxtsprite {
    interface GalleryItem {
        qName: string;
        src: string;
        alt: string;
        tags: string[];
    }
    class Gallery {
        protected info: pxtc.BlocksInfo;
        protected contentDiv: HTMLDivElement;
        protected containerDiv: HTMLDivElement;
        protected galleryItems: GalleryItem[];
        protected itemBorderColor: string;
        protected itemBackgroundColor: string;
        protected visible: boolean;
        protected pending: (res: Bitmap, err?: string) => void;
        constructor(info: pxtc.BlocksInfo);
        getElement(): HTMLDivElement;
        show(cb: (res: Bitmap, err?: string) => void): void;
        hide(): void;
        layout(left: number, top: number, height: number): void;
        setFilter(filter: string): void;
        protected applyFilter(target: GalleryItem[], tags: string[]): GalleryItem[];
        protected buildDom(): void;
        protected initStyles(): void;
        protected mkButton(src: string, alt: string, value: string, i: number, width: string): void;
        protected resolve(bitmap: Bitmap): void;
        protected reject(reason: string): void;
        protected handleSelection(value: string): void;
        protected getBitmap(qName: string): Bitmap;
        protected getGalleryItems(qName: string): GalleryItem[];
    }
}
declare namespace pxtsprite {
    import svg = pxt.svgUtil;
    interface SpriteHeaderHost {
        showGallery(): void;
        hideGallery(): void;
    }
    class SpriteHeader {
        protected host: SpriteHeaderHost;
        div: HTMLDivElement;
        root: svg.SVG;
        toggle: Toggle;
        undoButton: Button;
        redoButton: Button;
        constructor(host: SpriteHeaderHost);
        getElement(): HTMLDivElement;
        layout(): void;
    }
}
declare function makeCloseButton(): HTMLDivElement;
declare namespace pxtsprite {
    import svg = pxt.svgUtil;
    interface ReporterHost extends UndoRedoHost {
        resize(width: number, height: number): void;
        closeEditor(): void;
    }
    class ReporterBar {
        protected host: ReporterHost;
        protected height: number;
        root: svg.Group;
        cursorText: svg.Text;
        sizeButton: TextButton;
        doneButton: StandaloneTextButton;
        undoRedo: UndoRedoGroup;
        protected sizePresets: [number, number][];
        protected sizeIndex: number;
        constructor(parent: svg.Group, host: ReporterHost, height: number);
        updateDimensions(width: number, height: number): void;
        hideCursor(): void;
        updateCursor(col: number, row: number): void;
        updateUndoRedo(undo: boolean, redo: boolean): void;
        layout(top: number, left: number, width: number): void;
        setSizePresets(presets: [number, number][], currentWidth: number, currentHeight: number): void;
        protected nextSize(): void;
    }
}
declare namespace pxtsprite {
    import svg = pxt.svgUtil;
    interface SideBarHost {
        setActiveTool(tool: PaintTool): void;
        setActiveColor(color: number): void;
        setToolWidth(width: number): void;
        setIconsToDefault(): void;
    }
    class SideBar {
        root: svg.Group;
        host: SideBarHost;
        palette: string[];
        protected colorSwatches: svg.Rect[];
        protected pencilTool: Button;
        protected eraseTool: Button;
        protected rectangleTool: Button;
        protected fillTool: Button;
        protected marqueeTool: Button;
        protected sizeGroup: svg.Group;
        protected buttonGroup: svg.Group;
        protected paletteGroup: svg.Group;
        protected selectedTool: Button;
        protected selectedSwatch: svg.Rect;
        protected colorPreview: svg.Rect;
        constructor(palette: string[], host: SideBarHost, parent: svg.Group);
        setTool(tool: PaintTool): void;
        setColor(color: number): void;
        setCursorSize(size: number): void;
        setWidth(width: number): void;
        translate(left: number, top: number): void;
        protected initSizes(): void;
        protected initTools(): void;
        protected initPalette(): void;
        protected initButton(title: string, icon: string, tool: PaintTool, xicon?: boolean): TextButton;
        getButtonForTool(tool: PaintTool): Button;
    }
}
declare namespace pxtsprite {
    enum PaintTool {
        Normal = 0,
        Rectangle = 1,
        Outline = 2,
        Circle = 3,
        Fill = 4,
        Line = 5,
        Erase = 6,
        Marquee = 7,
    }
    function getPaintToolShortcut(tool: PaintTool): "s" | "c" | "r" | "l" | "b" | "e" | "p";
    class Cursor {
        readonly width: number;
        readonly height: number;
        offsetX: number;
        offsetY: number;
        constructor(width: number, height: number);
    }
    abstract class Edit {
        protected canvasWidth: number;
        protected canvasHeight: number;
        color: number;
        protected toolWidth: number;
        protected startCol: number;
        protected startRow: number;
        isStarted: boolean;
        showPreview: boolean;
        constructor(canvasWidth: number, canvasHeight: number, color: number, toolWidth: number);
        abstract update(col: number, row: number): void;
        protected abstract doEditCore(state: CanvasState): void;
        doEdit(state: CanvasState): void;
        start(cursorCol: number, cursorRow: number, state: CanvasState): void;
        end(col: number, row: number, state: CanvasState): void;
        getCursor(): Cursor;
        drawCursor(col: number, row: number, draw: (c: number, r: number) => void): void;
    }
    abstract class SelectionEdit extends Edit {
        protected endCol: number;
        protected endRow: number;
        protected isDragged: boolean;
        update(col: number, row: number): void;
        protected topLeft(): Coord;
        protected bottomRight(): Coord;
    }
    /**
     * Regular old drawing tool
     */
    class PaintEdit extends Edit {
        protected mask: Bitmask;
        showPreview: boolean;
        constructor(canvasWidth: number, canvasHeight: number, color: number, toolWidth: number);
        update(col: number, row: number): void;
        protected interpolate(x0: number, y0: number, x1: number, y1: number): void;
        protected doEditCore(state: CanvasState): void;
        drawCursor(col: number, row: number, draw: (c: number, r: number) => void): void;
        protected drawCore(col: number, row: number, setPixel: (col: number, row: number) => void): void;
    }
    /**
     * Tool for drawing filled rectangles
     */
    class RectangleEdit extends SelectionEdit {
        showPreview: boolean;
        protected doEditCore(state: CanvasState): void;
    }
    /**
     * Tool for drawing empty rectangles
     */
    class OutlineEdit extends SelectionEdit {
        showPreview: boolean;
        protected doEditCore(state: CanvasState): void;
        protected drawRectangle(state: CanvasState, tl: Coord, br: Coord): void;
        drawCursor(col: number, row: number, draw: (c: number, r: number) => void): void;
        protected drawCore(col: number, row: number, setPixel: (col: number, row: number) => void): void;
    }
    /**
     * Tool for drawing straight lines
     */
    class LineEdit extends SelectionEdit {
        showPreview: boolean;
        protected doEditCore(state: CanvasState): void;
        protected bresenham(x0: number, y0: number, x1: number, y1: number, state: CanvasState): void;
        drawCursor(col: number, row: number, draw: (c: number, r: number) => void): void;
        protected drawCore(col: number, row: number, draw: (c: number, r: number) => void): void;
    }
    /**
     * Tool for circular outlines
     */
    class CircleEdit extends SelectionEdit {
        showPreview: boolean;
        protected doEditCore(state: CanvasState): void;
        midpoint(cx: number, cy: number, radius: number, state: CanvasState): void;
        getCursor(): Cursor;
    }
    class FillEdit extends Edit {
        protected col: number;
        protected row: number;
        showPreview: boolean;
        start(col: number, row: number, state: CanvasState): void;
        update(col: number, row: number): void;
        protected doEditCore(state: CanvasState): void;
        getCursor(): Cursor;
    }
    class MarqueeEdit extends SelectionEdit {
        protected isMove: boolean;
        showPreview: boolean;
        start(cursorCol: number, cursorRow: number, state: CanvasState): void;
        end(cursorCol: number, cursorRow: number, state: CanvasState): void;
        protected doEditCore(state: CanvasState): void;
        getCursor(): Cursor;
    }
}
declare namespace pxtsprite {
    const TOTAL_HEIGHT = 500;
    const HEADER_HEIGHT = 50;
    class SpriteEditor implements SideBarHost, SpriteHeaderHost {
        protected lightMode: boolean;
        scale: number;
        private group;
        private root;
        private paintSurface;
        private sidebar;
        private header;
        private bottomBar;
        private gallery;
        private state;
        private cachedState;
        private edit;
        private activeTool;
        private toolWidth;
        color: number;
        private cursorCol;
        private cursorRow;
        private undoStack;
        private redoStack;
        private columns;
        private rows;
        private colors;
        private shiftDown;
        private altDown;
        private mouseDown;
        private closeHandler;
        constructor(bitmap: Bitmap, blocksInfo: pxtc.BlocksInfo, lightMode?: boolean, scale?: number);
        setSidebarColor(color: number): void;
        setCell(col: number, row: number, color: number, commit: boolean): void;
        render(el: HTMLDivElement): void;
        layout(): void;
        rePaint(): void;
        setActiveColor(color: number, setPalette?: boolean): void;
        setActiveTool(tool: PaintTool): void;
        setToolWidth(width: number): void;
        initializeUndoRedo(undoStack: CanvasState[], redoStack: CanvasState[]): void;
        getUndoStack(): CanvasState[];
        getRedoStack(): CanvasState[];
        undo(): void;
        redo(): void;
        resize(width: number, height: number): void;
        setSizePresets(presets: [number, number][]): void;
        setGalleryFilter(filter: string): void;
        canvasWidth(): number;
        canvasHeight(): number;
        outerWidth(): number;
        outerHeight(): number;
        bitmap(): CanvasState;
        showGallery(): void;
        hideGallery(): void;
        closeEditor(): void;
        onClose(handler: () => void): void;
        switchIconTo(tool: PaintTool): void;
        setIconsToDefault(): void;
        private keyDown;
        private keyUp;
        private undoRedoEvent;
        addKeyListeners(): void;
        removeKeyListeners(): void;
        private afterResize(showOverlay);
        private drawCursor(col, row);
        private paintEdit(edit, col, row, gestureEnd?);
        private commit();
        private pushState(undo);
        private discardEdit();
        private updateEdit();
        private restore(state);
        private updateUndoRedo();
        private paintCell(col, row, color);
        private newEdit();
        private shiftAction();
        private clearShiftAction();
        private debug(msg);
        private createDefs();
    }
}
