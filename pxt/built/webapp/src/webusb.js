"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var core = require("./core");
var cmds = require("./cmds");
function firmwareUrlAsync() {
    return pxt.targetConfigAsync()
        .then(function (config) {
        var firmwareUrl = (config.firmwareUrls || {})[pxt.appTarget.simulator.boardDefinition ? pxt.appTarget.simulator.boardDefinition.id
            : ""];
        return firmwareUrl;
    });
}
function showWebUSBPairingInstructionsAsync(resp) {
    pxt.tickEvent("webusb.pair");
    return firmwareUrlAsync()
        .then(function (firmwareUrl) {
        var boardName = pxt.appTarget.appTheme.boardName || lf("device");
        var jsx = React.createElement("div", { className: "ui " + (firmwareUrl ? "four" : "three") + " column grid stackable" },
            firmwareUrl ? React.createElement("div", { className: "column firmware" },
                React.createElement("div", { className: "ui" },
                    React.createElement("div", { className: "content" },
                        React.createElement("div", { className: "description" },
                            lf("First time here?"),
                            React.createElement("br", null),
                            React.createElement("a", { href: firmwareUrl, target: "_blank", rel: "noopener noreferrer" }, lf("Check your firmware version and update if needed"))))))
                : undefined,
            React.createElement("div", { className: "column" },
                React.createElement("div", { className: "ui" },
                    React.createElement("div", { className: "content" },
                        React.createElement("div", { className: "description" },
                            React.createElement("span", { className: "ui yellow circular label" }, "1"),
                            React.createElement("strong", null, lf("Connect {0} to computer with USB cable", boardName)),
                            React.createElement("br", null))))),
            React.createElement("div", { className: "column" },
                React.createElement("div", { className: "ui" },
                    React.createElement("div", { className: "content" },
                        React.createElement("div", { className: "description" },
                            React.createElement("span", { className: "ui blue circular label" }, "2"),
                            lf("Select the device in the pairing dialog"))))),
            React.createElement("div", { className: "column" },
                React.createElement("div", { className: "ui" },
                    React.createElement("div", { className: "content" },
                        React.createElement("div", { className: "description" },
                            React.createElement("span", { className: "ui blue circular label" }, "3"),
                            lf("Press \"Connect\""))))));
        return core.confirmAsync({
            header: lf("Pair your {0}", boardName),
            agreeLbl: lf("Let's pair it!"),
            size: "",
            className: "webusbpair",
            jsx: jsx
        }).then(function (r) {
            if (!r) {
                if (resp)
                    return cmds.browserDownloadDeployCoreAsync(resp);
                else
                    pxt.U.userError(pxt.U.lf("Device not paired"));
            }
            if (!resp)
                return pxt.usb.pairAsync();
            return pxt.usb.pairAsync()
                .then(function () {
                pxt.tickEvent("webusb.pair.success");
                return cmds.hidDeployCoreAsync(resp);
            })
                .catch(function (e) { return cmds.browserDownloadDeployCoreAsync(resp); });
        });
    });
}
exports.showWebUSBPairingInstructionsAsync = showWebUSBPairingInstructionsAsync;
var askPairingCount = 0;
function askWebUSBPairAsync(resp) {
    pxt.tickEvent("webusb.askpair");
    askPairingCount++;
    if (askPairingCount > 3) {
        pxt.tickEvent("webusb.askpaircancel");
        return cmds.browserDownloadDeployCoreAsync(resp);
    }
    var boardName = pxt.appTarget.appTheme.boardName || lf("device");
    return core.confirmAsync({
        header: lf("No device detected..."),
        jsx: React.createElement("div", null,
            React.createElement("p", null,
                React.createElement("strong", null, lf("Do you want to pair your {0} to the editor?", boardName))),
            React.createElement("p", null, lf("You will get one-click downloads and data logging."))),
    }).then(function (clickedYes) {
        if (clickedYes) {
            return showWebUSBPairingInstructionsAsync(resp);
        }
        else {
            cmds.setWebUSBPaired(false);
            return cmds.browserDownloadDeployCoreAsync(resp);
        }
    });
}
function webUsbDeployCoreAsync(resp) {
    pxt.tickEvent("webusb.deploy");
    return cmds.hidDeployCoreAsync(resp)
        .catch(function (e) { return askWebUSBPairAsync(resp); });
}
exports.webUsbDeployCoreAsync = webUsbDeployCoreAsync;
