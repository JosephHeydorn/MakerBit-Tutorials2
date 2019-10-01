"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var workspace = require("./workspace");
var data = require("./data");
var core = require("./core");
var db = require("./db");
var Util = pxt.Util;
var hostCache = new db.Table("hostcache");
var extWeight = {
    "ts": 10,
    "blocks": 20,
    "json": 30,
    "md": 40,
};
function setupAppTarget(trgbundle) {
    pxt.setAppTarget(trgbundle);
}
exports.setupAppTarget = setupAppTarget;
var File = /** @class */ (function () {
    function File(epkg, name, content) {
        this.epkg = epkg;
        this.name = name;
        this.content = content;
        this.inSyncWithEditor = true;
        this.inSyncWithDisk = true;
    }
    File.prototype.isReadonly = function () {
        return !this.epkg.header;
    };
    File.prototype.getName = function () {
        return this.epkg.getPkgId() + "/" + this.name;
    };
    File.prototype.getTypeScriptName = function () {
        if (this.epkg.isTopLevel())
            return this.name;
        else
            return "pxt_modules/" + this.epkg.getPkgId() + "/" + this.name;
    };
    File.prototype.getExtension = function () {
        var m = /\.([^\.]+)$/.exec(this.name);
        if (m)
            return m[1];
        return "";
    };
    File.prototype.getVirtualFileName = function (forPrj) {
        var ext = this.name.replace(/.*\./, "");
        var basename = ext ? this.name.slice(0, -ext.length - 1) : this.name;
        var isExtOk = /^blocks|py|ts$/.test(ext);
        if (!isExtOk)
            return undefined;
        switch (forPrj) {
            case pxt.BLOCKS_PROJECT_NAME:
                return basename + ".blocks";
            case pxt.JAVASCRIPT_PROJECT_NAME:
                return basename + ".ts";
            case pxt.PYTHON_PROJECT_NAME:
                return basename + ".py";
            default:
                pxt.U.oops();
                return undefined;
        }
    };
    File.prototype.weight = function () {
        if (/^main\./.test(this.name))
            return 5;
        if (extWeight.hasOwnProperty(this.getExtension()))
            return extWeight[this.getExtension()];
        return 60;
    };
    File.prototype.markDirty = function () {
        this.inSyncWithEditor = false;
        this.updateStatus();
    };
    File.prototype.updateStatus = function () {
        data.invalidate("open-meta:" + this.getName());
    };
    File.prototype.setBaseGitContent = function (newContent) {
        if (newContent != this.baseGitContent) {
            this.baseGitContent = newContent;
            this.updateStatus();
        }
    };
    File.prototype.setContentAsync = function (newContent, force) {
        var _this = this;
        Util.assert(newContent !== undefined);
        this.inSyncWithEditor = true;
        if (newContent != this.content) {
            var prevContent_1 = this.content;
            this.inSyncWithDisk = false;
            this.content = newContent;
            this.updateStatus();
            return this.epkg.saveFilesAsync()
                .then(function () {
                if (_this.content == newContent) {
                    _this.inSyncWithDisk = true;
                    _this.updateStatus();
                }
                if (force && _this.forceChangeCallback)
                    _this.forceChangeCallback(prevContent_1, newContent);
                if (_this.name == pxt.github.GIT_JSON)
                    _this.epkg.updateGitJsonCache();
            });
        }
        else {
            this.updateStatus();
            return Promise.resolve();
        }
    };
    File.prototype.setForceChangeCallback = function (callback) {
        this.forceChangeCallback = callback;
    };
    return File;
}());
exports.File = File;
var EditorPackage = /** @class */ (function () {
    function EditorPackage(ksPkg, topPkg) {
        this.ksPkg = ksPkg;
        this.topPkg = topPkg;
        this.files = {};
        this.onupdate = function () { };
        this.saveScheduled = false;
        this.savingNow = 0;
        this.simStateSaveScheduled = false;
        if (ksPkg && ksPkg.verProtocol() == "workspace")
            this.header = workspace.getHeader(ksPkg.verArgument());
    }
    EditorPackage.prototype.getSimState = function () {
        if (!this.simState) {
            if (!this.files[pxt.SIMSTATE_JSON])
                this.setFile(pxt.SIMSTATE_JSON, "{}");
            var f = this.files[pxt.SIMSTATE_JSON];
            try {
                this.simState = JSON.parse(f.content);
            }
            catch (_a) {
                this.simState = {};
            }
        }
        return this.simState;
    };
    EditorPackage.prototype.setSimState = function (k, v) {
        var _this = this;
        var state = this.getSimState();
        if (state[k] == v)
            return;
        if (v == null)
            delete state[k];
        else
            state[k] = v;
        if (!this.simStateSaveScheduled) {
            this.simStateSaveScheduled = true;
            setTimeout(function () {
                _this.simStateSaveScheduled = false;
                if (!_this.simState)
                    return;
                var f = _this.files[pxt.SIMSTATE_JSON];
                if (!f)
                    return;
                f.setContentAsync(JSON.stringify(_this.simState)).done();
            }, 2000);
        }
    };
    EditorPackage.prototype.getTopHeader = function () {
        return this.topPkg.header;
    };
    EditorPackage.prototype.afterMainLoadAsync = function () {
        if (this.assetsPkg)
            return this.assetsPkg.loadAssetsAsync();
        return Promise.resolve();
    };
    EditorPackage.prototype.saveAssetAsync = function (filename, data) {
        var _this = this;
        return workspace.saveAssetAsync(this.header.id, filename, data)
            .then(function () { return _this.assetsPkg.loadAssetsAsync(); });
    };
    EditorPackage.prototype.loadAssetsAsync = function () {
        var _this = this;
        if (this.id != "assets")
            return Promise.resolve();
        return workspace.listAssetsAsync(this.topPkg.header.id)
            .then(function (res) {
            var removeMe = Util.flatClone(_this.files);
            for (var _i = 0, res_1 = res; _i < res_1.length; _i++) {
                var asset = res_1[_i];
                var fn = asset.name;
                var ex = Util.lookup(_this.files, fn);
                if (ex) {
                    delete removeMe[fn];
                }
                else {
                    ex = new File(_this, fn, "File size: " + asset.size + "; URL: " + asset.url);
                    _this.files[fn] = ex;
                }
            }
            for (var _a = 0, _b = Object.keys(removeMe); _a < _b.length; _a++) {
                var n = _b[_a];
                delete _this.files[n];
            }
            var assetsTs = "";
            var _loop_1 = function (f_1) {
                var asset = res.filter(function (a) { return a.name == f_1.name; })[0];
                var bn = f_1.name.replace(/\..*/, "").replace(/[^a-zA-Z0-9_]/g, "_");
                assetsTs += "    export const " + bn + " = \"" + asset.url + "\";\n";
            };
            for (var _c = 0, _d = _this.sortedFiles(); _c < _d.length; _c++) {
                var f_1 = _d[_c];
                _loop_1(f_1);
            }
            var assetsFN = "assets.ts";
            var f = _this.topPkg.lookupFile(assetsFN);
            if (f || assetsTs) {
                assetsTs = "namespace assets {\n" + assetsTs + "}\n";
                var cfg = _this.topPkg.ksPkg.config;
                if (cfg.files.indexOf(assetsFN) < 0) {
                    cfg.files.push(assetsFN);
                    _this.topPkg.ksPkg.saveConfig();
                }
                if (!f)
                    _this.topPkg.setFile(assetsFN, assetsTs);
                else
                    return f.setContentAsync(assetsTs);
            }
            return Promise.resolve();
        });
    };
    EditorPackage.prototype.makeTopLevel = function () {
        this.topPkg = this;
        this.outputPkg = new EditorPackage(null, this);
        this.outputPkg.id = "built";
        if (pxt.appTarget.runtime && pxt.appTarget.runtime.assetExtensions) {
            this.assetsPkg = new EditorPackage(null, this);
            this.assetsPkg.id = "assets";
        }
    };
    EditorPackage.prototype.updateConfigAsync = function (update) {
        var _this = this;
        var cfgFile = this.files[pxt.CONFIG_NAME];
        if (cfgFile) {
            try {
                var cfg = JSON.parse(cfgFile.content);
                update(cfg);
                return cfgFile.setContentAsync(JSON.stringify(cfg, null, 4) + "\n")
                    .then(function () { return _this.ksPkg.loadConfig(); });
            }
            catch (e) { }
        }
        return null;
    };
    EditorPackage.prototype.updateDepAsync = function (pkgid) {
        var _this = this;
        var p = this.ksPkg.resolveDep(pkgid);
        if (!p || p.verProtocol() != "github")
            return Promise.resolve();
        var parsed = pxt.github.parseRepoId(p.verArgument());
        return pxt.targetConfigAsync()
            .then(function (config) { return pxt.github.latestVersionAsync(parsed.fullName, config.packages); })
            .then(function (tag) { parsed.tag = tag; })
            .then(function () { return pxt.github.pkgConfigAsync(parsed.fullName, parsed.tag); })
            .catch(core.handleNetworkError)
            .then(function (cfg) { return _this.addDepAsync(cfg.name, pxt.github.stringifyRepo(parsed)); });
    };
    EditorPackage.prototype.removeDepAsync = function (pkgid) {
        var _this = this;
        return this.updateConfigAsync(function (cfg) { return delete cfg.dependencies[pkgid]; })
            .then(function () { return _this.saveFilesAsync(true); });
    };
    EditorPackage.prototype.addDepAsync = function (pkgid, pkgversion) {
        var _this = this;
        return this.updateConfigAsync(function (cfg) { return cfg.dependencies[pkgid] = pkgversion; })
            .then(function () { return _this.saveFilesAsync(true); });
    };
    EditorPackage.prototype.getKsPkg = function () {
        return this.ksPkg;
    };
    EditorPackage.prototype.getPkgId = function () {
        return this.ksPkg ? this.ksPkg.id : this.id;
    };
    EditorPackage.prototype.isTopLevel = function () {
        return this.ksPkg && this.ksPkg.level == 0;
    };
    EditorPackage.prototype.setFile = function (n, v, virtual) {
        var f = new File(this, n, v);
        if (virtual)
            f.virtual = true;
        this.files[n] = f;
        data.invalidate("open-meta:");
        return f;
    };
    EditorPackage.prototype.removeFileAsync = function (n) {
        delete this.files[n];
        data.invalidate("open-meta:");
        return this.updateConfigAsync(function (cfg) {
            cfg.files = cfg.files.filter(function (f) { return f != n; });
            if (cfg.testFiles)
                cfg.testFiles = cfg.testFiles.filter(function (f) { return f != n; });
        });
    };
    EditorPackage.prototype.setContentAsync = function (n, v) {
        var _this = this;
        var f = this.files[n];
        var p = Promise.resolve();
        if (!f) {
            f = this.setFile(n, v);
            p = p.then(function () { return _this.updateConfigAsync(function (cfg) { return cfg.files.indexOf(n) < 0 ? cfg.files.push(n) : 0; }); });
            p.then(function () { return _this.savePkgAsync(); });
        }
        return p.then(function () { return f.setContentAsync(v); });
    };
    EditorPackage.prototype.updateGitJsonCache = function () {
        var gj = this.files[pxt.github.GIT_JSON];
        if (gj) {
            var gjc = JSON.parse(gj.content);
            if (gjc.commit) {
                for (var _i = 0, _a = gjc.commit.tree.tree; _i < _a.length; _i++) {
                    var treeEnt = _a[_i];
                    var f = this.files[treeEnt.path];
                    if (f && treeEnt.blobContent != null)
                        f.setBaseGitContent(treeEnt.blobContent);
                }
            }
        }
    };
    EditorPackage.prototype.setFiles = function (files) {
        var _this = this;
        this.files = Util.mapMap(files, function (k, v) { return new File(_this, k, v); });
        data.invalidate("open-meta:");
        this.updateGitJsonCache();
    };
    EditorPackage.prototype.updateStatus = function () {
        data.invalidate("pkg-status:" + this.header.id);
    };
    EditorPackage.prototype.savePkgAsync = function () {
        var _this = this;
        if (this.header.blobCurrent)
            return Promise.resolve();
        this.savingNow++;
        this.updateStatus();
        return workspace.saveToCloudAsync(this.header)
            .then(function () {
            _this.savingNow--;
            _this.updateStatus();
            if (!_this.header.blobCurrent)
                _this.scheduleSave();
        });
    };
    EditorPackage.prototype.scheduleSave = function () {
        var _this = this;
        if (this.saveScheduled)
            return;
        this.saveScheduled = true;
        setTimeout(function () {
            _this.saveScheduled = false;
            _this.savePkgAsync().done();
        }, 5000);
    };
    EditorPackage.prototype.getAllFiles = function () {
        var r = Util.mapMap(this.files, function (k, f) { return f.content; });
        delete r[pxt.SERIAL_EDITOR_FILE];
        return r;
    };
    EditorPackage.prototype.saveFilesAsync = function (immediate) {
        var _this = this;
        if (!this.header)
            return Promise.resolve();
        var cfgFile = this.files[pxt.CONFIG_NAME];
        if (cfgFile) {
            try {
                var cfg = JSON.parse(cfgFile.content);
                this.header.name = cfg.name;
            }
            catch (e) {
            }
        }
        return workspace.saveAsync(this.header, this.getAllFiles())
            .then(function () { return immediate ? _this.savePkgAsync() : _this.scheduleSave(); });
    };
    EditorPackage.prototype.sortedFiles = function () {
        var lst = Util.values(this.files);
        if (!pxt.options.debug)
            lst = lst.filter(function (f) { return f.name != pxt.github.GIT_JSON && f.name != pxt.SIMSTATE_JSON && f.name != pxt.SERIAL_EDITOR_FILE; });
        lst.sort(function (a, b) { return a.weight() - b.weight() || Util.strcmp(a.name, b.name); });
        return lst;
    };
    EditorPackage.prototype.forEachFile = function (cb) {
        this.pkgAndDeps().forEach(function (p) {
            Util.values(p.files).forEach(cb);
        });
    };
    EditorPackage.prototype.getMainFile = function () {
        return this.sortedFiles()[0];
    };
    EditorPackage.prototype.pkgAndDeps = function () {
        if (this.topPkg != this)
            return this.topPkg.pkgAndDeps();
        var deps = this.ksPkg.deps;
        var depkeys = Object.keys(deps);
        var res = [];
        for (var _i = 0, depkeys_1 = depkeys; _i < depkeys_1.length; _i++) {
            var k = depkeys_1[_i];
            if (/---/.test(k))
                continue;
            if (deps[k].cppOnly)
                continue;
            res.push(getEditorPkg(deps[k]));
        }
        if (this.assetsPkg)
            res.push(this.assetsPkg);
        res.push(this.outputPkg);
        return res;
    };
    EditorPackage.prototype.filterFiles = function (cond) {
        return Util.concat(this.pkgAndDeps().map(function (e) { return Util.values(e.files).filter(cond); }));
    };
    EditorPackage.prototype.lookupFile = function (name) {
        if (name.indexOf("pxt_modules/") === 0)
            name = name.slice(12);
        return this.filterFiles(function (f) { return f.getName() == name; })[0];
    };
    return EditorPackage;
}());
exports.EditorPackage = EditorPackage;
var Host = /** @class */ (function () {
    function Host() {
    }
    Host.prototype.readFile = function (module, filename) {
        var epkg = getEditorPkg(module);
        var file = epkg.files[filename];
        return file ? file.content : null;
    };
    Host.prototype.writeFile = function (module, filename, contents, force) {
        if (filename == pxt.CONFIG_NAME || force) {
            // only write config writes
            var epkg = getEditorPkg(module);
            var file = epkg.files[filename];
            file.setContentAsync(contents, force).done();
            return;
        }
        throw Util.oops("trying to write " + module + " / " + filename);
    };
    Host.prototype.getHexInfoAsync = function (extInfo) {
        return pxt.hex.getHexInfoAsync(this, extInfo).catch(core.handleNetworkError);
    };
    Host.prototype.cacheStoreAsync = function (id, val) {
        return hostCache.forceSetAsync({
            id: id,
            val: val
        }).then(function () { }, function (e) {
            pxt.tickEvent('cache.store.failed', { error: e.name });
            pxt.log("cache store failed for " + id + ": " + e.name);
        });
    };
    Host.prototype.cacheGetAsync = function (id) {
        return hostCache.getAsync(id)
            .then(function (v) { return v.val; }, function (e) { return null; });
    };
    Host.prototype.downloadPackageAsync = function (pkg) {
        var proto = pkg.verProtocol();
        var epkg = getEditorPkg(pkg);
        var fromWorkspaceAsync = function (arg) {
            return workspace.getTextAsync(arg)
                .then(function (scr) {
                if (!scr)
                    return Promise.reject(new Error("Cannot find text for package '" + arg + "' in the workspace."));
                if (epkg.isTopLevel() && epkg.header)
                    return workspace.recomputeHeaderFlagsAsync(epkg.header, scr)
                        .then(function () { return epkg.setFiles(scr); });
                else {
                    epkg.setFiles(scr);
                    return Promise.resolve();
                }
            });
        };
        if (proto == "pub") {
            // make sure it sits in cache
            return workspace.getPublishedScriptAsync(pkg.verArgument())
                .then(function (files) { return epkg.setFiles(files); });
        }
        else if (proto == "github") {
            return workspace.getPublishedScriptAsync(pkg.version())
                .then(function (files) { return epkg.setFiles(files); });
        }
        else if (proto == "workspace") {
            return fromWorkspaceAsync(pkg.verArgument());
        }
        else if (proto == "file") {
            var arg = pkg.verArgument();
            if (arg[0] == ".") {
                arg = resolvePath(pkg.parent.verArgument() + "/" + arg);
            }
            return fromWorkspaceAsync(arg);
        }
        else if (proto == "embed") {
            epkg.setFiles(pxt.getEmbeddedScript(pkg.verArgument()));
            return Promise.resolve();
        }
        else if (proto == "pkg") {
            var filesSrc = exports.mainPkg.readFile(pkg.verArgument().replace(/^\.\//, ''));
            var files = ts.pxtc.Util.jsonTryParse(filesSrc);
            if (files)
                epkg.setFiles(files);
            else
                pxt.log("failed to resolve " + pkg.version());
            return Promise.resolve();
        }
        else if (proto == "invalid") {
            pxt.log("skipping invalid pkg " + pkg.id);
            return Promise.resolve();
        }
        else {
            return Promise.reject("Cannot download " + pkg.version() + "; unknown protocol");
        }
    };
    return Host;
}());
function resolvePath(p) {
    return p.replace(/\/+/g, "/").replace(/[^\/]+\/\.\.\//g, "").replace(/\/\.\//g, "/");
}
var theHost = new Host();
exports.mainPkg = new pxt.MainPackage(theHost);
function getEditorPkg(p) {
    var r = p._editorPkg;
    if (r)
        return r;
    var top = null;
    if (p != exports.mainPkg)
        top = getEditorPkg(exports.mainPkg);
    var newOne = new EditorPackage(p, top);
    if (p == exports.mainPkg)
        newOne.makeTopLevel();
    p._editorPkg = newOne;
    return newOne;
}
exports.getEditorPkg = getEditorPkg;
function mainEditorPkg() {
    return getEditorPkg(exports.mainPkg);
}
exports.mainEditorPkg = mainEditorPkg;
function genFileName(extension) {
    /* tslint:disable:no-control-regex */
    var sanitizedName = mainEditorPkg().header.name.replace(/[()\\\/.,?*^:<>!;'#$%^&|"@+=«»°{}\[\]¾½¼³²¦¬¤¢£~­¯¸`±\x00-\x1F]/g, '');
    sanitizedName = sanitizedName.trim().replace(/\s+/g, '-');
    /* tslint:enable:no-control-regex */
    if (pxt.appTarget.appTheme && pxt.appTarget.appTheme.fileNameExclusiveFilter) {
        var rx = new RegExp(pxt.appTarget.appTheme.fileNameExclusiveFilter, 'g');
        sanitizedName = sanitizedName.replace(rx, '');
    }
    if (!sanitizedName)
        sanitizedName = "Untitled"; // do not translate to avoid unicode issues
    var fn = (pxt.appTarget.nickname || pxt.appTarget.id) + "-" + sanitizedName + extension;
    return fn;
}
exports.genFileName = genFileName;
function allEditorPkgs() {
    return getEditorPkg(exports.mainPkg).pkgAndDeps();
}
exports.allEditorPkgs = allEditorPkgs;
function notifySyncDone(updated) {
    var newOnes = Util.values(exports.mainPkg.deps).filter(function (d) { return d.verProtocol() == "workspace" && updated.hasOwnProperty(d.verArgument()); });
    if (newOnes.length > 0) {
        getEditorPkg(exports.mainPkg).onupdate();
    }
}
exports.notifySyncDone = notifySyncDone;
function loadPkgAsync(id, targetVersion) {
    exports.mainPkg = new pxt.MainPackage(theHost);
    exports.mainPkg._verspec = "workspace:" + id;
    return theHost.downloadPackageAsync(exports.mainPkg)
        .catch(core.handleNetworkError)
        .then(function () { return ts.pxtc.Util.jsonTryParse(theHost.readFile(exports.mainPkg, pxt.CONFIG_NAME)); })
        .then(function (config) {
        if (!config) {
            exports.mainPkg.configureAsInvalidPackage(lf("invalid pxt.json file"));
            return mainEditorPkg().afterMainLoadAsync();
        }
        return exports.mainPkg.installAllAsync(targetVersion)
            .then(function () { return mainEditorPkg().afterMainLoadAsync(); });
    });
}
exports.loadPkgAsync = loadPkgAsync;
/*
    open-meta:<pkgName>/<filename> - readonly/saved/unsaved + number of errors
*/
data.mountVirtualApi("open-meta", {
    getSync: function (p) {
        p = data.stripProtocol(p);
        var pk = mainEditorPkg();
        var f = pk.lookupFile(p);
        if (!f)
            return {};
        var hasGit = !!(pk.header && pk.header.githubId && f.epkg == pk);
        var fs = {
            isReadonly: f.isReadonly(),
            isSaved: f.inSyncWithEditor && f.inSyncWithDisk,
            numErrors: f.numDiagnosticsOverride,
            isGitModified: hasGit && f.baseGitContent != f.content
        };
        if (fs.numErrors == null) {
            fs.numErrors = f.diagnostics ? f.diagnostics.length : 0;
            fs.diagnostics = f.diagnostics;
        }
        return fs;
    },
});
/*
    open-pkg-meta:<pkgName> - number of errors
*/
data.mountVirtualApi("open-pkg-meta", {
    getSync: function (p) {
        p = data.stripProtocol(p);
        var f = allEditorPkgs().filter(function (pkg) { return pkg.getPkgId() == p; })[0];
        if (!f || f.getPkgId() == "built")
            return {};
        var files = f.sortedFiles();
        var numErrors = files.reduce(function (n, file) { return n + (file.numDiagnosticsOverride
            || (file.diagnostics ? file.diagnostics.length : 0)
            || 0); }, 0);
        var ks = f.getKsPkg();
        if (ks && ks.invalid())
            numErrors++;
        var r = {
            numErrors: numErrors
        };
        if (numErrors) {
            r.diagnostics = [];
            files.filter(function (f) { return !!f.diagnostics; }).forEach(function (f) { return r.diagnostics.concat(f.diagnostics); });
        }
        var hasGit = f.getPkgId() == "this" && !!(f.header && f.header.githubId);
        if (hasGit)
            r.numFilesGitModified = files.filter(function (f) { return f.baseGitContent != f.content; }).length;
        return r;
    }
});
// pkg-status:<guid>
data.mountVirtualApi("pkg-status", {
    getSync: function (p) {
        p = data.stripProtocol(p);
        var ep = allEditorPkgs().filter(function (pkg) { return pkg.header && pkg.header.id == p; })[0];
        if (ep)
            return ep.savingNow ? "saving" : "";
        return "";
    },
});
