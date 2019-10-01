"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var U = pxt.Util;
exports.projects = {};
function merge(prj) {
    var h = prj.header;
    if (!h) {
        prj.header = h = pxt.workspace.freshHeader(lf("Untitled"), U.nowSeconds());
        if (prj.text && prj.text["main.blocks"]) {
            prj.header.editor = pxt.BLOCKS_PROJECT_NAME;
        }
    }
    exports.projects[prj.header.id] = prj;
}
exports.merge = merge;
function listAsync() {
    return Promise.resolve(U.values(exports.projects).map(function (p) { return p.header; }));
}
function getAsync(h) {
    var p = exports.projects[h.id];
    return Promise.resolve({
        header: h,
        text: p ? p.text : {},
        version: null,
    });
}
function setAsync(h, prevVer, text) {
    if (text)
        exports.projects[h.id] = {
            header: h,
            text: text
        };
    return Promise.resolve();
}
function deleteAsync(h, prevVer) {
    delete exports.projects[h.id];
    return Promise.resolve();
}
function resetAsync() {
    exports.projects = {};
    return Promise.resolve();
}
exports.provider = {
    getAsync: getAsync,
    setAsync: setAsync,
    deleteAsync: deleteAsync,
    listAsync: listAsync,
    resetAsync: resetAsync,
};
