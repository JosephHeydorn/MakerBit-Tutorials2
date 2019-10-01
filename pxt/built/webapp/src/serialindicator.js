"use strict";
/// <reference path="../../built/pxtsim.d.ts" />
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
var sui = require("./sui");
var data = require("./data");
var SerialIndicator = /** @class */ (function (_super) {
    __extends(SerialIndicator, _super);
    function SerialIndicator(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { active: false };
        return _this;
    }
    SerialIndicator.prototype.componentDidMount = function () {
        window.addEventListener("message", this.setActive.bind(this));
    };
    SerialIndicator.prototype.componentWillUnmount = function () {
        window.addEventListener("message", this.setActive.bind(this));
    };
    SerialIndicator.prototype.setActive = function (ev) {
        var msg = ev.data;
        if (!this.state.active && (msg.type === "serial" || msg.type === "bulkserial")) {
            var sim = !!msg.sim;
            if (sim === this.props.isSim) {
                this.setState({ active: true });
            }
        }
    };
    SerialIndicator.prototype.clear = function () {
        this.setState({ active: false });
    };
    SerialIndicator.prototype.renderCore = function () {
        if (!this.state.active)
            return React.createElement("div", null);
        return (React.createElement("div", { role: "button", title: lf("Open console"), className: "ui label circular", tabIndex: 0, onClick: this.props.onClick, onKeyDown: sui.fireClickOnEnter },
            React.createElement("div", { className: "detail" },
                React.createElement("img", { alt: lf("Animated bar chart"), className: "barcharticon", src: pxt.Util.pathJoin(pxt.webConfig.commitCdnUrl, "images/Bars_black.gif") })),
            React.createElement("span", null, lf("Show console")),
            React.createElement("div", { className: "detail" }, this.props.isSim ? lf("Simulator") : lf("Device"))));
    };
    return SerialIndicator;
}(data.Component));
exports.SerialIndicator = SerialIndicator;
