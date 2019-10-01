"use strict";
/// <reference path="../../built/pxtsim.d.ts" />
/// <reference path="../../localtypings/pxtparts.d.ts" />
Object.defineProperty(exports, "__esModule", { value: true });
var core = require("./core");
var coretsx = require("./coretsx");
var U = pxt.U;
exports.FAST_TRACE_INTERVAL = 100;
exports.SLOW_TRACE_INTERVAL = 500;
var config;
var lastCompileResult;
var displayedModals = {};
function setTranslations(translations) {
    if (exports.simTranslations !== translations) {
        exports.simTranslations = translations;
        setDirty();
    }
}
exports.setTranslations = setTranslations;
function init(root, cfg) {
    if (!root)
        return;
    pxsim.U.clear(root);
    var simulatorsDiv = document.createElement('div');
    simulatorsDiv.id = 'simulators';
    simulatorsDiv.className = 'simulator';
    root.appendChild(simulatorsDiv);
    var debuggerDiv = document.createElement('div');
    debuggerDiv.id = 'debugger';
    debuggerDiv.className = 'ui item landscape only';
    root.appendChild(debuggerDiv);
    var options = {
        restart: function () { return cfg.restartSimulator(); },
        revealElement: function (el) {
            if (pxt.options.light || exports.driver.isLoanedSimulator(el))
                return;
            // Play enter animation
            var animation = pxt.appTarget.appTheme.simAnimationEnter || 'fly right in';
            el.style.animationDuration = '500ms';
            var animationClasses = animation + " visible transition animating";
            pxsim.U.addClass(el, animationClasses);
            Promise.resolve().delay(500).then(function () {
                pxsim.U.removeClass(el, animationClasses);
                el.style.animationDuration = '';
                if (pxt.BrowserUtils.isEdge() && coretsx.dialogIsShowing()) {
                    // Workaround for a Microsoft Edge bug where when a dialog is open and the simulator is
                    // revealed it somehow breaks the page render. See https://github.com/Microsoft/pxt/pull/4707
                    // for more details
                    document.body.style.display = "none";
                    requestAnimationFrame(function () {
                        document.body.style.display = "block";
                    });
                }
            });
        },
        removeElement: function (el, completeHandler) {
            if (pxt.appTarget.simulator.headless) {
                pxsim.U.addClass(el, 'simHeadless');
                if (completeHandler)
                    completeHandler();
            }
            else {
                if (pxt.options.light) {
                    if (completeHandler)
                        completeHandler();
                    pxsim.U.remove(el);
                    return;
                }
                // Play exit animation
                var animation = pxt.appTarget.appTheme.simAnimationExit || 'fly right out';
                el.style.animationDuration = '500ms';
                var animationClasses = animation + " visible transition animating";
                pxsim.U.addClass(el, animationClasses);
                Promise.resolve().delay(500).then(function () {
                    pxsim.U.removeClass(el, "animating");
                    el.style.animationDuration = '';
                    if (completeHandler)
                        completeHandler();
                    pxsim.U.remove(el);
                });
            }
        },
        unhideElement: function (el) {
            pxsim.U.removeClass(el, "simHeadless");
        },
        onDebuggerBreakpoint: function (brk) {
            // walk stack until breakpoint is found
            // and can be highlighted
            var highlighted = false;
            if (config) {
                var frameid = 0;
                var brkid = brk.breakpointId;
                while (!highlighted) {
                    // try highlight current statement
                    if (brkid) {
                        var brkInfo = lastCompileResult.breakpoints[brkid];
                        highlighted = config.highlightStatement(brkInfo, brk);
                    }
                    // try next frame
                    if (!highlighted) {
                        frameid++;
                        var frame = brk.stackframes ? brk.stackframes[frameid] : undefined;
                        // no more frames, done
                        if (!frame)
                            break;
                        brkid = frame.breakpointId;
                    }
                }
            }
            // no exception and no highlighting, keep going
            if (!brk.exceptionMessage && config && !highlighted) {
                // keep going until breakpoint is hit
                exports.driver.resume(pxsim.SimulatorDebuggerCommand.StepInto);
                return;
            }
            // we had an expected but could not find a block
            if (!highlighted && brk.exceptionMessage) {
                pxt.debug("runtime error: " + brk.exceptionMessage);
                pxt.debug(brk.exceptionStack);
                if (config)
                    config.orphanException(brk);
            }
            postSimEditorEvent("stopped", brk.exceptionMessage);
        },
        onTraceMessage: function (msg) {
            var brkInfo = lastCompileResult.breakpoints[msg.breakpointId];
            if (config)
                config.highlightStatement(brkInfo);
        },
        onDebuggerWarning: function (wrn) {
            for (var _i = 0, _a = wrn.breakpointIds; _i < _a.length; _i++) {
                var id = _a[_i];
                var brkInfo = lastCompileResult.breakpoints[id];
                if (brkInfo) {
                    if (!U.startsWith("pxt_modules/", brkInfo.fileName)) {
                        if (config)
                            config.highlightStatement(brkInfo);
                        break;
                    }
                }
            }
        },
        onDebuggerResume: function () {
            postSimEditorEvent("resumed");
            if (config)
                config.highlightStatement(null);
        },
        onStateChanged: function (state) {
            if (state === pxsim.SimulatorState.Stopped) {
                postSimEditorEvent("stopped");
            }
            else if (state === pxsim.SimulatorState.Running) {
                this.onDebuggerResume();
            }
            cfg.onStateChanged(state);
        },
        onSimulatorCommand: function (msg) {
            switch (msg.command) {
                case "setstate":
                    cfg.setState(msg.stateKey, msg.stateValue);
                    break;
                case "restart":
                    cfg.restartSimulator();
                    break;
                case "reload":
                    stop(true);
                    cfg.restartSimulator();
                    break;
                case "modal":
                    stop();
                    if (!pxt.shell.isSandboxMode() && (!msg.displayOnceId || !displayedModals[msg.displayOnceId])) {
                        var modalOpts = {
                            header: msg.header,
                            body: msg.body,
                            size: "large",
                            copyable: msg.copyable,
                            disagreeLbl: lf("Close"),
                            modalContext: msg.modalContext
                        };
                        var trustedSimUrls = pxt.appTarget.simulator.trustedUrls;
                        var hasTrustedLink_1 = msg.linkButtonHref && trustedSimUrls && trustedSimUrls.indexOf(msg.linkButtonHref) !== -1;
                        if (hasTrustedLink_1) {
                            modalOpts.agreeLbl = msg.linkButtonLabel;
                        }
                        else {
                            modalOpts.hideAgree = true;
                        }
                        displayedModals[msg.displayOnceId] = true;
                        core.confirmAsync(modalOpts)
                            .then(function (selection) {
                            if (hasTrustedLink_1 && selection == 1) {
                                window.open(msg.linkButtonHref, '_blank');
                            }
                        })
                            .done();
                    }
                    break;
            }
        },
        onTopLevelCodeEnd: function () {
            postSimEditorEvent("toplevelfinished");
        },
        stoppedClass: pxt.appTarget.simulator && pxt.appTarget.simulator.stoppedClass,
        invalidatedClass: pxt.appTarget.simulator && pxt.appTarget.simulator.invalidatedClass,
    };
    exports.driver = new pxsim.SimulatorDriver(document.getElementById('simulators'), options);
    config = cfg;
}
exports.init = init;
function postSimEditorEvent(subtype, exception) {
    if (pxt.appTarget.appTheme.allowParentController && pxt.BrowserUtils.isIFrame()) {
        pxt.editor.postHostMessageAsync({
            type: "pxthost",
            action: "simevent",
            subtype: subtype,
            exception: exception
        });
    }
}
var tutorialMode = false;
function setState(editor, tutMode) {
    if (config && config.editor != editor) {
        config.editor = editor;
        config.highlightStatement(null);
    }
    tutorialMode = tutMode;
}
exports.setState = setState;
function setDirty() {
    if (exports.driver)
        exports.driver.setDirty();
}
exports.setDirty = setDirty;
function setPending() {
    if (exports.driver)
        exports.driver.setPending();
}
exports.setPending = setPending;
function run(pkg, debug, res, options) {
    var js = res.outfiles[pxtc.BINARY_JS];
    var boardDefinition = pxt.appTarget.simulator.boardDefinition;
    var parts = pxtc.computeUsedParts(res, true);
    var fnArgs = res.usedArguments;
    lastCompileResult = res;
    var mute = options.mute, highContrast = options.highContrast, light = options.light, clickTrigger = options.clickTrigger, storedState = options.storedState, autoRun = options.autoRun;
    var opts = {
        boardDefinition: boardDefinition,
        mute: mute,
        parts: parts,
        debug: debug,
        fnArgs: fnArgs,
        highContrast: highContrast,
        light: light,
        aspectRatio: parts.length ? pxt.appTarget.simulator.partsAspectRatio : pxt.appTarget.simulator.aspectRatio,
        partDefinitions: pkg.computePartDefinitions(parts),
        cdnUrl: pxt.webConfig.commitCdnUrl,
        localizedStrings: exports.simTranslations,
        refCountingDebug: pxt.options.debug,
        version: pkg.version(),
        clickTrigger: clickTrigger,
        breakOnStart: debug,
        storedState: storedState,
        autoRun: autoRun
    };
    //if (pxt.options.debug)
    //    pxt.debug(JSON.stringify(opts, null, 2))
    postSimEditorEvent("started");
    exports.driver.run(js, opts);
}
exports.run = run;
function mute(mute) {
    if (!exports.driver)
        return;
    exports.driver.mute(mute);
}
exports.mute = mute;
function stop(unload, starting) {
    if (!exports.driver)
        return;
    exports.driver.stopSound();
    exports.driver.stop(unload, starting);
}
exports.stop = stop;
function suspend() {
    if (!exports.driver)
        return;
    exports.driver.suspend();
}
exports.suspend = suspend;
function hide(completeHandler) {
    if (!exports.driver)
        return;
    exports.driver.hide(completeHandler);
}
exports.hide = hide;
function unhide() {
    if (!exports.driver)
        return;
    exports.driver.unhide();
}
exports.unhide = unhide;
function setTraceInterval(intervalMs) {
    if (!exports.driver)
        return;
    exports.driver.setTraceInterval(intervalMs);
}
exports.setTraceInterval = setTraceInterval;
function proxy(message) {
    if (!exports.driver)
        return;
    exports.driver.postMessage(message);
}
exports.proxy = proxy;
function dbgPauseResume() {
    if (exports.driver.state == pxsim.SimulatorState.Paused) {
        exports.driver.resume(pxsim.SimulatorDebuggerCommand.Resume);
    }
    else if (exports.driver.state == pxsim.SimulatorState.Running) {
        exports.driver.resume(pxsim.SimulatorDebuggerCommand.Pause);
    }
}
exports.dbgPauseResume = dbgPauseResume;
function dbgStepOver() {
    if (exports.driver.state == pxsim.SimulatorState.Paused) {
        exports.driver.resume(pxsim.SimulatorDebuggerCommand.StepOver);
    }
}
exports.dbgStepOver = dbgStepOver;
function dbgStepInto() {
    if (exports.driver.state == pxsim.SimulatorState.Paused) {
        exports.driver.resume(pxsim.SimulatorDebuggerCommand.StepInto);
    }
}
exports.dbgStepInto = dbgStepInto;
function dbgStepOut() {
    if (exports.driver.state == pxsim.SimulatorState.Paused) {
        exports.driver.resume(pxsim.SimulatorDebuggerCommand.StepOut);
    }
}
exports.dbgStepOut = dbgStepOut;
