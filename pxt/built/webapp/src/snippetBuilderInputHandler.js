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
var snippetBuilderSpriteEditor_1 = require("./snippetBuilderSpriteEditor");
var sui = require("./sui");
var snippetBuilderPositionPicker_1 = require("./snippetBuilderPositionPicker");
var Snippet = require("./snippetBuilder");
var InputHandler = /** @class */ (function (_super) {
    __extends(InputHandler, _super);
    function InputHandler(props) {
        var _this = _super.call(this, props) || this;
        // Strip all non alphanumeric characters other than _
        _this.textOnChange = function (v) { return _this.props.onChange(v.replace(/[^a-zA-Z0-9_]/g, '_')); };
        _this.state = {
            isFocused: false
        };
        return _this;
    }
    InputHandler.prototype.renderInput = function () {
        var _a = this.props, value = _a.value, input = _a.input, onChange = _a.onChange;
        switch (input.type) {
            case 'dropdown':
                return (React.createElement(DropdownInput, { input: input, value: value, onChange: onChange }));
            case 'spriteEditor':
                if (Snippet.isSnippetInputAnswerTypeOther(input)) {
                    return (React.createElement(snippetBuilderSpriteEditor_1.SpriteEditor, { input: input, onChange: onChange, value: value, fullscreen: false }));
                }
            case 'number':
                return (React.createElement(RangeInput, { input: input, value: value, onChange: onChange, autoFocus: true }));
            case 'positionPicker':
                if (!Snippet.isSnippetInputAnswerSingular(input)) {
                    return (React.createElement(snippetBuilderPositionPicker_1.PositionPicker, { defaultX: parseInt(input.defaultAnswers[0]), defaultY: parseInt(input.defaultAnswers[1]), input: input, onChange: onChange }));
                }
            case 'text':
            default:
                if (Snippet.isSnippetInputAnswerTypeOther(input)) {
                    return (React.createElement(sui.Input, { label: input.label && input.label, value: value || '', onChange: this.textOnChange, autoFocus: true, selectOnMount: true }));
                }
        }
        return null;
    };
    InputHandler.prototype.renderCore = function () {
        return this.renderInput();
    };
    return InputHandler;
}(data.Component));
exports.InputHandler = InputHandler;
var DropdownInput = /** @class */ (function (_super) {
    __extends(DropdownInput, _super);
    function DropdownInput(props) {
        var _this = _super.call(this, props) || this;
        _this.onChange = function (value) { return function () {
            var onChange = _this.props.onChange;
            onChange(value);
        }; };
        _this.onChange = _this.onChange.bind(_this);
        return _this;
    }
    DropdownInput.prototype.renderCore = function () {
        var _this = this;
        var _a = this.props, value = _a.value, input = _a.input;
        if (Snippet.isSnippetInputAnswerTypeDropdown(input)) {
            return (React.createElement(sui.DropdownMenu, { className: 'inline button', role: "menuitem", text: value.length ? pxt.Util.rlf(input.options[value]) : pxt.Util.rlf(input.options[Object.keys(input.options)[0]]), icon: 'dropdown' }, Object.keys(input.options).map(function (optionValue) {
                return React.createElement(sui.Item, { role: "menuitem", value: optionValue, key: input.options[optionValue], text: pxt.Util.rlf(input.options[optionValue]), onClick: _this.onChange(optionValue) });
            })));
        }
        return null;
    };
    return DropdownInput;
}(data.Component));
/**
 * TODO: Slider is not full width on Mozilla only
 */
var RangeInput = /** @class */ (function (_super) {
    __extends(RangeInput, _super);
    function RangeInput(props) {
        var _this = _super.call(this, props) || this;
        _this.onChange = _this.onChange.bind(_this);
        return _this;
    }
    RangeInput.prototype.onChange = function (e) {
        var onChange = this.props.onChange;
        onChange(e.target.value);
    };
    RangeInput.prototype.renderCore = function () {
        var _a = this.props, input = _a.input, value = _a.value, autoFocus = _a.autoFocus;
        if (Snippet.isSnippetInputAnswerTypeNumber(input)) {
            return (React.createElement("div", null,
                React.createElement("span", null, input.label && input.label),
                React.createElement("div", { className: 'ui grid' },
                    React.createElement("div", { className: 'left floated column snippet-slider' },
                        React.createElement("input", { type: 'range', autoFocus: autoFocus, className: 'slider blocklyMockSlider', role: 'slider', max: input.max, min: input.min, value: value, onChange: this.onChange, "aria-valuemin": input.min, "aria-valuemax": input.max, "aria-valuenow": value, style: {
                                marginLeft: 0
                            } })),
                    React.createElement("div", { className: 'column slider-value snippet' },
                        React.createElement(sui.Input, { value: value, onChange: this.props.onChange, class: 'snippet slider-input' })))));
        }
        return null;
    };
    return RangeInput;
}(data.Component));
