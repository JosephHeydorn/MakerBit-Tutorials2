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
var data = require("./data");
var sui = require("./sui");
function isMediaDevicesSupported() {
    return typeof navigator !== undefined
        && !!navigator.mediaDevices
        && !!navigator.mediaDevices.enumerateDevices
        && !!navigator.mediaDevices.getUserMedia
        && !pxt.BrowserUtils.isElectron()
        && !pxt.BrowserUtils.isUwpEdge();
}
var WebCam = /** @class */ (function (_super) {
    __extends(WebCam, _super);
    function WebCam(props) {
        var _this = _super.call(this, props) || this;
        _this.handleVideoRef = function (ref) {
            _this.video = ref;
        };
        _this.state = {
            hasPrompt: true
        };
        _this.handleDeviceClick = _this.handleDeviceClick.bind(_this);
        _this.handleClose = _this.handleClose.bind(_this);
        return _this;
    }
    WebCam.prototype.handleDeviceClick = function (deviceId) {
        var _this = this;
        this.setState({ hasPrompt: false });
        this.deviceId = deviceId;
        // deviceId is "" if green screen selected
        if (this.deviceId) {
            navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                audio: false
            }).then(function (stream) {
                try {
                    _this.stream = stream;
                    _this.video.srcObject = _this.stream;
                    _this.video.play();
                    // store info
                    var track = _this.stream.getVideoTracks()[0];
                    if (track) {
                        var settings = track.getSettings();
                        // https://w3c.github.io/mediacapture-main/#dom-videofacingmodeenum
                        var userFacing = settings.facingMode !== "environment";
                        _this.setState({ userFacing: userFacing });
                    }
                }
                catch (e) {
                    pxt.debug("greenscreen: play failed, " + e);
                    _this.stop();
                }
            }, function (err) {
                _this.stop();
            });
        }
    };
    WebCam.prototype.handleClose = function () {
        if (!this.deviceId) {
            this.props.close();
        }
    };
    WebCam.prototype.componentDidMount = function () {
        var _this = this;
        if (isMediaDevicesSupported())
            navigator.mediaDevices.enumerateDevices()
                .then(function (devices) {
                _this.setState({ devices: devices.filter(function (device) { return device.kind == "videoinput"; }) });
            });
    };
    WebCam.prototype.componentWillUnmount = function () {
        this.stop();
    };
    WebCam.prototype.stop = function () {
        this.deviceId = undefined;
        if (this.stream) {
            try {
                if (this.stream.stop)
                    this.stream.stop();
            }
            catch (e) { }
            try {
                var tracks = this.stream.getTracks();
                if (tracks)
                    tracks.forEach(function (track) { return track.stop(); });
            }
            catch (e) { }
            this.stream = undefined;
        }
        if (this.video) {
            try {
                this.video.srcObject = undefined;
            }
            catch (e) { }
        }
    };
    WebCam.prototype.render = function () {
        var _this = this;
        // playsInline required for iOS
        var _a = this.state, hasPrompt = _a.hasPrompt, devices = _a.devices, userFacing = _a.userFacing;
        return React.createElement("div", { className: "videoContainer" },
            React.createElement("video", { className: userFacing ? "flipx" : "", autoPlay: true, playsInline: true, ref: this.handleVideoRef }),
            hasPrompt ?
                React.createElement(sui.Modal, { isOpen: hasPrompt, onClose: this.handleClose, closeIcon: true, dimmer: true, header: lf("Choose a camera") },
                    React.createElement("div", { className: "ui cards " + (!devices ? 'loading' : '') },
                        React.createElement(WebCamCard, { key: "devicegreenscreen", icon: 'green tint', onClick: this.handleDeviceClick, deviceId: "", header: lf("Green background") }),
                        devices && devices
                            .map(function (device, di) {
                            return React.createElement(WebCamCard, { key: "device" + di, icon: 'video camera', onClick: _this.handleDeviceClick, deviceId: device.deviceId, header: device.label || lf("camera {0}", di) });
                        })))
                : undefined);
    };
    return WebCam;
}(data.Component));
exports.WebCam = WebCam;
var WebCamCard = /** @class */ (function (_super) {
    __extends(WebCamCard, _super);
    function WebCamCard(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    WebCamCard.prototype.handleClick = function () {
        var _a = this.props, deviceId = _a.deviceId, onClick = _a.onClick;
        onClick(deviceId);
    };
    WebCamCard.prototype.renderCore = function () {
        var _a = this.props, header = _a.header, icon = _a.icon;
        return React.createElement("div", { role: "button", className: "ui card link", onClick: this.handleClick },
            React.createElement("div", { className: "imageicon" },
                React.createElement(sui.Icon, { icon: icon + " massive" })),
            React.createElement("div", { className: "content" },
                React.createElement("span", { className: "header" }, header)));
    };
    return WebCamCard;
}(data.Component));
