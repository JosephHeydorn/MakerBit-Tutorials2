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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var data = require("./data");
var sui = require("./sui");
var EditorAccessibilityMenu = /** @class */ (function (_super) {
    __extends(EditorAccessibilityMenu, _super);
    function EditorAccessibilityMenu(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.openJavaScript = _this.openJavaScript.bind(_this);
        _this.openPython = _this.openPython.bind(_this);
        _this.showLanguagePicker = _this.showLanguagePicker.bind(_this);
        _this.toggleHighContrast = _this.toggleHighContrast.bind(_this);
        _this.goHome = _this.goHome.bind(_this);
        return _this;
    }
    EditorAccessibilityMenu.prototype.openJavaScript = function () {
        pxt.tickEvent("accmenu.editor.openJS", undefined, { interactiveConsent: true });
        this.props.parent.openJavaScript();
    };
    EditorAccessibilityMenu.prototype.openPython = function () {
        pxt.tickEvent("accmenu.editor.openPY", undefined, { interactiveConsent: true });
        this.props.parent.openPython();
    };
    EditorAccessibilityMenu.prototype.showLanguagePicker = function () {
        pxt.tickEvent("accmenu.editor.importdialog", undefined, { interactiveConsent: true });
        this.props.parent.showLanguagePicker();
    };
    EditorAccessibilityMenu.prototype.toggleHighContrast = function () {
        pxt.tickEvent("accmenu.editor.togglecontrast", undefined, { interactiveConsent: true });
        this.props.parent.toggleHighContrast();
    };
    EditorAccessibilityMenu.prototype.goHome = function () {
        pxt.tickEvent("accmenu.editor.home", undefined, { interactiveConsent: true });
        this.props.parent.showExitAndSaveDialog();
    };
    EditorAccessibilityMenu.prototype.componentWillReceiveProps = function (nextProps) {
        var newState = {};
        if (nextProps.highContrast != undefined) {
            newState.highContrast = nextProps.highContrast;
        }
        if (Object.keys(newState).length > 0)
            this.setState(newState);
    };
    EditorAccessibilityMenu.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.highContrast != nextState.highContrast;
    };
    EditorAccessibilityMenu.prototype.renderCore = function () {
        var highContrast = this.props.parent.state.highContrast;
        var targetTheme = pxt.appTarget.appTheme;
        var hasHome = !pxt.shell.isControllerMode();
        return React.createElement("div", { className: "ui accessibleMenu borderless fixed menu", role: "menubar" },
            React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "xicon js", text: lf("Skip to JavaScript editor"), onClick: this.openJavaScript }),
            targetTheme.python ? React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "xicon python", text: lf("Skip to Python editor"), onClick: this.openPython }) : undefined,
            targetTheme.selectLanguage ? React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "xicon globe", text: lf("Select Language"), onClick: this.showLanguagePicker }) : undefined,
            targetTheme.highContrast ? React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", text: highContrast ? lf("High Contrast Off") : lf("High Contrast On"), onClick: this.toggleHighContrast }) : undefined,
            hasHome ? React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "home", text: lf("Go Home"), onClick: this.goHome }) : undefined);
    };
    return EditorAccessibilityMenu;
}(data.Component));
exports.EditorAccessibilityMenu = EditorAccessibilityMenu;
var HomeAccessibilityMenu = /** @class */ (function (_super) {
    __extends(HomeAccessibilityMenu, _super);
    function HomeAccessibilityMenu(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.newProject = _this.newProject.bind(_this);
        _this.importProjectDialog = _this.importProjectDialog.bind(_this);
        _this.showLanguagePicker = _this.showLanguagePicker.bind(_this);
        _this.toggleHighContrast = _this.toggleHighContrast.bind(_this);
        return _this;
    }
    HomeAccessibilityMenu.prototype.newProject = function () {
        pxt.tickEvent("accmenu.home.new", undefined, { interactiveConsent: true });
        this.props.parent.newProject();
    };
    HomeAccessibilityMenu.prototype.importProjectDialog = function () {
        pxt.tickEvent("accmenu.home.importdialog", undefined, { interactiveConsent: true });
        this.props.parent.importProjectDialog();
    };
    HomeAccessibilityMenu.prototype.showLanguagePicker = function () {
        pxt.tickEvent("accmenu.home.langpicker");
        this.props.parent.showLanguagePicker();
    };
    HomeAccessibilityMenu.prototype.toggleHighContrast = function () {
        pxt.tickEvent("accmenu.home.togglecontrast", undefined, { interactiveConsent: true });
        this.props.parent.toggleHighContrast();
    };
    HomeAccessibilityMenu.prototype.componentWillReceiveProps = function (nextProps) {
        var newState = {};
        if (nextProps.highContrast != undefined) {
            newState.highContrast = nextProps.highContrast;
        }
        if (Object.keys(newState).length > 0)
            this.setState(newState);
    };
    HomeAccessibilityMenu.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.highContrast != nextState.highContrast;
    };
    HomeAccessibilityMenu.prototype.renderCore = function () {
        var highContrast = this.state.highContrast;
        var targetTheme = pxt.appTarget.appTheme;
        return React.createElement("div", { className: "ui accessibleMenu borderless fixed menu", role: "menubar" },
            React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "add circle", text: lf("New Project"), onClick: this.newProject }),
            React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "upload", text: lf("Import Project"), onClick: this.importProjectDialog }),
            targetTheme.selectLanguage ? React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", icon: "xicon globe", text: lf("Select Language"), onClick: this.showLanguagePicker }) : undefined,
            targetTheme.highContrast ? React.createElement(sui.Item, { className: (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menuitem", text: highContrast ? lf("High Contrast Off") : lf("High Contrast On"), onClick: this.toggleHighContrast }) : undefined);
    };
    return HomeAccessibilityMenu;
}(data.Component));
exports.HomeAccessibilityMenu = HomeAccessibilityMenu;
