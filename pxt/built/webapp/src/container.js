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
var tutorial = require("./tutorial");
var container = require("./container");
var core = require("./core");
// common menu items -- do not remove
// lf("About")
// lf("Getting started")
// lf("Buy")
// lf("Blocks")
// lf("Examples")
// lf("Tutorials")
// lf("Projects")
// lf("Reference")
// lf("Support")
// lf("Hardware")
function openTutorial(parent, path) {
    pxt.tickEvent("docs", { path: path }, { interactiveConsent: true });
    parent.startTutorial(path);
}
function openDocs(parent, path) {
    pxt.tickEvent("docs", { path: path }, { interactiveConsent: true });
    parent.setSideDoc(path);
}
function renderDocItems(parent, cls) {
    var targetTheme = pxt.appTarget.appTheme;
    return targetTheme.docMenu.map(function (m) {
        return m.tutorial ? React.createElement(DocsMenuItem, { key: "docsmenututorial" + m.path, role: "menuitem", ariaLabel: pxt.Util.rlf(m.name), text: pxt.Util.rlf(m.name), className: "ui " + cls, parent: parent, path: m.path, onItemClick: openTutorial })
            : !/^\//.test(m.path) ? React.createElement("a", { key: "docsmenulink" + m.path, role: "menuitem", "aria-label": m.name, title: m.name, className: "ui item link " + cls, href: m.path, target: "docs" }, pxt.Util.rlf(m.name))
                : React.createElement(DocsMenuItem, { key: "docsmenu" + m.path, role: "menuitem", ariaLabel: pxt.Util.rlf(m.name), text: pxt.Util.rlf(m.name), className: "ui " + cls, parent: parent, path: m.path, onItemClick: openDocs });
    });
}
var DocsMenu = /** @class */ (function (_super) {
    __extends(DocsMenu, _super);
    function DocsMenu(props) {
        return _super.call(this, props) || this;
    }
    DocsMenu.prototype.lookUpByPath = function (path) {
        var _this = this;
        if (!this.docMenuCache) {
            this.docMenuCache = {};
            // Populate the cache
            var targetTheme = pxt.appTarget.appTheme;
            targetTheme.docMenu.forEach(function (m) {
                _this.docMenuCache[m.path] = m;
            });
        }
        return this.docMenuCache[path];
    };
    DocsMenu.prototype.doDocEntryAction = function (parent, m) {
        if (m.tutorial) {
            return function () { openTutorial(parent, m.path); };
        }
        else if (!/^\//.test(m.path) && !m.popout) {
            return function () { window.open(m.path, "docs"); };
        }
        else if (m.popout) {
            return function () { window.open("" + pxt.appTarget.appTheme.homeUrl + m.path, "docs"); };
        }
        else {
            return function () { openDocs(parent, m.path); };
        }
    };
    DocsMenu.prototype.renderCore = function () {
        var _this = this;
        var parent = this.props.parent;
        var targetTheme = pxt.appTarget.appTheme;
        var options = targetTheme.docMenu.map(function (m) {
            return {
                key: "docsmenu" + m.path,
                content: pxt.Util.rlf(m.name),
                role: "menuitem",
                'aria-label': pxt.Util.rlf(m.name),
                onClick: _this.doDocEntryAction(parent, m),
                value: m.path,
                onKeyDown: function () {
                    console.log("Key DOWN");
                }
            };
        });
        var onChange = function (e, data) {
            var m = _this.lookUpByPath(data.value);
            _this.doDocEntryAction(parent, m)();
        };
        return React.createElement(sui.DropdownMenu, { role: "menuitem", icon: "help circle large", className: "item mobile hide help-dropdown-menuitem", textClass: "landscape only", title: lf("Help") }, renderDocItems(this.props.parent, ""));
    };
    return DocsMenu;
}(data.PureComponent));
exports.DocsMenu = DocsMenu;
var DocsMenuItem = /** @class */ (function (_super) {
    __extends(DocsMenuItem, _super);
    function DocsMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    DocsMenuItem.prototype.handleClick = function () {
        var _a = this.props, onItemClick = _a.onItemClick, parent = _a.parent, path = _a.path;
        onItemClick(parent, path);
    };
    DocsMenuItem.prototype.renderCore = function () {
        var _a = this.props, onClick = _a.onClick, onItemClick = _a.onItemClick, parent = _a.parent, path = _a.path, rest = __rest(_a, ["onClick", "onItemClick", "parent", "path"]);
        return React.createElement(sui.Item, __assign({}, rest, { onClick: this.handleClick }));
    };
    return DocsMenuItem;
}(sui.StatelessUIElement));
var SettingsMenu = /** @class */ (function (_super) {
    __extends(SettingsMenu, _super);
    function SettingsMenu(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.openSettings = _this.openSettings.bind(_this);
        _this.showPackageDialog = _this.showPackageDialog.bind(_this);
        _this.showBoardDialog = _this.showBoardDialog.bind(_this);
        _this.removeProject = _this.removeProject.bind(_this);
        _this.saveProject = _this.saveProject.bind(_this);
        _this.toggleCollapse = _this.toggleCollapse.bind(_this);
        _this.showReportAbuse = _this.showReportAbuse.bind(_this);
        _this.showLanguagePicker = _this.showLanguagePicker.bind(_this);
        _this.toggleHighContrast = _this.toggleHighContrast.bind(_this);
        _this.toggleGreenScreen = _this.toggleGreenScreen.bind(_this);
        _this.showResetDialog = _this.showResetDialog.bind(_this);
        _this.showShareDialog = _this.showShareDialog.bind(_this);
        _this.pair = _this.pair.bind(_this);
        _this.pairBluetooth = _this.pairBluetooth.bind(_this);
        _this.showAboutDialog = _this.showAboutDialog.bind(_this);
        _this.print = _this.print.bind(_this);
        return _this;
    }
    SettingsMenu.prototype.showShareDialog = function () {
        pxt.tickEvent("menu.share", undefined, { interactiveConsent: true });
        this.props.parent.showShareDialog();
    };
    SettingsMenu.prototype.openSettings = function () {
        pxt.tickEvent("menu.settings", undefined, { interactiveConsent: true });
        this.props.parent.openSettings();
    };
    SettingsMenu.prototype.showPackageDialog = function () {
        pxt.tickEvent("menu.addpackage", undefined, { interactiveConsent: true });
        this.props.parent.showPackageDialog();
    };
    SettingsMenu.prototype.showBoardDialog = function () {
        pxt.tickEvent("menu.changeboard", undefined, { interactiveConsent: true });
        if (pxt.hasHwVariants())
            this.props.parent.showChooseHwDialog();
        else
            this.props.parent.showBoardDialogAsync(undefined, true).done();
    };
    SettingsMenu.prototype.saveProject = function () {
        pxt.tickEvent("menu.saveproject", undefined, { interactiveConsent: true });
        this.props.parent.saveAndCompile();
    };
    SettingsMenu.prototype.removeProject = function () {
        pxt.tickEvent("menu.removeproject", undefined, { interactiveConsent: true });
        this.props.parent.removeProject();
    };
    SettingsMenu.prototype.toggleCollapse = function () {
        pxt.tickEvent("menu.toggleSim", undefined, { interactiveConsent: true });
        this.props.parent.toggleSimulatorCollapse();
    };
    SettingsMenu.prototype.showReportAbuse = function () {
        pxt.tickEvent("menu.reportabuse", undefined, { interactiveConsent: true });
        this.props.parent.showReportAbuse();
    };
    SettingsMenu.prototype.showLanguagePicker = function () {
        pxt.tickEvent("menu.langpicker", undefined, { interactiveConsent: true });
        this.props.parent.showLanguagePicker();
    };
    SettingsMenu.prototype.toggleHighContrast = function () {
        pxt.tickEvent("menu.togglecontrast", undefined, { interactiveConsent: true });
        this.props.parent.toggleHighContrast();
    };
    SettingsMenu.prototype.toggleGreenScreen = function () {
        pxt.tickEvent("menu.togglegreenscreen", undefined, { interactiveConsent: true });
        this.props.parent.toggleGreenScreen();
    };
    SettingsMenu.prototype.showResetDialog = function () {
        pxt.tickEvent("menu.reset", undefined, { interactiveConsent: true });
        pxt.tickEvent("reset"); // Deprecated, will Feb 2018.
        this.props.parent.showResetDialog();
    };
    SettingsMenu.prototype.pair = function () {
        pxt.tickEvent("menu.pair");
        this.props.parent.pair();
    };
    SettingsMenu.prototype.pairBluetooth = function () {
        pxt.tickEvent("menu.pair.bluetooth");
        core.showLoading("webblepair", lf("Pairing Bluetooth device..."));
        pxt.webBluetooth.pairAsync()
            .then(function () { return core.hideLoading("webblepair"); });
    };
    SettingsMenu.prototype.showAboutDialog = function () {
        pxt.tickEvent("menu.about");
        this.props.parent.showAboutDialog();
    };
    SettingsMenu.prototype.print = function () {
        pxt.tickEvent("menu.print");
        this.props.parent.printCode();
    };
    SettingsMenu.prototype.componentWillReceiveProps = function (nextProps) {
        var newState = {};
        if (nextProps.highContrast != undefined) {
            newState.highContrast = nextProps.highContrast;
        }
        if (nextProps.greenScreen !== undefined) {
            newState.greenScreen = nextProps.greenScreen;
        }
        if (Object.keys(newState).length > 0)
            this.setState(newState);
    };
    SettingsMenu.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.highContrast != nextState.highContrast
            || this.state.greenScreen != nextState.greenScreen;
    };
    SettingsMenu.prototype.renderCore = function () {
        var _a = this.state, highContrast = _a.highContrast, greenScreen = _a.greenScreen;
        var targetTheme = pxt.appTarget.appTheme;
        var packages = pxt.appTarget.cloud && !!pxt.appTarget.cloud.packages;
        var boards = pxt.appTarget.simulator && !!pxt.appTarget.simulator.dynamicBoardDefinition;
        var reportAbuse = pxt.appTarget.cloud && pxt.appTarget.cloud.sharing && pxt.appTarget.cloud.importing;
        var readOnly = pxt.shell.isReadOnly();
        var isController = pxt.shell.isControllerMode();
        var disableFileAccessinMaciOs = targetTheme.disableFileAccessinMaciOs && (pxt.BrowserUtils.isIOS() || pxt.BrowserUtils.isMac());
        var showSave = !readOnly && !isController && !!targetTheme.saveInMenu && !disableFileAccessinMaciOs;
        var showSimCollapse = !readOnly && !isController && !!targetTheme.simCollapseInMenu;
        var showGreenScreen = targetTheme.greenScreen || /greenscreen=1/i.test(window.location.href);
        var showPrint = targetTheme.print && !pxt.BrowserUtils.isIE();
        var showProjectSettings = targetTheme.showProjectSettings;
        // Electron does not currently support webusb
        var showPairDevice = pxt.usb.isEnabled && !pxt.BrowserUtils.isElectron();
        return React.createElement(sui.DropdownMenu, { role: "menuitem", icon: 'setting large', title: lf("More..."), className: "item icon more-dropdown-menuitem" },
            showProjectSettings ? React.createElement(sui.Item, { role: "menuitem", icon: "options", text: lf("Project Settings"), onClick: this.openSettings }) : undefined,
            packages ? React.createElement(sui.Item, { role: "menuitem", icon: "disk outline", text: lf("Extensions"), onClick: this.showPackageDialog }) : undefined,
            boards ? React.createElement(sui.Item, { role: "menuitem", icon: "microchip", text: lf("Change Board"), onClick: this.showBoardDialog }) : undefined,
            showPrint ? React.createElement(sui.Item, { role: "menuitem", icon: "print", text: lf("Print..."), onClick: this.print }) : undefined,
            showSave ? React.createElement(sui.Item, { role: "menuitem", icon: "save", text: lf("Save Project"), onClick: this.saveProject }) : undefined,
            !isController ? React.createElement(sui.Item, { role: "menuitem", icon: "trash", text: lf("Delete Project"), onClick: this.removeProject }) : undefined,
            showSimCollapse ? React.createElement(sui.Item, { role: "menuitem", icon: 'toggle right', text: lf("Toggle the simulator"), onClick: this.toggleCollapse }) : undefined,
            reportAbuse ? React.createElement(sui.Item, { role: "menuitem", icon: "warning circle", text: lf("Report Abuse..."), onClick: this.showReportAbuse }) : undefined,
            React.createElement("div", { className: "ui divider" }),
            targetTheme.selectLanguage ? React.createElement(sui.Item, { icon: 'xicon globe', role: "menuitem", text: lf("Language"), onClick: this.showLanguagePicker }) : undefined,
            targetTheme.highContrast ? React.createElement(sui.Item, { role: "menuitem", text: highContrast ? lf("High Contrast Off") : lf("High Contrast On"), onClick: this.toggleHighContrast }) : undefined,
            showGreenScreen ? React.createElement(sui.Item, { role: "menuitem", text: greenScreen ? lf("Green Screen Off") : lf("Green Screen On"), onClick: this.toggleGreenScreen }) : undefined,
            !isController ? React.createElement(sui.Item, { role: "menuitem", icon: 'sign out', text: lf("Reset"), onClick: this.showResetDialog }) : undefined,
            showPairDevice ? React.createElement(sui.Item, { role: "menuitem", icon: 'usb', text: lf("Pair device"), onClick: this.pair }) : undefined,
            pxt.webBluetooth.isAvailable() ? React.createElement(sui.Item, { role: "menuitem", icon: 'bluetooth', text: lf("Pair Bluetooth"), onClick: this.pairBluetooth }) : undefined,
            React.createElement("div", { className: "ui mobile only divider" }),
            renderDocItems(this.props.parent, "mobile only"),
            React.createElement("div", { className: "ui divider" }),
            React.createElement(sui.Item, { role: "menuitem", text: lf("About..."), onClick: this.showAboutDialog }),
            targetTheme.feedbackUrl ? React.createElement("a", { className: "ui item", href: targetTheme.feedbackUrl, role: "menuitem", title: lf("Give Feedback"), target: "_blank", rel: "noopener noreferrer" }, lf("Give Feedback")) : undefined);
    };
    return SettingsMenu;
}(data.Component));
exports.SettingsMenu = SettingsMenu;
var BaseMenuItemProps = /** @class */ (function (_super) {
    __extends(BaseMenuItemProps, _super);
    function BaseMenuItemProps(props) {
        return _super.call(this, props) || this;
    }
    BaseMenuItemProps.prototype.renderCore = function () {
        var active = this.props.isActive();
        return React.createElement(sui.Item, { className: this.props.className + " " + (active ? "selected" : ""), role: "menuitem", textClass: "landscape only", text: this.props.text, icon: this.props.icon, active: active, onClick: this.props.onClick, title: this.props.title });
    };
    return BaseMenuItemProps;
}(data.Component));
var JavascriptMenuItem = /** @class */ (function (_super) {
    __extends(JavascriptMenuItem, _super);
    function JavascriptMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.onClick = function () {
            pxt.tickEvent("menu.javascript", undefined, { interactiveConsent: true });
            _this.props.parent.openJavaScript();
        };
        _this.isActive = function () {
            return _this.props.parent.isJavaScriptActive();
        };
        return _this;
    }
    JavascriptMenuItem.prototype.renderCore = function () {
        return React.createElement(BaseMenuItemProps, { className: "javascript-menuitem", icon: "xicon js", text: "JavaScript", title: lf("Convert code to JavaScript"), onClick: this.onClick, isActive: this.isActive, parent: this.props.parent });
    };
    return JavascriptMenuItem;
}(data.Component));
var PythonMenuItem = /** @class */ (function (_super) {
    __extends(PythonMenuItem, _super);
    function PythonMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.onClick = function () {
            pxt.tickEvent("menu.python", undefined, { interactiveConsent: true });
            _this.props.parent.openPython();
        };
        _this.isActive = function () {
            return _this.props.parent.isPythonActive();
        };
        return _this;
    }
    PythonMenuItem.prototype.renderCore = function () {
        return React.createElement(BaseMenuItemProps, { className: "python-menuitem", icon: "xicon python", text: "Python", title: lf("Convert code to Python"), onClick: this.onClick, isActive: this.isActive, parent: this.props.parent });
    };
    return PythonMenuItem;
}(data.Component));
var BlocksMenuItem = /** @class */ (function (_super) {
    __extends(BlocksMenuItem, _super);
    function BlocksMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.onClick = function () {
            pxt.tickEvent("menu.blocks", undefined, { interactiveConsent: true });
            _this.props.parent.openBlocks();
        };
        _this.isActive = function () {
            return _this.props.parent.isBlocksActive();
        };
        return _this;
    }
    BlocksMenuItem.prototype.renderCore = function () {
        return React.createElement(BaseMenuItemProps, { className: "blocks-menuitem", icon: "xicon blocks", text: lf("Blocks"), title: lf("Convert code to Blocks"), onClick: this.onClick, isActive: this.isActive, parent: this.props.parent });
    };
    return BlocksMenuItem;
}(data.Component));
var SandboxMenuItem = /** @class */ (function (_super) {
    __extends(SandboxMenuItem, _super);
    function SandboxMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.onClick = function () {
            pxt.tickEvent("menu.simView", undefined, { interactiveConsent: true });
            _this.props.parent.openSimView();
        };
        _this.isActive = function () {
            return _this.props.parent.isEmbedSimActive();
        };
        return _this;
    }
    SandboxMenuItem.prototype.renderCore = function () {
        var active = this.isActive();
        var isRunning = this.props.parent.state.simState == pxt.editor.SimState.Running;
        var runTooltip = isRunning ? lf("Stop the simulator") : lf("Start the simulator");
        return React.createElement(BaseMenuItemProps, { className: "sim-menuitem", icon: active && isRunning ? "stop" : "play", text: lf("Simulator"), title: !active ? lf("Show Simulator") : runTooltip, onClick: this.onClick, isActive: this.isActive, parent: this.props.parent });
    };
    return SandboxMenuItem;
}(data.Component));
var EditorSelector = /** @class */ (function (_super) {
    __extends(EditorSelector, _super);
    function EditorSelector(props) {
        return _super.call(this, props) || this;
    }
    EditorSelector.prototype.renderCore = function () {
        var pythonEnabled = this.props.python;
        var dropdownActive = pythonEnabled && (this.props.parent.isJavaScriptActive() || this.props.parent.isPythonActive());
        return (React.createElement("div", null,
            React.createElement("div", { id: "editortoggle", className: "ui grid padded" },
                this.props.sandbox && React.createElement(SandboxMenuItem, { parent: this.props.parent }),
                React.createElement(BlocksMenuItem, { parent: this.props.parent }),
                pxt.Util.isPyLangPref() && pythonEnabled ? React.createElement(PythonMenuItem, { parent: this.props.parent }) : React.createElement(JavascriptMenuItem, { parent: this.props.parent }),
                pythonEnabled && React.createElement(sui.DropdownMenu, { id: "editordropdown", role: "menuitem", icon: "chevron down", rightIcon: true, title: lf("Select code editor language"), className: "item button attached right " + (dropdownActive ? "active" : "") },
                    React.createElement(JavascriptMenuItem, { parent: this.props.parent }),
                    React.createElement(PythonMenuItem, { parent: this.props.parent })),
                React.createElement("div", { className: "ui item toggle " + (pythonEnabled ? 'hasdropdown' : '') }))));
    };
    return EditorSelector;
}(data.Component));
exports.EditorSelector = EditorSelector;
var MainMenu = /** @class */ (function (_super) {
    __extends(MainMenu, _super);
    function MainMenu(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.brandIconClick = _this.brandIconClick.bind(_this);
        _this.orgIconClick = _this.orgIconClick.bind(_this);
        _this.goHome = _this.goHome.bind(_this);
        _this.showShareDialog = _this.showShareDialog.bind(_this);
        _this.launchFullEditor = _this.launchFullEditor.bind(_this);
        _this.exitTutorial = _this.exitTutorial.bind(_this);
        _this.showReportAbuse = _this.showReportAbuse.bind(_this);
        _this.toggleDebug = _this.toggleDebug.bind(_this);
        return _this;
    }
    MainMenu.prototype.brandIconClick = function () {
        var hasHome = !pxt.shell.isControllerMode();
        if (!hasHome)
            return;
        pxt.tickEvent("menu.brand", undefined, { interactiveConsent: true });
        this.props.parent.showExitAndSaveDialog();
    };
    MainMenu.prototype.orgIconClick = function () {
        pxt.tickEvent("menu.org", undefined, { interactiveConsent: true });
    };
    MainMenu.prototype.goHome = function () {
        pxt.tickEvent("menu.home", undefined, { interactiveConsent: true });
        this.props.parent.showExitAndSaveDialog();
    };
    MainMenu.prototype.showShareDialog = function () {
        pxt.tickEvent("menu.share", undefined, { interactiveConsent: true });
        this.props.parent.showShareDialog();
    };
    MainMenu.prototype.launchFullEditor = function () {
        pxt.tickEvent("sandbox.openfulleditor", undefined, { interactiveConsent: true });
        this.props.parent.launchFullEditor();
    };
    MainMenu.prototype.exitTutorial = function () {
        pxt.tickEvent("menu.exitTutorial", undefined, { interactiveConsent: true });
        if (this.props.parent.state.tutorialOptions
            && this.props.parent.state.tutorialOptions.tutorialRecipe)
            this.props.parent.completeTutorialAsync().done();
        else
            this.props.parent.exitTutorial();
    };
    MainMenu.prototype.showReportAbuse = function () {
        pxt.tickEvent("tutorial.reportabuse", undefined, { interactiveConsent: true });
        this.props.parent.showReportAbuse();
    };
    MainMenu.prototype.toggleDebug = function () {
        // This function will get called when the user clicks the "Exit Debug Mode" button in the menu bar.
        pxt.tickEvent("simulator.debug", undefined, { interactiveConsent: true });
        this.props.parent.toggleDebugging();
    };
    MainMenu.prototype.renderCore = function () {
        var _a = this.props.parent.state, debugging = _a.debugging, home = _a.home, header = _a.header, highContrast = _a.highContrast, greenScreen = _a.greenScreen, simState = _a.simState, tutorialOptions = _a.tutorialOptions;
        if (home)
            return React.createElement("div", null); // Don't render if we're on the home screen
        var targetTheme = pxt.appTarget.appTheme;
        var lockedEditor = !!targetTheme.lockedEditor;
        var isController = pxt.shell.isControllerMode();
        var homeEnabled = !lockedEditor && !isController;
        var sandbox = pxt.shell.isSandboxMode();
        var inTutorial = !!tutorialOptions && !!tutorialOptions.tutorial;
        var activityName = tutorialOptions && tutorialOptions.tutorialActivityInfo ?
            tutorialOptions.tutorialActivityInfo[tutorialOptions.tutorialStepInfo[tutorialOptions.tutorialStep].activity].name :
            null;
        var tutorialReportId = tutorialOptions && tutorialOptions.tutorialReportId;
        var docMenu = targetTheme.docMenu && targetTheme.docMenu.length && !sandbox && !inTutorial && !debugging;
        var hc = !!this.props.parent.state.highContrast;
        var showShare = !inTutorial && header && pxt.appTarget.cloud && pxt.appTarget.cloud.sharing && !isController && !debugging;
        var logo = (hc ? targetTheme.highContrastLogo : undefined) || targetTheme.logo;
        var portraitLogo = (hc ? targetTheme.highContrastPortraitLogo : undefined) || targetTheme.portraitLogo;
        var rightLogo = sandbox ? targetTheme.portraitLogo : targetTheme.rightLogo;
        var logoWide = !!targetTheme.logoWide;
        var portraitLogoSize = logoWide ? "small" : "mini";
        /* tslint:disable:react-a11y-anchors */
        return React.createElement("div", { id: "mainmenu", className: "ui borderless fixed " + (targetTheme.invertedMenu ? "inverted" : '') + " menu", role: "menubar", "aria-label": lf("Main menu") },
            !sandbox ? React.createElement("div", { className: "left menu" },
                !targetTheme.hideMenubarLogo &&
                    React.createElement("a", { href: (!lockedEditor && isController) ? targetTheme.logoUrl : undefined, "aria-label": lf("{0} Logo", targetTheme.boardName), role: "menuitem", target: "blank", rel: "noopener", className: "ui item logo brand", tabIndex: 0, onClick: lockedEditor ? undefined : this.brandIconClick, onKeyDown: sui.fireClickOnEnter },
                        logo || portraitLogo
                            ? React.createElement("img", { className: "ui logo " + (logo ? " portrait hide" : ''), src: logo || portraitLogo, alt: lf("{0} Logo", targetTheme.boardName) })
                            : React.createElement("span", { className: "name" }, targetTheme.boardName),
                        portraitLogo ? (React.createElement("img", { className: "ui " + portraitLogoSize + " image portrait only", src: portraitLogo, alt: lf("{0} Logo", targetTheme.boardName) })) : null),
                (!lockedEditor && targetTheme.betaUrl) && React.createElement("a", { href: "" + targetTheme.betaUrl, className: "ui red mini corner top left attached label betalabel", role: "menuitem" }, lf("Beta")),
                !inTutorial && homeEnabled ? React.createElement(sui.Item, { className: "icon openproject", role: "menuitem", textClass: "landscape only", icon: "home large", ariaLabel: lf("Home screen"), text: lf("Home"), onClick: this.goHome }) : null,
                showShare ? React.createElement(sui.Item, { className: "icon shareproject", role: "menuitem", textClass: "widedesktop only", ariaLabel: lf("Share Project"), text: lf("Share"), icon: "share alternate large", onClick: this.showShareDialog }) : null,
                inTutorial && React.createElement(sui.Item, { className: "tutorialname", tabIndex: -1, textClass: "landscape only", text: tutorialOptions.tutorialName })) : React.createElement("div", { className: "left menu" },
                React.createElement("span", { id: "logo", className: "ui item logo" },
                    React.createElement("img", { className: "ui mini image", src: rightLogo, tabIndex: 0, onClick: this.launchFullEditor, onKeyDown: sui.fireClickOnEnter, alt: targetTheme.boardName + " Logo" }))),
            !inTutorial && !targetTheme.blocksOnly && !debugging && React.createElement("div", { className: "ui item link editor-menuitem" },
                React.createElement(container.EditorSelector, { parent: this.props.parent, sandbox: sandbox, python: targetTheme.python })),
            inTutorial && activityName && React.createElement("div", { className: "ui item" }, activityName),
            inTutorial && React.createElement(tutorial.TutorialMenu, { parent: this.props.parent }),
            debugging && !inTutorial ? React.createElement(sui.MenuItem, { className: "debugger-menu-item centered", icon: "large bug", name: "Debug Mode" }) : undefined,
            React.createElement("div", { className: "right menu" },
                debugging ? React.createElement(sui.ButtonMenuItem, { className: "exit-debugmode-btn", role: "menuitem", icon: "external", text: lf("Exit Debug Mode"), textClass: "landscape only", onClick: this.toggleDebug }) : undefined,
                docMenu ? React.createElement(container.DocsMenu, { parent: this.props.parent }) : undefined,
                sandbox || inTutorial || debugging ? undefined : React.createElement(container.SettingsMenu, { parent: this.props.parent, highContrast: highContrast, greenScreen: greenScreen }),
                sandbox && !targetTheme.hideEmbedEdit ? React.createElement(sui.Item, { role: "menuitem", icon: "external", textClass: "mobile hide", text: lf("Edit"), onClick: this.launchFullEditor }) : undefined,
                inTutorial && tutorialReportId ? React.createElement(sui.ButtonMenuItem, { className: "report-tutorial-btn", role: "menuitem", icon: "warning circle", text: lf("Report Abuse"), textClass: "landscape only", onClick: this.showReportAbuse }) : undefined,
                (inTutorial && !lockedEditor) && React.createElement(sui.ButtonMenuItem, { className: "exit-tutorial-btn", role: "menuitem", icon: "external", text: lf("Exit tutorial"), textClass: "landscape only", onClick: this.exitTutorial }),
                !sandbox ? React.createElement("a", { href: lockedEditor ? undefined : targetTheme.organizationUrl, "aria-label": lf("{0} Logo", targetTheme.organization), role: "menuitem", target: "blank", rel: "noopener", className: "ui item logo organization", onClick: lockedEditor ? undefined : this.orgIconClick },
                    targetTheme.organizationWideLogo || targetTheme.organizationLogo
                        ? React.createElement("img", { className: "ui logo " + (targetTheme.organizationWideLogo ? " portrait hide" : ''), src: targetTheme.organizationWideLogo || targetTheme.organizationLogo, alt: lf("{0} Logo", targetTheme.organization) })
                        : React.createElement("span", { className: "name" }, targetTheme.organization),
                    targetTheme.organizationLogo ? (React.createElement("img", { className: 'ui mini image portrait only', src: targetTheme.organizationLogo, alt: lf("{0} Logo", targetTheme.organization) })) : null) : undefined));
        /* tslint:enable:react-a11y-anchors */
    };
    return MainMenu;
}(data.Component));
exports.MainMenu = MainMenu;
var SideDocs = /** @class */ (function (_super) {
    __extends(SideDocs, _super);
    function SideDocs(props) {
        var _this = _super.call(this, props) || this;
        _this.openingSideDoc = false;
        _this.state = {};
        _this.toggleVisibility = _this.toggleVisibility.bind(_this);
        _this.popOut = _this.popOut.bind(_this);
        return _this;
    }
    SideDocs.notify = function (message) {
        var sd = document.getElementById("sidedocsframe");
        if (sd && sd.contentWindow)
            sd.contentWindow.postMessage(message, "*");
    };
    SideDocs.prototype.setPath = function (path, blocksEditor) {
        this.openingSideDoc = true;
        var docsUrl = pxt.webConfig.docsUrl || '/--docs';
        var mode = blocksEditor ? "blocks" : "js";
        var url = docsUrl + "#doc:" + path + ":" + mode + ":" + pxt.Util.localeInfo();
        this.setUrl(url);
    };
    SideDocs.prototype.setMarkdown = function (md) {
        var docsUrl = pxt.webConfig.docsUrl || '/--docs';
        // always render blocks by default when sending custom markdown
        // to side bar
        var mode = "blocks"; // this.props.parent.isBlocksEditor() ? "blocks" : "js";
        var url = docsUrl + "#md:" + encodeURIComponent(md) + ":" + mode + ":" + pxt.Util.localeInfo();
        this.setUrl(url);
        this.collapse();
    };
    SideDocs.prototype.setUrl = function (url) {
        this.props.parent.setState({ sideDocsLoadUrl: url, sideDocsCollapsed: false });
    };
    SideDocs.prototype.collapse = function () {
        this.props.parent.setState({ sideDocsCollapsed: true });
    };
    SideDocs.prototype.popOut = function () {
        SideDocs.notify({
            type: "popout"
        });
    };
    SideDocs.prototype.toggleVisibility = function () {
        var state = this.props.parent.state;
        this.props.parent.setState({ sideDocsCollapsed: !state.sideDocsCollapsed });
        document.getElementById("sidedocstoggle").focus();
    };
    SideDocs.prototype.componentDidUpdate = function () {
        this.props.parent.editor.resize();
        var sidedocstoggle = document.getElementById("sidedocstoggle");
        if (this.openingSideDoc && sidedocstoggle) {
            sidedocstoggle.focus();
            this.openingSideDoc = false;
        }
    };
    SideDocs.prototype.componentWillReceiveProps = function (nextProps) {
        var newState = {};
        if (nextProps.sideDocsCollapsed != undefined) {
            newState.sideDocsCollapsed = nextProps.sideDocsCollapsed;
        }
        if (nextProps.docsUrl != undefined) {
            newState.docsUrl = nextProps.docsUrl;
        }
        if (Object.keys(newState).length > 0)
            this.setState(newState);
    };
    SideDocs.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.sideDocsCollapsed != nextState.sideDocsCollapsed
            || this.state.docsUrl != nextState.docsUrl;
    };
    SideDocs.prototype.renderCore = function () {
        var _a = this.state, sideDocsCollapsed = _a.sideDocsCollapsed, docsUrl = _a.docsUrl;
        var isRTL = pxt.Util.isUserLanguageRtl();
        var showLeftChevron = (sideDocsCollapsed || isRTL) && !(sideDocsCollapsed && isRTL); // Collapsed XOR RTL
        var lockedEditor = !!pxt.appTarget.appTheme.lockedEditor;
        if (!docsUrl)
            return null;
        /* tslint:disable:react-iframe-missing-sandbox */
        return React.createElement("div", null,
            React.createElement("button", { id: "sidedocstoggle", role: "button", "aria-label": sideDocsCollapsed ? lf("Expand the side documentation") : lf("Collapse the side documentation"), className: "ui icon button large", onClick: this.toggleVisibility },
                React.createElement(sui.Icon, { icon: "icon inverted chevron " + (showLeftChevron ? 'left' : 'right') })),
            React.createElement("div", { id: "sidedocs" },
                React.createElement("div", { id: "sidedocsframe-wrapper" },
                    React.createElement("iframe", { id: "sidedocsframe", src: docsUrl, title: lf("Documentation"), "aria-atomic": "true", "aria-live": "assertive", sandbox: "allow-scripts allow-same-origin allow-forms " + (lockedEditor ? "" : "allow-popups") })),
                !lockedEditor && React.createElement("div", { className: "ui app hide", id: "sidedocsbar" },
                    React.createElement("a", { className: "ui icon link", role: "button", tabIndex: 0, "data-content": lf("Open documentation in new tab"), "aria-label": lf("Open documentation in new tab"), onClick: this.popOut, onKeyDown: sui.fireClickOnEnter },
                        React.createElement(sui.Icon, { icon: "external" })))));
        /* tslint:enable:react-iframe-missing-sandbox */
    };
    return SideDocs;
}(data.Component));
exports.SideDocs = SideDocs;
var SandboxFooter = /** @class */ (function (_super) {
    __extends(SandboxFooter, _super);
    function SandboxFooter(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.compile = _this.compile.bind(_this);
        return _this;
    }
    SandboxFooter.prototype.compile = function () {
        pxt.tickEvent("sandboxfooter.compile", undefined, { interactiveConsent: true });
        this.props.parent.compile();
    };
    SandboxFooter.prototype.renderCore = function () {
        var targetTheme = pxt.appTarget.appTheme;
        var compileTooltip = lf("Download your code to the {0}", targetTheme.boardName);
        /* tslint:disable:react-a11y-anchors */
        return React.createElement("div", { className: "ui horizontal small divided link list sandboxfooter" },
            targetTheme.organizationUrl && targetTheme.organization ? React.createElement("a", { className: "item", target: "_blank", rel: "noopener noreferrer", href: targetTheme.organizationUrl }, targetTheme.organization) : undefined,
            React.createElement("a", { target: "_blank", className: "item", href: targetTheme.termsOfUseUrl, rel: "noopener noreferrer" }, lf("Terms of Use")),
            React.createElement("a", { target: "_blank", className: "item", href: targetTheme.privacyUrl, rel: "noopener noreferrer" }, lf("Privacy")),
            React.createElement("span", { className: "item" },
                React.createElement("a", { role: "button", className: "ui thin portrait only", title: compileTooltip, onClick: this.compile },
                    React.createElement(sui.Icon, { icon: "icon " + (pxt.appTarget.appTheme.downloadIcon || 'download') }),
                    pxt.appTarget.appTheme.useUploadMessage ? lf("Upload") : lf("Download"))));
        /* tslint:enable:react-a11y-anchors */
    };
    return SandboxFooter;
}(data.PureComponent));
exports.SandboxFooter = SandboxFooter;
