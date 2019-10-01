"use strict";
/// <reference path="../../localtypings/pxtblockly.d.ts" />
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
var pkg = require("./package");
var core = require("./core");
var toolboxeditor = require("./toolboxeditor");
var compiler = require("./compiler");
var toolbox = require("./toolbox");
var snippets = require("./blocksSnippets");
var workspace = require("./workspace");
var simulator = require("./simulator");
var createFunction_1 = require("./createFunction");
var snippetBuilder_1 = require("./snippetBuilder");
var Util = pxt.Util;
var debuggerToolbox_1 = require("./debuggerToolbox");
var Editor = /** @class */ (function (_super) {
    __extends(Editor, _super);
    function Editor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.isFirstBlocklyLoad = true;
        _this.functionsDialog = null;
        _this.showCategories = true;
        _this.markIncomplete = false;
        _this.handleToolboxRef = function (c) {
            _this.toolbox = c;
        };
        _this.handleDebuggerToolboxRef = function (c) {
            _this.debuggerToolbox = c;
        };
        _this.flyoutBlockXmlCache = {};
        _this.flyoutXmlList = [];
        _this.flyouts = {};
        return _this;
    }
    Editor.prototype.setBreakpointsMap = function (breakpoints) {
        var _this = this;
        var map = {};
        if (!breakpoints || !this.compilationResult)
            return;
        breakpoints.forEach(function (breakpoint) {
            var blockId = pxt.blocks.findBlockId(_this.compilationResult.sourceMap, { start: breakpoint.line, length: breakpoint.endLine - breakpoint.line });
            if (blockId)
                map[blockId] = breakpoint.id;
        });
        this.breakpointsByBlock = map;
    };
    Editor.prototype.setBreakpointsFromBlocks = function () {
        this.breakpointsSet = this.getBreakpoints();
        simulator.driver.setBreakpoints(this.breakpointsSet);
    };
    Editor.prototype.getBreakpoints = function () {
        var _this = this;
        var breakpoints = [];
        var map = this.breakpointsByBlock;
        if (map && this.editor) {
            this.editor.getAllBlocks().forEach(function (block) {
                if (map[block.id] && block.isBreakpointSet()) {
                    breakpoints.push(_this.breakpointsByBlock[block.id]);
                }
            });
        }
        return breakpoints;
    };
    Editor.prototype.addBreakpointFromEvent = function (blockId) {
        this.breakpointsSet.push(this.breakpointsByBlock[blockId]);
        simulator.driver.setBreakpoints(this.breakpointsSet);
    };
    Editor.prototype.removeBreakpointFromEvent = function (blockId) {
        var breakpointId = this.breakpointsByBlock[blockId];
        this.breakpointsSet.filter(function (breakpoint) { return breakpoint != breakpointId; });
        simulator.driver.setBreakpoints(this.breakpointsSet);
    };
    Editor.prototype.clearBreakpoints = function () {
        simulator.driver.setBreakpoints([]);
    };
    Editor.prototype.setVisible = function (v) {
        _super.prototype.setVisible.call(this, v);
        this.isVisible = v;
        var classes = '#blocksEditor .blocklyToolboxDiv, #blocksEditor .blocklyWidgetDiv, #blocksEditor .blocklyToolboxDiv';
        if (this.isVisible) {
            pxt.Util.toArray(document.querySelectorAll(classes)).forEach(function (el) { return el.style.display = ''; });
            // Fire a resize event since the toolbox may have changed width and height.
            this.parent.fireResize();
        }
        else {
            pxt.Util.toArray(document.querySelectorAll(classes)).forEach(function (el) { return el.style.display = 'none'; });
            if (this.editor)
                Blockly.hideChaff();
        }
    };
    Editor.prototype.saveToTypeScriptAsync = function () {
        var _this = this;
        if (!this.typeScriptSaveable)
            return Promise.resolve(undefined);
        this.clearHighlightedStatements();
        try {
            return pxt.blocks.compileAsync(this.editor, this.blockInfo)
                .then(function (compilationResult) {
                _this.compilationResult = compilationResult;
                pxt.tickActivity("blocks.compile");
                return _this.compilationResult.source;
            });
        }
        catch (e) {
            pxt.reportException(e);
            core.errorNotification(lf("Sorry, we were not able to convert this program."));
            return Promise.resolve(undefined);
        }
    };
    Editor.prototype.updateBlocksInfo = function (bi) {
        this.blockInfo = bi;
        this.refreshToolbox();
    };
    Editor.prototype.domUpdate = function () {
        var _this = this;
        if (this.delayLoadXml) {
            if (this.loadingXml)
                return;
            pxt.debug("loading blockly");
            this.loadingXml = true;
            var loadingDimmer_1 = document.createElement("div");
            loadingDimmer_1.className = "ui active dimmer";
            var loading = document.createElement("div");
            loading.className = "ui text loader";
            loading.appendChild(document.createTextNode(lf("Loading blocks...")));
            loadingDimmer_1.appendChild(loading);
            var editorDiv_1 = document.getElementById("blocksEditor");
            editorDiv_1.appendChild(loadingDimmer_1);
            this.loadingXmlPromise = this.loadBlocklyAsync()
                .then(function () { return compiler.getBlocksAsync(); })
                .then(function (bi) {
                _this.blockInfo = bi;
                // Initialize blocks in Blockly and update our toolbox
                pxt.blocks.initialize(_this.blockInfo);
                _this.nsMap = _this.partitionBlocks();
                _this.refreshToolbox();
                pxt.debug("loading block workspace");
                var xml = _this.delayLoadXml;
                _this.delayLoadXml = undefined;
                _this.loadBlockly(xml);
                _this.resize();
                Blockly.svgResize(_this.editor);
                _this.isFirstBlocklyLoad = false;
            }).finally(function () {
                _this.loadingXml = false;
                try {
                    // It's possible Blockly reloads and the loading dimmer is no longer a child of the editorDiv
                    editorDiv_1.removeChild(loadingDimmer_1);
                }
                catch (_a) { }
            });
            this.loadingXmlPromise.done();
            this.loadingXmlPromise = null;
        }
    };
    Editor.prototype.isDropdownDivVisible = function () {
        return typeof Blockly !== "undefined"
            && Blockly.DropDownDiv
            && Blockly.DropDownDiv.isVisible();
    };
    Editor.prototype.saveBlockly = function () {
        // make sure we don't return an empty document before we get started
        // otherwise it may get saved and we're in trouble
        if (this.delayLoadXml)
            return this.delayLoadXml;
        return this.serializeBlocks();
    };
    Editor.prototype.serializeBlocks = function (normalize) {
        // store ids when using github
        var xml = pxt.blocks.saveWorkspaceXml(this.editor, !normalize && !!this.parent.state.header.githubId);
        // strip out id, x, y attributes
        if (normalize)
            xml = xml.replace(/(x|y|id)="[^"]*"/g, '');
        pxt.debug(xml);
        return xml;
    };
    Editor.prototype.loadBlockly = function (s) {
        if (this.serializeBlocks() == s) {
            this.typeScriptSaveable = true;
            pxt.debug('blocks already loaded...');
            return false;
        }
        this.typeScriptSaveable = false;
        pxt.blocks.clearWithoutEvents(this.editor);
        try {
            var text = s || "<block type=\"" + ts.pxtc.ON_START_TYPE + "\"></block>";
            var xml = Blockly.Xml.textToDom(text);
            pxt.blocks.domToWorkspaceNoEvents(xml, this.editor);
            this.initLayout();
            this.editor.clearUndo();
            this.reportDeprecatedBlocks();
            this.typeScriptSaveable = true;
        }
        catch (e) {
            pxt.log(e);
            pxt.blocks.clearWithoutEvents(this.editor);
            this.switchToTypeScript();
            this.changeCallback();
            return false;
        }
        this.changeCallback();
        return true;
    };
    Editor.prototype.initLayout = function () {
        var minX;
        var minY;
        var needsLayout = false;
        var flyoutOnly = !this.editor.toolbox_ && this.editor.flyout_;
        this.editor.getTopComments(false).forEach(function (b) {
            var tpX = b.getBoundingRectangle().left;
            var tpY = b.getBoundingRectangle().top;
            if (minX === undefined || tpX < minX) {
                minX = tpX;
            }
            if (minY === undefined || tpY < minY) {
                minY = tpY;
            }
            needsLayout = needsLayout || (tpX == 10 && tpY == 10);
        });
        this.editor.getTopBlocks(false).forEach(function (b) {
            var tpX = b.getBoundingRectangle().left;
            var tpY = b.getBoundingRectangle().top;
            if (minX === undefined || tpX < minX) {
                minX = tpX;
            }
            if (minY === undefined || tpY < minY) {
                minY = tpY;
            }
            needsLayout = needsLayout || (b.type != ts.pxtc.ON_START_TYPE && tpX == 10 && tpY == 10);
        });
        if (needsLayout && !flyoutOnly) {
            // If the blocks file has no location info (e.g. it's from the decompiler), format the code.
            pxt.blocks.layout.flow(this.editor, { useViewWidth: true });
        }
        else {
            // Otherwise translate the blocks so that they are positioned on the top left
            this.editor.getTopComments(false).forEach(function (c) { return c.moveBy(-minX, -minY); });
            this.editor.getTopBlocks(false).forEach(function (b) { return b.moveBy(-minX, -minY); });
            this.editor.scrollX = flyoutOnly ? this.editor.flyout_.width_ + 10 : 10;
            this.editor.scrollY = 10;
            // Forces scroll to take effect
            this.editor.resizeContents();
        }
    };
    Editor.prototype.initPrompts = function () {
        // Overriding blockly prompts to use semantic modals
        /**
         * Wrapper to window.alert() that app developers may override to
         * provide alternatives to the modal browser window.
         * @param {string} message The message to display to the user.
         * @param {function()=} opt_callback The callback when the alert is dismissed.
         */
        Blockly.alert = function (message, opt_callback) {
            return core.confirmAsync({
                hideCancel: true,
                header: lf("Alert"),
                agreeLbl: lf("Ok"),
                agreeClass: "positive",
                agreeIcon: "checkmark",
                body: message,
                size: "tiny"
            }).then(function () {
                if (opt_callback) {
                    opt_callback();
                }
            });
        };
        /**
         * Wrapper to window.confirm() that app developers may override to
         * provide alternatives to the modal browser window.
         * @param {string} message The message to display to the user.
         * @param {!function(boolean)} callback The callback for handling user response.
         */
        Blockly.confirm = function (message, callback) {
            return core.confirmAsync({
                header: lf("Confirm"),
                body: message,
                agreeLbl: lf("Yes"),
                agreeClass: "positive",
                agreeIcon: "checkmark",
                disagreeLbl: lf("No"),
                disagreeClass: "cancel",
                disagreeIcon: "cancel",
                size: "tiny"
            }).then(function (b) {
                callback(b == 1);
            });
        };
        /**
         * Wrapper to window.prompt() that app developers may override to provide
         * alternatives to the modal browser window. Built-in browser prompts are
         * often used for better text input experience on mobile device. We strongly
         * recommend testing mobile when overriding this.
         * @param {string} message The message to display to the user.
         * @param {string} defaultValue The value to initialize the prompt with.
         * @param {!function(string)} callback The callback for handling user reponse.
         */
        Blockly.prompt = function (message, defaultValue, callback) {
            return core.promptAsync({
                header: message,
                initialValue: defaultValue,
                agreeLbl: lf("Ok"),
                disagreeLbl: lf("Cancel"),
                size: "tiny"
            }).then(function (value) {
                callback(value);
            });
        };
    };
    Editor.prototype.initBlocklyToolbox = function () {
        var editor = this;
        /**
         * Move the toolbox to the edge.
         */
        var oldToolboxPosition = Blockly.Toolbox.prototype.position;
        Blockly.Toolbox.prototype.position = function () {
            oldToolboxPosition.call(this);
            editor.resizeToolbox();
        };
        /**
         * Override blockly methods to support our custom toolbox.
         */
        var that = this;
        Blockly.WorkspaceSvg.prototype.refreshToolboxSelection = function () {
            var ws = this.isFlyout ? this.targetWorkspace : this;
            if (ws && !ws.currentGesture_ && ws.toolbox_ && ws.toolbox_.flyout_) {
                that.toolbox.refreshSelection();
            }
        };
        var oldHideChaff = Blockly.hideChaff;
        Blockly.hideChaff = function (opt_allowToolbox) {
            oldHideChaff(opt_allowToolbox);
            if (!opt_allowToolbox)
                that.hideFlyout();
        };
    };
    Editor.prototype.initWorkspaceSounds = function () {
        var editor = this;
        var oldAudioPlay = Blockly.WorkspaceAudio.prototype.play;
        Blockly.WorkspaceAudio.prototype.play = function (name, opt_volume) {
            if (editor && editor.parent.state.mute)
                opt_volume = 0;
            oldAudioPlay.call(this, name, opt_volume);
        };
    };
    Editor.prototype.reportDeprecatedBlocks = function () {
        var deprecatedMap = {};
        var deprecatedBlocksFound = false;
        this.blockInfo.blocks.forEach(function (symbolInfo) {
            if (symbolInfo.attributes.deprecated) {
                deprecatedMap[symbolInfo.attributes.blockId] = 0;
            }
        });
        this.editor.getAllBlocks().forEach(function (block) {
            if (deprecatedMap[block.type] >= 0) {
                deprecatedMap[block.type]++;
                deprecatedBlocksFound = true;
            }
        });
        for (var block in deprecatedMap) {
            if (deprecatedMap[block] !== 0) {
                pxt.tickEvent("blocks.usingDeprecated", { block: block, count: deprecatedMap[block] });
            }
        }
    };
    Editor.prototype.contentSize = function () {
        return this.editor ? pxt.blocks.blocksMetrics(this.editor) : undefined;
    };
    Editor.prototype.isIncomplete = function () {
        var incomplete = this.editor && (this.editor.currentGesture_ && this.editor.currentGesture_.isDraggingBlock_);
        if (incomplete)
            this.markIncomplete = true;
        return incomplete;
    };
    Editor.prototype.prepare = function () {
        this.isReady = true;
    };
    Editor.prototype.prepareBlockly = function (forceHasCategories) {
        var _this = this;
        var blocklyDiv = document.getElementById('blocksEditor');
        pxsim.U.clear(blocklyDiv);
        this.editor = Blockly.inject(blocklyDiv, this.getBlocklyOptions(forceHasCategories));
        // set Blockly Colors
        var blocklyColors = Blockly.Colours;
        Util.jsonMergeFrom(blocklyColors, pxt.appTarget.appTheme.blocklyColors || {});
        Blockly.Colours = blocklyColors;
        var shouldRestartSim = false;
        this.editor.addChangeListener(function (ev) {
            Blockly.Events.disableOrphans(ev);
            if (ev.type != 'ui' || _this.markIncomplete) {
                _this.changeCallback();
                _this.markIncomplete = false;
            }
            if (ev.type == 'create') {
                var blockId = ev.xml.getAttribute('type');
                if (blockId == "variables_set") {
                    // Need to bump suffix in flyout
                    _this.clearFlyoutCaches();
                }
                pxt.tickEvent("blocks.create", { "block": blockId });
                if (ev.xml.tagName == 'SHADOW')
                    _this.cleanUpShadowBlocks();
                _this.parent.setState({ hideEditorFloats: false });
                workspace.fireEvent({ type: 'create', editor: 'blocks', blockId: blockId });
            }
            else if (ev.type == "var_create" || ev.type == "var_rename" || ev.type == "delete") {
                // a new variable name is used or blocks were removed,
                // clear the toolbox caches as some blocks may need to be recomputed
                _this.clearFlyoutCaches();
            }
            else if (ev.type == 'ui') {
                if (ev.element == 'category') {
                    var toolboxVisible = !!ev.newValue;
                    if (toolboxVisible) {
                        // WARNING! Because we use the category open/close event to dismiss
                        // the cookie banner, be careful when manipulating the toolbox to make
                        // sure that this event only fires as the result of user action. Use
                        // Blockly.Events.disable() and Blockly.Events.enable() to prevent
                        // UI events from firing.
                        pxt.analytics.enableCookies();
                    }
                    _this.parent.setState({ hideEditorFloats: toolboxVisible });
                }
                else if (ev.element == 'breakpointSet') {
                    _this.setBreakpointsFromBlocks();
                    // if (ev.newValue) {
                    //     this.addBreakpointFromEvent(ev.blockId);
                    // } else {
                    //     this.removeBreakpointFromEvent(ev.blockId);
                    // }
                }
                else if (ev.element == 'melody-editor') {
                    if (ev.newValue) {
                        shouldRestartSim = _this.parent.state.simState != pxt.editor.SimState.Stopped;
                        _this.parent.stopSimulator();
                    }
                    else {
                        if (shouldRestartSim) {
                            _this.parent.startSimulator();
                        }
                    }
                }
            }
            // reset tutorial hint animation on any blockly event
            if (_this.parent.state.tutorialOptions != undefined) {
                _this.parent.pokeUserActivity();
            }
        });
        if (this.shouldShowCategories()) {
            this.renderToolbox();
        }
        this.hideFlyout();
        this.initPrompts();
        this.initBlocklyToolbox();
        this.initWorkspaceSounds();
        this.resize();
    };
    Editor.prototype.resize = function (e) {
        var blocklyArea = this.getBlocksAreaDiv();
        if (!blocklyArea)
            return;
        var blocklyDiv = this.getBlocksEditorDiv();
        // Position blocklyDiv over blocklyArea.
        if (blocklyDiv && this.editor) {
            blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
            blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
            Blockly.svgResize(this.editor);
            this.resizeToolbox();
        }
    };
    Editor.prototype.resizeToolbox = function () {
        var blocklyDiv = this.getBlocksEditorDiv();
        if (!blocklyDiv)
            return;
        var blocklyToolboxDiv = this.getBlocklyToolboxDiv();
        if (!blocklyToolboxDiv)
            return;
        if (this.parent.isBlocksActive())
            this.parent.updateEditorLogo(blocklyToolboxDiv.offsetWidth);
        var blocklyOptions = this.getBlocklyOptions(this.showCategories);
        if (!blocklyOptions.horizontalLayout)
            blocklyToolboxDiv.style.height = "100%";
    };
    Editor.prototype.hasUndo = function () {
        return this.editor ? this.editor.undoStack_.length != 0 : false;
    };
    Editor.prototype.undo = function () {
        if (!this.editor)
            return;
        this.editor.undo(false);
        Blockly.hideChaff();
        this.parent.forceUpdate();
    };
    Editor.prototype.hasRedo = function () {
        return this.editor ? this.editor.redoStack_.length != 0 : false;
    };
    Editor.prototype.redo = function () {
        if (!this.editor)
            return;
        this.editor.undo(true);
        Blockly.hideChaff();
        this.parent.forceUpdate();
    };
    Editor.prototype.zoomIn = function () {
        if (!this.editor)
            return;
        this.editor.zoomCenter(2);
    };
    Editor.prototype.zoomOut = function () {
        if (!this.editor)
            return;
        this.editor.zoomCenter(-2);
    };
    Editor.prototype.setScale = function (scale) {
        if (!this.editor)
            return;
        if (scale != this.editor.scale) {
            this.editor.setScale(scale);
        }
    };
    Editor.prototype.closeFlyout = function () {
        if (!this.editor)
            return;
        this.hideFlyout();
        Blockly.hideChaff();
    };
    Editor.prototype.getId = function () {
        return "blocksArea";
    };
    Editor.prototype.display = function () {
        return (React.createElement("div", null,
            React.createElement("div", { id: "blocksEditor" }),
            React.createElement(toolbox.ToolboxTrashIcon, null)));
    };
    Editor.prototype.getBlocksAreaDiv = function () {
        return document.getElementById('blocksArea');
    };
    Editor.prototype.getBlocksEditorDiv = function () {
        var blocksArea = this.getBlocksAreaDiv();
        return blocksArea ? document.getElementById('blocksEditor') : undefined;
    };
    Editor.prototype.getBlocklyToolboxDiv = function () {
        var blocksArea = this.getBlocksAreaDiv();
        return blocksArea ? blocksArea.getElementsByClassName('blocklyToolboxDiv')[0] : undefined;
    };
    Editor.prototype.renderToolbox = function (immediate) {
        if (pxt.shell.isReadOnly())
            return;
        var blocklyToolboxDiv = this.getBlocklyToolboxDiv();
        var blocklyToolbox = React.createElement("div", { className: "blocklyToolbox" },
            React.createElement(toolbox.Toolbox, { ref: this.handleToolboxRef, editorname: "blocks", parent: this }),
            React.createElement("div", { id: "debuggerToolbox" }));
        Util.assert(!!blocklyToolboxDiv);
        ReactDOM.render(blocklyToolbox, blocklyToolboxDiv);
        if (!immediate)
            this.toolbox.showLoading();
    };
    Editor.prototype.updateToolbox = function () {
        var container = document.getElementById('debuggerToolbox');
        if (!container)
            return;
        var debugging = !!this.parent.state.debugging;
        var debuggerToolbox = debugging ? React.createElement(debuggerToolbox_1.DebuggerToolbox, { ref: this.handleDebuggerToolboxRef, parent: this.parent, apis: this.blockInfo.apis.byQName }) : React.createElement("div", null);
        if (debugging) {
            this.toolbox.hide();
        }
        else {
            this.debuggerToolbox = null;
            this.toolbox.show();
        }
        ReactDOM.render(debuggerToolbox, container);
    };
    Editor.prototype.showPackageDialog = function () {
        pxt.tickEvent("blocks.addpackage");
        if (this.editor.toolbox_)
            this.editor.toolbox_.clearSelection();
        this.parent.showPackageDialog();
    };
    Editor.prototype.showVariablesFlyout = function () {
        this.showFlyoutInternal_(Blockly.Variables.flyoutCategory(this.editor), "variables");
    };
    Editor.prototype.showFunctionsFlyout = function () {
        this.showFlyoutInternal_(Blockly.Functions.flyoutCategory(this.editor), "functions");
    };
    Editor.prototype.getViewState = function () {
        // ZOOM etc
        return {};
    };
    Editor.prototype.setViewState = function (pos) { };
    Editor.prototype.getCurrentSource = function () {
        return this.editor && !this.delayLoadXml ? this.saveBlockly() : this.currSource;
    };
    Editor.prototype.acceptsFile = function (file) {
        return file.getExtension() == "blocks";
    };
    Editor.prototype.overrideFile = function (content) {
        if (this.delayLoadXml) {
            this.delayLoadXml = content;
            this.currSource = content;
        }
        else {
            this.loadBlockly(content);
        }
    };
    // TODO: remove this, we won't use it anymore
    Editor.prototype.insertBreakpoint = function () {
        if (!this.editor)
            return;
        var b = this.editor.newBlock(pxtc.TS_DEBUGGER_TYPE);
        // move block roughly to the center of the screen
        var m = this.editor.getMetrics();
        b.moveBy(m.viewWidth / 2, m.viewHeight / 3);
        b.initSvg();
        b.render();
    };
    Editor.prototype.loadBlocklyAsync = function () {
        var _this = this;
        if (!this._loadBlocklyPromise)
            this._loadBlocklyPromise = pxt.BrowserUtils.loadBlocklyAsync()
                .then(function () {
                pxt.blocks.openHelpUrl = function (url) {
                    pxt.tickEvent("blocks.help", { url: url }, { interactiveConsent: true });
                    var m = /^\/pkg\/([^#]+)#(.+)$/.exec(url);
                    if (m) {
                        var dep = pkg.mainPkg.deps[m[1]];
                        if (dep && dep.verProtocol() == "github") {
                            // rewrite url to point to current endpoint
                            url = "/pkg/" + dep.verArgument().replace(/#.*$/, '') + "#" + m[2];
                            window.open(url, m[1]);
                            return; // TODO support serving package docs in docs frame.
                        }
                    }
                    ;
                    if (/^\//.test(url))
                        _this.parent.setSideDoc(url);
                    else
                        window.open(url, 'docs');
                };
                _this.prepareBlockly();
            })
                .then(function () { return pxt.editor.initEditorExtensionsAsync(); });
        return this._loadBlocklyPromise;
    };
    Editor.prototype.loadFileAsync = function (file) {
        var _this = this;
        Util.assert(!this.delayLoadXml);
        Util.assert(!this.loadingXmlPromise);
        return this.loadBlocklyAsync()
            .then(function () {
            pxt.blocks.cleanBlocks();
            if (_this.toolbox)
                _this.toolbox.showLoading();
            _this.blockInfo = undefined;
            _this.currSource = file.content;
            _this.typeScriptSaveable = false;
            _this.setDiagnostics(file);
            _this.delayLoadXml = file.content;
            pxt.blocks.clearWithoutEvents(_this.editor);
            _this.closeFlyout();
            _this.filterToolbox();
            if (_this.parent.state.editorState && _this.parent.state.editorState.hasCategories != undefined) {
                _this.showCategories = _this.parent.state.editorState.hasCategories;
            }
            else {
                _this.showCategories = true;
            }
            _this.currFile = file;
            // Clear the search field if a value exists
            var searchField = document.getElementById('blocklySearchInputField');
            if (searchField && searchField.value) {
                searchField.value = '';
            }
            // Get extension packages
            _this.extensions = pkg.allEditorPkgs()
                .map(function (ep) { return ep.getKsPkg(); }).map(function (p) { return !!p && p.config; })
                .filter(function (config) { return !!config && !!config.extension && /^(file:|github:)/.test(config.installedVersion); });
            // Initialize the "Make a function" button
            Blockly.Functions.editFunctionExternalHandler = function (mutation, cb) {
                Promise.resolve()
                    .delay(10)
                    .then(function () {
                    if (!_this.functionsDialog) {
                        var wrapper = document.body.appendChild(document.createElement('div'));
                        _this.functionsDialog = ReactDOM.render(React.createElement(createFunction_1.CreateFunctionDialog), wrapper);
                    }
                    _this.functionsDialog.show(mutation, cb, _this.editor);
                });
            };
        });
    };
    Editor.prototype.unloadFileAsync = function () {
        this.delayLoadXml = undefined;
        if (this.toolbox)
            this.toolbox.clearSearch();
        return Promise.resolve();
    };
    Editor.prototype.switchToTypeScript = function () {
        pxt.tickEvent("blocks.switchjavascript");
        this.parent.closeFlyout();
        this.parent.switchTypeScript();
    };
    Editor.prototype.setDiagnostics = function (file) {
        var _this = this;
        Util.assert(this.editor != undefined); // Guarded
        if (!this.compilationResult || this.delayLoadXml || this.loadingXml)
            return;
        // clear previous warnings on non-disabled blocks
        this.editor.getAllBlocks().filter(function (b) { return b.isEnabled(); }).forEach(function (b) {
            b.setWarningText(null);
            b.setHighlightWarning(false);
        });
        var tsfile = file.epkg.files[file.getVirtualFileName(pxt.JAVASCRIPT_PROJECT_NAME)];
        if (!tsfile || !tsfile.diagnostics)
            return;
        // only show errors
        var diags = tsfile.diagnostics.filter(function (d) { return d.category == ts.pxtc.DiagnosticCategory.Error; });
        var sourceMap = this.compilationResult.sourceMap;
        diags.filter(function (diag) { return diag.category == ts.pxtc.DiagnosticCategory.Error; }).forEach(function (diag) {
            var bid = pxt.blocks.findBlockId(sourceMap, { start: diag.line, length: 0 });
            if (bid) {
                var b = _this.editor.getBlockById(bid);
                if (b) {
                    var txt = ts.pxtc.flattenDiagnosticMessageText(diag.messageText, "\n");
                    b.setWarningText(txt);
                    b.setHighlightWarning(true);
                }
            }
        });
        this.compilationResult.diagnostics.forEach(function (d) {
            if (d.blockId) {
                var b = _this.editor.getBlockById(d.blockId);
                if (b) {
                    b.setWarningText(d.message);
                    b.setHighlightWarning(true);
                }
            }
        });
        this.setBreakpointsFromBlocks();
    };
    Editor.prototype.highlightStatement = function (stmt, brk) {
        if (!this.compilationResult || this.delayLoadXml || this.loadingXml)
            return false;
        this.updateDebuggerVariables(brk);
        if (stmt) {
            var bid = pxt.blocks.findBlockId(this.compilationResult.sourceMap, { start: stmt.line, length: stmt.endLine - stmt.line });
            if (bid) {
                this.editor.highlightBlock(bid);
                if (brk) {
                    var b = this.editor.getBlockById(bid);
                    b.setWarningText(brk ? brk.exceptionMessage : undefined);
                    // ensure highlight is in the screen when a breakpoint info is available
                    // TODO: make warning mode look good
                    // b.setHighlightWarning(brk && !!brk.exceptionMessage);
                    var p = b.getRelativeToSurfaceXY();
                    var c = b.getHeightWidth();
                    var s = this.editor.scale;
                    var m = this.editor.getMetrics();
                    // don't center if block is still on the screen
                    var marginx = 4;
                    var marginy = 4;
                    if (p.x * s < m.viewLeft + marginx
                        || (p.x + c.width) * s > m.viewLeft + m.viewWidth - marginx
                        || p.y * s < m.viewTop + marginy
                        || (p.y + c.height) * s > m.viewTop + m.viewHeight - marginy) {
                        // move the block towards the center
                        this.editor.centerOnBlock(bid);
                    }
                }
                return true;
            }
        }
        else {
            this.editor.highlightBlock(null);
            return false;
        }
        return false;
    };
    Editor.prototype.updateDebuggerVariables = function (brk) {
        if (!this.parent.state.debugging)
            return;
        if (this.debuggerToolbox) {
            var visibleVars = Blockly.Variables.allUsedVarModels(this.editor).map(function (variable) { return variable.name; });
            this.debuggerToolbox.setBreakpoint(brk, visibleVars);
        }
    };
    Editor.prototype.clearHighlightedStatements = function () {
        this.editor.highlightBlock(null);
        if (this.debuggerToolbox)
            this.debuggerToolbox.setBreakpoint(null);
    };
    Editor.prototype.openTypeScript = function () {
        pxt.tickEvent("blocks.showjavascript");
        this.parent.closeFlyout();
        this.parent.openTypeScriptAsync().done();
    };
    Editor.prototype.openPython = function () {
        pxt.tickEvent("blocks.showpython");
        this.parent.closeFlyout();
        this.parent.openPythonAsync().done();
    };
    Editor.prototype.cleanUpShadowBlocks = function () {
        var blocks = this.editor.getTopBlocks(false);
        blocks.filter(function (b) { return b.isShadow(); }).forEach(function (b) { return b.dispose(false); });
    };
    Editor.prototype.getBlocklyOptions = function (forceHasCategories) {
        var blocklyOptions = this.getDefaultOptions();
        Util.jsonMergeFrom(blocklyOptions, pxt.appTarget.appTheme.blocklyOptions || {});
        var hasCategories = (forceHasCategories != undefined) ? forceHasCategories :
            (blocklyOptions.hasCategories != undefined ? blocklyOptions.hasCategories :
                this.showCategories);
        blocklyOptions.hasCategories = hasCategories;
        if (!hasCategories)
            this.showCategories = false;
        // If we're using categories, show the category toolbox, otherwise show the flyout toolbox
        var toolbox = hasCategories ?
            document.getElementById('blocklyToolboxDefinitionCategory')
            : document.getElementById('blocklyToolboxDefinitionFlyout');
        blocklyOptions['toolbox'] = blocklyOptions.toolbox != undefined ?
            blocklyOptions.toolbox : blocklyOptions.readOnly ? undefined : toolbox;
        return blocklyOptions;
    };
    Editor.prototype.getDefaultOptions = function () {
        if (this.blocklyOptionsCache)
            return this.blocklyOptionsCache;
        var readOnly = pxt.shell.isReadOnly();
        var blocklyOptions = {
            scrollbars: true,
            media: pxt.webConfig.commitCdnUrl + "blockly/media/",
            sound: true,
            trashcan: false,
            collapse: false,
            comments: true,
            disable: false,
            readOnly: readOnly,
            toolboxOptions: {
                colour: pxt.appTarget.appTheme.coloredToolbox,
                inverted: pxt.appTarget.appTheme.invertedToolbox
            },
            zoom: {
                enabled: false,
                controls: false,
                wheel: true,
                maxScale: 2.5,
                minScale: .2,
                scaleSpeed: 1.05,
                startScale: pxt.BrowserUtils.isMobile() ? 0.7 : 0.9
            },
            rtl: Util.isUserLanguageRtl()
        };
        this.blocklyOptionsCache = blocklyOptions;
        return blocklyOptions;
    };
    Editor.prototype.refreshToolbox = function () {
        if (!this.blockInfo)
            return;
        // no toolbox when readonly
        if (pxt.shell.isReadOnly())
            return;
        // Dont show toolbox if we're in tutorial mode and we're not ready
        if (this.parent.state.tutorialOptions != undefined &&
            !this.parent.state.tutorialOptions.tutorialReady) {
            return;
        }
        this.clearCaches();
        var hasCategories = this.shouldShowCategories();
        // We might need to switch the toolbox type
        if ((this.editor.toolbox_ && hasCategories) || (this.editor.flyout_ && !hasCategories)) {
            // Toolbox is consistent with current mode, safe to update
            if (hasCategories) {
                this.toolbox.setState({ loading: false, categories: this.getAllCategories(), showSearchBox: this.shouldShowSearch() });
            }
            else {
                this.showFlyoutOnlyToolbox();
            }
        }
        else {
            // Toolbox mode is different, need to refresh.
            if (!hasCategories) {
                // If we're switching from a toolbox to no toolbox, unmount node
                ReactDOM.unmountComponentAtNode(this.getBlocklyToolboxDiv());
            }
            // Refresh Blockly
            this.delayLoadXml = this.getCurrentSource();
            this.editor = undefined;
            this.loadingXml = false;
            if (this.loadingXmlPromise) {
                this.loadingXmlPromise.cancel();
                this.loadingXmlPromise = null;
            }
            this.prepareBlockly(hasCategories);
            this.domUpdate();
            this.editor.scrollCenter();
            if (hasCategories) {
                // If we're switching from no toolbox to a toolbox, mount node
                if (!this.toolbox)
                    this.renderToolbox(true);
            }
        }
    };
    Editor.prototype.filterToolbox = function (showCategories) {
        this.showCategories = showCategories;
        this.refreshToolbox();
    };
    Editor.prototype.openExtension = function (extensionName) {
        var _this = this;
        var extension = this.extensions.filter(function (c) { return c.name == extensionName; })[0];
        var parsedRepo = pxt.github.parseRepoId(extension.installedVersion);
        pxt.packagesConfigAsync()
            .then(function (config) {
            var repoStatus = pxt.github.repoStatus(parsedRepo, config);
            var repoName = parsedRepo.fullName.substr(parsedRepo.fullName.indexOf("/") + 1);
            var localDebug = pxt.BrowserUtils.isLocalHost() && /^file:/.test(extension.installedVersion) && extension.extension.localUrl;
            var debug = pxt.BrowserUtils.isLocalHost() && /debugExtensions/i.test(window.location.href);
            /* tslint:disable:no-http-string */
            var url = debug ? "http://localhost:3232/extension.html"
                : localDebug ? extension.extension.localUrl : "https://" + parsedRepo.owner + ".github.io/" + repoName + "/";
            /* tslint:enable:no-http-string */
            _this.parent.openExtension(extension.name, url, repoStatus == 0); // repoStatus can only be APPROVED or UNKNOWN at this point
        });
    };
    Editor.prototype.partitionBlocks = function () {
        var _this = this;
        var res = {};
        this.topBlocks = [];
        var that = this;
        function setSubcategory(ns, subcat) {
            if (!that.subcategoryMap[ns])
                that.subcategoryMap[ns] = {};
            that.subcategoryMap[ns][subcat] = true;
        }
        pxt.blocks.injectBlocks(this.blockInfo).forEach(function (fn) {
            var ns = (fn.attributes.blockNamespace || fn.namespace).split('.')[0];
            if (!res[ns]) {
                res[ns] = [];
            }
            res[ns].push(fn);
            var subcat = fn.attributes.subcategory;
            var advanced = fn.attributes.advanced;
            if (advanced) {
                // More subcategory
                setSubcategory(ns, lf("more"));
            }
            else if (subcat) {
                setSubcategory(ns, subcat);
            }
            if (fn.attributes.topblock) {
                _this.topBlocks.push(fn);
            }
        });
        return res;
    };
    Editor.prototype.hideFlyout = function () {
        if (this.editor.toolbox_) {
            this.editor.toolbox_.flyout_.hide();
        }
        if (this.toolbox)
            this.toolbox.clear();
    };
    ///////////////////////////////////////////////////////////
    ////////////         Toolbox methods          /////////////
    ///////////////////////////////////////////////////////////
    Editor.prototype.clearCaches = function () {
        _super.prototype.clearCaches.call(this);
        this.clearFlyoutCaches();
        snippets.clearBuiltinBlockCache();
        // note that we don't need to clear the flyout SVG cache since those
        // will regenerate themselves more precisely based on the hash of the
        // input blocks xml.
    };
    Editor.prototype.clearFlyoutCaches = function () {
        this.flyoutBlockXmlCache = {};
    };
    Editor.prototype.shouldShowSearch = function () {
        if (this.parent.state.editorState && this.parent.state.editorState.searchBar != undefined) {
            return this.parent.state.editorState.searchBar;
        }
        return true;
    };
    Editor.prototype.shouldShowCategories = function () {
        if (this.parent.state.editorState && this.parent.state.editorState.hasCategories != undefined) {
            return this.parent.state.editorState.hasCategories;
        }
        var blocklyOptions = this.getBlocklyOptions();
        return blocklyOptions.hasCategories;
    };
    Editor.prototype.getBuiltinCategory = function (ns) {
        return snippets.getBuiltinCategory(ns);
    };
    Editor.prototype.isBuiltIn = function (ns) {
        return snippets.isBuiltin(ns);
    };
    Editor.prototype.getNamespaceAttrs = function (ns) {
        var builtin = snippets.getBuiltinCategory(ns);
        if (builtin) {
            builtin.attributes.color = pxt.toolbox.getNamespaceColor(builtin.nameid);
            return builtin.attributes;
        }
        if (!this.blockInfo)
            return undefined;
        return _super.prototype.getNamespaceAttrs.call(this, ns);
    };
    Editor.prototype.getNamespaces = function () {
        var _this = this;
        var namespaces = Object.keys(this.nsMap)
            .filter(function (ns) { return !snippets.isBuiltin(ns) && !!_this.getNamespaceAttrs(ns); });
        function isRemoved(ns) {
            return snippets.getBuiltinCategory(ns).removed;
        }
        var config = pxt.appTarget.runtime || {};
        if (config.loopsBlocks && !isRemoved("loops" /* Loops */))
            namespaces.push("loops" /* Loops */);
        if (config.logicBlocks && !isRemoved("logic" /* Logic */))
            namespaces.push("logic" /* Logic */);
        if (config.variablesBlocks && !isRemoved("variables" /* Variables */))
            namespaces.push("variables" /* Variables */);
        if (config.mathBlocks && !isRemoved("Math" /* Maths */))
            namespaces.push("Math" /* Maths */);
        if (config.functionBlocks && !isRemoved("functions" /* Functions */))
            namespaces.push("functions" /* Functions */);
        if (config.listsBlocks && !isRemoved("arrays" /* Arrays */))
            namespaces.push("arrays" /* Arrays */);
        if (config.textBlocks && !isRemoved("text" /* Text */))
            namespaces.push("text" /* Text */);
        if (pxt.appTarget.cloud && pxt.appTarget.cloud.packages) {
            namespaces.push("addpackage" /* Extensions */);
        }
        return namespaces.concat(_super.prototype.getNamespaces.call(this));
    };
    ///////////////////////////////////////////////////////////
    ////////////         Flyout methods           /////////////
    ///////////////////////////////////////////////////////////
    Editor.prototype.getBlocksForCategory = function (ns, subns) {
        if (!snippets.isBuiltin(ns)) {
            return this.getNonBuiltInBlocks(ns, subns).concat(this.getExtraBlocks(ns, subns));
        }
        else {
            return this.getBuiltInBlocks(ns, subns).concat(this.getExtraBlocks(ns, subns));
        }
    };
    Editor.prototype.filterBlocks = function (subns, blocks) {
        return blocks.filter((function (block) { return !(block.attributes.blockHidden || block.attributes.deprecated)
            && ((!subns && !block.attributes.subcategory && !block.attributes.advanced)
                || (subns && ((block.attributes.advanced && subns == lf("more"))
                    || (block.attributes.subcategory && subns == block.attributes.subcategory)))); }));
    };
    Editor.prototype.getBuiltInBlocks = function (ns, subns) {
        var cat = snippets.getBuiltinCategory(ns);
        var blocks = cat.blocks || [];
        if (!cat.custom && this.nsMap[ns]) {
            blocks = this.filterBlocks(subns, blocks.concat(this.nsMap[ns]));
        }
        return blocks;
    };
    Editor.prototype.getNonBuiltInBlocks = function (ns, subns) {
        return this.filterBlocks(subns, this.nsMap[ns]) || [];
    };
    Editor.prototype.getExtraBlocks = function (ns, subns) {
        var _this = this;
        if (subns)
            return [];
        var extraBlocks = [];
        var onStartNamespace = pxt.appTarget.runtime.onStartNamespace || "loops";
        if (ns == onStartNamespace) {
            extraBlocks.push({
                name: ts.pxtc.ON_START_TYPE,
                attributes: {
                    blockId: ts.pxtc.ON_START_TYPE,
                    weight: pxt.appTarget.runtime.onStartWeight || 10
                },
                blockXml: "<block type=\"pxt-on-start\"></block>"
            });
        }
        // Inject pause until block
        var pauseUntil = snippets.getPauseUntil();
        if (pauseUntil && ns == pauseUntil.attributes.blockNamespace) {
            extraBlocks.push(pauseUntil);
        }
        // Add extension buttons
        if (!subns) {
            this.extensions.forEach(function (config) {
                var name = config.name;
                var namespace = config.extension.namespace || name;
                if (ns == namespace) {
                    extraBlocks.push({
                        name: "EXT" + name + "_BUTTON",
                        type: "button",
                        attributes: {
                            blockId: "EXT" + name + "_BUTTON",
                            label: config.extension.label ? Util.rlf(config.extension.label) : Util.lf("Editor"),
                            weight: 101
                        },
                        callback: function () {
                            _this.openExtension(name);
                        }
                    });
                }
            });
        }
        if (pxt.appTarget.appTheme.snippetBuilder) {
            // Push snippet extension into extraBlocks
            snippetBuilder_1.initializeSnippetExtensions(ns, extraBlocks, this.editor, this.parent);
        }
        return extraBlocks;
    };
    Editor.prototype.showFlyout = function (treeRow) {
        var ns = treeRow.nameid, subns = treeRow.subns;
        var inTutorial = this.parent.state.tutorialOptions
            && !!this.parent.state.tutorialOptions.tutorial;
        if (ns == 'search') {
            this.showSearchFlyout();
            return;
        }
        if (ns == 'topblocks') {
            this.showTopBlocksFlyout();
            return;
        }
        this.flyoutXmlList = [];
        var cacheKey = ns + subns + (inTutorial ? "tutorialexpanded" : "");
        if (this.flyoutBlockXmlCache[cacheKey]) {
            pxt.debug("showing flyout with blocks from flyout blocks xml cache");
            this.flyoutXmlList = this.flyoutBlockXmlCache[cacheKey];
            this.showFlyoutInternal_(this.flyoutXmlList, cacheKey);
            return;
        }
        if (this.abstractShowFlyout(treeRow)) {
            // Cache blocks xml list for later
            this.flyoutBlockXmlCache[cacheKey] = this.flyoutXmlList;
            this.showFlyoutInternal_(this.flyoutXmlList, cacheKey);
        }
    };
    Editor.prototype.showFlyoutHeadingLabel = function (ns, name, subns, icon, color) {
        var categoryName = name || Util.capitalize(subns || ns);
        var iconClass = ("blocklyTreeIcon" + (icon ? ns.toLowerCase() : 'Default')).replace(/\s/g, '');
        var headingLabel = pxt.blocks.createFlyoutHeadingLabel(categoryName, color, icon, iconClass);
        this.flyoutXmlList.push(headingLabel);
    };
    Editor.prototype.showFlyoutGroupLabel = function (group, groupicon, labelLineWidth, helpCallback) {
        var _this = this;
        var groupLabel = pxt.blocks.createFlyoutGroupLabel(pxt.Util.rlf("{id:group}" + group), groupicon, labelLineWidth, helpCallback ? "GROUP_HELP_" + group : undefined);
        if (helpCallback) {
            this.editor.registerButtonCallback("GROUP_HELP_" + group, function () {
                _this.helpButtonCallback(group);
            });
        }
        this.flyoutXmlList.push(groupLabel);
    };
    Editor.prototype.helpButtonCallback = function (group) {
        pxt.debug(group + " help icon clicked.");
        workspace.fireEvent({ type: 'ui', editor: 'blocks', action: 'groupHelpClicked', data: { group: group } });
    };
    Editor.prototype.showFlyoutBlocks = function (ns, color, blocks) {
        var _this = this;
        var filters = this.parent.state.editorState ? this.parent.state.editorState.filters : undefined;
        blocks.sort(function (f1, f2) {
            // Sort the blocks
            return (f2.attributes.weight != undefined ? f2.attributes.weight : 50)
                - (f1.attributes.weight != undefined ? f1.attributes.weight : 50);
        }).forEach(function (block) {
            var blockXmlList;
            if (block.type == "button") {
                blockXmlList = _this.getButtonXml(block);
            }
            else {
                blockXmlList = _this.getBlockXml(block);
            }
            if (blockXmlList)
                _this.flyoutXmlList = _this.flyoutXmlList.concat(blockXmlList);
        });
    };
    Editor.prototype.showSearchFlyout = function () {
        var _this = this;
        this.flyoutXmlList = [];
        var searchBlocks = this.toolbox.getSearchBlocks();
        searchBlocks.forEach(function (block) {
            var blockXmlList = _this.getBlockXml(block, true);
            if (blockXmlList)
                _this.flyoutXmlList = _this.flyoutXmlList.concat(blockXmlList);
        });
        if (this.flyoutXmlList.length == 0) {
            var label = goog.dom.createDom('label');
            label.setAttribute('text', lf("No search results..."));
            this.flyoutXmlList.push(label);
        }
        this.showFlyoutInternal_(this.flyoutXmlList, "search");
    };
    Editor.prototype.showTopBlocksFlyout = function () {
        var _this = this;
        this.flyoutXmlList = [];
        var topBlocks = this.getTopBlocks();
        if (topBlocks.length == 0) {
            var label = goog.dom.createDom('label');
            label.setAttribute('text', lf("No basic blocks..."));
            this.flyoutXmlList.push(label);
        }
        else {
            // Show a heading
            this.showFlyoutHeadingLabel('topblocks', lf("{id:category}Basic"), null, pxt.toolbox.getNamespaceIcon('topblocks'), pxt.toolbox.getNamespaceColor('topblocks'));
            topBlocks.forEach(function (block) {
                var blockXmlList = _this.getBlockXml(block, true);
                if (blockXmlList)
                    _this.flyoutXmlList = _this.flyoutXmlList.concat(blockXmlList);
            });
        }
        this.showFlyoutInternal_(this.flyoutXmlList);
    };
    Editor.prototype.blocksToString = function (xmlList) {
        var xmlSerializer = null;
        var serialize = function (e) {
            if (!e)
                return "<!-- invalid block here! -->";
            if (e.outerHTML)
                return e.outerHTML;
            // The below code is only needed for IE 11 where outerHTML occassionally returns undefined :/
            if (!xmlSerializer)
                xmlSerializer = new XMLSerializer();
            return xmlSerializer.serializeToString(e);
        };
        return xmlList
            .map(serialize)
            .reduce(function (p, c) { return p + c; }, "");
    };
    Editor.prototype.hashBlocks = function (xmlList) {
        return pxt.Util.codalHash16(this.blocksToString(xmlList));
    };
    Editor.prototype.swapFlyout = function (old, nw) {
        // hide the old flyout
        old.setVisible(false);
        // set the "current" flyout
        this.editor.toolbox_.flyout_ = nw;
        // show the new flyout
        nw.setVisible(true);
        // reflow if scale changed
        var flyoutWs = nw.workspace_;
        var targetWs = nw.targetWorkspace_;
        var scaleChange = flyoutWs.scale !== targetWs.scale;
        if (scaleChange) {
            nw.reflow();
        }
    };
    Editor.prototype.showFlyoutInternal_ = function (xmlList, flyoutName) {
        var _this = this;
        if (flyoutName === void 0) { flyoutName = "default"; }
        if (this.editor.toolbox_) {
            var oldFlyout_1 = this.editor.toolbox_.flyout_;
            // determine if the cached flyout exists and isn't stale
            var hasCachedFlyout = flyoutName in this.flyouts;
            var cachedBlocksHash = hasCachedFlyout ? this.flyouts[flyoutName].blocksHash : 0;
            var currentBlocksHash = this.hashBlocks(xmlList);
            var isFlyoutUpToDate = cachedBlocksHash === currentBlocksHash && !!cachedBlocksHash;
            var mkFlyout = function () {
                var workspace = _this.editor.toolbox_.workspace_;
                var oldSvg = oldFlyout_1.svgGroup_;
                var flyout = Blockly.Functions.createFlyout(workspace, oldSvg);
                return flyout;
            };
            // get the flyout from the cache or make a new one
            var newFlyout = void 0;
            if (!hasCachedFlyout) {
                newFlyout = mkFlyout();
                this.flyouts[flyoutName] = { flyout: newFlyout, blocksHash: 0 };
            }
            else {
                newFlyout = this.flyouts[flyoutName].flyout;
            }
            // update the blocks hash
            this.flyouts[flyoutName].blocksHash = currentBlocksHash;
            // switch to the new flyout
            this.swapFlyout(oldFlyout_1, newFlyout);
            // if the flyout contents have changed, recreate the blocks
            if (!isFlyoutUpToDate) {
                newFlyout.show(xmlList);
            }
            newFlyout.scrollToStart();
        }
        else if (this.editor.flyout_) {
            this.editor.show(xmlList);
            this.editor.scrollToStart();
        }
    };
    // For editors that have no toolb
    Editor.prototype.showFlyoutOnlyToolbox = function () {
        var _this = this;
        // Show a Flyout only with all the blocks
        var allCategories = this.getAllCategories();
        var allBlocks = [];
        allCategories.forEach(function (category) {
            var blocks = category.blocks;
            allBlocks = allBlocks.concat(blocks);
            if (category.subcategories)
                category.subcategories.forEach(function (subcategory) {
                    var subblocks = subcategory.blocks;
                    allBlocks = allBlocks.concat(subblocks);
                });
        });
        var xmlList = [];
        allBlocks.forEach(function (block) {
            var blockXmlList = _this.getBlockXml(block);
            if (blockXmlList)
                xmlList = xmlList.concat(blockXmlList);
        });
        this.showFlyoutInternal_(xmlList);
    };
    ///////////////////////////////////////////////////////////
    ////////////          Block methods           /////////////
    ///////////////////////////////////////////////////////////
    Editor.prototype.getBlockXml = function (block, ignoregap, shadow) {
        var _this = this;
        var that = this;
        var blockXml;
        // Check if the block is built in, ignore it as it's already defined in snippets
        if (block.attributes.blockBuiltin) {
            pxt.log("ignoring built in block: " + block.attributes.blockId);
            return undefined;
        }
        if (block.builtinBlock) {
            // Find the block XML for this built in block.
            var builtin = snippets.allBuiltinBlocks()[block.attributes.blockId];
            if (builtin && builtin.blockXml && block.builtinField && block.builtinField.length == 2) {
                // Likley a built in block with a mutatation, check the fields.
                var field_1 = block.builtinField[0];
                var value_1 = block.builtinField[1];
                var regExp = new RegExp("<field name=\"" + field_1 + "\">(.*)</field>", 'i');
                builtin.blockXml = builtin.blockXml.replace(regExp, function () {
                    return "<field name=\"" + field_1 + "\">" + value_1 + "</field>";
                });
            }
            return builtin ? this.getBlockXml(builtin, ignoregap) : undefined;
        }
        if (!block.blockXml) {
            var fn_1 = pxt.blocks.blockSymbol(block.attributes.blockId);
            if (fn_1) {
                if (!shouldShowBlock(fn_1))
                    return undefined;
                var comp = pxt.blocks.compileInfo(fn_1);
                blockXml = pxt.blocks.createToolboxBlock(this.blockInfo, fn_1, comp);
                if (fn_1.attributes.optionalVariableArgs && fn_1.attributes.toolboxVariableArgs) {
                    var handlerArgs_1 = comp.handlerArgs;
                    var mutationValues = fn_1.attributes.toolboxVariableArgs.split(";")
                        .map(function (v) { return parseInt(v); })
                        .filter(function (v) { return v <= handlerArgs_1.length && v >= 0; });
                    mutationValues.forEach(function (v) {
                        var mutation = document.createElement("mutation");
                        mutation.setAttribute("numargs", v.toString());
                        for (var i = 0; i < v; i++) {
                            mutation.setAttribute("arg" + i, handlerArgs_1[i].name);
                        }
                        blockXml.appendChild(mutation);
                    });
                }
                else if (comp.handlerArgs.length && !fn_1.attributes.optionalVariableArgs) {
                    comp.handlerArgs.forEach(function (arg) {
                        var getterblock = Blockly.Xml.textToDom("\n    <value name=\"HANDLER_" + arg.name + "\">\n    <shadow type=\"variables_get_reporter\">\n    <field name=\"VAR\" variabletype=\"\">" + arg.name + "</field>\n    </shadow>\n    </value>");
                        blockXml.appendChild(getterblock);
                    });
                }
                else if (fn_1.attributes.mutateDefaults) {
                    var mutationValues = fn_1.attributes.mutateDefaults.split(";");
                    var mutatedBlocks_1 = [];
                    mutationValues.forEach(function (mutation) {
                        var mutatedBlock = blockXml.cloneNode(true);
                        pxt.blocks.mutateToolboxBlock(mutatedBlock, fn_1.attributes.mutate, mutation);
                        mutatedBlocks_1.push(mutatedBlock);
                    });
                    return mutatedBlocks_1;
                }
                else if (fn_1.attributes.blockSetVariable != undefined && fn_1.retType && !shadow) {
                    // if requested, wrap block into a "set variable block"
                    var rawName = fn_1.attributes.blockSetVariable;
                    var varName = void 0;
                    // By default if the API author does not put any value for blockSetVariable
                    // then our comment parser will fill in the string "true". This gets caught
                    // by isReservedWord() so no need to do a separate check.
                    if (!rawName || pxt.blocks.isReservedWord(rawName)) {
                        varName = Util.htmlEscape(fn_1.retType.toLowerCase());
                    }
                    else {
                        varName = Util.htmlEscape(rawName);
                    }
                    // since we are creating variable, generate a new name that does not
                    // clash with existing variable names
                    var varNameUnique = varName;
                    var index = 2;
                    while (variableIsAssigned(varNameUnique, this.editor)) {
                        varNameUnique = varName + index++;
                    }
                    varName = varNameUnique;
                    var setblock = Blockly.Xml.textToDom("\n<block type=\"variables_set\" gap=\"" + Util.htmlEscape((fn_1.attributes.blockGap || 8) + "") + "\">\n<field name=\"VAR\" variabletype=\"\">" + varName + "</field>\n</block>");
                    {
                        var value = document.createElement('value');
                        value.setAttribute('name', 'VALUE');
                        value.appendChild(blockXml);
                        value.appendChild(pxt.blocks.mkFieldBlock("math_number", "NUM", "0", true));
                        setblock.appendChild(value);
                    }
                    blockXml = setblock;
                }
            }
            else {
                pxt.log("Couldn't find block for: " + block.attributes.blockId);
                pxt.log(block);
            }
        }
        else {
            blockXml = Blockly.Xml.textToDom(block.blockXml);
        }
        if (blockXml) {
            if (ignoregap) {
                blockXml.setAttribute("gap", "" + (pxt.appTarget.appTheme
                    && pxt.appTarget.appTheme.defaultBlockGap && pxt.appTarget.appTheme.defaultBlockGap.toString() || 8));
            }
            pxt.Util.toArray(blockXml.querySelectorAll('shadow'))
                .filter(function (shadow) { return !shadow.innerHTML; })
                .forEach(function (shadow, i) {
                var type = shadow.getAttribute('type');
                var builtin = snippets.allBuiltinBlocks()[type];
                var b = _this.getBlockXml(builtin ? builtin : { name: type, attributes: { blockId: type } }, ignoregap, true);
                /* tslint:disable:no-inner-html setting one element's contents to the other */
                if (b && b.length > 0 && b[0])
                    shadow.innerHTML = b[0].innerHTML;
                /* tslint:enable:no-inner-html */
            });
        }
        return [blockXml];
        function shouldShowBlock(fn) {
            if (fn.attributes.debug && !pxt.options.debug)
                return false;
            if (!shadow && (fn.attributes.deprecated || fn.attributes.blockHidden))
                return false;
            var ns = (fn.attributes.blockNamespace || fn.namespace).split('.')[0];
            return that.shouldShowBlock(fn.attributes.blockId, ns, shadow);
        }
        function variableIsAssigned(name, editor) {
            var varModel = editor.getVariable(name);
            var varUses = varModel && editor.getVariableUsesById(varModel.getId());
            return varUses && varUses.some(function (b) { return b.type == "variables_set" || b.type == "variables_change"; });
        }
    };
    Editor.prototype.getButtonXml = function (button) {
        this.editor.registerButtonCallback(button.attributes.blockId, function (btn) {
            button.callback();
        });
        return [pxt.blocks.createFlyoutButton(button.attributes.blockId, button.attributes.label)];
    };
    Editor.prototype.updateBreakpoints = function () {
        if (!this.editor)
            return; // not loaded yet
        var debugging = !!this.parent.state.debugging;
        var blocks = this.editor.getAllBlocks();
        blocks.forEach(function (block) {
            if (block.nextConnection && block.previousConnection) {
                block.enableBreakpoint(debugging);
            }
        });
        this.editor.setDebugModeOption(debugging);
    };
    return Editor;
}(toolboxeditor.ToolboxEditor));
exports.Editor = Editor;
