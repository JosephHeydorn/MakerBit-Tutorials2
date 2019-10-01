"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _context; // AudioContext
function context() {
    if (!_context)
        _context = freshContext();
    return _context;
}
function freshContext() {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    if (window.AudioContext) {
        try {
            // this call might crash.
            // SyntaxError: audio resources unavailable for AudioContext construction
            return new window.AudioContext();
        }
        catch (e) { }
    }
    return undefined;
}
function play(buffer, volume) {
    if (volume === void 0) { volume = 1; }
    if (!buffer)
        return;
    var ctx = context();
    if (!ctx)
        return;
    var source = ctx.createBufferSource();
    source.buffer = buffer;
    var gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(0);
}
exports.play = play;
function loadAsync(buffer) {
    var ctx = context();
    return new Promise(function (resolve, reject) {
        ctx.decodeAudioData(buffer, function (b) { return resolve(b); }, function () { resolve(undefined); });
    });
}
exports.loadAsync = loadAsync;
