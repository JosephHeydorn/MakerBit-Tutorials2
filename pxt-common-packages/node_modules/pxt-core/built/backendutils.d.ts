/// <reference path="../localtypings/pxtarget.d.ts" />
/// <reference types="marked" />
declare namespace pxt {
    interface TelemetryEventOptions {
        interactiveConsent: boolean;
    }
    /**
     * Track an event.
     */
    let tickEvent: (id: string, data?: Map<string | number>, opts?: TelemetryEventOptions) => void;
}
declare namespace pxt {
    let appTarget: TargetBundle;
    let appTargetVariant: string;
    let hwVariant: string;
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
