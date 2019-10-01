"use strict";
/// <reference path="../built/pxtlib.d.ts"/>
/// <reference path="../built/pxtsim.d.ts"/>
Object.defineProperty(exports, "__esModule", { value: true });
global.pxt = pxt;
var nodeutil = require("./nodeutil");
var fs = require("fs");
var path = require("path");
var child_process = require("child_process");
var hid = require("./hid");
var U = pxt.Util;
function noopAsync() { return Promise.resolve(); }
exports.buildEngines = {
    yotta: {
        updateEngineAsync: function () { return runYottaAsync(["update"]); },
        buildAsync: function () { return runYottaAsync(["build"]); },
        setPlatformAsync: function () {
            return runYottaAsync(["target", pxt.appTarget.compileService.yottaTarget]);
        },
        patchHexInfo: patchYottaHexInfo,
        prepBuildDirAsync: noopAsync,
        buildPath: "built/yt",
        moduleConfig: "module.json",
        deployAsync: msdDeployCoreAsync,
        appPath: "source"
    },
    dockeryotta: {
        updateEngineAsync: function () { return runDockerAsync(["yotta", "update"]); },
        buildAsync: function () { return runDockerAsync(["yotta", "build"]); },
        setPlatformAsync: function () {
            return runDockerAsync(["yotta", "target", pxt.appTarget.compileService.yottaTarget]);
        },
        patchHexInfo: patchYottaHexInfo,
        prepBuildDirAsync: noopAsync,
        buildPath: "built/dockeryt",
        moduleConfig: "module.json",
        deployAsync: msdDeployCoreAsync,
        appPath: "source"
    },
    platformio: {
        updateEngineAsync: noopAsync,
        buildAsync: function () { return runPlatformioAsync(["run"]); },
        setPlatformAsync: noopAsync,
        patchHexInfo: patchPioHexInfo,
        prepBuildDirAsync: noopAsync,
        buildPath: "built/pio",
        moduleConfig: "platformio.ini",
        deployAsync: platformioDeployAsync,
        appPath: "src"
    },
    codal: {
        updateEngineAsync: updateCodalBuildAsync,
        buildAsync: function () { return runBuildCmdAsync("python", "build.py"); },
        setPlatformAsync: noopAsync,
        patchHexInfo: patchCodalHexInfo,
        prepBuildDirAsync: prepCodalBuildDirAsync,
        buildPath: "built/codal",
        moduleConfig: "codal.json",
        deployAsync: msdDeployCoreAsync,
        appPath: "pxtapp"
    },
    dockercodal: {
        updateEngineAsync: updateCodalBuildAsync,
        buildAsync: function () { return runDockerAsync(["python", "build.py"]); },
        setPlatformAsync: noopAsync,
        patchHexInfo: patchCodalHexInfo,
        prepBuildDirAsync: prepCodalBuildDirAsync,
        buildPath: "built/dockercodal",
        moduleConfig: "codal.json",
        deployAsync: msdDeployCoreAsync,
        appPath: "pxtapp"
    },
    dockermake: {
        updateEngineAsync: function () { return runBuildCmdAsync(nodeutil.addCmd("npm"), "install"); },
        buildAsync: function () { return runDockerAsync(["make", "-j8"]); },
        setPlatformAsync: noopAsync,
        patchHexInfo: patchDockermakeHexInfo,
        prepBuildDirAsync: noopAsync,
        buildPath: "built/dockermake",
        moduleConfig: "package.json",
        deployAsync: msdDeployCoreAsync,
        appPath: "pxtapp"
    },
    dockercross: {
        updateEngineAsync: function () { return runBuildCmdAsync(nodeutil.addCmd("npm"), "install"); },
        buildAsync: function () { return runDockerAsync(["make"]); },
        setPlatformAsync: noopAsync,
        patchHexInfo: patchDockerCrossHexInfo,
        prepBuildDirAsync: noopAsync,
        buildPath: "built/dockercross",
        moduleConfig: "package.json",
        deployAsync: noopAsync,
        appPath: "pxtapp"
    },
    cs: {
        updateEngineAsync: noopAsync,
        buildAsync: function () { return runBuildCmdAsync(getCSharpCommand(), "-t:library", "-out:pxtapp.dll", "lib.cs"); },
        setPlatformAsync: noopAsync,
        patchHexInfo: patchCSharpDll,
        prepBuildDirAsync: noopAsync,
        buildPath: "built/cs",
        moduleConfig: "module.json",
        deployAsync: buildFinalCsAsync,
        appPath: "pxtapp"
    },
};
// once we have a different build engine, set this appropriately
exports.thisBuild = exports.buildEngines['yotta'];
function setThisBuild(b) {
    if (pxt.appTarget.compileService.dockerImage && !process.env["PXT_NODOCKER"]) {
        if (b === exports.buildEngines["codal"])
            b = exports.buildEngines["dockercodal"];
        if (b === exports.buildEngines["yotta"])
            b = exports.buildEngines["dockeryotta"];
    }
    exports.thisBuild = b;
}
exports.setThisBuild = setThisBuild;
function patchYottaHexInfo(extInfo) {
    var buildEngine = exports.thisBuild;
    var hexPath = buildEngine.buildPath + "/build/" + pxt.appTarget.compileService.yottaTarget
        + "/source/" + pxt.appTarget.compileService.yottaBinary;
    return {
        hex: fs.readFileSync(hexPath, "utf8").split(/\r?\n/)
    };
}
function patchCodalHexInfo(extInfo) {
    var bin = pxt.appTarget.compileService.codalBinary;
    var hexPath = exports.thisBuild.buildPath + "/build/" + bin + ".hex";
    return {
        hex: fs.readFileSync(hexPath, "utf8").split(/\r?\n/)
    };
}
function patchDockermakeHexInfo(extInfo) {
    var hexPath = exports.thisBuild.buildPath + "/bld/pxt-app.hex";
    return {
        hex: fs.readFileSync(hexPath, "utf8").split(/\r?\n/)
    };
}
function patchDockerCrossHexInfo(extInfo) {
    var hexPath = exports.thisBuild.buildPath + "/bld/all.tgz.b64";
    return {
        hex: fs.readFileSync(hexPath, "utf8").split(/\r?\n/)
    };
}
function patchCSharpDll(extInfo) {
    var hexPath = exports.thisBuild.buildPath + "/lib.cs";
    return {
        hex: [fs.readFileSync(hexPath, "utf8")]
    };
}
function pioFirmwareHex() {
    var buildEngine = exports.buildEngines['platformio'];
    return buildEngine.buildPath + "/.pioenvs/myenv/firmware.hex";
}
function patchPioHexInfo(extInfo) {
    return {
        hex: fs.readFileSync(pioFirmwareHex(), "utf8").split(/\r?\n/)
    };
}
function platformioDeployAsync(r) {
    if (pxt.appTarget.compile.useUF2)
        return msdDeployCoreAsync(r);
    else
        return platformioUploadAsync(r);
}
function platformioUploadAsync(r) {
    // TODO maybe platformio has some option to do this?
    var buildEngine = exports.buildEngines['platformio'];
    var prevHex = fs.readFileSync(pioFirmwareHex());
    fs.writeFileSync(pioFirmwareHex(), r.outfiles[pxtc.BINARY_HEX]);
    return runPlatformioAsync(["run", "--target", "upload", "--target", "nobuild", "-v"])
        .finally(function () {
        pxt.log('Restoring ' + pioFirmwareHex());
        fs.writeFileSync(pioFirmwareHex(), prevHex);
    });
}
function buildHexAsync(buildEngine, mainPkg, extInfo, forceBuild) {
    var tasks = Promise.resolve();
    var buildCachePath = buildEngine.buildPath + "/buildcache.json";
    var buildCache = {};
    if (fs.existsSync(buildCachePath)) {
        buildCache = nodeutil.readJson(buildCachePath);
    }
    if (!forceBuild && (buildCache.sha == extInfo.sha && !process.env["PXT_RUNTIME_DEV"])) {
        pxt.debug("Skipping C++ build.");
        return tasks;
    }
    pxt.debug("writing build files to " + buildEngine.buildPath);
    var allFiles = U.clone(extInfo.generatedFiles);
    U.jsonCopyFrom(allFiles, extInfo.extensionFiles);
    var writeFiles = function () {
        for (var _i = 0, _a = nodeutil.allFiles(buildEngine.buildPath + "/" + buildEngine.appPath, 8, true); _i < _a.length; _i++) {
            var f = _a[_i];
            var bn = f.slice(buildEngine.buildPath.length);
            bn = bn.replace(/\\/g, "/").replace(/^\//, "/");
            if (U.startsWith(bn, "/" + buildEngine.appPath + "/") && !allFiles[bn]) {
                pxt.log("removing stale " + bn);
                fs.unlinkSync(f);
            }
        }
        U.iterMap(allFiles, function (fn, v) {
            fn = buildEngine.buildPath + fn;
            nodeutil.mkdirP(path.dirname(fn));
            var existing = null;
            if (fs.existsSync(fn))
                existing = fs.readFileSync(fn, "utf8");
            if (existing !== v)
                nodeutil.writeFileSync(fn, v);
        });
    };
    tasks = tasks
        .then(buildEngine.prepBuildDirAsync)
        .then(writeFiles);
    var saveCache = function () { return fs.writeFileSync(buildCachePath, JSON.stringify(buildCache, null, 4) + "\n"); };
    var modSha = U.sha256(extInfo.generatedFiles["/" + buildEngine.moduleConfig]);
    var needDal = false;
    if (buildCache.modSha !== modSha || forceBuild) {
        tasks = tasks
            .then(buildEngine.setPlatformAsync)
            .then(buildEngine.updateEngineAsync)
            .then(function () {
            buildCache.sha = "";
            buildCache.modSha = modSha;
            saveCache();
            needDal = true;
        });
    }
    else {
        pxt.debug("Skipping C++ build update.");
    }
    tasks = tasks
        .then(buildEngine.buildAsync)
        .then(function () {
        buildCache.sha = extInfo.sha;
        saveCache();
        if (needDal)
            buildDalConst(buildEngine, mainPkg, true);
    });
    return tasks;
}
exports.buildHexAsync = buildHexAsync;
function runYottaAsync(args) {
    var ypath = process.env["YOTTA_PATH"];
    var ytCommand = "yotta";
    var env = U.clone(process.env);
    if (/;[A-Z]:\\/.test(ypath)) {
        for (var _i = 0, _a = ypath.split(";"); _i < _a.length; _i++) {
            var pp = _a[_i];
            var q = path.join(pp, "yotta.exe");
            if (fs.existsSync(q)) {
                ytCommand = q;
                env["PATH"] = env["PATH"] + ";" + ypath;
                break;
            }
        }
    }
    pxt.log("*** " + ytCommand + " " + args.join(" "));
    var child = child_process.spawn("yotta", args, {
        cwd: exports.thisBuild.buildPath,
        stdio: "inherit",
        env: env
    });
    return new Promise(function (resolve, reject) {
        child.on("close", function (code) {
            if (code === 0)
                resolve();
            else
                reject(new Error("yotta " + args.join(" ") + ": exit code " + code));
        });
    });
}
function runPlatformioAsync(args) {
    pxt.log("*** platformio " + args.join(" "));
    var child = child_process.spawn("platformio", args, {
        cwd: exports.thisBuild.buildPath,
        stdio: "inherit",
        env: process.env
    });
    return new Promise(function (resolve, reject) {
        child.on("close", function (code) {
            if (code === 0)
                resolve();
            else
                reject(new Error("platformio " + args.join(" ") + ": exit code " + code));
        });
    });
}
function runDockerAsync(args) {
    var fullpath = process.cwd() + "/" + exports.thisBuild.buildPath + "/";
    var cs = pxt.appTarget.compileService;
    var dargs = cs.dockerArgs || ["-u", "build"];
    var mountArg = fullpath + ":/src";
    // this speeds up docker build a lot on macOS,
    // see https://docs.docker.com/docker-for-mac/osxfs-caching/
    if (process.platform == "darwin")
        mountArg += ":delegated";
    return nodeutil.spawnAsync({
        cmd: "docker",
        args: ["run", "--rm", "-v", mountArg, "-w", "/src"].concat(dargs).concat([cs.dockerImage]).concat(args),
        cwd: exports.thisBuild.buildPath
    });
}
var parseCppInt = pxt.cpp.parseCppInt;
function codalGitAsync() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return nodeutil.spawnAsync({
        cmd: "git",
        args: args,
        cwd: exports.thisBuild.buildPath
    });
}
exports.codalGitAsync = codalGitAsync;
function prepCodalBuildDirAsync() {
    if (fs.existsSync(exports.thisBuild.buildPath + "/.git/config"))
        return Promise.resolve();
    var cs = pxt.appTarget.compileService;
    var pkg = "https://github.com/" + cs.githubCorePackage;
    nodeutil.mkdirP("built");
    return nodeutil.runGitAsync("clone", pkg, exports.thisBuild.buildPath)
        .then(function () { return codalGitAsync("checkout", cs.gittag); });
}
function runBuildCmdAsync(cmd) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return nodeutil.spawnAsync({
        cmd: cmd,
        args: args,
        cwd: exports.thisBuild.buildPath,
    });
}
function updateCodalBuildAsync() {
    var cs = pxt.appTarget.compileService;
    return codalGitAsync("checkout", cs.gittag)
        .then(function () { return /^v\d+/.test(cs.gittag) ? Promise.resolve() : codalGitAsync("pull"); }, function (e) {
        return codalGitAsync("checkout", "master")
            .then(function () { return codalGitAsync("pull"); });
    })
        .then(function () { return codalGitAsync("checkout", cs.gittag); });
}
// TODO: DAL specific code should be lifted out
function buildDalConst(buildEngine, mainPkg, rebuild, create) {
    if (rebuild === void 0) { rebuild = false; }
    if (create === void 0) { create = false; }
    var constName = "dal.d.ts";
    var constPath = constName;
    var config = mainPkg && mainPkg.config;
    var corePackage = config && config.dalDTS && config.dalDTS.corePackage;
    if (corePackage)
        constPath = path.join(corePackage, constName);
    var vals = {};
    var done = {};
    var excludeSyms = [];
    function expandInt(s) {
        s = s.trim();
        var existing = U.lookup(vals, s);
        if (existing != null && existing != "?")
            s = existing;
        var mm = /^\((.*)\)/.exec(s);
        if (mm)
            s = mm[1];
        var m = /^(\w+)\s*([\+\|])\s*(.*)$/.exec(s);
        if (m) {
            var k = expandInt(m[1]);
            if (k != null)
                return m[2] == "+" ? k + expandInt(m[3]) : k | expandInt(m[3]);
        }
        var pp = parseCppInt(s);
        if (pp != null)
            return pp;
        return null;
    }
    function extractConstants(fileName, src, dogenerate) {
        if (dogenerate === void 0) { dogenerate = false; }
        var lineNo = 0;
        // let err = (s: string) => U.userError(`${fileName}(${lineNo}): ${s}\n`)
        var outp = "";
        var inEnum = false;
        var enumVal = 0;
        var defineVal = function (n, v) {
            if (excludeSyms.some(function (s) { return U.startsWith(n, s); }))
                return;
            var parsed = expandInt(v);
            if (parsed != null) {
                v = parsed.toString();
                var curr = U.lookup(vals, n);
                if (curr == null || curr == v) {
                    vals[n] = v;
                    if (dogenerate && !done[n]) {
                        outp += "    " + n + " = " + v + ",\n";
                        done[n] = v;
                    }
                }
                else {
                    vals[n] = "?";
                    // TODO: DAL-specific code
                    if (dogenerate && !/^MICROBIT_DISPLAY_(ROW|COLUMN)_COUNT|PXT_VTABLE_SHIFT$/.test(n))
                        pxt.log(fileName + "(" + lineNo + "): #define conflict, " + n);
                }
            }
        };
        src.split(/\r?\n/).forEach(function (ln) {
            ++lineNo;
            ln = ln.replace(/\/\/.*/, "").replace(/\/\*.*/g, "");
            var m = /^\s*#define\s+(\w+)\s+(.*)$/.exec(ln);
            if (m) {
                defineVal(m[1], m[2]);
            }
            if (inEnum && /}/.test(ln))
                inEnum = false;
            if (/^\s*enum\s+(\w+)/.test(ln)) {
                inEnum = true;
                enumVal = -1;
            }
            var shouldExpand = inEnum && (m = /^\s*(\w+)\s*(=\s*(.*?))?,?\s*$/.exec(ln));
            if (shouldExpand) {
                var v = m[3];
                if (v) {
                    enumVal = expandInt(v);
                    if (enumVal == null) {
                        pxt.log(fileName + "(" + lineNo + "): invalid enum initializer, " + ln);
                        inEnum = false;
                        return;
                    }
                }
                else {
                    enumVal++;
                    v = enumVal + "";
                }
                defineVal(m[1], v);
            }
        });
        return outp;
    }
    if (mainPkg && (create ||
        (mainPkg.getFiles().indexOf(constName) >= 0 && (rebuild || !fs.existsSync(constName))))) {
        pxt.log("rebuilding " + constName + " into " + constPath + "...");
        var files = [];
        var foundConfig = false;
        for (var _i = 0, _a = mainPkg.sortedDeps(); _i < _a.length; _i++) {
            var d = _a[_i];
            if (d.config.dalDTS) {
                if (d.config.dalDTS.includeDirs)
                    for (var _b = 0, _c = d.config.dalDTS.includeDirs; _b < _c.length; _b++) {
                        var dn = _c[_b];
                        dn = buildEngine.buildPath + "/" + dn;
                        if (U.endsWith(dn, ".h"))
                            files.push(dn);
                        else {
                            var here = nodeutil.allFiles(dn, 20).filter(function (fn) { return U.endsWith(fn, ".h"); });
                            U.pushRange(files, here);
                        }
                    }
                excludeSyms = d.config.dalDTS.excludePrefix || excludeSyms;
                foundConfig = true;
            }
        }
        if (!foundConfig) {
            var incPath = buildEngine.buildPath + "/yotta_modules/microbit-dal/inc/";
            if (!fs.existsSync(incPath))
                incPath = buildEngine.buildPath + "/yotta_modules/codal/inc/";
            if (!fs.existsSync(incPath))
                incPath = buildEngine.buildPath;
            if (!fs.existsSync(incPath))
                U.userError("cannot find " + incPath);
            files = nodeutil.allFiles(incPath, 20)
                .filter(function (fn) { return U.endsWith(fn, ".h"); })
                .filter(function (fn) { return fn.indexOf("/mbed-classic/") < 0; })
                .filter(function (fn) { return fn.indexOf("/mbed-os/") < 0; });
        }
        files.sort(U.strcmp);
        var fc = {};
        for (var _d = 0, files_1 = files; _d < files_1.length; _d++) {
            var fn = files_1[_d];
            if (U.endsWith(fn, "Config.h"))
                continue;
            fc[fn] = fs.readFileSync(fn, "utf8");
        }
        files = Object.keys(fc);
        // pre-pass - detect conflicts
        for (var _e = 0, files_2 = files; _e < files_2.length; _e++) {
            var fn = files_2[_e];
            extractConstants(fn, fc[fn]);
        }
        // stabilize
        for (var _f = 0, files_3 = files; _f < files_3.length; _f++) {
            var fn = files_3[_f];
            extractConstants(fn, fc[fn]);
        }
        var consts = "// Auto-generated. Do not edit.\ndeclare const enum DAL {\n";
        for (var _g = 0, files_4 = files; _g < files_4.length; _g++) {
            var fn = files_4[_g];
            var v = extractConstants(fn, fc[fn], true);
            if (v) {
                consts += "    // " + fn.replace(/\\/g, "/").replace(buildEngine.buildPath, "") + "\n";
                consts += v;
            }
        }
        consts += "}\n";
        fs.writeFileSync(constPath, consts);
    }
}
exports.buildDalConst = buildDalConst;
var writeFileAsync = Promise.promisify(fs.writeFile);
var execAsync = Promise.promisify(child_process.exec);
var readDirAsync = Promise.promisify(fs.readdir);
function buildFinalCsAsync(res) {
    return nodeutil.spawnAsync({
        cmd: getCSharpCommand(),
        args: ["-out:pxtapp.exe", "binary.cs"],
        cwd: "built",
    });
}
function getCSharpCommand() {
    return process.platform == "win32" ? "mcs.bat" : "mcs";
}
function msdDeployCoreAsync(res) {
    var firmwareName = [pxtc.BINARY_UF2, pxtc.BINARY_HEX, pxtc.BINARY_ELF].filter(function (f) { return !!res.outfiles[f]; })[0];
    if (!firmwareName) {
        pxt.reportError("compile", "firmware missing from built files (" + Object.keys(res.outfiles).join(', ') + ")");
        return Promise.resolve();
    }
    var firmware = res.outfiles[firmwareName];
    var encoding = firmwareName == pxtc.BINARY_HEX
        ? "utf8" : "base64";
    function copyDeployAsync() {
        return getBoardDrivesAsync()
            .then(function (drives) { return filterDrives(drives); })
            .then(function (drives) {
            if (drives.length == 0) {
                pxt.log("cannot find any drives to deploy to");
                return Promise.resolve(0);
            }
            pxt.log("copying " + firmwareName + " to " + drives.join(", "));
            var writeHexFile = function (drivename) {
                return writeFileAsync(path.join(drivename, firmwareName), firmware, encoding)
                    .then(function () { return pxt.debug("   wrote to " + drivename); })
                    .catch(function () { return pxt.log("   failed writing to " + drivename); });
            };
            return Promise.map(drives, function (d) { return writeHexFile(d); })
                .then(function () { return drives.length; });
        }).then(function () { });
    }
    function hidDeployAsync() {
        var f = firmware;
        var blocks = pxtc.UF2.parseFile(U.stringToUint8Array(atob(f)));
        return hid.initAsync()
            .then(function (dev) { return dev.flashAsync(blocks); });
    }
    var p = Promise.resolve();
    if (pxt.appTarget.compile
        && pxt.appTarget.compile.useUF2
        && !pxt.appTarget.serial.noDeploy
        && hid.isInstalled(true)) {
        // try hid or simply bail out
        p = p.then(function () { return hidDeployAsync(); })
            .catch(function (e) { return copyDeployAsync(); });
    }
    else {
        p = p.then(function () { return copyDeployAsync(); });
    }
    return p;
}
function getBoardDrivesAsync() {
    if (process.platform == "win32") {
        var rx_1 = new RegExp("^([A-Z]:)\\s+(\\d+).* " + pxt.appTarget.compile.deployDrives);
        return execAsync("wmic PATH Win32_LogicalDisk get DeviceID, VolumeName, FileSystem, DriveType")
            .then(function (buf) {
            var res = [];
            buf.toString("utf8").split(/\n/).forEach(function (ln) {
                var m = rx_1.exec(ln);
                if (m && m[2] == "2") {
                    res.push(m[1] + "/");
                }
            });
            return res;
        });
    }
    else if (process.platform == "darwin") {
        var rx_2 = new RegExp(pxt.appTarget.compile.deployDrives);
        return readDirAsync("/Volumes")
            .then(function (lst) { return lst.filter(function (s) { return rx_2.test(s); }).map(function (s) { return "/Volumes/" + s + "/"; }); });
    }
    else if (process.platform == "linux") {
        var rx_3 = new RegExp(pxt.appTarget.compile.deployDrives);
        var user_1 = process.env["USER"];
        if (nodeutil.existsDirSync("/media/" + user_1))
            return readDirAsync("/media/" + user_1)
                .then(function (lst) { return lst.filter(function (s) { return rx_3.test(s); }).map(function (s) { return "/media/" + user_1 + "/" + s + "/"; }); });
        return Promise.resolve([]);
    }
    else {
        return Promise.resolve([]);
    }
}
function filterDrives(drives) {
    var marker = pxt.appTarget.compile.deployFileMarker;
    if (!marker)
        return drives;
    return drives.filter(function (d) {
        try {
            return fs.existsSync(path.join(d, marker));
        }
        catch (e) {
            return false;
        }
    });
}
