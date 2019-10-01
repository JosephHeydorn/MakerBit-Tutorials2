"use strict";
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
var pkg = require("./package");
var srceditor = require("./srceditor");
var sui = require("./sui");
var core = require("./core");
var data = require("./data");
var Util = pxt.Util;
var Editor = /** @class */ (function (_super) {
    __extends(Editor, _super);
    function Editor(parent) {
        var _this = _super.call(this, parent) || this;
        _this.parent = parent;
        _this.config = {};
        _this.changeMade = false;
        _this.handleNameInputRef = function (c) {
            _this.nameInput = c;
        };
        _this.editSettingsText = _this.editSettingsText.bind(_this);
        _this.save = _this.save.bind(_this);
        _this.setFileName = _this.setFileName.bind(_this);
        _this.isUserConfigActive = _this.isUserConfigActive.bind(_this);
        _this.applyUserConfig = _this.applyUserConfig.bind(_this);
        _this.goBack = _this.goBack.bind(_this);
        return _this;
    }
    Editor.prototype.goBack = function () {
        pxt.tickEvent("pxtjson.backButton", undefined, { interactiveConsent: true });
        this.parent.openPreviousEditor();
    };
    Editor.prototype.prepare = function () {
        this.isReady = true;
    };
    Editor.prototype.getId = function () {
        return "pxtJsonEditor";
    };
    Editor.prototype.hasEditorToolbar = function () {
        return false;
    };
    Editor.prototype.save = function () {
        var _this = this;
        var c = this.config;
        this.isSaving = true;
        if (!c.name) {
            // Error saving no name
            core.errorNotification(lf("Please choose a project name. It can't be blank."));
            this.isSaving = false;
            return;
        }
        var f = pkg.mainEditorPkg().lookupFile("this/" + pxt.CONFIG_NAME);
        f.setContentAsync(JSON.stringify(this.config, null, 4) + "\n").then(function () {
            pkg.mainPkg.config.name = c.name;
            _this.parent.setState({ projectName: c.name });
            _this.parent.forceUpdate();
            Util.nextTick(_this.changeCallback);
            _this.isSaving = false;
            _this.changeMade = true;
            // switch to previous coding experience
            _this.parent.openPreviousEditor();
            core.resetFocus();
        });
    };
    Editor.prototype.setFileName = function (v) {
        var c = this.config;
        c.name = v;
        this.parent.forceUpdate();
    };
    Editor.prototype.optionaldepConfig = function () {
        // will contain all flatton configs
        var cfg = {};
        // look at all config coming dependencies
        pkg.mainPkg.sortedDeps()
            .filter(function (dep) { return dep.config && dep.config.yotta && dep.config.yotta.optionalConfig; })
            .forEach(function (dep) { return Util.jsonMergeFrom(cfg, dep.config.yotta.optionalConfig); });
        return cfg;
    };
    Editor.prototype.isUserConfigActive = function (uc) {
        var cfg = this.optionaldepConfig();
        if (this.config.yotta && this.config.yotta.config)
            Util.jsonMergeFrom(cfg, this.config.yotta.config);
        // flatten configs
        cfg = Util.jsonFlatten(cfg);
        var ucfg = Util.jsonFlatten(uc.config);
        return !Object.keys(ucfg).some(function (k) { return ucfg[k] === null ? !!cfg[k] : cfg[k] !== ucfg[k]; });
    };
    Editor.prototype.applyUserConfig = function (uc) {
        var depcfg = Util.jsonFlatten(this.optionaldepConfig());
        var prjcfg = Util.jsonFlatten(this.config.yotta ? this.config.yotta.config : {});
        var usercfg = Util.jsonFlatten(uc.config);
        if (this.isUserConfigActive(uc)) {
            Object.keys(usercfg).forEach(function (k) {
                delete prjcfg[k];
            });
        }
        else {
            Object.keys(usercfg).forEach(function (k) { return prjcfg[k] = usercfg[k]; });
        }
        // update cfg
        if (Object.keys(prjcfg).length) {
            if (!this.config.yotta)
                this.config.yotta = {};
            this.config.yotta.config = Util.jsonUnFlatten(prjcfg);
        }
        else {
            if (this.config.yotta) {
                delete this.config.yotta.config;
                if (!Object.keys(this.config.yotta).length)
                    delete this.config.yotta;
            }
        }
        // trigger update            
        this.save();
    };
    Editor.prototype.display = function () {
        var _this = this;
        if (!this.isVisible)
            return undefined;
        var c = this.config;
        var userConfigs = [];
        pkg.allEditorPkgs().map(function (ep) { return ep.getKsPkg(); })
            .filter(function (dep) { return !!dep && dep.isLoaded && !!dep.config && !!dep.config.yotta && !!dep.config.yotta.userConfigs; })
            .forEach(function (dep) { return userConfigs = userConfigs.concat(dep.config.yotta.userConfigs); });
        return (React.createElement("div", { className: "ui content" },
            React.createElement("h3", { className: "ui small header" },
                React.createElement("div", { className: "content" },
                    React.createElement(sui.Button, { title: lf("Go back"), tabIndex: 0, onClick: this.goBack, onKeyDown: sui.fireClickOnEnter },
                        React.createElement(sui.Icon, { icon: "arrow left" }),
                        React.createElement("span", { className: "ui text landscape only" }, lf("Go back"))))),
            React.createElement("div", { className: "ui segment form text" },
                React.createElement(sui.Input, { ref: this.handleNameInputRef, id: "fileNameInput", label: lf("Name"), ariaLabel: lf("Type a name for your project"), value: c.name || '', onChange: this.setFileName, autoComplete: false }),
                userConfigs.map(function (uc) {
                    return React.createElement(UserConfigCheckbox, { key: "userconfig-" + uc.description, uc: uc, isUserConfigActive: _this.isUserConfigActive, applyUserConfig: _this.applyUserConfig });
                }),
                React.createElement(sui.Field, null,
                    React.createElement(sui.Button, { text: lf("Save"), className: "green " + (this.isSaving ? 'disabled' : ''), onClick: this.save }),
                    React.createElement(sui.Button, { text: lf("Edit Settings As text"), onClick: this.editSettingsText })))));
    };
    Editor.prototype.isIncomplete = function () {
        return !this.changeMade;
    };
    Editor.prototype.editSettingsText = function () {
        this.changeMade = false;
        this.parent.editText();
    };
    Editor.prototype.getCurrentSource = function () {
        return JSON.stringify(this.config, null, 4) + "\n";
    };
    Editor.prototype.acceptsFile = function (file) {
        if (file.name != pxt.CONFIG_NAME)
            return false;
        if (file.isReadonly()) {
            // TODO add read-only support
            return false;
        }
        try {
            var cfg = JSON.parse(file.content);
            // TODO validate?
            return true;
        }
        catch (e) {
            return false;
        }
    };
    Editor.prototype.loadFileAsync = function (file) {
        this.config = JSON.parse(file.content);
        if (this.nameInput)
            this.nameInput.clearValue();
        this.setDiagnostics(file, this.snapshotState());
        this.changeMade = false;
        return Promise.resolve();
    };
    Editor.prototype.unloadFileAsync = function () {
        if (this.changeMade) {
            return this.parent.reloadHeaderAsync();
        }
        return Promise.resolve();
    };
    return Editor;
}(srceditor.Editor));
exports.Editor = Editor;
var UserConfigCheckbox = /** @class */ (function (_super) {
    __extends(UserConfigCheckbox, _super);
    function UserConfigCheckbox(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.isUserConfigActive = _this.isUserConfigActive.bind(_this);
        _this.applyUserConfig = _this.applyUserConfig.bind(_this);
        return _this;
    }
    UserConfigCheckbox.prototype.isUserConfigActive = function () {
        var _a = this.props, applyUserConfig = _a.applyUserConfig, isUserConfigActive = _a.isUserConfigActive, uc = _a.uc;
        return isUserConfigActive(uc);
    };
    UserConfigCheckbox.prototype.applyUserConfig = function () {
        var _a = this.props, applyUserConfig = _a.applyUserConfig, isUserConfigActive = _a.isUserConfigActive, uc = _a.uc;
        applyUserConfig(uc);
    };
    UserConfigCheckbox.prototype.renderCore = function () {
        var uc = this.props.uc;
        var isChecked = this.isUserConfigActive();
        return React.createElement(sui.Checkbox, { key: "userconfig-" + uc.description, inputLabel: uc.description, checked: isChecked, onChange: this.applyUserConfig });
    };
    return UserConfigCheckbox;
}(data.Component));
