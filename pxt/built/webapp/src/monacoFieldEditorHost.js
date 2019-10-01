"use strict";
/// <reference path="../../localtypings/monaco.d.ts" />
/// <reference path="../../built/pxteditor.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var compiler = require("./compiler");
var ViewZoneEditorHost = /** @class */ (function () {
    function ViewZoneEditorHost(fe, range, model) {
        this.fe = fe;
        this.range = range;
        this.model = model;
        this.heightInPx = 520;
        this.suppressMouseDown = false;
        this.afterLineNumber = range.endLineNumber;
        var outer = document.createElement("div");
        outer.setAttribute("class", "pxt-view-zone");
        var content = document.createElement("div");
        content.setAttribute("class", "monaco-field-editor-frame");
        outer.appendChild(content);
        this.domNode = outer;
        this.wrapper = content;
    }
    ViewZoneEditorHost.prototype.getId = function () {
        return "pxt-monaco-field-editor";
    };
    ViewZoneEditorHost.prototype.contentDiv = function () {
        if (!this.content) {
            this.content = document.createElement("div");
            this.wrapper.appendChild(this.content);
        }
        return this.content;
    };
    ViewZoneEditorHost.prototype.showAsync = function (fileType, editor) {
        var _this = this;
        this.fileType = fileType;
        this.editor = editor;
        return compiler.getBlocksAsync()
            .then(function (bi) {
            _this.blocks = bi;
            return _this.showViewZoneAsync();
        })
            .then(function () {
            _this.editor.setScrollPosition({
                scrollTop: _this.editor.getTopForLineNumber(_this.afterLineNumber)
            });
            return _this.fe.showEditorAsync(_this.fileType, _this.range, _this);
        })
            .finally(function () {
            _this.close();
        });
    };
    ViewZoneEditorHost.prototype.onComputedHeight = function (height) {
        this.contentDiv().style.height = height + "px";
    };
    ViewZoneEditorHost.prototype.onDomNodeTop = function (top) {
        if (this._deferredShow) {
            this._deferredShow();
            this._deferredShow = undefined;
        }
    };
    ViewZoneEditorHost.prototype.showViewZoneAsync = function () {
        var _this = this;
        if (this._deferredShow)
            return Promise.resolve();
        return new Promise(function (resolve) {
            _this._deferredShow = resolve;
            _this.editor.changeViewZones(function (accessor) {
                _this.id = accessor.addZone(_this);
            });
        });
    };
    ViewZoneEditorHost.prototype.resizeViewZoneAsync = function () {
        var _this = this;
        if (!this.id)
            return Promise.resolve();
        return new Promise(function (resolve) {
            _this.editor.changeViewZones(function (accessor) {
                accessor.layoutZone(_this.id);
            });
        });
    };
    ViewZoneEditorHost.prototype.getText = function (range) {
        return this.model.getValueInRange(range);
    };
    ViewZoneEditorHost.prototype.blocksInfo = function () {
        return this.blocks;
    };
    ViewZoneEditorHost.prototype.close = function () {
        var _this = this;
        this.fe.onClosed();
        this.fe.dispose();
        this.editor.changeViewZones(function (accessor) {
            accessor.removeZone(_this.id);
        });
    };
    return ViewZoneEditorHost;
}());
exports.ViewZoneEditorHost = ViewZoneEditorHost;
var FieldEditorManager = /** @class */ (function () {
    function FieldEditorManager() {
        this.fieldEditors = [];
        this.decorations = {};
        this.liveRanges = [];
        this.rangeID = 0;
    }
    FieldEditorManager.prototype.addFieldEditor = function (definition) {
        for (var _i = 0, _a = this.fieldEditors; _i < _a.length; _i++) {
            var f = _a[_i];
            if (f.id === definition.id)
                return;
        }
        this.fieldEditors.push(definition);
    };
    FieldEditorManager.prototype.getDecorations = function (owner) {
        return this.decorations[owner] || [];
    };
    FieldEditorManager.prototype.allDecorations = function () {
        var _this = this;
        var res = [];
        Object.keys(this.decorations).forEach(function (owner) { return res.push.apply(res, _this.getDecorations(owner)); });
        return res;
    };
    FieldEditorManager.prototype.setDecorations = function (owner, decorations) {
        this.decorations[owner] = decorations;
    };
    FieldEditorManager.prototype.clearRanges = function (editor) {
        var _this = this;
        if (editor) {
            Object.keys(this.decorations).forEach(function (owner) {
                editor.deltaDecorations(_this.decorations[owner], []);
            });
        }
        this.decorations = {};
        this.liveRanges = [];
        this.rangeID = 0;
    };
    FieldEditorManager.prototype.trackRange = function (owner, line, range) {
        if (this.getInfoForLine(line)) {
            return false;
        }
        this.liveRanges.push({ line: line, owner: owner, range: range, id: this.rangeID++ });
        return true;
    };
    FieldEditorManager.prototype.getFieldEditorById = function (id) {
        for (var _i = 0, _a = this.fieldEditors; _i < _a.length; _i++) {
            var fe = _a[_i];
            if (fe.id === id) {
                return fe;
            }
        }
        return undefined;
    };
    FieldEditorManager.prototype.getInfoForLine = function (line) {
        for (var _i = 0, _a = this.liveRanges; _i < _a.length; _i++) {
            var range = _a[_i];
            if (range.line === line)
                return range;
        }
        return undefined;
    };
    FieldEditorManager.prototype.allRanges = function () {
        return this.liveRanges;
    };
    FieldEditorManager.prototype.allFieldEditors = function () {
        return this.fieldEditors;
    };
    return FieldEditorManager;
}());
exports.FieldEditorManager = FieldEditorManager;
