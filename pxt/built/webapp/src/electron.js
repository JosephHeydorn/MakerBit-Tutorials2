"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cmds = require("./cmds");
var core = require("./core");
var pxtElectron = window.pxtElectron;
var downloadingUpdateLoadingName = "pxtelectron-downloadingupdate";
function initElectron(projectView) {
    if (!pxt.BrowserUtils.isPxtElectron()) {
        return;
    }
    pxtElectron.onTelemetry(function (ev) {
        pxt.tickEvent(ev.event, ev.data);
    });
    pxtElectron.onUpdateInstalled(function () {
        core.infoNotification(lf("An update will take effect after the app restarts"));
    });
    pxtElectron.onDriveDeployResult(function (isSuccess) {
        if (!deployingDeferred) {
            pxt.tickEvent("electron.drivedeploy.unknowndeployoperation");
            return;
        }
        if (isSuccess) {
            pxt.tickEvent("electron.drivedeploy.success");
            deployingDeferred.resolve();
        }
        else {
            pxt.tickEvent("electron.drivedeploy.failure");
            var err = new Error("electron drive deploy failed");
            deployingDeferred.reject(err);
        }
    });
    var criticalUpdateFailedPromise = new Promise(function (resolve) {
        pxtElectron.onCriticalUpdateFailed(function () {
            pxt.tickEvent("electron.criticalupdate.failed");
            resolve();
        });
    });
    // Asynchronously check what the update status is, which will let us know if the current version is banned
    pxtElectron.onUpdateStatus(function (status) {
        pxt.debug("Electron app update status: " + status);
        pxt.tickEvent("electron.updatestatus." + status);
        if (status === "updating-critical" /* UpdatingCritical */ || status === "banned-without-update" /* BannedWithoutUpdate */) {
            projectView.stopSimulator();
        }
        switch (status) {
            case "ok" /* Ok */:
                // No update available; nothing to do
                return;
            case "updating-critical" /* UpdatingCritical */:
                // App is installing a critical update; show a dialog asking the user to wait
                core.confirmAsync({
                    header: lf("Critical update required"),
                    body: lf("A critical update is installing. Please do not quit the app. It will automatically restart when the update has completed."),
                    hideAgree: true,
                    disagreeLbl: lf("Ok"),
                    disagreeClass: "green",
                    size: "medium"
                }).then(function () {
                    core.showLoading("pxt-electron-update", lf("Installing update..."));
                });
                criticalUpdateFailedPromise
                    .then(function () {
                    core.hideLoading("pxt-electron-update");
                    core.hideDialog();
                    core.confirmAsync({
                        header: lf("Critical update failed"),
                        body: lf("There was an error installing the critical update. Please ensure you are connected to the Internet and try again later."),
                        hideAgree: true,
                        disagreeLbl: lf("Quit"),
                        disagreeClass: "red",
                        size: "medium"
                    }).then(function (b) {
                        pxtElectron.sendQuit();
                    });
                });
                // Don't do anything; app will quit and restart once the update is ready
                break;
            case "banned-without-update" /* BannedWithoutUpdate */:
                // Current version is banned and there are no updates available; show a dialog explaining the
                // situation and quit
                core.confirmAsync({
                    header: lf("Critical update required"),
                    body: lf("We have disabled this app for security reasons. Please ensure you are connected to the Internet and try again later. An update will be automatically installed as soon as it is available."),
                    hideAgree: true,
                    disagreeLbl: lf("Quit"),
                    disagreeClass: "red",
                    size: "medium"
                }).then(function (b) {
                    pxtElectron.sendQuit();
                });
            default:
                // Unknown status; no-op
                return;
        }
    });
    pxtElectron.sendUpdateStatusCheck();
}
exports.initElectron = initElectron;
var deployingDeferred = null;
function driveDeployAsync(compileResult) {
    if (!pxt.BrowserUtils.isPxtElectron()) {
        return cmds.browserDownloadDeployCoreAsync(compileResult);
    }
    if (!deployingDeferred) {
        deployingDeferred = Promise.defer();
        pxtElectron.sendDriveDeploy(compileResult);
    }
    return deployingDeferred.promise
        .catch(function (e) {
        pxt.tickEvent("electron.drivedeploy.browserdownloadinstead");
        return cmds.browserDownloadDeployCoreAsync(compileResult);
    })
        .finally(function () {
        deployingDeferred = null;
    });
}
exports.driveDeployAsync = driveDeployAsync;
function openDevTools() {
    if (pxtElectron) {
        pxtElectron.sendOpenDevTools();
    }
}
exports.openDevTools = openDevTools;
