"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Cloud = pxt.Cloud;
var U = pxt.Util;
var iface;
var bridgeBySocket = {};
function onOOB(v) {
    var b = U.lookup(bridgeBySocket, v.result.socket);
    if (b) {
        b.onOOB(v);
    }
    else {
        console.error("Dropping data for " + v.result.socket);
    }
}
function tryInit() {
    if (pxt.BrowserUtils.isLocalHost() && Cloud.localToken) {
        pxt.mkTCPSocket = function (h, p) { return new TCPSocket(h, p); };
    }
}
exports.tryInit = tryInit;
function init() {
    if (!iface) {
        if (!pxt.BrowserUtils.isLocalHost() || !Cloud.localToken)
            U.userError(lf("TCP sockets not available here"));
        pxt.debug('initializing tcp pipe');
        iface = pxt.worker.makeWebSocket("ws://localhost:" + pxt.options.wsPort + "/" + Cloud.localToken + "/tcp", onOOB);
    }
}
var TCPSocket = /** @class */ (function () {
    function TCPSocket(host, port) {
        this.host = host;
        this.port = port;
        this.onData = function (v) { };
        this.onError = function (e) { };
    }
    TCPSocket.prototype.onOOB = function (v) {
        if (v.op == "data") {
            var d = U.stringToUint8Array(atob(v.result.data));
            this.onData(d);
        }
        else if (v.op == "close") {
            this.sockId = null;
            delete bridgeBySocket[v.result.socket];
        }
    };
    TCPSocket.prototype.error = function (msg) {
        var err = new Error(U.lf("TCP error on socket {0}:{1} ({2})", this.host, this.port, msg));
        this.onError(err);
        throw err;
    };
    TCPSocket.prototype.disconnectAsync = function () {
        var _this = this;
        if (!this.sockId)
            return Promise.resolve();
        return iface.opAsync("close", {
            socket: this.sockId
        }).then(function () {
            _this.sockId = null;
        });
    };
    TCPSocket.prototype.sendPacketAsync = function (pkt) {
        if (!this.sockId)
            U.userError("Not connected");
        return iface.opAsync("send", {
            socket: this.sockId,
            data: U.toHex(pkt),
            encoding: "hex"
        });
    };
    TCPSocket.prototype.sendSerialAsync = function (buf, useStdErr) {
        return Promise.reject(new Error("No serial on socket"));
    };
    TCPSocket.prototype.connectAsync = function () {
        var _this = this;
        init();
        if (this.sockId)
            return Promise.resolve();
        return iface.opAsync("open", { host: this.host, port: this.port })
            .then(function (res) {
            if (!res.socket)
                _this.error(res.errorMessage);
            _this.sockId = res.socket;
            bridgeBySocket[_this.sockId] = _this;
        });
    };
    return TCPSocket;
}());
