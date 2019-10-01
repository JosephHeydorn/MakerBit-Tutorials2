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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var data = require("./data");
var simulator = require("./simulator");
var debuggerTable_1 = require("./debuggerTable");
var MAX_VARIABLE_LENGTH = 20;
var DebuggerVariables = /** @class */ (function (_super) {
    __extends(DebuggerVariables, _super);
    function DebuggerVariables(props) {
        var _this = _super.call(this, props) || this;
        _this.handleComponentClick = function (e, component) {
            if (_this.state.frozen)
                return;
            var id = component.props.refID;
            for (var _i = 0, _a = _this.getFullVariableList(); _i < _a.length; _i++) {
                var v = _a[_i];
                if (v.id === id) {
                    _this.toggle(v);
                    return;
                }
            }
        };
        _this.state = {
            globalFrame: {
                title: lf("Globals"),
                variables: []
            },
            stackFrames: [],
            nextID: 0
        };
        return _this;
    }
    DebuggerVariables.prototype.clear = function () {
        this.setState({
            globalFrame: {
                title: this.state.globalFrame.title,
                variables: []
            },
            stackFrames: []
        });
    };
    DebuggerVariables.prototype.update = function (frozen) {
        if (frozen === void 0) { frozen = false; }
        this.setState({ frozen: frozen });
    };
    DebuggerVariables.prototype.componentDidUpdate = function (prevProps) {
        if (this.props.breakpoint) {
            if (this.props.sequence != this.state.renderedSequence) {
                this.updateVariables(this.props.breakpoint.globals, this.props.breakpoint.stackframes, this.props.filters);
            }
        }
        else if (!this.state.frozen) {
            this.setState({ frozen: true });
        }
    };
    DebuggerVariables.prototype.renderCore = function () {
        var _a = this.state, globalFrame = _a.globalFrame, stackFrames = _a.stackFrames, frozen = _a.frozen;
        var variableTableHeader = lf("Variables");
        var variables = globalFrame.variables;
        // Add in the local variables.
        // TODO: Handle callstack
        if (stackFrames && stackFrames.length && this.props.activeFrame !== undefined) {
            variables = stackFrames[this.props.activeFrame].variables.concat(variables);
        }
        return React.createElement(debuggerTable_1.DebuggerTable, { header: variableTableHeader, frozen: frozen }, this.renderVars(variables));
    };
    DebuggerVariables.prototype.renderVars = function (vars, depth, result) {
        var _this = this;
        if (depth === void 0) { depth = 0; }
        if (result === void 0) { result = []; }
        vars.forEach(function (varInfo) {
            var valueString = renderValue(varInfo.value);
            var typeString = variableType(varInfo);
            result.push(React.createElement(debuggerTable_1.DebuggerTableRow, { key: varInfo.id, refID: varInfo.id, icon: (varInfo.value && varInfo.value.hasFields) ? (varInfo.children ? "down triangle" : "right triangle") : undefined, leftText: varInfo.name + ":", leftTitle: varInfo.name, leftClass: varInfo.prevValue !== undefined ? "changed" : undefined, rightText: truncateLength(valueString), rightTitle: shouldShowValueOnHover(typeString) ? valueString : undefined, rightClass: typeString, onClick: _this.handleComponentClick, depth: depth }));
            if (varInfo.children) {
                _this.renderVars(varInfo.children, depth + 1, result);
            }
        });
        return result;
    };
    DebuggerVariables.prototype.updateVariables = function (globals, stackFrames, filters) {
        if (!globals) {
            // freeze the ui
            this.update(true);
            return;
        }
        var nextId = 0;
        var updatedGlobals = updateScope(this.state.globalFrame, globals);
        if (filters) {
            updatedGlobals.variables = updatedGlobals.variables.filter(function (v) { return filters.indexOf(v.name) !== -1; });
        }
        assignVarIds(updatedGlobals.variables);
        var updatedFrames;
        if (stackFrames) {
            var oldFrames_1 = this.state.stackFrames;
            updatedFrames = stackFrames.map(function (sf, index) {
                var key = sf.breakpointId + "_" + index;
                for (var _i = 0, oldFrames_2 = oldFrames_1; _i < oldFrames_2.length; _i++) {
                    var frame = oldFrames_2[_i];
                    if (frame.key === key)
                        return updateScope(frame, sf.locals, getArgArray(sf.arguments));
                }
                return updateScope({ key: key, title: sf.funcInfo.functionName, variables: [] }, sf.locals, getArgArray(sf.arguments));
            });
            updatedFrames.forEach(function (sf) { return assignVarIds(sf.variables); });
        }
        this.setState({
            globalFrame: updatedGlobals,
            stackFrames: updatedFrames || [],
            nextID: nextId,
            renderedSequence: this.props.sequence,
            frozen: false
        });
        function getArgArray(info) {
            if (info) {
                if (info.thisParam != null) {
                    return [{ name: "this", value: info.thisParam }].concat(info.params);
                }
                else {
                    return info.params;
                }
            }
            return [];
        }
        function assignVarIds(vars) {
            vars.forEach(function (v) {
                v.id = nextId++;
                if (v.children)
                    assignVarIds(v.children);
            });
        }
    };
    DebuggerVariables.prototype.getFullVariableList = function () {
        var result = [];
        collectVariables(this.state.globalFrame.variables);
        if (this.state.stackFrames)
            this.state.stackFrames.forEach(function (sf) { return collectVariables(sf.variables); });
        return result;
        function collectVariables(vars) {
            vars.forEach(function (v) {
                result.push(v);
                if (v.children) {
                    collectVariables(v.children);
                }
            });
        }
    };
    DebuggerVariables.prototype.toggle = function (v) {
        var _this = this;
        // We have to take care of the logic for nested looped variables. Currently they break this implementation.
        if (v.children) {
            delete v.children;
            this.setState({ globalFrame: this.state.globalFrame });
        }
        else {
            if (!v.value || !v.value.id)
                return;
            // We filter the getters we want to call for this variable.
            var allApis_1 = this.props.apis;
            var matcher_1 = new RegExp("^((.+\.)?" + v.value.type + ")\.");
            var potentialKeys = Object.keys(allApis_1).filter(function (key) { return matcher_1.test(key); });
            var fieldsToGet_1 = [];
            potentialKeys.forEach(function (key) {
                var symbolInfo = allApis_1[key];
                if (!key.endsWith("@set") && symbolInfo && symbolInfo.attributes.callInDebugger) {
                    fieldsToGet_1.push(key);
                }
            });
            simulator.driver.variablesAsync(v.value.id, fieldsToGet_1)
                .then(function (msg) {
                if (msg && msg.variables) {
                    var nextID_1 = _this.state.nextID;
                    v.children = Object.keys(msg.variables).map(function (key) { return ({ name: key, value: msg.variables[key], id: nextID_1++ }); });
                    _this.setState({ globalFrame: _this.state.globalFrame, nextID: nextID_1 });
                }
            });
        }
    };
    return DebuggerVariables;
}(data.Component));
exports.DebuggerVariables = DebuggerVariables;
function updateScope(lastScope, newVars, params) {
    var current = Object.keys(newVars).map(function (varName) { return ({ name: fixVarName(varName), value: newVars[varName] }); });
    if (params) {
        current = params.concat(current);
    }
    return __assign({}, lastScope, { variables: getUpdatedVariables(lastScope.variables, current) });
}
function fixVarName(name) {
    return name.replace(/___\d+$/, "");
}
function getUpdatedVariables(previous, current) {
    return current.map(function (v) {
        var prev = getVariable(previous, v);
        if (prev && prev.value && !prev.value.id && prev.value !== v.value) {
            return __assign({}, v, { prevValue: prev.value });
        }
        return v;
    });
}
;
function getVariable(variables, value) {
    for (var i = 0; i < variables.length; i++) {
        if (variables[i].name === value.name) {
            return variables[i];
        }
    }
    return undefined;
}
function renderValue(v) {
    var sv = '';
    var type = typeof v;
    switch (type) {
        case "undefined":
            sv = "undefined";
            break;
        case "number":
            sv = v + "";
            break;
        case "boolean":
            sv = v + "";
            break;
        case "string":
            sv = JSON.stringify(v);
            break;
        case "object":
            if (v == null)
                sv = "null";
            else if (v.text)
                sv = v.text;
            else if (v.id && v.preview)
                return v.preview;
            else if (v.id !== undefined)
                sv = "(object)";
            else
                sv = "(unknown)";
            break;
    }
    return sv;
}
function truncateLength(varstr) {
    var remaining = MAX_VARIABLE_LENGTH - 3; // acount for ...
    var hasQuotes = false;
    if (varstr.indexOf('"') == 0) {
        remaining -= 2;
        hasQuotes = true;
        varstr = varstr.substring(1, varstr.length - 1);
    }
    if (varstr.length > remaining)
        varstr = varstr.substring(0, remaining) + '...';
    if (hasQuotes) {
        varstr = '"' + varstr + '"';
    }
    return varstr;
}
function variableType(variable) {
    var val = variable.value;
    if (val == null)
        return "undefined";
    var type = typeof val;
    switch (type) {
        case "string":
        case "number":
        case "boolean":
            return type;
        case "object":
            if (val.type)
                return val.type;
            if (val.preview)
                return val.preview;
            if (val.text)
                return val.text;
            return "object";
        default:
            return "unknown";
    }
}
function shouldShowValueOnHover(type) {
    switch (type) {
        case "string":
        case "number":
        case "boolean":
        case "array":
            return true;
        default:
            return false;
    }
}
