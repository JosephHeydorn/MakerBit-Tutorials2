"use strict";
/// <reference path="../../built/pxtlib.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) if (e.indexOf(p[i]) < 0)
            t[p[i]] = s[p[i]];
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var data = require("./data");
var sui = require("./sui");
var View;
(function (View) {
    View[View["Computer"] = 0] = "Computer";
    View[View["Tablet"] = 1] = "Tablet";
    View[View["Mobile"] = 2] = "Mobile";
})(View || (View = {}));
var EditorToolbar = /** @class */ (function (_super) {
    __extends(EditorToolbar, _super);
    function EditorToolbar(props) {
        var _this = _super.call(this, props) || this;
        _this.saveProjectName = _this.saveProjectName.bind(_this);
        _this.compile = _this.compile.bind(_this);
        _this.saveFile = _this.saveFile.bind(_this);
        _this.undo = _this.undo.bind(_this);
        _this.redo = _this.redo.bind(_this);
        _this.zoomIn = _this.zoomIn.bind(_this);
        _this.zoomOut = _this.zoomOut.bind(_this);
        _this.startStopSimulator = _this.startStopSimulator.bind(_this);
        _this.toggleTrace = _this.toggleTrace.bind(_this);
        _this.toggleDebugging = _this.toggleDebugging.bind(_this);
        return _this;
    }
    EditorToolbar.prototype.saveProjectName = function (name, view) {
        pxt.tickEvent("editortools.projectrename", { view: view }, { interactiveConsent: true });
        this.props.parent.updateHeaderName(name);
    };
    EditorToolbar.prototype.compile = function (view) {
        pxt.tickEvent("editortools.download", { view: view, collapsed: this.getCollapsedState() }, { interactiveConsent: true });
        this.props.parent.compile();
    };
    EditorToolbar.prototype.saveFile = function (view) {
        pxt.tickEvent("editortools.save", { view: view, collapsed: this.getCollapsedState() }, { interactiveConsent: true });
        this.props.parent.saveAndCompile();
    };
    EditorToolbar.prototype.undo = function (view) {
        pxt.tickEvent("editortools.undo", { view: view, collapsed: this.getCollapsedState() }, { interactiveConsent: true });
        this.props.parent.editor.undo();
    };
    EditorToolbar.prototype.redo = function (view) {
        pxt.tickEvent("editortools.redo", { view: view, collapsed: this.getCollapsedState() }, { interactiveConsent: true });
        this.props.parent.editor.redo();
    };
    EditorToolbar.prototype.zoomIn = function (view) {
        pxt.tickEvent("editortools.zoomIn", { view: view, collapsed: this.getCollapsedState() }, { interactiveConsent: true });
        this.props.parent.editor.zoomIn();
    };
    EditorToolbar.prototype.zoomOut = function (view) {
        pxt.tickEvent("editortools.zoomOut", { view: view, collapsed: this.getCollapsedState() }, { interactiveConsent: true });
        this.props.parent.editor.zoomOut();
    };
    EditorToolbar.prototype.startStopSimulator = function (view) {
        pxt.tickEvent("editortools.startStopSimulator", { view: view, collapsed: this.getCollapsedState(), headless: this.getHeadlessState() }, { interactiveConsent: true });
        this.props.parent.startStopSimulator({ clickTrigger: true });
    };
    EditorToolbar.prototype.toggleTrace = function (view) {
        pxt.tickEvent("editortools.trace", { view: view, collapsed: this.getCollapsedState(), headless: this.getHeadlessState() }, { interactiveConsent: true });
        this.props.parent.toggleTrace();
    };
    EditorToolbar.prototype.toggleDebugging = function (view) {
        pxt.tickEvent("editortools.debug", { view: view, collapsed: this.getCollapsedState(), headless: this.getHeadlessState() }, { interactiveConsent: true });
        this.props.parent.toggleDebugging();
    };
    EditorToolbar.prototype.getViewString = function (view) {
        return view.toString().toLowerCase();
    };
    EditorToolbar.prototype.getCollapsedState = function () {
        return '' + this.props.parent.state.collapseEditorTools;
    };
    EditorToolbar.prototype.getHeadlessState = function () {
        return pxt.appTarget.simulator.headless ? "true" : "false";
    };
    EditorToolbar.prototype.getUndoRedo = function (view) {
        var hasUndo = this.props.parent.editor.hasUndo();
        var hasRedo = this.props.parent.editor.hasRedo();
        return [React.createElement(EditorToolbarButton, { icon: 'xicon undo', className: "editortools-btn undo-editortools-btn} " + (!hasUndo ? 'disabled' : ''), title: lf("Undo"), ariaLabel: lf("{0}, {1}", lf("Undo"), !hasUndo ? lf("Disabled") : ""), onButtonClick: this.undo, view: this.getViewString(view), key: "undo" }),
            React.createElement(EditorToolbarButton, { icon: 'xicon redo', className: "editortools-btn redo-editortools-btn} " + (!hasRedo ? 'disabled' : ''), title: lf("Redo"), ariaLabel: lf("{0}, {1}", lf("Redo"), !hasRedo ? lf("Disabled") : ""), onButtonClick: this.redo, view: this.getViewString(view), key: "redo" })];
    };
    EditorToolbar.prototype.getZoomControl = function (view) {
        return [React.createElement(EditorToolbarButton, { icon: 'minus circle', className: "editortools-btn zoomout-editortools-btn", title: lf("Zoom Out"), onButtonClick: this.zoomOut, view: this.getViewString(view), key: "minus" }),
            React.createElement(EditorToolbarButton, { icon: 'plus circle', className: "editortools-btn zoomin-editortools-btn", title: lf("Zoom In"), onButtonClick: this.zoomIn, view: this.getViewString(view), key: "plus" })];
    };
    EditorToolbar.prototype.getSaveInput = function (view, showSave, id, projectName) {
        var saveButtonClasses = "";
        if (this.props.parent.state.isSaving) {
            saveButtonClasses = "loading disabled";
        }
        else if (!!this.props.parent.state.compiling) {
            saveButtonClasses = "disabled";
        }
        var saveInput = [];
        if (view != 2 /* Mobile */) {
            saveInput.push(React.createElement("label", { htmlFor: id, className: "accessible-hidden", key: "label" }, lf("Type a name for your project")));
            saveInput.push(React.createElement(EditorToolbarSaveInput, { id: id, view: this.getViewString(view), key: "input", type: "text", "aria-labelledby": id, placeholder: lf("Pick a name..."), value: projectName || '', onChangeValue: this.saveProjectName }));
        }
        if (showSave) {
            saveInput.push(React.createElement(EditorToolbarButton, { icon: 'save', className: (view == 0 /* Computer */ ? 'small' : 'large') + " right attached editortools-btn save-editortools-btn " + saveButtonClasses, title: lf("Save"), ariaLabel: lf("Save the project"), onButtonClick: this.saveFile, view: this.getViewString(view), key: "save" }));
        }
        return saveInput;
    };
    EditorToolbar.prototype.renderCore = function () {
        var _a = this.props.parent.state, home = _a.home, tutorialOptions = _a.tutorialOptions, hideEditorFloats = _a.hideEditorFloats, collapseEditorTools = _a.collapseEditorTools, projectName = _a.projectName, compiling = _a.compiling, isSaving = _a.isSaving, simState = _a.simState, debugging = _a.debugging;
        if (home)
            return React.createElement("div", null); // Don't render if we're in the home screen
        var targetTheme = pxt.appTarget.appTheme;
        var sandbox = pxt.shell.isSandboxMode();
        var isController = pxt.shell.isControllerMode();
        var readOnly = pxt.shell.isReadOnly();
        var tutorial = tutorialOptions ? tutorialOptions.tutorial : false;
        var simOpts = pxt.appTarget.simulator;
        var headless = simOpts.headless;
        var collapsed = (hideEditorFloats || collapseEditorTools) && (!tutorial || headless);
        var isEditor = this.props.parent.isBlocksEditor() || this.props.parent.isTextEditor();
        if (!isEditor)
            return React.createElement("div", null);
        var disableFileAccessinMaciOs = targetTheme.disableFileAccessinMaciOs && (pxt.BrowserUtils.isIOS() || pxt.BrowserUtils.isMac());
        var showSave = !readOnly && !isController && !targetTheme.saveInMenu && !tutorial && !debugging && !disableFileAccessinMaciOs;
        var compile = pxt.appTarget.compile;
        var compileBtn = compile.hasHex || compile.saveAsPNG || compile.useUF2;
        var compileTooltip = lf("Download your code to the {0}", targetTheme.boardName);
        var compileLoading = !!compiling;
        var running = simState == pxt.editor.SimState.Running;
        var starting = simState == pxt.editor.SimState.Starting;
        var hasUndo = this.props.parent.editor.hasUndo();
        var showProjectRename = !tutorial && !readOnly && !isController && !targetTheme.hideProjectRename && !debugging;
        var showUndoRedo = !tutorial && !readOnly && !debugging;
        var showZoomControls = true;
        var trace = !!targetTheme.enableTrace;
        var tracing = this.props.parent.state.tracing;
        var traceTooltip = tracing ? lf("Disable Slow-Mo") : lf("Slow-Mo");
        var debug = !!targetTheme.debugger && !readOnly;
        var debugTooltip = debugging ? lf("Disable Debugging") : lf("Debugging");
        var downloadIcon = pxt.appTarget.appTheme.downloadIcon || "download";
        var downloadText = pxt.appTarget.appTheme.useUploadMessage ? lf("Upload") : lf("Download");
        var bigRunButtonTooltip = [lf("Stop"), lf("Starting"), lf("Run Code in Game")][simState || 0];
        var mobile = 2 /* Mobile */;
        var tablet = 1 /* Tablet */;
        var computer = 0 /* Computer */;
        var downloadButtonClasses = "";
        var saveButtonClasses = "";
        if (isSaving) {
            downloadButtonClasses = "disabled";
            saveButtonClasses = "loading disabled";
        }
        else if (compileLoading) {
            downloadButtonClasses = "loading disabled";
            saveButtonClasses = "disabled";
        }
        return React.createElement("div", { className: "ui equal width grid right aligned padded" },
            React.createElement("div", { className: "column mobile only" }, collapsed ?
                React.createElement("div", { className: "ui grid" },
                    !targetTheme.bigRunButton && React.createElement("div", { className: "left aligned column six wide" },
                        React.createElement("div", { className: "ui icon small buttons" }, compileBtn && React.createElement(EditorToolbarButton, { className: "primary download-button download-button-full " + downloadButtonClasses, icon: downloadIcon, title: compileTooltip, ariaLabel: lf("Download your code"), onButtonClick: this.compile, view: 'mobile' }))),
                    React.createElement("div", { id: "editorToolbarArea", className: "column right aligned " + (targetTheme.bigRunButton ? 'sixteen' : 'ten') + " wide" },
                        !readOnly &&
                            React.createElement("div", { className: "ui icon small buttons" },
                                this.getSaveInput(mobile, showSave),
                                showUndoRedo && React.createElement(EditorToolbarButton, { icon: 'xicon undo', className: "editortools-btn undo-editortools-btn} " + (!hasUndo ? 'disabled' : ''), ariaLabel: lf("{0}, {1}", lf("Undo"), !hasUndo ? lf("Disabled") : ""), title: lf("Undo"), onButtonClick: this.undo, view: 'mobile' })),
                        showZoomControls && React.createElement("div", { className: "ui icon small buttons" }, this.getZoomControl(mobile)),
                        targetTheme.bigRunButton &&
                            React.createElement("div", { className: "big-play-button-wrapper" },
                                React.createElement(EditorToolbarButton, { role: "menuitem", className: "big-play-button play-button " + (running ? "stop" : "play"), key: 'runmenubtn', disabled: starting, icon: running ? "stop" : "play", title: bigRunButtonTooltip, onButtonClick: this.startStopSimulator, view: 'mobile' })))) :
                React.createElement("div", { className: "ui equal width grid" },
                    React.createElement("div", { className: "left aligned five wide column" }),
                    React.createElement("div", { className: "column" },
                        React.createElement("div", { className: "ui grid" },
                            readOnly || !showUndoRedo ? undefined :
                                React.createElement("div", { className: "row" },
                                    React.createElement("div", { className: "column" },
                                        React.createElement("div", { className: "ui icon large buttons" },
                                            React.createElement(EditorToolbarButton, { icon: 'xicon undo', className: "editortools-btn undo-editortools-btn " + (!hasUndo ? 'disabled' : ''), ariaLabel: lf("{0}, {1}", lf("Undo"), !hasUndo ? lf("Disabled") : ""), title: lf("Undo"), onButtonClick: this.undo, view: 'mobile' })))),
                            React.createElement("div", { className: "row", style: readOnly || !showUndoRedo ? undefined : { paddingTop: 0 } },
                                React.createElement("div", { className: "column" },
                                    React.createElement("div", { className: "ui icon large buttons" },
                                        trace && React.createElement(EditorToolbarButton, { key: 'tracebtn', className: "trace-button " + (tracing ? 'orange' : ''), icon: "xicon turtle", title: traceTooltip, onButtonClick: this.toggleTrace, view: 'mobile' }),
                                        debug && React.createElement(EditorToolbarButton, { key: 'debugbtn', className: "debug-button " + (debugging ? 'orange' : ''), icon: "icon bug", title: debugTooltip, onButtonClick: this.toggleDebugging, view: 'mobile' }),
                                        compileBtn && React.createElement(EditorToolbarButton, { className: "primary download-button download-button-full " + downloadButtonClasses, icon: downloadIcon, title: compileTooltip, onButtonClick: this.compile, view: 'mobile' })))))))),
            React.createElement("div", { className: "column tablet only" }, collapsed ?
                React.createElement("div", { className: "ui grid seven column" },
                    React.createElement("div", { className: "left aligned six wide column" },
                        React.createElement("div", { className: "ui icon buttons" }, compileBtn && React.createElement(EditorToolbarButton, { className: "primary download-button download-button-full " + downloadButtonClasses, icon: downloadIcon, text: downloadText, title: compileTooltip, onButtonClick: this.compile, view: 'tablet' }))),
                    showSave && React.createElement("div", { className: "column four wide" },
                        React.createElement(EditorToolbarButton, { icon: 'save', className: "small editortools-btn save-editortools-btn " + saveButtonClasses, title: lf("Save"), ariaLabel: lf("Save the project"), onButtonClick: this.saveFile, view: 'tablet' })),
                    React.createElement("div", { className: "column " + (showSave ? 'six' : 'ten') + " wide right aligned" },
                        showUndoRedo && React.createElement("div", { className: "ui icon small buttons" }, this.getUndoRedo(tablet)),
                        showZoomControls && React.createElement("div", { className: "ui icon small buttons" }, this.getZoomControl(tablet)),
                        targetTheme.bigRunButton &&
                            React.createElement("div", { className: "big-play-button-wrapper" },
                                React.createElement(EditorToolbarButton, { role: "menuitem", className: "big-play-button play-button " + (running ? "stop" : "play"), key: 'runmenubtn', disabled: starting, icon: running ? "stop" : "play", title: bigRunButtonTooltip, onButtonClick: this.startStopSimulator, view: 'tablet' }))))
                : React.createElement("div", { className: "ui grid" },
                    React.createElement("div", { className: "left aligned five wide column" }),
                    React.createElement("div", { className: "five wide column" },
                        React.createElement("div", { className: "ui grid right aligned" },
                            compileBtn && React.createElement("div", { className: "row" },
                                React.createElement("div", { className: "column" },
                                    React.createElement(EditorToolbarButton, { role: "menuitem", className: "primary large fluid download-button download-button-full " + downloadButtonClasses, icon: downloadIcon, text: downloadText, title: compileTooltip, onButtonClick: this.compile, view: 'tablet' }))),
                            showProjectRename &&
                                React.createElement("div", { className: "row", style: compileBtn ? { paddingTop: 0 } : {} },
                                    React.createElement("div", { className: "column" },
                                        React.createElement("div", { className: "ui item large right " + (showSave ? "labeled" : "") + " fluid input projectname-input projectname-tablet", title: lf("Pick a name for your project") }, this.getSaveInput(tablet, showSave, "fileNameInput1", projectName)))))),
                    React.createElement("div", { id: "editor", className: "six wide column right aligned" },
                        React.createElement("div", { className: "ui grid right aligned" },
                            (showUndoRedo || showZoomControls) &&
                                React.createElement("div", { className: "row" },
                                    React.createElement("div", { className: "column" },
                                        showUndoRedo && React.createElement("div", { className: "ui icon large buttons" }, this.getUndoRedo(tablet)),
                                        showZoomControls && React.createElement("div", { className: "ui icon large buttons" }, this.getZoomControl(tablet)),
                                        targetTheme.bigRunButton &&
                                            React.createElement("div", { className: "big-play-button-wrapper" },
                                                React.createElement(EditorToolbarButton, { role: "menuitem", className: "big-play-button play-button " + (running ? "stop" : "play"), key: 'runmenubtn', disabled: starting, icon: running ? "stop" : "play", title: bigRunButtonTooltip, onButtonClick: this.startStopSimulator, view: 'tablet' })))),
                            React.createElement("div", { className: "row", style: showUndoRedo || showZoomControls ? { paddingTop: 0 } : {} },
                                React.createElement("div", { className: "column" },
                                    trace && React.createElement(EditorToolbarButton, { key: 'tracebtn', className: "large trace-button " + (tracing ? 'orange' : ''), icon: "xicon turtle", title: traceTooltip, onButtonClick: this.toggleTrace, view: 'tablet' }),
                                    debug && React.createElement(EditorToolbarButton, { key: 'debugbtn', className: "large debug-button " + (debugging ? 'orange' : ''), icon: "icon bug", title: debugTooltip, onButtonClick: this.toggleDebugging, view: 'tablet' }))))))),
            React.createElement("div", { className: "column computer only" },
                React.createElement("div", { className: "ui grid equal width" },
                    React.createElement("div", { id: "downloadArea", className: "ui column items" }, headless ?
                        React.createElement("div", { className: "ui item" },
                            React.createElement("div", { className: "ui icon large buttons" }, compileBtn && React.createElement(EditorToolbarButton, { icon: downloadIcon, className: "primary large download-button " + downloadButtonClasses, title: compileTooltip, onButtonClick: this.compile, view: 'computer' }))) :
                        React.createElement("div", { className: "ui item" }, compileBtn && React.createElement(EditorToolbarButton, { icon: downloadIcon, className: "primary huge fluid download-button " + downloadButtonClasses, text: downloadText, title: compileTooltip, onButtonClick: this.compile, view: 'computer' }))),
                    showProjectRename &&
                        React.createElement("div", { id: "projectNameArea", className: "column left aligned" },
                            React.createElement("div", { className: "ui right " + (showSave ? "labeled" : "") + " input projectname-input projectname-computer", title: lf("Pick a name for your project") }, this.getSaveInput(computer, showSave, "fileNameInput2", projectName))),
                    React.createElement("div", { id: "editorToolbarArea", className: "column right aligned" },
                        showUndoRedo && React.createElement("div", { className: "ui icon small buttons" }, this.getUndoRedo(computer)),
                        showZoomControls && React.createElement("div", { className: "ui icon small buttons" }, this.getZoomControl(computer)),
                        targetTheme.bigRunButton &&
                            React.createElement("div", { className: "big-play-button-wrapper" },
                                React.createElement(EditorToolbarButton, { role: "menuitem", className: "big-play-button play-button " + (running ? "stop" : "play"), key: 'runmenubtn', disabled: starting, icon: running ? "stop" : "play", title: bigRunButtonTooltip, onButtonClick: this.startStopSimulator, view: 'computer' }))))));
    };
    return EditorToolbar;
}(data.Component));
exports.EditorToolbar = EditorToolbar;
var EditorToolbarButton = /** @class */ (function (_super) {
    __extends(EditorToolbarButton, _super);
    function EditorToolbarButton(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    EditorToolbarButton.prototype.handleClick = function () {
        var _a = this.props, onButtonClick = _a.onButtonClick, view = _a.view;
        onButtonClick(view);
    };
    EditorToolbarButton.prototype.renderCore = function () {
        var _a = this.props, onClick = _a.onClick, onButtonClick = _a.onButtonClick, rest = __rest(_a, ["onClick", "onButtonClick"]);
        return React.createElement(sui.Button, __assign({}, rest, { onClick: this.handleClick }));
    };
    return EditorToolbarButton;
}(sui.StatelessUIElement));
var EditorToolbarSaveInput = /** @class */ (function (_super) {
    __extends(EditorToolbarSaveInput, _super);
    function EditorToolbarSaveInput(props) {
        var _this = _super.call(this, props) || this;
        _this.handleChange = _this.handleChange.bind(_this);
        return _this;
    }
    EditorToolbarSaveInput.prototype.handleChange = function (e) {
        var _a = this.props, onChangeValue = _a.onChangeValue, view = _a.view;
        onChangeValue(e.target.value, view);
    };
    EditorToolbarSaveInput.prototype.renderCore = function () {
        var _a = this.props, onChange = _a.onChange, onChangeValue = _a.onChangeValue, view = _a.view, rest = __rest(_a, ["onChange", "onChangeValue", "view"]);
        return React.createElement("input", __assign({ onChange: this.handleChange, autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false }, rest));
    };
    return EditorToolbarSaveInput;
}(sui.StatelessUIElement));
