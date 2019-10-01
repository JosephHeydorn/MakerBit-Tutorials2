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
var Cloud = pxt.Cloud;
var U = pxt.Util;
var iface;
var HIDError = /** @class */ (function (_super) {
    __extends(HIDError, _super);
    function HIDError(msg) {
        var _this = _super.call(this, msg) || this;
        _this.message = msg;
        return _this;
    }
    return HIDError;
}(Error));
exports.HIDError = HIDError;
var bridgeByPath = {};
function onOOB(v) {
    var b = U.lookup(bridgeByPath, v.result.path);
    if (b) {
        b.onOOB(v);
    }
    else {
        console.error("Dropping data for " + v.result.path);
    }
}
function init() {
    if (!iface) {
        if (!pxt.BrowserUtils.isLocalHost() || !Cloud.localToken)
            return;
        pxt.debug('initializing hid pipe');
        iface = pxt.worker.makeWebSocket("ws://localhost:" + pxt.options.wsPort + "/" + Cloud.localToken + "/hid", onOOB);
    }
}
function shouldUse() {
    var serial = pxt.appTarget.serial;
    return serial && serial.useHF2 && (pxt.BrowserUtils.isLocalHost() && !!Cloud.localToken || pxt.winrt.isWinRT());
}
exports.shouldUse = shouldUse;
function mkBridgeAsync() {
    init();
    var raw = false;
    if (pxt.appTarget.serial && pxt.appTarget.serial.rawHID)
        raw = true;
    var b = new BridgeIO(raw);
    return b.initAsync()
        .then(function () { return b; });
}
exports.mkBridgeAsync = mkBridgeAsync;
pxt.HF2.mkPacketIOAsync = mkBridgeAsync;
var BridgeIO = /** @class */ (function () {
    function BridgeIO(rawMode) {
        if (rawMode === void 0) { rawMode = false; }
        var _this = this;
        this.rawMode = rawMode;
        this.onData = function (v) { };
        this.onEvent = function (v) { };
        this.onError = function (e) { };
        this.onSerial = function (v, isErr) { };
        if (rawMode)
            this.onEvent = function (v) { return _this.onData(v); };
    }
    BridgeIO.prototype.onOOB = function (v) {
        if (v.op == "serial") {
            this.onSerial(U.fromHex(v.result.data), v.result.isError);
        }
        else if (v.op == "event") {
            this.onEvent(U.fromHex(v.result.data));
        }
    };
    BridgeIO.prototype.talksAsync = function (cmds) {
        return iface.opAsync("talk", {
            path: this.dev.path,
            cmds: cmds.map(function (c) { return ({ cmd: c.cmd, data: c.data ? U.toHex(c.data) : "" }); })
        })
            .then(function (resp) {
            return resp.map(function (v) { return U.fromHex(v.data); });
        });
    };
    BridgeIO.prototype.error = function (msg) {
        throw new HIDError(U.lf("USB/HID error on device {0} ({1})", this.dev.product, msg));
    };
    BridgeIO.prototype.reconnectAsync = function () {
        return this.initAsync();
    };
    BridgeIO.prototype.disconnectAsync = function () {
        return iface.opAsync("disconnect", {
            path: this.dev.path
        });
    };
    BridgeIO.prototype.sendPacketAsync = function (pkt) {
        if (this.rawMode)
            return iface.opAsync("send", {
                path: this.dev.path,
                data: U.toHex(pkt),
                raw: true
            });
        throw new Error("should use talksAsync()!");
    };
    BridgeIO.prototype.sendSerialAsync = function (buf, useStdErr) {
        return iface.opAsync("sendserial", {
            path: this.dev.path,
            data: U.toHex(buf),
            isError: useStdErr
        });
    };
    BridgeIO.prototype.initAsync = function () {
        var _this = this;
        return iface.opAsync("list", {})
            .then(function (devs0) {
            var devs = devs0.devices;
            var d0 = devs.filter(function (d) { return (d.release & 0xff00) == 0x4200; })[0];
            if (pxt.appTarget.serial && pxt.appTarget.serial.rawHID)
                d0 = devs[0];
            if (d0) {
                if (_this.dev)
                    delete bridgeByPath[_this.dev.path];
                _this.dev = d0;
                bridgeByPath[_this.dev.path] = _this;
            }
            else
                throw new Error("No device connected");
        })
            .then(function () { return iface.opAsync("init", {
            path: _this.dev.path,
            raw: _this.rawMode,
        }); });
    };
    return BridgeIO;
}());
var uf2Wrapper;
var initPromise;
var serialHandler;
function hf2Async() {
    return pxt.HF2.mkPacketIOAsync()
        .then(function (h) {
        uf2Wrapper = new pxt.HF2.Wrapper(h);
        if (serialHandler) {
            uf2Wrapper.onSerial = serialHandler;
        }
        return uf2Wrapper.reconnectAsync(true)
            .then(function () { return uf2Wrapper; });
    });
}
function configureHidSerial(serialCb) {
    serialHandler = serialCb;
    if (uf2Wrapper) {
        uf2Wrapper.onSerial = serialHandler;
    }
}
exports.configureHidSerial = configureHidSerial;
function disconnectWrapperAsync() {
    if (uf2Wrapper) {
        return uf2Wrapper.disconnectAsync();
    }
    return Promise.resolve();
}
exports.disconnectWrapperAsync = disconnectWrapperAsync;
function initAsync(force) {
    if (force === void 0) { force = false; }
    if (!initPromise) {
        initPromise = hf2Async()
            .catch(function (err) {
            initPromise = null;
            return Promise.reject(err);
        });
    }
    var wrapper;
    return initPromise
        .then(function (w) {
        wrapper = w;
        if (force) {
            return wrapper.reconnectAsync();
        }
        return Promise.resolve();
    })
        .then(function () { return wrapper; });
}
exports.initAsync = initAsync;
