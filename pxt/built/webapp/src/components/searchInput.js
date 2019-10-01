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
var SearchInput = /** @class */ (function (_super) {
    __extends(SearchInput, _super);
    function SearchInput(props) {
        var _this = _super.call(this, props) || this;
        _this.updateInputValue = function (ev) {
            var searchOnChange = _this.props.searchOnChange;
            var inputValue = ev.target.value;
            _this.setState({ inputValue: inputValue });
            // If we search on change, call search
            if (searchOnChange)
                _this.handleSearch(inputValue);
        };
        _this.state = {
            inputValue: ""
        };
        _this.handleSearchKeyUpdate = _this.handleSearchKeyUpdate.bind(_this);
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    SearchInput.prototype.handleSearchKeyUpdate = function (ev) {
        // Call search when a user presses Enter
        if (ev.keyCode == 13)
            this.handleSearch(this.state.inputValue);
    };
    SearchInput.prototype.handleSearch = function (inputValue) {
        var searchHandler = this.props.searchHandler;
        searchHandler(inputValue);
    };
    SearchInput.prototype.handleClick = function () {
        this.handleSearch(this.state.inputValue);
    };
    SearchInput.prototype.render = function () {
        var _a = this.props, ariaMessage = _a.ariaMessage, disabled = _a.disabled, loading = _a.loading, placeholder = _a.placeholder, autoFocus = _a.autoFocus, className = _a.className, inputClassName = _a.inputClassName, searchOnChange = _a.searchOnChange, searchHandler = _a.searchHandler, rest = __rest(_a, ["ariaMessage", "disabled", "loading", "placeholder", "autoFocus", "className", "inputClassName", "searchOnChange", "searchHandler"]);
        var inputValue = this.state.inputValue;
        return React.createElement("div", __assign({ className: "ui search " + (className || '') }, rest),
            React.createElement("div", { className: "ui icon input " + (inputClassName || '') },
                React.createElement("div", { "aria-live": "polite", className: "accessible-hidden", id: "searchInputBoxLabel" }, ariaMessage),
                React.createElement("input", { role: "search", autoFocus: autoFocus, ref: "searchInput", "aria-labelledby": "searchInputBoxLabel", className: "prompt", type: "text", placeholder: placeholder, onChange: this.updateInputValue, value: inputValue, onKeyUp: this.handleSearchKeyUpdate, disabled: disabled, autoComplete: "off", autoCorrect: "off", autoCapitalize: "off", spellCheck: false }),
                React.createElement("i", { role: "button", onClick: this.handleClick, title: lf("Search"), style: { cursor: "pointer" }, className: "search link icon " + (disabled ? 'disabled' : '') + " " + (loading ? 'loading' : '') })));
    };
    return SearchInput;
}(React.Component));
exports.SearchInput = SearchInput;
