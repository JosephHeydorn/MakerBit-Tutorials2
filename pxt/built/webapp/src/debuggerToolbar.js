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
var ReactDOM = require("react-dom");
var sui = require("./sui");
var data = require("./data");
var simulator = require("./simulator");
var DebuggerToolbar = /** @class */ (function (_super) {
    __extends(DebuggerToolbar, _super);
    function DebuggerToolbar(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.restartSimulator = _this.restartSimulator.bind(_this);
        _this.dbgPauseResume = _this.dbgPauseResume.bind(_this);
        _this.dbgStepOver = _this.dbgStepOver.bind(_this);
        _this.dbgStepInto = _this.dbgStepInto.bind(_this);
        _this.dbgStepOut = _this.dbgStepOut.bind(_this);
        _this.exitDebugging = _this.exitDebugging.bind(_this);
        return _this;
    }
    DebuggerToolbar.prototype.restartSimulator = function () {
        pxt.tickEvent('debugger.restart', undefined, { interactiveConsent: true });
        this.props.parent.restartSimulator();
    };
    DebuggerToolbar.prototype.exitDebugging = function () {
        pxt.tickEvent('debugger.exit', undefined, { interactiveConsent: true });
        this.props.parent.toggleDebugging();
    };
    DebuggerToolbar.prototype.dbgPauseResume = function () {
        pxt.tickEvent('debugger.pauseresume', undefined, { interactiveConsent: true });
        this.props.parent.dbgPauseResume();
    };
    DebuggerToolbar.prototype.dbgStepOver = function () {
        pxt.tickEvent('debugger.stepover', undefined, { interactiveConsent: true });
        this.props.parent.dbgStepOver();
    };
    DebuggerToolbar.prototype.dbgStepInto = function () {
        pxt.tickEvent('debugger.stepinto', undefined, { interactiveConsent: true });
        this.props.parent.dbgStepInto();
    };
    DebuggerToolbar.prototype.dbgStepOut = function () {
        pxt.tickEvent('debugger.stepout', undefined, { interactiveConsent: true });
        simulator.dbgStepOut();
    };
    DebuggerToolbar.prototype.getMenuDom = function () {
        var node = ReactDOM.findDOMNode(this);
        return node && node.firstElementChild;
    };
    DebuggerToolbar.prototype.renderCore = function () {
        var parentState = this.props.parent.state;
        var simState = parentState.simState;
        var isRunning = simState == pxt.editor.SimState.Running;
        var isStarting = simState == pxt.editor.SimState.Starting;
        var isDebugging = parentState.debugging;
        if (!isDebugging)
            return React.createElement("div", null);
        var isDebuggerRunning = simulator.driver && simulator.driver.state == pxsim.SimulatorState.Running;
        var advancedDebugging = !this.props.parent.isBlocksActive();
        var isValidDebugFile = advancedDebugging || this.props.parent.isBlocksActive() || pxt.appTarget.appTheme.debugExtensionCode;
        if (!isValidDebugFile)
            return React.createElement("div", null);
        var dbgStepDisabled = isDebuggerRunning || isStarting;
        var dbgStepDisabledClass = dbgStepDisabled ? "disabled" : "";
        var restartTooltip = lf("Restart debugging");
        var dbgPauseResumeTooltip = isRunning ? lf("Pause execution") : lf("Continue execution");
        var dbgStepIntoTooltip = lf("Step into");
        var dbgStepOverTooltip = lf("Step over");
        var dbgStepOutTooltip = lf("Step out");
        if (!isDebugging) {
            return React.createElement("div", { className: "debugtoolbar", role: "complementary", "aria-label": lf("Debugger toolbar") });
        }
        else if (advancedDebugging) {
            // Debugger Toolbar for the monaco editor.
            return React.createElement("div", { className: "debugtoolbar", role: "complementary", "aria-label": lf("Debugger toolbar") }, !isDebugging ? undefined :
                React.createElement("div", { className: "ui compact borderless menu icon" },
                    React.createElement(sui.Item, { key: 'dbgpauseresume', className: "dbg-btn dbg-pause-resume " + dbgStepDisabledClass + " " + (isDebuggerRunning ? "pause" : "play"), icon: "" + (isDebuggerRunning ? "pause blue" : "play green"), title: dbgPauseResumeTooltip, onClick: this.dbgPauseResume }),
                    React.createElement(sui.Item, { key: 'dbgstepover', className: "dbg-btn dbg-step-over " + dbgStepDisabledClass, icon: "xicon stepover " + (isDebuggerRunning ? "disabled" : "blue"), title: dbgStepOverTooltip, onClick: this.dbgStepOver }),
                    React.createElement(sui.Item, { key: 'dbgstepinto', className: "dbg-btn dbg-step-into " + dbgStepDisabledClass, icon: "xicon stepinto " + (isDebuggerRunning ? "disabled" : ""), title: dbgStepIntoTooltip, onClick: this.dbgStepInto }),
                    React.createElement(sui.Item, { key: 'dbgstepout', className: "dbg-btn dbg-step-out " + dbgStepDisabledClass, icon: "xicon stepout " + (isDebuggerRunning ? "disabled" : ""), title: dbgStepOutTooltip, onClick: this.dbgStepOut }),
                    React.createElement(sui.Item, { key: 'dbgrestart', className: "dbg-btn dbg-restart right", icon: "refresh green", title: restartTooltip, onClick: this.restartSimulator })));
        }
        else {
            // Debugger Toolbar for the blocks editor.
            return React.createElement("div", { className: "debugtoolbar", role: "complementary", "aria-label": lf("Debugger toolbar") },
                React.createElement("div", { className: "ui compact borderless menu icon" },
                    React.createElement(sui.Item, { key: 'dbgstep', className: "dbg-btn dbg-step separator-after " + dbgStepDisabledClass, icon: "arrow right " + (dbgStepDisabled ? "disabled" : "blue"), title: dbgStepIntoTooltip, onClick: this.dbgStepInto, text: "Step" }),
                    React.createElement(sui.Item, { key: 'dbgpauseresume', className: "dbg-btn dbg-pause-resume " + (isDebuggerRunning ? "pause" : "play"), icon: "" + (isDebuggerRunning ? "pause blue" : "play green"), title: dbgPauseResumeTooltip, onClick: this.dbgPauseResume }),
                    React.createElement(sui.Item, { key: 'dbgrestart', className: "dbg-btn dbg-restart", icon: "refresh green", title: restartTooltip, onClick: this.restartSimulator })));
        }
    };
    return DebuggerToolbar;
}(data.Component));
exports.DebuggerToolbar = DebuggerToolbar;
