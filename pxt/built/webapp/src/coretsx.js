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
var ReactDOM = require("react-dom");
var sui = require("./sui");
var core = require("./core");
var CoreDialog = /** @class */ (function (_super) {
    __extends(CoreDialog, _super);
    function CoreDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            inputValue: props.initialValue,
            inputError: undefined
        };
        _this.hide = _this.hide.bind(_this);
        _this.modalDidOpen = _this.modalDidOpen.bind(_this);
        _this.handleInputChange = _this.handleInputChange.bind(_this);
        return _this;
    }
    CoreDialog.prototype.hide = function () {
        this.close();
    };
    CoreDialog.prototype.close = function (result) {
        this.setState({ visible: false });
        this.resolve(result);
    };
    CoreDialog.prototype.componentDidMount = function () {
        var _this = this;
        this.promise = new Promise(function (res, rej) {
            _this.resolve = res;
            _this.reject = rej;
        });
        // Enable copyable
        var btn = this.refs["copybtn"];
        if (btn) {
            var btnDom = ReactDOM.findDOMNode(btn);
            btnDom.addEventListener('click', function () {
                try {
                    var inp = _this.refs["linkinput"];
                    inp.focus();
                    inp.setSelectionRange(0, inp.value.length);
                    document.execCommand("copy");
                }
                catch (e) {
                }
            });
        }
    };
    CoreDialog.prototype.modalDidOpen = function (ref) {
        var options = this.props;
        var dialogInput = this.refs['promptInput'];
        if (dialogInput) {
            dialogInput.setSelectionRange(0, 9999);
            var that_1 = this;
            dialogInput.onkeydown = function (e) {
                var charCode = core.keyCodeFromEvent(e);
                if (charCode === core.ENTER_KEY && that_1.okButton && dialogInput.value) {
                    that_1.okButton.onclick();
                    e.preventDefault();
                }
            };
        }
        if (options.onLoaded) {
            options.onLoaded(ref);
        }
    };
    CoreDialog.prototype.handleInputChange = function (v) {
        var options = this.props;
        if (options.onInputChanged)
            options.onInputChanged(v.target.value);
        var inputError;
        if (options.onInputValidation) {
            inputError = options.onInputValidation(v.target.value);
        }
        this.setState({ inputValue: v.target.value, inputError: inputError });
    };
    CoreDialog.prototype.render = function () {
        var _this = this;
        var options = this.props;
        var _a = this.state, inputValue = _a.inputValue, inputError = _a.inputError;
        var size = options.size === undefined ? 'small' : options.size;
        var buttons = options.buttons ? options.buttons.filter(function (b) { return !!b; }) : [];
        buttons.forEach(function (btn) {
            var onclick = btn.onclick;
            btn.onclick = function () {
                _this.close(onclick ? onclick() : 0);
            };
            if (!btn.className)
                btn.className = "approve positive";
            if (btn.approveButton)
                _this.okButton = btn;
        });
        if (options.type == 'prompt' && this.okButton)
            this.okButton.disabled = !inputValue || !!inputError;
        var classes = sui.cx([
            'coredialog',
            options.className
        ]);
        /* tslint:disable:react-no-dangerous-html TODO(tslint): This needs to be reviewed with a security expert to allow for exception */
        return (React.createElement(sui.Modal, { isOpen: true, ref: "modal", className: classes, onClose: this.hide, size: size, defaultOpen: true, buttons: buttons, dimmer: true, closeIcon: options.hasCloseIcon, header: options.header, closeOnDimmerClick: !options.hideCancel, closeOnDocumentClick: !options.hideCancel, closeOnEscape: !options.hideCancel, modalDidOpen: this.modalDidOpen },
            options.type == 'prompt' ? React.createElement("div", { className: "ui fluid icon input" },
                React.createElement("input", { autoFocus: true, className: "ui input " + (inputError ? "error" : ""), type: "text", ref: "promptInput", onChange: this.handleInputChange, value: inputValue, placeholder: options.placeholder }),
                inputError ? React.createElement("div", { className: "ui error message" }, inputError) : undefined) : undefined,
            options.jsx,
            options.jsxd ? options.jsxd() : undefined,
            options.body ? React.createElement("p", null, options.body) : undefined,
            options.copyable ? React.createElement("div", { className: "ui fluid action input" },
                React.createElement("input", { ref: "linkinput", className: "linkinput", readOnly: true, spellCheck: false, type: "text", value: "" + options.copyable }),
                React.createElement(sui.Button, { ref: "copybtn", labelPosition: 'right', color: "teal", className: 'copybtn', "data-content": lf("Copied!") })) : undefined));
        /* tslint:enable:react-no-dangerous-html */
    };
    return CoreDialog;
}(React.Component));
exports.CoreDialog = CoreDialog;
var currentDialog;
function dialogIsShowing() {
    return !!currentDialog;
}
exports.dialogIsShowing = dialogIsShowing;
function forceUpdate() {
    if (currentDialog)
        currentDialog.forceUpdate();
}
exports.forceUpdate = forceUpdate;
function renderConfirmDialogAsync(options) {
    return Promise.resolve()
        .delay(10)
        .then(function () {
        var wrapper = document.body.appendChild(document.createElement('div'));
        var newDialog = ReactDOM.render(React.createElement(CoreDialog, options), wrapper);
        currentDialog = newDialog;
        function cleanup() {
            ReactDOM.unmountComponentAtNode(wrapper);
            setTimeout(function () {
                wrapper.parentElement.removeChild(wrapper);
                if (newDialog === currentDialog)
                    currentDialog = undefined;
            });
        }
        return newDialog.promise.finally(function () { return cleanup(); });
    });
}
exports.renderConfirmDialogAsync = renderConfirmDialogAsync;
function hideDialog() {
    if (currentDialog) {
        currentDialog.hide();
        currentDialog = undefined;
    }
}
exports.hideDialog = hideDialog;
var LoadingDimmer = /** @class */ (function (_super) {
    __extends(LoadingDimmer, _super);
    function LoadingDimmer(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            visible: true
        };
        return _this;
    }
    LoadingDimmer.prototype.hide = function () {
        this.setState({ visible: false, content: undefined });
    };
    LoadingDimmer.prototype.show = function (content) {
        this.setState({ visible: true, content: content });
    };
    LoadingDimmer.prototype.isVisible = function () {
        return this.state.visible;
    };
    LoadingDimmer.prototype.render = function () {
        var _a = this.state, visible = _a.visible, content = _a.content;
        if (!visible)
            return React.createElement("div", null);
        return React.createElement(sui.Dimmer, { isOpen: true, active: visible, closable: false },
            React.createElement(sui.Loader, { className: "large main msg no-select", "aria-live": "assertive" }, content));
    };
    return LoadingDimmer;
}(React.Component));
exports.LoadingDimmer = LoadingDimmer;
var NotificationMessages = /** @class */ (function (_super) {
    __extends(NotificationMessages, _super);
    function NotificationMessages(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            notifications: {}
        };
        return _this;
    }
    NotificationMessages.prototype.push = function (notification) {
        var _this = this;
        var notifications = this.state.notifications;
        var id = ts.pxtc.Util.guidGen();
        Object.keys(notifications).filter(function (e) { return notifications[e].kind == notification.kind; })
            .forEach(function (previousNotification) { return _this.remove(previousNotification); });
        notifications[id] = notification;
        var that = this;
        // Show for 3 seconds before removing
        setTimeout(function () {
            that.remove(id);
        }, 3000);
        this.setState({ notifications: notifications });
    };
    NotificationMessages.prototype.remove = function (id) {
        var notifications = this.state.notifications;
        if (notifications[id]) {
            delete notifications[id];
            this.setState({ notifications: notifications });
        }
    };
    NotificationMessages.prototype.render = function () {
        var notifications = this.state.notifications;
        function renderNotification(id, notification) {
            var kind = notification.kind, text = notification.text, hc = notification.hc;
            var cls = 'ignored info message';
            switch (kind) {
                case 'err':
                    cls = 'red inverted segment';
                    break;
                case 'warn':
                    cls = 'orange inverted segment';
                    break;
                case 'info':
                    cls = 'teal inverted segment';
                    break;
                case 'compile':
                    cls = 'ignored info message';
                    break;
            }
            return React.createElement("div", { key: "" + id, id: kind + "msg", className: "ui " + hc + " " + cls }, text);
        }
        return React.createElement("div", { id: "msg", "aria-live": "polite" }, Object.keys(notifications).map(function (k) { return renderNotification(k, notifications[k]); }));
    };
    return NotificationMessages;
}(React.Component));
exports.NotificationMessages = NotificationMessages;
var notificationsInitialized = false;
var notificationMessages;
function pushNotificationMessage(options) {
    if (!notificationsInitialized) {
        notificationsInitialized = true;
        var wrapper = document.body.appendChild(document.createElement('div'));
        notificationMessages = ReactDOM.render(React.createElement(NotificationMessages, options), wrapper);
        notificationMessages.push(options);
    }
    else if (notificationMessages) {
        notificationMessages.push(options);
    }
}
exports.pushNotificationMessage = pushNotificationMessage;
