"use strict";
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
var U = pxt.Util;
var Cloud = pxt.Cloud;
var apiAsync = function (path, data) {
    return U.requestAsync({
        url: "/api/" + path,
        headers: { "Authorization": Cloud.localToken },
        method: data ? "POST" : "GET",
        data: data || undefined
    }).then(function (r) { return r.json; }).catch(core.handleNetworkError);
};
function setApiAsync(f) {
    apiAsync = f;
}
exports.setApiAsync = setApiAsync;
function getAsync(h) {
    return apiAsync("pkg/" + h.path)
        .then(function (resp) {
        var r = {
            header: h,
            text: {},
            version: null
        };
        for (var _i = 0, _a = resp.files; _i < _a.length; _i++) {
            var f = _a[_i];
            r.text[f.name] = f.content;
            h.modificationTime = Math.max(h.modificationTime, (f.mtime / 1000) | 0);
        }
        h.recentUse = Math.max(h.recentUse, h.modificationTime);
        r.version = U.flatClone(r.text);
        return r;
    });
}
var delText = {};
function setAsync(h, prevVersion, text) {
    var pkg = {
        files: [],
        config: null,
        header: h,
        path: h.path,
        isDeleted: text === delText
    };
    if (text) {
        if (!prevVersion)
            prevVersion = {};
        for (var _i = 0, _a = Object.keys(text); _i < _a.length; _i++) {
            var fn = _a[_i];
            if (text[fn] !== prevVersion[fn])
                pkg.files.push({
                    name: fn,
                    mtime: null,
                    content: text[fn],
                    prevContent: prevVersion[fn]
                });
        }
        // delete files that are missing now
        for (var _b = 0, _c = Object.keys(prevVersion); _b < _c.length; _b++) {
            var fn = _c[_b];
            if (text[fn] === undefined)
                pkg.files.push({
                    name: fn,
                    mtime: null,
                    content: null,
                    prevContent: prevVersion[fn]
                });
        }
    }
    var savedText = U.flatClone(text || {});
    return apiAsync("pkg/" + h.path, pkg)
        .then(function (pkg) {
        //mergeFsPkg(pkg)
        return savedText;
    });
}
function deleteAsync(h, prevVer) {
    return setAsync(h, prevVer, delText);
}
function listAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var h, _i, _a, pkg, time, modTime;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, apiAsync("list")];
                case 1:
                    h = _b.sent();
                    _i = 0, _a = h.pkgs;
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    pkg = _a[_i];
                    if (!!pkg.header) return [3 /*break*/, 4];
                    time = pkg.files.map(function (f) { return f.mtime; });
                    time.sort(function (a, b) { return b - a; });
                    modTime = Math.round(time[0] / 1000) || U.nowSeconds();
                    pkg.header = pxt.workspace.freshHeader(pkg.config.name, modTime);
                    if (pkg.config.preferredEditor)
                        pkg.header.editor = pkg.config.preferredEditor;
                    pkg.header.path = pkg.path;
                    // generate new header and save it
                    return [4 /*yield*/, setAsync(pkg.header, null)];
                case 3:
                    // generate new header and save it
                    _b.sent();
                    return [3 /*break*/, 5];
                case 4:
                    pkg.header.path = pkg.path;
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6: return [2 /*return*/, h.pkgs.map(function (p) { return p.header; })];
            }
        });
    });
}
function saveScreenshotAsync(h, screenshot, icon) {
    return apiAsync("screenshot/" + h.path, { screenshot: screenshot, icon: icon });
}
function resetAsync() {
    if (pxt.BrowserUtils.isPxtElectron())
        return apiAsync("resetworkspace", {})
            .then(function () { });
    return Promise.resolve();
}
function saveAssetAsync(id, filename, data) {
    return apiAsync("pkgasset/" + id, {
        encoding: "base64",
        name: filename,
        data: btoa(ts.pxtc.Util.uint8ArrayToString(data))
    }).then(function (resp) {
    });
}
function listAssetsAsync(id) {
    return apiAsync("pkgasset/" + id).then(function (r) { return r.files; });
}
exports.provider = {
    getAsync: getAsync,
    setAsync: setAsync,
    listAsync: listAsync,
    resetAsync: resetAsync,
    deleteAsync: deleteAsync,
    saveScreenshotAsync: saveScreenshotAsync,
    saveAssetAsync: saveAssetAsync,
    listAssetsAsync: listAssetsAsync
};
