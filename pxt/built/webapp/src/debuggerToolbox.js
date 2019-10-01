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
var debuggerCallStack_1 = require("./debuggerCallStack");
var debuggerVariables_1 = require("./debuggerVariables");
var debuggerToolbar_1 = require("./debuggerToolbar");
var DebuggerToolbox = /** @class */ (function (_super) {
    __extends(DebuggerToolbox, _super);
    function DebuggerToolbox(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            sequence: 0,
            currentFrame: 0
        };
        return _this;
    }
    DebuggerToolbox.prototype.setBreakpoint = function (bp, varFilters) {
        this.setState({
            lastBreakpoint: bp,
            currentFrame: 0,
            sequence: this.state.sequence + 1,
            varFilters: varFilters || this.state.varFilters
        });
    };
    DebuggerToolbox.prototype.render = function () {
        return React.createElement("div", null,
            React.createElement(debuggerToolbar_1.DebuggerToolbar, { parent: this.props.parent }),
            React.createElement(debuggerVariables_1.DebuggerVariables, { apis: this.props.apis, breakpoint: this.state.lastBreakpoint, filters: this.state.varFilters, activeFrame: this.state.currentFrame, sequence: this.state.sequence }),
            this.props.showCallStack &&
                React.createElement(debuggerCallStack_1.DebuggerCallStack, { openLocation: this.props.openLocation, activeFrame: this.state.currentFrame, stackframes: this.state.lastBreakpoint ? this.state.lastBreakpoint.stackframes : [] }));
    };
    return DebuggerToolbox;
}(React.Component));
exports.DebuggerToolbox = DebuggerToolbox;
