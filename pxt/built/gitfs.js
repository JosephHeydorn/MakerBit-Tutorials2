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
var child_process = require("child_process");
var U = pxt.Util;
/*
Purpose:
    UploadRefs uploads git objects (commits, trees, blobs) to cloud storage for
    retrieval when serving our web apps or docs. The cloud also has logic to
    request (from github) git objects and store them in the cloud however the
    server can run out of memory (which should be fixable) when we're uploading lots of objects
    so this CLI command is useful when uploading large amounts of git objects.

TODOs (updated 8/14/2019 by Daryl & Michal)
- Upload tree & file objects first: currently this code uploads
  all commits first and then the associated "tree" and blob objects.
  The issue with this is that the cloud checks for the exists of a
  commit object and assumes if it exists that all the associated tree
  objects have already been uploaded. So if "uploadRefs" gets interrupted,
  the git cache could be in an inconsitent state where commits are uploaded
  but not all of the necessary data is present. To fix the broken state, we
  simply need to let uploadRefs run to completion, but it'd be better to not
  allow this inconsitency in the first place by uploading commits last.
- Handle network interruptions: when running "pxt uploadrefs", we occassionally
  get "INTERNAL ERROR: Error: socket hang up" errors which can leave things in a
  bad state (see above.) We should have retry logic built in.
- Add commandline switches for:
    - Traverse parent commits. By default uploadRefs will not follow the parents of a
      commit, but there may be times where this is useful (it could save the server extra
      work).
    - Start from a specific commit. If uploadRefs gets interrupted it would save a lot
      of time if we could pass a certain commit to resume from.
*/
function uploadRefs(id, repoUrl) {
    return __awaiter(this, void 0, void 0, function () {
        function processCommit(id, uploadParents) {
            if (uploadParents === void 0) { uploadParents = false; }
            return __awaiter(this, void 0, void 0, function () {
                var obj, _i, _a, parent_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (visited[id])
                                return [2 /*return*/];
                            visited[id] = true;
                            return [4 /*yield*/, uploadMissingObjects(id)];
                        case 1:
                            _b.sent();
                            return [4 /*yield*/, getGitObjectAsync(id)];
                        case 2:
                            obj = _b.sent();
                            if (obj.type != "commit")
                                throw new Error("bad type");
                            if (!(uploadParents && obj.commit.parents)) return [3 /*break*/, 6];
                            _i = 0, _a = obj.commit.parents;
                            _b.label = 3;
                        case 3:
                            if (!(_i < _a.length)) return [3 /*break*/, 6];
                            parent_1 = _a[_i];
                            return [4 /*yield*/, processCommit(parent_1)];
                        case 4:
                            _b.sent();
                            _b.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 3];
                        case 6: 
                        // Process every tree
                        return [4 /*yield*/, processTreeEntry('000', obj.commit.tree)];
                        case 7:
                            // Process every tree
                            _b.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function processTree(entries) {
            return __awaiter(this, void 0, void 0, function () {
                var _i, entries_1, entry;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _i = 0, entries_1 = entries;
                            _a.label = 1;
                        case 1:
                            if (!(_i < entries_1.length)) return [3 /*break*/, 4];
                            entry = entries_1[_i];
                            //console.log(entry.name, entry.sha);
                            return [4 /*yield*/, processTreeEntry(entry.mode, entry.sha)];
                        case 2:
                            //console.log(entry.name, entry.sha);
                            _a.sent();
                            _a.label = 3;
                        case 3:
                            _i++;
                            return [3 /*break*/, 1];
                        case 4: return [2 /*return*/];
                    }
                });
            });
        }
        function processTreeEntry(mode, id) {
            return __awaiter(this, void 0, void 0, function () {
                var obj;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (visited[id])
                                return [2 /*return*/];
                            visited[id] = true;
                            return [4 /*yield*/, uploadMissingObjects(id)];
                        case 1:
                            _a.sent();
                            if (!(mode.indexOf('1') != 0)) return [3 /*break*/, 5];
                            return [4 /*yield*/, getGitObjectAsync(id)];
                        case 2:
                            obj = _a.sent();
                            if (!(obj.type == 'tree')) return [3 /*break*/, 4];
                            //console.log('tree:' + obj.id);
                            return [4 /*yield*/, processTree(obj.tree)];
                        case 3:
                            //console.log('tree:' + obj.id);
                            _a.sent();
                            return [3 /*break*/, 5];
                        case 4: throw new Error("bad entry type: " + obj.type);
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        function maybeGcGitCatFile() {
            if (!gitCatFile)
                return;
            var d = Date.now() - lastUsage;
            if (d < 3000)
                return;
            //console.log("[gc] git cat-file")
            gitCatFile.stdin.end();
            gitCatFile = null;
            gitCatFileBuf.drain();
        }
        function startGitCatFile() {
            if (!lastUsage) {
                setInterval(maybeGcGitCatFile, 1000);
            }
            lastUsage = Date.now();
            if (!gitCatFile) {
                //console.log("[run] git cat-file --batch")
                gitCatFile = child_process.spawn("git", ["cat-file", "--batch"], {
                    cwd: repoPath,
                    env: process.env,
                    stdio: "pipe",
                    shell: false
                });
                gitCatFile.stderr.setEncoding("utf8");
                gitCatFile.stderr.on('data', function (msg) {
                    console.error("[git cat-file error] " + msg);
                });
                gitCatFile.stdout.on('data', function (buf) { return gitCatFileBuf.push(buf); });
            }
        }
        function killGitCatFile() {
            gitCatFile.kill();
        }
        function uploadMissingObjects(id, force) {
            return __awaiter(this, void 0, void 0, function () {
                var hashes, response, missingHashes, _i, missingHashes_1, missing, obj;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (id)
                                toCheck.push(id);
                            if (!(toCheck.length > 50 || force)) return [3 /*break*/, 6];
                            hashes = toCheck;
                            toCheck = [];
                            // Check with cloud
                            console.log("checking hashes with cloud");
                            return [4 /*yield*/, pxt.Cloud.privateRequestAsync({
                                    url: 'upload/status',
                                    data: {
                                        hashes: hashes
                                    }
                                })];
                        case 1:
                            response = _a.sent();
                            missingHashes = response.json.missing;
                            _i = 0, missingHashes_1 = missingHashes;
                            _a.label = 2;
                        case 2:
                            if (!(_i < missingHashes_1.length)) return [3 /*break*/, 6];
                            missing = missingHashes_1[_i];
                            return [4 /*yield*/, getGitObjectAsync(missing)];
                        case 3:
                            obj = _a.sent();
                            // Upload data to cloud
                            console.log("uploading raw " + missing + " with type " + obj.type + " to cloud");
                            return [4 /*yield*/, pxt.Cloud.privateRequestAsync({
                                    url: "upload/raw",
                                    data: {
                                        type: obj.type,
                                        content: obj.data.toString('base64'),
                                        encoding: 'base64',
                                        hash: missing
                                    }
                                })];
                        case 4:
                            _a.sent();
                            _a.label = 5;
                        case 5:
                            _i++;
                            return [3 /*break*/, 2];
                        case 6: return [2 /*return*/];
                    }
                });
            });
        }
        function refreshRefs(id, repoUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            console.log("Updating refs");
                            data = {
                                HEAD: id,
                                repoUrl: repoUrl
                            };
                            return [4 /*yield*/, pxt.Cloud.privateRequestAsync({
                                    url: "upload/rawrefs",
                                    data: data
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        }
        function getGitObjectAsync(id) {
            if (!id || /[\r\n]/.test(id))
                throw new Error("bad id: " + id);
            var cached = gitCache.get(id);
            if (cached)
                return Promise.resolve(cached);
            return apiLockAsync.enqueue("cat-file", function () {
                // check again, maybe the object has been cached while we were waiting
                cached = gitCache.get(id);
                if (cached)
                    return Promise.resolve(cached);
                //console.log("cat: " + id)
                startGitCatFile();
                gitCatFile.stdin.write(id + "\n");
                var sizeLeft = 0;
                var bufs = [];
                var res = {
                    id: id,
                    type: "",
                    memsize: 64,
                    data: null
                };
                var typeBuf = null;
                var loop = function () {
                    return gitCatFileBuf.shiftAsync()
                        .then(function (buf) {
                        startGitCatFile(); // make sure the usage counter is updated
                        if (!res.type) {
                            //console.log(`cat-file ${id} -> ${buf.length} bytes; ${buf[0]} ${buf[1]}`)
                            if (typeBuf) {
                                buf = Buffer.concat([typeBuf, buf]);
                                typeBuf = null;
                            }
                            else {
                                while (buf[0] == 10)
                                    buf = buf.slice(1);
                            }
                            var end = buf.indexOf(10);
                            //console.log(`len-${buf.length} pos=${end}`)
                            if (end < 0) {
                                if (buf.length == 0) {
                                    // skip it
                                }
                                else {
                                    typeBuf = buf;
                                }
                                //console.info(`retrying read; sz=${buf.length}`)
                                return loop();
                            }
                            var line = buf;
                            if (end >= 0) {
                                line = buf.slice(0, end);
                                buf = buf.slice(end + 1);
                            }
                            else {
                                throw new Error("bad cat-file respose: " + buf.toString("utf8").slice(0, 100));
                            }
                            var lineS = line.toString("utf8");
                            if (/ missing/.test(lineS)) {
                                throw new Error("file missing");
                            }
                            var m = /^([0-9a-f]{40}) (\S+) (\d+)/.exec(lineS);
                            if (!m)
                                throw new Error("invalid cat-file response: "
                                    + lineS + " <nl> " + buf.toString("utf8"));
                            res.id = m[1];
                            res.type = m[2];
                            sizeLeft = parseInt(m[3]);
                            res.memsize += sizeLeft; // approximate
                        }
                        if (buf.length > sizeLeft) {
                            buf = buf.slice(0, sizeLeft);
                        }
                        bufs.push(buf);
                        sizeLeft -= buf.length;
                        if (sizeLeft <= 0) {
                            res.data = Buffer.concat(bufs);
                            return res;
                        }
                        else {
                            return loop();
                        }
                    });
                };
                return loop().then(function (obj) {
                    //console.log(`[cat-file] ${id} -> ${obj.id} ${obj.type} ${obj.data.length}`)
                    if (obj.type == "tree") {
                        obj.tree = parseTree(obj.data);
                    }
                    else if (obj.type == "commit") {
                        obj.commit = parseCommit(obj.data);
                    }
                    // check if this is an object in a specific revision, not say on 'master'
                    // and if it's small enough to warant caching
                    if (/^[0-9a-f]{40}/.test(id)) {
                        gitCache.set(id, obj, obj.memsize);
                    }
                    return obj;
                });
            });
        }
        var gitCatFile, gitCatFileBuf, apiLockAsync, gitCache, lastUsage, repoPath, visited, toCheck;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    pxt.log("uploading refs starting from " + id + " in " + repoUrl + " to " + pxt.Cloud.apiRoot);
                    gitCatFileBuf = new U.PromiseBuffer();
                    apiLockAsync = new U.PromiseQueue();
                    gitCache = new Cache();
                    lastUsage = 0;
                    repoPath = '';
                    startGitCatFile();
                    visited = {};
                    toCheck = [];
                    return [4 /*yield*/, processCommit(id)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, uploadMissingObjects(undefined, true)];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, refreshRefs(id, repoUrl)];
                case 3:
                    _a.sent();
                    killGitCatFile();
                    process.exit(0);
                    return [2 /*return*/];
            }
        });
    });
}
exports.uploadRefs = uploadRefs;
var maxCacheSize = 32 * 1024 * 1024;
var maxCacheEltSize = 256 * 1024;
var Cache = /** @class */ (function () {
    function Cache() {
        this.cache = {};
        this.size = 0;
    }
    Cache.prototype.get = function (key) {
        if (!key)
            return null;
        if (this.cache.hasOwnProperty(key))
            return this.cache[key];
        return null;
    };
    Cache.prototype.set = function (key, v, sz) {
        if (!key)
            return;
        delete this.cache[key];
        if (!v || sz > maxCacheEltSize)
            return;
        if (this.size + sz > maxCacheSize) {
            this.flush();
        }
        this.size += sz;
        this.cache[key] = v;
    };
    Cache.prototype.flush = function () {
        this.size = 0;
        this.cache = {};
    };
    return Cache;
}());
exports.Cache = Cache;
function splitName(fullname) {
    var m = /(.*)\/([^\/]+)/.exec(fullname);
    var parent = null;
    var name = "";
    if (!m) {
        if (fullname == "/") { }
        else if (fullname.indexOf("/") == -1) {
            parent = "/";
            name = fullname;
        }
        else {
            throw new Error("bad name");
        }
    }
    else {
        parent = m[1] || "/";
        name = m[2];
    }
    return { parent: parent, name: name };
}
exports.splitName = splitName;
function parseTree(buf) {
    var entries = [];
    var ptr = 0;
    while (ptr < buf.length) {
        var start = ptr;
        while (48 <= buf[ptr] && buf[ptr] <= 55)
            ptr++;
        if (buf[ptr] != 32)
            throw new Error("bad tree format");
        var mode = buf.slice(start, ptr).toString("utf8");
        ptr++;
        start = ptr;
        while (buf[ptr])
            ptr++;
        if (buf[ptr] != 0)
            throw new Error("bad tree format 2");
        var name_1 = buf.slice(start, ptr).toString("utf8");
        ptr++;
        var sha = buf.slice(ptr, ptr + 20).toString("hex");
        ptr += 20;
        if (ptr > buf.length)
            throw new Error("bad tree format 3");
        entries.push({ mode: mode, name: name_1, sha: sha });
    }
    return entries;
}
function parseCommit(buf) {
    var cmt = buf.toString("utf8");
    var mtree = /^tree (\S+)/m.exec(cmt);
    var mpar = /^parent (.+)/m.exec(cmt);
    var mauthor = /^author (.+) (\d+) ([+\-]\d{4})$/m.exec(cmt);
    var midx = cmt.indexOf("\n\n");
    return {
        tree: mtree[1],
        parents: mpar ? mpar[1].split(/\s+/) : undefined,
        author: mauthor[1],
        date: parseInt(mauthor[2]),
        msg: cmt.slice(midx + 2)
    };
}
