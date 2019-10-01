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
var fs = require("fs");
var path = require("path");
var http = require("http");
var url = require("url");
var querystring = require("querystring");
var nodeutil = require("./nodeutil");
var hid = require("./hid");
var net = require("net");
var U = pxt.Util;
var Cloud = pxt.Cloud;
var userProjectsDirName = "projects";
var root = "";
var dirs = [""];
var docfilesdirs = [""];
var userProjectsDir = path.join(process.cwd(), userProjectsDirName);
var docsDir = "";
var packagedDir = "";
var localHexCacheDir = path.join("built", "hexcache");
var serveOptions;
function setupDocfilesdirs() {
    docfilesdirs = [
        "docfiles",
        path.join(nodeutil.pxtCoreDir, "docfiles")
    ];
}
function setupRootDir() {
    root = nodeutil.targetDir;
    console.log("Starting server in", root);
    console.log("With pxt core at " + nodeutil.pxtCoreDir);
    dirs = [
        "built/web",
        path.join(nodeutil.targetDir, "built"),
        path.join(nodeutil.targetDir, "sim/public"),
        path.join(nodeutil.targetDir, "node_modules", "pxt-" + pxt.appTarget.id + "-sim", "public"),
        path.join(nodeutil.pxtCoreDir, "built/web"),
        path.join(nodeutil.pxtCoreDir, "webapp/public")
    ];
    docsDir = path.join(root, "docs");
    packagedDir = path.join(root, "built/packaged");
    setupDocfilesdirs();
    setupProjectsDir();
    pxt.debug("docs dir:\r\n    " + docsDir);
    pxt.debug("doc files dir: \r\n    " + docfilesdirs.join("\r\n    "));
    pxt.debug("dirs:\r\n    " + dirs.join('\r\n    '));
    pxt.debug("projects dir: " + userProjectsDir);
}
function setupProjectsDir() {
    nodeutil.mkdirP(userProjectsDir);
}
var statAsync = Promise.promisify(fs.stat);
var readdirAsync = Promise.promisify(fs.readdir);
var readFileAsync = Promise.promisify(fs.readFile);
var writeFileAsync = Promise.promisify(fs.writeFile);
var unlinkAsync = Promise.promisify(fs.unlink);
function existsAsync(fn) {
    return new Promise(function (resolve, reject) {
        fs.exists(fn, resolve);
    });
}
function statOptAsync(fn) {
    return statAsync(fn)
        .then(function (st) { return st; }, function (err) { return null; });
}
function throwError(code, msg) {
    if (msg === void 0) { msg = null; }
    var err = new Error(msg || "Error " + code);
    err.statusCode = code;
    throw err;
}
function readAssetsAsync(logicalDirname) {
    var dirname = path.join(userProjectsDir, logicalDirname, "assets");
    /* tslint:disable:no-http-string */
    var pref = "http://" + serveOptions.hostname + ":" + serveOptions.port + "/assets/" + logicalDirname + "/";
    /* tslint:enable:no-http-string */
    return readdirAsync(dirname)
        .catch(function (err) { return []; })
        .then(function (res) { return Promise.map(res, function (fn) { return statAsync(path.join(dirname, fn)).then(function (res) { return ({
        name: fn,
        size: res.size,
        url: pref + fn
    }); }); }); })
        .then(function (res) { return ({
        files: res
    }); });
}
var HEADER_JSON = ".header.json";
function readPkgAsync(logicalDirname, fileContents) {
    if (fileContents === void 0) { fileContents = false; }
    return __awaiter(this, void 0, void 0, function () {
        var dirname, buf, cfg, r, _i, _a, fn, st, ff, thisFileContents, buf_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    dirname = path.join(userProjectsDir, logicalDirname);
                    return [4 /*yield*/, readFileAsync(path.join(dirname, pxt.CONFIG_NAME))];
                case 1:
                    buf = _b.sent();
                    cfg = JSON.parse(buf.toString("utf8"));
                    r = {
                        path: logicalDirname,
                        config: cfg,
                        header: null,
                        files: []
                    };
                    _i = 0, _a = pxt.allPkgFiles(cfg).concat([pxt.github.GIT_JSON, pxt.SIMSTATE_JSON]);
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 7];
                    fn = _a[_i];
                    return [4 /*yield*/, statOptAsync(path.join(dirname, fn))];
                case 3:
                    st = _b.sent();
                    ff = {
                        name: fn,
                        mtime: st ? st.mtime.getTime() : null
                    };
                    thisFileContents = st && fileContents;
                    if (!st && fn == pxt.SIMSTATE_JSON)
                        return [3 /*break*/, 6];
                    if (fn == pxt.github.GIT_JSON) {
                        // skip .git.json altogether if missing
                        if (!st)
                            return [3 /*break*/, 6];
                        thisFileContents = true;
                    }
                    if (!thisFileContents) return [3 /*break*/, 5];
                    return [4 /*yield*/, readFileAsync(path.join(dirname, fn))];
                case 4:
                    buf_1 = _b.sent();
                    ff.content = buf_1.toString("utf8");
                    _b.label = 5;
                case 5:
                    r.files.push(ff);
                    _b.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7: return [4 /*yield*/, existsAsync(path.join(dirname, "icon.jpeg"))];
                case 8:
                    if (_b.sent()) {
                        r.icon = "/icon/" + logicalDirname;
                    }
                    return [4 /*yield*/, readFileAsync(path.join(dirname, HEADER_JSON))
                            .then(function (b) { return b; }, function (err) { return null; })];
                case 9:
                    // now try reading the header
                    buf = _b.sent();
                    if (buf && buf.length)
                        r.header = JSON.parse(buf.toString("utf8"));
                    return [2 /*return*/, r];
            }
        });
    });
}
function writeScreenshotAsync(logicalDirname, screenshotUri, iconUri) {
    console.log('writing screenshot...');
    var dirname = path.join(userProjectsDir, logicalDirname);
    nodeutil.mkdirP(dirname);
    function writeUriAsync(name, uri) {
        if (!uri)
            return Promise.resolve();
        var m = uri.match(/^data:image\/(png|jpeg);base64,(.*)$/);
        if (!m)
            return Promise.resolve();
        var ext = m[1];
        var data = m[2];
        var fn = path.join(dirname, name + "." + ext);
        console.log("writing " + fn);
        return writeFileAsync(fn, Buffer.from(data, 'base64'));
    }
    return Promise.all([
        writeUriAsync("screenshot", screenshotUri),
        writeUriAsync("icon", iconUri)
    ]).then(function () { });
}
function writePkgAssetAsync(logicalDirname, data) {
    var dirname = path.join(userProjectsDir, logicalDirname, "assets");
    nodeutil.mkdirP(dirname);
    return writeFileAsync(dirname + "/" + data.name, Buffer.from(data.data, data.encoding || "base64"))
        .then(function () { return ({
        name: data.name
    }); });
}
function writePkgAsync(logicalDirname, data) {
    var dirname = path.join(userProjectsDir, logicalDirname);
    nodeutil.mkdirP(dirname);
    return Promise.map(data.files, function (f) {
        return readFileAsync(path.join(dirname, f.name))
            .then(function (buf) {
            if (f.name == pxt.CONFIG_NAME) {
                try {
                    var cfg = JSON.parse(f.content);
                    if (!cfg.name) {
                        console.log("Trying to save invalid JSON config");
                        throwError(410);
                    }
                }
                catch (e) {
                    console.log("Trying to save invalid format JSON config");
                    throwError(410);
                }
            }
            if (buf.toString("utf8") !== f.prevContent) {
                console.log("merge error for " + f.name + ": previous content changed...");
                throwError(409);
            }
        }, function (err) { });
    })
        .then(function () { return Promise.map(data.files, function (f) {
        var d = f.name.replace(/\/[^\/]*$/, "");
        if (d != f.name)
            nodeutil.mkdirP(path.join(dirname, d));
        var fn = path.join(dirname, f.name);
        return f.content == null ? unlinkAsync(fn) : writeFileAsync(fn, f.content);
    }); })
        .then(function () {
        if (data.header)
            return writeFileAsync(path.join(dirname, HEADER_JSON), JSON.stringify(data.header, null, 4));
    })
        .then(function () { return readPkgAsync(logicalDirname, false); });
}
function returnDirAsync(logicalDirname, depth) {
    logicalDirname = logicalDirname.replace(/^\//, "");
    var dirname = path.join(userProjectsDir, logicalDirname);
    return existsAsync(path.join(dirname, pxt.CONFIG_NAME))
        .then(function (ispkg) {
        return ispkg ? readPkgAsync(logicalDirname).then(function (r) { return [r]; }, function (err) { return []; }) :
            depth <= 1 ? [] :
                readdirAsync(dirname)
                    .then(function (files) {
                    return Promise.map(files, function (fn) {
                        return statAsync(path.join(dirname, fn))
                            .then(function (st) {
                            if (fn[0] != "." && st.isDirectory())
                                return returnDirAsync(logicalDirname + "/" + fn, depth - 1);
                            else
                                return [];
                        });
                    });
                })
                    .then(U.concat);
    });
}
function isAuthorizedLocalRequest(req) {
    // validate token
    return req.headers["authorization"]
        && req.headers["authorization"] == serveOptions.localToken;
}
function getCachedHexAsync(sha) {
    if (!sha) {
        return Promise.resolve();
    }
    var hexFile = path.resolve(localHexCacheDir, sha + ".hex");
    return existsAsync(hexFile)
        .then(function (results) {
        if (!results) {
            console.log("offline HEX not found: " + hexFile);
            return Promise.resolve(null);
        }
        console.log("serving HEX from offline cache: " + hexFile);
        return readFileAsync(hexFile)
            .then(function (fileContent) {
            return {
                enums: [],
                functions: [],
                hex: fileContent.toString()
            };
        });
    });
}
function handleApiAsync(req, res, elts) {
    var opts = querystring.parse(url.parse(req.url).query);
    var innerPath = elts.slice(2).join("/").replace(/^\//, "");
    var filename = path.resolve(path.join(userProjectsDir, innerPath));
    var meth = req.method.toUpperCase();
    var cmd = meth + " " + elts[1];
    var readJsonAsync = function () {
        return nodeutil.readResAsync(req)
            .then(function (buf) { return JSON.parse(buf.toString("utf8")); });
    };
    if (cmd == "GET list")
        return returnDirAsync(innerPath, 3)
            .then(function (lst) {
            return {
                pkgs: lst
            };
        });
    else if (cmd == "GET stat")
        return statOptAsync(filename)
            .then(function (st) {
            if (!st)
                return {};
            else
                return {
                    mtime: st.mtime.getTime()
                };
        });
    else if (cmd == "GET pkg")
        return readPkgAsync(innerPath, true);
    else if (cmd == "POST pkg")
        return readJsonAsync()
            .then(function (d) { return writePkgAsync(innerPath, d); });
    else if (cmd == "POST pkgasset")
        return readJsonAsync()
            .then(function (d) { return writePkgAssetAsync(innerPath, d); });
    else if (cmd == "GET pkgasset")
        return readAssetsAsync(innerPath);
    else if (cmd == "POST deploy" && pxt.commands.hasDeployFn())
        return readJsonAsync()
            .then(pxt.commands.deployAsync)
            .then(function (boardCount) {
            return {
                boardCount: boardCount
            };
        });
    else if (cmd == "POST screenshot")
        return readJsonAsync()
            .then(function (d) { return writeScreenshotAsync(innerPath, d.screenshot, d.icon); });
    else if (cmd == "GET compile")
        return getCachedHexAsync(innerPath)
            .then(function (res) {
            if (!res) {
                return {
                    notInOfflineCache: true
                };
            }
            return res;
        });
    else if (cmd == "GET md" && pxt.appTarget.id + "/" == innerPath.slice(0, pxt.appTarget.id.length + 1)) {
        // innerpath start with targetid
        return Promise.resolve(readMd(innerPath.slice(pxt.appTarget.id.length + 1)));
    }
    else if (cmd == "GET config" && new RegExp(pxt.appTarget.id + "/targetconfig(/v[0-9.]+)?$").test(innerPath)) {
        // target config
        return readFileAsync("targetconfig.json").then(function (buf) { return JSON.parse(buf.toString("utf8")); });
    }
    else
        throw throwError(400, "unknown command " + cmd.slice(0, 140));
}
function lookupDocFile(name) {
    if (docfilesdirs.length <= 1)
        setupDocfilesdirs();
    for (var _i = 0, docfilesdirs_1 = docfilesdirs; _i < docfilesdirs_1.length; _i++) {
        var d = docfilesdirs_1[_i];
        var foundAt = path.join(d, name);
        if (fs.existsSync(foundAt))
            return foundAt;
    }
    return null;
}
exports.lookupDocFile = lookupDocFile;
function expandHtml(html) {
    var theme = U.flatClone(pxt.appTarget.appTheme);
    html = expandDocTemplateCore(html);
    var params = {
        name: pxt.appTarget.appTheme.title,
        description: pxt.appTarget.appTheme.description,
        locale: pxt.appTarget.appTheme.defaultLocale || "en"
    };
    // page overrides
    var m = /<title>([^<>@]*)<\/title>/.exec(html);
    if (m)
        params["name"] = m[1];
    m = /<meta name="Description" content="([^"@]*)"/.exec(html);
    if (m)
        params["description"] = m[1];
    var d = {
        html: html,
        params: params,
        theme: theme,
    };
    pxt.docs.prepTemplate(d);
    return d.finish().replace(/@-(\w+)-@/g, function (f, w) { return "@" + w + "@"; });
}
exports.expandHtml = expandHtml;
function expandDocTemplateCore(template) {
    template = template
        .replace(/<!--\s*@include\s+(\S+)\s*-->/g, function (full, fn) {
        return "\n<!-- include " + fn + " -->\n" + expandDocFileTemplate(fn) + "\n<!-- end include " + fn + " -->\n";
    });
    return template;
}
exports.expandDocTemplateCore = expandDocTemplateCore;
function expandDocFileTemplate(name) {
    var fn = lookupDocFile(name);
    var template = fn ? fs.readFileSync(fn, "utf8") : "";
    return expandDocTemplateCore(template);
}
exports.expandDocFileTemplate = expandDocFileTemplate;
var wsSerialClients = [];
var webappReady = false;
function initSocketServer(wsPort, hostname) {
    console.log("starting local ws server at " + wsPort + "...");
    var WebSocket = require('faye-websocket');
    function startSerial(request, socket, body) {
        var ws = new WebSocket(request, socket, body);
        wsSerialClients.push(ws);
        ws.on('message', function (event) {
            // ignore
        });
        ws.on('close', function (event) {
            console.log('ws connection closed');
            wsSerialClients.splice(wsSerialClients.indexOf(ws), 1);
            ws = null;
        });
        ws.on('error', function () {
            console.log('ws connection closed');
            wsSerialClients.splice(wsSerialClients.indexOf(ws), 1);
            ws = null;
        });
    }
    function objToString(obj) {
        if (obj == null)
            return "null";
        var r = "{\n";
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var k = _a[_i];
            r += "   " + k + ": ";
            var s = JSON.stringify(obj[k]);
            if (!s)
                s = "(null)";
            if (s.length > 60)
                s = s.slice(0, 60) + "...";
            r += s + "\n";
        }
        r += "}";
        return r;
    }
    var hios = {};
    function startHID(request, socket, body) {
        var ws = new WebSocket(request, socket, body);
        ws.on('open', function () {
            ws.send(JSON.stringify({ id: "ready" }));
        });
        ws.on('message', function (event) {
            try {
                var msg_1 = JSON.parse(event.data);
                pxt.debug("hid: msg " + msg_1.op); // , objToString(msg.arg))
                // check that HID is installed
                if (!hid.isInstalled(true)) {
                    if (!ws)
                        return;
                    ws.send(JSON.stringify({
                        result: {
                            errorMessage: "node-hid not installed",
                        },
                        op: msg_1.op,
                        id: msg_1.id
                    }));
                    return;
                }
                Promise.resolve()
                    .then(function () {
                    var hio = hios[msg_1.arg.path];
                    if (!hio && msg_1.arg.path)
                        hios[msg_1.arg.path] = hio = hid.hf2ConnectAsync(msg_1.arg.path, !!msg_1.arg.raw);
                    return hio;
                })
                    .then(function (hio) {
                    switch (msg_1.op) {
                        case "disconnect":
                            return hio.disconnectAsync()
                                .then(function () { return ({}); });
                        case "init":
                            return hio.reconnectAsync()
                                .then(function () {
                                hio.io.onEvent = function (v) {
                                    if (!ws)
                                        return;
                                    ws.send(JSON.stringify({
                                        op: "event",
                                        result: {
                                            path: msg_1.arg.path,
                                            data: U.toHex(v),
                                        }
                                    }));
                                };
                                if (hio.rawMode)
                                    hio.io.onData = hio.io.onEvent;
                                hio.onSerial = function (v, isErr) {
                                    if (!ws)
                                        return;
                                    ws.send(JSON.stringify({
                                        op: "serial",
                                        result: {
                                            isError: isErr,
                                            path: msg_1.arg.path,
                                            data: U.toHex(v),
                                        }
                                    }));
                                };
                                return {};
                            });
                        case "send":
                            if (!hio.rawMode)
                                return null;
                            return hio.io.sendPacketAsync(U.fromHex(msg_1.arg.data))
                                .then(function () { return ({}); });
                        case "talk":
                            return Promise.mapSeries(msg_1.arg.cmds, function (obj) {
                                pxt.debug("hid talk " + obj.cmd);
                                return hio.talkAsync(obj.cmd, U.fromHex(obj.data))
                                    .then(function (res) { return ({ data: U.toHex(res) }); });
                            });
                        case "sendserial":
                            return hio.sendSerialAsync(U.fromHex(msg_1.arg.data), msg_1.arg.isError);
                        case "list":
                            return hid.getHF2DevicesAsync()
                                .then(function (devices) { return { devices: devices }; });
                        default:// unknown message
                            pxt.log("unknown hid message " + msg_1.op);
                            return null;
                    }
                })
                    .done(function (resp) {
                    if (!ws)
                        return;
                    pxt.debug("hid: resp " + objToString(resp));
                    ws.send(JSON.stringify({
                        op: msg_1.op,
                        id: msg_1.id,
                        result: resp
                    }));
                }, function (error) {
                    pxt.log("hid: error  " + error.message);
                    if (!ws)
                        return;
                    ws.send(JSON.stringify({
                        result: {
                            errorMessage: error.message || "Error",
                            errorStackTrace: error.stack,
                        },
                        op: msg_1.op,
                        id: msg_1.id
                    }));
                });
            }
            catch (e) {
                console.log("ws hid error", e.stack);
            }
        });
        ws.on('close', function (event) {
            console.log('ws hid connection closed');
            ws = null;
        });
        ws.on('error', function () {
            console.log('ws hid connection closed');
            ws = null;
        });
    }
    var openSockets = {};
    function startTCP(request, socket, body) {
        var ws = new WebSocket(request, socket, body);
        var netSockets = [];
        ws.on('open', function () {
            ws.send(JSON.stringify({ id: "ready" }));
        });
        ws.on('message', function (event) {
            try {
                var msg_2 = JSON.parse(event.data);
                pxt.debug("tcp: msg " + msg_2.op); // , objToString(msg.arg))
                Promise.resolve()
                    .then(function () {
                    var sock = openSockets[msg_2.arg.socket];
                    switch (msg_2.op) {
                        case "close":
                            sock.end();
                            var idx = netSockets.indexOf(sock);
                            if (idx >= 0)
                                netSockets.splice(idx, 1);
                            return {};
                        case "open":
                            return new Promise(function (resolve, reject) {
                                var newSock = new net.Socket();
                                netSockets.push(newSock);
                                var id = pxt.U.guidGen();
                                newSock.on('error', function (err) {
                                    if (ws)
                                        ws.send(JSON.stringify({ op: "error", result: { socket: id, error: err.message } }));
                                });
                                newSock.connect(msg_2.arg.port, msg_2.arg.host, function () {
                                    openSockets[id] = newSock;
                                    resolve({ socket: id });
                                });
                                newSock.on('data', function (d) {
                                    if (ws)
                                        ws.send(JSON.stringify({ op: "data", result: { socket: id, data: d.toString("base64"), encoding: "base64" } }));
                                });
                                newSock.on('close', function () {
                                    if (ws)
                                        ws.send(JSON.stringify({ op: "close", result: { socket: id } }));
                                });
                            });
                        case "send":
                            sock.write(Buffer.from(msg_2.arg.data, msg_2.arg.encoding || "utf8"));
                            return {};
                        default:// unknown message
                            pxt.log("unknown tcp message " + msg_2.op);
                            return null;
                    }
                })
                    .done(function (resp) {
                    if (!ws)
                        return;
                    pxt.debug("hid: resp " + objToString(resp));
                    ws.send(JSON.stringify({
                        op: msg_2.op,
                        id: msg_2.id,
                        result: resp
                    }));
                }, function (error) {
                    pxt.log("hid: error  " + error.message);
                    if (!ws)
                        return;
                    ws.send(JSON.stringify({
                        result: {
                            errorMessage: error.message || "Error",
                            errorStackTrace: error.stack,
                        },
                        op: msg_2.op,
                        id: msg_2.id
                    }));
                });
            }
            catch (e) {
                console.log("ws tcp error", e.stack);
            }
        });
        function closeAll() {
            console.log('ws tcp connection closed');
            ws = null;
            for (var _i = 0, netSockets_1 = netSockets; _i < netSockets_1.length; _i++) {
                var s = netSockets_1[_i];
                try {
                    s.end();
                }
                catch (e) { }
            }
        }
        ws.on('close', closeAll);
        ws.on('error', closeAll);
    }
    function startDebug(request, socket, body) {
        var ws = new WebSocket(request, socket, body);
        var dapjs;
        ws.on('open', function () {
            ws.send(JSON.stringify({ id: "ready" }));
        });
        ws.on('message', function (event) {
            try {
                var msg_3 = JSON.parse(event.data);
                if (!dapjs)
                    dapjs = require("dapjs");
                var toHandle_1 = msg_3.arg;
                toHandle_1.op = msg_3.op;
                console.log("DEBUGMSG", objToString(toHandle_1));
                Promise.resolve()
                    .then(function () { return dapjs.handleMessageAsync(toHandle_1); })
                    .then(function (resp) {
                    if (resp == null || typeof resp != "object")
                        resp = { response: resp };
                    console.log("DEBUGRESP", objToString(resp));
                    ws.send(JSON.stringify({
                        op: msg_3.op,
                        id: msg_3.id,
                        result: resp
                    }));
                }, function (error) {
                    console.log("DEBUGERR", error.stack);
                    ws.send(JSON.stringify({
                        result: {
                            errorMessage: error.message || "Error",
                            errorStackTrace: error.stack,
                        },
                        op: msg_3.op,
                        id: msg_3.id
                    }));
                });
            }
            catch (e) {
                console.log("ws debug error", e.stack);
            }
        });
        ws.on('close', function (event) {
            console.log('ws debug connection closed');
            ws = null;
        });
        ws.on('error', function () {
            console.log('ws debug connection closed');
            ws = null;
        });
    }
    var wsserver = http.createServer();
    wsserver.on('upgrade', function (request, socket, body) {
        try {
            if (WebSocket.isWebSocket(request)) {
                console.log('ws connection at ' + request.url);
                if (request.url == "/" + serveOptions.localToken + "/serial")
                    startSerial(request, socket, body);
                else if (request.url == "/" + serveOptions.localToken + "/debug")
                    startDebug(request, socket, body);
                else if (request.url == "/" + serveOptions.localToken + "/hid")
                    startHID(request, socket, body);
                else if (request.url == "/" + serveOptions.localToken + "/tcp")
                    startTCP(request, socket, body);
                else {
                    console.log('refused connection at ' + request.url);
                    socket.close(403);
                }
            }
        }
        catch (e) {
            console.log('upgrade failed...');
        }
    });
    return new Promise(function (resolve, reject) {
        wsserver.on("Error", reject);
        wsserver.listen(wsPort, hostname, function () { return resolve(); });
    });
}
function sendSerialMsg(msg) {
    //console.log('sending ' + msg);
    wsSerialClients.forEach(function (client) {
        client.send(msg);
    });
}
function initSerialMonitor() {
    // TODO HID
}
// can use http://localhost:3232/streams/nnngzlzxslfu for testing
function streamPageTestAsync(id) {
    return Cloud.privateGetAsync(id)
        .then(function (info) {
        var html = pxt.docs.renderMarkdown({
            template: expandDocFileTemplate("stream.html"),
            markdown: "",
            theme: pxt.appTarget.appTheme,
            pubinfo: info,
            filepath: "/" + id
        });
        return html;
    });
}
function certificateTestAsync() {
    return Promise.resolve(expandDocFileTemplate("certificates.html"));
}
// use http://localhost:3232/45912-50568-62072-42379 for testing
function scriptPageTestAsync(id) {
    return Cloud.privateGetAsync(id)
        .then(function (info) {
        // if running against old cloud, infer 'thumb' field
        // can be removed after new cloud deployment
        if (info.thumb !== undefined)
            return info;
        return Cloud.privateGetTextAsync(id + "/thumb")
            .then(function (_) {
            info.thumb = true;
            return info;
        }, function (_) {
            info.thumb = false;
            return info;
        });
    })
        .then(function (info) {
        var infoA = info;
        infoA.cardLogo = info.thumb
            ? Cloud.apiRoot + id + "/thumb"
            : pxt.appTarget.appTheme.thumbLogo || pxt.appTarget.appTheme.cardLogo;
        var html = pxt.docs.renderMarkdown({
            template: expandDocFileTemplate(pxt.appTarget.appTheme.leanShare
                ? "leanscript.html" : "script.html"),
            markdown: "",
            theme: pxt.appTarget.appTheme,
            pubinfo: info,
            filepath: "/" + id
        });
        return html;
    });
}
// use http://localhost:3232/pkg/microsoft/pxt-neopixel for testing
function pkgPageTestAsync(id) {
    return pxt.packagesConfigAsync()
        .then(function (config) { return pxt.github.repoAsync(id, config); })
        .then(function (repo) {
        if (!repo)
            return "Not found";
        return Cloud.privateGetAsync("gh/" + id + "/text")
            .then(function (files) {
            var info = JSON.parse(files["pxt.json"]);
            info["slug"] = id;
            info["id"] = "gh/" + id;
            if (repo.status == pxt.github.GitRepoStatus.Approved)
                info["official"] = "yes";
            else
                info["official"] = "";
            var html = pxt.docs.renderMarkdown({
                template: expandDocFileTemplate("package.html"),
                markdown: files["README.md"] || "No `README.md`",
                theme: pxt.appTarget.appTheme,
                pubinfo: info,
                filepath: "/pkg/" + id,
                repo: { name: repo.name, fullName: repo.fullName, tag: "v" + info.version }
            });
            return html;
        });
    });
}
function readMd(pathname) {
    var content = nodeutil.resolveMd(root, pathname);
    if (content)
        return content;
    return "# Not found " + pathname + "\nChecked:\n" + [docsDir].concat(dirs).concat(nodeutil.lastResolveMdDirs).map(function (s) { return "* ``" + s + "``\n"; }).join("");
}
function resolveTOC(pathname) {
    // find summary.md
    var summarydir = pathname.replace(/^\//, '');
    var presummarydir = "";
    while (summarydir !== presummarydir) {
        var summaryf = path.join(summarydir, "SUMMARY");
        // find "closest summary"
        var summaryMd = nodeutil.resolveMd(root, summaryf);
        if (summaryMd) {
            try {
                return pxt.docs.buildTOC(summaryMd);
            }
            catch (e) {
                pxt.log("invalid " + summaryf + " format - " + e.message);
                pxt.log(e.stack);
            }
            break;
        }
        presummarydir = summarydir;
        summarydir = path.dirname(summarydir);
    }
    // not found
    pxt.log("SUMMARY.md not found");
    return undefined;
}
var compiledCache = {};
function compileScriptAsync(id) {
    return __awaiter(this, void 0, void 0, function () {
        var scrText, res, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (compiledCache[id])
                        return [2 /*return*/, compiledCache[id]];
                    return [4 /*yield*/, Cloud.privateGetAsync(id + "/text")];
                case 1:
                    scrText = _a.sent();
                    return [4 /*yield*/, pxt.simpleCompileAsync(scrText, {})];
                case 2:
                    res = _a.sent();
                    r = "";
                    if (res.errors)
                        r = "throw new Error(" + JSON.stringify(res.errors) + ")";
                    else
                        r = res.outfiles["binary.js"];
                    compiledCache[id] = r;
                    return [2 /*return*/, r];
            }
        });
    });
}
exports.compileScriptAsync = compileScriptAsync;
function serveAsync(options) {
    serveOptions = options;
    if (!serveOptions.port)
        serveOptions.port = 3232;
    if (!serveOptions.wsPort)
        serveOptions.wsPort = 3233;
    if (!serveOptions.hostname)
        serveOptions.hostname = "localhost";
    setupRootDir();
    var wsServerPromise = initSocketServer(serveOptions.wsPort, serveOptions.hostname);
    if (serveOptions.serial)
        initSerialMonitor();
    var server = http.createServer(function (req, res) {
        var error = function (code, msg) {
            if (msg === void 0) { msg = null; }
            res.writeHead(code, { "Content-Type": "text/plain" });
            res.end(msg || "Error " + code);
        };
        var sendJson = function (v) {
            if (typeof v == "string") {
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf8' });
                res.end(v);
            }
            else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf8' });
                res.end(JSON.stringify(v));
            }
        };
        var sendHtml = function (s, code) {
            if (code === void 0) { code = 200; }
            res.writeHead(code, { 'Content-Type': 'text/html; charset=utf8' });
            res.end(s);
        };
        var sendFile = function (filename) {
            try {
                var stat = fs.statSync(filename);
                res.writeHead(200, {
                    'Content-Type': U.getMime(filename),
                    'Content-Length': stat.size
                });
                fs.createReadStream(filename).pipe(res);
            }
            catch (e) {
                error(404, "File missing: " + filename);
            }
        };
        var pathname = decodeURI(url.parse(req.url).pathname);
        if (pathname == "/") {
            res.writeHead(301, { location: '/index.html' });
            res.end();
            return;
        }
        var elts = pathname.split("/").filter(function (s) { return !!s; });
        if (elts.some(function (s) { return s[0] == "."; })) {
            return error(400, "Bad path :-(\n");
        }
        if (elts[0] == "api") {
            if (elts[1] == "streams") {
                var trg = Cloud.apiRoot + req.url.slice(5);
                res.setHeader("Location", trg);
                error(302, "Redir: " + trg);
                return;
            }
            if (/^\d\d\d[\d\-]*$/.test(elts[1]) && elts[2] == "js") {
                return compileScriptAsync(elts[1])
                    .then(function (data) {
                    res.writeHead(200, { 'Content-Type': 'application/javascript' });
                    res.end(data);
                }, function (err) {
                    error(500);
                    console.log(err.stack);
                });
            }
            if (!isAuthorizedLocalRequest(req)) {
                error(403);
                return null;
            }
            return handleApiAsync(req, res, elts)
                .then(sendJson, function (err) {
                if (err.statusCode) {
                    error(err.statusCode, err.message || "");
                    console.log("Error " + err.statusCode);
                }
                else {
                    error(500);
                    console.log(err.stack);
                }
            });
        }
        if (elts[0] == "icon") {
            var name_1 = path.join(userProjectsDir, elts[1], "icon.jpeg");
            return existsAsync(name_1)
                .then(function (exists) { return exists ? sendFile(name_1) : error(404); });
        }
        if (elts[0] == "assets") {
            if (/^[a-z0-9\-_]/.test(elts[1]) && !/[\/\\]/.test(elts[1]) && !/^[.]/.test(elts[2])) {
                var filename = path.join(userProjectsDir, elts[1], "assets", elts[2]);
                if (nodeutil.fileExistsSync(filename)) {
                    return sendFile(filename);
                }
                else {
                    return error(404, "Asset not found");
                }
            }
            else {
                return error(400, "Invalid asset path");
            }
        }
        if (options.packaged) {
            var filename = path.resolve(path.join(packagedDir, pathname));
            if (nodeutil.fileExistsSync(filename)) {
                return sendFile(filename);
            }
            else {
                return error(404, "Packaged file not found");
            }
        }
        if (pathname.slice(0, pxt.appTarget.id.length + 2) == "/" + pxt.appTarget.id + "/") {
            res.writeHead(301, { location: req.url.slice(pxt.appTarget.id.length + 1) });
            res.end();
            return;
        }
        var publicDir = path.join(nodeutil.pxtCoreDir, "webapp/public");
        if (pathname == "/--embed") {
            sendFile(path.join(publicDir, 'embed.js'));
            return;
        }
        if (pathname == "/--run") {
            sendFile(path.join(publicDir, 'run.html'));
            return;
        }
        if (/\/-[-]*docs.*$/.test(pathname)) {
            sendFile(path.join(publicDir, 'docs.html'));
            return;
        }
        if (pathname == "/--codeembed") {
            // http://localhost:3232/--codeembed#pub:20467-26471-70207-51013
            sendFile(path.join(publicDir, 'codeembed.html'));
            return;
        }
        if (/^\/(\d\d\d\d[\d-]+)$/.test(pathname)) {
            scriptPageTestAsync(pathname.slice(1))
                .then(sendHtml);
            return;
        }
        if (/^\/(pkg|package)\/.*$/.test(pathname)) {
            pkgPageTestAsync(pathname.replace(/^\/[^\/]+\//, ""))
                .then(sendHtml);
            return;
        }
        if (elts[0] == "streams") {
            streamPageTestAsync(elts[0] + "/" + elts[1])
                .then(sendHtml);
            return;
        }
        if (elts[0] == "certificates") {
            certificateTestAsync().then(sendHtml);
            return;
        }
        if (/\.js\.map$/.test(pathname)) {
            error(404, "map files disabled");
        }
        var dd = dirs;
        var mm = /^\/(cdn|parts|sim|doccdn|blb)(\/.*)/.exec(pathname);
        if (mm) {
            pathname = mm[2];
        }
        else if (U.startsWith(pathname, "/docfiles/")) {
            pathname = pathname.slice(10);
            dd = docfilesdirs;
        }
        for (var _i = 0, dd_1 = dd; _i < dd_1.length; _i++) {
            var dir = dd_1[_i];
            var filename = path.resolve(path.join(dir, pathname));
            if (nodeutil.fileExistsSync(filename)) {
                sendFile(filename);
                return;
            }
        }
        if (/simulator\.html/.test(pathname)) {
            // Special handling for missing simulator: redirect to the live sim
            res.writeHead(302, { location: "https://trg-" + pxt.appTarget.id + ".userpxt.io/---simulator" });
            res.end();
            return;
        }
        // redirect
        var redirectFile = path.join(docsDir, pathname + "-ref.json");
        if (nodeutil.fileExistsSync(redirectFile)) {
            var redir = nodeutil.readJson(redirectFile);
            res.writeHead(301, { location: redir["redirect"] });
            res.end();
            return;
        }
        var webFile = path.join(docsDir, pathname);
        if (!nodeutil.fileExistsSync(webFile)) {
            if (nodeutil.fileExistsSync(webFile + ".html")) {
                webFile += ".html";
                pathname += ".html";
            }
            else {
                webFile = "";
            }
        }
        if (webFile) {
            if (/\.html$/.test(webFile)) {
                var html = expandHtml(fs.readFileSync(webFile, "utf8"));
                sendHtml(html);
            }
            else {
                sendFile(webFile);
            }
        }
        else {
            var m = /^\/(v\d+)(.*)/.exec(pathname);
            if (m)
                pathname = m[2];
            var md = readMd(pathname);
            var mdopts = {
                template: expandDocFileTemplate("docs.html"),
                markdown: md,
                theme: pxt.appTarget.appTheme,
                filepath: pathname,
                TOC: resolveTOC(pathname)
            };
            var html = pxt.docs.renderMarkdown(mdopts);
            sendHtml(html, U.startsWith(md, "# Not found") ? 404 : 200);
        }
        return;
    });
    // if user has a server.js file, require it
    var serverjs = path.resolve(path.join(root, 'built', 'server.js'));
    if (nodeutil.fileExistsSync(serverjs)) {
        console.log('loading ' + serverjs);
        /* tslint:disable:non-literal-require */
        require(serverjs);
        /* tslint:disable:non-literal-require */
    }
    var serverPromise = new Promise(function (resolve, reject) {
        server.on("error", reject);
        server.listen(serveOptions.port, serveOptions.hostname, function () { return resolve(); });
    });
    return Promise.all([wsServerPromise, serverPromise])
        .then(function () {
        /* tslint:disable:no-http-string */
        var start = "http://" + serveOptions.hostname + ":" + serveOptions.port + "/#local_token=" + options.localToken + "&wsport=" + serveOptions.wsPort;
        /* tslint:enable:no-http-string */
        console.log("---------------------------------------------");
        console.log("");
        console.log("To launch the editor, open this URL:");
        console.log(start);
        console.log("");
        console.log("---------------------------------------------");
        if (options.autoStart) {
            nodeutil.openUrl(start, options.browser);
        }
    });
}
exports.serveAsync = serveAsync;
