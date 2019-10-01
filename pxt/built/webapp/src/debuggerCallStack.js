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
var debuggerTable_1 = require("./debuggerTable");
var DebuggerCallStack = /** @class */ (function (_super) {
    __extends(DebuggerCallStack, _super);
    function DebuggerCallStack(props) {
        var _this = _super.call(this, props) || this;
        _this.handleRowClick = function (e, component) {
            if (!_this.props.openLocation)
                return;
            var _a = component.props.refID.split("_").map(function (n) { return parseInt(n); }), id = _a[0], index = _a[1];
            var stackFrame = _this.props.stackframes[index];
            if (stackFrame && stackFrame.breakpointId === id) {
                _this.props.openLocation(stackFrame.breakpointId, index);
            }
        };
        return _this;
    }
    DebuggerCallStack.prototype.render = function () {
        var _this = this;
        return (React.createElement(debuggerTable_1.DebuggerTable, { header: lf("Call Stack") }, this.props.stackframes.map(function (sf, index) {
            if (!sf.breakpointId)
                return null;
            var key = sf.breakpointId + "_" + index;
            var fileName = sf.funcInfo.fileName;
            if (fileName.indexOf("pxt_modules/") === 0)
                fileName = fileName.slice(12);
            return React.createElement(debuggerTable_1.DebuggerTableRow, { key: key, refID: key, onClick: _this.handleRowClick, leftText: sf.funcInfo.functionName, rightText: fileName + ":" + sf.funcInfo.line, icon: index === _this.props.activeFrame ? "arrow right" : undefined, rowClass: "callstack-row" });
        })));
    };
    return DebuggerCallStack;
}(React.Component));
exports.DebuggerCallStack = DebuggerCallStack;
