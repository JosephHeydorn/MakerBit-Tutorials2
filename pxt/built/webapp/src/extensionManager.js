"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var e = pxt.editor;
var pkg = require("./package");
var Permissions;
(function (Permissions) {
    Permissions[Permissions["Console"] = 0] = "Console";
    Permissions[Permissions["ReadUserCode"] = 1] = "ReadUserCode";
})(Permissions = exports.Permissions || (exports.Permissions = {}));
var PermissionStatus;
(function (PermissionStatus) {
    PermissionStatus[PermissionStatus["Granted"] = 0] = "Granted";
    PermissionStatus[PermissionStatus["Denied"] = 1] = "Denied";
    PermissionStatus[PermissionStatus["NotAvailable"] = 2] = "NotAvailable";
    PermissionStatus[PermissionStatus["NotYetPrompted"] = 3] = "NotYetPrompted";
})(PermissionStatus = exports.PermissionStatus || (exports.PermissionStatus = {}));
var ExtensionManager = /** @class */ (function () {
    function ExtensionManager(host) {
        this.host = host;
        this.statuses = {};
        this.nameToExtId = {};
        this.extIdToName = {};
        this.consent = {};
        this.pendingRequests = [];
        this.queueLock = false;
        // name to enabled
        this.streams = {};
    }
    ExtensionManager.prototype.streamingExtensions = function () {
        return Object.keys(this.streams);
    };
    ExtensionManager.prototype.handleExtensionMessage = function (message) {
        this.handleRequestAsync(message)
            .catch(function (e) { });
    };
    ExtensionManager.prototype.sendEvent = function (extId, event) {
        this.host.send(extId, mkEvent(event));
    };
    ExtensionManager.prototype.setConsent = function (extId, allowed) {
        this.consent[extId] = allowed;
    };
    ExtensionManager.prototype.hasConsent = function (extId) {
        return this.consent[extId];
    };
    ExtensionManager.prototype.getExtId = function (name) {
        if (!this.nameToExtId[name]) {
            this.nameToExtId[name] = ts.pxtc.Util.guidGen();
            this.extIdToName[this.nameToExtId[name]] = name;
        }
        return this.nameToExtId[name];
    };
    ExtensionManager.prototype.sendResponse = function (response) {
        this.host.send(this.extIdToName[response.extId], response);
    };
    ExtensionManager.prototype.handleRequestAsync = function (request) {
        var _this = this;
        var resp = mkResponse(request);
        if (!this.hasConsent(request.extId)) {
            resp.success = false;
            resp.error = "";
            this.sendResponse(resp);
            return Promise.reject("No consent");
        }
        switch (request.action) {
            case "extinit":
                var ri = resp;
                ri.target = pxt.appTarget;
                this.sendResponse(resp);
                break;
            case "extdatastream":
                return this.permissionOperation(request.extId, Permissions.Console, resp, function (name, resp) { return _this.handleDataStreamRequest(name, resp); });
            case "extquerypermission":
                var perm = this.getPermissions(request.extId);
                var r = resp;
                r.resp = statusesToResponses(perm);
                this.sendResponse(r);
                break;
            case "extrequestpermission":
                return this.requestPermissionsAsync(request.extId, resp, request.body);
            case "extusercode":
                return this.permissionOperation(request.extId, Permissions.ReadUserCode, resp, handleUserCodeRequest);
            case "extreadcode":
                handleReadCodeRequest(this.extIdToName[request.extId], resp);
                this.sendResponse(resp);
                break;
            case "extwritecode":
                handleWriteCodeRequestAsync(this.extIdToName[request.extId], resp, request.body)
                    .done(function () { return _this.sendResponse(resp); });
                break;
        }
        return Promise.resolve();
    };
    ExtensionManager.prototype.permissionOperation = function (id, permission, resp, cb) {
        var _this = this;
        return this.checkPermissionAsync(id, permission)
            .then(function (hasPermission) {
            if (hasPermission) {
                cb(_this.extIdToName[id], resp);
                _this.sendResponse(resp);
            }
            else {
                resp.success = false;
                resp.error = "permission denied";
                _this.sendResponse(resp);
            }
        })
            .catch(function (e) {
            resp.success = false;
            resp.error = e;
            _this.sendResponse(resp);
        });
    };
    ExtensionManager.prototype.getPermissions = function (id) {
        if (!this.statuses[id]) {
            this.statuses[id] = {
                console: PermissionStatus.NotYetPrompted,
                readUserCode: PermissionStatus.NotYetPrompted
            };
        }
        return this.statuses[id];
    };
    ExtensionManager.prototype.queuePermissionRequest = function (extId, permission) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var req = {
                extId: extId,
                permissions: [permission],
                resolver: resolve
            };
            _this.pendingRequests.push(req);
            if (!_this.queueLock && _this.pendingRequests.length === 1) {
                _this.queueLock = true;
                _this.nextPermissionRequest();
            }
        });
    };
    ExtensionManager.prototype.nextPermissionRequest = function () {
        var _this = this;
        if (this.pendingRequests.length) {
            var current_1 = this.pendingRequests.shift();
            // Don't allow duplicate requests to prevent spamming
            current_1.permissions = current_1.permissions.filter(function (p) { return _this.hasNotBeenPrompted(current_1.extId, p); });
            if (current_1.permissions.length) {
                this.host.promptForPermissionAsync(this.extIdToName[current_1.extId], current_1.permissions)
                    .done(function (approved) {
                    current_1.resolver(approved);
                    _this.nextPermissionRequest();
                });
            }
            else {
                this.nextPermissionRequest();
            }
        }
        else {
            this.queueLock = false;
        }
    };
    ExtensionManager.prototype.checkPermissionAsync = function (id, permission) {
        var _this = this;
        var perm = this.getPermissions(id);
        var status;
        switch (permission) {
            case Permissions.Console:
                status = perm.console;
                break;
            case Permissions.ReadUserCode:
                status = perm.readUserCode;
                break;
        }
        if (status === PermissionStatus.NotYetPrompted) {
            return this.queuePermissionRequest(id, permission)
                .then(function (approved) {
                var newStatus = approved ? PermissionStatus.Granted : PermissionStatus.Denied;
                switch (permission) {
                    case Permissions.Console:
                        _this.statuses[id].console = newStatus;
                        break;
                    case Permissions.ReadUserCode:
                        _this.statuses[id].readUserCode = newStatus;
                        break;
                }
                return approved;
            });
        }
        return Promise.resolve(status === PermissionStatus.Granted);
    };
    ExtensionManager.prototype.requestPermissionsAsync = function (id, resp, p) {
        var _this = this;
        var promises = [];
        if (p.readUserCode) {
            promises.push(this.checkPermissionAsync(id, Permissions.ReadUserCode));
        }
        if (p.console) {
            promises.push(this.checkPermissionAsync(id, Permissions.Console));
        }
        return Promise.all(promises)
            .then(function () { return statusesToResponses(_this.getPermissions(id)); })
            .then(function (responses) { resp.resp = responses; });
    };
    ExtensionManager.prototype.hasNotBeenPrompted = function (extId, permission) {
        var perm = this.getPermissions(extId);
        var status;
        switch (permission) {
            case Permissions.Console:
                status = perm.console;
                break;
            case Permissions.ReadUserCode:
                status = perm.readUserCode;
                break;
        }
        return status === PermissionStatus.NotYetPrompted;
    };
    ExtensionManager.prototype.handleDataStreamRequest = function (name, resp) {
        // ASSERT: permission has been granted
        this.streams[name] = true;
    };
    return ExtensionManager;
}());
exports.ExtensionManager = ExtensionManager;
function handleUserCodeRequest(name, resp) {
    // ASSERT: permission has been granded
    var mainPackage = pkg.mainEditorPkg();
    resp.resp = mainPackage.getAllFiles();
}
function handleReadCodeRequest(name, resp) {
    var mainPackage = pkg.mainEditorPkg();
    var fn = ts.pxtc.escapeIdentifier(name);
    var files = mainPackage.getAllFiles();
    resp.resp = {
        json: files[fn + ".json"],
        code: files[fn + ".ts"],
        jres: files[fn + ".jres"],
        asm: files[fn + ".asm"]
    };
}
function handleWriteCodeRequestAsync(name, resp, files) {
    var mainPackage = pkg.mainEditorPkg();
    var fn = ts.pxtc.escapeIdentifier(name);
    function shouldUpdate(value, ext) {
        return value !== undefined && (!mainPackage.files[fn + ext] || mainPackage.files[fn + ext].content != value);
    }
    var needsUpdate = false;
    if (shouldUpdate(files.json, ".json")) {
        needsUpdate = true;
        mainPackage.setFile(fn + ".json", files.json);
    }
    if (shouldUpdate(files.code, ".ts")) {
        needsUpdate = true;
        mainPackage.setFile(fn + ".ts", files.code);
    }
    if (shouldUpdate(files.jres, ".jres")) {
        needsUpdate = true;
        mainPackage.setFile(fn + ".jres", files.jres);
    }
    if (shouldUpdate(files.asm, ".asm")) {
        needsUpdate = true;
        mainPackage.setFile(fn + ".asm", files.asm);
    }
    return !needsUpdate ? Promise.resolve() : mainPackage.updateConfigAsync(function (cfg) {
        if (files.json !== undefined && cfg.files.indexOf(fn + ".json") < 0) {
            cfg.files.push(fn + ".json");
        }
        if (files.code !== undefined && cfg.files.indexOf(fn + ".ts") < 0) {
            cfg.files.push(fn + ".ts");
        }
        if (files.jres !== undefined && cfg.files.indexOf(fn + ".jres") < 0) {
            cfg.files.push(fn + ".jres");
        }
        if (files.asm !== undefined && cfg.files.indexOf(fn + ".asm") < 0) {
            cfg.files.push(fn + ".asm");
        }
        return mainPackage.savePkgAsync();
    });
}
function mkEvent(event) {
    return {
        target: pxt.appTarget.id,
        type: "pxtpkgext",
        event: event
    };
}
function mkResponse(request, success) {
    if (success === void 0) { success = true; }
    return {
        type: "pxtpkgext",
        id: request.id,
        extId: request.extId,
        success: success
    };
}
function statusesToResponses(perm) {
    return {
        readUserCode: statusToResponse(perm.readUserCode),
        console: statusToResponse(perm.console)
    };
}
function statusToResponse(p) {
    switch (p) {
        case PermissionStatus.NotYetPrompted:
        case PermissionStatus.Denied:
            return e.PermissionResponses.Denied;
        case PermissionStatus.Granted:
            return e.PermissionResponses.Granted;
        case PermissionStatus.NotAvailable:
        default:
            return e.PermissionResponses.NotAvailable;
    }
}
