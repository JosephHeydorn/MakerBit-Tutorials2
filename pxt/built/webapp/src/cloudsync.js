"use strict";
// TODO cloud save indication in the editor somewhere
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("./core");
var pkg = require("./package");
var ws = require("./workspace");
var data = require("./data");
var dialogs = require("./dialogs");
var U = pxt.Util;
var lf = U.lf;
var allProviders;
var provider;
var status = "";
var HEADER_JSON = ".cloudheader.json";
function mkSyncError(msg) {
    var e = new Error(msg);
    e.isUserError = true;
    e.isSyncError = true;
    return e;
}
var ProviderBase = /** @class */ (function () {
    function ProviderBase(name, friendlyName, urlRoot) {
        this.name = name;
        this.friendlyName = friendlyName;
        this.urlRoot = urlRoot;
    }
    ProviderBase.prototype.syncError = function (msg) {
        throw mkSyncError(msg);
    };
    ProviderBase.prototype.reqAsync = function (opts) {
        var tok = pxt.storage.getLocal(this.name + "token");
        if (!tok) {
            throw this.pleaseLogin();
        }
        if (!opts.headers) {
            opts.headers = {};
        }
        opts.headers["Authorization"] = "Bearer " + tok;
        if (!/^https:\/\//.test(opts.url)) {
            opts.url = this.urlRoot + opts.url;
        }
        opts.allowHttpErrors = true;
        return U.requestAsync(opts);
        // TODO detect expired token here
    };
    ProviderBase.prototype.getJsonAsync = function (path) {
        var _this = this;
        return this.reqAsync({ url: path })
            .then(function (resp) {
            if (resp.statusCode < 300)
                return resp.json;
            throw _this.syncError(lf("Invalid {0} response {1} at {2}", _this.friendlyName, resp.statusCode, path));
        });
    };
    ProviderBase.prototype.fileSuffix = function () {
        return ".mkcd-" + pxt.appTarget.id;
    };
    ProviderBase.prototype.parseTime = function (s) {
        return Math.round(new Date(s).getTime() / 1000);
    };
    ProviderBase.prototype.pleaseLogin = function () {
        var msg = lf("Please log in to {0}", this.friendlyName);
        core.infoNotification(msg);
        var e = mkSyncError(msg);
        e.isLoginError = true;
        return e;
    };
    ProviderBase.prototype.loginCheck = function () {
        var tok = pxt.storage.getLocal(this.name + "token");
        if (!tok)
            return;
        var exp = parseInt(pxt.storage.getLocal(this.name + "tokenExp") || "0");
        if (exp && exp < U.nowSeconds()) {
            // if we already attempted autologin (and failed), don't do it again
            if (pxt.storage.getLocal(this.name + "AutoLogin")) {
                this.pleaseLogin();
                return;
            }
            pxt.storage.setLocal(this.name + "AutoLogin", "yes");
            this.login();
        }
        else {
            setProvider(this);
        }
    };
    ProviderBase.prototype.login = function () {
        U.userError("Not implemented");
    };
    ProviderBase.prototype.loginInner = function () {
        var ns = this.name;
        core.showLoading(ns + "login", lf("Logging you in to {0}...", this.friendlyName));
        var state = ts.pxtc.Util.guidGen();
        pxt.storage.setLocal("oauthState", state);
        pxt.storage.setLocal("oauthType", ns);
        pxt.storage.setLocal("oauthRedirect", window.location.href);
        var redir = window.location.protocol + "//" + window.location.host + "/oauth-redirect";
        var r = {
            client_id: pxt.appTarget.cloud.cloudProviders[this.name]["client_id"],
            response_type: "token",
            state: state,
            redirect_uri: redir,
            scope: ""
        };
        return r;
    };
    ProviderBase.prototype.loginCallback = function (qs) {
        var ns = this.name;
        pxt.storage.removeLocal(ns + "AutoLogin");
        pxt.storage.setLocal(ns + "token", qs["access_token"]);
        var expIn = parseInt(qs["expires_in"]);
        if (expIn) {
            var time = Math.round(Date.now() / 1000 + (0.75 * expIn));
            pxt.storage.setLocal(ns + "tokenExp", time + "");
        }
        else {
            pxt.storage.removeLocal(ns + "tokenExp");
        }
        // re-compute
        pxt.storage.removeLocal("cloudName");
    };
    return ProviderBase;
}());
exports.ProviderBase = ProviderBase;
function reconstructMeta(files) {
    var cfg = JSON.parse(files[pxt.CONFIG_NAME]);
    var r = {
        meta: {
            cloudId: pxt.CLOUD_ID + pxt.appTarget.id,
            editor: pxt.BLOCKS_PROJECT_NAME,
            name: cfg.name,
        },
        source: JSON.stringify(files)
    };
    var hd = JSON.parse(files[HEADER_JSON] || "{}");
    if (hd) {
        if (hd.editor)
            r.meta.editor = hd.editor;
        if (hd.target)
            r.meta.cloudId = pxt.CLOUD_ID + hd.target;
        if (hd.targetVersion)
            r.meta.targetVersions = { target: hd.targetVersion };
    }
    return r;
}
exports.reconstructMeta = reconstructMeta;
// these imports have to be after the ProviderBase class definition; otherwise we get crash on startup
var onedrive = require("./onedrive");
var googledrive = require("./googledrive");
function providers() {
    if (!allProviders) {
        allProviders = {};
        for (var _i = 0, _a = [new onedrive.Provider(), new googledrive.Provider()]; _i < _a.length; _i++) {
            var impl = _a[_i];
            allProviders[impl.name] = impl;
        }
    }
    var cl = pxt.appTarget.cloud;
    if (!cl || !cl.cloudProviders)
        return [];
    return Object.keys(cl.cloudProviders).map(function (id) { return allProviders[id]; });
}
exports.providers = providers;
// this is generally called by the provier's loginCheck() function
function setProvider(impl) {
    provider = impl;
}
exports.setProvider = setProvider;
function syncOneUpAsync(h) {
    return __awaiter(this, void 0, void 0, function () {
        var saveId, text, firstTime, info, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    saveId = {};
                    h.saveId = saveId;
                    return [4 /*yield*/, ws.getTextAsync(h.id)];
                case 1:
                    text = _a.sent();
                    text = U.flatClone(text);
                    text[HEADER_JSON] = JSON.stringify(h, null, 4);
                    firstTime = h.blobId == null;
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, provider.uploadAsync(h.blobId, h.blobVersion, text)];
                case 3:
                    info = _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    e_1 = _a.sent();
                    if (e_1.statusCode == 409) {
                        core.warningNotification(lf("Conflict saving {0}; please do a full cloud sync", h.name));
                        return [2 /*return*/];
                    }
                    else {
                        throw e_1;
                    }
                    return [3 /*break*/, 5];
                case 5:
                    pxt.debug("synced up " + info.id);
                    if (firstTime) {
                        h.blobId = info.id;
                    }
                    else {
                        U.assert(h.blobId == info.id);
                    }
                    h.blobVersion = info.version;
                    if (h.saveId === saveId)
                        h.blobCurrent = true;
                    return [4 /*yield*/, ws.saveAsync(h, null, true)];
                case 6:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function resetAsync() {
    return Promise.resolve();
}
exports.resetAsync = resetAsync;
function updateNameAsync() {
    var name = pxt.storage.getLocal("cloudName");
    if (name || !provider)
        return Promise.resolve();
    return provider.getUserInfoAsync()
        .then(function (info) {
        var id = provider.name + ":" + info.id;
        var currId = pxt.storage.getLocal("cloudId");
        if (currId && currId != id) {
            core.confirmAsync({
                header: lf("Sign in mismatch"),
                body: lf("You have previously signed in with a different account. You can sign out now, which will locally clear all projects, or you can try to sign in again."),
                agreeClass: "red",
                agreeIcon: "sign out",
                agreeLbl: lf("Sign out"),
                disagreeLbl: lf("Sign in again"),
                disagreeIcon: "user circle"
            }).then(function (res) {
                if (res) {
                    ws.resetAsync()
                        .then(function () {
                        // FIXME: should call ProjectView.reloadEditor()
                        location.hash = "#reload";
                        location.reload();
                    });
                }
                else {
                    dialogs.showCloudSignInDialog();
                }
            });
            // never return
            return new Promise(function () { });
        }
        else {
            pxt.storage.setLocal("cloudId", id);
        }
        pxt.storage.setLocal("cloudName", info.name);
        data.invalidate("sync:username");
        return null;
    });
}
function syncAsync() {
    var numUp = 0;
    var numDown = 0;
    var blobConatiner = "";
    var updated = {};
    if (!provider)
        return Promise.resolve(undefined);
    function uninstallAsync(h) {
        pxt.debug("uninstall local " + h.blobId);
        h.isDeleted = true;
        h.blobVersion = "DELETED";
        return ws.saveAsync(h, null, true);
    }
    function resolveConflictAsync(header, cloudHeader) {
        return __awaiter(this, void 0, void 0, function () {
            var text, newHd;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, ws.getTextAsync(header.id)];
                    case 1:
                        text = _a.sent();
                        return [4 /*yield*/, ws.duplicateAsync(header, text, true)];
                    case 2:
                        newHd = _a.sent();
                        header.blobId = null;
                        header.blobVersion = null;
                        header.blobCurrent = false;
                        return [4 /*yield*/, ws.saveAsync(header, text)
                            // get the cloud version
                        ];
                    case 3:
                        _a.sent();
                        // get the cloud version
                        return [4 /*yield*/, syncDownAsync(newHd, cloudHeader)
                            // TODO move the user out of editor, or otherwise force reload
                        ];
                    case 4:
                        // get the cloud version
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
    function syncDownAsync(header0, cloudHeader) {
        var header = header0;
        if (!header) {
            header = {
                blobId: cloudHeader.id
            };
        }
        numDown++;
        U.assert(header.blobId == cloudHeader.id);
        var blobId = cloudHeader.version;
        pxt.debug("sync down " + header.blobId + " - " + blobId);
        return provider.downloadAsync(cloudHeader.id)
            .catch(core.handleNetworkError)
            .then(function (resp) {
            U.assert(resp.id == header.blobId);
            var files = resp.content;
            var hd = JSON.parse(files[HEADER_JSON] || "{}");
            delete files[HEADER_JSON];
            header.blobCurrent = true;
            header.blobVersion = resp.version;
            // TODO copy anything else from the cloud?
            header.name = hd.name || header.name || "???";
            header.id = header.id || hd.id || U.guidGen();
            header.pubId = hd.pubId;
            header.pubCurrent = hd.pubCurrent;
            delete header.isDeleted;
            header.saveId = null;
            header.target = pxt.appTarget.id;
            header.recentUse = hd.recentUse;
            header.modificationTime = hd.modificationTime;
            if (!header.modificationTime)
                header.modificationTime = resp.updatedAt || U.nowSeconds();
            if (!header.recentUse)
                header.recentUse = header.modificationTime;
            updated[header.blobId] = 1;
            if (!header0)
                return ws.importAsync(header, files, true);
            else
                return ws.saveAsync(header, files, true);
        })
            .then(function () { return progress(--numDown); });
    }
    function progressMsg(m) {
        core.infoNotification(m);
    }
    function progress(dummy) {
        var msg = "";
        if (numDown == 0 && numUp == 0)
            msg = lf("All synced");
        else {
            msg = lf("Syncing") + " (";
            if (numDown)
                msg += lf("{0} down", numDown);
            if (numUp)
                msg += (numDown ? ", " : "") + lf("{0} up", numUp);
            msg += ")";
        }
        progressMsg(msg);
    }
    function syncUpAsync(h) {
        numUp++;
        return syncOneUpAsync(h)
            .then(function () { return progress(--numUp); });
    }
    function syncDeleteAsync(h) {
        return provider.deleteAsync(h.blobId)
            .then(function () { return uninstallAsync(h); });
    }
    setStatus("syncing");
    return updateNameAsync()
        .then(function () { return provider.listAsync(); })
        .then(function (entries) {
        var allScripts = ws.getHeaders();
        var cloudHeaders = U.toDictionary(entries, function (e) { return e.id; });
        var existingHeaders = U.toDictionary(allScripts, function (h) { return h.blobId; });
        var waitFor = allScripts.map(function (hd) {
            if (cloudHeaders.hasOwnProperty(hd.blobId)) {
                var chd = cloudHeaders[hd.blobId];
                if (hd.isDeleted)
                    return syncDeleteAsync(hd);
                if (chd.version == hd.blobVersion) {
                    if (hd.blobCurrent) {
                        // nothing to do
                        return Promise.resolve();
                    }
                    else {
                        return syncUpAsync(hd);
                    }
                }
                else {
                    if (hd.blobCurrent) {
                        return syncDownAsync(hd, chd);
                    }
                    else {
                        return resolveConflictAsync(hd, chd);
                    }
                }
            }
            else {
                if (hd.blobVersion)
                    // this has been pushed once to the cloud - uninstall wins
                    return uninstallAsync(hd);
                else
                    // never pushed before
                    return syncUpAsync(hd);
            }
        });
        waitFor = waitFor.concat(entries.filter(function (e) { return !existingHeaders[e.id]; }).map(function (e) { return syncDownAsync(null, e); }));
        progress(0);
        return Promise.all(waitFor);
    })
        .then(function () {
        setStatus("");
        progressMsg(lf("Syncing done"));
    })
        .then(function () { return pkg.notifySyncDone(updated); })
        .catch(function (e) {
        if (e.isSyncError) {
            // for login errors there was already a notification
            if (!e.isLoginError)
                core.warningNotification(e.message);
            return;
        }
        else {
            core.handleNetworkError(e);
        }
    });
}
exports.syncAsync = syncAsync;
function loginCheck() {
    var prov = providers();
    if (!prov.length)
        return;
    var qs = core.parseQueryString(pxt.storage.getLocal("oauthHash") || "");
    if (qs["access_token"]) {
        for (var _i = 0, prov_1 = prov; _i < prov_1.length; _i++) {
            var impl = prov_1[_i];
            if (impl.name == pxt.storage.getLocal("oauthType")) {
                pxt.storage.removeLocal("oauthHash");
                impl.loginCallback(qs);
                break;
            }
        }
    }
    for (var _a = 0, prov_2 = prov; _a < prov_2.length; _a++) {
        var impl = prov_2[_a];
        impl.loginCheck();
    }
}
exports.loginCheck = loginCheck;
function saveToCloudAsync(h) {
    if (!provider)
        return Promise.resolve();
    return syncOneUpAsync(h);
}
exports.saveToCloudAsync = saveToCloudAsync;
function setStatus(s) {
    if (s != status) {
        status = s;
        data.invalidate("sync:status");
    }
}
/*
    sync:username
    sync:loggedin
    sync:status
*/
data.mountVirtualApi("sync", {
    getSync: function (p) {
        switch (data.stripProtocol(p)) {
            case "username":
                return pxt.storage.getLocal("cloudName");
            case "loggedin":
                return provider != null;
            case "status":
                return status;
            case "hascloud":
                return providers().length > 0;
        }
        return null;
    },
});
