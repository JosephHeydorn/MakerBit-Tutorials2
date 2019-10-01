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
var path = require("path");
var nodeutil = require("./nodeutil");
var child_process = require("child_process");
var fs = require("fs");
var buildengine = require("./buildengine");
var U = pxt.Util;
var openAsync = Promise.promisify(fs.open);
var closeAsync = Promise.promisify(fs.close);
var writeAsync = Promise.promisify(fs.write);
var gdbServer;
var bmpMode = false;
var execAsync = Promise.promisify(child_process.exec);
function getBMPSerialPortsAsync() {
    if (process.platform == "win32") {
        return execAsync("wmic PATH Win32_SerialPort get DeviceID, PNPDeviceID")
            .then(function (buf) {
            var res = [];
            buf.toString("utf8").split(/\n/).forEach(function (ln) {
                var m = /^(COM\d+)\s+USB\\VID_(\w+)&PID_(\w+)&MI_(\w+)/.exec(ln);
                if (m) {
                    var comp = m[1];
                    var vid = parseInt(m[2], 16);
                    var pid = parseInt(m[3], 16);
                    var mi = parseInt(m[4], 16);
                    if (vid == 0x1d50 && pid == 0x6018 && mi == 0) {
                        res.push("\\\\.\\" + comp);
                    }
                }
            });
            return res;
        });
    }
    else if (process.platform == "darwin") {
        return execAsync("ioreg -p IOUSB -l -w 0")
            .then(function (buf) {
            var res = [];
            var inBMP = false;
            buf.toString("utf8").split(/\n/).forEach(function (ln) {
                if (ln.indexOf("+-o Black Magic Probe") >= 0)
                    inBMP = true;
                if (!inBMP)
                    return;
                var m = /"USB Serial Number" = "(\w+)"/.exec(ln);
                if (m) {
                    inBMP = false;
                    res.push("/dev/cu.usbmodem" + m[1] + "1");
                }
            });
            return res;
        });
    }
    else if (process.platform == "linux") {
        // TODO
        return Promise.resolve([]);
    }
    else {
        return Promise.resolve([]);
    }
}
var SerialIO = /** @class */ (function () {
    function SerialIO(comName) {
        this.comName = comName;
        this.id = 0;
        this.trace = false;
    }
    SerialIO.prototype.connectAsync = function () {
        var _this = this;
        return this.disconnectAsync()
            .then(function () {
            pxt.log("open GDB at " + _this.comName);
            return openAsync(_this.comName, "r+");
        })
            .then(function (fd) {
            _this.fd = fd;
            var id = ++_this.id;
            var buf = Buffer.alloc(128);
            var loop = function () { return fs.read(fd, buf, 0, buf.length, null, function (err, nb, buf) {
                if (_this.id != id)
                    return;
                if (nb > 0) {
                    var bb = buf.slice(0, nb);
                    if (_this.trace)
                        pxt.log("R:" + bb.toString("utf8"));
                    if (_this.onData)
                        _this.onData(bb);
                    loop();
                }
                else {
                    var msg = "GDB read error, nb=" + nb + (err ? err.message : "no err");
                    if (_this.trace)
                        pxt.log(msg);
                    else
                        pxt.debug(msg);
                    setTimeout(loop, 500);
                }
            }); };
            loop();
        });
    };
    SerialIO.prototype.sendPacketAsync = function (pkt) {
        if (this.trace)
            pxt.log("W:" + Buffer.from(pkt).toString("utf8"));
        return writeAsync(this.fd, pkt)
            .then(function () { });
    };
    SerialIO.prototype.error = function (msg) {
        pxt.log(this.comName + ": " + msg);
    };
    SerialIO.prototype.disconnectAsync = function () {
        if (this.fd == null)
            return Promise.resolve();
        this.id++;
        var f = this.fd;
        this.fd = null;
        pxt.log("close GDB at " + this.comName);
        // try to elicit some response from the server, so that the read loop is tickled
        // and stops; without this the close() below hangs
        fs.write(f, "$?#78", function () { });
        return closeAsync(f)
            .then(function () {
        });
    };
    return SerialIO;
}());
function fatal(msg) {
    U.userError(msg);
}
function getOpenOcdPath(cmds) {
    if (cmds === void 0) { cmds = ""; }
    function latest(tool) {
        var dir = path.join(pkgDir, "tools/", tool, "/");
        if (!fs.existsSync(dir))
            fatal(dir + " doesn't exists; " + tool + " not installed in Arduino?");
        var subdirs = fs.readdirSync(dir);
        if (!subdirs.length)
            fatal("no sub-directories in " + dir);
        subdirs.sort(pxt.semver.strcmp);
        subdirs.reverse();
        var thePath = path.join(dir, subdirs[0], "/");
        if (!fs.existsSync(thePath + "bin"))
            fatal("missing bindir in " + thePath);
        return thePath;
    }
    var dirs = [
        process.env["HOME"] + "/Library/Arduino",
        process.env["USERPROFILE"] + "/AppData/Local/Arduino",
        process.env["USERPROFILE"] + "/AppData/Local/Arduino15",
        process.env["HOME"] + "/.arduino",
    ];
    var pkgDir = "";
    var openocdPath = "";
    var openocdBin = "";
    var gccPath = "";
    var gdbBin = "";
    if (fs.existsSync("/usr/bin/openocd")) {
        openocdPath = "/usr/";
        gccPath = "/usr/";
    }
    else if (fs.existsSync("/usr/local/bin/openocd")) {
        openocdPath = "/usr/local/";
        gccPath = "/usr/local/";
    }
    else {
        for (var ardV = 15; ardV < 50; ++ardV) {
            for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
                var d = dirs_1[_i];
                pkgDir = path.join(d + ardV, "/packages/arduino/");
                if (fs.existsSync(pkgDir))
                    break;
                pkgDir = "";
            }
            if (pkgDir)
                break;
        }
        if (!pkgDir)
            fatal("cannot find Arduino packages directory");
        openocdPath = bmpMode ? "" : latest("openocd");
        gccPath = latest("arm-none-eabi-gcc");
    }
    openocdBin = path.join(openocdPath, "bin/openocd");
    if (process.platform == "win32")
        openocdBin += ".exe";
    var script = bmpMode ? "N/A" : pxt.appTarget.compile.openocdScript;
    if (!script)
        fatal("no openocdScript in pxtarget.json");
    if (!cmds)
        cmds = "\ngdb_port pipe\ngdb_memory_map disable\n\n$_TARGETNAME configure -event gdb-attach {\n    echo \"Halting target\"\n    halt\n}\n\n$_TARGETNAME configure -event gdb-detach {\n    echo \"Resetting target\"\n    reset\n}";
    fs.writeFileSync("built/debug.cfg", "\nlog_output built/openocd.log\n" + script + "\n" + cmds + "\n");
    var args = [openocdBin, "-d2",
        "-s", path.join(openocdPath, "share/openocd/scripts/"),
        "-f", "built/debug.cfg"];
    gdbBin = path.join(gccPath, "bin/arm-none-eabi-gdb");
    if (process.platform == "win32")
        gdbBin += ".exe";
    return { args: args, gdbBin: gdbBin };
}
function codalBin() {
    var cs = pxt.appTarget.compileService;
    return buildengine.thisBuild.buildPath + "/build/" + (cs.codalBinary ? cs.codalBinary :
        cs.yottaTarget + "/source/" + cs.yottaBinary.replace(/\.hex$/, "").replace(/-combined$/, ""));
}
var cachedMap = "";
var addrCache;
function getMap() {
    if (!cachedMap)
        cachedMap = fs.readFileSync(codalBin() + ".map", "utf8");
    return cachedMap;
}
function mangle(symbolName) {
    var m = /(.*)::(.*)/.exec(symbolName);
    if (m)
        return "_ZN" + m[1].length + m[1] + "L" + m[2].length + m[2] + "E";
    return "_ZL" + symbolName.length + symbolName;
}
function findAddr(symbolName, opt) {
    if (opt === void 0) { opt = false; }
    if (!addrCache) {
        addrCache = {};
        var bss = "";
        for (var _i = 0, _a = getMap().split(/\n/); _i < _a.length; _i++) {
            var line = _a[_i];
            line = line.trim();
            var m = /^\.bss\.(\w+)/.exec(line);
            if (m)
                bss = m[1];
            m = /0x0000000([0-9a-f]+)(\s+([:\w]+)\s*(= .*)?)?/.exec(line);
            if (m) {
                var addr_1 = parseInt(m[1], 16);
                if (m[3])
                    addrCache[m[3]] = addr_1;
                if (bss) {
                    addrCache[bss] = addr_1;
                    bss = "";
                }
            }
        }
    }
    var addr = addrCache[symbolName];
    if (!addr)
        addr = addrCache[mangle(symbolName)];
    if (addr) {
        return addr;
    }
    else {
        if (!opt)
            fatal("Can't find " + symbolName + " symbol in map");
        return null;
    }
}
function initGdbServerAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var ports;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getBMPSerialPortsAsync()];
                case 1:
                    ports = _a.sent();
                    if (ports.length == 0) {
                        pxt.log("Black Magic Probe not detected; falling back to openocd");
                        return [2 /*return*/];
                    }
                    bmpMode = true;
                    pxt.log("detected Black Magic Probe at " + ports[0]);
                    gdbServer = new pxt.GDBServer(new SerialIO(ports[0]));
                    // gdbServer.trace = true
                    return [4 /*yield*/, gdbServer.io.connectAsync()];
                case 2:
                    // gdbServer.trace = true
                    _a.sent();
                    return [4 /*yield*/, gdbServer.initAsync()];
                case 3:
                    _a.sent();
                    pxt.log(gdbServer.targetInfo);
                    nodeutil.addCliFinalizer(function () {
                        if (!gdbServer)
                            return Promise.resolve();
                        var g = gdbServer;
                        gdbServer = null;
                        return g.io.disconnectAsync();
                    });
                    return [2 /*return*/];
            }
        });
    });
}
function getMemoryAsync(addr, bytes) {
    return __awaiter(this, void 0, void 0, function () {
        var toolPaths, oargs, res, buf, _i, _a, line, m;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (gdbServer) {
                        return [2 /*return*/, gdbServer.readMemAsync(addr, bytes)
                                .then(function (b) { return Buffer.from(b); })];
                    }
                    toolPaths = getOpenOcdPath("\ninit\nhalt\nset M(0) 0\nmem2array M 32 " + addr + " " + ((bytes + 3) >> 2) + "\nresume\nparray M\nshutdown\n");
                    oargs = toolPaths.args;
                    return [4 /*yield*/, nodeutil.spawnWithPipeAsync({
                            cmd: oargs[0],
                            args: oargs.slice(1),
                            silent: true
                        })];
                case 1:
                    res = _b.sent();
                    buf = Buffer.alloc(bytes);
                    for (_i = 0, _a = res.toString("utf8").split(/\r?\n/); _i < _a.length; _i++) {
                        line = _a[_i];
                        m = /^M\((\d+)\)\s*=\s*(\d+)/.exec(line);
                        if (m) {
                            pxt.HF2.write32(buf, parseInt(m[1]) << 2, parseInt(m[2]));
                        }
                    }
                    return [2 /*return*/, buf];
            }
        });
    });
}
function hex(n) {
    return "0x" + n.toString(16);
}
var FREE_MASK = 0x80000000;
var ARRAY_MASK = 0x40000000;
var PERMA_MASK = 0x20000000;
var MARKED_MASK = 0x00000001;
var ANY_MARKED_MASK = 0x00000003;
function VAR_BLOCK_WORDS(vt) {
    return (((vt) << 12) >> (12 + 2));
}
function dumpheapAsync() {
    return __awaiter(this, void 0, void 0, function () {
        function mark(src, r) {
            if (typeof r == "string" && U.startsWith(r, "0x2")) {
                var o = objects[r];
                if (o) {
                    if (!o.incoming) {
                        o.incoming = [src];
                        for (var _i = 0, _a = U.values(o.fields); _i < _a.length; _i++) {
                            var f = _a[_i];
                            mark(r, f);
                        }
                    }
                    else {
                        o.incoming.push(src);
                    }
                }
                else {
                    objects[r] = {
                        addr: r,
                        size: -1,
                        tag: "missing",
                        incoming: [src],
                        fields: {}
                    };
                }
            }
        }
        function getRoots(start, len, encoded) {
            if (encoded === void 0) { encoded = false; }
            var refs = [];
            for (var i = 0; i < len; ++i) {
                var addr = start + i * 4;
                if (encoded) {
                    var v = read32(addr);
                    if (v & 1)
                        addr = v & ~1;
                }
                refs.push(readRef(addr));
            }
            return refs;
        }
        function readRef(addr) {
            var v = read32(addr);
            if (!v)
                return "undefined";
            if (v & 1) {
                if (0x8000000 <= v && v <= 0x80f0000)
                    return hex(v);
                return v >> 1;
            }
            if (v & 2) {
                if (v == pxtc.taggedFalse)
                    return "false";
                if (v == pxtc.taggedTrue)
                    return "true";
                if (v == pxtc.taggedNaN)
                    return "NaN";
                if (v == pxtc.taggedNull)
                    return "null";
                return "tagged_" + v;
            }
            return hex(v);
        }
        function read32(addr) {
            if (addr >= memStart)
                return pxt.HF2.read32(mem, addr - memStart);
            var r = pxtc.UF2.readBytes(uf2, addr, 4);
            if (r && r.length == 4)
                return pxt.HF2.read32(r, 0);
            U.userError("can't read memory at " + addr);
            return 0;
        }
        function getDmesg() {
            var addr = findAddr("codalLogStore");
            var start = addr + 4 - memStart;
            for (var i = 0; i < 1024; ++i) {
                if (i == 1023 || mem[start + i] == 0)
                    return mem.slice(start, start + i).toString("utf8");
            }
            return "";
        }
        function classifyCPP(block, blockSize) {
            var w0 = read32(block + 4);
            var w1 = read32(block + 8);
            var hx = hex(w0);
            var classification = pointerClassification[hex(block + 4)];
            if (!classification)
                classification = vtablePtrs[hx];
            if (!classification) {
                if (blockSize == 1312 / 4)
                    classification = "ST7735WorkBuffer";
                else if (blockSize == 1184 / 4)
                    classification = "ZPWM_buffer";
                else if (w0 & 1 && (w0 >> 16) == 2)
                    classification = "codal::BufferData";
                else
                    classification = "?"; // hx
            }
            return classification;
        }
        var memStart, memEnd, mem, heapDesc, m, heapSz, heapNum, vtablePtrs, pointerClassification, numFibers, numListeners, _i, _a, q, addr, ptr, messageBus, ptr, ptr, ptr, cnts, fiberSize, i, heapStart, heapEnd, block, totalFreeBlock, totalUsedBlock, bp, blockSize, isFree, classification, mark_1, keys, _b, keys_1, k, uf2, currClass, classMap, inIface, classInfo, _c, _d, line, m_1, objects, byCategory, numByCategory, maxFree, string_inline_ascii_vt, string_inline_utf8_vt, string_cons_vt, string_skiplist16_vt, gcHeap, heapSize, objPtr, heapEnd, fields, vtable, numbytes, category, addWords, classification, vt0, objectType, classNoEtc, classNo, word0, tmp, len, i, i, i, cinfo, i, i, numwords, obj, cats, fidx, _e, cats_1, c, dmesg, roots, _f, _g, rootId, _h, _j, f, unreachable, _k, _l, o, dgml, _m, _o, addr, obj, _p, _q, addr, obj, _r, _s, fieldaddr, field;
        return __generator(this, function (_t) {
            switch (_t.label) {
                case 0: return [4 /*yield*/, initGdbServerAsync()];
                case 1:
                    _t.sent();
                    memStart = findAddr("_sdata", true) || findAddr("__data_start__");
                    memEnd = findAddr("_estack", true) || findAddr("__StackTop");
                    console.log("memory: " + hex(memStart) + " - " + hex(memEnd));
                    return [4 /*yield*/, getMemoryAsync(memStart, memEnd - memStart)];
                case 2:
                    mem = _t.sent();
                    heapDesc = findAddr("heap");
                    m = /\.bss\.heap\s+0x000000[a-f0-9]+\s+0x([a-f0-9]+)/.exec(getMap());
                    heapSz = 8;
                    heapNum = parseInt(m[1], 16) / heapSz;
                    vtablePtrs = {};
                    getMap().replace(/0x0000000([0-9a-f]+)\s+vtable for (.*)/g, function (f, a, cl) {
                        var n = parseInt(a, 16);
                        vtablePtrs[hex(n)] = cl;
                        vtablePtrs[hex(n + 4)] = cl;
                        vtablePtrs[hex(n + 8)] = cl;
                        vtablePtrs[hex(n + 16)] = cl;
                        vtablePtrs[hex(n + 20)] = cl;
                        return "";
                    });
                    pointerClassification = {};
                    numFibers = 0;
                    numListeners = 0;
                    for (_i = 0, _a = ["runQueue", "sleepQueue", "waitQueue", "fiberPool", "idleFiber"]; _i < _a.length; _i++) {
                        q = _a[_i];
                        addr = findAddr("codal::" + q, true) || findAddr(q);
                        for (ptr = read32(addr); ptr; ptr = read32(ptr + 6 * 4)) {
                            pointerClassification[hex(ptr)] = "Fiber/" + q;
                            pointerClassification[hex(read32(ptr))] = "Fiber/TCB/" + q;
                            pointerClassification[hex(read32(ptr + 4))] = "Fiber/Stack/" + q;
                            pointerClassification[hex(read32(ptr + 8 * 4))] = "Fiber/PXT/" + q;
                            if (q == "idleFiber")
                                break;
                            numFibers++;
                        }
                    }
                    messageBus = read32(findAddr("codal::EventModel::defaultEventBus", true));
                    if (messageBus) {
                        for (ptr = read32(messageBus + 20); ptr; ptr = read32(ptr + 36)) {
                            numListeners++;
                            pointerClassification[hex(ptr)] = "codal::Listener";
                        }
                        for (ptr = read32(messageBus + 24); ptr; ptr = read32(ptr + 16)) {
                            pointerClassification[hex(ptr)] = "codal::EventQueueItem";
                        }
                        for (ptr = read32(findAddr("pxt::handlerBindings")); ptr; ptr = read32(ptr)) {
                            pointerClassification[hex(ptr)] = "pxt::HandlerBinding";
                        }
                    }
                    console.log("heaps at " + hex(heapDesc) + ", num=" + heapNum);
                    cnts = {};
                    fiberSize = 0;
                    for (i = 0; i < heapNum; ++i) {
                        heapStart = read32(heapDesc + i * heapSz);
                        heapEnd = read32(heapDesc + i * heapSz + 4);
                        console.log("*** heap " + hex(heapStart) + " " + (heapEnd - heapStart) + " bytes");
                        block = heapStart;
                        totalFreeBlock = 0;
                        totalUsedBlock = 0;
                        while (block < heapEnd) {
                            bp = read32(block);
                            blockSize = bp & 0x7fffffff;
                            isFree = (bp & 0x80000000) != 0;
                            classification = classifyCPP(block, blockSize);
                            if (U.startsWith(classification, "Fiber/"))
                                fiberSize += blockSize * 4;
                            mark_1 = "[" + (isFree ? "F" : "U") + ":" + blockSize * 4 + " / " + classification + "]";
                            if (!cnts[mark_1])
                                cnts[mark_1] = 0;
                            cnts[mark_1] += blockSize * 4;
                            if (isFree)
                                totalFreeBlock += blockSize;
                            else
                                totalUsedBlock += blockSize;
                            block += blockSize * 4;
                        }
                        console.log("free: " + totalFreeBlock * 4);
                    }
                    {
                        keys = Object.keys(cnts);
                        keys.sort(function (a, b) { return cnts[b] - cnts[a]; });
                        for (_b = 0, keys_1 = keys; _b < keys_1.length; _b++) {
                            k = keys_1[_b];
                            console.log(cnts[k] + "\t" + k);
                        }
                    }
                    uf2 = pxtc.UF2.parseFile(new Uint8Array(fs.readFileSync("built/binary.uf2")));
                    currClass = "";
                    classMap = {};
                    inIface = false;
                    for (_c = 0, _d = fs.readFileSync("built/binary.asm", "utf8").split(/\n/); _c < _d.length; _c++) {
                        line = _d[_c];
                        m_1 = /(\w+)__C\d+_VT:/.exec(line);
                        if (m_1)
                            currClass = m_1[1];
                        m_1 = /\w+__C\d+_IfaceVT:/.exec(line);
                        if (m_1)
                            inIface = true;
                        m_1 = /(\d+)\s+;\s+class-id/.exec(line);
                        if (currClass && m_1) {
                            classInfo = {
                                name: currClass,
                                fields: []
                            };
                            classMap[m_1[1]] = classInfo;
                            currClass = "";
                        }
                        if (inIface) {
                            m_1 = /\.short \d+, (\d+) ; (.*)/.exec(line);
                            if (m_1) {
                                if (m_1[2] == "the end") {
                                    inIface = false;
                                }
                                else if (m_1[1] != "0") {
                                    classInfo.fields.push(m_1[2]);
                                }
                            }
                        }
                    }
                    objects = {};
                    byCategory = {};
                    numByCategory = {};
                    maxFree = 0;
                    string_inline_ascii_vt = findAddr("pxt::string_inline_ascii_vt");
                    string_inline_utf8_vt = findAddr("pxt::string_inline_utf8_vt");
                    string_cons_vt = findAddr("pxt::string_cons_vt");
                    string_skiplist16_vt = findAddr("pxt::string_skiplist16_vt");
                    /*
                    struct VTable {
                        uint16_t numbytes;
                        ValType objectType;
                        uint8_t magic;
                        PVoid *ifaceTable;
                        BuiltInType classNo;
                    };
                    */
                    for (gcHeap = read32(findAddr("pxt::firstBlock")); gcHeap; gcHeap = read32(gcHeap)) {
                        heapSize = read32(gcHeap + 4);
                        console.log("*** GC heap " + hex(gcHeap) + " size=" + heapSize);
                        objPtr = gcHeap + 8;
                        heapEnd = objPtr + heapSize;
                        fields = void 0;
                        while (objPtr < heapEnd) {
                            vtable = read32(objPtr);
                            numbytes = 0;
                            category = "";
                            addWords = 0;
                            fields = {};
                            if (vtable & FREE_MASK) {
                                category = "free";
                                numbytes = VAR_BLOCK_WORDS(vtable) << 2;
                                maxFree = Math.max(numbytes, maxFree);
                            }
                            else if (vtable & ARRAY_MASK) {
                                numbytes = VAR_BLOCK_WORDS(vtable) << 2;
                                category = "arraybuffer sz=" + (numbytes >> 2);
                                if (vtable & PERMA_MASK) {
                                    category = "app_alloc sz=" + numbytes;
                                    classification = classifyCPP(objPtr, numbytes >> 2);
                                    if (classification != "?")
                                        category = classification;
                                    if (U.startsWith(classification, "Fiber/"))
                                        fiberSize += numbytes;
                                }
                                else
                                    category = "arraybuffer sz=" + (numbytes >> 2);
                            }
                            else {
                                vtable &= ~ANY_MARKED_MASK;
                                vt0 = read32(vtable);
                                if ((vt0 >>> 24) != pxt.VTABLE_MAGIC) {
                                    console.log("Invalid vtable: at " + hex(objPtr) + " *" + hex(vtable) + " = " + hex(vt0));
                                    break;
                                }
                                numbytes = vt0 & 0xffff;
                                objectType = (vt0 >> 16) & 0xff;
                                classNoEtc = read32(vtable + 8);
                                classNo = classNoEtc & 0xffff;
                                word0 = read32(objPtr + 4);
                                tmp = 0;
                                len = 0;
                                switch (classNo) {
                                    case pxt.BuiltInType.BoxedString:
                                        if (vtable == string_inline_ascii_vt) {
                                            category = "ascii_string";
                                            numbytes = 4 + 2 + (word0 & 0xffff) + 1;
                                        }
                                        else if (vtable == string_inline_utf8_vt) {
                                            category = "utf8_string";
                                            numbytes = 4 + 2 + (word0 & 0xffff) + 1;
                                        }
                                        else if (vtable == string_skiplist16_vt) {
                                            category = "skip_string";
                                            numbytes = 4 + 2 + 2 + 4;
                                            fields[".data"] = hex(read32(objPtr + 8) - 4);
                                        }
                                        else if (vtable == string_cons_vt) {
                                            category = "cons_string";
                                            numbytes = 4 + 4 + 4;
                                            fields["left"] = hex(read32(objPtr + 4));
                                            fields["right"] = hex(read32(objPtr + 8));
                                        }
                                        else {
                                            console.log("Invalid string vtable: " + hex(vtable));
                                            break;
                                        }
                                        break;
                                    case pxt.BuiltInType.BoxedBuffer:
                                        category = "buffer";
                                        numbytes += word0;
                                        break;
                                    case pxt.BuiltInType.RefAction:
                                        category = "action";
                                        len = word0 & 0xffff;
                                        for (i = 0; i < len; ++i) {
                                            fields["" + i] = readRef(objPtr + (i + 3) * 4);
                                        }
                                        numbytes += len * 4;
                                        break;
                                    case pxt.BuiltInType.RefImage:
                                        category = "image";
                                        if (word0 & 1) {
                                            numbytes += word0 >> 2;
                                        }
                                        break;
                                    case pxt.BuiltInType.BoxedNumber:
                                        category = "number";
                                        break;
                                    case pxt.BuiltInType.RefCollection:
                                        len = read32(objPtr + 8);
                                        category = "array sz=" + (len >>> 16);
                                        len &= 0xffff;
                                        fields["length"] = len;
                                        fields[".data"] = hex(word0 - 4);
                                        for (i = 0; i < len; ++i) {
                                            fields["" + i] = readRef(word0 + i * 4);
                                        }
                                        break;
                                    case pxt.BuiltInType.RefRefLocal:
                                        category = "reflocal";
                                        fields["value"] = readRef(objPtr + 4);
                                        break;
                                    case pxt.BuiltInType.RefMap:
                                        len = read32(objPtr + 8);
                                        category = "refmap sz=" + (len >>> 16);
                                        len &= 0xffff;
                                        tmp = read32(objPtr + 12);
                                        fields["length"] = len;
                                        fields[".keys"] = hex(word0 - 4);
                                        fields[".values"] = hex(tmp - 4);
                                        for (i = 0; i < len; ++i) {
                                            fields["k" + i] = readRef(word0 + i * 4);
                                            fields["v" + i] = readRef(tmp + i * 4);
                                        }
                                        break;
                                    default:
                                        if (classMap[classNo + ""]) {
                                            cinfo = classMap[classNo + ""];
                                            category = cinfo.name;
                                            len = (numbytes - 4) >> 2;
                                            if (len != cinfo.fields.length)
                                                fields["$error"] = "fieldMismatch";
                                            for (i = 0; i < len; ++i)
                                                fields[cinfo.fields[i] || ".f" + i] = readRef(objPtr + (i + 1) * 4);
                                        }
                                        else {
                                            category = ("C_" + classNo);
                                            len = (numbytes - 4) >> 2;
                                            for (i = 0; i < len; ++i)
                                                fields[".f" + i] = readRef(objPtr + (i + 1) * 4);
                                        }
                                        break;
                                }
                            }
                            // console.log(`${hex(objPtr)} vt=${hex(vtable)} ${category} bytes=${numbytes}`)
                            if (!byCategory[category]) {
                                byCategory[category] = 0;
                                numByCategory[category] = 0;
                            }
                            numwords = (numbytes + 3) >> 2;
                            obj = {
                                addr: hex(objPtr),
                                tag: category,
                                size: (addWords + numwords) * 4,
                                fields: fields
                            };
                            objects[obj.addr] = obj;
                            byCategory[category] += (addWords + numwords) * 4;
                            numByCategory[category]++;
                            objPtr += numwords * 4;
                        }
                    }
                    cats = Object.keys(byCategory);
                    cats.sort(function (a, b) { return byCategory[b] - byCategory[a]; });
                    fidx = cats.indexOf("free");
                    cats.splice(fidx, 1);
                    cats.push("free");
                    for (_e = 0, cats_1 = cats; _e < cats_1.length; _e++) {
                        c = cats_1[_e];
                        console.log(byCategory[c] + "\t" + numByCategory[c] + "\t" + c);
                    }
                    console.log("max. free block: " + maxFree + " bytes");
                    console.log("fibers: " + fiberSize + " bytes, " + numFibers + " fibers; " + numListeners + " listeners");
                    dmesg = getDmesg();
                    roots = {};
                    dmesg
                        .replace(/.*--MARK/, "")
                        .replace(/^R(.*):0x([\da-f]+)\/(\d+)/img, function (f, id, ptr, len) {
                        roots[id] = getRoots(parseInt(ptr, 16), parseInt(len), id == "P");
                        return "";
                    });
                    for (_f = 0, _g = Object.keys(roots); _f < _g.length; _f++) {
                        rootId = _g[_f];
                        for (_h = 0, _j = roots[rootId]; _h < _j.length; _h++) {
                            f = _j[_h];
                            mark(rootId, f);
                        }
                    }
                    unreachable = [];
                    for (_k = 0, _l = U.values(objects); _k < _l.length; _k++) {
                        o = _l[_k];
                        if (!o.incoming) {
                            if (o.tag != "free")
                                unreachable.push(o.addr);
                        }
                    }
                    fs.writeFileSync("dump.json", JSON.stringify({
                        unreachable: unreachable,
                        roots: roots,
                        dmesg: dmesg,
                        objects: objects
                    }, null, 1));
                    dgml = "<DirectedGraph xmlns=\"http://schemas.microsoft.com/vs/2009/dgml\">\n";
                    dgml += "<Nodes>\n";
                    for (_m = 0, _o = Object.keys(objects); _m < _o.length; _m++) {
                        addr = _o[_m];
                        obj = objects[addr];
                        dgml += "<Node Id=\"" + addr + "\" Label=\"" + obj.tag + "\" Size=\"" + obj.size + "\" />\n";
                    }
                    dgml += "</Nodes>\n";
                    dgml += "<Links>\n";
                    for (_p = 0, _q = Object.keys(objects); _p < _q.length; _p++) {
                        addr = _q[_p];
                        obj = objects[addr];
                        for (_r = 0, _s = Object.keys(obj.fields); _r < _s.length; _r++) {
                            fieldaddr = _s[_r];
                            field = obj.fields[fieldaddr];
                            dgml += "<Link Source=\"" + addr + "\" Target=\"" + field + "\" Label=\"" + fieldaddr + "\" />\n";
                        }
                    }
                    dgml += "</Links>\n";
                    dgml += "<Properties>\n    <Property Id=\"Size\" Label=\"Size\" DataType=\"System.Int32\" />\n</Properties>\n";
                    dgml += "</DirectedGraph>";
                    fs.writeFileSync("dump.dgml", dgml, { encoding: "utf8" });
                    console.log("written dump.dgml");
                    return [2 /*return*/];
            }
        });
    });
}
exports.dumpheapAsync = dumpheapAsync;
function dumplogAsync() {
    return __awaiter(this, void 0, void 0, function () {
        var addr, buf, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, initGdbServerAsync()];
                case 1:
                    _a.sent();
                    addr = findAddr("codalLogStore");
                    return [4 /*yield*/, getMemoryAsync(addr + 4, 1024)];
                case 2:
                    buf = _a.sent();
                    for (i = 0; i < buf.length; ++i) {
                        if (buf[i] == 0) {
                            console.log("\n\n" + buf.slice(0, i).toString("utf8"));
                            break;
                        }
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.dumplogAsync = dumplogAsync;
function hwAsync(cmds) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, bi;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, initGdbServerAsync()];
                case 1:
                    _b.sent();
                    _a = cmds[0];
                    switch (_a) {
                        case "rst": return [3 /*break*/, 2];
                        case "reset": return [3 /*break*/, 2];
                        case "boot": return [3 /*break*/, 4];
                        case "log": return [3 /*break*/, 8];
                        case "dmesg": return [3 /*break*/, 8];
                    }
                    return [3 /*break*/, 10];
                case 2: return [4 /*yield*/, gdbServer.sendCmdAsync("R00", null)];
                case 3:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 4:
                    bi = getBootInfo();
                    if (!bi.addr) return [3 /*break*/, 6];
                    return [4 /*yield*/, gdbServer.write32Async(bi.addr, bi.boot)];
                case 5:
                    _b.sent();
                    _b.label = 6;
                case 6: return [4 /*yield*/, gdbServer.sendCmdAsync("R00", null)];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 8: return [4 /*yield*/, dumplogAsync()];
                case 9:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 10: return [2 /*return*/];
            }
        });
    });
}
exports.hwAsync = hwAsync;
function getBootInfo() {
    var r = {
        addr: 0,
        boot: 0,
        app: 0
    };
    if (/at91samd/.test(pxt.appTarget.compile.openocdScript)) {
        var ramSize = pxt.appTarget.compile.ramSize || 0x8000;
        r.addr = 0x20000000 + ramSize - 4;
        r.app = 0xf02669ef;
        r.boot = 0xf01669ef;
    }
    return r;
}
function startAsync(gdbArgs) {
    return __awaiter(this, void 0, void 0, function () {
        var elfFile, bmpPort, trg, monReset, monResetHalt, mapsrc, toolPaths, oargs, binfo, goToApp, goToBl, gdbargs, proc;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    elfFile = codalBin();
                    if (!fs.existsSync(elfFile))
                        fatal("compiled file not found: " + elfFile);
                    return [4 /*yield*/, getBMPSerialPortsAsync()];
                case 1:
                    bmpPort = (_a.sent())[0];
                    trg = "";
                    monReset = "monitor reset";
                    monResetHalt = "monitor reset halt";
                    if (bmpPort) {
                        bmpMode = true;
                        trg = "target extended-remote " + bmpPort;
                        trg += "\nmonitor swdp_scan\nattach 1";
                        pxt.log("Using Black Magic Probe at " + bmpPort);
                        monReset = "run";
                        monResetHalt = "run";
                    }
                    mapsrc = "";
                    if (/docker/.test(buildengine.thisBuild.buildPath)) {
                        mapsrc = "set substitute-path /src " + buildengine.thisBuild.buildPath;
                    }
                    toolPaths = getOpenOcdPath();
                    if (!bmpMode) {
                        oargs = toolPaths.args;
                        trg = "target remote | " + oargs.map(function (s) { return "\"" + s.replace(/\\/g, "/") + "\""; }).join(" ");
                        pxt.log("starting openocd: " + oargs.join(" "));
                    }
                    binfo = getBootInfo();
                    goToApp = binfo.addr ? "set {int}(" + binfo.addr + ") = " + binfo.app : "";
                    goToBl = binfo.addr ? "set {int}(" + binfo.addr + ") = " + binfo.boot : "";
                    // use / not \ for paths on Windows; otherwise gdb has issue starting openocd
                    fs.writeFileSync("built/openocd.gdb", "\n" + trg + "\n" + mapsrc + "\ndefine rst\n  set confirm off\n  " + goToApp + "\n  " + monResetHalt + "\n  continue\n  set confirm on\nend\ndefine boot\n  set confirm off\n  " + goToBl + "\n  " + monReset + "\n  quit\nend\ndefine irq\n  echo \"Current IRQ: \"\n  p (*(int*)0xE000ED04 & 0x1f) - 16\nend\ndefine exn\n  echo PC:\n  p ((void**)$sp)[5]\n  echo LR:\n  p ((void**)$sp)[6]\nend\ndefine log\n  set height 0\n  set width 0\n  printf \"%s\", codalLogStore.buffer\nend\ndefine bpanic\n  b target_panic\nend\ndefine bfault\n  b handleHardFault\nend\necho \\npxt commands\\n\necho    rst: command to re-run program from start (set your breakpoints first!).\\n\necho    boot: to go into bootloader\\n\necho    log: to dump DMESG\\n\necho    exn: to display exception info.\\n\necho    bpanic: to break in target_panic\\n\necho    bfault: to break on a hard fault, run 'exn' after\\n\necho \\ngdb (basic) commands\\n\necho    s: step, n: step over, fin: step out\\n\necho    l: line context\\n\necho    bt: for stacktrace\\n\\n\necho More help at https://makecode.com/cli/gdb\\n\\n\n");
                    gdbargs = ["--command=built/openocd.gdb", elfFile].concat(gdbArgs);
                    pxt.log("starting gdb with: " + toolPaths.gdbBin + " " + gdbargs.join(" "));
                    proc = child_process.spawn(toolPaths.gdbBin, gdbargs, {
                        stdio: "inherit",
                    });
                    process.on('SIGINT', function () {
                        // this doesn't actully kill it, it usually just stops the target program
                        proc.kill('SIGINT');
                    });
                    return [2 /*return*/, new Promise(function (resolve, reject) {
                            proc.on("error", function (err) { reject(err); });
                            proc.on("close", function () {
                                resolve();
                            });
                        })];
            }
        });
    });
}
exports.startAsync = startAsync;
