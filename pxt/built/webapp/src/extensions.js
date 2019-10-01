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
var core = require("./core");
var sui = require("./sui");
var ext = require("./extensionManager");
var CUSTOM_CONTENT_DIV = 'custom-content';
var Extensions = /** @class */ (function (_super) {
    __extends(Extensions, _super);
    function Extensions(props) {
        var _this = _super.call(this, props) || this;
        _this.handleExtensionWrapperRef = function (c) {
            _this.extensionWrapper = c;
        };
        _this.state = {
            visible: false,
            consent: false
        };
        _this.manager = new ext.ExtensionManager(_this);
        window.addEventListener("message", _this.processMessage.bind(_this), false);
        _this.hide = _this.hide.bind(_this);
        _this.updateDimensions = _this.updateDimensions.bind(_this);
        _this.onApprovedDecision = _this.onApprovedDecision.bind(_this);
        _this.onDeniedDecision = _this.onDeniedDecision.bind(_this);
        return _this;
    }
    Extensions.prototype.processMessage = function (ev) {
        var _this = this;
        var msg = ev.data;
        if (msg.type !== "serial")
            return;
        var smsg = msg;
        var exts = this.manager.streamingExtensions();
        if (!exts || !exts.length)
            return;
        var data = smsg.data || "";
        var source = smsg.id || "?";
        // called by app when a serial entry is read
        exts.forEach(function (n) {
            _this.send(n, {
                target: pxt.appTarget.id,
                type: "pxtpkgext",
                event: "extconsole",
                body: {
                    source: source,
                    sim: smsg.sim,
                    data: data
                }
            });
        });
    };
    Extensions.prototype.hide = function () {
        var _this = this;
        this.setState({ visible: false });
        var frame = Extensions.getFrame(this.state.extension, true);
        frame.style.display = 'none';
        // reload project to update changes from the editor
        core.showLoading("reloadproject", lf("loading..."));
        this.props.parent.reloadHeaderAsync()
            .done(function () {
            _this.send(_this.state.extension, { target: pxt.appTarget.id, type: "pxtpkgext", event: "exthidden" });
            core.hideLoading("reloadproject");
        });
    };
    Extensions.prototype.showExtension = function (extension, url, consentRequired) {
        var _this = this;
        var consent = consentRequired ? this.manager.hasConsent(this.manager.getExtId(extension)) : true;
        this.setState({ visible: true, extension: extension, url: url, consent: consent }, function () {
            _this.send(extension, { target: pxt.appTarget.id, type: "pxtpkgext", event: "extshown" });
        });
    };
    Extensions.prototype.submitConsent = function () {
        this.manager.setConsent(this.manager.getExtId(this.state.extension), true);
        this.setState({ consent: true });
    };
    Extensions.prototype.initializeFrame = function () {
        var _this = this;
        this.manager.setConsent(this.manager.getExtId(this.state.extension), true);
        var frame = Extensions.getFrame(this.state.extension, true);
        frame.style.display = 'block';
        if (!frame.src) {
            frame.src = this.state.url + "#" + this.manager.getExtId(this.state.extension);
            frame.onload = function () {
                _this.send(_this.state.extension, { target: pxt.appTarget.id, type: "pxtpkgext", event: "extloaded" });
            };
        }
    };
    Extensions.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.visible != nextState.visible
            || this.state.extension != nextState.extension
            || this.state.permissionRequest != nextState.permissionRequest
            || this.state.consent != nextState.consent;
    };
    Extensions.prototype.updateDimensions = function () {
        if (this.extensionWrapper) {
            // Resize current frame to fit full screen
            var topOffsetHeight = 60; //px
            var extension = this.extensionWrapper.getAttribute('data-frame');
            if (extension) {
                var frame = Extensions.getFrame(extension, false);
                var extensionDialog = document.getElementsByClassName('extensiondialog')[0];
                if (extensionDialog && frame) {
                    var bb = extensionDialog.getBoundingClientRect();
                    frame.width = window.innerWidth + "px";
                    frame.height = window.innerHeight - topOffsetHeight + "px";
                    frame.style.top = topOffsetHeight + "px";
                    frame.style.left = 0 + "px";
                }
            }
        }
    };
    Extensions.prototype.componentDidMount = function () {
        window.addEventListener("resize", this.updateDimensions);
    };
    Extensions.prototype.componentWillUnmount = function () {
        window.removeEventListener("resize", this.updateDimensions);
    };
    Extensions.prototype.componentDidUpdate = function () {
        var _this = this;
        setTimeout(function () {
            _this.updateDimensions();
        }, 0);
    };
    Extensions.prototype.componentWillUpdate = function (nextProps, nextState) {
        if (nextState.extension && nextState.visible) {
            // Start rendering the iframe earlier
            var frame = Extensions.getFrame(nextState.extension, true);
        }
    };
    Extensions.prototype.handleExtensionRequest = function (request) {
        this.manager.handleExtensionMessage(request);
    };
    Extensions.prototype.send = function (name, editorMessage) {
        var frame = Extensions.getFrame(name, false);
        if (frame) {
            frame.contentWindow.postMessage(editorMessage, "*");
        }
        else {
            console.warn("Attempting to post message to unloaded extesnion " + name);
        }
    };
    Extensions.prototype.promptForPermissionAsync = function (id, permissions) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.permissionCb = resolve;
            _this.setState({
                permissionRequest: permissions,
                permissionExtName: id
            });
        });
    };
    Extensions.prototype.onApprovedDecision = function () {
        this.onPermissionDecision(true);
    };
    Extensions.prototype.onDeniedDecision = function () {
        this.onPermissionDecision(false);
    };
    Extensions.prototype.onPermissionDecision = function (approved) {
        this.permissionCb(approved);
        this.permissionCb = undefined;
        this.setState({
            permissionRequest: null,
            permissionExtName: null
        });
    };
    Extensions.getCustomContent = function () {
        return document.getElementById(CUSTOM_CONTENT_DIV);
    };
    Extensions.getFrame = function (name, createIfMissing) {
        var customContent = this.getCustomContent();
        var frame = customContent.getElementsByClassName("extension-frame-" + name)[0];
        if (!frame && createIfMissing) {
            frame = this.createFrame(name);
        }
        return frame;
    };
    Extensions.createFrame = function (name) {
        var wrapper = this.getCustomContent();
        var frame = document.createElement('iframe');
        frame.className = "extension-frame extension-frame-" + name;
        frame.allowFullscreen = true;
        frame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
        frame.frameBorder = "0";
        frame.style.display = "none";
        wrapper.appendChild(frame);
        return frame;
    };
    Extensions.hideAllFrames = function () {
        var customContent = this.getCustomContent();
        if (customContent) {
            pxt.Util.toArray(customContent.getElementsByClassName("extension-frame")).forEach(function (frame) {
                frame.style.zIndex = '10';
            });
        }
    };
    Extensions.showAllFrames = function () {
        var customContent = this.getCustomContent();
        if (customContent) {
            pxt.Util.toArray(customContent.getElementsByClassName("extension-frame")).forEach(function (frame) {
                frame.style.zIndex = '';
            });
        }
    };
    Extensions.prototype.getIconForPermission = function (permission) {
        switch (permission) {
            case ext.Permissions.Console:
                return "terminal";
            case ext.Permissions.ReadUserCode:
                return "code";
        }
        return "";
    };
    Extensions.prototype.getDisplayNameForPermission = function (permission) {
        switch (permission) {
            case ext.Permissions.Console:
                return lf("Console output");
            case ext.Permissions.ReadUserCode:
                return lf("Read your code");
        }
        return "";
    };
    Extensions.prototype.getDescriptionForPermission = function (permission) {
        switch (permission) {
            case ext.Permissions.Console:
                return lf("The extension will be able to read any console output (including device data) streamed to the editor");
            case ext.Permissions.ReadUserCode:
                return lf("The extension will be able to read the code in the current project");
        }
        return "";
    };
    Extensions.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, visible = _a.visible, extension = _a.extension, consent = _a.consent, permissionRequest = _a.permissionRequest, permissionExtName = _a.permissionExtName;
        var needsConsent = !consent;
        if (permissionRequest) {
            Extensions.hideAllFrames();
        }
        else {
            Extensions.showAllFrames();
        }
        var action = needsConsent ? lf("Agree") : undefined;
        var actionClick = function () {
            _this.submitConsent();
        };
        var actions = action ? [{ label: action, onclick: actionClick }] : undefined;
        if (!needsConsent && visible)
            this.initializeFrame();
        return (React.createElement(sui.Modal, { isOpen: visible, className: "" + (needsConsent ? 'extensionconsentdialog' : 'extensiondialog'), size: needsConsent ? 'small' : 'fullscreen', closeIcon: true, onClose: this.hide, dimmer: true, buttons: actions, modalDidOpen: this.updateDimensions, shouldFocusAfterRender: false, onPositionChanged: this.updateDimensions, closeOnDimmerClick: true }, consent ?
            React.createElement("div", { id: "extensionWrapper", "data-frame": extension, ref: this.handleExtensionWrapperRef }, permissionRequest ?
                React.createElement(sui.Modal, { isOpen: true, className: "extensionpermissiondialog basic", closeIcon: false, dimmer: true, dimmerClassName: "permissiondimmer" },
                    React.createElement("div", { className: "permissiondialoginner" },
                        React.createElement("div", { className: "permissiondialogheader" }, lf("Permission Request")),
                        React.createElement("div", { className: "permissiondialogbody" }, lf("Extension {0} is requesting the following permission(s):", permissionExtName)),
                        React.createElement("div", { className: "ui inverted list" }, permissionRequest.map(function (permission) {
                            return React.createElement("div", { key: permission.toString(), className: "item" },
                                React.createElement(sui.Icon, { icon: _this.getIconForPermission(permission) + " icon" }),
                                React.createElement("div", { className: "content" },
                                    React.createElement("div", { className: "header" }, _this.getDisplayNameForPermission(permission)),
                                    React.createElement("div", { className: "description" }, _this.getDescriptionForPermission(permission))));
                        }))),
                    React.createElement("div", { className: "actions" },
                        React.createElement(sui.Button, { text: lf("Deny"), className: "deny inverted", onClick: this.onDeniedDecision }),
                        React.createElement(sui.Button, { text: lf("Approve"), className: "approve inverted green", onClick: this.onApprovedDecision })))
                : undefined)
            : React.createElement("div", null,
                React.createElement("div", { className: "ui form" },
                    React.createElement("div", { className: "ui icon violet message" },
                        React.createElement(sui.Icon, { icon: "user" }),
                        React.createElement("div", { className: "content" },
                            React.createElement("h3", { className: "header" }, lf("User-provided content")),
                            React.createElement("p", null,
                                lf("This content is provided by a user, and is not endorsed by Microsoft."),
                                React.createElement("br", null),
                                lf("If you think it's not appropriate, please report abuse through Settings -> Report Abuse."))))))));
    };
    return Extensions;
}(data.Component));
exports.Extensions = Extensions;
