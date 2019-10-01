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
var cloudsync = require("./cloudsync");
var U = pxt.U;
var Provider = /** @class */ (function (_super) {
    __extends(Provider, _super);
    function Provider() {
        var _this = _super.call(this, "googledrive", lf("Google Drive"), "https://www.googleapis.com") || this;
        _this.entryCache = {};
        return _this;
    }
    Provider.prototype.login = function () {
        var p = this.loginInner();
        p.scope = "https://www.googleapis.com/auth/drive.appfolder https://www.googleapis.com/auth/plus.me";
        var url = core.stringifyQueryString("https://accounts.google.com/o/oauth2/v2/auth", p);
        window.location.href = url;
    };
    Provider.prototype.getUserInfoAsync = function () {
        var _this = this;
        return this.getJsonAsync("/plus/v1/people/me")
            .then(function (resp) { return ({
            name: resp.displayName || lf("{0} User", _this.friendlyName),
            id: resp.id
        }); });
    };
    Provider.prototype.listAsync = function () {
        var _this = this;
        return this.getJsonAsync("/drive/v3/files?" +
            "pageSize=1000&" +
            "fields=files(id,name,version,modifiedTime)&" +
            "spaces=appDataFolder"
        // "q=" + encodeURIComponent("name contains '" + this.fileSuffix() + "'")
        )
            .then(function (lst) {
            var res = [];
            for (var _i = 0, _a = (lst.files || []); _i < _a.length; _i++) {
                var r = _a[_i];
                _this.entryCache[r.id] = r;
                res.push({
                    id: r.id,
                    name: r.name,
                    version: r.version,
                    updatedAt: _this.parseTime(r.modifiedTime)
                });
            }
            return res;
        });
    };
    Provider.prototype.downloadAsync = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var cached, resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cached = this.entryCache[id];
                        return [4 /*yield*/, this.reqAsync({ url: "/drive/v3/files/" + cached.id + "?alt=media" })];
                    case 1:
                        resp = _a.sent();
                        return [2 /*return*/, {
                                id: cached.id,
                                version: cached.version,
                                name: cached.name,
                                updatedAt: this.parseTime(cached.modifiedTime),
                                content: JSON.parse(resp.text)
                            }];
                }
            });
        });
    };
    Provider.prototype.uploadAsync = function (id, prevVersion, files) {
        return __awaiter(this, void 0, void 0, function () {
            var tmp, resp, cached;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!id) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.reqAsync({
                                url: "/drive/v3/files",
                                method: "POST",
                                data: {
                                    // the user will never see this title anyways
                                    "name": pxtc.U.guidGen(),
                                    "mimeType": "application/json",
                                    "parents": ["appDataFolder"]
                                }
                            })];
                    case 1:
                        tmp = _a.sent();
                        if (tmp.statusCode >= 300)
                            this.syncError(lf("Can't create file in {0}", this.friendlyName));
                        id = tmp.json.id;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.reqAsync({
                            url: "/upload/drive/v3/files/" + id + "?uploadType=media" +
                                "&fields=id,name,version,modifiedTime",
                            method: "PATCH",
                            data: JSON.stringify(files, null, 1),
                        })];
                    case 3:
                        resp = _a.sent();
                        if (resp.statusCode >= 300)
                            this.syncError(lf("Can't upload file to {0}", this.friendlyName));
                        cached = resp.json;
                        this.entryCache[cached.id] = cached;
                        return [2 /*return*/, {
                                id: cached.id,
                                version: cached.version,
                                updatedAt: U.nowSeconds(),
                                name: cached.name,
                            }];
                }
            });
        });
    };
    Provider.prototype.deleteAsync = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var resp;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.reqAsync({
                            url: "/drive/v3/files/" + id,
                            method: "DELETE",
                        })];
                    case 1:
                        resp = _a.sent();
                        if (resp.statusCode != 204)
                            this.syncError(lf("Can't delete {0} file", this.friendlyName));
                        return [2 /*return*/];
                }
            });
        });
    };
    return Provider;
}(cloudsync.ProviderBase));
exports.Provider = Provider;
