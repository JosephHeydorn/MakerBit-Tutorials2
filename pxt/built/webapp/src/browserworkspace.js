"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var db = require("./db");
var headers;
var texts;
function migratePrefixesAsync() {
    var currentVersion = pxt.semver.parse(pxt.appTarget.versions.target);
    var currentMajor = currentVersion.major;
    var currentDbPrefix = pxt.appTarget.appTheme.browserDbPrefixes && pxt.appTarget.appTheme.browserDbPrefixes[currentMajor];
    if (!currentDbPrefix) {
        // This version does not use a prefix for storing projects, so just use default tables
        headers = new db.Table("header");
        texts = new db.Table("text");
        return Promise.resolve();
    }
    headers = new db.Table(currentDbPrefix + "-header");
    texts = new db.Table(currentDbPrefix + "-text");
    return headers.getAllAsync()
        .then(function (allDbHeaders) {
        if (allDbHeaders.length) {
            // There are already scripts using the prefix, so a migration has already happened
            return Promise.resolve();
        }
        // No headers using this prefix yet, attempt to migrate headers from previous major version (or default tables)
        var previousMajor = currentMajor - 1;
        var previousDbPrefix = previousMajor < 0 ? "" : pxt.appTarget.appTheme.browserDbPrefixes && pxt.appTarget.appTheme.browserDbPrefixes[previousMajor];
        var previousHeaders = new db.Table("header");
        var previousTexts = new db.Table("text");
        if (previousDbPrefix) {
            previousHeaders = new db.Table(previousDbPrefix + "-header");
            previousTexts = new db.Table(previousDbPrefix + "-text");
        }
        var copyProject = function (h) {
            return previousTexts.getAsync(h.id)
                .then(function (resp) {
                // Ignore metadata of the previous script so they get re-generated for the new copy
                delete h._id;
                delete h._rev;
                return setAsync(h, undefined, resp.files);
            });
        };
        return previousHeaders.getAllAsync()
            .then(function (previousHeaders) {
            return Promise.map(previousHeaders, function (h) { return copyProject(h); });
        })
            .then(function () { });
    });
}
function listAsync() {
    return migratePrefixesAsync()
        .then(function () { return headers.getAllAsync(); });
}
function getAsync(h) {
    return texts.getAsync(h.id)
        .then(function (resp) { return ({
        header: h,
        text: resp.files,
        version: resp._rev
    }); });
}
function setAsync(h, prevVer, text) {
    return setCoreAsync(headers, texts, h, prevVer, text);
}
function setCoreAsync(headers, texts, h, prevVer, text) {
    var retrev = "";
    return (!text ? Promise.resolve() :
        texts.setAsync({
            id: h.id,
            files: text,
            _rev: prevVer
        }).then(function (rev) {
            retrev = rev;
        }))
        .then(function () { return headers.setAsync(h); })
        .then(function (rev) {
        h._rev = rev;
        return retrev;
    });
}
function copyProjectToLegacyEditor(h, majorVersion) {
    var prefix = pxt.appTarget.appTheme.browserDbPrefixes && pxt.appTarget.appTheme.browserDbPrefixes[majorVersion];
    var oldHeaders = new db.Table(prefix ? prefix + "-header" : "header");
    var oldTexts = new db.Table(prefix ? prefix + "-text" : "text");
    var header = pxt.Util.clone(h);
    delete header._id;
    delete header._rev;
    header.id = pxt.Util.guidGen();
    return getAsync(h)
        .then(function (resp) { return setCoreAsync(oldHeaders, oldTexts, header, undefined, resp.text); })
        .then(function (rev) { return header; });
}
exports.copyProjectToLegacyEditor = copyProjectToLegacyEditor;
function deleteAsync(h, prevVer) {
    return headers.deleteAsync(h)
        .then(function () { return texts.deleteAsync({ id: h.id, _rev: h._rev }); });
}
function resetAsync() {
    // workspace.resetAsync already clears all tables
    return Promise.resolve();
}
exports.provider = {
    getAsync: getAsync,
    setAsync: setAsync,
    deleteAsync: deleteAsync,
    listAsync: listAsync,
    resetAsync: resetAsync,
};
