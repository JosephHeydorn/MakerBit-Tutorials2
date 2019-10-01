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
var HintTooltip = /** @class */ (function (_super) {
    __extends(HintTooltip, _super);
    function HintTooltip(props) {
        return _super.call(this, props) || this;
    }
    HintTooltip.prototype.componentWillReceiveProps = function (nextProps) {
        if (nextProps.pokeUser != this.state.show) {
            this.setState({ show: nextProps.pokeUser });
        }
    };
    HintTooltip.prototype.renderCore = function () {
        // Animation should be attached to 'show' class
        return React.createElement("div", { className: "tooltip " + (this.state.show ? 'show' : ''), role: "tooltip", onClick: this.props.onClick }, this.props.text);
    };
    return HintTooltip;
}(data.Component));
exports.HintTooltip = HintTooltip;
var HintManager = /** @class */ (function () {
    function HintManager() {
        this.defaultDuration = 15000;
        this.defaultDisplayCount = 3;
        this.hints = {};
    }
    HintManager.prototype.addHint = function (id, callback, duration) {
        var _this = this;
        this.hints[id] = pxt.Util.debounce(function () {
            callback();
            _this.stopPokeUserActivity();
        }, duration || this.defaultDuration);
    };
    // starts a timer, overwriting current timer
    // TODO: if/when we add more hints, should discuss whether this count is across all hints or per-hint
    HintManager.prototype.pokeUserActivity = function (id, displayCount) {
        if (displayCount == undefined || displayCount < this.defaultDisplayCount) {
            this.stopPokeUserActivity();
            this.timer = this.hints[id]();
        }
    };
    // stops current user hint timer
    HintManager.prototype.stopPokeUserActivity = function () {
        clearTimeout(this.timer);
        this.timer = null;
    };
    return HintManager;
}());
exports.HintManager = HintManager;
