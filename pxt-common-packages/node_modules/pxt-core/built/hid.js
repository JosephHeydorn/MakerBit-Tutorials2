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
var HF2 = pxt.HF2;
var U = pxt.U;
var nodeutil = require("./nodeutil");
var PXT_USE_HID = !!process.env["PXT_USE_HID"];
function useWebUSB() {
    return !!pxt.appTarget.compile.webUSB;
}
var HID = undefined;
function requireHID(install) {
    if (!PXT_USE_HID)
        return false;
    if (useWebUSB()) {
        // in node.js, we need "webusb" package
        if (pxt.Util.isNodeJS)
            return !!nodeutil.lazyRequire("webusb", install);
        // in the browser, check that USB is defined
        return pxt.usb.isAvailable();
    }
    else {
        if (!HID)
            HID = nodeutil.lazyRequire("node-hid", install);
        return !!HID;
    }
}
function isInstalled(install) {
    return requireHID(!!install);
}
exports.isInstalled = isInstalled;
function listAsync() {
    if (!isInstalled(true))
        return Promise.resolve();
    return getHF2DevicesAsync()
        .then(function (devices) {
        pxt.log("found " + devices.length + " HID devices");
        devices.forEach(function (device) { return pxt.log(device); });
    });
}
exports.listAsync = listAsync;
function serialAsync() {
    if (!isInstalled(true))
        return Promise.resolve();
    return initAsync()
        .then(function (d) {
        d.autoReconnect = true;
        connectSerial(d);
    });
}
exports.serialAsync = serialAsync;
function dmesgAsync() {
    HF2.enableLog();
    return initAsync()
        .then(function (d) { return d.talkAsync(pxt.HF2.HF2_CMD_DMESG)
        .then(function (resp) {
        console.log(U.fromUTF8(U.uint8ArrayToString(resp)));
        return d.disconnectAsync();
    }); });
}
exports.dmesgAsync = dmesgAsync;
function hex(n) {
    return ("000" + n.toString(16)).slice(-4);
}
function deviceInfo(h) {
    return h.product + " (by " + h.manufacturer + " at USB " + hex(h.vendorId) + ":" + hex(h.productId) + ")";
}
exports.deviceInfo = deviceInfo;
function getHF2Devices() {
    if (!isInstalled(false))
        return [];
    var devices = HID.devices();
    for (var _i = 0, devices_1 = devices; _i < devices_1.length; _i++) {
        var d = devices_1[_i];
        pxt.debug(JSON.stringify(d));
    }
    var serial = pxt.appTarget.serial;
    return devices.filter(function (d) {
        return (serial && parseInt(serial.productId) == d.productId && parseInt(serial.vendorId) == d.vendorId) ||
            (d.release & 0xff00) == 0x4200;
    });
}
function getHF2DevicesAsync() {
    return Promise.resolve(getHF2Devices());
}
exports.getHF2DevicesAsync = getHF2DevicesAsync;
function handleDevicesFound(devices, selectFn) {
    if (devices.length > 1) {
        var d42 = devices.filter(function (d) { return d.deviceVersionMajor == 42; });
        if (d42.length > 0)
            devices = d42;
    }
    devices.forEach(function (device) {
        console.log("DEV: " + (device.productName || device.serialNumber));
    });
    selectFn(devices[0]);
}
function hf2ConnectAsync(path, raw) {
    if (raw === void 0) { raw = false; }
    if (useWebUSB()) {
        var g = global;
        if (!g.navigator)
            g.navigator = {};
        if (!g.navigator.usb) {
            var webusb = nodeutil.lazyRequire("webusb", true);
            var load_1 = webusb.USBAdapter.prototype.loadDevice;
            webusb.USBAdapter.prototype.loadDevice = function (device) {
                // skip class 9 - USB HUB, as it causes SEGV on Windows
                if (device.deviceDescriptor.bDeviceClass == 9)
                    return Promise.resolve(null);
                return load_1.apply(this, arguments);
            };
            var USB = webusb.USB;
            g.navigator.usb = new USB({
                devicesFound: handleDevicesFound
            });
        }
        return pxt.usb.pairAsync()
            .then(function () { return pxt.usb.mkPacketIOAsync(); })
            .then(function (io) { return new HF2.Wrapper(io); })
            .then(function (d) { return d.reconnectAsync().then(function () { return d; }); });
    }
    if (!isInstalled(true))
        return Promise.resolve(undefined);
    // in .then() to make sure we catch errors
    var h = new HF2.Wrapper(new HidIO(path));
    h.rawMode = raw;
    return h.reconnectAsync(true).then(function () { return h; });
}
exports.hf2ConnectAsync = hf2ConnectAsync;
function mkPacketIOAsync() {
    if (useWebUSB())
        return hf2ConnectAsync("");
    return Promise.resolve()
        .then(function () {
        // in .then() to make sure we catch errors
        return new HidIO(null);
    });
}
exports.mkPacketIOAsync = mkPacketIOAsync;
pxt.HF2.mkPacketIOAsync = mkPacketIOAsync;
var hf2Dev;
function initAsync(path) {
    if (path === void 0) { path = null; }
    if (!hf2Dev) {
        hf2Dev = hf2ConnectAsync(path);
    }
    return hf2Dev;
}
exports.initAsync = initAsync;
function connectSerial(w) {
    process.stdin.on("data", function (buf) {
        w.sendSerialAsync(new Uint8Array(buf)).done();
    });
    w.onSerial = function (arr, iserr) {
        var buf = Buffer.from(arr);
        if (iserr)
            process.stderr.write(buf);
        else
            process.stdout.write(buf);
    };
}
exports.connectSerial = connectSerial;
var HIDError = /** @class */ (function (_super) {
    __extends(HIDError, _super);
    function HIDError(m) {
        var _this = _super.call(this, m) || this;
        _this.message = m;
        return _this;
    }
    return HIDError;
}(Error));
exports.HIDError = HIDError;
var HidIO = /** @class */ (function () {
    function HidIO(requestedPath) {
        this.requestedPath = requestedPath;
        this.onData = function (v) { };
        this.onEvent = function (v) { };
        this.onError = function (e) { };
        this.connect();
    }
    HidIO.prototype.connect = function () {
        var _this = this;
        U.assert(isInstalled(false));
        if (this.requestedPath == null) {
            var devs = getHF2Devices();
            if (devs.length == 0)
                throw new HIDError("no devices found");
            this.path = devs[0].path;
        }
        else {
            this.path = this.requestedPath;
        }
        this.dev = new HID.HID(this.path);
        this.dev.on("data", function (v) {
            //console.log("got", v.toString("hex"))
            _this.onData(new Uint8Array(v));
        });
        this.dev.on("error", function (v) { return _this.onError(v); });
    };
    HidIO.prototype.sendPacketAsync = function (pkt) {
        var _this = this;
        //console.log("SEND: " + Buffer.from(pkt).toString("hex"))
        return Promise.resolve()
            .then(function () {
            var lst = [0];
            for (var i = 0; i < Math.max(64, pkt.length); ++i)
                lst.push(pkt[i] || 0);
            _this.dev.write(lst);
        });
    };
    HidIO.prototype.error = function (msg) {
        var fullmsg = "HID error on " + this.path + ": " + msg;
        console.error(fullmsg);
        throw new HIDError(fullmsg);
    };
    HidIO.prototype.disconnectAsync = function () {
        var _this = this;
        if (!this.dev)
            return Promise.resolve();
        // see https://github.com/node-hid/node-hid/issues/61
        this.dev.removeAllListeners("data");
        this.dev.removeAllListeners("error");
        var pkt = new Uint8Array([0x48]);
        this.sendPacketAsync(pkt).catch(function (e) { });
        return Promise.delay(100)
            .then(function () {
            if (_this.dev) {
                _this.dev.close();
                _this.dev = null;
            }
        });
    };
    HidIO.prototype.reconnectAsync = function () {
        var _this = this;
        return this.disconnectAsync()
            .then(function () {
            _this.connect();
        });
    };
    return HidIO;
}());
exports.HidIO = HidIO;
