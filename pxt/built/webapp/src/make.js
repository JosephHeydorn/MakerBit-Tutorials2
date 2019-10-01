"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var pkg = require("./package");
var core = require("./core");
var compiler = require("./compiler");
var FRAME_ID = 'instructions';
function loadMakeFrameAsync(iframe) {
    return new Promise(function (resolve, reject) {
        function waitForReady(ev) {
            var data = ev.data;
            if (data.type == "ready" && data.frameid == FRAME_ID) {
                window.removeEventListener('message', waitForReady);
                resolve();
            }
        }
        // register for ready message
        window.addEventListener('message', waitForReady);
        // load iframe in background
        iframe.src = pxt.webConfig.partsUrl + '#' + FRAME_ID;
    });
}
function renderAsync(iframe) {
    return loadMakeFrameAsync(iframe)
        .then(function () { return compiler.compileAsync({ native: true }); })
        .then(function (resp) {
        var p = pkg.mainEditorPkg();
        var name = p.header.name || lf("Untitled");
        var boardDef = pxt.appTarget.simulator.boardDefinition;
        var parts = ts.pxtc.computeUsedParts(resp).sort();
        var partDefinitions = pkg.mainPkg.computePartDefinitions(parts);
        var fnArgs = resp.usedArguments;
        var cfg = {};
        var cfgKey = {};
        for (var _i = 0, _a = resp.configData || []; _i < _a.length; _i++) {
            var ce = _a[_i];
            cfg[ce.key + ""] = ce.value;
            cfgKey[ce.name] = ce.key;
        }
        var configData = { cfg: cfg, cfgKey: cfgKey };
        iframe.contentWindow.postMessage({
            type: "instructions",
            options: {
                name: name,
                boardDef: boardDef,
                parts: parts,
                partDefinitions: partDefinitions,
                fnArgs: fnArgs,
                configData: configData,
                print: true
            }
        }, "*");
        return iframe;
    });
}
function makeAsync() {
    return core.dialogAsync({
        header: lf("Make"),
        size: "large",
        hideCancel: true,
        hasCloseIcon: true,
        jsx: 
        /* tslint:disable:react-iframe-missing-sandbox */
        React.createElement("div", { className: "ui container" },
            React.createElement("div", { id: "makecontainer", style: { 'position': 'relative', 'height': 0, 'paddingBottom': '40%', 'overflow': 'hidden' } },
                React.createElement("iframe", { id: "makeiframe", frameBorder: "0", sandbox: "allow-popups allow-forms allow-scripts allow-same-origin allow-modals", style: { 'position': 'absolute', 'top': 0, 'left': 0, 'width': '100%', 'height': '100%' } })))
        /* tslint:enable:react-iframe-missing-sandbox */
        ,
        onLoaded: function (_) {
            renderAsync(_.querySelectorAll("#makeiframe")[0])
                .done();
        }
    }).then(function (r) {
    });
}
exports.makeAsync = makeAsync;
