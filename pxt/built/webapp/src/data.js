"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var core = require("./core");
var Cloud = pxt.Cloud;
var Util = pxt.Util;
var FetchStatus;
(function (FetchStatus) {
    FetchStatus[FetchStatus["Pending"] = 0] = "Pending";
    FetchStatus[FetchStatus["Complete"] = 1] = "Complete";
    FetchStatus[FetchStatus["Error"] = 2] = "Error";
    FetchStatus[FetchStatus["Offline"] = 3] = "Offline";
})(FetchStatus = exports.FetchStatus || (exports.FetchStatus = {}));
;
var virtualApis = {};
mountVirtualApi("cloud", {
    getAsync: function (p) { return Cloud.privateGetAsync(stripProtocol(p)).catch(core.handleNetworkError); },
    expirationTime: function (p) { return 60 * 1000; },
    isOffline: function () { return !Cloud.isOnline(); },
});
mountVirtualApi("cloud-search", {
    getAsync: function (p) { return Cloud.privateGetAsync(stripProtocol(p)).catch(function (e) {
        core.handleNetworkError(e, [404]);
        return { statusCode: 404, headers: {}, json: {} };
    }); },
    expirationTime: function (p) { return 60 * 1000; },
    isOffline: function () { return !Cloud.isOnline(); },
});
mountVirtualApi("gallery", {
    getAsync: function (p) { return pxt.gallery.loadGalleryAsync(stripProtocol(decodeURIComponent(p))).catch(function (e) {
        return Promise.resolve(e);
    }); },
    expirationTime: function (p) { return 3600 * 1000; }
});
mountVirtualApi("td-cloud", {
    getAsync: function (p) {
        return Util.httpGetJsonAsync("https://www.touchdevelop.com/api/" + stripProtocol(p))
            .catch(core.handleNetworkError);
    },
    expirationTime: function (p) { return 60 * 1000; },
});
mountVirtualApi("gh-search", {
    getAsync: function (query) { return pxt.targetConfigAsync()
        .then(function (config) { return pxt.github.searchAsync(stripProtocol(query), config ? config.packages : undefined); })
        .catch(core.handleNetworkError); },
    expirationTime: function (p) { return 60 * 1000; },
    isOffline: function () { return !Cloud.isOnline(); },
});
mountVirtualApi("gh-pkgcfg", {
    getAsync: function (query) {
        return pxt.github.pkgConfigAsync(stripProtocol(query)).catch(core.handleNetworkError);
    },
    expirationTime: function (p) { return 60 * 1000; },
    isOffline: function () { return !Cloud.isOnline(); },
});
var targetConfigPromise = undefined;
mountVirtualApi("target-config", {
    getAsync: function (query) {
        if (!targetConfigPromise)
            targetConfigPromise = pxt.targetConfigAsync()
                .then(function (js) {
                if (js) {
                    pxt.storage.setLocal("targetconfig", JSON.stringify(js));
                    invalidate("target-config");
                    invalidate("gh-search");
                    invalidate("gh-pkgcfg");
                }
                return js;
            })
                .catch(core.handleNetworkError);
        // return cached value or try again
        var cfg = JSON.parse(pxt.storage.getLocal("targetconfig") || "null");
        if (cfg)
            return Promise.resolve(cfg);
        return targetConfigPromise;
    },
    expirationTime: function (p) { return 24 * 3600 * 1000; },
    isOffline: function () { return !Cloud.isOnline(); }
});
var cachedData = {};
function subscribe(component, path) {
    var e = lookup(path);
    var lst = e.components;
    if (lst.indexOf(component) < 0) {
        lst.push(component);
        component.subscriptions.push(e);
    }
}
function unsubscribe(component) {
    var lst = component.subscriptions;
    if (lst.length == 0)
        return;
    component.subscriptions = [];
    lst.forEach(function (ce) {
        var idx = ce.components.indexOf(component);
        if (idx >= 0)
            ce.components.splice(idx, 1);
    });
}
function expired(ce) {
    if (!ce.api.expirationTime)
        return ce.data != null;
    return ce.data == null || (Date.now() - ce.lastRefresh) > ce.api.expirationTime(ce.path);
}
function shouldCache(ce) {
    if (!ce.data || ce.data instanceof Error)
        return false;
    return /^cloud:(me\/settings|ptr-pkg-)/.test(ce.path);
}
function clearCache() {
    cachedData = {};
    saveCache();
}
exports.clearCache = clearCache;
function loadCache() {
    JSON.parse(pxt.storage.getLocal("apiCache2") || "[]").forEach(function (e) {
        var ce = lookup(e.path);
        ce.data = e.data;
    });
}
function saveCache() {
    var obj = Util.values(cachedData).filter(function (e) { return shouldCache(e); }).map(function (e) {
        return {
            path: e.path,
            data: e.data
        };
    });
    pxt.storage.setLocal("apiCache2", JSON.stringify(obj));
}
function matches(ce, prefix) {
    return ce.path.slice(0, prefix.length) == prefix;
}
function notify(ce) {
    if (shouldCache(ce))
        saveCache();
    var lst = ce.callbackOnce;
    if (lst.length > 0) {
        ce.callbackOnce = [];
        Util.nextTick(function () { return lst.forEach(function (f) { return f(); }); });
    }
    if (ce.components.length > 0)
        ce.components.forEach(function (c) { return Util.nextTick(function () { return c.forceUpdate(); }); });
}
function getVirtualApi(path) {
    var m = /^([\w\-]+):/.exec(path);
    if (!m || !virtualApis[m[1]])
        Util.oops("bad data protocol: " + path);
    return virtualApis[m[1]];
}
function queue(ce) {
    if (ce.queued)
        return;
    if (ce.api.isOffline && ce.api.isOffline())
        return;
    ce.queued = true;
    var final = function (res) {
        ce.data = res;
        ce.lastRefresh = Date.now();
        ce.queued = false;
        notify(ce);
    };
    if (ce.api.isSync)
        final(ce.api.getSync(ce.path));
    else
        ce.api.getAsync(ce.path).done(final);
}
function lookup(path) {
    if (!cachedData.hasOwnProperty(path))
        cachedData[path] = {
            path: path,
            data: null,
            lastRefresh: 0,
            queued: false,
            callbackOnce: [],
            components: [],
            api: getVirtualApi(path)
        };
    return cachedData[path];
}
function getCached(component, path) {
    subscribe(component, path);
    var r = lookup(path);
    if (r.api.isSync)
        return {
            data: r.api.getSync(r.path),
            status: FetchStatus.Complete
        };
    var fetchRes = {
        data: r.data,
        status: FetchStatus.Complete
    };
    if (expired(r) || r.data instanceof Error) {
        fetchRes.status = r.data instanceof Error ? FetchStatus.Error : FetchStatus.Pending;
        if (r.api.isOffline && r.api.isOffline()) {
            // The request will not be requeued so we don't want to show it as pending
            fetchRes.status = FetchStatus.Offline;
        }
        else {
            queue(r);
        }
    }
    return fetchRes;
}
function mountVirtualApi(protocol, handler) {
    Util.assert(!virtualApis[protocol]);
    Util.assert(!!handler.getSync || !!handler.getAsync);
    Util.assert(!!handler.getSync != !!handler.getAsync);
    handler.isSync = !!handler.getSync;
    virtualApis[protocol] = handler;
}
exports.mountVirtualApi = mountVirtualApi;
function stripProtocol(path) {
    var m = /^([\w\-]+):(.*)/.exec(path);
    if (m)
        return m[2];
    else
        Util.oops("protocol missing in: " + path);
    return path;
}
exports.stripProtocol = stripProtocol;
function invalidate(prefix) {
    Util.values(cachedData).forEach(function (ce) {
        if (matches(ce, prefix)) {
            ce.lastRefresh = 0;
            if (ce.components.length > 0)
                queue(lookup(ce.path));
            if (ce.api.onInvalidated)
                ce.api.onInvalidated();
        }
    });
}
exports.invalidate = invalidate;
function getAsync(path) {
    var ce = lookup(path);
    if (ce.api.isSync)
        return Promise.resolve(ce.api.getSync(ce.path));
    if (!Cloud.isOnline() || !expired(ce))
        return Promise.resolve(ce.data);
    return new Promise(function (resolve, reject) {
        ce.callbackOnce.push(function () {
            resolve(ce.data);
        });
        queue(ce);
    });
}
exports.getAsync = getAsync;
var Component = /** @class */ (function (_super) {
    __extends(Component, _super);
    function Component(props) {
        var _this = _super.call(this, props) || this;
        _this.subscriptions = [];
        _this.renderCoreOk = false;
        _this.state = {};
        return _this;
    }
    Component.prototype.getData = function (path) {
        var fetchResult = this.getDataWithStatus(path);
        return fetchResult.data;
    };
    /**
     * Like getData, but the data is wrapped in a result object that indicates the status of the fetch operation
     */
    Component.prototype.getDataWithStatus = function (path) {
        if (!this.renderCoreOk)
            Util.oops("Override renderCore() not render()");
        return getCached(this, path);
    };
    Component.prototype.componentWillUnmount = function () {
        unsubscribe(this);
    };
    Component.prototype.child = function (selector) {
        return core.findChild(this, selector);
    };
    Component.prototype.renderCore = function () {
        return null;
    };
    Component.prototype.render = function () {
        unsubscribe(this);
        this.renderCoreOk = true;
        return this.renderCore();
    };
    Component.prototype.setStateAsync = function (state) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.setState(state, function () {
                resolve();
            });
        });
    };
    return Component;
}(React.Component));
exports.Component = Component;
var PureComponent = /** @class */ (function (_super) {
    __extends(PureComponent, _super);
    function PureComponent(props) {
        var _this = _super.call(this, props) || this;
        _this.renderCoreOk = false;
        _this.state = {};
        return _this;
    }
    PureComponent.prototype.child = function (selector) {
        return core.findChild(this, selector);
    };
    PureComponent.prototype.renderCore = function () {
        return null;
    };
    PureComponent.prototype.render = function () {
        this.renderCoreOk = true;
        return this.renderCore();
    };
    return PureComponent;
}(React.PureComponent));
exports.PureComponent = PureComponent;
loadCache();
