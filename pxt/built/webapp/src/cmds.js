"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../../built/pxtlib.d.ts"/>
var core = require("./core");
var electron = require("./electron");
var pkg = require("./package");
var hidbridge = require("./hidbridge");
var webusb = require("./webusb");
var Cloud = pxt.Cloud;
var tryPairedDevice = false;
function browserDownloadAsync(text, name, contentType) {
    pxt.BrowserUtils.browserDownloadBinText(text, name, contentType, undefined, function (e) { return core.errorNotification(lf("saving file failed...")); });
    return Promise.resolve();
}
function browserDownloadDeployCoreAsync(resp) {
    var url = "";
    var ext = pxt.outputName().replace(/[^.]*/, "");
    var out = resp.outfiles[pxt.outputName()];
    var fn = pkg.genFileName(ext);
    var userContext = pxt.BrowserUtils.isBrowserDownloadWithinUserContext();
    if (userContext) {
        url = pxt.BrowserUtils.toDownloadDataUri(pxt.isOutputText() ? ts.pxtc.encodeBase64(out) : out, pxt.appTarget.compile.hexMimeType);
    }
    else if (!pxt.isOutputText()) {
        pxt.debug('saving ' + fn);
        url = pxt.BrowserUtils.browserDownloadBase64(out, fn, "application/x-uf2", resp.userContextWindow, function (e) { return core.errorNotification(lf("saving file failed...")); });
    }
    else {
        pxt.debug('saving ' + fn);
        url = pxt.BrowserUtils.browserDownloadBinText(out, fn, pxt.appTarget.compile.hexMimeType, resp.userContextWindow, function (e) { return core.errorNotification(lf("saving file failed...")); });
    }
    if (!resp.success) {
        return Promise.resolve();
    }
    if (resp.saveOnly && userContext)
        return pxt.commands.showUploadInstructionsAsync(fn, url, core.confirmAsync); // save does the same as download as far iOS is concerned
    if (resp.saveOnly || pxt.BrowserUtils.isBrowserDownloadInSameWindow() && !userContext)
        return Promise.resolve();
    else
        return pxt.commands.showUploadInstructionsAsync(fn, url, core.confirmAsync);
}
exports.browserDownloadDeployCoreAsync = browserDownloadDeployCoreAsync;
function showUploadInstructionsAsync(fn, url, confirmAsync) {
    var boardName = pxt.appTarget.appTheme.boardName || lf("device");
    var boardDriveName = pxt.appTarget.appTheme.driveDisplayName || pxt.appTarget.compile.driveName || "???";
    // https://msdn.microsoft.com/en-us/library/cc848897.aspx
    // "For security reasons, data URIs are restricted to downloaded resources.
    // Data URIs cannot be used for navigation, for scripting, or to populate frame or iframe elements"
    var userDownload = pxt.BrowserUtils.isBrowserDownloadWithinUserContext();
    var downloadAgain = !pxt.BrowserUtils.isIE() && !pxt.BrowserUtils.isEdge();
    var docUrl = pxt.appTarget.appTheme.usbDocs;
    var saveAs = pxt.BrowserUtils.hasSaveAs();
    var ext = pxt.appTarget.compile.useUF2 ? ".uf2" : ".hex";
    var body = userDownload ? lf("Click 'Download' to open the {0} app.", pxt.appTarget.appTheme.boardName) :
        saveAs ? lf("Click 'Save As' and save the {0} file to the {1} drive to transfer the code into your {2}.", ext, boardDriveName, boardName)
            : lf("Move the {0} file to the {1} drive to transfer the code into your {2}.", ext, boardDriveName, boardName);
    var timeout = pxt.BrowserUtils.isBrowserDownloadWithinUserContext() ? 0 : 10000;
    return confirmAsync({
        header: userDownload ? lf("Download ready...") : lf("Download completed..."),
        body: body,
        hasCloseIcon: true,
        hideCancel: true,
        hideAgree: true,
        buttons: [downloadAgain ? {
                label: userDownload ? lf("Download") : lf("Click to download again"),
                icon: "download",
                class: "" + (userDownload ? "primary" : "lightgrey"),
                url: url,
                fileName: fn
            } : undefined, docUrl ? {
                label: lf("Help"),
                icon: "help",
                class: "lightgrey",
                url: docUrl
            } : undefined],
        timeout: timeout
    }).then(function () { });
}
function nativeHostPostMessageFunction() {
    var webkit = window.webkit;
    if (webkit
        && webkit.messageHandlers
        && webkit.messageHandlers.host
        && webkit.messageHandlers.host.postMessage)
        return function (msg) { return webkit.messageHandlers.host.postMessage(msg); };
    var android = window.android;
    if (android && android.postMessage)
        return function (msg) { return android.postMessage(JSON.stringify(msg)); };
    return undefined;
}
exports.nativeHostPostMessageFunction = nativeHostPostMessageFunction;
function isNativeHost() {
    return !!nativeHostPostMessageFunction();
}
exports.isNativeHost = isNativeHost;
function nativeHostDeployCoreAsync(resp) {
    pxt.debug("native deploy");
    core.infoNotification(lf("Flashing device..."));
    var out = resp.outfiles[pxt.outputName()];
    var nativePostMessage = nativeHostPostMessageFunction();
    nativePostMessage({
        name: resp.downloadFileBaseName,
        download: out
    });
    return Promise.resolve();
}
function nativeHostSaveCoreAsync(resp) {
    pxt.debug("native save");
    core.infoNotification(lf("Saving file..."));
    var out = resp.outfiles[pxt.outputName()];
    var nativePostMessage = nativeHostPostMessageFunction();
    nativePostMessage({
        name: resp.downloadFileBaseName,
        save: out
    });
    return Promise.resolve();
}
function hidDeployCoreAsync(resp, d) {
    pxt.tickEvent("hid.deploy");
    // error message handled in browser download
    if (!resp.success)
        return browserDownloadDeployCoreAsync(resp);
    core.infoNotification(lf("Downloading..."));
    var f = resp.outfiles[pxtc.BINARY_UF2];
    var blocks = pxtc.UF2.parseFile(pxt.Util.stringToUint8Array(atob(f)));
    return hidbridge.initAsync()
        .then(function (dev) { return dev.reflashAsync(blocks); })
        .catch(function (e) {
        var troubleshootDoc = pxt.appTarget && pxt.appTarget.appTheme && pxt.appTarget.appTheme.appFlashingTroubleshoot;
        if (e.type === "repairbootloader") {
            return pairBootloaderAsync()
                .then(function () { return hidDeployCoreAsync(resp); });
        }
        if (e.type === "devicenotfound" && d.reportDeviceNotFoundAsync && !!troubleshootDoc) {
            pxt.tickEvent("hid.flash.devicenotfound");
            return d.reportDeviceNotFoundAsync(troubleshootDoc, resp);
        }
        else {
            return pxt.commands.saveOnlyAsync(resp);
        }
    });
}
exports.hidDeployCoreAsync = hidDeployCoreAsync;
function pairBootloaderAsync() {
    return core.confirmAsync({
        header: lf("Just one more time..."),
        body: lf("You need to pair the board again, now in bootloader mode. We know..."),
        agreeLbl: lf("Ok, pair!")
    }).then(function (r) { return pxt.usb.pairAsync(); });
}
function winrtDeployCoreAsync(r, d) {
    return hidDeployCoreAsync(r, d)
        .timeout(20000)
        .catch(function (e) {
        return hidbridge.disconnectWrapperAsync()
            .catch(function (e) {
            // Best effort disconnect; at this point we don't even know the state of the device
            pxt.reportException(e);
        })
            .then(function () {
            return core.confirmAsync({
                header: lf("Something went wrong..."),
                body: lf("Flashing your {0} took too long. Please disconnect your {0} from your computer and try reconnecting it.", pxt.appTarget.appTheme.boardName || lf("device")),
                disagreeLbl: lf("Ok"),
                hideAgree: true
            });
        })
            .then(function () {
            return pxt.commands.saveOnlyAsync(r);
        });
    });
}
function localhostDeployCoreAsync(resp) {
    pxt.debug('local deployment...');
    core.infoNotification(lf("Uploading..."));
    var deploy = function () { return pxt.Util.requestAsync({
        url: "/api/deploy",
        headers: { "Authorization": Cloud.localToken },
        method: "POST",
        data: resp,
        allowHttpErrors: true // To prevent "Network request failed" warning in case of error. We're not actually doing network requests in localhost scenarios
    }).then(function (r) {
        if (r.statusCode !== 200) {
            core.errorNotification(lf("There was a problem, please try again"));
        }
        else if (r.json["boardCount"] === 0) {
            core.warningNotification(lf("Please connect your {0} to your computer and try again", pxt.appTarget.appTheme.boardName));
        }
    }); };
    return deploy();
}
function init() {
    pxt.onAppTargetChanged = function () {
        pxt.debug('app target changed');
        init();
    };
    pxt.commands.browserDownloadAsync = browserDownloadAsync;
    pxt.commands.saveOnlyAsync = browserDownloadDeployCoreAsync;
    pxt.commands.showUploadInstructionsAsync = showUploadInstructionsAsync;
    var forceHexDownload = /forceHexDownload/i.test(window.location.href);
    if (pxt.usb.isAvailable() && pxt.appTarget.compile.webUSB) {
        pxt.debug("enabled webusb");
        pxt.usb.setEnabled(true);
        pxt.HF2.mkPacketIOAsync = pxt.usb.mkPacketIOAsync;
    }
    else {
        pxt.debug("disabled webusb");
        pxt.usb.setEnabled(false);
        pxt.HF2.mkPacketIOAsync = hidbridge.mkBridgeAsync;
    }
    var shouldUseWebUSB = pxt.usb.isEnabled && pxt.appTarget.compile.useUF2;
    if (isNativeHost()) {
        pxt.debug("deploy: webkit host");
        pxt.commands.deployFallbackAsync = nativeHostDeployCoreAsync;
        pxt.commands.saveOnlyAsync = nativeHostSaveCoreAsync;
    }
    else if (shouldUseWebUSB && pxt.appTarget.appTheme.autoWebUSBDownload) {
        pxt.debug("deploy: webusb");
        pxt.commands.deployFallbackAsync = webusb.webUsbDeployCoreAsync;
    }
    else if (pxt.winrt.isWinRT()) {
        if (pxt.appTarget.serial && pxt.appTarget.serial.useHF2) {
            pxt.debug("deploy: winrt");
            pxt.winrt.initWinrtHid(function () { return hidbridge.initAsync(true).then(function () { }); }, function () { return hidbridge.disconnectWrapperAsync(); });
            pxt.HF2.mkPacketIOAsync = pxt.winrt.mkPacketIOAsync;
            pxt.commands.deployFallbackAsync = winrtDeployCoreAsync;
        }
        else {
            // If we're not using HF2, then the target is using their own deploy logic in extension.ts, so don't use
            // the wrapper callbacks
            pxt.debug("deploy: winrt + custom deploy");
            pxt.winrt.initWinrtHid(null, null);
            if (pxt.appTarget.serial && pxt.appTarget.serial.rawHID) {
                pxt.HF2.mkPacketIOAsync = pxt.winrt.mkPacketIOAsync;
            }
            pxt.commands.deployFallbackAsync = pxt.winrt.driveDeployCoreAsync;
        }
        pxt.commands.browserDownloadAsync = pxt.winrt.browserDownloadAsync;
        pxt.commands.saveOnlyAsync = function (resp) {
            return pxt.winrt.saveOnlyAsync(resp)
                .then(function (saved) {
                if (saved) {
                    core.infoNotification(lf("file saved!"));
                }
            })
                .catch(function (e) { return core.errorNotification(lf("saving file failed...")); });
        };
    }
    else if (pxt.BrowserUtils.isPxtElectron()) {
        pxt.debug("deploy: electron");
        pxt.commands.deployCoreAsync = electron.driveDeployAsync;
        pxt.commands.electronDeployAsync = electron.driveDeployAsync;
    }
    else if ((tryPairedDevice && shouldUseWebUSB) || !shouldUseWebUSB && hidbridge.shouldUse() && !pxt.appTarget.serial.noDeploy && !forceHexDownload) {
        pxt.debug("deploy: hid");
        pxt.commands.deployFallbackAsync = hidDeployCoreAsync;
    }
    else if (pxt.BrowserUtils.isLocalHost() && Cloud.localToken && !forceHexDownload) {
        pxt.debug("deploy: localhost");
        pxt.commands.deployFallbackAsync = localhostDeployCoreAsync;
    }
    else {
        pxt.debug("deploy: browser");
        pxt.commands.deployFallbackAsync = shouldUseWebUSB ? checkWebUSBThenDownloadAsync : browserDownloadDeployCoreAsync;
    }
}
exports.init = init;
function setWebUSBPaired(enabled) {
    if (tryPairedDevice === enabled)
        return;
    tryPairedDevice = enabled;
    init();
}
exports.setWebUSBPaired = setWebUSBPaired;
function checkWebUSBThenDownloadAsync(resp) {
    return pxt.usb.isPairedAsync().then(function (paired) {
        if (paired) {
            setWebUSBPaired(true);
            return hidDeployCoreAsync(resp);
        }
        return browserDownloadDeployCoreAsync(resp);
    });
}
