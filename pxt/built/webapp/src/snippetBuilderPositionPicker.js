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
var Snippet = require("./snippetBuilder");
var sui = require("./sui");
var snippetBuilderSimulatorDisplay_1 = require("./snippetBuilderSimulatorDisplay");
var PICKER_WIDTH = 309;
var PICKER_HEIGHT = 227;
var FULLSIZE_BROWSER_WIDTH = 2100;
var FULLSIZE_BROWSER_HEIGHT = 1003;
var SIMULATOR_HEIGHT = 120;
var SIMULATOR_WIDTH = 160;
/**
 * TODO
 * 1. Slight issues with keeping the value written in the textbox and the one picked with a mouse in sync when switching back and forth
 * 2. Dot slides on resize, recalculate the dots top and left based on new scale
 */
var PositionPicker = /** @class */ (function (_super) {
    __extends(PositionPicker, _super);
    function PositionPicker(props) {
        var _this = _super.call(this, props) || this;
        _this.onChange = function (x) { return function (v) {
            var _a = _this.props, input = _a.input, onChange = _a.onChange;
            if (!Snippet.isSnippetInputAnswerSingular(input)) {
                var pos = _this.state;
                var newValue = parseInt(v);
                if (isNaN(newValue) || newValue < 0) {
                    // Return if change is not valid
                    return;
                }
                _this.setState({
                    x: x ? _this.unScalePointX(newValue) : pos.x,
                    y: !x ? _this.unScalePointY(newValue) : pos.y,
                }, function () {
                    var pos = _this.getScaledPoints();
                    if (x)
                        onChange(input.answerTokens[0])(pos.x.toString());
                    if (!x)
                        onChange(input.answerTokens[1])(pos.y.toString());
                    _this.setState({
                        dotVisible: true,
                    });
                });
            }
        }; };
        _this.state = {
            x: _this.unScalePointX(_this.props.defaultX || 80),
            y: _this.unScalePointY(_this.props.defaultY || 60),
            dotVisible: false,
        };
        _this.setDot = _this.setDot.bind(_this);
        _this.onChange = _this.onChange.bind(_this);
        _this.setScale = _this.setScale.bind(_this);
        return _this;
    }
    PositionPicker.prototype.componentWillUnmount = function () {
        window.removeEventListener('resize', this.setScale);
    };
    PositionPicker.prototype.componentDidMount = function () {
        // Run once on component mount
        this.setScale();
        window.addEventListener('resize', this.setScale);
    };
    /**
     * Sets the number to scale the position picker and simulator display
     */
    PositionPicker.prototype.setScale = function () {
        // scale = 1 height is 1023 - constant (FULLSIZE_BROWSER_HEIGHT)
        var height = window.innerHeight;
        // scale = 1 height is 2100 - constant (FULLSIZE_BROWSER_WIDTH)
        var width = window.innerWidth;
        var scale = height > width ? (width / FULLSIZE_BROWSER_WIDTH) : (height / FULLSIZE_BROWSER_HEIGHT);
        // Minimum resize threshold .71
        if (scale < .71) {
            scale = .71;
        }
        else if (scale > 1.01) {
            scale = 1.01;
        }
        this.setState({ scale: scale });
    };
    /** Returns proper scale for calculating position */
    PositionPicker.prototype.getScale = function (scaleDivisor, scaleMultiplier) {
        var scale = this.state.scale;
        var currentWidth = scaleMultiplier * scale;
        return currentWidth / scaleDivisor;
    };
    /** Calls getScale with picker width and simulator width */
    PositionPicker.prototype.getXScale = function () {
        return this.getScale(SIMULATOR_WIDTH, PICKER_WIDTH);
    };
    /** Calls getScale with picker height and simulator height */
    PositionPicker.prototype.getYScale = function () {
        return this.getScale(SIMULATOR_HEIGHT, PICKER_HEIGHT);
    };
    PositionPicker.prototype.scalePoint = function (point, scale) {
        if (!isNaN(point)) {
            return Math.round(point / scale);
        }
        return 0;
    };
    PositionPicker.prototype.scalePointX = function (point) {
        return this.scalePoint(point, this.getXScale());
    };
    PositionPicker.prototype.scalePointY = function (point) {
        return this.scalePoint(point, this.getYScale());
    };
    PositionPicker.prototype.unScalePoint = function (point, scale) {
        if (!isNaN(point)) {
            return Math.round(point * scale);
        }
        return 0;
    };
    PositionPicker.prototype.unScalePointX = function (point) {
        return this.unScalePoint(point, this.getXScale());
    };
    PositionPicker.prototype.unScalePointY = function (point) {
        return this.unScalePoint(point, this.getYScale());
    };
    PositionPicker.prototype.getScaledPoints = function () {
        var _a = this.state, x = _a.x, y = _a.y;
        return {
            x: this.scalePointX(x),
            y: this.scalePointY(y),
        };
    };
    PositionPicker.prototype.scalePixel = function (numberToScale) {
        var scale = this.state.scale;
        return (numberToScale * scale) + "px";
    };
    PositionPicker.prototype.setDot = function (e) {
        var _this = this;
        var _a = this.props, input = _a.input, onChange = _a.onChange;
        var mouseX = e.nativeEvent.offsetX;
        var mouseY = e.nativeEvent.offsetY;
        this.setState({
            dotVisible: true,
            x: Math.round(mouseX),
            y: Math.round(mouseY),
        }, function () {
            if (!Snippet.isSnippetInputAnswerSingular(input)) {
                var pos = _this.getScaledPoints();
                onChange(input.answerTokens[0])(pos.x.toString());
                onChange(input.answerTokens[1])(pos.y.toString());
            }
        });
    };
    PositionPicker.prototype.renderCore = function () {
        var _a = this.state, dotVisible = _a.dotVisible, x = _a.x, y = _a.y, scale = _a.scale;
        var pos = this.getScaledPoints();
        return (React.createElement("div", null,
            React.createElement("div", { className: 'ui grid' },
                React.createElement("div", { className: 'column' },
                    React.createElement(sui.Input, { class: 'position-picker preview-input', value: (pos.x).toString(), onChange: this.onChange(true) })),
                React.createElement("div", { className: 'column' },
                    React.createElement(sui.Input, { class: 'position-picker preview-input', value: (pos.y).toString(), onChange: this.onChange(false) }))),
            React.createElement(snippetBuilderSimulatorDisplay_1.SimulatorDisplay, { scale: scale },
                React.createElement("div", { ref: 'positionPickerContainer', className: 'position-picker container', onClick: this.setDot, style: {
                        left: this.scalePixel(28),
                        top: this.scalePixel(28),
                        width: this.scalePixel(PICKER_WIDTH),
                        height: this.scalePixel(PICKER_HEIGHT),
                        margin: "8px",
                        maxWidth: this.scalePixel(PICKER_WIDTH),
                        maxHeight: this.scalePixel(PICKER_HEIGHT),
                    }, role: 'grid' }, dotVisible && React.createElement("div", { className: 'position-picker dot', style: { top: y + "px", left: x + "px" } })))));
    };
    return PositionPicker;
}(data.Component));
exports.PositionPicker = PositionPicker;
