/// <reference path="../../localtypings/mscc.d.ts" />
/// <reference path="../../pxtwinrt/winrtrefs.d.ts" />
declare var process: any;
declare namespace pxt {
    function initAnalyticsAsync(): void;
    function aiTrackEvent(id: string, data?: any, measures?: any): void;
    function aiTrackException(err: any, kind?: string, props?: any): void;
    function initializeAppInsightsInternal(includeCookie?: boolean): void;
}
