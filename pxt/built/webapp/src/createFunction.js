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
var CreateFunctionDialog = /** @class */ (function (_super) {
    __extends(CreateFunctionDialog, _super);
    function CreateFunctionDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            visible: false,
            functionEditorWorkspace: null,
            functionCallback: null,
            initialMutation: null,
            functionBeingEdited: null
        };
        _this.hide = _this.hide.bind(_this);
        _this.modalDidOpen = _this.modalDidOpen.bind(_this);
        _this.cancel = _this.cancel.bind(_this);
        _this.confirm = _this.confirm.bind(_this);
        return _this;
    }
    CreateFunctionDialog.prototype.hide = function () {
        pxt.BrowserUtils.removeClass(Blockly.WidgetDiv.DIV, "functioneditor");
        var _a = this.state, functionEditorWorkspace = _a.functionEditorWorkspace, mainWorkspace = _a.mainWorkspace;
        functionEditorWorkspace.clear();
        functionEditorWorkspace.dispose();
        mainWorkspace.refreshToolboxSelection();
        this.setState({
            visible: false, functionEditorWorkspace: null,
            functionCallback: null,
            initialMutation: null,
            functionBeingEdited: null
        });
    };
    CreateFunctionDialog.prototype.show = function (initialMutation, cb, mainWorkspace) {
        pxt.tickEvent('createfunction.show', null, { interactiveConsent: false });
        this.setState({
            visible: true,
            functionCallback: cb,
            initialMutation: initialMutation,
            mainWorkspace: mainWorkspace
        });
    };
    CreateFunctionDialog.prototype.modalDidOpen = function (ref) {
        var _this = this;
        var workspaceDiv = document.getElementById('functionEditorWorkspace');
        var _a = this.state, functionEditorWorkspace = _a.functionEditorWorkspace, initialMutation = _a.initialMutation;
        if (!workspaceDiv) {
            return;
        }
        // Adjust the WidgetDiv classname so that it can show up above the dimmer
        pxt.BrowserUtils.addClass(Blockly.WidgetDiv.DIV, "functioneditor");
        // Create the function editor workspace
        functionEditorWorkspace = Blockly.inject(workspaceDiv, {
            trashcan: false,
            scrollbars: true
        });
        functionEditorWorkspace.showContextMenu_ = function () { }; // Disable the context menu
        functionEditorWorkspace.clear();
        var functionBeingEdited = functionEditorWorkspace.newBlock('function_declaration');
        functionBeingEdited.domToMutation(initialMutation);
        functionBeingEdited.initSvg();
        functionBeingEdited.render(false);
        functionEditorWorkspace.centerOnBlock(functionBeingEdited.id);
        functionEditorWorkspace.addChangeListener(function () {
            var functionBeingEdited = _this.state.functionBeingEdited;
            if (functionBeingEdited) {
                functionBeingEdited.updateFunctionSignature();
            }
        });
        this.setState({
            functionEditorWorkspace: functionEditorWorkspace,
            functionBeingEdited: functionBeingEdited
        });
        Blockly.svgResize(functionEditorWorkspace);
    };
    CreateFunctionDialog.prototype.cancel = function () {
        pxt.tickEvent("createfunction.cancel", undefined, { interactiveConsent: true });
        this.hide();
    };
    CreateFunctionDialog.prototype.confirm = function () {
        Blockly.hideChaff();
        var _a = this.state, functionBeingEdited = _a.functionBeingEdited, mainWorkspace = _a.mainWorkspace, functionCallback = _a.functionCallback;
        var mutation = functionBeingEdited.mutationToDom();
        if (Blockly.Functions.validateFunctionExternal(mutation, mainWorkspace)) {
            functionCallback(mutation);
            this.hide();
        }
    };
    CreateFunctionDialog.prototype.addArgumentFactory = function (typeName) {
        var _this = this;
        return function () { return _this.addArgument(typeName); };
    };
    CreateFunctionDialog.prototype.addArgument = function (typeName) {
        var functionBeingEdited = this.state.functionBeingEdited;
        switch (typeName) {
            case "boolean":
                functionBeingEdited.addBooleanExternal();
                break;
            case "string":
                functionBeingEdited.addStringExternal();
                break;
            case "number":
                functionBeingEdited.addNumberExternal();
                break;
            default:
                functionBeingEdited.addCustomExternal(typeName);
                break;
        }
    };
    // TODO fix mobile confirm buttons (no text, but still space for text)
    CreateFunctionDialog.prototype.renderCore = function () {
        var _this = this;
        var visible = this.state.visible;
        var actions = [
            {
                label: lf("Cancel"),
                onclick: this.hide,
                icon: "cancel",
                className: "cancel lightgrey"
            },
            {
                label: lf("Done"),
                onclick: this.confirm,
                icon: "check",
                className: "approve positive"
            }
        ];
        var types = this.getArgumentTypes().slice();
        return (React.createElement(sui.Modal, { isOpen: visible, className: "createfunction", size: "large", closeOnEscape: false, closeIcon: false, closeOnDimmerClick: false, closeOnDocumentClick: false, dimmer: true, buttons: actions, header: lf("Edit Function"), modalDidOpen: this.modalDidOpen },
            React.createElement("div", null,
                React.createElement("span", { className: "ui text mobile only paramlabel" }, lf("Add a parameter")),
                React.createElement("div", { className: "horizontal list" },
                    React.createElement("span", { className: "ui text mobile hide paramlabel" }, lf("Add a parameter")),
                    types.map(function (t) {
                        return React.createElement(sui.Button, { key: t.typeName, role: "button", className: "icon", icon: t.icon, textClass: "mobile hide", text: t.label || t.typeName, ariaLabel: lf("Add {0} parameter", t.label || t.typeName), onClick: _this.addArgumentFactory(t.typeName) });
                    })),
                React.createElement("div", { id: "functionEditorWorkspace" }))));
    };
    CreateFunctionDialog.prototype.getArgumentTypes = function () {
        if (!CreateFunctionDialog.cachedFunctionTypes) {
            var types_1 = [
                {
                    label: lf("Text"),
                    typeName: "string",
                    icon: pxt.blocks.defaultIconForArgType("string")
                },
                {
                    label: lf("Boolean"),
                    typeName: "boolean",
                    icon: pxt.blocks.defaultIconForArgType("boolean")
                },
                {
                    label: lf("Number"),
                    typeName: "number",
                    icon: pxt.blocks.defaultIconForArgType("number")
                }
            ];
            if (pxt.appTarget.runtime &&
                pxt.appTarget.runtime.functionsOptions &&
                pxt.appTarget.runtime.functionsOptions.extraFunctionEditorTypes &&
                Array.isArray(pxt.appTarget.runtime.functionsOptions.extraFunctionEditorTypes)) {
                pxt.appTarget.runtime.functionsOptions.extraFunctionEditorTypes.forEach(function (t) {
                    types_1.push(t);
                });
            }
            types_1.forEach(function (t) {
                if (!t.icon) {
                    t.icon = pxt.blocks.defaultIconForArgType();
                }
            });
            CreateFunctionDialog.cachedFunctionTypes = types_1;
        }
        return CreateFunctionDialog.cachedFunctionTypes;
    };
    CreateFunctionDialog.cachedFunctionTypes = null;
    return CreateFunctionDialog;
}(data.Component));
exports.CreateFunctionDialog = CreateFunctionDialog;
