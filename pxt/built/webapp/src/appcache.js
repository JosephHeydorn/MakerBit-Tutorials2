"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("./core");
function init(updated) {
    var appCache = window.applicationCache;
    if (!appCache)
        return;
    function scheduleUpdate() {
        console.log("app cache update ready (" + appCache.status + ")");
        if (appCache.status !== window.applicationCache.UPDATEREADY)
            return;
        core.infoNotification(lf("Update download complete. Reloading... "));
        setTimeout(function () {
            pxt.tickEvent('appcache.updated');
            updated();
        }, 3000);
    }
    // disable in options
    if (pxt.appTarget.appTheme && pxt.appTarget.appTheme.noReloadOnUpdate)
        return;
    // already dowloaded
    if (appCache.status === window.applicationCache.UPDATEREADY) {
        scheduleUpdate();
    }
    else {
        // waiting for event
        appCache.addEventListener('updateready', function () {
            scheduleUpdate();
        }, false);
    }
}
exports.init = init;
