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
var DebuggerTable = /** @class */ (function (_super) {
    __extends(DebuggerTable, _super);
    function DebuggerTable() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    DebuggerTable.prototype.render = function () {
        return React.createElement("div", { className: "ui varExplorer" },
            React.createElement("div", { className: "ui variableTableHeader" }, this.props.header),
            React.createElement("div", { className: "ui segment debugvariables " + (this.props.frozen ? "frozen" : "") + " ui collapsing basic striped table" }, this.props.children));
    };
    return DebuggerTable;
}(React.Component));
exports.DebuggerTable = DebuggerTable;
var DebuggerTableRow = /** @class */ (function (_super) {
    __extends(DebuggerTableRow, _super);
    function DebuggerTableRow() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.clickHandler = function (e) {
            if (_this.props.onClick)
                _this.props.onClick(e, _this);
        };
        return _this;
    }
    DebuggerTableRow.prototype.render = function () {
        return React.createElement("div", { role: "listitem", className: "item " + (this.props.rowClass || ""), onClick: this.props.onClick ? this.clickHandler : undefined },
            React.createElement("div", { className: "variableAndValue" },
                React.createElement("div", { className: "variable varname " + (this.props.leftClass || ""), title: this.props.leftTitle, style: this.props.depth ? { marginLeft: (this.props.depth * 0.75) + "em" } : undefined },
                    React.createElement("i", { className: "ui icon small " + (this.props.icon || "invisible") }),
                    React.createElement("span", null, this.props.leftText)),
                React.createElement("div", { className: "variable detail", style: { padding: 0.2 }, title: this.props.rightTitle },
                    React.createElement("span", { className: "varval " + (this.props.rightClass || "") }, this.props.rightText))));
    };
    return DebuggerTableRow;
}(React.Component));
exports.DebuggerTableRow = DebuggerTableRow;
