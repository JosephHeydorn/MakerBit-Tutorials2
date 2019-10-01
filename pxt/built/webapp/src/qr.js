"use strict";
/// <reference path="../../localtypings/qrcode.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var loadPromise;
function loadQrCodeGeneratorAsync() {
    if (!loadPromise)
        loadPromise = pxt.BrowserUtils.loadScriptAsync("qrcode/qrcode.min.js")
            .then(function () { return typeof qrcode !== "undefined"; })
            .catch(function (e) { return false; });
    return loadPromise;
}
function renderAsync(url) {
    return loadQrCodeGeneratorAsync()
        .then(function (loaded) {
        if (!loaded)
            return undefined;
        var c = qrcode(0, 'L');
        var m = /^(https.*\/)([0-9-]+)$/.exec(url);
        if (m) {
            c.addData(m[1].toUpperCase(), 'Alphanumeric');
            //c.addData("HTTPS://PXT.IO/", 'Alphanumeric')
            c.addData(m[2].replace(/-/g, ""), 'Numeric');
        }
        else {
            m = /^(https.*\/)(_[a-zA-Z0-9]+)$/.exec(url);
            if (m) {
                c.addData(m[1].toUpperCase(), 'Alphanumeric');
                c.addData(m[2], 'Byte');
            }
            else {
                c.addData(url, 'Byte');
            }
        }
        c.make();
        return c.createDataURL(5, 5);
    }).catch(function (e) {
        pxt.reportException(e);
        return undefined;
    });
}
exports.renderAsync = renderAsync;
