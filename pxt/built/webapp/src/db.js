"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
window.Promise = Promise;
var PouchDB = require("pouchdb");
/* tslint:disable:no-submodule-imports TODO(tslint) */
require('pouchdb/extras/memory');
// pouchdb 7.0 - broken in IE
// PouchDB.plugin(require('pouchdb-adapter-memory'));
/* tslint:enable:no-submodule-imports */
Promise.config({
    // Enables all warnings except forgotten return statements.
    warnings: {
        wForgottenReturn: false
    }
});
var _db = undefined;
var inMemory = false;
function memoryDb() {
    pxt.debug('db: in memory...');
    inMemory = true;
    _db = new PouchDB("pxt-" + pxt.storage.storageId(), {
        adapter: 'memory'
    });
    return Promise.resolve(_db);
}
function getDbAsync() {
    if (_db)
        return Promise.resolve(_db);
    if (pxt.shell.isSandboxMode() || pxt.shell.isReadOnly())
        return memoryDb();
    var opts = {
        revs_limit: 2
    };
    var temp = new PouchDB("pxt-" + pxt.storage.storageId(), opts);
    return temp.get('pouchdbsupportabletest')
        .catch(function (error) {
        if (error && error.error && error.name == 'indexed_db_went_bad') {
            return memoryDb();
        }
        else {
            _db = temp;
            return Promise.resolve(_db);
        }
    })
        .finally(function () { pxt.log("PouchDB adapter: " + _db.adapter); });
}
exports.getDbAsync = getDbAsync;
function destroyAsync() {
    return !_db ? Promise.resolve() : _db.destroy();
}
exports.destroyAsync = destroyAsync;
var Table = /** @class */ (function () {
    function Table(name) {
        this.name = name;
    }
    Table.prototype.getAsync = function (id) {
        var _this = this;
        return getDbAsync().then(function (db) { return db.get(_this.name + "--" + id); }).then(function (v) {
            v.id = id;
            return v;
        });
    };
    Table.prototype.getAllAsync = function () {
        var _this = this;
        return getDbAsync().then(function (db) { return db.allDocs({
            include_docs: true,
            startkey: _this.name + "--",
            endkey: _this.name + "--\uffff"
        }); }).then(function (resp) { return resp.rows.map(function (e) { return e.doc; }); });
    };
    Table.prototype.deleteAsync = function (obj) {
        return getDbAsync().then(function (db) { return db.remove(obj); });
    };
    Table.prototype.forceSetAsync = function (obj) {
        var _this = this;
        return this.getAsync(obj.id)
            .then(function (o) {
            obj._rev = o._rev;
            return _this.setAsync(obj);
        }, function (e) { return _this.setAsync(obj); });
    };
    Table.prototype.setAsync = function (obj) {
        var _this = this;
        return this.setAsyncNoRetry(obj)
            .then(function (r) {
            pxt.BrowserUtils.scheduleStorageCleanup();
            return r;
        })
            .catch(function (e) {
            if (e.status == 409) {
                // conflict while writing key, ignore.
                pxt.debug("table: set conflict (409)");
                return undefined;
            }
            pxt.reportException(e);
            pxt.log("table: set failed, cleaning translation db");
            // clean up translation and try again
            return pxt.BrowserUtils.clearTranslationDbAsync()
                .then(function () { return _this.setAsyncNoRetry(obj); })
                .catch(function (e) {
                pxt.reportException(e);
                pxt.log("table: we are out of space...");
                return undefined;
            });
        });
    };
    Table.prototype.setAsyncNoRetry = function (obj) {
        if (obj.id && !obj._id)
            obj._id = this.name + "--" + obj.id;
        return getDbAsync().then(function (db) { return db.put(obj); }).then(function (resp) { return resp.rev; });
    };
    return Table;
}());
exports.Table = Table;
var GithubDb = /** @class */ (function () {
    function GithubDb() {
        // in memory cache
        this.mem = new pxt.github.MemoryGithubDb();
        this.table = new Table("github");
    }
    GithubDb.prototype.loadConfigAsync = function (repopath, tag) {
        var _this = this;
        // don't cache master
        if (tag == "master")
            return this.mem.loadConfigAsync(repopath, tag);
        var id = "config-" + repopath + "-" + tag;
        return this.table.getAsync(id).then(function (entry) {
            pxt.debug("github offline cache hit " + id);
            return entry.config;
        }, function (e) {
            pxt.debug("github offline cache miss " + id);
            return _this.mem.loadConfigAsync(repopath, tag)
                .then(function (config) {
                return _this.table.forceSetAsync({
                    id: id,
                    config: config
                }).then(function () { return config; }, function (e) { return config; });
            });
        } // not found
        );
    };
    GithubDb.prototype.loadPackageAsync = function (repopath, tag) {
        var _this = this;
        // don't cache master
        if (tag == "master")
            return this.mem.loadPackageAsync(repopath, tag);
        var id = "pkg-" + repopath + "-" + tag;
        return this.table.getAsync(id).then(function (entry) {
            pxt.debug("github offline cache hit " + id);
            return entry.package;
        }, function (e) {
            pxt.debug("github offline cache miss " + id);
            return _this.mem.loadPackageAsync(repopath, tag)
                .then(function (p) {
                return _this.table.forceSetAsync({
                    id: id,
                    package: p
                }).then(function () { return p; }, function (e) { return p; });
            });
        } // not found
        );
    };
    return GithubDb;
}());
pxt.github.db = new GithubDb();
