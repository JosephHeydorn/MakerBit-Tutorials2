"use strict";
/* tslint:disable:forin cli only run in node */
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../built/pxtlib.d.ts"/>
/// <reference path="../built/pxtcompiler.d.ts"/>
/// <reference path="../built/pxtpy.d.ts"/>
/// <reference path="../built/pxtsim.d.ts"/>
global.pxt = pxt;
var nodeutil = require("./nodeutil");
var crypto = require("crypto");
var fs = require("fs");
var os = require("os");
var path = require("path");
var child_process = require("child_process");
var U = pxt.Util;
var Cloud = pxt.Cloud;
var server = require("./server");
var build = require("./buildengine");
var commandParser = require("./commandparser");
var hid = require("./hid");
var gdb = require("./gdb");
var clidbg = require("./clidbg");
var pyconv = require("./pyconv");
var gitfs = require("./gitfs");
var rimraf = require('rimraf');
var forceCloudBuild = process.env["KS_FORCE_CLOUD"] !== "no";
var forceLocalBuild = !!process.env["PXT_FORCE_LOCAL"];
var forceBuild = false; // don't use cache
Error.stackTraceLimit = 100;
function parseBuildInfo(parsed) {
    var cloud = parsed && parsed.flags["cloudbuild"];
    var local = parsed && parsed.flags["localbuild"];
    var hwvariant = parsed && parsed.flags["hwvariant"];
    forceBuild = parsed && !!parsed.flags["force"];
    if (cloud && local)
        U.userError("cannot specify local-build and cloud-build together");
    if (cloud) {
        forceCloudBuild = true;
        forceLocalBuild = false;
    }
    if (local) {
        forceCloudBuild = false;
        forceLocalBuild = true;
    }
    if (hwvariant) {
        if (!/^hw---/.test(hwvariant))
            hwvariant = 'hw---' + hwvariant;
        pxt.debug("setting hardware variant to " + hwvariant);
        pxt.setHwVariant(hwvariant);
    }
}
var p = new commandParser.CommandParser();
function initTargetCommands() {
    var cmdsjs = path.join(nodeutil.targetDir, 'built/cmds.js');
    if (fs.existsSync(cmdsjs)) {
        pxt.debug("loading cli extensions...");
        var cli = require.main.require(cmdsjs);
        if (cli.deployAsync) {
            pxt.commands.deployFallbackAsync = cli.deployAsync;
        }
        if (cli.addCommands) {
            cli.addCommands(p);
        }
    }
}
var prevExports = global.savedModuleExports;
if (prevExports) {
    module.exports = prevExports;
}
var reportDiagnostic = reportDiagnosticSimply;
var targetJsPrefix = "var pxtTargetBundle = ";
function reportDiagnostics(diagnostics) {
    for (var _i = 0, diagnostics_1 = diagnostics; _i < diagnostics_1.length; _i++) {
        var diagnostic = diagnostics_1[_i];
        reportDiagnostic(diagnostic);
    }
}
function reportDiagnosticSimply(diagnostic) {
    var output = pxtc.getDiagnosticString(diagnostic);
    pxt.log(output);
}
function fatal(msg) {
    pxt.log("Fatal error: " + msg);
    throw new Error(msg);
}
exports.globalConfig = {};
function homePxtDir() {
    return path.join(process.env["HOME"] || process.env["UserProfile"], ".pxt");
}
function cacheDir() {
    return path.join(homePxtDir(), "cache");
}
function configPath() {
    return path.join(homePxtDir(), "config.json");
}
var homeDirsMade = false;
function mkHomeDirs() {
    if (homeDirsMade)
        return;
    homeDirsMade = true;
    if (!fs.existsSync(homePxtDir()))
        fs.mkdirSync(homePxtDir());
    if (!fs.existsSync(cacheDir()))
        fs.mkdirSync(cacheDir());
}
function saveConfig() {
    mkHomeDirs();
    nodeutil.writeFileSync(configPath(), JSON.stringify(exports.globalConfig, null, 4) + "\n");
}
function initConfigAsync() {
    var p = Promise.resolve();
    var atok = process.env["PXT_ACCESS_TOKEN"];
    if (fs.existsSync(configPath())) {
        var config = readJson(configPath());
        exports.globalConfig = config;
    }
    p.then(function () {
        if (atok) {
            var mm = /^(https?:.*)\?access_token=([\w\.]+)/.exec(atok);
            if (!mm) {
                console.error("Invalid accessToken format, expecting something like 'https://example.com/?access_token=0abcd.XXXX'");
                return;
            }
            Cloud.apiRoot = mm[1].replace(/\/$/, "").replace(/\/api$/, "") + "/api/";
            Cloud.accessToken = mm[2];
        }
    });
    return p;
}
function loadGithubTokenAsync() {
    pxt.github.token = process.env["GITHUB_ACCESS_TOKEN"];
    return Promise.resolve(pxt.github.token);
}
function searchAsync() {
    var query = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        query[_i] = arguments[_i];
    }
    return loadGithubTokenAsync()
        .then(function () { return pxt.packagesConfigAsync(); })
        .then(function (config) { return pxt.github.searchAsync(query.join(" "), config); })
        .then(function (res) {
        for (var _i = 0, res_1 = res; _i < res_1.length; _i++) {
            var r = res_1[_i];
            console.log(r.fullName + ": " + r.description);
        }
    });
}
function pkginfoAsync(repopath) {
    var parsed = pxt.github.parseRepoId(repopath);
    if (!parsed) {
        console.log('Unknown repo');
        return Promise.resolve();
    }
    var pkgInfo = function (cfg, tag) {
        pxt.log("name: " + cfg.name);
        pxt.log("description: " + cfg.description);
        if (pxt.appTarget.appTheme)
            pxt.log("shareable url: " + pxt.appTarget.appTheme.embedUrl + "#pub:gh/" + parsed.fullName + (tag ? "#" + tag : ""));
    };
    return loadGithubTokenAsync()
        .then(function () { return pxt.packagesConfigAsync(); })
        .then(function (config) {
        var status = pxt.github.repoStatus(parsed, config);
        pxt.log("github org: " + parsed.owner);
        if (parsed.tag)
            pxt.log("github tag: " + parsed.tag);
        pxt.log("package status: " + (status == pxt.github.GitRepoStatus.Approved ? "approved" : status == pxt.github.GitRepoStatus.Banned ? "banned" : "neutral"));
        if (parsed.tag)
            return pxt.github.downloadPackageAsync(repopath, config)
                .then(function (pkg) {
                var cfg = JSON.parse(pkg.files[pxt.CONFIG_NAME]);
                pkgInfo(cfg, parsed.tag);
                pxt.debug("size: " + JSON.stringify(pkg.files).length);
            });
        return pxt.github.pkgConfigAsync(parsed.fullName)
            .then(function (cfg) {
            pkgInfo(cfg);
            return pxt.github.listRefsAsync(repopath)
                .then(function (tags) {
                pxt.log("tags: " + tags.join(", "));
                return pxt.github.listRefsAsync(repopath, "heads");
            })
                .then(function (heads) {
                pxt.log("branches: " + heads.join(", "));
            });
        });
    });
}
function pokeRepoAsync(parsed) {
    var repo = parsed.args[0];
    var data = {
        repo: repo,
        getkey: false
    };
    if (parsed.flags["u"])
        data.getkey = true;
    return Cloud.privatePostAsync("pokerepo", data)
        .then(function (resp) {
        console.log(resp);
    });
}
exports.pokeRepoAsync = pokeRepoAsync;
function execCrowdinAsync(cmd) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    pxt.log("executing Crowdin command " + cmd + "...");
    var prj = pxt.appTarget.appTheme.crowdinProject;
    if (!prj) {
        console.log("crowdin operation skipped, crowdin project not specified in pxtarget.json");
        return Promise.resolve();
    }
    var branch = pxt.appTarget.appTheme.crowdinBranch;
    return crowdinCredentialsAsync()
        .then(function (crowdinCredentials) {
        if (!crowdinCredentials)
            return Promise.resolve();
        var key = crowdinCredentials.key;
        cmd = cmd.toLowerCase();
        if (!args[0] && (cmd != "clean" && cmd != "stats"))
            throw new Error(cmd == "status" ? "language missing" : "filename missing");
        switch (cmd) {
            case "stats": return statsCrowdinAsync(prj, key, args[0]);
            case "clean": return cleanCrowdinAsync(prj, key, args[0] || "docs");
            case "upload": return uploadCrowdinAsync(branch, prj, key, args[0], args[1]);
            case "download": {
                if (!args[1])
                    throw new Error("output path missing");
                var fn_1 = path.basename(args[0]);
                return pxt.crowdin.downloadTranslationsAsync(branch, prj, key, args[0], { translatedOnly: true, validatedOnly: true })
                    .then(function (r) {
                    Object.keys(r).forEach(function (k) {
                        var rtranslations = stringifyTranslations(r[k]);
                        if (!rtranslations)
                            return;
                        nodeutil.mkdirP(path.join(args[1], k));
                        var outf = path.join(args[1], k, fn_1);
                        console.log("writing " + outf);
                        nodeutil.writeFileSync(outf, rtranslations, { encoding: "utf8" });
                    });
                });
            }
            default: throw new Error("unknown command");
        }
    });
}
exports.execCrowdinAsync = execCrowdinAsync;
function cleanCrowdinAsync(prj, key, dir) {
    var p = pxt.appTarget.id + "/" + dir;
    return pxt.crowdin.listFilesAsync(prj, key, p)
        .then(function (files) {
        files.filter(function (f) { return !nodeutil.fileExistsSync(f.fullName.substring(pxt.appTarget.id.length + 1)); })
            .forEach(function (f) { return pxt.log("crowdin: dead file: " + (f.branch ? f.branch + "/" : "") + f.fullName); });
    });
}
function statsCrowdinAsync(prj, key, preferredLang) {
    pxt.log("collecting crowdin stats for " + prj + " " + (preferredLang ? "for language " + preferredLang : "all languages"));
    var fn = "crowdinstats.csv";
    var headers = 'sep=\t\r\n';
    headers += "id\tfile\t language\t completion\t phrases\t translated\t approved\r\n";
    nodeutil.writeFileSync(fn, headers, { encoding: "utf8" });
    console.log("id\tfile\t language\t completion\t phrases\t translated\t approved");
    return pxt.crowdin.projectInfoAsync(prj, key)
        .then(function (info) {
        if (!info)
            throw new Error("info failed");
        var languages = info.languages;
        if (preferredLang)
            languages = languages.filter(function (lang) { return lang.code.toLowerCase() == preferredLang.toLowerCase(); });
        return Promise.all(languages.map(function (lang) { return langStatsCrowdinAsync(prj, key, lang.code); }));
    }).then(function () {
        console.log("stats written to " + fn);
    });
    function langStatsCrowdinAsync(prj, key, lang) {
        return pxt.crowdin.languageStatsAsync(prj, key, lang)
            .then(function (stats) {
            var r = '';
            stats.forEach(function (stat) {
                var cfn = "" + (stat.branch ? stat.branch + "/" : "") + stat.fullName;
                r += stat.id + "\t" + cfn + "\t" + lang + "\t " + stat.phrases + "\t " + stat.translated + "\t " + stat.approved + "\r\n";
                if (stat.fullName == "strings.json" || /core-strings\.json$/.test(stat.fullName)) {
                    console.log(stat.id + "\t" + cfn + "\t" + lang + "\t " + ((stat.approved / stat.phrases * 100) >> 0) + "%\t " + stat.phrases + "\t " + stat.translated + "\t" + stat.approved);
                }
            });
            fs.appendFileSync(fn, r, { encoding: "utf8" });
        });
    }
}
function uploadCrowdinAsync(branch, prj, key, p, dir) {
    var fn = path.basename(p);
    if (dir)
        fn = dir.replace(/[\\/]*$/g, '') + '/' + fn;
    var data = JSON.parse(fs.readFileSync(p, "utf8"));
    pxt.log("upload " + fn + " (" + Object.keys(data).length + " strings) to https://crowdin.com/project/" + prj + (branch ? "?branch=" + branch : ''));
    return pxt.crowdin.uploadTranslationAsync(branch, prj, key, fn, JSON.stringify(data));
}
function apiAsync(path, postArguments) {
    if (postArguments == "delete") {
        return Cloud.privateDeleteAsync(path)
            .then(function (resp) { return console.log(resp); });
    }
    if (postArguments == "-") {
        return nodeutil.readResAsync(process.stdin)
            .then(function (buf) { return buf.toString("utf8"); })
            .then(function (str) { return apiAsync(path, str); });
    }
    if (postArguments && fs.existsSync(postArguments))
        postArguments = fs.readFileSync(postArguments, "utf8");
    var dat = postArguments ? JSON.parse(postArguments) : null;
    if (dat)
        console.log("POST", "/api/" + path, JSON.stringify(dat, null, 2));
    return Cloud.privateRequestAsync({
        url: path,
        data: dat
    })
        .then(function (resp) {
        if (resp.json)
            console.log(JSON.stringify(resp.json, null, 2));
        else
            console.log(resp.text);
    });
}
exports.apiAsync = apiAsync;
function uploadFileAsync(parsed) {
    var path = parsed.args[0];
    var buf = fs.readFileSync(path);
    var mime = U.getMime(path);
    console.log("Upload", path);
    return Cloud.privatePostAsync("upload/files", {
        filename: path,
        encoding: "base64",
        content: buf.toString("base64"),
        contentType: mime
    })
        .then(function (resp) {
        console.log(resp);
    });
}
var readlineCount = 0;
function readlineAsync() {
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    readlineCount++;
    return new Promise(function (resolve, reject) {
        process.stdin.once('data', function (text) {
            resolve(text);
        });
    });
}
function queryAsync(msg, defl) {
    process.stdout.write(msg + " [" + defl + "]: ");
    return readlineAsync()
        .then(function (text) {
        text = text.trim();
        if (!text)
            return defl;
        else
            return text;
    });
}
exports.queryAsync = queryAsync;
function yesNoAsync(msg) {
    process.stdout.write(msg + " (y/n): ");
    return readlineAsync()
        .then(function (text) {
        if (text.trim().toLowerCase() == "y")
            return Promise.resolve(true);
        else if (text.trim().toLowerCase() == "n")
            return Promise.resolve(false);
        else
            return yesNoAsync(msg);
    });
}
exports.yesNoAsync = yesNoAsync;
function onlyExts(files, exts) {
    return files.filter(function (f) { return exts.indexOf(path.extname(f)) >= 0; });
}
function pxtFileList(pref) {
    return nodeutil.allFiles(pref + "webapp/public")
        .concat(onlyExts(nodeutil.allFiles(pref + "built/web", 1), [".js", ".css"]))
        .concat(nodeutil.allFiles(pref + "built/web/fonts", 1))
        .concat(nodeutil.allFiles(pref + "built/web/vs", 4));
}
function semverCmp(a, b) {
    var parse = function (s) {
        var v = s.split(/\./).map(parseInt);
        return v[0] * 100000000 + v[1] * 10000 + v[2];
    };
    return parse(a) - parse(b);
}
var readJson = nodeutil.readJson;
function travisAsync() {
    forceCloudBuild = true;
    var rel = process.env.TRAVIS_TAG || "";
    var atok = process.env.NPM_ACCESS_TOKEN;
    var npmPublish = /^v\d+\.\d+\.\d+$/.exec(rel) && atok;
    if (npmPublish) {
        var npmrc = path.join(process.env.HOME, ".npmrc");
        console.log("Setting up " + npmrc);
        var cfg = "//registry.npmjs.org/:_authToken=" + atok + "\n";
        fs.writeFileSync(npmrc, cfg);
    }
    var branch = process.env.TRAVIS_BRANCH || "local";
    var latest = branch == "master" ? "latest" : "git-" + branch;
    // upload locs on build on master
    var uploadLocs = /^(master|v\d+\.\d+\.\d+)$/.test(process.env.TRAVIS_BRANCH)
        && /^false$/.test(process.env.TRAVIS_PULL_REQUEST);
    console.log("TRAVIS_TAG:", rel);
    console.log("TRAVIS_BRANCH:", process.env.TRAVIS_BRANCH);
    console.log("TRAVIS_PULL_REQUEST:", process.env.TRAVIS_PULL_REQUEST);
    console.log("uploadLocs:", uploadLocs);
    console.log("latest:", latest);
    function npmPublishAsync() {
        if (!npmPublish)
            return Promise.resolve();
        return nodeutil.runNpmAsync("publish");
    }
    var pkg = readJson("package.json");
    if (pkg["name"] == "pxt-core") {
        pxt.log("pxt-core build");
        var p_1 = npmPublishAsync();
        if (uploadLocs)
            p_1 = p_1
                .then(function () { return execCrowdinAsync("upload", "built/strings.json"); })
                .then(function () { return buildWebStringsAsync(); })
                .then(function () { return execCrowdinAsync("upload", "built/webstrings.json"); })
                .then(function () { return internalUploadTargetTranslationsAsync(!!rel); });
        return p_1;
    }
    else {
        pxt.log("target build");
        return internalBuildTargetAsync()
            .then(function () { return internalCheckDocsAsync(true); })
            .then(function () { return blockTestsAsync(); })
            .then(function () { return npmPublishAsync(); })
            .then(function () {
            if (!process.env["PXT_ACCESS_TOKEN"]) {
                // pull request, don't try to upload target
                pxt.log('no token, skipping upload');
                return Promise.resolve();
            }
            var trg = readLocalPxTarget();
            var label = trg.id + "/" + (rel || latest);
            pxt.log("uploading target with label " + label + "...");
            return uploadTargetAsync(label);
        })
            .then(function () {
            pxt.log("target uploaded");
            if (uploadLocs) {
                pxt.log("uploading translations...");
                return internalUploadTargetTranslationsAsync(!!rel)
                    .then(function () { return pxt.log("translations uploaded"); });
            }
            pxt.log("skipping translations upload");
            return Promise.resolve();
        });
    }
}
function bumpPxtCoreDepAsync() {
    var pkg = readJson("package.json");
    if (pkg["name"] == "pxt-core")
        return Promise.resolve(pkg);
    var gitPull = Promise.resolve();
    var commitMsg = "";
    ["pxt-core", "pxt-common-packages"].forEach(function (knownPackage) {
        var modulePath = path.join("node_modules", knownPackage);
        if (fs.existsSync(path.join(modulePath, ".git"))) {
            gitPull = gitPull.then(function () { return nodeutil.spawnAsync({
                cmd: "git",
                args: ["pull"],
                cwd: modulePath
            }); });
        }
        // not referenced
        if (!fs.existsSync(path.join(modulePath, "package.json")))
            return;
        gitPull
            .then(function () {
            var kspkg = readJson(path.join(modulePath, "package.json"));
            var currVer = pkg["dependencies"][knownPackage];
            if (!currVer)
                return; // not referenced
            var newVer = kspkg["version"];
            if (currVer == newVer) {
                console.log("Referenced " + knownPackage + " dep up to date: " + currVer);
                return;
            }
            console.log("Bumping " + knownPackage + " dep version: " + currVer + " -> " + newVer);
            if (currVer != "*" && pxt.semver.strcmp(currVer, newVer) > 0) {
                U.userError("Trying to downgrade " + knownPackage + ".");
            }
            if (currVer != "*" && pxt.semver.majorCmp(currVer, newVer) < 0) {
                U.userError("Trying to automatically update major version, please edit package.json manually.");
            }
            pkg["dependencies"][knownPackage] = newVer;
            nodeutil.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");
            commitMsg += (commitMsg ? ", " : "") + "bump " + knownPackage + " to " + newVer;
        });
    });
    gitPull = gitPull
        .then(function () { return commitMsg ? nodeutil.runGitAsync("commit", "-m", commitMsg, "--", "package.json") : Promise.resolve(); });
    return gitPull;
}
function updateAsync() {
    return Promise.resolve()
        .then(function () { return nodeutil.runGitAsync("pull"); })
        .then(function () { return bumpPxtCoreDepAsync(); })
        .then(function () { return nodeutil.runNpmAsync("install"); });
}
function justBumpPkgAsync() {
    ensurePkgDir();
    return nodeutil.needsGitCleanAsync()
        .then(function () { return mainPkg.loadAsync(); })
        .then(function () {
        var v = pxt.semver.parse(mainPkg.config.version);
        v.patch++;
        return queryAsync("New version", pxt.semver.stringify(v));
    })
        .then(function (nv) {
        var v = pxt.semver.parse(nv);
        mainPkg.config.version = pxt.semver.stringify(v);
        mainPkg.saveConfig();
    })
        .then(function () { return nodeutil.runGitAsync("commit", "-a", "-m", mainPkg.config.version); })
        .then(function () { return nodeutil.runGitAsync("tag", "v" + mainPkg.config.version); });
}
function tagReleaseAsync(parsed) {
    var tag = parsed.args[0];
    var version = parsed.args[1];
    var npm = !!parsed.flags["npm"];
    // check that ...-ref.json exists for that tag
    var fn = path.join('docs', tag + "-ref.json");
    pxt.log("checking " + fn);
    if (!fn)
        U.userError("file " + fn + " does not exist");
    var v = pxt.semver.normalize(version);
    var npmPkg = "pxt-" + pxt.appTarget.id;
    if (!pxt.appTarget.appTheme.githubUrl)
        U.userError('pxtarget theme missing "githubUrl" entry');
    // check that tag exists in github
    pxt.log("checking github " + pxt.appTarget.appTheme.githubUrl + " tag v" + v);
    return U.requestAsync({
        url: pxt.appTarget.appTheme.githubUrl.replace(/\/$/, '') + "/releases/tag/v" + v,
        method: "GET"
    })
        .then(function () {
        if (!npm)
            return Promise.resolve();
        pxt.log("checking npm " + npmPkg + " release");
        return nodeutil.npmRegistryAsync(npmPkg)
            .then(function (registry) {
            // verify that npm version exists
            if (!registry.versions[v])
                U.userError("cannot find npm package " + npmPkg + "@" + v);
            var npmTag = tag == "index" ? "latest" : tag;
            return nodeutil.runNpmAsync("dist-tag", "add", npmPkg + "@v" + v, npmTag);
        });
    })
        .then(function () {
        // update index file
        nodeutil.writeFileSync(fn, JSON.stringify({
            "appref": "v" + v
        }, null, 4));
        // TODO commit changes
        console.log("please commit " + fn + " changes");
    });
}
function bumpAsync(parsed) {
    var bumpPxt = parsed && parsed.flags["update"];
    var upload = parsed && parsed.flags["upload"];
    if (fs.existsSync(pxt.CONFIG_NAME)) {
        if (upload)
            throw U.userError("upload only supported on targets");
        return Promise.resolve()
            .then(function () { return nodeutil.runGitAsync("pull"); })
            .then(function () { return justBumpPkgAsync(); })
            .then(function () { return nodeutil.runGitAsync("push", "--tags"); })
            .then(function () { return nodeutil.runGitAsync("push"); });
    }
    else if (fs.existsSync("pxtarget.json"))
        return Promise.resolve()
            .then(function () { return nodeutil.runGitAsync("pull"); })
            .then(function () { return bumpPxt ? bumpPxtCoreDepAsync().then(function () { return nodeutil.runGitAsync("push"); }) : Promise.resolve(); })
            .then(function () { return nodeutil.runNpmAsync("version", "patch"); })
            .then(function () { return nodeutil.runGitAsync("push", "--tags"); })
            .then(function () { return nodeutil.runGitAsync("push"); })
            .then(function () { return upload ? uploadTaggedTargetAsync() : Promise.resolve(); });
    else {
        throw U.userError("Couldn't find package or target JSON file; nothing to bump");
    }
}
function uploadTaggedTargetAsync() {
    forceCloudBuild = true;
    return loadGithubTokenAsync()
        .then(function (token) {
        if (!token) {
            fatal("GitHub token not found, please use 'pxt login' to login with your GitHub account to push releases.");
            return Promise.resolve();
        }
        return nodeutil.needsGitCleanAsync()
            .then(function () { return Promise.all([
            nodeutil.currGitTagAsync(),
            nodeutil.gitInfoAsync(["rev-parse", "--abbrev-ref", "HEAD"]),
            nodeutil.gitInfoAsync(["rev-parse", "HEAD"])
        ]); })
            .then(function (info) {
            return internalBuildTargetAsync()
                .then(function () { return internalCheckDocsAsync(true); })
                .then(function () { return info; });
        })
            .then(function (info) {
            process.env["TRAVIS_TAG"] = info[0];
            process.env['TRAVIS_BRANCH'] = info[1];
            process.env['TRAVIS_COMMIT'] = info[2];
            var repoSlug = "microsoft/pxt-" + pxt.appTarget.id;
            process.env['TRAVIS_REPO_SLUG'] = repoSlug;
            process.env['PXT_RELEASE_REPO'] = "https://git:" + token + "@github.com/" + repoSlug + "-built";
            var v = pkgVersion();
            pxt.log("uploading " + v);
            return uploadCoreAsync({
                label: "v" + v,
                fileList: pxtFileList("node_modules/pxt-core/").concat(targetFileList()),
                pkgversion: v,
                githubOnly: true,
                fileContent: {}
            });
        });
    });
}
function pkgVersion() {
    var ver = readJson("package.json")["version"];
    var info = travisInfo();
    if (!info.tag)
        ver += "-" + (info.commit ? info.commit.slice(0, 6) : "local");
    return ver;
}
function targetFileList() {
    var lst = onlyExts(nodeutil.allFiles("built"), [".js", ".css", ".json", ".webmanifest"])
        .concat(nodeutil.allFiles(path.join(simDir(), "public")));
    if (simDir() != "sim")
        lst = lst.concat(nodeutil.allFiles(path.join("sim", "public"), 5, true));
    pxt.debug("target files (on disk): " + lst.join('\r\n    '));
    return lst;
}
function uploadTargetAsync(label) {
    return uploadCoreAsync({
        label: label,
        fileList: pxtFileList("node_modules/pxt-core/").concat(targetFileList()),
        pkgversion: pkgVersion(),
        fileContent: {}
    });
}
function uploadTargetReleaseAsync(parsed) {
    parseBuildInfo(parsed);
    var label = parsed.args[0];
    var rebundle = !!parsed.flags["rebundle"];
    return (rebundle ? rebundleAsync() : internalBuildTargetAsync())
        .then(function () {
        return uploadTargetAsync(label);
    });
}
exports.uploadTargetReleaseAsync = uploadTargetReleaseAsync;
function uploadTargetRefsAsync(repoPath) {
    if (repoPath)
        process.chdir(repoPath);
    return nodeutil.needsGitCleanAsync()
        .then(function () { return Promise.all([
        nodeutil.gitInfoAsync(["rev-parse", "HEAD"]),
        nodeutil.gitInfoAsync(["config", "--get", "remote.origin.url"])
    ]); })
        .then(function (info) {
        return gitfs.uploadRefs(info[0], info[1])
            .then(function () {
            return Promise.resolve();
        });
    });
}
exports.uploadTargetRefsAsync = uploadTargetRefsAsync;
function uploadFileName(p) {
    // normalize /, \ before filtering
    return p.replace(/\\/g, '\/')
        .replace(/^.*(built\/web\/|\w+\/public\/|built\/)/, "");
}
function gitUploadAsync(opts, uplReqs) {
    var reqs = U.unique(U.values(uplReqs), function (r) { return r.hash; });
    console.log("Asking for", reqs.length, "hashes");
    return Promise.resolve()
        .then(function () { return Cloud.privatePostAsync("upload/status", {
        hashes: reqs.map(function (r) { return r.hash; })
    }); })
        .then(function (resp) {
        var missing = U.toDictionary(resp.missing, function (s) { return s; });
        var missingReqs = reqs.filter(function (r) { return !!U.lookup(missing, r.hash); });
        var size = 0;
        for (var _i = 0, missingReqs_1 = missingReqs; _i < missingReqs_1.length; _i++) {
            var r = missingReqs_1[_i];
            size += r.size;
        }
        console.log("files missing: ", missingReqs.length, size, "bytes");
        return Promise.map(missingReqs, function (r) { return Cloud.privatePostAsync("upload/blob", r)
            .then(function () {
            console.log(r.filename + ": OK," + r.size + " " + r.hash);
        }); });
    })
        .then(function () {
        var roottree = {};
        var get = function (tree, path) {
            var subt = U.lookup(tree, path);
            if (!subt)
                subt = tree[path] = {};
            return subt;
        };
        var lookup = function (tree, path) {
            var m = /^([^\/]+)\/(.*)/.exec(path);
            if (m) {
                var subt = get(tree, m[1]);
                U.assert(!subt.hash);
                if (!subt.subtree)
                    subt.subtree = {};
                return lookup(subt.subtree, m[2]);
            }
            else {
                return get(tree, path);
            }
        };
        for (var _i = 0, _a = Object.keys(uplReqs); _i < _a.length; _i++) {
            var fn = _a[_i];
            var e = lookup(roottree, fn);
            e.hash = uplReqs[fn].hash;
        }
        var info = travisInfo();
        var data = {
            message: "Upload from " + info.commitUrl,
            parents: [],
            target: pxt.appTarget.id,
            tree: roottree,
        };
        console.log("Creating commit...");
        return Cloud.privatePostAsync("upload/commit", data);
    })
        .then(function (res) {
        console.log("Commit:", res);
        return uploadToGitRepoAsync(opts, uplReqs);
    });
}
function uploadToGitRepoAsync(opts, uplReqs) {
    var label = opts.label;
    if (!label) {
        console.log('no label; skip release upload');
        return Promise.resolve();
    }
    var tid = pxt.appTarget.id;
    if (U.startsWith(label, tid + "/"))
        label = label.slice(tid.length + 1);
    if (!/^v\d/.test(label)) {
        console.log('label is not a version; skipping release upload');
        return Promise.resolve();
    }
    var repoUrl = process.env["PXT_RELEASE_REPO"];
    if (!repoUrl) {
        console.log("no $PXT_RELEASE_REPO variable; not uploading label " + label);
        return Promise.resolve();
    }
    nodeutil.mkdirP("tmp");
    var trgPath = "tmp/releases";
    var mm = /^https:\/\/([^:]+):([^@]+)@([^\/]+)(.*)/.exec(repoUrl);
    if (!mm) {
        U.userError("wrong format for $PXT_RELEASE_REPO");
    }
    console.log("create release " + label + " in " + repoUrl);
    var user = mm[1];
    var pass = mm[2];
    var host = mm[3];
    var netRcLine = "machine " + host + " login " + user + " password " + pass + "\n";
    repoUrl = "https://" + user + "@" + host + mm[4];
    var homePath = process.env["HOME"] || process.env["UserProfile"];
    var netRcPath = path.join(homePath, /^win/.test(process.platform) ? "_netrc" : ".netrc");
    var prevNetRc = fs.existsSync(netRcPath) ? fs.readFileSync(netRcPath, "utf8") : null;
    var newNetRc = prevNetRc ? prevNetRc + "\n" + netRcLine : netRcLine;
    console.log("Adding credentials to " + netRcPath);
    fs.writeFileSync(netRcPath, newNetRc, {
        encoding: "utf8",
        mode: '600'
    });
    var cuser = process.env["USER"] || "";
    if (cuser && !/travis/.test(cuser))
        user += "-" + cuser;
    var cred = [
        "-c", "credential.helper=",
        "-c", "user.name=" + user,
        "-c", "user.email=" + user + "@build.pxt.io",
    ];
    var gitAsync = function (args) { return nodeutil.spawnAsync({
        cmd: "git",
        cwd: trgPath,
        args: cred.concat(args)
    }); };
    var info = travisInfo();
    return Promise.resolve()
        .then(function () {
        if (fs.existsSync(trgPath)) {
            var cfg = fs.readFileSync(trgPath + "/.git/config", "utf8");
            if (cfg.indexOf("url = " + repoUrl) > 0) {
                return gitAsync(["pull", "--depth=3"]);
            }
            else {
                throw U.userError(trgPath + " already exists; please remove it");
            }
        }
        else {
            return nodeutil.spawnAsync({
                cmd: "git",
                args: cred.concat(["clone", "--depth", "3", repoUrl, trgPath]),
                cwd: "."
            });
        }
    })
        .then(function () {
        for (var _i = 0, _a = U.values(uplReqs); _i < _a.length; _i++) {
            var u = _a[_i];
            var fpath = path.join(trgPath, u.filename);
            nodeutil.mkdirP(path.dirname(fpath));
            fs.writeFileSync(fpath, u.content, { encoding: u.encoding });
        }
        // make sure there's always something to commit
        fs.writeFileSync(trgPath + "/stamp.txt", new Date().toString());
    })
        .then(function () { return gitAsync(["add", "."]); })
        .then(function () { return gitAsync(["commit", "-m", "Release " + label + " from " + info.commitUrl]); })
        .then(function () { return gitAsync(["tag", label]); })
        .then(function () { return gitAsync(["push"]); })
        .then(function () { return gitAsync(["push", "--tags"]); })
        .then(function () {
    })
        .finally(function () {
        if (prevNetRc == null) {
            console.log("Removing " + netRcPath);
            fs.unlinkSync(netRcPath);
        }
        else {
            console.log("Restoring " + netRcPath);
            fs.writeFileSync(netRcPath, prevNetRc, {
                mode: '600'
            });
        }
    });
}
function uploadArtFile(fn) {
    if (!fn || /^(https?|data):/.test(fn))
        return fn; // nothing to do
    fn = fn.replace(/^\.?\/*/, "/");
    return "@cdnUrl@/blob/" + gitHash(fs.readFileSync("docs" + fn)) + "" + fn;
}
function gitHash(buf) {
    var hash = crypto.createHash("sha1");
    hash.update(Buffer.from("blob " + buf.length + "\u0000", "utf8"));
    hash.update(buf);
    return hash.digest("hex");
}
function uploadCoreAsync(opts) {
    var targetConfig = readLocalPxTarget();
    var defaultLocale = targetConfig.appTheme.defaultLocale;
    var hexCache = path.join("built", "hexcache");
    var hexFiles = [];
    if (fs.existsSync(hexCache)) {
        hexFiles = fs.readdirSync(hexCache)
            .filter(function (f) { return /\.hex$/.test(f); })
            .filter(function (f) { return fs.readFileSync(path.join(hexCache, f), { encoding: "utf8" }) != "SKIP"; })
            .map(function (f) { return "@cdnUrl@/compile/" + f; });
        pxt.log("hex cache:\n\t" + hexFiles.join('\n\t'));
    }
    var logos = targetConfig.appTheme;
    var targetImages = Object.keys(logos)
        .filter(function (k) { return /(logo|hero)$/i.test(k) && /^\.\//.test(logos[k]); });
    var targetImagesHashed = pxt.Util.unique(targetImages.map(function (k) { return uploadArtFile(logos[k]); }), function (url) { return url; });
    var targetEditorJs = "";
    if (pxt.appTarget.appTheme && pxt.appTarget.appTheme.extendEditor)
        targetEditorJs = "@commitCdnUrl@editor.js";
    var targetFieldEditorsJs = "";
    if (pxt.appTarget.appTheme && pxt.appTarget.appTheme.extendFieldEditors)
        targetFieldEditorsJs = "@commitCdnUrl@fieldeditors.js";
    var replacements = {
        "/sim/simulator.html": "@simUrl@",
        "/sim/siminstructions.html": "@partsUrl@",
        "/sim/sim.webmanifest": "@relprefix@webmanifest",
        "/embed.js": "@targetUrl@@relprefix@embed",
        "/cdn/": "@commitCdnUrl@",
        "/doccdn/": "@commitCdnUrl@",
        "/sim/": "@commitCdnUrl@",
        "/blb/": "@blobCdnUrl@",
        "@timestamp@": "",
        "data-manifest=\"\"": "@manifest@",
        "var pxtConfig = null": "var pxtConfig = @cfg@",
        "@defaultLocaleStrings@": defaultLocale ? "@commitCdnUrl@" + "locales/" + defaultLocale + "/strings.json" : "",
        "@cachedHexFiles@": hexFiles.length ? hexFiles.join("\n") : "",
        "@targetEditorJs@": targetEditorJs,
        "@targetFieldEditorsJs@": targetFieldEditorsJs,
        "@targetImages@": targetImagesHashed.length ? targetImagesHashed.join('\n') : ''
    };
    if (opts.localDir) {
        var cfg = {
            "relprefix": opts.localDir,
            "verprefix": "",
            "workerjs": opts.localDir + "worker.js",
            "monacoworkerjs": opts.localDir + "monacoworker.js",
            "gifworkerjs": opts.localDir + "gifjs/gif.worker.js",
            "pxtVersion": pxtVersion(),
            "pxtRelId": "",
            "pxtCdnUrl": opts.localDir,
            "commitCdnUrl": opts.localDir,
            "blobCdnUrl": opts.localDir,
            "cdnUrl": opts.localDir,
            "targetVersion": opts.pkgversion,
            "targetRelId": "",
            "targetUrl": "",
            "targetId": opts.target,
            "simUrl": opts.localDir + "simulator.html",
            "partsUrl": opts.localDir + "siminstructions.html",
            "runUrl": opts.localDir + "run.html",
            "docsUrl": opts.localDir + "docs.html",
            "isStatic": true,
        };
        replacements = {
            "/embed.js": opts.localDir + "embed.js",
            "/cdn/": opts.localDir,
            "/doccdn/": opts.localDir,
            "/sim/": opts.localDir,
            "/blb/": opts.localDir,
            "@monacoworkerjs@": opts.localDir + "monacoworker.js",
            "@gifworkerjs@": opts.localDir + "gifjs/gif.worker.js",
            "@workerjs@": opts.localDir + "worker.js",
            "@timestamp@": "# ver " + new Date().toString(),
            "var pxtConfig = null": "var pxtConfig = " + JSON.stringify(cfg, null, 4),
            "@defaultLocaleStrings@": "",
            "@cachedHexFiles@": "",
            "@targetEditorJs@": targetEditorJs ? opts.localDir + "editor.js" : "",
            "@targetFieldEditorsJs@": targetFieldEditorsJs ? opts.localDir + "fieldeditors.js" : "",
            "@targetImages@": targetImages.length ? targetImages.map(function (k) {
                return "" + opts.localDir + path.join('./docs', logos[k]);
            }).join('\n') : ''
        };
        if (!opts.noAppCache) {
            replacements["data-manifest=\"\""] = "manifest=\"" + opts.localDir + "release.manifest\"";
        }
    }
    var replFiles = [
        "index.html",
        "embed.js",
        "run.html",
        "docs.html",
        "siminstructions.html",
        "codeembed.html",
        "release.manifest",
        "worker.js",
        "monacoworker.js",
        "simulator.html",
        "sim.manifest",
        "sim.webmanifest",
    ];
    nodeutil.mkdirP("built/uploadrepl");
    var uplReqs = {};
    var uploadFileAsync = function (p) {
        var rdf = null;
        if (opts.fileContent) {
            var s = U.lookup(opts.fileContent, p);
            if (s != null)
                rdf = Promise.resolve(Buffer.from(s, "utf8"));
        }
        if (!rdf) {
            if (!fs.existsSync(p))
                return undefined;
            rdf = readFileAsync(p);
        }
        var uglify = opts.minify ? require("uglify-js") : undefined;
        var fileName = uploadFileName(p);
        var mime = U.getMime(p);
        var minified = opts.minify && mime == "application/javascript" && fileName !== "target.js";
        pxt.log("    " + p + " -> " + fileName + " (" + mime + ")" + (minified ? ' minified' : ""));
        var isText = /^(text\/.*|application\/.*(javascript|json))$/.test(mime);
        var content = "";
        var data;
        return rdf.then(function (rdata) {
            data = rdata;
            if (isText) {
                content = data.toString("utf8");
                if (fileName == "index.html") {
                    if (!opts.localDir) {
                        var m = pxt.appTarget.appTheme;
                        for (var _i = 0, _a = Object.keys(m); _i < _a.length; _i++) {
                            var k = _a[_i];
                            if (/CDN$/.test(k))
                                m[k.slice(0, k.length - 3)] = m[k];
                        }
                    }
                    content = server.expandHtml(content);
                }
                if (/^sim/.test(fileName)) {
                    // just force blobs for everything in simulator manifest
                    content = content.replace(/\/(cdn|sim)\//g, "/blb/");
                }
                if (minified) {
                    var res = uglify.minify(content);
                    if (!res.error) {
                        content = res.code;
                    }
                    else {
                        pxt.log("        Could not minify " + fileName + " " + res.error);
                    }
                }
                if (replFiles.indexOf(fileName) >= 0) {
                    for (var _b = 0, _c = Object.keys(replacements); _b < _c.length; _b++) {
                        var from = _c[_b];
                        content = U.replaceAll(content, from, replacements[from]);
                    }
                    if (opts.localDir) {
                        data = Buffer.from(content, "utf8");
                    }
                    else {
                        // save it for developer inspection
                        fs.writeFileSync("built/uploadrepl/" + fileName, content);
                    }
                }
                else if (fileName == "target.json" || fileName == "target.js") {
                    var isJs = fileName == "target.js";
                    if (isJs)
                        content = content.slice(targetJsPrefix.length);
                    var trg_1 = JSON.parse(content);
                    if (opts.localDir) {
                        for (var _d = 0, _e = trg_1.appTheme.docMenu; _d < _e.length; _d++) {
                            var e = _e[_d];
                            if (e.path[0] == "/") {
                                e.path = opts.localDir + "docs" + e.path;
                            }
                        }
                        trg_1.appTheme.homeUrl = opts.localDir;
                        // patch icons in bundled packages
                        Object.keys(trg_1.bundledpkgs).forEach(function (pkgid) {
                            var res = trg_1.bundledpkgs[pkgid];
                            // path config before storing
                            var config = JSON.parse(res[pxt.CONFIG_NAME]);
                            if (/^\//.test(config.icon))
                                config.icon = opts.localDir + "docs" + config.icon;
                            res[pxt.CONFIG_NAME] = JSON.stringify(config, null, 4);
                        });
                        data = Buffer.from((isJs ? targetJsPrefix : '') + JSON.stringify(trg_1, null, 2), "utf8");
                    }
                    else {
                        if (trg_1.simulator
                            && trg_1.simulator.boardDefinition
                            && trg_1.simulator.boardDefinition.visual) {
                            var boardDef = trg_1.simulator.boardDefinition.visual;
                            if (boardDef.image) {
                                boardDef.image = uploadArtFile(boardDef.image);
                                if (boardDef.outlineImage)
                                    boardDef.outlineImage = uploadArtFile(boardDef.outlineImage);
                            }
                        }
                        // patch icons in bundled packages
                        Object.keys(trg_1.bundledpkgs).forEach(function (pkgid) {
                            var res = trg_1.bundledpkgs[pkgid];
                            // path config before storing
                            var config = JSON.parse(res[pxt.CONFIG_NAME]);
                            if (config.icon)
                                config.icon = uploadArtFile(config.icon);
                            res[pxt.CONFIG_NAME] = JSON.stringify(config, null, 2);
                        });
                        content = JSON.stringify(trg_1, null, 4);
                        if (isJs)
                            content = targetJsPrefix + content;
                    }
                }
            }
            else {
                content = data.toString("base64");
            }
            return Promise.resolve();
        }).then(function () {
            if (opts.localDir) {
                U.assert(!!opts.builtPackaged);
                var fn = path.join(opts.builtPackaged, opts.localDir, fileName);
                nodeutil.mkdirP(path.dirname(fn));
                return minified ? writeFileAsync(fn, content) : writeFileAsync(fn, data);
            }
            var req = {
                encoding: isText ? "utf8" : "base64",
                content: content,
                hash: "",
                filename: fileName,
                size: 0
            };
            var buf = Buffer.from(req.content, req.encoding);
            req.size = buf.length;
            req.hash = gitHash(buf);
            uplReqs[fileName] = req;
            return Promise.resolve();
        });
    };
    // only keep the last version of each uploadFileName()
    opts.fileList = U.values(U.toDictionary(opts.fileList, uploadFileName));
    if (opts.localDir)
        return Promise.map(opts.fileList, uploadFileAsync, { concurrency: 15 })
            .then(function () {
            pxt.log("Release files written to " + path.join(opts.builtPackaged, opts.localDir));
        });
    return Promise.map(opts.fileList, uploadFileAsync, { concurrency: 15 })
        .then(function () {
        return opts.githubOnly
            ? uploadToGitRepoAsync(opts, uplReqs)
            : gitUploadAsync(opts, uplReqs);
    });
}
function readLocalPxTarget() {
    if (!fs.existsSync("pxtarget.json")) {
        console.error("This command requires pxtarget.json in current directory.");
        process.exit(1);
    }
    nodeutil.setTargetDir(process.cwd());
    var cfg = readJson("pxtarget.json");
    cfg.versions = {
        target: readJson("package.json")["version"]
    };
    return cfg;
}
function forEachBundledPkgAsync(f, includeProjects) {
    if (includeProjects === void 0) { includeProjects = false; }
    var prev = process.cwd();
    var folders = pxt.appTarget.bundleddirs;
    if (includeProjects) {
        var projects = nodeutil.allFiles("libs", 1, /*allowMissing*/ false, /*includeDirs*/ true).filter(function (f) { return /prj$/.test(f); });
        folders = folders.concat(projects);
    }
    return Promise.mapSeries(folders, function (dirname) {
        var host = new Host();
        var pkgPath = path.join(nodeutil.targetDir, dirname);
        pxt.debug("building bundled package at " + pkgPath);
        // if the package is under node_modules/ , slurp any existing files
        var m = /node_modules[\\\/][^\\\/]*[\\\/]libs[\\\/](\w+)$/i.exec(pkgPath);
        if (m) {
            var bdir = m[1];
            var overridePath_1 = path.join("libs", bdir);
            pxt.debug("override with files from " + overridePath_1);
            if (nodeutil.existsDirSync(overridePath_1)) {
                host.fileOverrides = {};
                nodeutil.allFiles(overridePath_1)
                    .filter(function (f) { return fs.existsSync(f); })
                    .forEach(function (f) { return host.fileOverrides[path.relative(overridePath_1, f)] = fs.readFileSync(f, "utf8"); });
                pxt.debug("file overrides: " + Object.keys(host.fileOverrides).join(', '));
            }
            else {
                pxt.debug("override folder " + overridePath_1 + " not present");
            }
        }
        process.chdir(pkgPath);
        mainPkg = new pxt.MainPackage(host);
        return f(mainPkg, dirname);
    })
        .finally(function () { return process.chdir(prev); })
        .then(function () { });
}
function ghpSetupRepoAsync() {
    function getreponame() {
        var cfg = fs.readFileSync("gh-pages/.git/config", "utf8");
        var m = /^\s*url\s*=\s*.*github.*\/([^\/\s]+)$/mi.exec(cfg);
        if (!m)
            U.userError("cannot determine GitHub repo name");
        return m[1].replace(/\.git$/, "");
    }
    if (fs.existsSync("gh-pages")) {
        console.log("Skipping init of gh-pages; you can delete it first to get full re-init");
        return Promise.resolve(getreponame());
    }
    nodeutil.cpR(".git", "gh-pages/.git");
    return ghpGitAsync("checkout", "gh-pages")
        .then(function () { return getreponame(); });
}
function ghpGitAsync() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    return nodeutil.spawnAsync({
        cmd: "git",
        cwd: "gh-pages",
        args: args
    });
}
function ghpInitAsync() {
    if (fs.existsSync("gh-pages/.git"))
        return Promise.resolve();
    nodeutil.cpR(".git", "gh-pages/.git");
    return ghpGitAsync("checkout", "gh-pages")
        .then(function () { return Promise.resolve(); }) // branch already exists
        .catch(function (e) { return ghpGitAsync("checkout", "--orphan", "gh-pages"); })
        .then(function () { return ghpGitAsync("rm", "-rf", "."); })
        .then(function () {
        nodeutil.writeFileSync("gh-pages/index.html", "Under construction.");
        nodeutil.writeFileSync("gh-pages/.gitattributes", "# enforce unix style line endings\n*.ts text eol=lf\n*.tsx text eol=lf\n*.md text eol=lf\n*.txt text eol=lf\n*.js text eol=lf\n*.json text eol=lf\n*.xml text eol=lf\n*.svg text eol=lf\n*.yaml text eol=lf\n*.css text eol=lf\n*.html text eol=lf\n*.py text eol=lf\n*.exp text eol=lf\n*.manifest text eol=lf\n\n# do not enforce text for everything - it causes issues with random binary files\n\n*.sln text eol=crlf\n\n*.png binary\n*.jpg binary\n*.jpeg binary\n*.gif binary\n");
        return ghpGitAsync("add", ".");
    })
        .then(function () { return ghpGitAsync("commit", "-m", "Initial."); })
        .then(function () { return ghpGitAsync("push", "--set-upstream", "origin", "gh-pages"); });
}
function ghpPushAsync(builtPackaged, minify) {
    if (minify === void 0) { minify = false; }
    var repoName = "";
    return ghpInitAsync()
        .then(function () { return ghpSetupRepoAsync(); })
        .then(function (name) { return internalStaticPkgAsync(builtPackaged, (repoName = name), minify); })
        .then(function () { return nodeutil.cpR(path.join(builtPackaged, repoName), "gh-pages"); })
        .then(function () { return ghpGitAsync("add", "."); })
        .then(function () { return ghpGitAsync("commit", "-m", "Auto-push"); })
        .then(function () { return ghpGitAsync("push"); });
}
exports.ghpPushAsync = ghpPushAsync;
function maxMTimeAsync(dirs) {
    var max = 0;
    return Promise.map(dirs, function (dn) { return readDirAsync(dn)
        .then(function (files) { return Promise.map(files, function (fn) { return statAsync(path.join(dn, fn))
        .then(function (st) {
        max = Math.max(st.mtime.getTime(), max);
    }); }); }); })
        .then(function () { return max; });
}
function buildTargetAsync(parsed) {
    parseBuildInfo(parsed);
    var opts = {};
    if (parsed && parsed.flags["skipCore"])
        opts.skipCore = true;
    var clean = parsed && parsed.flags["clean"];
    return (clean ? cleanAsync() : Promise.resolve())
        .then(function () { return internalBuildTargetAsync(opts); });
}
exports.buildTargetAsync = buildTargetAsync;
function internalBuildTargetAsync(options) {
    if (options === void 0) { options = {}; }
    if (pxt.appTarget.id == "core")
        return buildTargetCoreAsync(options);
    var initPromise;
    var commonPackageDir = path.resolve("node_modules/pxt-common-packages");
    // Make sure to build common sim in case of a local clean. This will do nothing for
    // targets without pxt-common-packages installed.
    if (!inCommonPkg("built/common-sim.js") || !inCommonPkg("built/common-sim.d.ts")) {
        initPromise = buildCommonSimAsync();
    }
    else {
        initPromise = Promise.resolve();
    }
    if (nodeutil.existsDirSync(simDir()))
        initPromise = initPromise.then(function () { return extractLocStringsAsync("sim-strings", [simDir()]); });
    return initPromise
        .then(function () { copyCommonSim(); return simshimAsync(); })
        .then(function () { return options.rebundle ? buildTargetCoreAsync({ quick: true }) : buildTargetCoreAsync(options); })
        .then(function () { return buildSimAsync(); })
        .then(function () { return buildFolderAsync('cmds', true); })
        .then(function () { return buildSemanticUIAsync(); })
        .then(function () { return buildEditorExtensionAsync("editor", "extendEditor"); })
        .then(function () { return buildEditorExtensionAsync("fieldeditors", "extendFieldEditors"); })
        .then(function () { return buildFolderAsync('server', true, 'server'); });
    function inCommonPkg(p) {
        return fs.existsSync(path.join(commonPackageDir, p));
    }
}
exports.internalBuildTargetAsync = internalBuildTargetAsync;
function buildEditorExtensionAsync(dirname, optionName) {
    if (pxt.appTarget.appTheme && pxt.appTarget.appTheme[optionName] &&
        fs.existsSync(path.join(dirname, "tsconfig.json"))) {
        var tsConfig = JSON.parse(fs.readFileSync(path.join(dirname, "tsconfig.json"), "utf8"));
        var p_2;
        if (tsConfig.compilerOptions.module)
            p_2 = buildFolderAndBrowserifyAsync(dirname, true, dirname);
        else
            p_2 = buildFolderAsync(dirname, true, dirname);
        return p_2.then(function () {
            var prepends = nodeutil.allFiles(path.join(dirname, "prepend"), 1, true)
                .filter(function (f) { return /\.js$/.test(f); });
            if (prepends && prepends.length) {
                var editorjs = path.join("built", dirname + ".js");
                prepends.push(editorjs);
                pxt.log("bundling " + prepends.join(', '));
                var bundled = prepends.map(function (f) { return fs.readFileSync(f, "utf8"); }).join("\n");
                fs.writeFileSync(editorjs, bundled, "utf8");
            }
        });
    }
    return Promise.resolve();
}
function buildFolderAsync(p, optional, outputName) {
    if (!fs.existsSync(path.join(p, "tsconfig.json"))) {
        if (!optional)
            U.userError(p + "/tsconfig.json not found");
        return Promise.resolve();
    }
    var tsConfig = JSON.parse(fs.readFileSync(path.join(p, "tsconfig.json"), "utf8"));
    var isNodeModule = false;
    if (outputName && tsConfig.compilerOptions.out !== "../built/" + outputName + ".js") {
        // Special case to support target sim as an NPM package
        if (/^node_modules[\/\\]+pxt-.*?-sim$/.test(p)) {
            // Allow the out dir be inside the folder being built, and manually copy the result to ./built afterwards
            if (tsConfig.compilerOptions.out !== "./built/" + outputName + ".js") {
                U.userError(p + "/tsconfig.json expected compilerOptions.out:\"./built/" + outputName + ".js\", got \"" + tsConfig.compilerOptions.out + "\"");
            }
            isNodeModule = true;
        }
        else {
            U.userError(p + "/tsconfig.json expected compilerOptions.out:\"../built/" + outputName + ".js\", got \"" + tsConfig.compilerOptions.out + "\"");
        }
    }
    if (!fs.existsSync("node_modules/typescript")) {
        U.userError("Oops, typescript does not seem to be installed, did you run 'npm install'?");
    }
    pxt.log("building " + p + "...");
    dirsToWatch.push(p);
    return nodeutil.spawnAsync({
        cmd: "node",
        args: ["../" + (isNodeModule ? "" : "node_modules/") + "typescript/bin/tsc"],
        cwd: p
    }).then(function () {
        if (tsConfig.prepend) {
            var files = tsConfig.prepend;
            files.push(tsConfig.compilerOptions.out);
            var s = "";
            for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
                var f = files_1[_i];
                s += fs.readFileSync(path.resolve(p, f), "utf8") + "\n";
            }
            fs.writeFileSync(path.resolve(p, tsConfig.compilerOptions.out), s);
        }
        if (isNodeModule) {
            var content = fs.readFileSync(path.resolve(p, tsConfig.compilerOptions.out), "utf8");
            fs.writeFileSync(path.resolve("built", path.basename(tsConfig.compilerOptions.out)), content);
        }
    });
}
function copyCommonSim() {
    var p = "node_modules/pxt-common-packages/built";
    if (fs.existsSync(p)) {
        pxt.log("copying common-sim...");
        nodeutil.cp(path.join(p, "common-sim.js"), "built");
        nodeutil.cp(path.join(p, "common-sim.d.ts"), "built");
    }
}
function buildFolderAndBrowserifyAsync(p, optional, outputName) {
    if (!fs.existsSync(path.join(p, "tsconfig.json"))) {
        if (!optional)
            U.userError(p + "/tsconfig.json not found");
        return Promise.resolve();
    }
    var tsConfig = JSON.parse(fs.readFileSync(path.join(p, "tsconfig.json"), "utf8"));
    if (outputName && tsConfig.compilerOptions.outDir !== "../built/" + outputName) {
        U.userError(p + "/tsconfig.json expected compilerOptions.ourDir:\"../built/" + outputName + "\", got \"" + tsConfig.compilerOptions.outDir + "\"");
    }
    if (!fs.existsSync("node_modules/typescript")) {
        U.userError("Oops, typescript does not seem to be installed, did you run 'npm install'?");
    }
    pxt.log("building " + p + "...");
    dirsToWatch.push(p);
    return nodeutil.spawnAsync({
        cmd: "node",
        args: ["../node_modules/typescript/bin/tsc"],
        cwd: p
    }).then(function () {
        var browserify = require('browserify');
        var b = browserify();
        nodeutil.allFiles("built/" + outputName).forEach(function (f) {
            if (f.match(/\.js$/)) {
                b.add(f);
            }
        });
        var outFile = fs.createWriteStream("built/" + outputName + ".js", { encoding: 'utf8' });
        b.bundle().pipe(outFile);
        return new Promise(function (resolve, reject) {
            outFile.on('finish', function () {
                resolve();
            });
            outFile.on('error', function (err) {
                reject(err);
            });
        });
    });
}
function buildPxtAsync(includeSourceMaps) {
    if (includeSourceMaps === void 0) { includeSourceMaps = false; }
    var ksd = "node_modules/pxt-core";
    if (!fs.existsSync(ksd + "/pxtlib/main.ts"))
        return Promise.resolve([]);
    console.log("building " + ksd + "...");
    return nodeutil.spawnAsync({
        cmd: nodeutil.addCmd("npm"),
        args: includeSourceMaps ? ["run", "build", "sourceMaps=true"] : ["run", "build"],
        cwd: ksd
    }).then(function () {
        console.log("local pxt-core built.");
        return [ksd];
    }, function (e) {
        buildFailed("local pxt-core build FAILED", e);
        return [ksd];
    });
}
var dirsToWatch = [];
function travisInfo() {
    return {
        branch: process.env['TRAVIS_BRANCH'],
        tag: process.env['TRAVIS_TAG'],
        commit: process.env['TRAVIS_COMMIT'],
        commitUrl: !process.env['TRAVIS_COMMIT'] ? undefined :
            "https://github.com/" + process.env['TRAVIS_REPO_SLUG'] + "/commits/" + process.env['TRAVIS_COMMIT'],
    };
}
function buildWebManifest(cfg) {
    var webmanifest = {
        "lang": "en",
        "dir": "ltr",
        "name": cfg.name,
        "short_name": cfg.nickname || cfg.name,
        "background_color": "#FAFAFA",
        "icons": [],
        "scope": "/",
        "start_url": "/",
        "display": "standalone",
        "orientation": "landscape"
    };
    if (cfg.appTheme) {
        if (cfg.appTheme.accentColor)
            webmanifest["theme_color"] = cfg.appTheme.accentColor;
        if (cfg.appTheme.backgroundColor)
            webmanifest["background_color"] = cfg.appTheme.backgroundColor;
    }
    [192, 512].forEach(function (sz) {
        var fn = "/static/icons/android-chrome-" + sz + "x" + sz + ".png";
        if (fs.existsSync(path.join('docs', fn))) {
            webmanifest.icons.push({
                "src": uploadArtFile(fn),
                "sizes": sz + "x" + sz,
                "types": "image/png"
            });
        }
    });
    var diskManifest = {};
    if (fs.existsSync("webmanifest.json"))
        diskManifest = nodeutil.readJson("webmanifest.json");
    U.jsonCopyFrom(webmanifest, diskManifest);
    return webmanifest;
}
function processLf(filename, translationStrings) {
    if (!/\.(ts|tsx|html)$/.test(filename))
        return;
    if (/\.d\.ts$/.test(filename))
        return;
    pxt.debug("extracting strings from " + filename);
    fs.readFileSync(filename, { encoding: "utf8" })
        .split('\n').forEach(function (line, idx) {
        function err(msg) {
            console.error(filename + "(" + idx + "): " + msg);
        }
        while (true) {
            var newLine = line.replace(/\blf(_va)?\s*\(\s*(.*)/, function (all, a, args) {
                var m = /^("([^"]|(\\"))+")\s*[\),]/.exec(args);
                if (m) {
                    try {
                        var str = JSON.parse(m[1]);
                        translationStrings[str] = str;
                    }
                    catch (e) {
                        err("cannot JSON-parse " + m[1]);
                    }
                }
                else {
                    if (!/util\.ts$/.test(filename))
                        err("invalid format of lf() argument: " + args);
                }
                return "BLAH " + args;
            });
            if (newLine == line)
                return;
            line = newLine;
        }
    });
}
function saveThemeJson(cfg, localDir, packaged) {
    cfg.appTheme.id = cfg.id;
    cfg.appTheme.title = cfg.title;
    cfg.appTheme.name = cfg.name;
    cfg.appTheme.description = cfg.description;
    var logos = cfg.appTheme;
    if (packaged) {
        Object.keys(logos)
            .filter(function (k) { return /(logo|hero)$/i.test(k) && /^\.\//.test(logos[k]); })
            .forEach(function (k) {
            logos[k] = path.join('./docs', logos[k]).replace(/\\/g, "/");
        });
    }
    else if (!localDir) {
        Object.keys(logos)
            .filter(function (k) { return /(logo|hero)$/i.test(k) && /^\.\//.test(logos[k]); })
            .forEach(function (k) {
            logos[k] = uploadArtFile(logos[k]);
        });
    }
    if (!cfg.appTheme.htmlDocIncludes)
        cfg.appTheme.htmlDocIncludes = {};
    if (fs.existsSync("built/templates.json")) {
        cfg.appTheme.htmlTemplates = readJson("built/templates.json");
    }
    // extract strings from theme for target
    var theme = cfg.appTheme;
    var targetStrings = {};
    if (theme.title)
        targetStrings[theme.title] = theme.title;
    if (theme.name)
        targetStrings[theme.name] = theme.name;
    if (theme.description)
        targetStrings[theme.description] = theme.description;
    // extract strings from docs
    function walkDocs(docs) {
        if (!docs)
            return;
        docs.forEach(function (doc) {
            targetStrings[doc.name] = doc.name;
            walkDocs(doc.subitems);
        });
    }
    walkDocs(theme.docMenu);
    if (nodeutil.fileExistsSync("targetconfig.json")) {
        var targetConfig_1 = nodeutil.readJson("targetconfig.json");
        if (targetConfig_1 && targetConfig_1.galleries) {
            var docsRoot_1 = nodeutil.targetDir;
            var gcards_1 = [];
            var tocmd_1 = "# Projects\n\n";
            Object.keys(targetConfig_1.galleries).forEach(function (k) {
                targetStrings[k] = k;
                var gallerymd = nodeutil.resolveMd(docsRoot_1, targetConfig_1.galleries[k]);
                var gallery = pxt.gallery.parseGalleryMardown(gallerymd);
                var gurl = "/" + targetConfig_1.galleries[k].replace(/^\//, '');
                tocmd_1 +=
                    "* [" + k + "](" + gurl + ")\n";
                var gcard = {
                    name: k,
                    url: gurl
                };
                gcards_1.push(gcard);
                gallery.forEach(function (cards) { return cards.cards
                    .forEach(function (card) {
                    if (card.imageUrl && !gcard.imageUrl)
                        gcard.imageUrl = card.imageUrl;
                    if (card.largeImageUrl && !gcard.largeImageUrl)
                        gcard.largeImageUrl = card.largeImageUrl;
                    var url = card.url || card.learnMoreUrl || card.buyUrl || (card.youTubeId && "https://youtu.be/" + card.youTubeId);
                    tocmd_1 += "  * [" + (card.name || card.title) + "](" + url + ")\n";
                    if (card.tags)
                        card.tags.forEach(function (tag) { return targetStrings[tag] = tag; });
                }); });
            });
            nodeutil.writeFileSync(path.join(docsRoot_1, "docs/projects/SUMMARY.md"), tocmd_1, { encoding: "utf8" });
            nodeutil.writeFileSync(path.join(docsRoot_1, "docs/projects.md"), "# Projects\n\n```codecard\n" + JSON.stringify(gcards_1, null, 4) + "\n```\n\n## See Also\n\n" + gcards_1.map(function (gcard) { return "[" + gcard.name + "](" + gcard.url + ")"; }).join(',\n') + "\n\n", { encoding: "utf8" });
        }
    }
    // extract strings from editor
    ["editor", "fieldeditors", "cmds"]
        .filter(function (d) { return nodeutil.existsDirSync(d); })
        .forEach(function (d) { return nodeutil.allFiles(d)
        .forEach(function (f) { return processLf(f, targetStrings); }); });
    var targetStringsSorted = {};
    Object.keys(targetStrings).sort().map(function (k) { return targetStringsSorted[k] = k; });
    // write files
    nodeutil.mkdirP("built");
    nodeutil.writeFileSync("built/theme.json", JSON.stringify(cfg.appTheme, null, 2));
    nodeutil.writeFileSync("built/target-strings.json", JSON.stringify(targetStringsSorted, null, 2));
}
function buildSemanticUIAsync(parsed) {
    var forceRedbuild = parsed && parsed.flags["force"] || false;
    if (!fs.existsSync(path.join("theme", "style.less")) ||
        !fs.existsSync(path.join("theme", "theme.config")))
        return Promise.resolve();
    var dirty = !fs.existsSync("built/web/semantic.css");
    if (!dirty) {
        var csstime_1 = fs.statSync("built/web/semantic.css").mtime;
        dirty = nodeutil.allFiles("theme")
            .map(function (f) { return fs.statSync(f); })
            .some(function (stat) { return stat.mtime > csstime_1; });
    }
    if (!dirty && !forceRedbuild)
        return Promise.resolve();
    var pkg = readJson("package.json");
    nodeutil.mkdirP(path.join("built", "web"));
    var lessPath = require.resolve('less');
    var lessCPath = path.join(path.dirname(lessPath), '/bin/lessc');
    return nodeutil.spawnAsync({
        cmd: "node",
        args: [lessCPath, "theme/style.less", "built/web/semantic.css", "--include-path=node_modules/semantic-ui-less:node_modules/pxt-core/theme:theme/foo/bar", "--no-ie-compat"]
    }).then(function () {
        var fontFile = fs.readFileSync("node_modules/semantic-ui-less/themes/default/assets/fonts/icons.woff");
        var url = "url(data:application/font-woff;charset=utf-8;base64,"
            + fontFile.toString("base64") + ") format('woff')";
        var semCss = fs.readFileSync('built/web/semantic.css', "utf8");
        semCss = semCss.replace('src: url("fonts/icons.eot");', "")
            .replace(/src:.*url\("fonts\/icons\.woff.*/g, "src: " + url + ";");
        return semCss;
    }).then(function (semCss) {
        // Append icons.css to semantic.css (custom pxt icons)
        var iconsFile = (pkg["name"] == "pxt-core") ? 'built/web/icons.css' : 'node_modules/pxt-core/built/web/icons.css';
        var iconsCss = fs.readFileSync(iconsFile, "utf-8");
        semCss = semCss + "\n" + iconsCss;
        nodeutil.writeFileSync('built/web/semantic.css', semCss);
    }).then(function () {
        // generate blockly css
        if (!fs.existsSync(path.join("theme", "blockly.less")))
            return Promise.resolve();
        return nodeutil.spawnAsync({
            cmd: "node",
            args: [lessCPath, "theme/blockly.less", "built/web/blockly.css", "--include-path=node_modules/semantic-ui-less:node_modules/pxt-core/theme:theme/foo/bar", "--no-ie-compat"]
        });
    }).then(function () {
        // run postcss with autoprefixer and rtlcss
        pxt.debug("running postcss");
        var postcss = require('postcss');
        var browserList = [
            "Chrome >= 38",
            "Firefox >= 31",
            "Edge >= 12",
            "ie >= 11",
            "Safari >= 9",
            "Opera >= 21",
            "iOS >= 9",
            "ChromeAndroid >= 59",
            "FirefoxAndroid >= 55"
        ];
        var cssnano = require('cssnano')({
            zindex: false,
            autoprefixer: { browsers: browserList, add: true }
        });
        var rtlcss = require('rtlcss');
        var files = ['semantic.css', 'blockly.css'];
        files.forEach(function (cssFile) {
            fs.readFile("built/web/" + cssFile, "utf8", function (err, css) {
                postcss([cssnano])
                    .process(css, { from: "built/web/" + cssFile, to: "built/web/" + cssFile }).then(function (result) {
                    fs.writeFile("built/web/" + cssFile, result.css, function (err2) {
                        // process rtl css
                        postcss([rtlcss])
                            .process(result.css, { from: "built/web/" + cssFile, to: "built/web/rtl" + cssFile }).then(function (result2) {
                            nodeutil.writeFileSync("built/web/rtl" + cssFile, result2.css, { encoding: "utf8" });
                        });
                    });
                });
            });
        });
    });
}
function buildWebStringsAsync() {
    if (pxt.appTarget.id != "core")
        return Promise.resolve();
    nodeutil.writeFileSync("built/webstrings.json", JSON.stringify(webstringsJson(), null, 4));
    return Promise.resolve();
}
function thirdPartyNoticesAsync(parsed) {
    var pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
    var tpn = "\n/*!----------------- MakeCode (PXT) ThirdPartyNotices -------------------------------------------------------\n\nMakeCode (PXT) uses third party material from the projects listed below.\nThe original copyright notice and the license under which Microsoft\nreceived such third party material are set forth below. Microsoft\nreserves all other rights not expressly granted, whether by\nimplication, estoppel or otherwise.\n\nIn the event that we accidentally failed to list a required notice, please\nbring it to our attention. Post an issue or email us:\n\n           makecode@microsoft.com\n\n---------------------------------------------\nThird Party Code Components\n---------------------------------------------\n\n    ";
    function lic(dep) {
        var license = path.join("node_modules", dep, "LICENSE");
        if (fs.existsSync(license))
            return fs.readFileSync(license, 'utf8');
        var readme = fs.readFileSync("README.md", "utf8");
        var lic = /## License([^#]+)/.exec(readme);
        if (lic)
            return lic[1];
        return undefined;
    }
    for (var _i = 0, _a = Object.keys(pkg.dependencies).concat(Object.keys(pkg.devDependencies)); _i < _a.length; _i++) {
        var dep = _a[_i];
        pxt.log("scanning " + dep);
        var license = lic(dep);
        if (!license)
            pxt.log("no license for " + dep + " at " + license);
        else
            tpn += "\n----------------- " + dep + " -------------------\n\n" + license + "\n\n---------------------------------------------\n";
    }
    tpn += "\n------------- End of ThirdPartyNotices --------------------------------------------------- */";
    nodeutil.writeFileSync("THIRD-PARTY-NOTICES.txt", tpn, { encoding: 'utf8' });
    return Promise.resolve();
}
function updateDefaultProjects(cfg) {
    var defaultProjects = [
        pxt.BLOCKS_PROJECT_NAME,
        pxt.JAVASCRIPT_PROJECT_NAME
    ];
    nodeutil.allFiles("libs", 1, /*allowMissing*/ false, /*includeDirs*/ true)
        .filter(function (f) {
        return defaultProjects.indexOf(path.basename(f)) !== -1;
    })
        .forEach(function (projectPath) {
        var projectId = path.basename(projectPath);
        var newProject = {
            id: projectId,
            config: {
                name: "",
                dependencies: {},
                files: []
            },
            files: {}
        };
        nodeutil.allFiles(projectPath).forEach(function (f) {
            var relativePath = path.relative(projectPath, f); // nodeutil.allFiles returns libs/blocksprj/path_to_file, this removes libs/blocksprj/
            var fileName = path.basename(relativePath);
            if (/^((built)|(pxt_modules)|(node_modules))[\/\\]/.test(relativePath) || fileName === "tsconfig.json") {
                return;
            }
            if (fileName === pxt.CONFIG_NAME) {
                newProject.config = nodeutil.readPkgConfig(projectPath);
                U.iterMap(newProject.config.dependencies, function (k, v) {
                    if (/^file:/.test(v)) {
                        newProject.config.dependencies[k] = "*";
                    }
                });
                if (newProject.config.icon)
                    newProject.config.icon = uploadArtFile(newProject.config.icon);
            }
            else {
                newProject.files[relativePath] = fs.readFileSync(f, "utf8").replace(/\r\n/g, "\n");
            }
        });
        cfg[projectId] = newProject;
    });
    if (!cfg.tsprj && cfg.blocksprj) {
        var notBlock = function (s) { return !U.endsWith(s, ".blocks"); };
        cfg.tsprj = U.clone(cfg.blocksprj);
        cfg.tsprj.id = "tsprj";
        cfg.tsprj.config.files = cfg.tsprj.config.files.filter(notBlock);
        for (var _i = 0, _a = Object.keys(cfg.tsprj.files); _i < _a.length; _i++) {
            var k = _a[_i];
            if (!notBlock(k))
                delete cfg.tsprj.files[k];
        }
    }
}
function updateTOC(cfg) {
    if (!cfg.appTheme)
        return; // no theme to update
    // Update Table of Contents from SUMMARY.md file
    var summaryMD = nodeutil.resolveMd(nodeutil.targetDir, "SUMMARY");
    if (!summaryMD) {
        pxt.log('no SUMMARY file found');
    }
    else {
        cfg.appTheme.TOC = pxt.docs.buildTOC(summaryMD);
    }
}
function rebundleAsync() {
    return buildTargetCoreAsync({ quick: true })
        .then(function () { return buildSimAsync(); });
}
function buildSimAsync() {
    return buildFolderAsync(simDir(), true, pxt.appTarget.id === "common" ? "common-sim" : "sim");
}
function buildTargetCoreAsync(options) {
    if (options === void 0) { options = {}; }
    var cfg = readLocalPxTarget();
    updateDefaultProjects(cfg);
    updateTOC(cfg);
    cfg.bundledpkgs = {};
    pxt.setAppTarget(cfg);
    var statFiles = {};
    dirsToWatch = cfg.bundleddirs.slice();
    if (pxt.appTarget.id != "core") {
        if (fs.existsSync("theme")) {
            dirsToWatch.push("theme"); // simulator
            dirsToWatch.push(path.join("theme", "site", "globals")); // simulator
        }
        if (fs.existsSync("editor"))
            dirsToWatch.push("editor");
        if (fs.existsSync("fieldeditors"))
            dirsToWatch.push("fieldeditors");
        if (fs.existsSync(simDir())) {
            dirsToWatch.push(simDir()); // simulator
            dirsToWatch = dirsToWatch.concat(fs.readdirSync(simDir())
                .map(function (p) { return path.join(simDir(), p); })
                .filter(function (p) { return path.basename(p) !== "built" && fs.statSync(p).isDirectory(); }));
        }
    }
    var hexCachePath = path.resolve(process.cwd(), "built", "hexcache");
    nodeutil.mkdirP(hexCachePath);
    pxt.log("building target.json in " + process.cwd() + "...");
    return buildWebStringsAsync()
        .then(function () { return options.quick ? null : internalGenDocsAsync(false, true); })
        .then(function () { return forEachBundledPkgAsync(function (pkg, dirname) {
        pxt.log("building " + dirname);
        var isPrj = /prj$/.test(dirname);
        var isHw = /hw---/.test(dirname);
        var config = nodeutil.readPkgConfig(".");
        var isCore = !!config.core;
        for (var _i = 0, _a = config.additionalFilePaths; _i < _a.length; _i++) {
            var p_3 = _a[_i];
            dirsToWatch.push(path.resolve(p_3));
        }
        return pkg.filesToBePublishedAsync(true)
            .then(function (res) {
            if (!isPrj) {
                cfg.bundledpkgs[path.basename(dirname)] = res;
            }
            if (isHw)
                isPrj = true;
            if (isCore && pxt.appTarget.simulator &&
                pxt.appTarget.simulator.dynamicBoardDefinition)
                isPrj = true;
        })
            .then(function () { return options.quick ? null : testForBuildTargetAsync(isPrj || (!options.skipCore && isCore)); })
            .then(function (compileOpts) {
            // For the projects, we need to save the base HEX file to the offline HEX cache
            if (isPrj && pxt.appTarget.compile && pxt.appTarget.compile.hasHex) {
                if (!compileOpts) {
                    console.error("Failed to extract native image for project " + dirname);
                    return;
                }
                // Place the base HEX image in the hex cache if necessary
                var sha = compileOpts.extinfo.sha;
                var hex = compileOpts.hexinfo.hex;
                var hexFile = path.join(hexCachePath, sha + ".hex");
                if (fs.existsSync(hexFile)) {
                    pxt.debug("native image already in offline cache for project " + dirname + ": " + hexFile);
                }
                else {
                    nodeutil.writeFileSync(hexFile, hex.join(os.EOL));
                    pxt.debug("created native image in offline cache for project " + dirname + ": " + hexFile);
                }
            }
        });
    }, /*includeProjects*/ true); })
        .then(function () {
        // patch icons in bundled packages
        Object.keys(cfg.bundledpkgs).forEach(function (pkgid) {
            var res = cfg.bundledpkgs[pkgid];
            // path config before storing
            var config = JSON.parse(res[pxt.CONFIG_NAME]);
            if (!config.icon)
                // try known location
                ['png', 'jpg'].map(function (ext) { return "/static/libs/" + config.name + "." + ext; })
                    .filter(function (ip) { return fs.existsSync("docs" + ip); })
                    .forEach(function (ip) { return config.icon = ip; });
            res[pxt.CONFIG_NAME] = JSON.stringify(config, null, 4);
        });
        var info = travisInfo();
        cfg.versions = {
            branch: info.branch,
            tag: info.tag,
            commits: info.commitUrl,
            target: readJson("package.json")["version"],
            pxt: pxtVersion(),
            pxtCrowdinBranch: pxtCrowdinBranch(),
            targetCrowdinBranch: targetCrowdinBranch()
        };
        saveThemeJson(cfg, options.localDir, options.packaged);
        var webmanifest = buildWebManifest(cfg);
        var targetjson = JSON.stringify(cfg, null, 2);
        nodeutil.writeFileSync("built/target.json", targetjson);
        nodeutil.writeFileSync("built/target.js", targetJsPrefix + targetjson);
        pxt.setAppTarget(cfg); // make sure we're using the latest version
        var targetlight = U.flatClone(cfg);
        delete targetlight.bundleddirs;
        delete targetlight.bundledpkgs;
        delete targetlight.appTheme;
        var targetlightjson = JSON.stringify(targetlight, null, 2);
        nodeutil.writeFileSync("built/targetlight.json", targetlightjson);
        nodeutil.writeFileSync("built/sim.webmanifest", JSON.stringify(webmanifest, null, 2));
    })
        .then(function () {
        console.log("target.json built.");
    });
}
function pxtVersion() {
    return pxt.appTarget.id == "core" ?
        readJson("package.json")["version"] :
        readJson("node_modules/pxt-core/package.json")["version"];
}
function pxtCrowdinBranch() {
    var theme = pxt.appTarget.id == "core" ?
        readJson("pxtarget.json").appTheme :
        readJson("node_modules/pxt-core/pxtarget.json").appTheme;
    return theme ? theme.crowdinBranch : undefined;
}
function targetCrowdinBranch() {
    var theme = readJson("pxtarget.json").appTheme;
    return theme ? theme.crowdinBranch : undefined;
}
function buildAndWatchAsync(f) {
    var currMtime = Date.now();
    return f()
        .then(function (dirs) {
        if (exports.globalConfig.noAutoBuild)
            return;
        pxt.debug('watching ' + dirs.join(', ') + '...');
        var loop = function () {
            Promise.delay(1000)
                .then(function () { return maxMTimeAsync(dirs); })
                .then(function (num) {
                if (num > currMtime) {
                    currMtime = num;
                    f()
                        .then(function (d) {
                        dirs = d;
                        U.nextTick(loop);
                    });
                }
                else {
                    U.nextTick(loop);
                }
            });
        };
        U.nextTick(loop);
    });
}
function buildFailed(msg, e) {
    console.log("");
    console.log("***");
    console.log("*** Build failed: " + msg);
    console.log(e.stack);
    console.log("***");
    console.log("");
}
function buildAndWatchTargetAsync(includeSourceMaps, rebundle) {
    if (fs.existsSync("pxt.json") &&
        !(fs.existsSync(path.join(simDir(), "tsconfig.json")) || nodeutil.existsDirSync(path.join(simDir(), "public")))) {
        console.log("No sim/tsconfig.json nor sim/public/; assuming npm installed package");
        return Promise.resolve();
    }
    var hasCommonPackages = fs.existsSync(path.resolve("node_modules/pxt-common-packages"));
    var simDirectories = [];
    if (hasCommonPackages) {
        var libsdir_1 = path.resolve("node_modules/pxt-common-packages/libs");
        simDirectories = fs.readdirSync(libsdir_1).map(function (fn) { return path.join(libsdir_1, fn, "sim"); });
        simDirectories = simDirectories.filter(function (fn) { return fs.existsSync(fn); });
    }
    return buildAndWatchAsync(function () { return buildPxtAsync(includeSourceMaps)
        .then(buildCommonSimAsync, function (e) { return buildFailed("common sim build failed: " + e.message, e); })
        .then(function () { return internalBuildTargetAsync({ localDir: true, rebundle: rebundle }); })
        .catch(function (e) { return buildFailed("target build failed: " + e.message, e); })
        .then(function () {
        var toWatch = [path.resolve("node_modules/pxt-core")].concat(dirsToWatch);
        if (hasCommonPackages) {
            toWatch = toWatch.concat(simDirectories);
        }
        return toWatch.filter(function (d) { return fs.existsSync(d); });
    }); });
}
function buildCommonSimAsync() {
    var simPath = path.resolve("node_modules/pxt-common-packages/sim");
    if (fs.existsSync(simPath)) {
        return buildFolderAsync(simPath);
    }
    else {
        return Promise.resolve();
    }
}
function renderDocs(builtPackaged, localDir) {
    var dst = path.resolve(path.join(builtPackaged, localDir));
    nodeutil.cpR("node_modules/pxt-core/docfiles", path.join(dst, "/docfiles"));
    if (fs.existsSync("docfiles"))
        nodeutil.cpR("docfiles", dst + "/docfiles");
    var webpath = localDir;
    var docsTemplate = server.expandDocFileTemplate("docs.html");
    docsTemplate = U.replaceAll(docsTemplate, "/cdn/", webpath);
    docsTemplate = U.replaceAll(docsTemplate, "/doccdn/", webpath);
    docsTemplate = U.replaceAll(docsTemplate, "/docfiles/", webpath + "docfiles/");
    docsTemplate = U.replaceAll(docsTemplate, "/--embed", webpath + "embed.js");
    var dirs = {};
    for (var _i = 0, _a = ["node_modules/pxt-core/common-docs", "docs"]; _i < _a.length; _i++) {
        var docFolder = _a[_i];
        for (var _b = 0, _c = nodeutil.allFiles(docFolder, 8); _b < _c.length; _b++) {
            var f = _c[_b];
            var origF = f;
            pxt.log("rendering " + f);
            f = "docs" + f.slice(docFolder.length);
            var dd = path.join(dst, f);
            var dir = path.dirname(dd);
            if (!U.lookup(dirs, dir)) {
                nodeutil.mkdirP(dir);
                dirs[dir] = true;
            }
            var buf = fs.readFileSync(origF);
            if (/\.(md|html)$/.test(f)) {
                var str = buf.toString("utf8");
                if (/\.md$/.test(f)) {
                    str = nodeutil.resolveMd(".", f.substr(5, f.length - 8));
                    // patch any /static/... url to /docs/static/...
                    str = str.replace(/\"\/static\//g, "\"/docs/static/");
                    nodeutil.writeFileSync(dd, str, { encoding: "utf8" });
                }
                var html = "";
                if (U.endsWith(f, ".md")) {
                    html = pxt.docs.renderMarkdown({
                        template: docsTemplate,
                        markdown: str,
                        theme: pxt.appTarget.appTheme,
                        filepath: f,
                    });
                }
                else
                    html = server.expandHtml(str);
                html = html.replace(/(<a[^<>]*)\shref="(\/[^<>"]*)"/g, function (f, beg, url) {
                    return beg + (" href=\"" + webpath + "docs" + url + ".html\"");
                });
                buf = Buffer.from(html, "utf8");
                dd = dd.slice(0, dd.length - 3) + ".html";
            }
            nodeutil.writeFileSync(dd, buf);
        }
        console.log("Docs written.");
    }
}
function serveAsync(parsed) {
    // always use a cloud build
    // in most cases, the user machine is not properly setup to
    // build a native binary and our CLI just looks broken
    // use --localbuild to force localbuild
    parseBuildInfo(parsed);
    var justServe = false;
    var packaged = false;
    var includeSourceMaps = false;
    if (parsed.flags["just"]) {
        justServe = true;
    }
    else if (parsed.flags["pkg"]) {
        justServe = true;
        packaged = true;
    }
    var rebundle = !!parsed.flags["rebundle"];
    if (parsed.flags["noBrowser"]) {
        exports.globalConfig.noAutoStart = true;
    }
    if (parsed.flags["sourceMaps"]) {
        includeSourceMaps = true;
    }
    if (!exports.globalConfig.localToken) {
        exports.globalConfig.localToken = ts.pxtc.Util.guidGen();
        saveConfig();
    }
    var localToken = exports.globalConfig.localToken;
    if (!fs.existsSync("pxtarget.json")) {
        //Specifically when the target is being used as a library
        var targetDepLoc = nodeutil.targetDir;
        if (fs.existsSync(path.join(targetDepLoc, "pxtarget.json"))) {
            console.log("Going to " + targetDepLoc);
            process.chdir(targetDepLoc);
        }
        else {
            var upper = path.join(__dirname, "../../..");
            if (fs.existsSync(path.join(upper, "pxtarget.json"))) {
                console.log("going to " + upper);
                process.chdir(upper);
            }
            else {
                U.userError("Cannot find pxtarget.json to serve.");
            }
        }
    }
    return (justServe ? Promise.resolve() : buildAndWatchTargetAsync(includeSourceMaps, rebundle))
        .then(function () { return server.serveAsync({
        autoStart: !exports.globalConfig.noAutoStart,
        localToken: localToken,
        packaged: packaged,
        port: parsed.flags["port"] || 0,
        wsPort: parsed.flags["wsport"] || 0,
        hostname: parsed.flags["hostname"] || "",
        browser: parsed.flags["browser"],
        serial: !parsed.flags["noSerial"] && !exports.globalConfig.noSerial
    }); });
}
exports.serveAsync = serveAsync;
var readFileAsync = Promise.promisify(fs.readFile);
var writeFileAsync = Promise.promisify(fs.writeFile);
var readDirAsync = Promise.promisify(fs.readdir);
var statAsync = Promise.promisify(fs.stat);
var rimrafAsync = Promise.promisify(rimraf);
var commonfiles = {};
var SnippetHost = /** @class */ (function () {
    function SnippetHost(name, packageFiles, extraDependencies, includeCommon) {
        if (includeCommon === void 0) { includeCommon = false; }
        this.name = name;
        this.packageFiles = packageFiles;
        this.extraDependencies = extraDependencies;
        this.includeCommon = includeCommon;
        //Global cache of module files
        this.files = {};
        this.cache = {};
    }
    SnippetHost.prototype.resolve = function (module, filename) {
        pxt.log("resolve " + module.id + ". " + filename);
        return "";
    };
    SnippetHost.prototype.readFile = function (module, filename) {
        if (filename == pxt.github.GIT_JSON)
            return null;
        if (this.files[module.id] && this.files[module.id][filename]) {
            return this.files[module.id][filename];
        }
        if (module.id == "this") {
            if (filename == "pxt.json") {
                var commonFiles = this.includeCommon ? [
                    "pxt-core.d.ts",
                    "pxt-helpers.ts",
                ] : [];
                var packageFileNames = Object.keys(this.packageFiles);
                return JSON.stringify({
                    "name": this.name.replace(/[^a-zA-z0-9]/g, ''),
                    "dependencies": this.dependencies(),
                    "description": "",
                    "public": true,
                    "yotta": {
                        "ignoreConflicts": true
                    },
                    "files": packageFileNames.concat(commonFiles)
                });
            }
            else if (filename in this.packageFiles) {
                return this.packageFiles[filename];
            }
        }
        else if (pxt.appTarget.bundledpkgs[module.id] && filename === pxt.CONFIG_NAME) {
            return pxt.appTarget.bundledpkgs[module.id][pxt.CONFIG_NAME];
        }
        else {
            var readFile = function (filename) {
                var ps = [
                    path.join(module.id, filename),
                    path.join('libs', module.id, filename),
                    path.join('libs', module.id, 'built', filename),
                ];
                for (var _i = 0, ps_1 = ps; _i < ps_1.length; _i++) {
                    var p_4 = ps_1[_i];
                    try {
                        return fs.readFileSync(p_4, 'utf8');
                    }
                    catch (e) {
                    }
                }
                return null;
            };
            var contents = readFile(filename);
            if (contents == null) {
                // try additional package location
                if (pxt.appTarget.bundledpkgs[module.id]) {
                    var f = readFile(pxt.CONFIG_NAME);
                    var modpkg = JSON.parse(f || "{}");
                    // TODO this seems to be dead code, additionalFilePath is removed from bundledpkgs
                    // why not just use bundledpkgs also for files?
                    if (modpkg.additionalFilePath) {
                        try {
                            var ad = path.join(modpkg.additionalFilePath.replace('../../', ''), filename);
                            pxt.debug(ad);
                            contents = fs.readFileSync(ad, 'utf8');
                        }
                        catch (e) {
                        }
                    }
                }
            }
            if (contents) {
                this.writeFile(module, filename, contents);
                return contents;
            }
        }
        if (module.id === "this") {
            if (filename === "pxt-core.d.ts") {
                var contents = fs.readFileSync(path.join(this.getRepoDir(), "libs", "pxt-common", "pxt-core.d.ts"), 'utf8');
                this.writeFile(module, filename, contents);
                return contents;
            }
            else if (filename === "pxt-helpers.ts") {
                var contents = fs.readFileSync(path.resolve(this.getRepoDir(), "libs", "pxt-common", "pxt-helpers.ts"), 'utf8');
                this.writeFile(module, filename, contents);
                return contents;
            }
            else if (filename === "pxt-python.d.ts" || filename === "pxt-python-helpers.ts") {
                var contents = fs.readFileSync(path.resolve(this.getRepoDir(), "libs", "pxt-python", filename), 'utf8');
                this.writeFile(module, filename, contents);
                return contents;
            }
        }
        // might be ok
        return null;
    };
    SnippetHost.prototype.getRepoDir = function () {
        var cwd = process.cwd();
        var i = cwd.lastIndexOf(path.sep + "pxt" + path.sep);
        return cwd.substr(0, i + 5);
    };
    SnippetHost.prototype.writeFile = function (module, filename, contents) {
        if (!this.files[module.id]) {
            this.files[module.id] = {};
        }
        this.files[module.id][filename] = contents;
    };
    SnippetHost.prototype.getHexInfoAsync = function (extInfo) {
        return pxt.hex.getHexInfoAsync(this, extInfo);
    };
    SnippetHost.prototype.cacheStoreAsync = function (id, val) {
        this.cache[id] = val;
        return Promise.resolve();
    };
    SnippetHost.prototype.cacheGetAsync = function (id) {
        return Promise.resolve(this.cache[id] || "");
    };
    SnippetHost.prototype.downloadPackageAsync = function (pkg) {
        var _this = this;
        return pkg.commonDownloadAsync()
            .then(function (resp) {
            if (resp) {
                U.iterMap(resp, function (fn, cont) {
                    _this.writeFile(pkg, fn, cont);
                });
            }
        });
    };
    SnippetHost.prototype.resolveVersionAsync = function (pkg) {
        if (!/^file:/.test(pkg._verspec))
            pxt.log("resolveVersionAsync(" + pkg.id + ")");
        return Promise.resolve("*");
    };
    SnippetHost.prototype.dependencies = function () {
        var stdDeps = {};
        for (var extraDep in this.extraDependencies) {
            var ver = this.extraDependencies[extraDep];
            stdDeps[extraDep] = ver == "*" ? "file:../" + extraDep : ver;
        }
        return stdDeps;
    };
    return SnippetHost;
}());
var Host = /** @class */ (function () {
    function Host() {
        this.fileOverrides = {};
    }
    Host.prototype.resolve = function (module, filename) {
        //pxt.debug(`resolving ${module.level}:${module.id} -- ${filename} in ${path.resolve(".")}`)
        if (module.level == 0) {
            return "./" + filename;
        }
        else if (module.verProtocol() == "file") {
            var fn = module.verArgument() + "/" + filename;
            if (module.level > 1 && module.addedBy[0])
                fn = this.resolve(module.addedBy[0], fn);
            return fn;
        }
        else {
            return "pxt_modules/" + module.id + "/" + filename;
        }
    };
    Host.prototype.readFile = function (module, filename, skipAdditionalFiles) {
        var commonFile = U.lookup(commonfiles, filename);
        if (commonFile != null)
            return commonFile;
        var overFile = U.lookup(this.fileOverrides, filename);
        if (module.level == 0 && overFile != null) {
            pxt.debug("found override for " + filename);
            return overFile;
        }
        var resolved = this.resolve(module, filename);
        var dir = path.dirname(resolved);
        if (filename == pxt.CONFIG_NAME)
            try {
                return JSON.stringify(nodeutil.readPkgConfig(dir), null, 4);
            }
            catch (e) {
                return null;
            }
        try {
            pxt.debug("reading " + resolved);
            return fs.readFileSync(resolved, "utf8");
        }
        catch (e) {
            if (!skipAdditionalFiles && module.config) {
                for (var _i = 0, _a = module.config.additionalFilePaths || []; _i < _a.length; _i++) {
                    var addPath = _a[_i];
                    try {
                        pxt.debug("try read: " + path.join(dir, addPath, filename));
                        return fs.readFileSync(path.join(dir, addPath, filename), "utf8");
                    }
                    catch (e) {
                    }
                }
            }
            return null;
        }
    };
    Host.prototype.writeFile = function (module, filename, contents) {
        var p = this.resolve(module, filename);
        var check = function (p) {
            var dir = p.replace(/\/[^\/]+$/, "");
            if (dir != p) {
                check(dir);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }
            }
        };
        check(p);
        if (U.endsWith(filename, ".uf2") || U.endsWith(filename, ".pxt64"))
            nodeutil.writeFileSync(p, contents, { encoding: "base64" });
        else if (U.endsWith(filename, ".elf"))
            nodeutil.writeFileSync(p, contents, {
                encoding: "base64",
                mode: 511
            });
        else
            nodeutil.writeFileSync(p, contents, { encoding: "utf8" });
    };
    Host.prototype.getHexInfoAsync = function (extInfo) {
        if (process.env["PXT_LOCAL_DOCKER_TEST"] === "yes") {
            var compileReq_1 = JSON.parse(Buffer.from(extInfo.compileData, "base64").toString("utf8"));
            var mappedFiles = Object.keys(compileReq_1.replaceFiles).map(function (k) {
                return {
                    name: k.replace(/^\/+/, ""),
                    text: compileReq_1.replaceFiles[k]
                };
            });
            var cs = pxt.appTarget.compileService;
            var dockerReq = {
                op: "buildex",
                files: mappedFiles,
                gittag: compileReq_1.tag,
                empty: true,
                hexfile: "build/" + cs.codalBinary + ".hex",
                platformio: false,
                clone: "https://github.com/" + cs.githubCorePackage,
                buildcmd: "python build.py",
                image: "pext/yotta:latest"
            };
            var fn = "built/dockerreq.json";
            nodeutil.writeFileSync(fn, JSON.stringify(dockerReq, null, 4));
        }
        if (pxt.options.debug) {
            var compileReq = JSON.parse(Buffer.from(extInfo.compileData, "base64").toString("utf8"));
            var replLong_1 = function (m) {
                for (var _i = 0, _a = Object.keys(m); _i < _a.length; _i++) {
                    var k = _a[_i];
                    var v = m[k];
                    if (typeof v == "string" && v.length > 200) {
                        m[k] = v.slice(0, 100) + " ... " + U.sha256(v).slice(0, 10);
                    }
                    else if (v && typeof v == "object") {
                        replLong_1(v);
                    }
                }
            };
            replLong_1(compileReq);
            nodeutil.writeFileSync("built/cpp.json", JSON.stringify(compileReq, null, 4));
        }
        if (!forceBuild) {
            var cachedPath = path.resolve(nodeutil.targetDir, "built", "hexcache", extInfo.sha + ".hex");
            pxt.debug("trying " + cachedPath);
            try {
                var lines = fs.readFileSync(cachedPath, "utf8").split(/\r?\n/);
                pxt.debug("Using hexcache: " + extInfo.sha);
                return Promise.resolve({ hex: lines });
            }
            catch (e) { }
        }
        if (!forceLocalBuild && (extInfo.onlyPublic || forceCloudBuild))
            return pxt.hex.getHexInfoAsync(this, extInfo);
        return build.buildHexAsync(build.thisBuild, mainPkg, extInfo, forceBuild)
            .then(function () { return build.thisBuild.patchHexInfo(extInfo); });
    };
    Host.prototype.cacheStoreAsync = function (id, val) {
        mkHomeDirs();
        return writeFileAsync(path.join(cacheDir(), id), val, "utf8");
    };
    Host.prototype.cacheGetAsync = function (id) {
        return readFileAsync(path.join(cacheDir(), id), "utf8")
            .then(function (v) { return v; }, function (e) { return null; });
    };
    Host.prototype.downloadPackageAsync = function (pkg) {
        return pkg.commonDownloadAsync()
            .then(function (resp) {
            if (resp) {
                U.iterMap(resp, function (fn, cont) {
                    pkg.host().writeFile(pkg, fn, cont);
                });
                return Promise.resolve();
            }
            var proto = pkg.verProtocol();
            if (proto == "file") {
                pxt.debug("skipping download of local pkg: " + pkg.version());
                return Promise.resolve();
            }
            else if (proto == "invalid") {
                pxt.log("skipping invalid pkg " + pkg.id);
                return Promise.resolve();
            }
            else {
                return Promise.reject("Cannot download " + pkg.version() + "; unknown protocol");
            }
        });
    };
    return Host;
}());
var mainPkg = new pxt.MainPackage(new Host());
function installPackageNameAsync(packageName) {
    if (!packageName)
        return Promise.resolve();
    // builtin?
    if (pxt.appTarget.bundledpkgs[packageName])
        return addDepAsync(packageName, "*", false);
    // github?
    var parsed = pxt.github.parseRepoId(packageName);
    if (parsed && parsed.fullName)
        return loadGithubTokenAsync()
            .then(function () { return pxt.packagesConfigAsync(); })
            .then(function (config) { return (parsed.tag ? Promise.resolve(parsed.tag) : pxt.github.latestVersionAsync(parsed.fullName, config))
            .then(function (tag) { parsed.tag = tag; })
            .then(function () { return pxt.github.pkgConfigAsync(parsed.fullName, parsed.tag); })
            .then(function (cfg) { return mainPkg.loadAsync(true)
            .then(function () {
            var ver = pxt.github.stringifyRepo(parsed);
            return addDepAsync(cfg.name, ver, false);
        }); }); });
    // shared url?
    var sharedId = pxt.Cloud.parseScriptId(packageName);
    if (sharedId)
        return addDepAsync(sharedId, packageName, false);
    // don't know
    U.userError(lf("unknown package " + packageName));
    return Promise.resolve();
}
function installAsync(parsed) {
    pxt.log("installing dependencies...");
    ensurePkgDir();
    var packageName = parsed && parsed.args.length ? parsed.args[0] : undefined;
    var hwvariant = parsed && parsed.flags["hwvariant"];
    if (hwvariant && !/^hw---/.test(hwvariant))
        hwvariant = 'hw---' + hwvariant;
    return installPackageNameAsync(packageName)
        .then(function () { return addDepsAsync(); })
        .then(function () { return mainPkg.installAllAsync(); })
        .then(function () {
        var tscfg = "tsconfig.json";
        if (!fs.existsSync(tscfg) && !fs.existsSync("../" + tscfg)) {
            nodeutil.writeFileSync(tscfg, pxt.TS_CONFIG);
        }
    });
    function addDepsAsync() {
        return hwvariant ? addDepAsync(hwvariant, "*", true) : Promise.resolve();
    }
}
exports.installAsync = installAsync;
function addDepAsync(name, ver, hw) {
    console.log(U.lf("adding {0}: {1}", name, ver));
    return mainPkg.loadAsync(true)
        .then(function () {
        if (hw) {
            // remove other hw variants
            Object.keys(mainPkg.config.dependencies)
                .filter(function (k) { return /^hw---/.test(k); })
                .forEach(function (k) { return delete mainPkg.config.dependencies[k]; });
        }
        mainPkg.config.dependencies[name] = ver;
        mainPkg.saveConfig();
        mainPkg = new pxt.MainPackage(new Host());
    });
}
function addFile(name, cont) {
    var ff = mainPkg.getFiles();
    if (ff.indexOf(name) < 0) {
        mainPkg.config.files.push(name);
        mainPkg.saveConfig();
        console.log(U.lf("Added {0} to files in {1}.", name, pxt.CONFIG_NAME));
    }
    if (!fs.existsSync(name)) {
        var vars_1 = {};
        var cfg = mainPkg.config;
        for (var _i = 0, _a = Object.keys(cfg); _i < _a.length; _i++) {
            var k = _a[_i];
            if (typeof cfg[k] == "string")
                vars_1[k] = cfg;
        }
        vars_1["ns"] = mainPkg.config.name.replace(/[^a-zA-Z0-9]/g, "_");
        cont = cont.replace(/@([a-z]+)@/g, function (f, k) { return U.lookup(vars_1, k) || ""; });
        nodeutil.writeFileSync(name, cont);
    }
    else {
        console.log(U.lf("Not overwriting {0}.", name));
    }
}
function addAsmAsync() {
    addFile("helpers.asm", "; example helper function\n@ns@_helper:\n    push {lr}\n    adds r0, r0, r1\n    pop {pc}\n");
    addFile("helpers.ts", "namespace @ns@ {\n    /**\n     * Help goes here.\n     */\n    //% shim=@ns@_helper\n    export function helper(x: number, y: number) {\n        // Dummy implementation for the simulator.\n        return x - y\n    }\n}\n");
    return Promise.resolve();
}
function addCppAsync() {
    addFile("extension.cpp", "#include \"pxt.h\"\nusing namespace pxt;\nnamespace @ns@ {\n    //%\n    int extfun(int x, int y) {\n        return x + y;\n    }\n}\n");
    addFile("extension.ts", "namespace @ns@ {\n    /**\n     * Help goes here.\n     */\n    //% shim=@ns@::extfun\n    export function extfun(x: number, y: number) {\n        // Dummy implementation for the simulator.\n        return x - y\n    }\n}\n");
    addFile("shims.d.ts", "// Will be auto-generated if needed.\n");
    addFile("enums.d.ts", "// Will be auto-generated if needed.\n");
    return Promise.resolve();
}
function addAsync(parsed) {
    if (pxt.appTarget.compile.hasHex) {
        p.defineCommand({ name: "asm", help: "add assembly support" }, addAsmAsync);
        p.defineCommand({ name: "cpp", help: "add C++ extension support" }, addCppAsync);
    }
    return handleCommandAsync(parsed.args, loadPkgAsync);
}
exports.addAsync = addAsync;
function initAsync(parsed) {
    if (fs.existsSync(pxt.CONFIG_NAME))
        U.userError(pxt.CONFIG_NAME + " already present");
    var files = pxt.packageFiles(path.basename(path.resolve(".")).replace(/^pxt-/, ""));
    var configMap = JSON.parse(files[pxt.CONFIG_NAME]);
    var initPromise = Promise.resolve();
    if (!parsed.flags["useDefaults"]) {
        initPromise = Promise.mapSeries(["name", "description", "license"], function (f) {
            return queryAsync(f, configMap[f])
                .then(function (r) {
                configMap[f] = r;
            });
        }).then(function () { });
    }
    return initPromise
        .then(function () {
        files[pxt.CONFIG_NAME] = JSON.stringify(configMap, null, 4) + "\n";
        pxt.packageFilesFixup(files);
        U.iterMap(files, function (k, v) {
            nodeutil.mkdirP(path.dirname(k));
            nodeutil.writeFileSync(k, v);
        });
    })
        .then(function () { return installAsync(); })
        .then(function () {
        pxt.log("Package initialized.");
        pxt.log("Try 'pxt add' to add optional features.");
    });
}
exports.initAsync = initAsync;
var BuildOption;
(function (BuildOption) {
    BuildOption[BuildOption["JustBuild"] = 0] = "JustBuild";
    BuildOption[BuildOption["Run"] = 1] = "Run";
    BuildOption[BuildOption["Deploy"] = 2] = "Deploy";
    BuildOption[BuildOption["Test"] = 3] = "Test";
    BuildOption[BuildOption["DebugSim"] = 4] = "DebugSim";
    BuildOption[BuildOption["GenDocs"] = 5] = "GenDocs";
})(BuildOption || (BuildOption = {}));
function serviceAsync(parsed) {
    var fn = "built/response.json";
    return mainPkg.getCompileOptionsAsync()
        .then(function (opts) {
        pxtc.service.performOperation("reset", {});
        pxtc.service.performOperation("setOpts", { options: opts });
        return pxtc.service.performOperation(parsed.args[0], {});
    })
        .then(function (res) {
        if (res.errorMessage) {
            console.error("Error calling service:", res.errorMessage);
            process.exit(1);
        }
        else {
            mainPkg.host().writeFile(mainPkg, fn, JSON.stringify(res, null, 1));
            console.log("wrote results to " + fn);
        }
    });
}
exports.serviceAsync = serviceAsync;
function augmnetDocsAsync(parsed) {
    var f0 = fs.readFileSync(parsed.args[0], "utf8");
    var f1 = fs.readFileSync(parsed.args[1], "utf8");
    console.log(pxt.docs.augmentDocs(f0, f1));
    return Promise.resolve();
}
exports.augmnetDocsAsync = augmnetDocsAsync;
function timeAsync() {
    ensurePkgDir();
    var min = {};
    var t0 = 0, t1 = 0;
    var loop = function () {
        return Promise.resolve()
            .then(function () {
            t0 = U.cpuUs();
            var opts = mainPkg.getTargetOptions();
            // opts.isNative = true
            return mainPkg.getCompileOptionsAsync(opts);
        })
            .then(function (copts) {
            t1 = U.cpuUs();
            return pxtc.compile(copts);
        })
            .then(function (res) {
            res.times["options"] = t1 - t0;
            U.iterMap(res.times, function (k, v) {
                v = Math.round(v / 1000);
                res.times[k] = v;
                if (!min[k])
                    min[k] = [];
                min[k].push(v);
            });
            console.log(res.times);
        });
    };
    return Promise.resolve()
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(loop)
        .then(function () {
        U.iterMap(min, function (k, v) {
            v.sort(function (a, b) { return a - b; });
        });
        console.log(min);
    });
}
exports.timeAsync = timeAsync;
function exportCppAsync(parsed) {
    ensurePkgDir();
    return mainPkg.loadAsync()
        .then(function () {
        setBuildEngine();
        var target = mainPkg.getTargetOptions();
        if (target.hasHex)
            target.isNative = true;
        target.keepCppFiles = true;
        return mainPkg.getCompileOptionsAsync(target);
    })
        .then(function (opts) {
        for (var _i = 0, _a = Object.keys(opts.extinfo.extensionFiles); _i < _a.length; _i++) {
            var s = _a[_i];
            var s2 = s.replace("/pxtapp/", "");
            if (s2 == s)
                continue;
            if (s2 == "main.cpp")
                continue;
            var trg = path.join(parsed.args[0], s2);
            nodeutil.mkdirP(path.dirname(trg));
            fs.writeFileSync(trg, opts.extinfo.extensionFiles[s]);
        }
    });
}
exports.exportCppAsync = exportCppAsync;
function formatAsync(parsed) {
    var inPlace = !!parsed.flags["i"];
    var testMode = !!parsed.flags["t"];
    var fileList = Promise.resolve();
    var fileNames = parsed.args;
    if (fileNames.length == 0) {
        fileList = mainPkg
            .loadAsync()
            .then(function () {
            fileNames = mainPkg.getFiles().filter(function (f) { return U.endsWith(f, ".ts"); });
        });
    }
    return fileList
        .then(function () {
        var numErr = 0;
        for (var _i = 0, fileNames_1 = fileNames; _i < fileNames_1.length; _i++) {
            var f = fileNames_1[_i];
            var input = fs.readFileSync(f, "utf8");
            var tmp = pxtc.format(input, 0);
            var formatted = tmp.formatted;
            var expected = testMode && fs.existsSync(f + ".exp") ? fs.readFileSync(f + ".exp", "utf8") : null;
            var fn = f + ".new";
            if (testMode) {
                if (expected == null)
                    expected = input;
                if (formatted != expected) {
                    nodeutil.writeFileSync(fn, formatted, { encoding: "utf8" });
                    console.log("format test FAILED; written:", fn);
                    numErr++;
                }
                else {
                    fs.unlink(fn, function (err) { });
                    console.log("format test OK:", f);
                }
            }
            else if (formatted == input) {
                console.log("already formatted:", f);
                if (!inPlace)
                    fs.unlink(fn, function (err) { });
            }
            else if (inPlace) {
                nodeutil.writeFileSync(f, formatted, { encoding: "utf8" });
                console.log("replaced:", f);
            }
            else {
                nodeutil.writeFileSync(fn, formatted, { encoding: "utf8" });
                console.log("written:", fn);
            }
        }
        if (numErr) {
            console.log(numErr + " formatting test(s) FAILED.");
            process.exit(1);
        }
        else {
            console.log(fileNames.length + " formatting test(s) OK");
        }
    });
}
exports.formatAsync = formatAsync;
function runCoreAsync(res) {
    var f = res.outfiles[pxtc.BINARY_JS];
    if (f) {
        pxsim.initCurrentRuntime = pxsim.initBareRuntime;
        var r = new pxsim.Runtime({
            type: "run",
            code: f
        });
        pxsim.Runtime.messagePosted = function (msg) {
            switch (msg.type) {
                case "serial":
                    {
                        var m = msg;
                        var d = m.data;
                        if (typeof d == "string")
                            d = d.replace(/\n$/, "");
                        console.log("serial: ", d);
                    }
                    break;
                case "bulkserial":
                    {
                        var m = msg;
                        var d = m.data;
                        if (Array.isArray(d)) {
                            d.forEach(function (datum) {
                                if (typeof datum.data == "string")
                                    datum.data = datum.data.replace(/\n$/, "");
                                console.log("serial: ", datum.data);
                            });
                        }
                    }
                    break;
                case "i2c":
                    {
                        var m = msg;
                        var d = m.data;
                        if (d)
                            console.log("i2c: " + d);
                    }
                    break;
                default:
                    {
                        var m = msg;
                        console.log(m.type + ": " + JSON.stringify(m));
                    }
                    break;
            }
        };
        r.errorHandler = function (e) {
            throw e;
        };
        r.run(function () {
            console.log("-- done");
            pxsim.dumpLivePointers();
        });
    }
    return Promise.resolve();
}
function simulatorCoverage(pkgCompileRes, pkgOpts) {
    process.chdir("../..");
    if (!nodeutil.existsDirSync(simDir()))
        return;
    var decls = {};
    if (!pkgOpts.extinfo || pkgOpts.extinfo.functions.length == 0)
        return;
    pxt.debug("checking for missing sim implementations...");
    var sources = ["built/sim.d.ts", "node_modules/pxt-core/built/pxtsim.d.ts"];
    if (fs.existsSync("built/common-sim.d.ts")) {
        sources.push("built/common-sim.d.ts");
    }
    if (!fs.existsSync(sources[0]))
        return; // simulator not yet built; will try next time
    var opts = {
        fileSystem: {},
        sourceFiles: sources,
        target: mainPkg.getTargetOptions(),
        ast: true,
        noEmit: true,
        hexinfo: null
    };
    opts.target.isNative = false;
    for (var _i = 0, _a = opts.sourceFiles; _i < _a.length; _i++) {
        var fn = _a[_i];
        opts.fileSystem[fn] = fs.readFileSync(path.join(nodeutil.targetDir, fn), "utf8");
    }
    var simDeclRes = pxtc.compile(opts);
    // The program we compiled was missing files, so filter out those errors
    reportDiagnostics(simDeclRes.diagnostics.filter(function (d) { return d.code != 5012 /* file not found */ && d.code != 2318; } /* missing global type */));
    var typechecker = simDeclRes.ast.getTypeChecker();
    var doSymbol = function (sym) {
        if (sym.getFlags() & ts.SymbolFlags.HasExports) {
            typechecker.getExportsOfModule(sym).forEach(doSymbol);
        }
        decls[pxtc.getFullName(typechecker, sym)] = sym;
    };
    var doStmt = function (stmt) {
        var mod = stmt;
        if (mod.name) {
            var sym = typechecker.getSymbolAtLocation(mod.name);
            if (sym)
                doSymbol(sym);
        }
    };
    for (var _b = 0, _c = simDeclRes.ast.getSourceFiles(); _b < _c.length; _b++) {
        var sf = _c[_b];
        sf.statements.forEach(doStmt);
    }
    for (var _d = 0, _e = pkgOpts.extinfo.functions; _d < _e.length; _d++) {
        var info = _e[_d];
        var shim = info.name;
        if (pxtc.isBuiltinSimOp(shim))
            continue;
        var simName = pxtc.shimToJs(shim);
        var sym = U.lookup(decls, simName);
        if (!sym) {
            pxt.log("missing in sim: " + simName);
        }
    }
    /*
    let apiInfo = pxtc.getApiInfo(pkgCompileRes.ast)
    for (let ent of U.values(apiInfo.byQName)) {
        let shim = ent.attributes.shim
        if (shim) {
            let simName = pxtc.shimToJs(shim)
            let sym = U.lookup(decls, simName)
            if (!sym) {
                console.log("missing in sim:", simName)
            }
        }
    }
    */
}
function testAssemblers() {
    console.log("- testing Thumb");
    var thumb = new pxtc.thumb.ThumbProcessor();
    thumb.testAssembler();
    console.log("- done testing Thumb");
    return Promise.resolve();
}
function testForBuildTargetAsync(useNative) {
    var opts;
    return mainPkg.loadAsync()
        .then(function () {
        copyCommonFiles();
        setBuildEngine();
        var target = mainPkg.getTargetOptions();
        if (target.hasHex)
            target.isNative = true;
        if (!useNative)
            target.isNative = false;
        return mainPkg.getCompileOptionsAsync(target);
    })
        .then(function (o) {
        opts = o;
        opts.testMode = true;
        opts.ast = true;
        if (useNative)
            return pxtc.compile(opts);
        else {
            pxt.debug("  skip native build of non-project");
            return null;
        }
    })
        .then(function (res) {
        if (res) {
            reportDiagnostics(res.diagnostics);
            if (!res.success)
                U.userError("Compiler test failed");
            simulatorCoverage(res, opts);
        }
    })
        .then(function () { return opts; });
}
function simshimAsync() {
    pxt.debug("looking for shim annotations in the simulator.");
    if (!fs.existsSync(path.join(simDir(), "tsconfig.json"))) {
        pxt.debug("no sim/tsconfig.json; skipping");
        return Promise.resolve();
    }
    var prog = pxtc.plainTscCompileDir(path.resolve(simDir()));
    var shims = pxt.simshim(prog, path.parse);
    var filename = "sims.d.ts";
    for (var _i = 0, _a = Object.keys(shims); _i < _a.length; _i++) {
        var s = _a[_i];
        var cont = shims[s];
        if (!cont.trim())
            continue;
        cont = "// Auto-generated from simulator. Do not edit.\n" + cont +
            "\n// Auto-generated. Do not edit. Really.\n";
        var cfgname = "libs/" + s + "/" + pxt.CONFIG_NAME;
        var cfg = nodeutil.readPkgConfig("libs/" + s);
        if (cfg.files.indexOf(filename) == -1) {
            if (pxt.appTarget.variants)
                return Promise.resolve(); // this is fine - there are native variants that generate shims
            U.userError(U.lf("please add \"{0}\" to {1}", filename, cfgname));
        }
        var fn = "libs/" + s + "/" + filename;
        if (fs.readFileSync(fn, "utf8") != cont) {
            pxt.debug("updating " + fn);
            nodeutil.writeFileSync(fn, cont);
        }
    }
    return Promise.resolve();
}
function copyCommonFiles() {
    for (var _i = 0, _a = mainPkg.getFiles(); _i < _a.length; _i++) {
        var f = _a[_i];
        if (U.lookup(commonfiles, f)) {
            mainPkg.host().writeFile(mainPkg, "built/" + f, commonfiles[f]);
        }
    }
}
function getCachedAsync(url, path) {
    return readFileAsync(path, "utf8")
        .then(function (v) { return v; }, function (e) {
        //console.log(`^^^ fetch ${id} ${Date.now() - start}ms`)
        return null;
    })
        .then(function (v) { return v ? Promise.resolve(v) :
        U.httpGetTextAsync(url)
            .then(function (v) { return writeFileAsync(path, v)
            .then(function () { return v; }); }); });
}
function patchOpts(opts, fn, content) {
    console.log("*** " + fn + ", size=" + content.length);
    var opts2 = U.flatClone(opts);
    opts2.fileSystem = U.flatClone(opts.fileSystem);
    opts2.sourceFiles = opts.sourceFiles.slice();
    opts2.sourceFiles.push(fn);
    opts2.fileSystem[fn] = content;
    opts2.embedBlob = null;
    opts2.embedMeta = null;
    return opts2;
}
function compilesOK(opts, fn, content) {
    var opts2 = patchOpts(opts, fn, content);
    var res = pxtc.compile(opts2);
    reportDiagnostics(res.diagnostics);
    if (!res.success) {
        console.log("ERRORS", fn);
    }
    return res.success;
}
function getApiInfoAsync() {
    return prepBuildOptionsAsync(BuildOption.GenDocs)
        .then(function (opts) {
        var res = pxtc.compile(opts);
        return pxtc.getApiInfo(res.ast, opts.jres, true);
    });
}
function findTestFile() {
    var tsFiles = mainPkg.getFiles().filter(function (fn) { return U.endsWith(fn, ".ts"); });
    if (tsFiles.length != 1)
        U.userError("need exactly one .ts file in package to 'testdir'");
    return tsFiles[0];
}
function prepTestOptionsAsync() {
    return prepBuildOptionsAsync(BuildOption.Test)
        .then(function (opts) {
        var tsFile = findTestFile();
        delete opts.fileSystem[tsFile];
        opts.sourceFiles = opts.sourceFiles.filter(function (f) { return f != tsFile; });
        return opts;
    });
}
function testDirAsync(parsed) {
    forceCloudBuild = true;
    var dir = path.resolve(parsed.args[0] || ".");
    var tests = [];
    var outdir = dir + "/built/";
    nodeutil.mkdirP(outdir);
    for (var _i = 0, _a = fs.readdirSync(dir); _i < _a.length; _i++) {
        var fn = _a[_i];
        if (fn[0] == ".")
            continue;
        var full = dir + "/" + fn;
        if (U.endsWith(fn, ".ts")) {
            var text = fs.readFileSync(full, "utf8");
            var m = /^\s*\/\/\s*base:\s*(\S+)/m.exec(text);
            var base = m ? m[1] : "base";
            tests.push({
                filename: full,
                base: base,
                text: text
            });
        }
        else if (fs.existsSync(full + "/" + pxt.CONFIG_NAME)) {
            tests.push({
                filename: full,
                base: fn,
                text: null
            });
        }
    }
    tests.sort(function (a, b) {
        var r = U.strcmp(a.base, b.base);
        if (r == 0)
            if (a.text == null)
                return -1;
            else if (b.text == null)
                return 1;
            else
                return U.strcmp(a.filename, b.filename);
        else
            return r;
    });
    var currBase = "";
    var errors = [];
    return Promise.mapSeries(tests, function (ti) {
        var fn = path.basename(ti.filename);
        console.log("--- " + fn);
        var hexPath = outdir + fn.replace(/\.ts$/, "") + ".hex";
        if (ti.text == null) {
            currBase = ti.base;
            process.chdir(ti.filename);
            mainPkg = new pxt.MainPackage(new Host());
            return installAsync()
                .then(testAsync)
                .then(function () {
                if (pxt.appTarget.compile.hasHex)
                    nodeutil.writeFileSync(hexPath, fs.readFileSync("built/binary." + (pxt.appTarget.compile.useUF2 ? "uf2" : "hex")));
            });
        }
        else {
            var start_1 = Date.now();
            if (currBase != ti.base) {
                throw U.userError("Base directory: " + ti.base + " not found.");
            }
            else {
                var tsf = findTestFile();
                var files = mainPkg.config.files;
                var idx = files.indexOf(tsf);
                U.assert(idx >= 0);
                files[idx] = fn;
                mainPkg.config.name = fn.replace(/\.ts$/, "");
                mainPkg.config.description = "Generated from " + ti.base + " with " + fn;
                var host = mainPkg.host();
                host.fileOverrides = {};
                host.fileOverrides[fn] = ti.text;
                return prepBuildOptionsAsync(BuildOption.Test, true)
                    .then(function (opts) {
                    var res = pxtc.compile(opts);
                    var lines = ti.text.split(/\r?\n/);
                    var errCode = function (s) {
                        if (!s)
                            return 0;
                        var m = /\/\/\s*TS(\d\d\d\d\d?)/.exec(s);
                        if (m)
                            return parseInt(m[1]);
                        else
                            return 0;
                    };
                    var numErr = 0;
                    for (var _i = 0, _a = res.diagnostics; _i < _a.length; _i++) {
                        var diag = _a[_i];
                        if (!errCode(lines[diag.line])) {
                            reportDiagnostics(res.diagnostics);
                            numErr++;
                        }
                    }
                    var lineNo = 0;
                    var _loop_1 = function (line) {
                        var code = errCode(line);
                        if (code && res.diagnostics.filter(function (d) { return d.line == lineNo && d.code == code; }).length == 0) {
                            numErr++;
                            console.log(fn + "(" + (lineNo + 1) + "): expecting error TS" + code);
                        }
                        lineNo++;
                    };
                    for (var _b = 0, lines_1 = lines; _b < lines_1.length; _b++) {
                        var line = lines_1[_b];
                        _loop_1(line);
                    }
                    if (numErr) {
                        console.log("ERRORS", fn);
                        errors.push(fn);
                        fs.unlink(hexPath, function (err) { }); // ignore errors
                    }
                    else {
                        var hex = res.outfiles["binary.hex"];
                        if (hex) {
                            nodeutil.writeFileSync(hexPath, hex);
                            console.log("wrote hex: " + hexPath + " " + hex.length + " bytes; " + (Date.now() - start_1) + "ms");
                        }
                    }
                });
            }
        }
    })
        .then(function () {
        if (errors.length) {
            console.log("Errors: " + errors.join(", "));
            process.exit(1);
        }
        else {
            console.log("All OK.");
        }
    });
}
function replaceFileExtension(file, extension) {
    return file && file.substr(0, file.length - path.extname(file).length) + extension;
}
function testPkgConflictsAsync() {
    console.log("Package conflict tests");
    /*
    Fake bundled packages are as follows (see [pxt root]/tests/pkgconflicts/built/target.json):
        Project dependencies        Packages added by test cases, conflicts in parentheses
        A  B  C                     F(C)  G     H(C,D)      G has "configIsJustDefaults"
        | / \                       |     |     |           I has same setting values as installed dependencies
        D    E                      I     J(D)  K(C,E)
    */
    var testCases = [
        { id: 1, dependencies: ["A", "B", "C"], pkgToAdd: "I", main: "D.test()", expectedConflicts: [], expectedInUse: [] },
        { id: 2, dependencies: ["A", "B"], pkgToAdd: "F", main: "test.test()", expectedConflicts: [], expectedInUse: [] },
        { id: 3, dependencies: ["B", "C"], pkgToAdd: "J", main: "C.test()", expectedConflicts: ["B", "D"], expectedInUse: [] },
        { id: 4, dependencies: ["A", "B", "C"], pkgToAdd: "G", main: "D.test()\nC.test()", expectedConflicts: ["A", "B", "D"], expectedInUse: ["D"] },
        { id: 5, dependencies: ["A", "B", "C"], pkgToAdd: "H", main: "C.test()\nD.test()\ntest.test()\E.test()", expectedConflicts: ["A", "B", "C", "D", "E"], expectedInUse: ["C", "D", "E"] },
        { id: 6, dependencies: ["A", "B", "C"], pkgToAdd: "F", main: "", expectedConflicts: ["C"], expectedInUse: [] },
    ];
    var failures = [];
    var oldAppTarget = pxt.appTarget;
    nodeutil.setTargetDir(path.join(__dirname, "..", "tests", "pkgconflicts"));
    var trg = nodeutil.getPxtTarget();
    pxt.setAppTarget(trg);
    return Promise.mapSeries(testCases, function (tc) {
        var testFailed = function (reason) {
            failures.push({ testCase: tc.id, reason: reason });
        };
        var dep = {};
        tc.dependencies.forEach(function (d) { return dep[d] = "*"; });
        var mainPkg = new pxt.MainPackage(new SnippetHost("package conflict tests", { "main.ts": tc.main }, dep));
        tc.expectedConflicts = tc.expectedConflicts.sort();
        tc.expectedInUse = tc.expectedInUse.sort();
        return mainPkg.installAllAsync()
            .then(function () { return mainPkg.findConflictsAsync(tc.pkgToAdd, "*"); })
            .then(function (conflicts) {
            var conflictNames = conflicts.map(function (c) { return c.pkg0.id; }).sort();
            if (conflictNames.length !== tc.expectedConflicts.length || !conflictNames.every(function (cn, i) { return conflictNames[i] === tc.expectedConflicts[i]; })) {
                testFailed("Mismatch on expected conflicts (found: [" + conflictNames.join(", ") + "], expected: [" + tc.expectedConflicts.join(", ") + "])");
            }
            else {
                var inUse_1 = conflictNames.filter(function (cn) { return mainPkg.isPackageInUse(cn); });
                if (inUse_1.length !== tc.expectedInUse.length || !inUse_1.every(function (cn, i) { return inUse_1[i] === tc.expectedInUse[i]; })) {
                    testFailed("Mismatch on expected in-use conflicts (found: [" + inUse_1.join(", ") + "], expected: [" + tc.expectedInUse.join(", ") + "])");
                }
            }
            pxt.log("package conflict test OK: " + tc.id);
            return Promise.resolve();
        })
            .catch(function (e) {
            pxt.log("package conflict test FAILED: " + tc.id);
            testFailed("Uncaught exception during test: " + e.message || e);
        });
    })
        .then(function () {
        pxt.log(testCases.length - failures.length + " passed, " + failures.length + " failed");
        if (failures.length) {
            pxt.log(failures.map(function (e) { return "Failure in test case " + e.testCase + ": " + e.reason; }).join("\n"));
            process.exit(1);
        }
    })
        .finally(function () {
        pxt.setAppTarget(oldAppTarget);
    });
}
function decompileAsync(parsed) {
    return Promise.mapSeries(parsed.args, function (f) {
        var outFile = replaceFileExtension(f, ".blocks");
        return decompileAsyncWorker(f, parsed.flags["dep"])
            .then(function (result) {
            nodeutil.writeFileSync(outFile, result);
        });
    })
        .then(function () {
        console.log("Done");
    }, function (error) {
        console.log("Error: " + error);
    });
}
function decompileAsyncWorker(f, dependency) {
    return new Promise(function (resolve, reject) {
        var input = fs.readFileSync(f, "utf8");
        var dep = {};
        if (dependency)
            dep[dependency] = "*";
        var inPackages = { "main.ts": input, "main.py": "" };
        var pkg = new pxt.MainPackage(new SnippetHost("decompile-pkg", inPackages, dep, true));
        pkg.installAllAsync()
            .then(function () { return pkg.getCompileOptionsAsync(); })
            .then(function (opts) {
            opts.ast = true;
            var decompiled = pxtc.decompile(pxtc.getTSProgram(opts), opts, "main.ts");
            if (decompiled.success) {
                resolve(decompiled.outfiles["main.blocks"]);
            }
            else {
                reject("Could not decompile " + f + JSON.stringify(decompiled.diagnostics, null, 4));
            }
        });
    });
}
function testSnippetsAsync(snippets, re, pycheck) {
    console.log("### TESTING " + snippets.length + " CodeSnippets");
    pxt.github.forceProxy = true; // avoid throttling in CI machines
    var filenameMatch;
    try {
        var pattern = re || '.*';
        filenameMatch = new RegExp(pattern);
    }
    catch (e) {
        pxt.log("pattern could not be compiled as a regular expression, ignoring");
        filenameMatch = new RegExp('.*');
    }
    snippets = snippets.filter(function (snippet) { return filenameMatch.test(snippet.name); });
    var ignoreCount = 0;
    var cache = {};
    var successes = [];
    var failures = [];
    var addSuccess = function (s) {
        successes.push(s);
    };
    var addFailure = function (f, infos) {
        failures.push({
            filename: f,
            diagnostics: infos
        });
        infos.forEach(function (info) { return pxt.log(f + ":(" + info.line + "," + info.start + "): " + info.category + " " + info.messageText); });
    };
    return Promise.map(snippets, function (snippet) {
        var name = snippet.name;
        var fn = snippet.file || snippet.name;
        pxt.log("  " + fn + " (" + snippet.type + ")");
        if (snippet.ext == "json") {
            try {
                var codecards = JSON.parse(snippet.code);
                if (!codecards || !Array.isArray(codecards))
                    throw new Error("codecards must be an JSON array");
                addSuccess(fn);
            }
            catch (e) {
                addFailure(fn, [{
                        code: 4242,
                        category: ts.DiagnosticCategory.Error,
                        messageText: "invalid JSON: " + e.message,
                        fileName: fn,
                        start: 1,
                        line: 1,
                        length: 1,
                        column: 1
                    }]);
            }
            return Promise.resolve();
        }
        var inFiles = { "main.ts": snippet.code, "main.py": "", "main.blocks": "" };
        var host = new SnippetHost("snippet" + name, inFiles, snippet.packages);
        host.cache = cache;
        var pkg = new pxt.MainPackage(host);
        return pkg.installAllAsync()
            .then(function () { return pkg.getCompileOptionsAsync().then(function (opts) {
            opts.ast = true;
            var resp = pxtc.compile(opts);
            if (resp.outfiles && snippet.file) {
                var dir_1 = snippet.file.replace(/\.ts$/, '');
                nodeutil.mkdirP(dir_1);
                nodeutil.mkdirP(path.join(dir_1, "built"));
                Object.keys(resp.outfiles).forEach(function (outfile) {
                    var ofn = path.join(dir_1, "built", outfile);
                    pxt.debug("writing " + ofn);
                    nodeutil.writeFileSync(ofn, resp.outfiles[outfile], 'utf8');
                });
                pkg.filesToBePublishedAsync()
                    .then(function (files) {
                    Object.keys(files).forEach(function (f) {
                        var fn = path.join(dir_1, f);
                        pxt.debug("writing " + fn);
                        nodeutil.writeFileSync(fn, files[f], 'utf8');
                    });
                });
            }
            if (resp.success) {
                if (/^block/.test(snippet.type)) {
                    //Similar to pxtc.decompile but allows us to get blocksInfo for round trip
                    var file = resp.ast.getSourceFile('main.ts');
                    var apis = pxtc.getApiInfo(resp.ast, opts.jres);
                    opts.apisInfo = apis;
                    // ensure decompile to blocks works
                    var blocksInfo = pxtc.getBlocksInfo(apis);
                    var bresp = pxtc.decompiler.decompileToBlocks(blocksInfo, file, {
                        snippetMode: false,
                        errorOnGreyBlocks: true
                    });
                    var blockSucces = !!bresp.outfiles['main.blocks'];
                    if (!blockSucces) {
                        return addFailure(fn, bresp.diagnostics);
                    }
                    // decompile to python
                    var ts1 = opts.fileSystem["main.ts"];
                    var program = pxtc.getTSProgram(opts);
                    var decompiled = pxt.py.decompileToPython(program, "main.ts");
                    var pySuccess = !!decompiled.outfiles['main.py'] && decompiled.success;
                    if (!pySuccess) {
                        console.log("ts2py error");
                        return addFailure(fn, decompiled.diagnostics);
                    }
                    opts.fileSystem['main.py'] = decompiled.outfiles['main.py'];
                    var py = decompiled.outfiles['main.py'];
                    // py to ts
                    opts.target.preferredEditor = pxt.PYTHON_PROJECT_NAME;
                    var ts2Res = pxt.py.py2ts(opts);
                    var ts2 = ts2Res.generated["main.ts"];
                    if (!ts2) {
                        console.log("py2ts error!");
                        console.dir(ts2Res);
                        var errs = ts2Res.diagnostics.map(pxtc.getDiagnosticString).join();
                        if (errs)
                            console.log(errs);
                        return addFailure(fn, ts2Res.diagnostics);
                    }
                    var getComparisonString = function (s) {
                        return s.split("\n")
                            .map(function (l) {
                            var m;
                            do {
                                m = /function(.+)\(/.exec(l);
                                if (m && m.length > 1) {
                                    l = l.replace("function" + m[1], "function");
                                }
                            } while (m && m.length > 1);
                            return l;
                        })
                            .map(function (l) {
                            var m;
                            do {
                                m = /.+:(.+)[=,)]/.exec(l);
                                if (m && m.length > 1) {
                                    l = l.replace(":" + m[1], "");
                                }
                            } while (m && m.length > 1);
                            return l;
                        })
                            .map(function (l) { return l.replace(/\s/g, ""); })
                            .map(function (l) { return l.replace(/\n/g, ""); })
                            .map(function (l) { return l.replace(/\;/g, ""); })
                            .filter(function (l) { return l; })
                            .join("");
                    };
                    if (pycheck) {
                        var cmp1 = getComparisonString(ts1);
                        var cmp2 = getComparisonString(ts2);
                        var mismatch = cmp1 != cmp2;
                        if (mismatch) {
                            console.log("Mismatch. Original:");
                            console.log(cmp1);
                            console.log("decompiled->compiled:");
                            console.log(cmp2);
                            console.log("TS mismatch :/");
                            // TODO: generate more helpful diags
                            return addFailure(fn, []);
                        }
                        else {
                            console.log("TS same :)");
                        }
                    }
                    // NOTE: neither of these decompile steps checks that the resulting code is correct or that
                    // when the code is compiled back to ts it'll behave the same. This could be validated in
                    // the future.
                    return addSuccess(name);
                }
                else {
                    return addSuccess(fn);
                }
            }
            else {
                return addFailure(name, resp.diagnostics);
            }
        }).catch(function (e) {
            addFailure(name, [
                {
                    code: 4242,
                    category: ts.DiagnosticCategory.Error,
                    messageText: e.message,
                    fileName: fn,
                    start: 1,
                    line: 1,
                    length: 1,
                    column: 1
                }
            ]);
        }); });
    }, { concurrency: 1 }).then(function (a) {
        pxt.log(successes.length + "/" + (successes.length + failures.length) + " snippets compiled to blocks and python (and back), " + failures.length + " failed");
        if (ignoreCount > 0) {
            pxt.log("Skipped " + ignoreCount + " snippets");
        }
    }).then(function () {
        if (failures.length > 0) {
            var msg = failures.length + " snippets not compiling in the docs";
            if (pxt.appTarget.ignoreDocsErrors)
                pxt.log(msg);
            else
                U.userError(msg);
        }
    });
}
function setBuildEngine() {
    var cs = pxt.appTarget.compileService;
    if (cs && cs.buildEngine) {
        build.setThisBuild(build.buildEngines[cs.buildEngine]);
        if (!build.thisBuild)
            U.userError("cannot find build engine: " + cs.buildEngine);
    }
}
function prepBuildOptionsAsync(mode, quick, ignoreTests) {
    if (quick === void 0) { quick = false; }
    if (ignoreTests === void 0) { ignoreTests = false; }
    ensurePkgDir();
    mainPkg.ignoreTests = ignoreTests;
    return mainPkg.loadAsync()
        .then(function () {
        if (!quick) {
            build.buildDalConst(build.thisBuild, mainPkg);
            copyCommonFiles();
            setBuildEngine();
        }
        // TODO pass down 'quick' to disable the C++ extension work
        var target = mainPkg.getTargetOptions();
        if (target.hasHex)
            target.isNative = true;
        switch (mode) {
            case BuildOption.Run:
            case BuildOption.DebugSim:
            case BuildOption.GenDocs:
                target.isNative = false;
                break;
            default:
                break;
        }
        return mainPkg.getCompileOptionsAsync(target);
    })
        .then(function (opts) {
        if (mode == BuildOption.Test)
            opts.testMode = true;
        if (mode == BuildOption.GenDocs)
            opts.ast = true;
        if (pxt.appTarget.compile.postProcessSymbols && (mode == BuildOption.Deploy || mode == BuildOption.JustBuild)) {
            opts.computeUsedSymbols = true;
            opts.ast = true;
        }
        if (opts.target.preferredEditor == pxt.PYTHON_PROJECT_NAME) {
            pxt.log("pre-compiling apisInfo for Python");
            pxt.prepPythonOptions(opts);
            if (process.env["PXT_SAVE_APISINFO"])
                fs.writeFileSync("built/apisinfo.json", JSON.stringify(opts.apisInfo, null, 4));
            pxt.log("done pre-compiling apisInfo for Python");
        }
        return opts;
    });
}
function dbgTestAsync() {
    return buildCoreAsync({
        mode: BuildOption.JustBuild,
        debug: true
    })
        .then(clidbg.startAsync);
}
function gdbAsync(c) {
    ensurePkgDir();
    setBuildEngine();
    return mainPkg.loadAsync()
        .then(function () { return gdb.startAsync(c.args); });
}
function hwAsync(c) {
    ensurePkgDir();
    return mainPkg.loadAsync()
        .then(function () { return gdb.hwAsync(c.args); });
}
function dumplogAsync(c) {
    ensurePkgDir();
    return mainPkg.loadAsync()
        .then(function () { return gdb.dumplogAsync(); });
}
function dumpheapAsync(c) {
    ensurePkgDir();
    return mainPkg.loadAsync()
        .then(function () { return gdb.dumpheapAsync(); });
}
function buildDalDTSAsync(c) {
    forceLocalBuild = true;
    forceBuild = true; // make sure we actually build
    forceCloudBuild = false;
    var clean = !!c.flags["clean"];
    function prepAsync() {
        var p = Promise.resolve();
        if (clean)
            p = p.then(function () { return cleanAsync(); });
        p = p.then(function () { return buildCoreAsync({ mode: BuildOption.JustBuild }); })
            .then(function () { });
        return p;
    }
    if (fs.existsSync("pxtarget.json")) {
        pxt.log("generating dal.d.ts for packages");
        return rebundleAsync()
            .then(function () { return forEachBundledPkgAsync(function (f, dir) {
            return f.loadAsync()
                .then(function () {
                if (f.config.dalDTS && f.config.dalDTS.corePackage) {
                    console.log("  " + dir);
                    return prepAsync()
                        .then(function () { return build.buildDalConst(build.thisBuild, f, true, true); });
                }
                return Promise.resolve();
            });
        }); });
    }
    else {
        ensurePkgDir();
        return prepAsync()
            .then(function () { return mainPkg.loadAsync(); })
            .then(function () { return build.buildDalConst(build.thisBuild, mainPkg, true, true); });
    }
}
function buildCoreAsync(buildOpts) {
    var compileOptions;
    var compileResult;
    ensurePkgDir();
    pxt.log("building " + process.cwd());
    return prepBuildOptionsAsync(buildOpts.mode, false, buildOpts.ignoreTests)
        .then(function (opts) {
        compileOptions = opts;
        if (buildOpts.warnDiv) {
            pxt.debug("warning on division operators");
            opts.warnDiv = true;
        }
        opts.breakpoints = buildOpts.mode === BuildOption.DebugSim;
        if (buildOpts.debug) {
            opts.breakpoints = true;
            opts.justMyCode = true;
        }
        return pxtc.compile(opts);
    })
        .then(function (res) {
        compileResult = res;
        U.iterMap(res.outfiles, function (fn, c) {
            if (fn !== pxtc.BINARY_JS) {
                mainPkg.host().writeFile(mainPkg, "built/" + fn, c);
                pxt.debug("package written to " + ("built/" + fn));
            }
            else {
                mainPkg.host().writeFile(mainPkg, "built/debug/" + fn, c);
                pxt.debug("package written to " + ("built/debug/" + fn));
            }
        });
        reportDiagnostics(res.diagnostics);
        if (!res.success && buildOpts.mode != BuildOption.GenDocs) {
            process.exit(1);
        }
        if (buildOpts.mode === BuildOption.DebugSim) {
            mainPkg.host().writeFile(mainPkg, "built/debug/debugInfo.json", JSON.stringify({
                usedParts: pxtc.computeUsedParts(res, true),
                usedArguments: res.usedArguments,
                breakpoints: res.breakpoints
            }));
        }
        if (res.usedSymbols && compileOptions.computeUsedSymbols) {
            var apiInfo = pxtc.getApiInfo(res.ast, compileOptions.jres);
            for (var _i = 0, _a = Object.keys(res.usedSymbols); _i < _a.length; _i++) {
                var k = _a[_i];
                res.usedSymbols[k] = apiInfo.byQName[k] || null;
            }
        }
        if (pxt.appTarget.compile.switches.time)
            console.log(compileResult.times);
        switch (buildOpts.mode) {
            case BuildOption.GenDocs:
                var apiInfo = pxtc.getApiInfo(res.ast, compileOptions.jres);
                // keeps apis from this module only
                for (var infok in apiInfo.byQName) {
                    var info = apiInfo.byQName[infok];
                    if (info.pkg &&
                        info.pkg != mainPkg.config.name)
                        delete apiInfo.byQName[infok];
                }
                // Look for and read pxt snippets file
                var pxtsnippet = pxt.Util.jsonTryParse(mainPkg.readFile('pxtsnippets.json'));
                pxt.debug("generating api docs (" + Object.keys(apiInfo.byQName).length + ")");
                var md_1 = pxtc.genDocs(mainPkg.config.name, apiInfo, {
                    package: mainPkg.config.name != pxt.appTarget.corepkg && !mainPkg.config.core,
                    locs: buildOpts.locs,
                    docs: buildOpts.docs,
                    pxtsnippet: pxtsnippet,
                });
                if (buildOpts.fileFilter) {
                    var filterRx_1 = new RegExp(buildOpts.fileFilter, "i");
                    Object.keys(md_1).filter(function (fn) { return !filterRx_1.test(fn); }).forEach(function (fn) { return delete md_1[fn]; });
                }
                for (var fn in md_1) {
                    var folder = /strings.json$/.test(fn) ? "_locales/" : /\.md$/.test(fn) ? "../../docs/" : "built/";
                    var ffn = path.join(folder, fn);
                    if (!buildOpts.createOnly || !fs.existsSync(ffn)) {
                        nodeutil.mkdirP(path.dirname(ffn));
                        mainPkg.host().writeFile(mainPkg, ffn, md_1[fn]);
                        pxt.debug("generated " + ffn + "; size=" + md_1[fn].length);
                    }
                }
                return null;
            case BuildOption.Deploy:
                if (pxt.commands.hasDeployFn())
                    return pxt.commands.deployAsync(res);
                else {
                    pxt.log("no deploy functionality defined by this target");
                    return null;
                }
            case BuildOption.Run:
                return runCoreAsync(res);
            default:
                return Promise.resolve();
        }
    })
        .then(function () {
        return compileResult;
    });
}
function crowdinCredentialsAsync() {
    var prj = pxt.appTarget.appTheme.crowdinProject;
    if (!prj) {
        pxt.log("crowdin upload skipped, Crowdin project missing in target theme");
        return Promise.resolve(undefined);
    }
    return Promise.resolve()
        .then(function () {
        // Env var overrides credentials manager
        var envKey = process.env[pxt.crowdin.KEY_VARIABLE];
        return Promise.resolve(envKey);
    })
        .then(function (key) {
        if (!key) {
            pxt.log("Crowdin operation skipped: '" + pxt.crowdin.KEY_VARIABLE + "' variable is missing");
            return undefined;
        }
        var branch = pxt.appTarget.appTheme.crowdinBranch;
        return { prj: prj, key: key, branch: branch };
    });
}
function uploadTargetTranslationsAsync(parsed) {
    var uploadDocs = parsed && !!parsed.flags["docs"];
    return internalUploadTargetTranslationsAsync(uploadDocs);
}
exports.uploadTargetTranslationsAsync = uploadTargetTranslationsAsync;
function internalUploadTargetTranslationsAsync(uploadDocs) {
    pxt.log("retrieving Crowdin credentials...");
    return crowdinCredentialsAsync()
        .then(function (cred) {
        if (!cred)
            return Promise.resolve();
        pxt.log("got Crowdin credentials");
        var crowdinDir = pxt.appTarget.id;
        if (crowdinDir == "core") {
            if (!uploadDocs) {
                pxt.log('missing --docs flag, skipping');
                return Promise.resolve();
            }
            pxt.log("uploading core translations...");
            return uploadDocsTranslationsAsync("docs", crowdinDir, cred.branch, cred.prj, cred.key)
                .then(function () { return uploadDocsTranslationsAsync("common-docs", crowdinDir, cred.branch, cred.prj, cred.key); });
        }
        else {
            pxt.log("uploading target translations...");
            return execCrowdinAsync("upload", "built/target-strings.json", crowdinDir)
                .then(function () { return fs.existsSync("built/sim-strings.json") ? execCrowdinAsync("upload", "built/sim-strings.json", crowdinDir) : Promise.resolve(); })
                .then(function () { return uploadBundledTranslationsAsync(crowdinDir, cred.branch, cred.prj, cred.key); })
                .then(function () {
                if (uploadDocs) {
                    pxt.log("uploading docs...");
                    return uploadDocsTranslationsAsync("docs", crowdinDir, cred.branch, cred.prj, cred.key)
                        .then(function () { return Promise.all(pxt.appTarget.bundleddirs
                        .filter(function (pkgDir) { return nodeutil.existsDirSync(path.join(pkgDir, "docs")); })
                        .map(function (pkgDir) { return uploadDocsTranslationsAsync(path.join(pkgDir, "docs"), crowdinDir, cred.branch, cred.prj, cred.key); })).then(function () {
                        pxt.log("docs uploaded");
                    }); });
                }
                pxt.log("skipping docs upload (not a release)");
                return Promise.resolve();
            });
        }
    });
}
function uploadDocsTranslationsAsync(srcDir, crowdinDir, branch, prj, key) {
    pxt.log("uploading from " + srcDir + " to " + crowdinDir + " under project " + prj + "/" + (branch || ""));
    var ignoredDirectories = {};
    nodeutil.allFiles(srcDir).filter(function (d) { return nodeutil.fileExistsSync(path.join(path.dirname(d), ".crowdinignore")); }).forEach(function (f) { return ignoredDirectories[path.dirname(f)] = true; });
    var ignoredDirectoriesList = Object.keys(ignoredDirectories);
    var todo = nodeutil.allFiles(srcDir).filter(function (f) { return /\.md$/.test(f) && !/_locales/.test(f); }).reverse();
    var knownFolders = {};
    var ensureFolderAsync = function (crowdd) {
        if (!knownFolders[crowdd]) {
            knownFolders[crowdd] = true;
            pxt.log("creating folder " + crowdd);
            return pxt.crowdin.createDirectoryAsync(branch, prj, key, crowdd);
        }
        return Promise.resolve();
    };
    var nextFileAsync = function (f) {
        if (!f)
            return Promise.resolve();
        var crowdf = path.join(crowdinDir, f);
        var crowdd = path.dirname(crowdf);
        // check if file should be ignored
        if (ignoredDirectoriesList.filter(function (d) { return path.dirname(f).indexOf(d) == 0; }).length > 0) {
            pxt.log("skpping " + f + " because of .crowdinignore file");
            return nextFileAsync(todo.pop());
        }
        var data = fs.readFileSync(f, 'utf8');
        pxt.log("uploading " + f + " to " + crowdf);
        return ensureFolderAsync(crowdd)
            .then(function () { return pxt.crowdin.uploadTranslationAsync(branch, prj, key, crowdf, data); })
            .then(function () { return nextFileAsync(todo.pop()); });
    };
    return ensureFolderAsync(path.join(crowdinDir, srcDir))
        .then(function () { return nextFileAsync(todo.pop()); });
}
function uploadBundledTranslationsAsync(crowdinDir, branch, prj, key) {
    var todo = [];
    pxt.appTarget.bundleddirs.forEach(function (dir) {
        var locdir = path.join(dir, "_locales");
        if (fs.existsSync(locdir))
            fs.readdirSync(locdir)
                .filter(function (f) { return /strings\.json$/i.test(f); })
                .forEach(function (f) { return todo.push(path.join(locdir, f)); });
    });
    pxt.log("uploading bundled translations to Crowdin (" + todo.length + " files)");
    var nextFileAsync = function () {
        var f = todo.pop();
        if (!f)
            return Promise.resolve();
        var data = JSON.parse(fs.readFileSync(f, 'utf8'));
        var crowdf = path.join(crowdinDir, path.basename(f));
        pxt.log("uploading " + f + " to " + crowdf);
        return pxt.crowdin.uploadTranslationAsync(branch, prj, key, crowdf, JSON.stringify(data))
            .then(nextFileAsync);
    };
    return nextFileAsync();
}
function downloadTargetTranslationsAsync(parsed) {
    var name = (parsed && parsed.args[0]) || "";
    var crowdinDir = pxt.appTarget.id;
    return crowdinCredentialsAsync()
        .then(function (cred) {
        if (!cred)
            return Promise.resolve();
        return downloadFilesAsync(cred, ["sim-strings.json"], "sim")
            .then(function () { return downloadFilesAsync(cred, ["target-strings.json"], "target"); })
            .then(function () {
            var files = [];
            pxt.appTarget.bundleddirs
                .filter(function (dir) { return !name || dir == "libs/" + name; })
                .forEach(function (dir) {
                var locdir = path.join(dir, "_locales");
                if (fs.existsSync(locdir))
                    fs.readdirSync(locdir)
                        .filter(function (f) { return /\.json$/i.test(f); })
                        .forEach(function (f) { return files.push(path.join(locdir, f)); });
            });
            return downloadFilesAsync(cred, files, "bundled");
        });
    });
    function downloadFilesAsync(cred, todo, outputName) {
        var locs = {};
        var nextFileAsync = function () {
            var f = todo.pop();
            if (!f) {
                return Promise.resolve();
            }
            var errors = {};
            var fn = path.basename(f);
            var crowdf = path.join(crowdinDir, fn);
            var locdir = path.dirname(f);
            var projectdir = path.dirname(locdir);
            pxt.log("downloading " + crowdf);
            pxt.debug("projectdir: " + projectdir);
            return pxt.crowdin.downloadTranslationsAsync(cred.branch, cred.prj, cred.key, crowdf, { translatedOnly: true, validatedOnly: true })
                .then(function (data) {
                Object.keys(data)
                    .filter(function (lang) { return Object.keys(data[lang]).some(function (k) { return !!data[lang][k]; }); })
                    .forEach(function (lang) {
                    var dataLang = data[lang];
                    var langTranslations = stringifyTranslations(dataLang);
                    if (!langTranslations)
                        return;
                    // validate translations
                    if (/-strings\.json$/.test(fn) && !/jsdoc-strings\.json$/.test(fn)) {
                        // block definitions
                        Object.keys(dataLang).forEach(function (id) {
                            var tr = dataLang[id];
                            pxt.blocks.normalizeBlock(tr, function (err) {
                                var errid = fn + "." + lang;
                                errors[fn + "." + lang] = 1;
                                pxt.log("error " + errid + ": " + err);
                            });
                        });
                    }
                    // merge translations
                    var strings = locs[lang];
                    if (!strings)
                        strings = locs[lang] = {};
                    Object.keys(dataLang)
                        .filter(function (k) { return !!dataLang[k] && !strings[k]; })
                        .forEach(function (k) { return strings[k] = dataLang[k]; });
                });
                var errorIds = Object.keys(errors);
                if (errorIds.length) {
                    pxt.log(errorIds.length + " errors");
                    errorIds.forEach(function (blockid) { return pxt.log("error in " + blockid); });
                    pxt.reportError("loc.errors", "invalid translation", errors);
                }
                return nextFileAsync();
            });
        };
        return nextFileAsync()
            .then(function () {
            Object.keys(locs).forEach(function (lang) {
                var tf = path.join("sim/public/locales/" + lang + "/" + outputName + "-strings.json");
                pxt.log("writing " + tf);
                var dataLang = locs[lang];
                var langTranslations = stringifyTranslations(dataLang);
                nodeutil.writeFileSync(tf, langTranslations, { encoding: "utf8" });
            });
        });
    }
}
exports.downloadTargetTranslationsAsync = downloadTargetTranslationsAsync;
function stringifyTranslations(strings) {
    var trg = {};
    Object.keys(strings).sort().forEach(function (k) {
        var v = strings[k].trim();
        if (v)
            trg[k] = v;
    });
    if (Object.keys(trg).length == 0)
        return undefined;
    else
        return JSON.stringify(trg, null, 2);
}
function staticpkgAsync(parsed) {
    var route = parsed.flags["route"] || "/";
    var ghpages = parsed.flags["githubpages"];
    var builtPackaged = parsed.flags["output"] || "built/packaged";
    var minify = !!parsed.flags["minify"];
    var bump = !!parsed.flags["bump"];
    var disableAppCache = !!parsed.flags["no-appcache"];
    var locs = !!parsed.flags["locs"];
    if (parsed.flags["cloud"])
        forceCloudBuild = true;
    pxt.log("packaging editor to " + builtPackaged);
    var p = rimrafAsync(builtPackaged, {})
        .then(function () { return bump ? bumpAsync() : Promise.resolve(); })
        .then(function () { return locs && downloadTargetTranslationsAsync(); })
        .then(function () { return internalBuildTargetAsync({ packaged: true }); });
    if (ghpages)
        return p.then(function () { return ghpPushAsync(builtPackaged, minify); });
    else
        return p.then(function () { return internalStaticPkgAsync(builtPackaged, route, minify, disableAppCache); });
}
exports.staticpkgAsync = staticpkgAsync;
function internalStaticPkgAsync(builtPackaged, label, minify, noAppCache) {
    var pref = path.resolve(builtPackaged);
    var localDir = !label ? "./" : "" + (U.startsWith(label, ".") || U.startsWith(label, "/") ? "" : "/") + label + (U.endsWith(label, "/") ? "" : "/");
    return uploadCoreAsync({
        label: label || "main",
        pkgversion: "0.0.0",
        fileList: pxtFileList("node_modules/pxt-core/")
            .concat(targetFileList())
            .concat(["targetconfig.json"])
            .concat(nodeutil.allFiles("built/hexcache")),
        localDir: localDir,
        target: (pxt.appTarget.id || "unknownstatic"),
        builtPackaged: builtPackaged,
        minify: minify,
        noAppCache: noAppCache
    }).then(function () { return renderDocs(builtPackaged, localDir); });
}
function cleanAsync(parsed) {
    pxt.log('cleaning built folders');
    return rimrafAsync("built", {})
        .then(function () { return rimrafAsync("temp", {}); })
        .then(function () { return rimrafAsync("libs/**/built", {}); })
        .then(function () { return rimrafAsync("projects/**/built", {}); })
        .then(function () { });
}
exports.cleanAsync = cleanAsync;
function cleanGenAsync(parsed) {
    pxt.log('cleaning generated files');
    return Promise.resolve()
        .then(function () { return rimrafAsync("libs/**/enums.d.ts", {}); })
        .then(function () { return rimrafAsync("libs/**/shims.d.ts", {}); })
        .then(function () { return rimrafAsync("libs/**/_locales", {}); })
        .then(function () { });
}
exports.cleanGenAsync = cleanGenAsync;
function npmInstallNativeAsync() {
    pxt.log('installing npm native dependencies');
    var deps = nodeutil.lazyDependencies();
    var mods = Object.keys(deps).map(function (k) { return k + "@" + deps[k]; });
    function nextAsync() {
        var mod = mods.pop();
        if (!mod)
            return Promise.resolve();
        return nodeutil.runNpmAsync("install", mod);
    }
    return nextAsync();
}
exports.npmInstallNativeAsync = npmInstallNativeAsync;
function buildJResSpritesAsync(parsed) {
    ensurePkgDir();
    return loadPkgAsync()
        .then(function () { return buildJResSpritesCoreAsync(parsed); });
}
exports.buildJResSpritesAsync = buildJResSpritesAsync;
function buildJResSpritesCoreAsync(parsed) {
    var PNG = require("pngjs").PNG;
    var dir = parsed.args[0];
    if (!dir)
        U.userError("missing directory argument");
    if (!nodeutil.existsDirSync(dir))
        U.userError("directory '" + dir + "' does not exist");
    // create meta.json file if needed
    var metaInfoPath = path.join(dir, "meta.json");
    if (!fs.existsSync(metaInfoPath)) {
        pxt.log(metaInfoPath + " not found, creating new one");
        fs.writeFileSync(metaInfoPath, JSON.stringify({
            "width": 16,
            "height": 16,
            "blockIdentity": "image.__imagePicker",
            "creator": "image.ofBuffer",
            "star": {
                "namespace": "sprites." + dir.toLowerCase(),
                "mimeType": "image/x-mkcd-f4"
            }
        }, null, 4));
    }
    var metaInfo = nodeutil.readJson(metaInfoPath);
    var jresources = {};
    var star = metaInfo.star;
    jresources["*"] = metaInfo.star;
    var bpp = 4;
    if (/-f1/.test(star.mimeType))
        bpp = 1;
    if (!metaInfo.star)
        U.userError("invalid meta.json");
    if (!metaInfo.basename)
        metaInfo.basename = star.namespace;
    if (!metaInfo.basename)
        U.userError("invalid meta.json");
    star.dataEncoding = star.dataEncoding || "base64";
    if (!pxt.appTarget.runtime || !pxt.appTarget.runtime.palette)
        U.userError("palette not defined in pxt.json");
    var palette = pxt.appTarget.runtime.palette.map(function (s) {
        var v = parseInt(s.replace(/#/, ""), 16);
        return [(v >> 16) & 0xff, (v >> 8) & 0xff, (v >> 0) & 0xff];
    });
    var ts = "namespace " + metaInfo.star.namespace + " {\n";
    for (var _i = 0, _a = nodeutil.allFiles(dir, 1); _i < _a.length; _i++) {
        var fn = _a[_i];
        fn = fn.replace(/\\/g, "/");
        var m = /(.*\/)(.*)\.png$/i.exec(fn);
        if (!m)
            continue;
        var bn = m[2];
        var jn = m[1] + m[2] + ".json";
        bn = bn.replace(/-1bpp/, "").replace(/[^\w]/g, "_");
        var standalone = metaInfo.standaloneSprites && metaInfo.standaloneSprites.indexOf(bn) !== -1;
        processImage(bn, fn, jn, standalone);
    }
    ts += "}\n";
    pxt.log("save " + metaInfo.basename + ".jres and .ts");
    nodeutil.writeFileSync(metaInfo.basename + ".jres", JSON.stringify(jresources, null, 2));
    nodeutil.writeFileSync(metaInfo.basename + ".ts", ts);
    return Promise.resolve();
    // use geometric distance on colors
    function scale(v) {
        return v * v;
    }
    function closestColor(buf, pix, alpha) {
        if (alpha === void 0) { alpha = true; }
        if (alpha && buf[pix + 3] < 100)
            return 0; // transparent
        var mindelta = 0;
        var idx = -1;
        for (var i = alpha ? 1 : 0; i < palette.length; ++i) {
            var delta = scale(palette[i][0] - buf[pix + 0]) + scale(palette[i][1] - buf[pix + 1]) + scale(palette[i][2] - buf[pix + 2]);
            if (idx < 0 || delta < mindelta) {
                idx = i;
                mindelta = delta;
            }
        }
        return idx;
    }
    function processImage(basename, pngName, jsonName, standalone) {
        var info = {};
        if (nodeutil.fileExistsSync(jsonName))
            info = nodeutil.readJson(jsonName);
        if (!info.width)
            info.width = metaInfo.width;
        if (!info.height)
            info.height = metaInfo.height;
        var sheet = PNG.sync.read(fs.readFileSync(pngName));
        var imgIdx = 0;
        // add alpha channel
        if (sheet.colorType == 0) {
            sheet.colorType = 6;
            sheet.depth = 8;
            for (var i = 0; i < sheet.data.length; i += 4) {
                if (closestColor(sheet.data, i, false) == 0)
                    sheet.data[i + 3] = 0x00;
            }
        }
        if (sheet.colorType != 6)
            U.userError("only RGBA png images supported");
        if (sheet.depth != 8)
            U.userError("only 8 bit per channel png images supported");
        if (sheet.width > 255 || sheet.height > 255)
            U.userError("PNG image too big");
        if (standalone) {
            // Image contains a single sprite
            info.width = sheet.width;
            info.height = sheet.height;
        }
        else {
            if (!info.width || info.width > sheet.width)
                info.width = sheet.width;
            if (!info.height || info.height > sheet.height)
                info.height = sheet.height;
        }
        if (!info.xSpacing)
            info.xSpacing = 0;
        if (!info.ySpacing)
            info.ySpacing = 0;
        var nx = (sheet.width / info.width) | 0;
        var ny = (sheet.height / info.height) | 0;
        var numSprites = nx * ny;
        for (var y = 0; y + info.height - 1 < sheet.height; y += info.height + info.ySpacing) {
            var _loop_2 = function (x) {
                if (info.frames && imgIdx >= info.frames.length)
                    return { value: void 0 };
                var img = U.flatClone(sheet);
                img.data = Buffer.alloc(info.width * info.height * 4);
                img.width = info.width;
                img.height = info.height;
                for (var i = 0; i < info.height; ++i) {
                    var src = x * 4 + (y + i) * sheet.width * 4;
                    sheet.data.copy(img.data, i * info.width * 4, src, src + info.width * 4);
                }
                var key = basename + imgIdx;
                if (info.frames && info.frames[imgIdx]) {
                    var suff = info.frames[imgIdx];
                    if (/^[a-z]/.test(suff))
                        suff = "_" + suff;
                    key = basename + suff;
                }
                else if (numSprites == 1) {
                    key = basename;
                }
                var hex = pxtc.f4EncodeImg(img.width, img.height, bpp, function (x, y) {
                    return closestColor(img.data, 4 * (x + y * img.width));
                });
                var data = Buffer.from(hex, "hex").toString(star.dataEncoding);
                var storeIcon = false;
                if (storeIcon) {
                    var jres = jresources[key];
                    if (!jres) {
                        jres = jresources[key] = {};
                    }
                    jres.data = data;
                    jres.icon = 'data:image/png;base64,' + PNG.sync.write(img).toString('base64');
                }
                else {
                    // use the short form
                    jresources[key] = data;
                }
                ts += "    //% fixedInstance jres blockIdentity=" + metaInfo.blockIdentity + "\n";
                if (info.tags || metaInfo.tags) {
                    var tags = (metaInfo.tags || "") + " " + (info.tags || "");
                    ts += "    //% tags=\"" + tags.trim() + "\"\n";
                }
                ts += "    export const " + key + " = " + metaInfo.creator + "(hex``);\n";
                pxt.log("add " + key + "; " + JSON.stringify(jresources[key]).length + " bytes");
                imgIdx++;
            };
            for (var x = 0; x + info.width - 1 < sheet.width; x += info.width + info.xSpacing) {
                var state_1 = _loop_2(x);
                if (typeof state_1 === "object")
                    return state_1.value;
            }
        }
    }
}
function buildJResAsync(parsed) {
    ensurePkgDir();
    nodeutil.allFiles(".")
        .filter(function (f) { return /\.jres$/i.test(f); })
        .forEach(function (f) {
        pxt.log("expanding jres resources in " + f);
        var jresources = nodeutil.readJson(f);
        var oldjr = JSON.stringify(jresources, null, 2);
        var dir = path.join('jres', path.basename(f, '.jres'));
        // update existing fields
        var star = jresources["*"];
        if (!star.dataEncoding)
            star.dataEncoding = 'base64';
        Object.keys(jresources).filter(function (k) { return k != "*"; }).forEach(function (k) {
            var jres = jresources[k];
            var mime = jres.mimeType || star.mimeType;
            pxt.log("expanding " + k);
            // try to slurp icon
            var iconn = path.join(dir, k + '-icon.png');
            pxt.debug("looking for " + iconn);
            if (nodeutil.fileExistsSync(iconn)) {
                pxt.log("importing " + iconn);
                jres.icon = 'data:image/png;base64,' + fs.readFileSync(iconn, 'base64');
            }
            // try to find file
            if (mime) {
                var ext = mime.replace(/^.*\//, '');
                var fn = path.join(dir, k + '-data.' + ext);
                pxt.debug("looking for " + fn);
                if (nodeutil.fileExistsSync(fn)) {
                    pxt.log("importing " + fn);
                    jres.data = fs.readFileSync(fn, 'base64');
                }
                else {
                    var fn_2 = path.join(dir, k + '.' + ext);
                    pxt.debug("looking for " + fn_2);
                    if (nodeutil.fileExistsSync(fn_2)) {
                        pxt.log("importing " + fn_2);
                        jres.data = fs.readFileSync(fn_2, 'base64');
                    }
                }
            }
        });
        var newjr = JSON.stringify(jresources, null, 2);
        if (oldjr != newjr) {
            pxt.log("updating " + f);
            nodeutil.writeFileSync(f, newjr);
        }
    });
    return Promise.resolve();
}
exports.buildJResAsync = buildJResAsync;
function buildAsync(parsed) {
    var mode = BuildOption.JustBuild;
    if (parsed && parsed.flags["debug"])
        mode = BuildOption.DebugSim;
    else if (parsed && parsed.flags["deploy"])
        mode = BuildOption.Deploy;
    var clean = parsed && parsed.flags["clean"];
    var warnDiv = parsed && !!parsed.flags["warndiv"];
    var ignoreTests = parsed && !!parsed.flags["ignoreTests"];
    var install = parsed && !!parsed.flags["install"];
    return (clean ? cleanAsync() : Promise.resolve())
        .then(function () { return install ? installAsync(parsed) : Promise.resolve(); })
        .then(function () {
        parseBuildInfo(parsed);
        return buildCoreAsync({ mode: mode, warnDiv: warnDiv, ignoreTests: ignoreTests });
    }).then(function (compileOpts) { });
}
exports.buildAsync = buildAsync;
function gendocsAsync(parsed) {
    var docs = !!parsed.flags["docs"];
    var locs = !!parsed.flags["locs"];
    var fileFilter = parsed.flags["files"];
    var createOnly = !!parsed.flags["create"];
    return internalGenDocsAsync(docs, locs, fileFilter, createOnly);
}
exports.gendocsAsync = gendocsAsync;
function internalGenDocsAsync(docs, locs, fileFilter, createOnly) {
    var buildAsync = function () { return buildCoreAsync({
        mode: BuildOption.GenDocs,
        docs: docs,
        locs: locs,
        fileFilter: fileFilter,
        createOnly: createOnly
    }).then(function (compileOpts) { }); };
    // from target location?
    if (fs.existsSync("pxtarget.json") && !!readJson("pxtarget.json").appTheme)
        return forEachBundledPkgAsync(function (pkg, dirname) {
            pxt.debug("building docs in " + dirname);
            return buildAsync();
        });
    else
        return buildAsync();
}
function consoleAsync(parsed) {
    pxt.log("monitoring console.log");
    if (!hid.isInstalled()) {
        pxt.log("console support not installed, did you run \"pxt npminstallnative\"?");
        return Promise.resolve();
    }
    return hid.serialAsync();
}
exports.consoleAsync = consoleAsync;
function deployAsync(parsed) {
    parseBuildInfo(parsed);
    var serial = parsed && !!parsed.flags["console"];
    return buildCoreAsync({ mode: BuildOption.Deploy })
        .then(function (compileOpts) { return serial ? consoleAsync(parsed) : Promise.resolve(); });
}
exports.deployAsync = deployAsync;
function runAsync(parsed) {
    parseBuildInfo(parsed);
    return buildCoreAsync({ mode: BuildOption.Run })
        .then(function (compileOpts) { });
}
exports.runAsync = runAsync;
function testAsync() {
    return buildCoreAsync({ mode: BuildOption.Test })
        .then(function (compileOpts) { });
}
exports.testAsync = testAsync;
function extractAsync(parsed) {
    var vscode = !!parsed.flags["code"];
    var out = parsed.flags["code"] || '.';
    var filename = parsed.args[0];
    return extractAsyncInternal(filename, out, vscode);
}
exports.extractAsync = extractAsync;
function isScriptId(id) {
    return /^((_[a-zA-Z0-9]{12})|([\d\-]{20,}))$/.test(id);
}
function fetchTextAsync(filename) {
    if (filename == "-" || !filename)
        return nodeutil.readResAsync(process.stdin);
    if (isScriptId(filename))
        filename = Cloud.apiRoot + filename + "/text";
    var m = /^(https:\/\/[^\/]+\/)([^\/]+)$/.exec(filename);
    var fn2 = "";
    if (m) {
        var id = m[2];
        if (/^api\//.test(id))
            id = id.slice(4);
        if (isScriptId(id)) {
            fn2 = m[1] + "api/" + id + "/text";
        }
    }
    if (/^https?:/.test(filename)) {
        pxt.log("fetching " + filename + "...");
        if (/\.json$/i.test(filename))
            pxt.log("compile log: " + filename.replace(/\.json$/i, ".log"));
        return U.requestAsync({ url: filename, allowHttpErrors: !!fn2 })
            .then(function (resp) {
            if (fn2 && (resp.statusCode != 200 || /html/.test(resp.headers["content-type"]))) {
                pxt.log("Trying also " + fn2 + "...");
                return U.requestAsync({ url: fn2 });
            }
            return resp;
        })
            .then(function (resp) { return resp.buffer; });
    }
    else
        return readFileAsync(filename);
}
function extractAsyncInternal(filename, out, vscode) {
    if (filename && nodeutil.existsDirSync(filename)) {
        pxt.log("extracting folder " + filename);
        return Promise.all(fs.readdirSync(filename)
            .filter(function (f) { return /\.(hex|uf2)/.test(f); })
            .map(function (f) { return extractAsyncInternal(path.join(filename, f), out, vscode); }))
            .then(function () { });
    }
    return fetchTextAsync(filename)
        .then(function (buf) { return extractBufferAsync(buf, out); })
        .then(function (dirs) {
        if (dirs && vscode) {
            pxt.debug('launching code...');
            dirs.forEach(function (dir) { return openVsCode(dir); });
        }
    });
}
function extractBufferAsync(buf, outDir) {
    var oneFile = function (src, editor) {
        var files = {};
        files["main." + (editor || "td")] = src || "";
        return files;
    };
    var unpackHexAsync = function (buf) {
        return pxt.cpp.unpackSourceFromHexAsync(buf)
            .then(function (data) {
            if (!data)
                return null;
            if (!data.meta)
                data.meta = {};
            var id = data.meta.cloudId || "?";
            console.log(".hex/uf2 cloudId: " + id);
            if (data.meta.targetVersions)
                console.log("target version: " + data.meta.targetVersions.target + ", pxt " + data.meta.targetVersions.pxt);
            var files = null;
            try {
                files = JSON.parse(data.source);
            }
            catch (e) {
                files = oneFile(data.source, data.meta.editor);
            }
            return {
                projects: [
                    {
                        name: data.meta.name,
                        files: files
                    }
                ]
            };
        });
    };
    return Promise.resolve()
        .then(function () {
        var str = buf.toString("utf8");
        if (str[0] == ":") {
            console.log("Detected .hex file.");
            return unpackHexAsync(buf);
        }
        else if (str[0] == "U") {
            console.log("Detected .uf2 file.");
            return unpackHexAsync(buf);
        }
        else if (str[0] == "{") {
            console.log("Detected .json file.");
            return JSON.parse(str);
        }
        else if (buf[0] == 0x5d) {
            console.log("Detected .jsz/.pxt file.");
            return pxt.lzmaDecompressAsync(buf)
                .then(function (str) { return JSON.parse(str); });
        }
        else
            return Promise.resolve(null);
    })
        .then(function (json) {
        if (!json) {
            console.log("Couldn't extract.");
            return undefined;
        }
        if (json.meta && json.source) {
            json = typeof json.source == "string" ? JSON.parse(json.source) : json.source;
        }
        if (Array.isArray(json.scripts)) {
            console.log("Legacy TD workspace.");
            json.projects = json.scripts.map(function (scr) { return ({
                name: scr.header.name,
                files: oneFile(scr.source, scr.header.editor)
            }); });
            delete json.scripts;
        }
        if (json[pxt.CONFIG_NAME]) {
            console.log("Raw JSON files.");
            var cfg = JSON.parse(json[pxt.CONFIG_NAME]);
            var files = json;
            json = {
                projects: [{
                        name: cfg.name,
                        files: files
                    }]
            };
        }
        var prjs = json.projects;
        if (!prjs) {
            console.log("No projects found.");
            return undefined;
        }
        var dirs = writeProjects(prjs, outDir);
        return dirs;
    });
}
function hexdumpAsync(c) {
    var filename = c.args[0];
    var buf = fs.readFileSync(filename);
    if (/^UF2\n/.test(buf.slice(0, 4).toString("utf8"))) {
        var r = pxtc.UF2.toBin(buf);
        if (r) {
            console.log("UF2 file detected.");
            console.log(pxtc.hex.hexDump(r.buf, r.start));
            return Promise.resolve();
        }
    }
    console.log("Binary file assumed.");
    console.log(pxtc.hex.hexDump(buf));
    return Promise.resolve();
}
exports.hexdumpAsync = hexdumpAsync;
function hex2uf2Async(c) {
    var filename = c.args[0];
    var buf = fs.readFileSync(filename, "utf8").split(/\r?\n/);
    if (buf[0][0] != ':') {
        console.log("Not a hex file: " + filename);
    }
    else {
        var f = pxtc.UF2.newBlockFile();
        pxtc.UF2.writeHex(f, buf);
        var uf2buf = Buffer.from(pxtc.UF2.serializeFile(f), "binary");
        var uf2fn = filename.replace(/(\.hex)?$/i, ".uf2");
        nodeutil.writeFileSync(uf2fn, uf2buf);
        console.log("Wrote: " + uf2fn);
    }
    return Promise.resolve();
}
exports.hex2uf2Async = hex2uf2Async;
function openVsCode(dirname) {
    child_process.exec("code -g main.ts " + dirname); // notice this without a callback..
}
function writeProjects(prjs, outDir) {
    var dirs = [];
    for (var _i = 0, prjs_1 = prjs; _i < prjs_1.length; _i++) {
        var prj = prjs_1[_i];
        var dirname = prj.name.replace(/[^A-Za-z0-9_]/g, "-");
        var fdir = path.join(outDir, dirname);
        nodeutil.mkdirP(fdir);
        for (var _a = 0, _b = Object.keys(prj.files); _a < _b.length; _a++) {
            var fn = _b[_a];
            fn = fn.replace(/[\/]/g, "-");
            var fullname = path.join(fdir, fn);
            nodeutil.mkdirP(path.dirname(fullname));
            nodeutil.writeFileSync(fullname, prj.files[fn]);
        }
        // add default files if not present
        var files = pxt.packageFiles(prj.name);
        pxt.packageFilesFixup(files);
        for (var fn in files) {
            if (prj.files[fn])
                continue;
            var fullname = path.join(fdir, fn);
            nodeutil.mkdirP(path.dirname(fullname));
            var src = files[fn];
            nodeutil.writeFileSync(fullname, src);
        }
        // start installing in the background
        child_process.exec("pxt install", { cwd: dirname });
        dirs.push(dirname);
    }
    return dirs;
}
function cherryPickAsync(parsed) {
    var commit = parsed.args[0];
    var name = parsed.flags["name"] || commit.slice(0, 7);
    var majorVersion = parseInt(pxtVersion().split('.')[0]);
    var gitAsync = function (args) { return nodeutil.spawnAsync({
        cmd: "git",
        args: args
    }); };
    var branches = [];
    for (var i = majorVersion - 1; i >= 0; --i)
        branches.push("v" + i);
    pxt.log("cherry picking " + commit + " into " + branches.join(', '));
    var p = gitAsync(["pull"]);
    branches.forEach(function (branch) {
        var pr = "cp/" + branch + name;
        p = p.then(function () { return gitAsync(["checkout", branch]); })
            .then(function () { return gitAsync(["pull"]); })
            .then(function () { return gitAsync(["checkout", "-b", pr]); })
            .then(function () { return gitAsync(["cherry-pick", commit]); })
            .then(function () { return gitAsync(["push", "--set-upstream", "origin", pr]); });
    });
    return p.catch(function () { return gitAsync(["checkout", "master"]); });
}
function checkDocsAsync(parsed) {
    return internalCheckDocsAsync(true, parsed.flags["re"], !!parsed.flags["fix"], !!parsed.flags["pycheck"]);
}
function internalCheckDocsAsync(compileSnippets, re, fix, pycheck) {
    if (!nodeutil.existsDirSync("docs"))
        return Promise.resolve();
    var docsRoot = nodeutil.targetDir;
    var docsTemplate = server.expandDocFileTemplate("docs.html");
    pxt.log("checking docs");
    var noTOCs = [];
    var todo = [];
    var urls = {};
    var checked = 0;
    var broken = 0;
    var snipCount = 0;
    var snippets = [];
    // scan and fix image links
    if (fix) {
        pxt.log('patching links');
        nodeutil.allFiles("docs")
            .filter(function (f) { return /\.md/.test(f); })
            .forEach(function (f) {
            var md = fs.readFileSync(f, { encoding: "utf8" });
            var newmd = md.replace(/]\((\/static\/[^)]+?)\.(png|jpg)(\s+"[^"]+")?\)/g, function (m, p, ext, comment) {
                var fn = path.join(docsRoot, "docs", p + "." + ext);
                if (fs.existsSync(fn))
                    return m;
                // try finding other file
                var next = ext == "png" ? "jpg" : "png";
                if (!fs.existsSync(path.join(docsRoot, "docs", p + "." + next))) {
                    pxt.log("could not patch " + fn);
                    return m;
                }
                return "](" + p + "." + next + (comment ? " " : "") + (comment || "") + ")";
            });
            if (md != newmd) {
                pxt.log("patching " + f);
                nodeutil.writeFileSync(f, newmd, { encoding: "utf8" });
            }
        });
    }
    function addSnippet(snippet, entryPath, snipIndex) {
        snippets.push(snippet);
        var dir = path.join("temp/snippets", snippet.type);
        var fn = dir + "/" + entryPath.replace(/^\//, '').replace(/\//g, '-').replace(/\.\w+$/, '') + "-" + snipIndex + "." + snippet.ext;
        nodeutil.mkdirP(dir);
        nodeutil.writeFileSync(fn, snippet.code);
        snippet.file = fn;
    }
    function pushUrl(url, toc) {
        // cache value
        if (!urls.hasOwnProperty(url)) {
            var specialPath = /^\/pkg\//.test(url) || /^\/--[a-z]+/.test(url);
            if (specialPath) {
                urls[url] = url;
                return;
            }
            var isResource = /\.[a-z]+$/i.test(url);
            if (!isResource && !toc) {
                pxt.debug("link not in SUMMARY: " + url);
                noTOCs.push(url);
            }
            // TODO: correct resolution of static resources
            urls[url] = isResource
                ? nodeutil.fileExistsSync(path.join(docsRoot, "docs", url))
                : nodeutil.resolveMd(docsRoot, url);
            if (!isResource && urls[url])
                todo.push(url);
        }
    }
    function checkTOCEntry(entry) {
        if (entry.path && !/^https:\/\//.test(entry.path)) {
            pushUrl(entry.path, true);
            if (!urls[entry.path]) {
                pxt.log("SUMMARY: broken link " + entry.path);
                broken++;
            }
        }
        // look for sub items
        if (entry.subitems)
            entry.subitems.forEach(checkTOCEntry);
    }
    // check over TOCs
    nodeutil.allFiles("docs", 5).filter(function (f) { return /SUMMARY\.md$/.test(f); })
        .forEach(function (summaryFile) {
        var summaryPath = path.join(path.dirname(summaryFile), 'SUMMARY').replace(/^docs[\/\\]/, '');
        pxt.log("looking for " + summaryPath);
        var summaryMD = nodeutil.resolveMd(docsRoot, summaryPath);
        var toc = pxt.docs.buildTOC(summaryMD);
        if (!toc) {
            pxt.log("invalid SUMMARY");
            broken++;
        }
        else {
            toc.forEach(checkTOCEntry);
        }
    });
    // push entries from pxtarget
    var theme = pxt.appTarget.appTheme;
    if (theme) {
        if (theme.sideDoc)
            todo.push(theme.sideDoc);
        if (theme.usbDocs)
            todo.push(theme.usbDocs);
    }
    // push galleries for targetconfig
    if (fs.existsSync("targetconfig.json")) {
        var targeConfig_1 = nodeutil.readJson("targetconfig.json");
        if (targeConfig_1.galleries)
            Object.keys(targeConfig_1.galleries).forEach(function (gallery) { return todo.push(targeConfig_1.galleries[gallery]); });
    }
    // push files from targetconfig checkdocsdirs
    var mdRegex = /\.md$/;
    var targetDirs = pxt.appTarget.checkdocsdirs;
    if (targetDirs) {
        targetDirs.forEach(function (dir) {
            pxt.log("looking for markdown files in " + dir);
            nodeutil.allFiles(path.join("docs", dir), 3).filter(function (f) { return mdRegex.test(f); })
                .forEach(function (md) {
                pushUrl(md.slice(5).replace(mdRegex, ""), true);
            });
        });
    }
    var _loop_3 = function () {
        checked++;
        var entrypath = todo.pop();
        pxt.debug("checking " + entrypath);
        var md = urls[entrypath] || nodeutil.resolveMd(docsRoot, entrypath);
        if (!md) {
            pxt.log("unable to resolve " + entrypath);
            broken++;
        }
        // look for broken urls
        md.replace(/]\( (\/[^)]+?)(\s+"[^"]+")?\)/g, function (m) {
            var url = /]\((\/[^)]+?)(\s+"[^"]+")?\)/.exec(m)[1];
            // remove hash
            url = url.replace(/#.*$/, '');
            pushUrl(url, false);
            if (!urls[url]) {
                pxt.log(entrypath + ": broken link " + url);
                broken++;
            }
            return '';
        });
        // look for broken macros
        try {
            var r = pxt.docs.renderMarkdown({
                template: docsTemplate,
                markdown: md,
                theme: pxt.appTarget.appTheme,
                throwOnError: true
            });
        }
        catch (e) {
            pxt.log(entrypath + ": " + e);
            broken++;
        }
        // look for snippets
        getCodeSnippets(entrypath, md).forEach(function (snippet, snipIndex) { return addSnippet(snippet, entrypath, snipIndex); });
    };
    while (todo.length) {
        _loop_3();
    }
    nodeutil.mkdirP("temp");
    nodeutil.writeFileSync("temp/noSUMMARY.md", noTOCs.sort().map(function (p) { return Array(p.split(/[\/\\]/g).length - 1).join('     ') + "* [" + pxt.Util.capitalize(p.split(/[\/\\]/g).reverse()[0].split('-').join(' ')) + "](" + p + ")"; }).join('\n'), { encoding: "utf8" });
    // test targetconfig
    if (nodeutil.fileExistsSync("targetconfig.json")) {
        var targetConfig_2 = nodeutil.readJson("targetconfig.json");
        if (targetConfig_2 && targetConfig_2.galleries) {
            Object.keys(targetConfig_2.galleries).forEach(function (k) {
                pxt.log("gallery " + k);
                var gallerymd = nodeutil.resolveMd(docsRoot, targetConfig_2.galleries[k]);
                var gallery = pxt.gallery.parseGalleryMardown(gallerymd);
                pxt.debug("found " + gallery.length + " galleries");
                gallery.forEach(function (gal) { return gal.cards.forEach(function (card, cardIndex) {
                    pxt.debug("card " + (card.shortName || card.name));
                    switch (card.cardType) {
                        case "tutorial": {
                            var tutorialMd = nodeutil.resolveMd(docsRoot, card.url);
                            var tutorial = pxt.tutorial.parseTutorial(tutorialMd);
                            var pkgs = { "blocksprj": "*" };
                            pxt.Util.jsonMergeFrom(pkgs, pxt.gallery.parsePackagesFromMarkdown(tutorialMd) || {});
                            addSnippet({
                                name: card.name,
                                code: tutorial.code,
                                type: "blocks",
                                ext: "ts",
                                packages: pkgs
                            }, "tutorial" + gal.name, cardIndex);
                            break;
                        }
                        case "example": {
                            var exMd = nodeutil.resolveMd(docsRoot, card.url);
                            var prj = pxt.gallery.parseExampleMarkdown(card.name, exMd);
                            var pkgs = { "blocksprj": "*" };
                            pxt.U.jsonMergeFrom(pkgs, prj.dependencies);
                            addSnippet({
                                name: card.name,
                                code: prj.filesOverride["main.ts"],
                                type: "blocks",
                                ext: "ts",
                                packages: pkgs
                            }, "example" + gal.name, cardIndex);
                            break;
                        }
                    }
                }); });
            });
        }
    }
    pxt.log("checked " + checked + " files: " + broken + " broken links, " + noTOCs.length + " not in SUMMARY, " + snippets.length + " snippets");
    var p = Promise.resolve();
    if (compileSnippets)
        p = p.then(function () { return testSnippetsAsync(snippets, re, pycheck); });
    return p.then(function () {
        if (broken > 0) {
            var msg = broken + " broken links found in the docs";
            if (pxt.appTarget.ignoreDocsErrors)
                pxt.log(msg);
            else
                U.userError(msg);
        }
    });
}
function getSnippets(source) {
    var snippets = [];
    var re = /^`{3}([\S]+)?\s*\n([\s\S]+?)\n`{3}\s*?$/gm;
    var index = 0;
    source.replace(re, function (match, type, code) {
        snippets.push({
            type: type ? type.replace(/-ignore$/i, "") : "pre",
            code: code,
            ignore: type ? /-ignore/g.test(type) : false,
            index: index
        });
        index++;
        return '';
    });
    return snippets;
}
exports.getSnippets = getSnippets;
function getCodeSnippets(fileName, md) {
    var supported = {
        "blocks": "ts",
        "block": "ts",
        "typescript": "ts",
        "sig": "ts",
        "namespaces": "ts",
        "cards": "ts",
        "sim": "ts",
        "ghost": "ts",
        "codecard": "json"
    };
    var snippets = getSnippets(md);
    var codeSnippets = snippets.filter(function (snip) { return !snip.ignore && !!supported[snip.type]; });
    var pkgs = {
        "blocksprj": "*"
    };
    snippets.filter(function (snip) { return snip.type == "package"; })
        .map(function (snip) { return snip.code.split('\n'); })
        .forEach(function (lines) { return lines
        .map(function (l) { return l.replace(/\s*$/, ''); })
        .filter(function (line) { return !!line; })
        .forEach(function (line) {
        var i = line.indexOf('=');
        if (i < 0)
            pkgs[line] = "*";
        else
            pkgs[line.substring(0, i)] = line.substring(i + 1);
    }); });
    var pkgName = fileName.replace(/\\/g, '-').replace(/.md$/i, '');
    return codeSnippets.map(function (snip, i) {
        return {
            name: pkgName + "-" + i,
            code: snip.code,
            type: snip.type,
            ext: supported[snip.type],
            packages: pkgs
        };
    });
}
exports.getCodeSnippets = getCodeSnippets;
function webstringsJson() {
    var missing = {};
    var files = onlyExts(nodeutil.allFiles("docfiles"), [".html"])
        .concat(onlyExts(nodeutil.allFiles("docs"), [".html"]));
    for (var _i = 0, files_2 = files; _i < files_2.length; _i++) {
        var fn = files_2[_i];
        var res = pxt.docs.translate(fs.readFileSync(fn, "utf8"), {});
        U.jsonCopyFrom(missing, res.missing);
    }
    U.iterMap(missing, function (k, v) {
        missing[k] = k;
    });
    missing = U.sortObjectFields(missing);
    return missing;
}
function extractLocStringsAsync(output, dirs) {
    var prereqs = [];
    dirs.forEach(function (dir) { return prereqs = prereqs.concat(nodeutil.allFiles(dir, 20)); });
    var errCnt = 0;
    var translationStrings = {};
    function processLf(filename) {
        if (!/\.(ts|tsx|html)$/.test(filename))
            return;
        if (/\.d\.ts$/.test(filename))
            return;
        pxt.debug("extracting strings from" + filename);
        fs.readFileSync(filename, "utf8").split('\n').forEach(function (line, idx) {
            function err(msg) {
                console.log("%s(%d): %s", filename, idx, msg);
                errCnt++;
            }
            while (true) {
                var newLine = line.replace(/\blf(_va)?\s*\(\s*(.*)/, function (all, a, args) {
                    var m = /^("([^"]|(\\"))+")\s*[\),]/.exec(args);
                    if (m) {
                        try {
                            var str = JSON.parse(m[1]);
                            translationStrings[str] = str;
                        }
                        catch (e) {
                            err("cannot JSON-parse " + m[1]);
                        }
                    }
                    else {
                        if (!/util\.ts$/.test(filename))
                            err("invalid format of lf() argument: " + args);
                    }
                    return "BLAH " + args;
                });
                if (newLine == line)
                    return;
                line = newLine;
            }
        });
    }
    var fileCnt = 0;
    prereqs.forEach(function (pth) {
        fileCnt++;
        processLf(pth);
    });
    var tr = Object.keys(translationStrings);
    tr.sort();
    var strings = {};
    tr.forEach(function (k) { strings[k] = k; });
    nodeutil.mkdirP('built');
    nodeutil.writeFileSync("built/" + output + ".json", JSON.stringify(strings, null, 2));
    pxt.log("log strings: " + fileCnt + " files; " + tr.length + " strings -> " + output + ".json");
    if (errCnt > 0)
        pxt.log(errCnt + " errors");
    return Promise.resolve();
}
function testGithubPackagesAsync(parsed) {
    pxt.log("-- testing github packages-- ");
    pxt.log("make sure to store your github token (GITHUB_ACCESS_TOKEN env var) to avoid throttling");
    if (!fs.existsSync("targetconfig.json")) {
        pxt.log("targetconfig.json not found");
        return Promise.resolve();
    }
    parseBuildInfo(parsed);
    var warnDiv = !!parsed.flags["warndiv"];
    var clean = !!parsed.flags["clean"];
    var targetConfig = nodeutil.readJson("targetconfig.json");
    var packages = targetConfig.packages;
    if (!packages) {
        pxt.log("packages section not found in targetconfig.json");
    }
    var errors = [];
    var todo;
    var repos = {};
    var pkgsroot = path.join("temp", "ghpkgs");
    function detectDivision(code) {
        // remove /* comments
        code = code.replace(/\/\*(.|\s)*?\*\//gi, '');
        // remove // ... comments
        code = code.replace(/\/\/.*?$/gim, '');
        // search for comments
        return /[^\/*]=?\/[^\/*]/.test(code);
    }
    function gitAsync(dir) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return nodeutil.spawnAsync({
            cmd: "git",
            args: args,
            cwd: dir
        });
    }
    function pxtAsync(dir, args) {
        return nodeutil.spawnAsync({
            cmd: "node",
            args: [path.join(process.cwd(), "node_modules", "pxt-core", "pxt-cli", "cli.js")].concat(args),
            cwd: dir
        });
    }
    function nextAsync() {
        var pkgpgh = todo.pop();
        if (!pkgpgh) {
            pxt.log('');
            pxt.log("------------------------");
            pxt.log(errors.length + " packages with errors");
            errors.forEach(function (er) { return pxt.log("- [ ]  " + er); });
            return Promise.resolve();
        }
        pxt.log('');
        pxt.log("  testing " + pkgpgh);
        // clone or sync package
        var buildArgs = ["build", "--ignoreTests"];
        if (warnDiv)
            buildArgs.push("--warndiv");
        if (forceLocalBuild)
            buildArgs.push("--localbuild");
        var pkgdir = path.join(pkgsroot, pkgpgh);
        return (!nodeutil.existsDirSync(pkgdir)
            ? gitAsync(".", "clone", "-q", "-b", repos[pkgpgh].tag, "https://github.com/" + pkgpgh, pkgdir)
            : gitAsync(pkgdir, "fetch").then(function () { return gitAsync(pkgdir, "checkout", "-f", repos[pkgpgh].tag); }))
            .then(function () { return pxtAsync(pkgdir, ["clean"]); })
            .then(function () { return pxtAsync(pkgdir, ["install"]); })
            .then(function () { return pxtAsync(pkgdir, buildArgs); })
            .then(function () {
            if (warnDiv) {
                // perform a regex search over the repo for / operator
                var filesWithDiv_1 = {};
                nodeutil.allFiles(pkgdir, 1)
                    .filter(function (f) { return /\.ts$/i.test(f); })
                    .forEach(function (f) { return detectDivision(fs.readFileSync(f, { encoding: "utf8" }))
                    ? (filesWithDiv_1[f.replace(pkgdir, '').replace(/^[\/\\]/, '')] = true)
                    : false; });
                var fsw = Object.keys(filesWithDiv_1);
                if (fsw.length) {
                    errors.push(pkgpgh + " div found in " + fsw.join(', '));
                    pxt.log(errors[errors.length - 1]);
                }
            }
        })
            .catch(function (e) {
            errors.push(pkgpgh + " " + e);
            pxt.log(e);
            return Promise.resolve();
        })
            .then(function () { return nextAsync(); });
    }
    // 1. collect packages
    return loadGithubTokenAsync()
        .then(function () { return clean ? rimrafAsync(pkgsroot, {}) : Promise.resolve(); })
        .then(function () { return nodeutil.mkdirP(pkgsroot); })
        .then(function () { return pxt.github.searchAsync("", packages); })
        .then(function (ghrepos) { return ghrepos.filter(function (ghrepo) { return ghrepo.status == pxt.github.GitRepoStatus.Approved; })
        .map(function (ghrepo) { return ghrepo.fullName; }).concat(packages.approvedRepos || []); })
        .then(function (fullnames) {
        // remove dups
        fullnames = U.unique(fullnames, function (f) { return f.toLowerCase(); });
        pxt.log("found " + fullnames.length + " approved packages");
        pxt.log(JSON.stringify(fullnames, null, 2));
        return Promise.all(fullnames.map(function (fullname) { return pxt.github.listRefsAsync(fullname)
            .then(function (tags) {
            var tag = pxt.semver.sortLatestTags(tags)[0];
            if (!tag) {
                errors.push(fullname + ": no valid release found");
                pxt.log(errors[errors.length - 1]);
            }
            else
                repos[fullname] = { fullname: fullname, tag: tag };
        }); }));
    }).then(function () {
        todo = Object.keys(repos);
        pxt.log("found " + todo.length + " approved package with releases");
        todo.forEach(function (fn) { return pxt.log("  " + fn + "#" + repos[fn].tag); });
        // 2. process each repo
        return nextAsync();
    });
}
function blockTestsAsync(parsed) {
    var karma = karmaPath();
    if (!karma) {
        console.error("Karma not found, did you run npm install?");
        return Promise.reject(new Error("Karma not found"));
    }
    var extraArgs = [];
    if (parsed && parsed.flags["debug"]) {
        extraArgs.push("--no-single-run");
    }
    return writeBlockTestJSONAsync()
        .then(function () { return nodeutil.spawnAsync({
        cmd: karma,
        envOverrides: {
            "KARMA_TARGET_DIRECTORY": process.cwd()
        },
        args: ["start", path.resolve("node_modules/pxt-core/tests/blocks-test/karma.conf.js")].concat(extraArgs)
    }); }, function (e) { return console.log("Skipping blocks tests: " + e.message); });
    function getBlocksFilesAsync(libsDirectory) {
        return readDirAsync(libsDirectory)
            .then(function (dirs) { return Promise.map(dirs, function (dir) {
            var dirPath = path.resolve(libsDirectory, dir, "blocks-test");
            var configPath = path.resolve(libsDirectory, dir, "pxt.json");
            var packageName;
            var testFiles = [];
            if (fs.existsSync(path.resolve(configPath)) && nodeutil.existsDirSync(dirPath)) {
                return readFileAsync(configPath, "utf8")
                    .then(function (configText) {
                    packageName = JSON.parse(configText).name;
                    return readDirAsync(dirPath)
                        .then(function (files) { return Promise.map(files.filter(function (f) { return U.endsWith(f, ".blocks") && f != "main.blocks"; }), function (fn) {
                        return readFileAsync(path.join(dirPath, fn), "utf8")
                            .then(function (contents) { return testFiles.push({ testName: fn, contents: contents }); });
                    }); });
                })
                    .then(function () { return { packageName: packageName, testFiles: testFiles }; });
            }
            return Promise.resolve(undefined);
        }); })
            .then(function (allCases) { return allCases.filter(function (f) { return !!f && f.testFiles.length && f.packageName; }); });
    }
    function writeBlockTestJSONAsync() {
        var libsTests;
        var commonTests;
        return getBlocksFilesAsync(path.resolve("libs"))
            .then(function (files) {
            libsTests = files;
            var commonLibs = path.resolve("node_modules/pxt-common-packages/libs");
            if (nodeutil.existsDirSync(commonLibs))
                return getBlocksFilesAsync(commonLibs);
            else {
                return Promise.resolve([]);
            }
        })
            .then(function (files) {
            commonTests = files;
            if (!commonTests.length && !libsTests.length)
                return Promise.reject(new Error("No test cases found"));
            return writeFileAsync(path.resolve("built/block-tests.js"), "var testJSON = " + JSON.stringify({
                libsTests: libsTests, commonTests: commonTests
            }), "utf8");
        });
    }
    function karmaPath() {
        var karmaCommand = os.platform() === "win32" ? "karma.cmd" : "karma";
        var localModule = path.resolve("node_modules", ".bin", karmaCommand);
        var coreModule = path.resolve("node_modules", "pxt-core", "node_modules", ".bin", karmaCommand);
        if (fs.existsSync(localModule)) {
            return localModule;
        }
        else if (fs.existsSync(coreModule)) {
            return coreModule;
        }
        return undefined;
    }
}
function initCommands() {
    // Top level commands
    simpleCmd("help", "display this message or info about a command", function (pc) {
        p.printHelp(pc.args, console.log);
        console.log("\nThe following environment variables modify the behavior of the CLI when set to\nnon-empty string:\n\nPXT_DEBUG        - display extensive logging info\nPXT_USE_HID      - use webusb or hid to flash device\n\nThese apply to the C++ runtime builds:\n\nPXT_FORCE_LOCAL  - compile C++ on the local machine, not the cloud service\nPXT_NODOCKER     - don't use Docker image, and instead use host's\n                   arm-none-eabi-gcc (doesn't apply to Linux targets)\nPXT_RUNTIME_DEV  - always rebuild the C++ runtime, allowing for modification\n                   in the lower level runtime if any\nPXT_ASMDEBUG     - embed additional information in generated binary.asm file\nPXT_ACCESS_TOKEN - pxt access token\nGITHUB_ACCESS_TOKEN - github access token\n" + pxt.crowdin.KEY_VARIABLE + " - crowdin key\n");
        return Promise.resolve();
    }, "[all|command]");
    p.defineCommand({
        name: "deploy",
        help: "build and deploy current package",
        flags: {
            "console": { description: "start console monitor after deployment", aliases: ["serial"] },
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            force: {
                description: "skip cache lookup and force build",
                aliases: ["f"]
            },
            hwvariant: {
                description: "specify Hardware variant used for this compilation",
                argument: "hwvariant",
                type: "string",
                aliases: ["hw"]
            },
            install: {
                description: "install any missing package before build",
                aliases: ["i"]
            }
        },
        onlineHelp: true
    }, deployAsync);
    simpleCmd("run", "build and run current package in the simulator", runAsync);
    simpleCmd("console", "monitor console messages", consoleAsync, null, true);
    simpleCmd("update", "update pxt-core reference and install updated version", updateAsync, undefined, true);
    simpleCmd("add", "add a feature (.asm, C++ etc) to package", addAsync, "<arguments>");
    p.defineCommand({
        name: "install",
        help: "install dependencies",
        argString: "[package]",
        aliases: ["i"],
        onlineHelp: true,
        flags: {
            hwvariant: {
                description: "specify hardware variant",
                argument: "hwvariant",
                type: "string",
                aliases: ["hw"]
            }
        }
    }, installAsync);
    p.defineCommand({
        name: "bump",
        help: "bump target or package version",
        onlineHelp: true,
        flags: {
            update: { description: "(package only) Updates pxt-core reference to the latest release" },
            upload: { description: "(package only) Upload after bumping" }
        }
    }, bumpAsync);
    p.defineCommand({
        name: "tag",
        help: "tags a release",
        argString: "<tag> <version>",
        flags: {
            npm: { description: "updates tags on npm packages as well" }
        }
    }, tagReleaseAsync);
    p.defineCommand({
        name: "build",
        help: "builds current package",
        onlineHelp: true,
        flags: {
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            force: {
                description: "skip cache lookup and force build",
                aliases: ["f"]
            },
            hwvariant: {
                description: "specify Hardware variant used for this compilation",
                argument: "hwvariant",
                type: "string",
                aliases: ["hw"]
            },
            debug: { description: "Emit debug information with build" },
            deploy: { description: "Deploy to device if connected" },
            warndiv: { description: "Warns about division operators" },
            ignoreTests: { description: "Ignores tests in compilation", aliases: ["ignore-tests", "ignoretests", "it"] },
            clean: { description: "Clean before build" },
            install: {
                description: "install any missing package before build",
                aliases: ["i"]
            }
        }
    }, buildAsync);
    simpleCmd("clean", "removes built folders", cleanAsync);
    advancedCommand("cleangen", "remove generated files", cleanGenAsync);
    simpleCmd("npminstallnative", "install native dependencies", npmInstallNativeAsync);
    p.defineCommand({
        name: "staticpkg",
        help: "packages the target into static HTML pages",
        onlineHelp: true,
        flags: {
            route: {
                description: "route appended to generated files",
                argument: "route",
                type: "string",
                aliases: ["r"]
            },
            githubpages: {
                description: "Generate a web site compatible with GitHub pages",
                aliases: ["ghpages", "gh"]
            },
            output: {
                description: "Specifies the output folder for the generated files",
                argument: "output",
                aliases: ["o"]
            },
            minify: {
                description: "minify all generated js files",
                aliases: ["m", "uglify"]
            },
            bump: {
                description: "bump version number prior to package"
            },
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            locs: {
                description: "Download localization files and bundle them",
                aliases: ["locales", "crowdin"]
            },
            "no-appcache": {
                description: "Disables application cache"
            }
        }
    }, staticpkgAsync);
    p.defineCommand({
        name: "extract",
        help: "extract sources from .hex file, folder of .hex files, stdin (-), or URL",
        argString: "<path>",
        flags: {
            code: { description: "generate vscode project files" },
            out: {
                description: "directory to extract the project into",
                argument: "DIRNAME"
            }
        }
    }, extractAsync);
    p.defineCommand({
        name: "serve",
        help: "start web server for your local target",
        flags: {
            browser: {
                description: "set the browser to launch on web server start",
                argument: "name",
                possibleValues: ["chrome", "ie", "firefox", "safari"]
            },
            noBrowser: {
                description: "start the server without launching a browser",
                aliases: ["no-browser"]
            },
            noSerial: {
                description: "do not monitor serial devices",
                aliases: ["no-serial", "nos"]
            },
            sourceMaps: {
                description: "include source maps when building ts files",
                aliases: ["include-source-maps"]
            },
            pkg: { description: "serve packaged" },
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            just: { description: "just serve without building" },
            rebundle: { description: "rebundle when change is detected", aliases: ["rb"] },
            hostname: {
                description: "hostname to run serve, default localhost",
                aliases: ["h"],
                type: "string",
                argument: "hostname"
            },
            port: {
                description: "port to bind server, default 3232",
                aliases: ["p"],
                type: "number",
                argument: "port"
            },
            wsport: {
                description: "port to bind websocket server, default 3233",
                aliases: ["w"],
                type: "number",
                argument: "wsport"
            }
        }
    }, serveAsync);
    p.defineCommand({
        name: "buildjres",
        aliases: ["jres"],
        help: "embeds resources into jres files"
    }, buildJResAsync);
    p.defineCommand({
        name: "buildsprites",
        help: "collects sprites into a .jres file",
        argString: "<directory>",
    }, buildJResSpritesAsync);
    p.defineCommand({
        name: "init",
        help: "start new package (library) in current directory",
        flags: {
            useDefaults: { description: "Do not prompt for package information" },
        }
    }, initAsync);
    // Hidden commands
    advancedCommand("test", "run tests on current package", testAsync);
    advancedCommand("testassembler", "test the assemblers", testAssemblers);
    advancedCommand("testdir", "compile files in directory one by one", testDirAsync, "<dir>");
    advancedCommand("testpkgconflicts", "tests package conflict detection logic", testPkgConflictsAsync);
    advancedCommand("testdbg", "tests hardware debugger", dbgTestAsync);
    p.defineCommand({
        name: "buildtarget",
        aliases: ["buildtrg", "bt", "build-target", "buildtrg"],
        advanced: true,
        help: "Builds the current target",
        flags: {
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            force: {
                description: "skip cache lookup and force build",
                aliases: ["f"]
            },
            skipCore: {
                description: "skip native build of core packages",
                aliases: ["skip-core", "skipcore", "sc"]
            },
            clean: {
                description: "clean build before building"
            }
        }
    }, buildTargetAsync);
    p.defineCommand({
        name: "uploadtarget",
        aliases: ["uploadtrg", "ut", "upload-target", "upload-trg"],
        help: "Upload target release",
        argString: "<label>",
        advanced: true,
        flags: {
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            force: {
                description: "skip cache lookup and force build",
                aliases: ["f"]
            },
            rebundle: {
                description: "skip build and just rebundle",
            }
        }
    }, uploadTargetReleaseAsync);
    p.defineCommand({
        name: "uploadrefs",
        aliases: [],
        help: "Upload refs directly to the cloud",
        argString: "<repo>",
        advanced: true,
    }, function (pc) { return uploadTargetRefsAsync(pc.args[0]); });
    advancedCommand("uploadtt", "upload tagged release", uploadTaggedTargetAsync, "");
    advancedCommand("downloadtrgtranslations", "download translations from bundled projects", downloadTargetTranslationsAsync, "<package>");
    p.defineCommand({
        name: "checkdocs",
        onlineHelp: true,
        help: "check docs for broken links, typing errors, etc...",
        flags: {
            snippets: { description: "(obsolete) compile snippets", deprecated: true },
            re: {
                description: "regular expression that matches the snippets to test",
                argument: "regex"
            },
            fix: {
                description: "Fix links if possible"
            },
            pycheck: {
                description: "Check code snippets by round-tripping to .py and comparing the "
                    + "original and result .ts. This will generate lots of false positives but can "
                    + "still be useful for searching for semantic issues."
            }
        }
    }, checkDocsAsync);
    advancedCommand("api", "do authenticated API call", function (pc) { return apiAsync(pc.args[0], pc.args[1]); }, "<path> [data]");
    advancedCommand("pokecloud", "same as 'api pokecloud {}'", function () { return apiAsync("pokecloud", "{}"); });
    advancedCommand("travis", "upload release and npm package", travisAsync);
    advancedCommand("uploadfile", "upload file under <CDN>/files/PATH", uploadFileAsync, "<path>");
    advancedCommand("service", "simulate a query to web worker", serviceAsync, "<operation>");
    advancedCommand("time", "measure performance of the compiler on the current package", timeAsync);
    p.defineCommand({
        name: "buildcss",
        help: "build required css files",
        flags: {
            force: {
                description: "force re-compile of less files"
            }
        }
    }, buildSemanticUIAsync);
    advancedCommand("augmentdocs", "test markdown docs replacements", augmnetDocsAsync, "<temlate.md> <doc.md>");
    advancedCommand("crowdin", "upload, download, clean, stats files to/from crowdin", function (pc) { return execCrowdinAsync.apply(undefined, pc.args); }, "<cmd> <path> [output]");
    advancedCommand("hidlist", "list HID devices", hid.listAsync);
    advancedCommand("hidserial", "run HID serial forwarding", hid.serialAsync, undefined, true);
    advancedCommand("hiddmesg", "fetch DMESG buffer over HID and print it", hid.dmesgAsync, undefined, true);
    advancedCommand("hexdump", "dump UF2 or BIN file", hexdumpAsync, "<filename>");
    advancedCommand("hex2uf2", "convert .hex file to UF2", hex2uf2Async, "<filename>");
    p.defineCommand({
        name: "pyconv",
        help: "convert from python",
        argString: "<package-directory> <support-directory>...",
        advanced: true,
        flags: {
            internal: {
                description: "use internal Python parser",
                aliases: ["i"]
            }
        }
    }, function (c) { return pyconv.convertAsync(c.args, !!c.flags["internal"]); });
    advancedCommand("thirdpartynotices", "refresh third party notices", thirdPartyNoticesAsync);
    p.defineCommand({
        name: "cherrypick",
        aliases: ["cp"],
        help: "recursively cherrypicks and push branches",
        argString: "<commit>",
        advanced: true,
        flags: {
            "name": {
                description: "name of the branch",
                type: "string",
                argument: "name"
            }
        }
    }, cherryPickAsync);
    p.defineCommand({
        name: "decompile",
        help: "decompile typescript files",
        argString: "<file1.ts> <file2.ts> ...",
        advanced: true,
        flags: {
            dep: { description: "include specified path as a dependency to the project", type: "string", argument: "path" }
        }
    }, decompileAsync);
    p.defineCommand({
        name: "gdb",
        help: "attempt to start openocd and GDB",
        argString: "[GDB_ARGUMNETS...]",
        anyArgs: true,
        advanced: true,
        onlineHelp: true
    }, gdbAsync);
    p.defineCommand({
        name: "hw",
        help: "apply hardware operation (via BMP)",
        argString: "reset|boot",
        anyArgs: true,
        advanced: true,
    }, hwAsync);
    p.defineCommand({
        name: "dmesg",
        help: "attempt to dump DMESG log using openocd",
        argString: "",
        aliases: ["dumplog"],
        advanced: true,
    }, dumplogAsync);
    p.defineCommand({
        name: "heap",
        help: "attempt to dump GC and codal heap log using openocd",
        argString: "",
        aliases: ["dumpheap"],
        advanced: true,
    }, dumpheapAsync);
    p.defineCommand({
        name: "builddaldts",
        help: "build dal.d.ts in current directory or target (might be generated in a separate folder)",
        advanced: true,
        aliases: ["daldts"],
        flags: {
            clean: { description: "clean and build" }
        }
    }, buildDalDTSAsync);
    p.defineCommand({
        name: "rebundle",
        help: "update packages embedded in target.json (quick version of 'pxt bt')",
        advanced: true
    }, rebundleAsync);
    p.defineCommand({
        name: "pokerepo",
        help: "refresh repo, or generate a URL to do so",
        argString: "<repo>",
        flags: {
            u: { description: "" }
        },
        advanced: true
    }, pokeRepoAsync);
    p.defineCommand({
        name: "uploadtrgtranslations",
        help: "upload translations for target",
        flags: {
            docs: { description: "upload markdown docs folder as well" }
        },
        advanced: true
    }, uploadTargetTranslationsAsync);
    p.defineCommand({
        name: "format",
        help: " pretty-print TS files",
        argString: "<file1.ts> <file2.ts> ...",
        flags: {
            i: { description: "format files in-place" },
            t: { description: "test formatting" }
        },
        advanced: true
    }, formatAsync);
    p.defineCommand({
        name: "gendocs",
        help: "build current package and its docs",
        flags: {
            docs: { description: "produce docs files", aliases: ["doc"] },
            locs: { description: "produce localization files", aliases: ["loc"] },
            files: { description: "file name filter (regex)", type: "string", argument: "files" },
            create: { description: "only write new files" }
        },
        advanced: true
    }, gendocsAsync);
    p.defineCommand({
        name: "testghpkgs",
        help: "Download and build approved github packages",
        flags: {
            warndiv: { description: "Warns about division operators" },
            cloudbuild: {
                description: "(deprecated) forces build to happen in the cloud",
                aliases: ["cloud", "cloud-build", "cb"]
            },
            localbuild: {
                description: "Build native image using local toolchains",
                aliases: ["local", "l", "local-build", "lb"]
            },
            clean: { description: "delete all previous repos" }
        }
    }, testGithubPackagesAsync);
    p.defineCommand({
        name: "testblocks",
        help: "Test blocks files in target and common libs in a browser. See https://makecode.com/develop/blockstests",
        advanced: true,
        flags: {
            debug: { description: "Keeps the browser open to debug tests" }
        }
    }, blockTestsAsync);
    p.defineCommand({
        name: "exportcpp",
        help: "Export all generated C++ files to given directory",
        advanced: true,
        argString: "<target-directory>"
    }, exportCppAsync);
    function simpleCmd(name, help, callback, argString, onlineHelp) {
        p.defineCommand({ name: name, help: help, onlineHelp: onlineHelp, argString: argString }, callback);
    }
    function advancedCommand(name, help, callback, argString, onlineHelp) {
        if (onlineHelp === void 0) { onlineHelp = false; }
        p.defineCommand({ name: name, help: help, onlineHelp: onlineHelp, argString: argString, advanced: true }, callback);
    }
}
function handleCommandAsync(args, preApply) {
    if (preApply === void 0) { preApply = function () { return Promise.resolve(); }; }
    return preApply().then(function () { return p.parseCommand(args); });
}
function goToPkgDir() {
    var goUp = function (s) {
        if (fs.existsSync(s + "/" + pxt.CONFIG_NAME)) {
            return s;
        }
        var s2 = path.resolve(path.join(s, ".."));
        if (s != s2) {
            return goUp(s2);
        }
        return null;
    };
    var dir = goUp(process.cwd());
    if (!dir) {
        console.error("Cannot find " + pxt.CONFIG_NAME + " in any of the parent directories.");
        console.error("Are you in a package directory?");
        process.exit(1);
    }
    else {
        if (dir != process.cwd()) {
            console.log("Going up to " + dir + " which has " + pxt.CONFIG_NAME);
            process.chdir(dir);
        }
    }
}
function ensurePkgDir() {
    goToPkgDir();
}
function loadPkgAsync() {
    ensurePkgDir();
    return mainPkg.loadAsync();
}
function errorHandler(reason) {
    if (reason.isUserError) {
        if (pxt.options.debug)
            console.error(reason.stack);
        console.error("error:", reason.message);
        process.exit(1);
    }
    if (!Cloud.accessToken && reason.statusCode == 403) {
        console.error("Got HTTP 403. Did you forget to 'pxt login' ?");
        process.exit(1);
    }
    var msg = reason.stack || reason.message || (reason + "");
    console.error("INTERNAL ERROR:", msg);
    process.exit(20);
}
var cachedSimDir = "";
function simDir() {
    var dirSim = "sim";
    var npmSim = "node_modules/pxt-" + pxt.appTarget.id + "-sim";
    if (!cachedSimDir) {
        if (nodeutil.existsDirSync(dirSim) && fs.existsSync(path.join(dirSim, "tsconfig.json"))) {
            cachedSimDir = dirSim;
        }
        else if (fs.existsSync(npmSim) && fs.existsSync(path.join(npmSim, "tsconfig.json"))) {
            cachedSimDir = npmSim;
        }
    }
    return cachedSimDir;
}
// called from pxt npm package
function mainCli(targetDir, args) {
    if (args === void 0) { args = process.argv.slice(2); }
    process.on("unhandledRejection", errorHandler);
    process.on('uncaughtException', errorHandler);
    if (!targetDir) {
        console.error("Please upgrade your pxt CLI module.");
        console.error("   npm update -g pxt");
        process.exit(30);
        return Promise.resolve();
    }
    nodeutil.setTargetDir(targetDir);
    var trg = nodeutil.getPxtTarget();
    pxt.setAppTarget(trg);
    pxt.setCompileSwitches(process.env["PXT_COMPILE_SWITCHES"]);
    var compileId = "none";
    if (trg.compileService) {
        compileId = trg.compileService.buildEngine || "yotta";
    }
    var versions = pxt.appTarget.versions || { target: "", pxt: "" };
    pxt.log("Using target " + trg.id + " with build engine " + compileId);
    pxt.log("  target: v" + versions.target + " " + nodeutil.targetDir);
    pxt.log("  pxt-core: v" + versions.pxt + " " + nodeutil.pxtCoreDir);
    pxt.HF2.enableLog();
    if (compileId != "none") {
        build.setThisBuild(build.buildEngines[compileId]);
        if (!build.thisBuild)
            U.userError("cannot find build engine: " + compileId);
    }
    if (process.env["PXT_DEBUG"]) {
        pxt.options.debug = true;
        pxt.debug = pxt.log;
    }
    if (process.env["PXT_ASMDEBUG"]) {
        ts.pxtc.assembler.debug = true;
    }
    commonfiles = readJson(__dirname + "/pxt-common.json");
    return initConfigAsync()
        .then(function () {
        if (args[0] != "buildtarget") {
            initTargetCommands();
        }
        if (!pxt.commands.deployFallbackAsync && build.thisBuild.deployAsync)
            pxt.commands.deployFallbackAsync = build.thisBuild.deployAsync;
        if (!args[0]) {
            if (pxt.commands.deployFallbackAsync) {
                pxt.log("running 'pxt deploy' (run 'pxt help' for usage)");
                args = ["deploy"];
            }
            else {
                pxt.log("running 'pxt build' (run 'pxt help' for usage)");
                args = ["build"];
            }
        }
        return p.parseCommand(args)
            .then(function () {
            if (readlineCount)
                process.stdin.unref();
            return nodeutil.runCliFinalizersAsync();
        });
    });
}
exports.mainCli = mainCli;
function initGlobals() {
    var g = global;
    g.pxt = pxt;
    g.ts = ts;
    g.pxtc = pxtc;
}
initGlobals();
initCommands();
if (require.main === module) {
    var targetdir = process.cwd();
    while (true) {
        if (fs.existsSync(targetdir + "/pxtarget.json"))
            break;
        var newone = path.resolve(targetdir + "/..");
        if (newone == targetdir) {
            targetdir = path.resolve(path.join(__dirname, "../../.."));
            break;
        }
        else {
            targetdir = newone;
        }
    }
    if (!fs.existsSync(targetdir + "/pxtarget.json")) {
        targetdir = path.resolve(path.join(__dirname, ".."));
        if (!fs.existsSync(targetdir + "/pxtarget.json")) {
            console.error("Cannot find pxtarget.json");
            process.exit(1);
        }
    }
    mainCli(targetdir).done();
}
