"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mem = require("./memoryworkspace");
function loadedAsync() {
    return pxt.editor.postHostMessageAsync({
        type: "pxthost",
        action: "workspaceloaded",
        response: true
    }).then(function () { });
}
var lastSyncState;
function listAsync() {
    return pxt.editor.postHostMessageAsync({
        type: "pxthost",
        action: "workspacesync",
        response: true
    }).then(function (msg) {
        (msg.projects || []).forEach(mem.merge);
        lastSyncState = msg.editor;
        // controllerId is a unique identifier of the controller source
        pxt.tickEvent("pxt.controller", { controllerId: msg.controllerId });
        return mem.provider.listAsync();
    });
}
function getSyncState() { return lastSyncState; }
function getAsync(h) {
    return mem.provider.getAsync(h);
}
function setAsync(h, prevVer, text) {
    return mem.provider.setAsync(h, prevVer, text)
        .then(function () {
        var projectText = (text || (mem.projects[h.id] && mem.projects[h.id].text));
        return pxt.editor.postHostMessageAsync({
            type: "pxthost",
            action: "workspacesave",
            project: { header: h, text: projectText },
            response: false
        });
    }).then(function () { });
}
function resetAsync() {
    return mem.provider.resetAsync()
        .then(function () { return pxt.editor.postHostMessageAsync({
        type: "pxthost",
        action: "workspacereset",
        response: true
    }); }).then(function () { });
}
function fireEvent(ev) {
    // Send the message up the chain
    pxt.editor.postHostMessageAsync({
        type: "pxthost",
        action: "workspaceevent",
        response: false,
        event: ev
    });
}
exports.provider = {
    getAsync: getAsync,
    setAsync: setAsync,
    listAsync: listAsync,
    resetAsync: resetAsync,
    loadedAsync: loadedAsync,
    getSyncState: getSyncState,
    fireEvent: fireEvent
};
