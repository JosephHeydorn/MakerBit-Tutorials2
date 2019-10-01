"use strict";
/// <reference path="../../built/pxtlib.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var coretsx = require("./coretsx");
var Cloud = pxt.Cloud;
///////////////////////////////////////////////////////////
////////////       Loading spinner            /////////////
///////////////////////////////////////////////////////////
var dimmerInitialized = false;
var loadingDimmer;
var loadingQueue = [];
var loadingQueueMsg = {};
function isLoading() {
    return loadingDimmer && loadingDimmer.isVisible();
}
exports.isLoading = isLoading;
function hideLoading(id) {
    pxt.debug("hideloading: " + id);
    if (loadingQueueMsg[id] != undefined) {
        // loading exists, remove from queue
        var index = loadingQueue.indexOf(id);
        if (index > -1)
            loadingQueue.splice(index, 1);
        delete loadingQueueMsg[id];
    }
    else {
        pxt.debug("Loading not in queue, disregard: " + id);
    }
    if (loadingQueue.length > 0) {
        // Show the next loading message
        displayNextLoading();
    }
    else {
        // Hide loading
        if (dimmerInitialized && loadingDimmer) {
            loadingDimmer.hide();
        }
    }
}
exports.hideLoading = hideLoading;
function killLoadingQueue() {
    // Use this with care, only when you want to kill the loading queue
    // and force close them all
    loadingQueue = [];
    loadingQueueMsg = {};
    // Hide loading
    if (dimmerInitialized && loadingDimmer) {
        loadingDimmer.hide();
    }
}
exports.killLoadingQueue = killLoadingQueue;
function showLoading(id, msg) {
    pxt.debug("showloading: " + id);
    if (loadingQueueMsg[id])
        return; // already loading?
    initializeDimmer();
    loadingDimmer.show(lf("Please wait"));
    loadingQueue.push(id);
    loadingQueueMsg[id] = msg;
    displayNextLoading();
}
exports.showLoading = showLoading;
function displayNextLoading() {
    if (!loadingQueue.length)
        return;
    var id = loadingQueue[loadingQueue.length - 1]; // get last item
    var msg = loadingQueueMsg[id];
    loadingDimmer.show(msg);
}
function initializeDimmer() {
    if (dimmerInitialized)
        return;
    var wrapper = document.getElementById('content').appendChild(document.createElement('div'));
    loadingDimmer = ReactDOM.render(React.createElement(coretsx.LoadingDimmer, {}), wrapper);
    dimmerInitialized = true;
}
var asyncLoadingTimeout = {};
function showLoadingAsync(id, msg, operation, delay) {
    if (delay === void 0) { delay = 700; }
    clearTimeout(asyncLoadingTimeout[id]);
    asyncLoadingTimeout[id] = setTimeout(function () {
        showLoading(id, msg);
    }, delay);
    return operation.finally(function () {
        cancelAsyncLoading(id);
    });
}
exports.showLoadingAsync = showLoadingAsync;
function cancelAsyncLoading(id) {
    clearTimeout(asyncLoadingTimeout[id]);
    hideLoading(id);
}
exports.cancelAsyncLoading = cancelAsyncLoading;
///////////////////////////////////////////////////////////
////////////       Notification msg           /////////////
///////////////////////////////////////////////////////////
function showNotificationMsg(kind, msg) {
    coretsx.pushNotificationMessage({ kind: kind, text: msg, hc: exports.highContrast });
}
function errorNotification(msg) {
    pxt.tickEvent("notification.error", { message: msg });
    debugger; // trigger a breakpoint when a debugger is connected, like in U.oops()
    showNotificationMsg("err", msg);
}
exports.errorNotification = errorNotification;
function warningNotification(msg) {
    pxt.log("warning: " + msg);
    showNotificationMsg("warn", msg);
}
exports.warningNotification = warningNotification;
function infoNotification(msg) {
    pxt.debug(msg);
    showNotificationMsg("info", msg);
}
exports.infoNotification = infoNotification;
function dialogAsync(options) {
    if (!options.type)
        options.type = 'dialog';
    if (!options.hideCancel) {
        if (!options.buttons)
            options.buttons = [];
        options.buttons.push({
            label: options.disagreeLbl || lf("Cancel"),
            className: (options.disagreeClass || "cancel"),
            icon: options.disagreeIcon || "cancel"
        });
    }
    if (options.helpUrl) {
        options.buttons.push({
            label: lf("Help"),
            className: "help",
            icon: "help",
            url: options.helpUrl
        });
    }
    return coretsx.renderConfirmDialogAsync(options);
}
exports.dialogAsync = dialogAsync;
function hideDialog() {
    coretsx.hideDialog();
}
exports.hideDialog = hideDialog;
function confirmAsync(options) {
    options.type = 'confirm';
    if (!options.buttons)
        options.buttons = [];
    var result = 0;
    if (!options.hideAgree) {
        options.buttons.push({
            label: options.agreeLbl || lf("Go ahead!"),
            className: options.agreeClass,
            icon: options.agreeIcon || "checkmark",
            approveButton: true,
            onclick: function () {
                result = 1;
            }
        });
    }
    if (options.deleteLbl) {
        options.buttons.push({
            label: options.deleteLbl,
            className: "delete red",
            icon: "trash",
            onclick: function () {
                result = 2;
            }
        });
    }
    return dialogAsync(options)
        .then(function () { return result; });
}
exports.confirmAsync = confirmAsync;
function confirmDelete(what, cb, multiDelete) {
    confirmAsync({
        header: multiDelete ?
            lf("Would you like to delete {0} projects?", what) :
            lf("Would you like to delete '{0}'?", what),
        body: lf("It will be deleted for good. No undo."),
        agreeLbl: lf("Delete"),
        agreeClass: "red",
        agreeIcon: "trash",
    }).then(function (res) {
        if (res) {
            cb().done();
        }
    }).done();
}
exports.confirmDelete = confirmDelete;
function promptAsync(options) {
    options.type = 'prompt';
    if (!options.buttons)
        options.buttons = [];
    var result = options.initialValue || "";
    var cancelled = false;
    options.onInputChanged = function (v) { result = v; };
    if (!options.hideAgree) {
        options.buttons.push({
            label: options.agreeLbl || lf("Go ahead!"),
            className: options.agreeClass,
            icon: options.agreeIcon || "checkmark",
            approveButton: true
        });
    }
    if (!options.hideCancel) {
        // Replace the default cancel button with our own
        options.buttons.push({
            label: options.disagreeLbl || lf("Cancel"),
            className: (options.disagreeClass || "cancel"),
            icon: options.disagreeIcon || "cancel",
            onclick: function () {
                cancelled = true;
            }
        });
        options.hideCancel = true;
    }
    return dialogAsync(options)
        .then(function () { return cancelled ? null : result; });
}
exports.promptAsync = promptAsync;
exports.TAB_KEY = 9;
exports.ESC_KEY = 27;
exports.ENTER_KEY = 13;
exports.SPACE_KEY = 32;
function setHighContrast(on) {
    exports.highContrast = on;
}
exports.setHighContrast = setHighContrast;
function resetFocus() {
    var content = document.getElementById('content');
    content.tabIndex = 0;
    content.focus();
    content.blur();
    content.tabIndex = -1;
}
exports.resetFocus = resetFocus;
function keyCodeFromEvent(e) {
    return (typeof e.which == "number") ? e.which : e.keyCode;
}
exports.keyCodeFromEvent = keyCodeFromEvent;
///////////////////////////////////////////////////////////
////////////       Helper functions           /////////////
///////////////////////////////////////////////////////////
function navigateInWindow(url) {
    window.location.href = url;
}
exports.navigateInWindow = navigateInWindow;
function findChild(c, selector) {
    var self = ReactDOM.findDOMNode(c);
    if (!selector)
        return [self];
    return pxt.Util.toArray(self.querySelectorAll(selector));
}
exports.findChild = findChild;
function parseQueryString(qs) {
    var r = {};
    qs.replace(/\+/g, " ").replace(/([^#?&=]+)=([^#?&=]*)/g, function (f, k, v) {
        r[decodeURIComponent(k)] = decodeURIComponent(v);
        return "";
    });
    return r;
}
exports.parseQueryString = parseQueryString;
function stringifyQueryString(url, qs) {
    for (var _i = 0, _a = Object.keys(qs); _i < _a.length; _i++) {
        var k = _a[_i];
        if (url.indexOf("?") >= 0) {
            url += "&";
        }
        else {
            url += "?";
        }
        url += encodeURIComponent(k) + "=" + encodeURIComponent(qs[k]);
    }
    return url;
}
exports.stringifyQueryString = stringifyQueryString;
function handleNetworkError(e, ignoredCodes) {
    var statusCode = parseInt(e.statusCode);
    if (e.isOffline || statusCode === 0) {
        warningNotification(lf("Network request failed; you appear to be offline"));
    }
    else if (!isNaN(statusCode) && statusCode !== 200) {
        if (ignoredCodes && ignoredCodes.indexOf(statusCode) !== -1) {
            return e;
        }
        warningNotification(lf("Network request failed"));
    }
    throw e;
}
exports.handleNetworkError = handleNetworkError;
///////////////////////////////////////////////////////////
////////////         Javascript console       /////////////
///////////////////////////////////////////////////////////
function apiAsync(path, data) {
    return (data ?
        Cloud.privatePostAsync(path, data) :
        Cloud.privateGetAsync(path))
        .then(function (resp) {
        console.log("*");
        console.log("*******", path, "--->");
        console.log("*");
        console.log(resp);
        console.log("*");
        return resp;
    }, function (err) {
        console.log(err.message);
    });
}
exports.apiAsync = apiAsync;
