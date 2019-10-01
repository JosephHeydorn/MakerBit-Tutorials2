"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var child_process = require("child_process");
var fs = require("fs");
var zlib = require("zlib");
var url = require("url");
var http = require("http");
var https = require("https");
var crypto = require("crypto");
var path = require("path");
var os = require("os");
Promise = require("bluebird");
var Util = pxt.Util;
//This should be correct at startup when running from command line
exports.targetDir = process.cwd();
exports.pxtCoreDir = path.join(__dirname, "..");
exports.cliFinalizers = [];
function addCliFinalizer(f) {
    exports.cliFinalizers.push(f);
}
exports.addCliFinalizer = addCliFinalizer;
function runCliFinalizersAsync() {
    var fins = exports.cliFinalizers;
    exports.cliFinalizers = [];
    return Promise.mapSeries(fins, function (f) { return f(); })
        .then(function () { });
}
exports.runCliFinalizersAsync = runCliFinalizersAsync;
function setTargetDir(dir) {
    exports.targetDir = dir;
    module.paths.push(path.join(exports.targetDir, "node_modules"));
}
exports.setTargetDir = setTargetDir;
function readResAsync(g) {
    return new Promise(function (resolve, reject) {
        var bufs = [];
        g.on('data', function (c) {
            if (typeof c === "string")
                bufs.push(Buffer.from(c, "utf8"));
            else
                bufs.push(c);
        });
        g.on("error", function (err) { return reject(err); });
        g.on('end', function () { return resolve(Buffer.concat(bufs)); });
    });
}
exports.readResAsync = readResAsync;
function spawnAsync(opts) {
    opts.pipe = false;
    return spawnWithPipeAsync(opts)
        .then(function () { });
}
exports.spawnAsync = spawnAsync;
function spawnWithPipeAsync(opts) {
    if (opts.pipe === undefined)
        opts.pipe = true;
    var info = opts.cmd + " " + opts.args.join(" ");
    if (opts.cwd && opts.cwd != ".")
        info = "cd " + opts.cwd + "; " + info;
    console.log("[run] " + info);
    return new Promise(function (resolve, reject) {
        var ch = child_process.spawn(opts.cmd, opts.args, {
            cwd: opts.cwd,
            env: opts.envOverrides ? extendEnv(process.env, opts.envOverrides) : process.env,
            stdio: opts.pipe ? [opts.input == null ? process.stdin : "pipe", "pipe", process.stderr] : "inherit",
            shell: opts.shell || false
        });
        var bufs = [];
        if (opts.pipe)
            ch.stdout.on('data', function (buf) {
                bufs.push(buf);
                if (!opts.silent) {
                    process.stdout.write(buf);
                }
            });
        ch.on('close', function (code) {
            if (code != 0 && !opts.allowNonZeroExit)
                reject(new Error("Exit code: " + code + " from " + info));
            resolve(Buffer.concat(bufs));
        });
        if (opts.input != null)
            ch.stdin.end(opts.input, "utf8");
    });
}
exports.spawnWithPipeAsync = spawnWithPipeAsync;
function extendEnv(base, overrides) {
    var res = {};
    Object.keys(base).forEach(function (key) { return res[key] = base[key]; });
    Object.keys(overrides).forEach(function (key) { return res[key] = overrides[key]; });
    return res;
}
function addCmd(name) {
    return name + (/^win/.test(process.platform) ? ".cmd" : "");
}
exports.addCmd = addCmd;
function runNpmAsync() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return runNpmAsyncWithCwd.apply(void 0, ["."].concat(args));
}
exports.runNpmAsync = runNpmAsync;
function npmRegistryAsync(pkg) {
    // TODO: use token if available
    return Util.httpGetJsonAsync("https://registry.npmjs.org/" + pkg);
}
exports.npmRegistryAsync = npmRegistryAsync;
function runNpmAsyncWithCwd(cwd) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    return spawnAsync({
        cmd: addCmd("npm"),
        args: args,
        cwd: cwd
    });
}
exports.runNpmAsyncWithCwd = runNpmAsyncWithCwd;
function runGitAsync() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return spawnAsync({
        cmd: "git",
        args: args,
        cwd: "."
    });
}
exports.runGitAsync = runGitAsync;
function gitInfoAsync(args, cwd, silent) {
    if (silent === void 0) { silent = false; }
    return Promise.resolve()
        .then(function () { return spawnWithPipeAsync({
        cmd: "git",
        args: args,
        cwd: cwd,
        silent: silent
    }); })
        .then(function (buf) { return buf.toString("utf8").trim(); });
}
exports.gitInfoAsync = gitInfoAsync;
function currGitTagAsync() {
    return gitInfoAsync(["describe", "--tags", "--exact-match"])
        .then(function (t) {
        if (!t)
            Util.userError("no git tag found");
        return t;
    });
}
exports.currGitTagAsync = currGitTagAsync;
function needsGitCleanAsync() {
    return Promise.resolve()
        .then(function () { return spawnWithPipeAsync({
        cmd: "git",
        args: ["status", "--porcelain", "--untracked-files=no"]
    }); })
        .then(function (buf) {
        if (buf.length)
            Util.userError("Please commit all files to git before running 'pxt bump'");
    });
}
exports.needsGitCleanAsync = needsGitCleanAsync;
function nodeHttpRequestAsync(options) {
    var isHttps = false;
    var u = url.parse(options.url);
    if (u.protocol == "https:")
        isHttps = true;
    else if (u.protocol == "http:")
        isHttps = false;
    else
        return Promise.reject("bad protocol: " + u.protocol);
    u.headers = Util.clone(options.headers) || {};
    var data = options.data;
    u.method = options.method || (data == null ? "GET" : "POST");
    var buf = null;
    u.headers["accept-encoding"] = "gzip";
    u.headers["user-agent"] = "PXT-CLI";
    var gzipContent = false;
    if (data != null) {
        if (Buffer.isBuffer(data)) {
            buf = data;
        }
        else if (typeof data == "object") {
            buf = Buffer.from(JSON.stringify(data), "utf8");
            u.headers["content-type"] = "application/json; charset=utf8";
            if (options.allowGzipPost)
                gzipContent = true;
        }
        else if (typeof data == "string") {
            buf = Buffer.from(data, "utf8");
            if (options.allowGzipPost)
                gzipContent = true;
        }
        else {
            Util.oops("bad data");
        }
    }
    if (gzipContent) {
        buf = zlib.gzipSync(buf);
        u.headers['content-encoding'] = "gzip";
    }
    if (buf)
        u.headers['content-length'] = buf.length;
    return new Promise(function (resolve, reject) {
        var handleResponse = function (res) {
            var g = res;
            if (/gzip/.test(res.headers['content-encoding'])) {
                var tmp = zlib.createUnzip();
                res.pipe(tmp);
                g = tmp;
            }
            resolve(readResAsync(g).then(function (buf) {
                var text = null;
                try {
                    text = buf.toString("utf8");
                }
                catch (e) {
                }
                var resp = {
                    statusCode: res.statusCode,
                    headers: res.headers,
                    buffer: buf,
                    text: text
                };
                return resp;
            }));
        };
        var req = isHttps ? https.request(u, handleResponse) : http.request(u, handleResponse);
        req.on('error', function (err) { return reject(err); });
        req.end(buf);
    });
}
function sha256(hashData) {
    var sha;
    var hash = crypto.createHash("sha256");
    hash.update(hashData, "utf8");
    sha = hash.digest().toString("hex").toLowerCase();
    return sha;
}
function init() {
    // no, please, I want to handle my errors myself
    var async = Promise._async;
    async.fatalError = function (e) { return async.throwLater(e); };
    Util.isNodeJS = true;
    Util.httpRequestCoreAsync = nodeHttpRequestAsync;
    Util.sha256 = sha256;
    Util.cpuUs = function () {
        var p = process.cpuUsage();
        return p.system + p.user;
    };
    Util.getRandomBuf = function (buf) {
        var tmp = crypto.randomBytes(buf.length);
        for (var i = 0; i < buf.length; ++i)
            buf[i] = tmp[i];
    };
    global.btoa = function (str) { return Buffer.from(str, "binary").toString("base64"); };
    global.atob = function (str) { return Buffer.from(str, "base64").toString("binary"); };
}
function sanitizePath(path) {
    return path.replace(/[^\w@\/]/g, "-").replace(/^\/+/, "");
}
exports.sanitizePath = sanitizePath;
function readJson(fn) {
    return JSON.parse(fs.readFileSync(fn, "utf8"));
}
exports.readJson = readJson;
function readPkgConfig(dir) {
    pxt.debug("readPkgConfig in " + dir);
    var fn = path.join(dir, pxt.CONFIG_NAME);
    var js = readJson(fn);
    var ap = js.additionalFilePath;
    if (ap) {
        var adddir = path.join(dir, ap);
        if (!existsDirSync(adddir))
            pxt.U.userError("additional pxt.json not found: " + adddir + " in " + dir + " + " + ap);
        pxt.debug("additional pxt.json: " + adddir);
        var js2 = readPkgConfig(adddir);
        for (var _i = 0, _a = Object.keys(js2); _i < _a.length; _i++) {
            var k = _a[_i];
            if (!js.hasOwnProperty(k)) {
                js[k] = js2[k];
            }
        }
        js.additionalFilePaths = [ap].concat(js2.additionalFilePaths.map(function (d) { return path.join(ap, d); }));
    }
    else {
        js.additionalFilePaths = [];
    }
    // don't inject version number
    // as they get serialized later on
    // if (!js.targetVersions) js.targetVersions = pxt.appTarget.versions;
    return js;
}
exports.readPkgConfig = readPkgConfig;
function getPxtTarget() {
    if (fs.existsSync(exports.targetDir + "/built/target.json")) {
        var res = readJson(exports.targetDir + "/built/target.json");
        if (res.id && res.bundledpkgs)
            return res;
    }
    var raw = readJson(exports.targetDir + "/pxtarget.json");
    raw.bundledpkgs = {};
    return raw;
}
exports.getPxtTarget = getPxtTarget;
function pathToPtr(path) {
    return "ptr-" + sanitizePath(path.replace(/^ptr-/, "")).replace(/[^\w@]/g, "-");
}
exports.pathToPtr = pathToPtr;
function mkdirP(thePath) {
    if (thePath == "." || !thePath)
        return;
    if (!fs.existsSync(thePath)) {
        mkdirP(path.dirname(thePath));
        fs.mkdirSync(thePath);
    }
}
exports.mkdirP = mkdirP;
function cpR(src, dst, maxDepth) {
    if (maxDepth === void 0) { maxDepth = 8; }
    src = path.resolve(src);
    var files = allFiles(src, maxDepth);
    var dirs = {};
    for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
        var f = files_1[_i];
        var bn = f.slice(src.length);
        var dd = path.join(dst, bn);
        var dir = path.dirname(dd);
        if (!Util.lookup(dirs, dir)) {
            mkdirP(dir);
            dirs[dir] = true;
        }
        var buf = fs.readFileSync(f);
        fs.writeFileSync(dd, buf);
    }
}
exports.cpR = cpR;
function cp(srcFile, destDirectory) {
    mkdirP(destDirectory);
    var dest = path.resolve(destDirectory, path.basename(srcFile));
    var buf = fs.readFileSync(path.resolve(srcFile));
    fs.writeFileSync(dest, buf);
}
exports.cp = cp;
function allFiles(top, maxDepth, allowMissing, includeDirs) {
    if (maxDepth === void 0) { maxDepth = 8; }
    if (allowMissing === void 0) { allowMissing = false; }
    if (includeDirs === void 0) { includeDirs = false; }
    var res = [];
    if (allowMissing && !existsDirSync(top))
        return res;
    for (var _i = 0, _a = fs.readdirSync(top); _i < _a.length; _i++) {
        var p = _a[_i];
        if (p[0] == ".")
            continue;
        var inner = path.join(top, p);
        var st = fs.statSync(inner);
        if (st.isDirectory()) {
            if (maxDepth > 1)
                Util.pushRange(res, allFiles(inner, maxDepth - 1));
            if (includeDirs)
                res.push(inner);
        }
        else {
            res.push(inner);
        }
    }
    return res;
}
exports.allFiles = allFiles;
function existsDirSync(name) {
    try {
        var stats = fs.lstatSync(name);
        return stats && stats.isDirectory();
    }
    catch (e) {
        return false;
    }
}
exports.existsDirSync = existsDirSync;
function writeFileSync(p, data, options) {
    mkdirP(path.dirname(p));
    fs.writeFileSync(p, data, options);
    if (pxt.options.debug) {
        var stats = fs.statSync(p);
        pxt.log("  + " + p + " " + (stats.size > 1000000 ? (stats.size / 1000000).toFixed(2) + ' m' : stats.size > 1000 ? (stats.size / 1000).toFixed(2) + 'k' : stats.size) + "b");
    }
}
exports.writeFileSync = writeFileSync;
function openUrl(startUrl, browser) {
    if (!/^[a-z0-9A-Z#=\.\-\\\/%:\?_&]+$/.test(startUrl)) {
        console.error("invalid URL to open: " + startUrl);
        return;
    }
    var cmds = {
        darwin: "open",
        win32: "start",
        linux: "xdg-open"
    };
    if (/^win/.test(os.platform()) && !/^[a-z0-9]+:\/\//i.test(startUrl))
        startUrl = startUrl.replace('/', '\\');
    else
        startUrl = startUrl.replace('\\', '/');
    console.log("opening " + startUrl);
    if (browser) {
        child_process.spawn(getBrowserLocation(browser), [startUrl], { detached: true });
    }
    else {
        child_process.exec(cmds[process.platform] + " " + startUrl);
    }
}
exports.openUrl = openUrl;
function getBrowserLocation(browser) {
    var browserPath;
    var normalizedBrowser = browser.toLowerCase();
    if (normalizedBrowser === "chrome") {
        switch (os.platform()) {
            case "win32":
                browserPath = "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe";
                break;
            case "darwin":
                browserPath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
                break;
            case "linux":
                browserPath = "/opt/google/chrome/chrome";
                break;
            default:
                break;
        }
    }
    else if (normalizedBrowser === "firefox") {
        browserPath = "C:/Program Files (x86)/Mozilla Firefox/firefox.exe";
        switch (os.platform()) {
            case "win32":
                browserPath = "C:/Program Files (x86)/Mozilla Firefox/firefox.exe";
                break;
            case "darwin":
                browserPath = "/Applications/Firefox.app";
                break;
            case "linux":
            default:
                break;
        }
    }
    else if (normalizedBrowser === "ie") {
        browserPath = "C:/Program Files/Internet Explorer/iexplore.exe";
    }
    else if (normalizedBrowser === "safari") {
        browserPath = "/Applications/Safari.app/Contents/MacOS/Safari";
    }
    if (browserPath && fs.existsSync(browserPath)) {
        return browserPath;
    }
    return browser;
}
function fileExistsSync(p) {
    try {
        var stats = fs.lstatSync(p);
        return stats && stats.isFile();
    }
    catch (e) {
        return false;
    }
}
exports.fileExistsSync = fileExistsSync;
exports.lastResolveMdDirs = [];
// returns undefined if not found
function resolveMd(root, pathname) {
    var docs = path.join(root, "docs");
    var tryRead = function (fn) {
        if (fileExistsSync(fn + ".md"))
            return fs.readFileSync(fn + ".md", "utf8");
        if (fileExistsSync(fn + "/index.md"))
            return fs.readFileSync(fn + "/index.md", "utf8");
        return null;
    };
    var targetMd = tryRead(path.join(docs, pathname));
    if (targetMd && !/^\s*#+\s+@extends/m.test(targetMd))
        return targetMd;
    var dirs = [
        path.join(root, "/node_modules/pxt-core/common-docs"),
    ];
    exports.lastResolveMdDirs = dirs;
    for (var _i = 0, _a = pxt.appTarget.bundleddirs; _i < _a.length; _i++) {
        var pkg = _a[_i];
        var d = path.join(pkg, "docs");
        if (!path.isAbsolute(d))
            d = path.join(root, d);
        dirs.push(d);
        var cfg = readPkgConfig(path.join(d, ".."));
        for (var _b = 0, _c = cfg.additionalFilePaths; _b < _c.length; _b++) {
            var add = _c[_b];
            dirs.push(path.join(d, "..", add, "docs"));
        }
    }
    for (var _d = 0, dirs_1 = dirs; _d < dirs_1.length; _d++) {
        var d = dirs_1[_d];
        var template = tryRead(path.join(d, pathname));
        if (template)
            return pxt.docs.augmentDocs(template, targetMd);
    }
    return undefined;
}
exports.resolveMd = resolveMd;
function lazyDependencies() {
    // find pxt-core package
    var deps = {};
    [path.join("node_modules", "pxt-core", "package.json"), "package.json"]
        .filter(function (f) { return fs.existsSync(f); })
        .map(function (f) { return readJson(f); })
        .forEach(function (config) { return config && config.lazyDependencies && Util.jsonMergeFrom(deps, config.lazyDependencies); });
    return deps;
}
exports.lazyDependencies = lazyDependencies;
function lazyRequire(name, install) {
    if (install === void 0) { install = false; }
    /* tslint:disable:non-literal-require */
    var r;
    try {
        r = require(name);
    }
    catch (e) {
        pxt.debug(e);
        pxt.debug(require.resolve.paths(name));
        r = undefined;
    }
    if (!r && install)
        pxt.log("package \"" + name + "\" failed to load, run \"pxt npminstallnative\" to install native depencencies");
    return r;
    /* tslint:enable:non-literal-require */
}
exports.lazyRequire = lazyRequire;
init();
