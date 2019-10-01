"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var audio = require("./audio");
var sounds = {};
var volume = 0.2;
function loadSoundAsync(id) {
    var path = ((pxt.appTarget.appTheme.sounds) || {})[id];
    if (pxt.options.light || !path)
        return Promise.resolve(undefined);
    var buffer = sounds[path];
    if (buffer)
        return Promise.resolve(buffer);
    var url = pxt.webConfig.commitCdnUrl + "sounds/" + path;
    return pxt.Util.requestAsync({
        url: url,
        headers: {
            "Accept": "audio/" + path.slice(-3)
        },
        responseArrayBuffer: true
    }).then(function (resp) { return audio.loadAsync(resp.buffer); })
        .then(function (buffer) { return sounds[path] = buffer; });
}
function playSound(id) {
    if (pxt.options.light)
        return;
    loadSoundAsync(id)
        .done(function (buf) { return buf ? audio.play(buf, volume) : undefined; });
}
function tutorialStep() { playSound('tutorialStep'); }
exports.tutorialStep = tutorialStep;
function tutorialNext() { playSound('tutorialNext'); }
exports.tutorialNext = tutorialNext;
function click() { playSound('click'); }
exports.click = click;
function initTutorial() {
    if (pxt.options.light)
        return;
    Promise.all([
        loadSoundAsync('tutorialStep'),
        loadSoundAsync('tutorialNext'),
        loadSoundAsync('click')
    ]).done();
}
exports.initTutorial = initTutorial;
