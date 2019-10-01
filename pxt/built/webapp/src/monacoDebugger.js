"use strict";
/// <reference path="../../localtypings/monaco.d.ts" />
/// <reference path="../../built/pxteditor.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var MonacoBreakpoint = /** @class */ (function () {
    function MonacoBreakpoint(source, editor) {
        this.source = source;
        this.editor = editor;
        this.active = false;
        var model = this.editor.getModel();
        var start = model.getPositionAt(this.source.start);
        var end = model.getPositionAt(this.source.start + this.source.length);
        if (end.lineNumber === start.lineNumber) {
            this.range = new monaco.Range(start.lineNumber, start.column, end.lineNumber, end.column);
        }
        else {
            this.range = new monaco.Range(start.lineNumber, start.column, start.lineNumber, model.getLineMaxColumn(start.lineNumber));
        }
        this.updateDecoration();
    }
    MonacoBreakpoint.prototype.simulatorID = function () {
        return this.source.id;
    };
    MonacoBreakpoint.prototype.isActive = function () {
        return this.active;
    };
    MonacoBreakpoint.prototype.setActive = function (active) {
        if (this.active === active)
            return;
        this.active = active;
        this.updateDecoration();
    };
    MonacoBreakpoint.prototype.toggle = function () {
        this.setActive(!this.active);
    };
    MonacoBreakpoint.prototype.distanceFromLine = function (line) {
        return Math.abs(this.range.startLineNumber - line);
    };
    MonacoBreakpoint.prototype.dispose = function () {
        if (this.decoration) {
            this.editor.deltaDecorations([this.decoration], []);
            this.decoration = undefined;
        }
    };
    MonacoBreakpoint.prototype.updateDecoration = function () {
        var glyphClass = this.active ? "monaco-breakpoint active" : "monaco-breakpoint";
        var glyphHover = this.active ? pxt.U.lf("Remove breakpoint") : pxt.U.lf("Add breakpoint");
        var dec = this.editor.deltaDecorations(this.decoration ? [this.decoration] : [], [
            {
                range: this.range,
                options: {
                    glyphMarginClassName: glyphClass,
                    glyphMarginHoverMessage: glyphHover
                }
            }
        ]);
        this.decoration = dec[0];
    };
    return MonacoBreakpoint;
}());
exports.MonacoBreakpoint = MonacoBreakpoint;
var BreakpointCollection = /** @class */ (function () {
    function BreakpointCollection(allBreakpoints) {
        this.fileToBreakpoint = {};
        this.activeBreakpoints = [];
        for (var _i = 0, allBreakpoints_1 = allBreakpoints; _i < allBreakpoints_1.length; _i++) {
            var bp = allBreakpoints_1[_i];
            if (!this.fileToBreakpoint[bp.fileName])
                this.fileToBreakpoint[bp.fileName] = [];
            this.fileToBreakpoint[bp.fileName].push(bp);
        }
    }
    BreakpointCollection.prototype.loadBreakpointsForFile = function (file, editor) {
        var _this = this;
        if (this.loadedBreakpoints)
            this.loadedBreakpoints.forEach(function (bp) { return bp.dispose(); });
        if (!file)
            return;
        var fileBreakpoints = this.fileToBreakpoint[file.getTypeScriptName()];
        if (fileBreakpoints) {
            this.loadedBreakpoints = fileBreakpoints.map(function (bp) {
                var mbp = new MonacoBreakpoint(bp, editor);
                if (_this.activeBreakpoints.indexOf(bp.id) != -1)
                    mbp.setActive(true);
                return mbp;
            });
        }
    };
    BreakpointCollection.prototype.toggleBreakpointAt = function (lineNo) {
        var bp = this.getBreakpointForLine(lineNo);
        if (bp) {
            bp.toggle();
            if (bp.isActive()) {
                this.activeBreakpoints.push(bp.source.id);
            }
            else {
                this.activeBreakpoints = this.activeBreakpoints.filter(function (id) { return id != bp.source.id; });
            }
        }
    };
    BreakpointCollection.prototype.refreshDecorations = function () {
        if (this.loadedBreakpoints)
            this.loadedBreakpoints.forEach(function (bp) { return bp.updateDecoration(); });
    };
    BreakpointCollection.prototype.clearDecorations = function () {
        if (this.loadedBreakpoints)
            this.loadedBreakpoints.forEach(function (bp) { return bp.dispose(); });
    };
    BreakpointCollection.prototype.getActiveBreakpoints = function () {
        return this.activeBreakpoints;
    };
    BreakpointCollection.prototype.dispose = function () {
        if (this.loadedBreakpoints) {
            this.loadedBreakpoints.forEach(function (bp) { return bp.dispose(); });
            this.loadedBreakpoints = undefined;
        }
        this.activeBreakpoints = undefined;
        this.fileToBreakpoint = undefined;
    };
    BreakpointCollection.prototype.getLocationOfBreakpoint = function (id) {
        for (var _i = 0, _a = Object.keys(this.fileToBreakpoint); _i < _a.length; _i++) {
            var file = _a[_i];
            var bps = this.fileToBreakpoint[file];
            for (var _b = 0, bps_1 = bps; _b < bps_1.length; _b++) {
                var bp = bps_1[_b];
                if (bp.id === id)
                    return bp;
            }
        }
        return undefined;
    };
    BreakpointCollection.prototype.getBreakpointForLine = function (lineNo) {
        if (!this.loadedBreakpoints || !this.loadedBreakpoints.length)
            return undefined;
        var closestBreakpoint;
        var closestDistance;
        for (var _i = 0, _a = this.loadedBreakpoints; _i < _a.length; _i++) {
            var bp = _a[_i];
            var distance = bp.distanceFromLine(lineNo);
            if (closestDistance === undefined || distance < closestDistance) {
                closestBreakpoint = bp;
                closestDistance = distance;
            }
        }
        if (closestDistance < 5)
            return closestBreakpoint;
        return undefined;
    };
    return BreakpointCollection;
}());
exports.BreakpointCollection = BreakpointCollection;
