"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var workspace = require("./workspace");
var data = require("./data");
function cover(cvs, img) {
    var ox = 0;
    var oy = 0;
    var iw = 0;
    var ih = 0;
    if (img.height > img.width) {
        ox = 0;
        iw = img.width;
        ih = iw / cvs.width * cvs.height;
        oy = (img.height - ih) / 2;
    }
    else {
        oy = 0;
        ih = img.height;
        iw = ih / cvs.height * cvs.width;
        ox = (img.width - iw) / 2;
    }
    var ctx = cvs.getContext("2d");
    ctx.drawImage(img, ox, oy, iw, ih, 0, 0, cvs.width, cvs.height);
}
function renderIcon(img) {
    var icon = null;
    if (img && img.width > 0 && img.height > 0) {
        var cvs = document.createElement("canvas");
        cvs.width = 305;
        cvs.height = 200;
        cover(cvs, img);
        icon = cvs.toDataURL('image/jpeg', 85);
    }
    return icon;
}
function saveAsync(header, screenshot) {
    return pxt.BrowserUtils.loadImageAsync(screenshot)
        .then(function (img) {
        var icon = renderIcon(img);
        return workspace.saveScreenshotAsync(header, screenshot, icon)
            .then(function () {
            data.invalidate("header:" + header.id);
            data.invalidate("header:*");
        });
    });
}
exports.saveAsync = saveAsync;
var imageMagic = 0x59347a7d; // randomly selected
var imageHeaderSize = 36; // has to be divisible by 9
function decodeBlobAsync(dataURL) {
    return pxt.BrowserUtils.loadCanvasAsync(dataURL)
        .then(function (canvas) {
        var ctx = canvas.getContext("2d");
        var imgdat = ctx.getImageData(0, 0, canvas.width, canvas.height);
        var d = imgdat.data;
        var bpp = (d[0] & 1) | ((d[1] & 1) << 1) | ((d[2] & 1) << 2);
        if (bpp > 5)
            return Promise.reject(new Error(lf("Invalid encoded PNG format")));
        function decode(ptr, bpp, trg) {
            var shift = 0;
            var i = 0;
            var acc = 0;
            var mask = (1 << bpp) - 1;
            while (i < trg.length) {
                acc |= (d[ptr++] & mask) << shift;
                if ((ptr & 3) == 3)
                    ptr++; // skip alpha
                shift += bpp;
                if (shift >= 8) {
                    trg[i++] = acc & 0xff;
                    acc >>= 8;
                    shift -= 8;
                }
            }
            return ptr;
        }
        var hd = new Uint8Array(imageHeaderSize);
        var ptr = decode(4, bpp, hd);
        var dhd = pxt.HF2.decodeU32LE(hd);
        if (dhd[0] != imageMagic)
            return Promise.reject(new Error(lf("Invalid magic in encoded PNG")));
        var res = new Uint8Array(dhd[1]);
        var addedLines = dhd[2];
        if (addedLines > 0) {
            var origSize = (canvas.height - addedLines) * canvas.width;
            var imgCap = (origSize - 1) * 3 * bpp >> 3;
            var tmp = new Uint8Array(imgCap - imageHeaderSize);
            decode(ptr, bpp, tmp);
            res.set(tmp);
            var added = new Uint8Array(res.length - tmp.length);
            decode(origSize * 4, 8, added);
            res.set(added, tmp.length);
        }
        else {
            decode(ptr, bpp, res);
        }
        return res;
    });
}
exports.decodeBlobAsync = decodeBlobAsync;
function chromifyAsync(canvas, title) {
    var w = canvas.width;
    var h = canvas.height;
    var work = document.createElement("canvas");
    var topBorder = 16;
    var bottomBorder = 16;
    var leftBorder = 16;
    var rightBorder = 16;
    var bottom = 32;
    work.width = w + leftBorder + rightBorder;
    work.height = h + topBorder + bottomBorder + bottom;
    var ctx = work.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    // white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, work.width, work.height);
    // draw image
    ctx.drawImage(canvas, leftBorder, topBorder);
    // header
    var header = pxt.appTarget.thumbnailName || pxt.appTarget.name;
    if (header) {
        var lblTop = 12;
        ctx.fillStyle = 'black';
        ctx.font = '10px monospace';
        ctx.fillText(header, leftBorder, lblTop, w - leftBorder);
    }
    // title
    if (title) {
        var lblTop = topBorder + bottomBorder + h + 4;
        ctx.fillStyle = 'black';
        ctx.font = '13px monospace';
        ctx.fillText(title, leftBorder, lblTop, w - leftBorder);
    }
    // domain
    {
        var lblTop = topBorder + bottomBorder + h + 4 + 16;
        ctx.fillStyle = '#444';
        ctx.font = '10px monospace';
        var url = pxt.appTarget.appTheme.homeUrl
            .replace(/^https:\/\//, '')
            .replace(/\/$/, '');
        ctx.fillText(url, leftBorder, lblTop, w);
    }
    return work;
}
function defaultCanvasAsync() {
    var cvs = document.createElement("canvas");
    cvs.width = 160;
    cvs.height = 120;
    var ctx = cvs.getContext("2d");
    ctx.fillStyle = '#33b';
    ctx.fillRect(0, 0, 160, 120);
    ctx.font = '30px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(':(', 60, 70);
    return Promise.resolve(cvs);
}
function logoCanvasAsync() {
    return pxt.BrowserUtils.loadImageAsync(pxt.appTarget.appTheme.logo)
        .then(function (img) {
        var cvs = document.createElement("canvas");
        cvs.width = 160;
        cvs.height = 120;
        var ctx = cvs.getContext("2d");
        var accent = pxt.appTarget.appTheme.accentColor;
        if (accent) {
            ctx.fillStyle = accent;
            ctx.fillRect(0, 0, cvs.width, cvs.height);
        }
        cover(cvs, img);
        return cvs;
    })
        .catch(function () { return defaultCanvasAsync(); });
}
function encodeBlobAsync(title, dataURL, blob) {
    // if screenshot failed, dataURL is empty
    return (dataURL ? pxt.BrowserUtils.loadCanvasAsync(dataURL) : logoCanvasAsync())
        .catch(function () { return logoCanvasAsync(); })
        .then(function (cvs) { return chromifyAsync(cvs, title); })
        .then(function (canvas) {
        var neededBytes = imageHeaderSize + blob.length;
        var usableBytes = (canvas.width * canvas.height - 1) * 3;
        var bpp = 1;
        while (bpp < 4) {
            if (usableBytes * bpp >= neededBytes * 8)
                break;
            bpp++;
        }
        var imgCapacity = (usableBytes * bpp) >> 3;
        var missing = neededBytes - imgCapacity;
        var addedLines = 0;
        var addedOffset = canvas.width * canvas.height * 4;
        if (missing > 0) {
            var bytesPerLine = canvas.width * 3;
            addedLines = Math.ceil(missing / bytesPerLine);
            var c2 = document.createElement("canvas");
            c2.width = canvas.width;
            c2.height = canvas.height + addedLines;
            var ctx_1 = c2.getContext("2d");
            ctx_1.drawImage(canvas, 0, 0);
            canvas = c2;
        }
        var header = pxt.HF2.encodeU32LE([
            imageMagic,
            blob.length,
            addedLines,
            0,
            0,
            0,
            0,
            0,
            0,
        ]);
        pxt.Util.assert(header.length == imageHeaderSize);
        function encode(img, ptr, bpp, data) {
            var shift = 0;
            var dp = 0;
            var v = data[dp++];
            var bppMask = (1 << bpp) - 1;
            var keepGoing = true;
            while (keepGoing) {
                var bits = (v >> shift) & bppMask;
                var left = 8 - shift;
                if (left <= bpp) {
                    if (dp >= data.length) {
                        if (left == 0)
                            break;
                        else
                            keepGoing = false;
                    }
                    v = data[dp++];
                    bits |= (v << left) & bppMask;
                    shift = bpp - left;
                }
                else {
                    shift += bpp;
                }
                img[ptr] = ((img[ptr] & ~bppMask) | bits) & 0xff;
                ptr++;
                if ((ptr & 3) == 3) {
                    // set alpha to 0xff
                    img[ptr++] = 0xff;
                }
            }
            return ptr;
        }
        var ctx = canvas.getContext("2d");
        var imgdat = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // first pixel holds bpp (LSB are written first, so we can skip what it writes in second and third pixel)
        encode(imgdat.data, 0, 1, [bpp]);
        var ptr = 4;
        // next, the header
        ptr = encode(imgdat.data, ptr, bpp, header);
        pxt.Util.assert((ptr & 3) == 0);
        if (addedLines == 0)
            ptr = encode(imgdat.data, ptr, bpp, blob);
        else {
            var firstChunk = imgCapacity - header.length;
            ptr = encode(imgdat.data, ptr, bpp, blob.slice(0, firstChunk));
            ptr = encode(imgdat.data, addedOffset, 8, blob.slice(firstChunk));
        }
        // set remaining alpha
        ptr |= 3;
        while (ptr < imgdat.data.length) {
            imgdat.data[ptr] = 0xff;
            ptr += 4;
        }
        ctx.putImageData(imgdat, 0, 0);
        return canvas.toDataURL("image/png");
    });
}
exports.encodeBlobAsync = encodeBlobAsync;
var GifEncoder = /** @class */ (function () {
    function GifEncoder(options) {
        this.options = options;
        this.cancellationToken = new pxt.Util.CancellationToken();
        if (!this.options.maxFrames)
            this.options.maxFrames = 64;
    }
    GifEncoder.prototype.start = function () {
        pxt.debug("gif: start encoder");
        this.gif = new GIF(this.options);
        this.time = -1;
        this.cancellationToken = new pxt.Util.CancellationToken();
        this.cancellationToken.startOperation();
        this.renderPromise = undefined;
    };
    GifEncoder.prototype.cancel = function () {
        pxt.debug("gif: cancel");
        if (this.cancellationToken.isCancelled())
            return;
        this.cancellationToken.cancel();
        if (this.gif && this.gif.running) {
            try {
                this.gif.abort();
            }
            catch (e) { }
        }
        this.clean();
    };
    GifEncoder.prototype.clean = function () {
        if (this.gif && this.gif.freeWorkers) {
            this.gif.freeWorkers.forEach(function (w) { return w.terminate(); });
            this.gif.freeWorkers = [];
        }
        this.gif = undefined;
        this.time = -1;
    };
    GifEncoder.prototype.addFrame = function (dataUri, delay) {
        if (this.cancellationToken.isCancelled() || this.renderPromise)
            return false;
        var t = pxt.Util.now();
        if (this.time < 0)
            this.time = t;
        if (delay === undefined)
            delay = t - this.time;
        pxt.debug("gif: frame " + delay + "ms");
        this.gif.addFrame(dataUri, { delay: delay });
        this.time = t;
        return this.gif.frames.length > this.options.maxFrames;
    };
    GifEncoder.prototype.renderAsync = function () {
        var _this = this;
        if (this.cancellationToken.isCancelled())
            return Promise.resolve(undefined);
        // keep trying to render until size is small enough
        var tryRenderGifAsync = function () {
            return _this.renderGifAsync()
                .then(function (imageUri) {
                _this.cancellationToken.throwIfCancelled();
                // check if we've passed the max size for the blob length
                if (_this.options.maxLength && imageUri.length > _this.options.maxLength) {
                    var nframes = Math.floor(_this.gif.frames.length * _this.options.maxLength / imageUri.length) - 1;
                    pxt.log("gif: size too large (" + ((imageUri.length / 1000) | 0) + "kb) reducing frames to " + nframes);
                    if (nframes <= 0) {
                        pxt.log("gif: simulator image too large, cannot have a single frame");
                        return undefined;
                    }
                    // try rendering again
                    _this.gif.frames = _this.gif.frames.slice(0, nframes);
                    return tryRenderGifAsync();
                }
                // all done
                pxt.log("gif: rendered " + _this.gif.frames.length + " frames to " + ((imageUri.length / 1000) | 0) + "kb");
                return imageUri;
            });
        };
        pxt.debug("gif: render " + this.gif.frames.length + " frames");
        if (!this.renderPromise)
            this.renderPromise = tryRenderGifAsync()
                .finally(function () { return _this.clean(); })
                .catch(function (e) {
                pxt.debug("rendering failed");
                pxt.debug(e);
                return undefined;
            });
        return this.renderPromise;
    };
    GifEncoder.prototype.renderGifAsync = function () {
        var _this = this;
        this.cancellationToken.throwIfCancelled();
        return new Promise(function (resolve, reject) {
            _this.gif.on('finished', function (blob) {
                _this.gif.running = false;
                resolve(blob);
            });
            _this.gif.on('abort', function () {
                pxt.debug("gif: abort");
                resolve(undefined);
            });
            _this.gif.render();
        }).then(function (blob) { return ts.pxtc.Util.blobReadAsDataURL(blob); });
    };
    return GifEncoder;
}());
exports.GifEncoder = GifEncoder;
function loadGifEncoderAsync() {
    if (!pxt.webConfig.gifworkerjs)
        return Promise.resolve(undefined);
    var options = {
        workers: 1,
        dither: false,
        workerScript: pxt.webConfig.gifworkerjs,
        quality: pxt.appTarget.appTheme.simGifQuality || 16,
        transparent: pxt.appTarget.appTheme.simGifTransparent,
        maxFrames: pxt.appTarget.appTheme.simGifMaxFrames || 64,
        maxLength: pxt.appTarget.appTheme.simScreenshotMaxUriLength || 300000
    };
    return pxt.BrowserUtils.loadScriptAsync("gifjs/gif.js")
        .then(function () { return new GifEncoder(options); });
}
exports.loadGifEncoderAsync = loadGifEncoderAsync;
