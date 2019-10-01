"use strict";
/// <reference path="../../localtypings/monaco.d.ts" />
/// <reference path="../../built/pxteditor.d.ts" />
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
var sui = require("./sui");
var snippets = require("./monacoSnippets");
var pyhelper = require("./monacopyhelper");
var simulator = require("./simulator");
var toolbox = require("./toolbox");
var workspace = require("./workspace");
var monacoFieldEditorHost_1 = require("./monacoFieldEditorHost");
var Util = pxt.Util;
var monacoDebugger_1 = require("./monacoDebugger");
var debuggerToolbox_1 = require("./debuggerToolbox");
var MIN_EDITOR_FONT_SIZE = 10;
var MAX_EDITOR_FONT_SIZE = 40;
var CompletionProvider = /** @class */ (function () {
    function CompletionProvider(editor, python) {
        this.editor = editor;
        this.python = python;
        this.triggerCharacters = ["."];
        this.kindMap = {};
    }
    CompletionProvider.prototype.tsKindToMonacoKind = function (s) {
        switch (s) {
            case 1 /* Method */: return monaco.languages.CompletionItemKind.Method;
            case 2 /* Property */: return monaco.languages.CompletionItemKind.Property;
            case 3 /* Function */: return monaco.languages.CompletionItemKind.Function;
            case 4 /* Variable */: return monaco.languages.CompletionItemKind.Variable;
            case 5 /* Module */: return monaco.languages.CompletionItemKind.Module;
            case 6 /* Enum */: return monaco.languages.CompletionItemKind.Class;
            case 7 /* EnumMember */: return monaco.languages.CompletionItemKind.Enum;
            case 8 /* Class */: return monaco.languages.CompletionItemKind.Class;
            case 9 /* Interface */: return monaco.languages.CompletionItemKind.Interface;
            default: return monaco.languages.CompletionItemKind.Text;
        }
    };
    /**
     * Provide completion items for the given position and document.
     */
    CompletionProvider.prototype.provideCompletionItems = function (model, position, token) {
        var _this = this;
        var offset = model.getOffsetAt(position);
        var source = model.getValue();
        var fileName = this.editor.currFile.name;
        return compiler.completionsAsync(fileName, offset, source)
            .then(function (completions) {
            var items = (completions.entries || []).map(function (si, i) {
                var snippet = _this.python ? si.pySnippet : si.snippet;
                var label = _this.python
                    ? (completions.isMemberCompletion ? si.pyName : si.pyQName)
                    : (completions.isMemberCompletion ? si.name : si.qName);
                var documentation = pxt.Util.rlf(si.attributes.jsDoc);
                var block = pxt.Util.rlf(si.attributes.block);
                return {
                    label: label,
                    kind: _this.tsKindToMonacoKind(si.kind),
                    documentation: documentation,
                    detail: _this.python ? si.pySnippet : si.snippet,
                    // force monaco to use our sorting
                    sortText: tosort(i) + " " + snippet,
                    filterText: label + " " + documentation + " " + block
                };
            });
            return items;
        });
        function tosort(i) {
            return ("000" + i).slice(-4);
        }
    };
    /**
     * Given a completion item fill in more data, like [doc-comment](#CompletionItem.documentation)
     * or [details](#CompletionItem.detail).
     *
     * The editor will only resolve a completion item once.
     */
    CompletionProvider.prototype.resolveCompletionItem = function (item, token) {
        return item;
    };
    return CompletionProvider;
}());
var SignatureHelper = /** @class */ (function () {
    function SignatureHelper(editor, python) {
        this.editor = editor;
        this.python = python;
        this.signatureHelpTriggerCharacters = ["(", ","];
        this.isPython = false;
        this.isPython = python;
    }
    /**
     * Provide help for the signature at the given position and document.
     */
    SignatureHelper.prototype.provideSignatureHelp = function (model, position, token) {
        var _this = this;
        var offset = model.getOffsetAt(position);
        var source = model.getValue();
        var fileName = this.editor.currFile.name;
        return compiler.syntaxInfoAsync("signature", fileName, offset, source)
            .then(function (r) {
            var sym = r.symbols ? r.symbols[0] : null;
            if (!sym || !sym.parameters)
                return null;
            var documentation = pxt.Util.rlf(sym.attributes.jsDoc);
            var paramInfo = sym.parameters.map(function (p) { return ({
                label: p.name + ": " + (_this.isPython ? p.pyTypeString : p.type),
                documentation: pxt.Util.rlf(p.description)
            }); });
            var res = {
                signatures: [{
                        label: (_this.isPython && sym.pyName ? sym.pyName : sym.name) + "(" + paramInfo.map(function (p) { return p.label; }).join(", ") + ")",
                        documentation: documentation,
                        parameters: paramInfo
                    }],
                activeSignature: 0,
                activeParameter: r.auxResult
            };
            return res;
        });
    };
    return SignatureHelper;
}());
var HoverProvider = /** @class */ (function () {
    function HoverProvider(editor, python) {
        this.editor = editor;
        this.python = python;
    }
    /**
     * Provide a hover for the given position and document. Multiple hovers at the same
     * position will be merged by the editor. A hover can have a range which defaults
     * to the word range at the position when omitted.
     */
    HoverProvider.prototype.provideHover = function (model, position, token) {
        var offset = model.getOffsetAt(position);
        var source = model.getValue();
        var fileName = this.editor.currFile.name;
        return compiler.syntaxInfoAsync("symbol", fileName, offset, source)
            .then(function (r) {
            var sym = r.symbols ? r.symbols[0] : null;
            if (!sym)
                return null;
            var documentation = pxt.Util.rlf(sym.attributes.jsDoc);
            var res = {
                contents: ["**" + sym.pyQName + "**", documentation],
                range: monaco.Range.fromPositions(model.getPositionAt(r.beginPos), model.getPositionAt(r.endPos))
            };
            return res;
        });
    };
    return HoverProvider;
}());
var FormattingProvider = /** @class */ (function () {
    function FormattingProvider(editor, python) {
        this.editor = editor;
        this.python = python;
        this.isPython = false;
        this.isPython = python;
    }
    FormattingProvider.prototype.provideDocumentRangeFormattingEdits = function (model, range, options, token) {
        var _this = this;
        return Promise.resolve().then(function (p) {
            return _this.isPython
                ? pyhelper.provideDocumentRangeFormattingEdits(model, range, options, token)
                : null;
        });
    };
    return FormattingProvider;
}());
var Editor = /** @class */ (function (_super) {
    __extends(Editor, _super);
    function Editor() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.fileType = "text" /* Text */;
        _this.giveFocusOnLoading = false;
        _this.foldFieldEditorRanges = true;
        _this.hasFieldEditors = !!(pxt.appTarget.appTheme.monacoFieldEditors && pxt.appTarget.appTheme.monacoFieldEditors.length);
        _this.highlightDecorations = [];
        _this.handleFlyoutScroll = function (e) { return e.stopPropagation(); };
        _this.dragCurrentPos = { x: 0, y: 0 };
        _this.onDragBlockThrottled = Util.throttle(function () {
            var _a = _this.dragCurrentPos, x = _a.x, y = _a.y;
            var mouseTarget = _this.editor.getTargetAtClientPoint(x, y);
            if (mouseTarget && mouseTarget.position && _this.editor.getPosition() != mouseTarget.position)
                _this.editor.setPosition(mouseTarget.position);
            _this.editor.focus();
        }, 200);
        _this.updateFieldEditors = pxt.Util.debounce(function () {
            if (!_this.hasFieldEditors || !_this.editor || pxt.shell.isReadOnly() || _this.isDebugging())
                return;
            var model = _this.editor.getModel();
            _this.fieldEditors.clearRanges(_this.editor);
            _this.fieldEditors.allFieldEditors().forEach(function (fe) {
                var matcher = fe.matcher;
                var matches = model.findMatches(matcher.searchString, true, matcher.isRegex, matcher.matchCase, matcher.matchWholeWord ? _this.editor.getConfiguration().wordSeparators : null, false);
                var decorations = [];
                matches.forEach(function (match) {
                    var line = match.range.startLineNumber;
                    decorations.push({
                        range: new monaco.Range(line, model.getLineMinColumn(line), line, model.getLineMaxColumn(line)),
                        options: {
                            glyphMarginClassName: fe.glyphCssClass
                        }
                    });
                    _this.fieldEditors.trackRange(fe.id, line, match.range);
                });
                _this.fieldEditors.setDecorations(fe.id, _this.editor.deltaDecorations([], decorations));
            });
            if (_this.foldFieldEditorRanges) {
                _this.foldFieldEditorRangesAsync();
            }
        }, 200);
        _this.revealBreakpointLocation = function (id, frameIndex) {
            if (!_this.breakpoints)
                return;
            var loc = _this.breakpoints.getLocationOfBreakpoint(id);
            if (!loc)
                return;
            _this.highlightedBreakpoint = id;
            if (_this.currFile.getTypeScriptName() !== loc.fileName) {
                var mainPkg = pkg.mainEditorPkg();
                if (lookupFile(loc.fileName)) {
                    _this.parent.setFile(lookupFile(loc.fileName));
                }
            }
            else {
                _this.highilightStatementCore(loc, true);
            }
            if (_this.debuggerToolbox)
                _this.debuggerToolbox.setState({ currentFrame: frameIndex });
        };
        ///////////////////////////////////////////////////////////
        ////////////          Block methods           /////////////
        ///////////////////////////////////////////////////////////
        _this.uniqueBlockId = 0; // Used for hex blocks
        _this.handleToolboxRef = function (c) {
            _this.toolbox = c;
        };
        _this.handleDebugToolboxRef = function (ref) {
            if (ref) {
                _this.debuggerToolbox = ref;
                if (_this.isDebugging())
                    _this.updateToolbox();
            }
        };
        return _this;
    }
    Editor.prototype.hasBlocks = function () {
        if (!this.currFile)
            return true;
        var blockFile = this.currFile.getVirtualFileName(pxt.BLOCKS_PROJECT_NAME);
        return (blockFile && pkg.mainEditorPkg().files[blockFile] != null);
    };
    Editor.prototype.openBlocks = function () {
        var _this = this;
        pxt.tickEvent("typescript.showBlocks");
        var initPromise = Promise.resolve();
        if (!this.currFile) {
            var mainPkg = pkg.mainEditorPkg();
            if (mainPkg && mainPkg.files["main.ts"]) {
                initPromise = this.loadFileAsync(mainPkg.files["main.ts"]);
            }
            else {
                return;
            }
        }
        var promise = initPromise.then(function () {
            var isPython = _this.fileType == "python" /* Python */;
            var tickLang = isPython ? "python" : "typescript";
            pxt.tickEvent(tickLang + ".convertBlocks");
            var mainPkg = pkg.mainEditorPkg();
            if (!_this.hasBlocks() && !mainPkg && !mainPkg.files["main.blocks"]) {
                pxt.debug("cancelling convertion to blocks, but main.blocks is missing");
                return undefined;
            }
            if (_this.feWidget) {
                _this.feWidget.close();
                _this.activeRangeID = null;
            }
            var blockFile = _this.currFile.getVirtualFileName(pxt.BLOCKS_PROJECT_NAME);
            var tsFile = isPython
                ? _this.currFile.getVirtualFileName(pxt.JAVASCRIPT_PROJECT_NAME)
                : _this.currFile.name;
            if (!_this.hasBlocks()) {
                if (!mainPkg || !mainPkg.files["main.blocks"]) {
                    // Either the project isn't loaded, or it's ts-only
                    if (mainPkg) {
                        _this.parent.setFile(mainPkg.files["main.ts"]);
                    }
                    return undefined;
                }
                // The current file doesn't have an associated blocks file, so switch
                // to main.ts instead
                _this.currFile = mainPkg.files["main.ts"];
                blockFile = _this.currFile.getVirtualFileName(pxt.BLOCKS_PROJECT_NAME);
                tsFile = "main.ts";
            }
            var failedAsync = function (file, programTooLarge) {
                if (programTooLarge === void 0) { programTooLarge = false; }
                core.cancelAsyncLoading("switchtoblocks");
                _this.forceDiagnosticsUpdate();
                return _this.showBlockConversionFailedDialog(file, programTooLarge);
            };
            // might be undefined
            var xml;
            // it's a bit for a wild round trip:
            // 1) convert blocks to js to see if any changes happened, otherwise, just reload blocks
            // 2) decompile js -> blocks then take the decompiled blocks -> js
            // 3) check that decompiled js == current js % white space
            var blocksInfo;
            return _this.saveToTypeScriptAsync() // make sure Python gets converted
                .then(function () { return _this.parent.saveFileAsync(); })
                .then(function () { return _this.parent.loadBlocklyAsync(); })
                .then(function () { return compiler.getBlocksAsync(); })
                .then(function (bi) {
                blocksInfo = bi;
                pxt.blocks.initializeAndInject(blocksInfo);
                var oldWorkspace = pxt.blocks.loadWorkspaceXml(mainPkg.files[blockFile].content);
                if (oldWorkspace) {
                    return pxt.blocks.compileAsync(oldWorkspace, blocksInfo).then(function (compilationResult) {
                        var oldJs = compilationResult.source;
                        return compiler.formatAsync(oldJs, 0).then(function (oldFormatted) {
                            return compiler.formatAsync(_this.editor.getValue(), 0).then(function (newFormatted) {
                                if (oldFormatted.formatted == newFormatted.formatted) {
                                    pxt.debug(tickLang + " not changed, skipping decompile");
                                    pxt.tickEvent(tickLang + ".noChanges");
                                    _this.parent.setFile(mainPkg.files[blockFile]);
                                    return [oldWorkspace, false]; // return false to indicate we don't want to decompile
                                }
                                else {
                                    return [oldWorkspace, true];
                                }
                            });
                        });
                    });
                }
                return [oldWorkspace, true];
            }).then(function (values) {
                if (!values)
                    return Promise.resolve();
                var oldWorkspace = values[0];
                var shouldDecompile = values[1];
                if (!shouldDecompile)
                    return Promise.resolve();
                return compiler.compileAsync()
                    .then(function (resp) {
                    if (resp.success) {
                        return compiler.decompileAsync(tsFile, blocksInfo, oldWorkspace, blockFile)
                            .then(function (resp) {
                            if (!resp.success) {
                                _this.currFile.diagnostics = resp.diagnostics;
                                var tooLarge_1 = false;
                                resp.diagnostics.forEach(function (d) { return tooLarge_1 = (tooLarge_1 || d.code === 9266 /* error code when script is too large */); });
                                return failedAsync(blockFile, tooLarge_1);
                            }
                            xml = resp.outfiles[blockFile];
                            Util.assert(!!xml);
                            return mainPkg.setContentAsync(blockFile, xml)
                                .then(function () { return _this.parent.setFile(mainPkg.files[blockFile]); });
                        });
                    }
                    else {
                        return failedAsync(blockFile, false);
                    }
                });
            }).catch(function (e) {
                pxt.reportException(e);
                core.errorNotification(lf("Oops, something went wrong trying to convert your code."));
            });
        });
        core.showLoadingAsync("switchtoblocks", lf("switching to blocks..."), promise).done();
    };
    Editor.prototype.showBlockConversionFailedDialog = function (blockFile, programTooLarge) {
        var _this = this;
        var isPython = this.fileType == "python" /* Python */;
        var tickLang = isPython ? "python" : "typescript";
        var bf = pkg.mainEditorPkg().files[blockFile];
        if (programTooLarge) {
            pxt.tickEvent(tickLang + ".programTooLarge");
        }
        var body;
        var disagreeLbl;
        if (isPython) {
            body = programTooLarge ?
                lf("Your program is too large to convert into blocks. You can keep working in Python or discard your changes and go back to the previous Blocks version.") :
                lf("We are unable to convert your Python code back to blocks. You can keep working in Python or discard your changes and go back to the previous Blocks version.");
            disagreeLbl = lf("Stay in Python");
        }
        else {
            body = programTooLarge ?
                lf("Your program is too large to convert into blocks. You can keep working in JavaScript or discard your changes and go back to the previous Blocks version.") :
                lf("We are unable to convert your JavaScript code back to blocks. You can keep working in JavaScript or discard your changes and go back to the previous Blocks version.");
            disagreeLbl = lf("Stay in JavaScript");
        }
        return core.confirmAsync({
            header: programTooLarge ? lf("Program too large") : lf("Oops, there is a problem converting your code."),
            body: body,
            agreeLbl: lf("Discard and go to Blocks"),
            agreeClass: "cancel",
            agreeIcon: "cancel",
            disagreeLbl: disagreeLbl,
            disagreeClass: "positive",
            disagreeIcon: "checkmark",
            hideCancel: !bf
        }).then(function (b) {
            // discard
            if (!b) {
                pxt.tickEvent(tickLang + ".keepText", undefined, { interactiveConsent: true });
            }
            else {
                pxt.tickEvent(tickLang + ".discardText", undefined, { interactiveConsent: true });
                _this.parent.saveBlocksToTypeScriptAsync().then(function (src) {
                    _this.overrideFile(src);
                    _this.parent.setFile(bf);
                });
            }
        });
    };
    Editor.prototype.decompileAsync = function (blockFile) {
        return compiler.decompileAsync(blockFile);
    };
    Editor.prototype.display = function () {
        return (React.createElement("div", { id: "monacoEditorArea", className: "full-abs", style: { direction: 'ltr' } },
            this.isVisible && React.createElement("div", { className: "monacoToolboxDiv " + ((this.toolbox && !this.toolbox.state.visible && !this.isDebugging()) ? 'invisible' : '') },
                React.createElement(toolbox.Toolbox, { ref: this.handleToolboxRef, editorname: "monaco", parent: this }),
                React.createElement("div", { id: "monacoDebuggerToolbox" })),
            React.createElement("div", { id: 'monacoEditorInner', style: { float: 'right' } })));
    };
    Editor.prototype.showPackageDialog = function () {
        pxt.tickEvent("monaco.addpackage", undefined, { interactiveConsent: true });
        this.hideFlyout();
        this.parent.showPackageDialog();
    };
    Editor.prototype.defineEditorTheme = function (hc, withNamespaces) {
        var _this = this;
        var inverted = pxt.appTarget.appTheme.invertedMonaco;
        var invertedColorluminosityMultipler = 0.6;
        var rules = [];
        if (!hc && withNamespaces) {
            var colors_1 = {};
            this.getNamespaces().forEach(function (ns) {
                var metaData = _this.getNamespaceAttrs(ns);
                var blocks = snippets.isBuiltin(ns) ?
                    snippets.getBuiltinCategory(ns).blocks.concat(_this.nsMap[ns] || []) : _this.nsMap[ns];
                if (metaData.color && blocks) {
                    var hexcolor_1 = fixColor(metaData.color);
                    blocks.forEach(function (fn) {
                        rules.push({ token: "identifier.ts " + fn.name, foreground: hexcolor_1 });
                    });
                    rules.push({ token: "identifier.ts " + ns, foreground: hexcolor_1 });
                    colors_1[ns] = metaData.color;
                }
            });
            rules.push({ token: "identifier.ts if", foreground: '5B80A5', });
            rules.push({ token: "identifier.ts else", foreground: '5B80A5', });
            rules.push({ token: "identifier.ts while", foreground: '5BA55B', });
            rules.push({ token: "identifier.ts for", foreground: '5BA55B', });
            var pauseUntil = pxt.appTarget.runtime && pxt.appTarget.runtime.pauseUntilBlock;
            if (pauseUntil) {
                var call = pauseUntil.callName || "pauseUntil";
                var color = pauseUntil.color || colors_1[pauseUntil.category];
                if (color) {
                    rules.push({ token: "identifier.ts " + call, foreground: fixColor(color) });
                }
            }
        }
        var colors = pxt.appTarget.appTheme.monacoColors || {};
        monaco.editor.defineTheme('pxtTheme', {
            base: hc ? 'hc-black' : (inverted ? 'vs-dark' : 'vs'),
            inherit: true,
            rules: rules,
            colors: hc ? {} : colors
        });
        monaco.editor.setTheme('pxtTheme');
        function fixColor(hexcolor) {
            hexcolor = pxt.toolbox.convertColor(hexcolor);
            return (inverted ? pxt.toolbox.fadeColor(hexcolor, invertedColorluminosityMultipler, true) : hexcolor).replace('#', '');
        }
    };
    Editor.prototype.saveToTypeScriptAsync = function () {
        if (this.fileType == "python" /* Python */)
            return this.convertPythonToTypeScriptAsync();
        return Promise.resolve(undefined);
    };
    Editor.prototype.convertPythonToTypeScriptAsync = function () {
        if (!this.currFile)
            return Promise.resolve(undefined);
        var tsName = this.currFile.getVirtualFileName(pxt.JAVASCRIPT_PROJECT_NAME);
        return compiler.py2tsAsync()
            .then(function (res) {
            // TODO python use success
            // any errors?
            if (res.diagnostics && res.diagnostics.length)
                return undefined;
            if (res.generated[tsName])
                return res.generated[tsName];
            return "";
        });
    };
    Editor.prototype.setHighContrast = function (hc) {
        if (this.loadMonacoPromise)
            this.defineEditorTheme(hc, true);
    };
    Editor.prototype.beforeCompile = function () {
        // this triggers a text change wich stops the simulator async
        //if (this.editor)
        //    this.editor.getAction('editor.action.formatDocument').run();
    };
    Editor.prototype.isIncomplete = function () {
        return this.editor && this.editor._view ?
            this.editor._view.contentWidgets._widgets["editor.widget.suggestWidget"].isVisible :
            false;
    };
    Editor.prototype.resize = function (e) {
        var monacoArea = document.getElementById('monacoEditorArea');
        if (!monacoArea)
            return;
        var monacoToolboxDiv = monacoArea.getElementsByClassName('monacoToolboxDiv')[0];
        if (monacoArea && this.editor) {
            var toolboxWidth = monacoToolboxDiv && monacoToolboxDiv.offsetWidth || 0;
            var rgba = this.editor._themeService._theme.colors['editor.background'].rgba;
            var logoHeight = (this.parent.isJavaScriptActive()) ? this.parent.updateEditorLogo(toolboxWidth, "rgba(" + rgba.r + "," + rgba.g + "," + rgba.b + "," + rgba.a + ")") : 0;
            this.editor.layout({ width: monacoArea.offsetWidth - toolboxWidth, height: monacoArea.offsetHeight - logoHeight });
            if (monacoToolboxDiv)
                monacoToolboxDiv.style.height = "100%";
        }
    };
    Editor.prototype.prepare = function () {
        this.isReady = true;
    };
    Editor.prototype.loadMonacoAsync = function () {
        if (!this.loadMonacoPromise)
            this.loadMonacoPromise = this.createLoadMonacoPromise();
        return this.loadMonacoPromise;
    };
    Editor.prototype.createLoadMonacoPromise = function () {
        var _this = this;
        this.extraLibs = Object.create(null);
        var editorArea = document.getElementById("monacoEditorArea");
        var editorElement = document.getElementById("monacoEditorInner");
        return pxt.vs.initMonacoAsync(editorElement).then(function (editor) {
            _this.editor = editor;
            _this.editor.updateOptions({ fontSize: _this.parent.settings.editorFontSize });
            _this.editor.addAction({
                id: "save",
                label: lf("Save"),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S],
                keybindingContext: "!editorReadonly",
                precondition: "!editorReadonly",
                contextMenuGroupId: "0_pxtnavigation",
                contextMenuOrder: 0.2,
                run: function () { return Promise.resolve(_this.parent.typecheckNow()); }
            });
            _this.editor.addAction({
                id: "runSimulator",
                label: lf("Run Simulator"),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
                keybindingContext: "!editorReadonly",
                precondition: "!editorReadonly",
                contextMenuGroupId: "0_pxtnavigation",
                contextMenuOrder: 0.21,
                run: function () { return Promise.resolve(_this.parent.runSimulator()); }
            });
            if (pxt.appTarget.compile && pxt.appTarget.compile.hasHex) {
                _this.editor.addAction({
                    id: "compileHex",
                    label: lf("Download"),
                    keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.Enter],
                    keybindingContext: "!editorReadonly",
                    precondition: "!editorReadonly",
                    contextMenuGroupId: "0_pxtnavigation",
                    contextMenuOrder: 0.22,
                    run: function () { return Promise.resolve(_this.parent.compile()); }
                });
            }
            _this.editor.addAction({
                id: "zoomIn",
                label: lf("Zoom In"),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.NUMPAD_ADD, monaco.KeyMod.CtrlCmd | monaco.KeyCode.US_EQUAL],
                run: function () { return Promise.resolve(_this.zoomIn()); }
            });
            _this.editor.addAction({
                id: "zoomOut",
                label: lf("Zoom Out"),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.NUMPAD_SUBTRACT, monaco.KeyMod.CtrlCmd | monaco.KeyCode.US_MINUS],
                run: function () { return Promise.resolve(_this.zoomOut()); }
            });
            if (pxt.appTarget.appTheme.hasReferenceDocs) {
                var referenceContextKey_1 = _this.editor.createContextKey("editorHasReference", false);
                _this.editor.addAction({
                    id: "reference",
                    label: lf("Help"),
                    keybindingContext: "!editorReadonly && editorHasReference",
                    precondition: "!editorReadonly && editorHasReference",
                    contextMenuGroupId: "navigation",
                    contextMenuOrder: 0.1,
                    run: function () { return Promise.resolve(_this.loadReference()); }
                });
                _this.editor.onDidChangeCursorPosition(function (e) {
                    var word = _this.editor.getModel().getWordUntilPosition(e.position);
                    if (word && word.word != "") {
                        referenceContextKey_1.set(true);
                    }
                    else {
                        referenceContextKey_1.reset();
                    }
                });
            }
            // Accessibility shortcut, add a way to quickly jump to the monaco toolbox
            _this.editor.addAction({
                id: "jumptoolbox",
                label: lf("Jump to Toolbox"),
                keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KEY_T],
                keybindingContext: "!editorReadonly",
                precondition: "!editorReadonly",
                run: function () { return Promise.resolve(_this.moveFocusToToolbox()); }
            });
            _this.editor.onDidLayoutChange(function (e) {
                // Update editor font size in settings after a ctrl+scroll zoom
                var currentFont = _this.editor.getConfiguration().fontInfo.fontSize;
                if (_this.parent.settings.editorFontSize != currentFont) {
                    _this.parent.settings.editorFontSize = currentFont;
                    _this.forceDiagnosticsUpdate();
                }
                // Update widgets
                var toolbox = document.getElementById('monacoToolboxDiv');
                if (toolbox)
                    toolbox.style.height = _this.editor.getLayoutInfo().contentHeight + "px";
                var flyout = document.getElementById('monacoFlyoutWidget');
                if (flyout)
                    flyout.style.height = _this.editor.getLayoutInfo().contentHeight + "px";
            });
            var monacoEditorInner = document.getElementById('monacoEditorInner');
            monacoEditorInner.ondragenter = (function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            });
            monacoEditorInner.ondragover = (function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                _this.dragCurrentPos = {
                    x: ev.clientX,
                    y: ev.clientY
                };
                _this.onDragBlockThrottled(ev);
            });
            monacoEditorInner.ondrop = (function (ev) {
                var insertText = ev.dataTransfer.getData('text'); // IE11 only support "text"
                if (!insertText)
                    return;
                ev.preventDefault();
                ev.stopPropagation();
                var p = insertText.startsWith("qName:")
                    ? compiler.snippetAsync(insertText.substring("qName:".length), _this.fileType == "python" /* Python */)
                    : Promise.resolve(insertText);
                p.done(function (snippet) {
                    var mouseTarget = _this.editor.getTargetAtClientPoint(ev.clientX, ev.clientY);
                    var position = mouseTarget.position;
                    _this.insertSnippet(position, snippet);
                });
            });
            _this.editor.onDidFocusEditorText(function () {
                _this.hideFlyout();
            });
            monaco.languages.registerCompletionItemProvider("python", new CompletionProvider(_this, true));
            monaco.languages.registerSignatureHelpProvider("python", new SignatureHelper(_this, true));
            monaco.languages.registerHoverProvider("python", new HoverProvider(_this, true));
            monaco.languages.registerDocumentRangeFormattingEditProvider("python", new FormattingProvider(_this, true));
            _this.editorViewZones = [];
            _this.setupToolbox(editorArea);
            _this.setupFieldEditors();
        });
    };
    Editor.prototype.insertSnippet = function (position, insertText) {
        var currPos = this.editor.getPosition();
        var model = this.editor.getModel();
        if (!position)
            position = currPos;
        // always insert the text on the next lin
        insertText += "\n";
        position.lineNumber++;
        position.column = 1;
        // check existing content
        if (position.lineNumber < model.getLineCount() && model.getLineContent(position.lineNumber))
            insertText = "\n" + insertText;
        // update cursor
        this.editor.pushUndoStop();
        this.editor.executeEdits("", [
            {
                identifier: { major: 0, minor: 0 },
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: insertText,
                forceMoveMarkers: true,
                isAutoWhitespaceEdit: true,
            }
        ]);
        this.beforeCompile();
        this.editor.pushUndoStop();
        this.editor.focus();
    };
    Editor.prototype.undo = function () {
        if (!this.editor)
            return;
        this.editor.trigger('keyboard', 'undo', null);
    };
    Editor.prototype.redo = function () {
        if (!this.editor)
            return;
        this.editor.trigger('keyboard', 'redo', null);
    };
    Editor.prototype.zoomIn = function () {
        if (!this.editor)
            return;
        if (this.parent.settings.editorFontSize >= MAX_EDITOR_FONT_SIZE)
            return;
        var currentFont = this.editor.getConfiguration().fontInfo.fontSize;
        this.parent.settings.editorFontSize = currentFont + 1;
        this.editor.updateOptions({ fontSize: this.parent.settings.editorFontSize });
        this.forceDiagnosticsUpdate();
    };
    Editor.prototype.zoomOut = function () {
        if (!this.editor)
            return;
        if (this.parent.settings.editorFontSize <= MIN_EDITOR_FONT_SIZE)
            return;
        var currentFont = this.editor.getConfiguration().fontInfo.fontSize;
        this.parent.settings.editorFontSize = currentFont - 1;
        this.editor.updateOptions({ fontSize: this.parent.settings.editorFontSize });
        this.forceDiagnosticsUpdate();
    };
    Editor.prototype.loadReference = function () {
        Util.assert(this.editor != undefined); // Guarded
        var currentPosition = this.editor.getPosition();
        var wordInfo = this.editor.getModel().getWordAtPosition(currentPosition);
        if (!wordInfo)
            return;
        var prevWordInfo = this.editor.getModel().getWordUntilPosition(new monaco.Position(currentPosition.lineNumber, wordInfo.startColumn - 1));
        if (prevWordInfo && wordInfo) {
            var namespaceName = prevWordInfo.word.replace(/([A-Z]+)/g, "-$1");
            var methodName = wordInfo.word.replace(/([A-Z]+)/g, "-$1");
            this.parent.setSideDoc("/reference/" + namespaceName + "/" + methodName, false);
        }
        else if (wordInfo) {
            var methodName = wordInfo.word.replace(/([A-Z]+)/g, "-$1");
            this.parent.setSideDoc("/reference/" + methodName, false);
        }
    };
    Editor.prototype.setupToolbox = function (editorElement) {
        // Monaco flyout widget
        var flyoutWidget = {
            domNode: null,
            getId: function () {
                return 'pxt.flyout.widget';
            },
            getDomNode: function () {
                if (!this.domNode) {
                    this.domNode = document.createElement('div');
                    this.domNode.id = 'monacoFlyoutWidget';
                    this.domNode.style.top = "0";
                    this.domNode.className = 'monacoFlyout';
                    // Hide by default
                    this.domNode.style.display = 'none';
                    this.domNode.textContent = 'Flyout';
                }
                return this.domNode;
            },
            getPosition: function () {
                return null;
            }
        };
        this.editor.addOverlayWidget(flyoutWidget);
    };
    Editor.prototype.setupFieldEditors = function () {
        var _this = this;
        if (!this.hasFieldEditors || pxt.shell.isReadOnly())
            return;
        if (!this.fieldEditors)
            this.fieldEditors = new monacoFieldEditorHost_1.FieldEditorManager();
        pxt.appTarget.appTheme.monacoFieldEditors.forEach(function (name) {
            var editor = pxt.editor.getMonacoFieldEditor(name);
            if (editor) {
                _this.fieldEditors.addFieldEditor(editor);
            }
            else {
                pxt.debug("Skipping unknown monaco field editor '" + name + "'");
            }
        });
        this.editor.onMouseDown(function (e) {
            if (e.target.type !== monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
                return;
            }
            _this.handleGutterClick(e);
        });
    };
    Editor.prototype.closeFlyout = function () {
        if (!this.editor)
            return;
        this.hideFlyout();
    };
    Editor.prototype.hideFlyout = function () {
        // Hide the flyout
        var flyout = document.getElementById('monacoFlyoutWidget');
        if (flyout) {
            pxsim.U.clear(flyout);
            flyout.style.display = 'none';
            flyout.removeEventListener("wheel", this.handleFlyoutScroll, true);
        }
        // Hide the current toolbox category
        if (this.toolbox)
            this.toolbox.clearSelection();
        // Clear editor floats
        this.parent.setState({ hideEditorFloats: false });
    };
    Editor.prototype.updateToolbox = function () {
        var appTheme = pxt.appTarget.appTheme;
        if (!appTheme.monacoToolbox || pxt.shell.isReadOnly() || !this.editor)
            return;
        // Move the monaco editor to make room for the toolbox div
        //this.editor.getLayoutInfo().glyphMarginLeft = 200;
        this.editor.layout();
        if (this.toolbox) {
            this.toolbox.setState({
                loading: false,
                categories: this.getAllCategories(),
                showSearchBox: this.shouldShowSearch()
            });
        }
        var container = document.getElementById('monacoDebuggerToolbox');
        if (!container || !this.blockInfo)
            return;
        var debugging = this.isDebugging();
        var debuggerToolbox = debugging ? React.createElement(debuggerToolbox_1.DebuggerToolbox, { ref: this.handleDebugToolboxRef, parent: this.parent, apis: this.blockInfo.apis.byQName, openLocation: this.revealBreakpointLocation, showCallStack: true }) : React.createElement("div", null);
        if (debugging) {
            this.toolbox.hide();
        }
        else {
            this.debuggerToolbox = null;
            this.toolbox.show();
        }
        ReactDOM.render(debuggerToolbox, container);
    };
    Editor.prototype.getFoldingController = function () {
        return this.editor.getContribution("editor.contrib.folding");
    };
    Editor.prototype.getId = function () {
        return "monacoEditor";
    };
    Editor.prototype.getViewState = function () {
        return this.editor ? this.editor.getPosition() : {};
    };
    Editor.prototype.getCurrentSource = function () {
        return this.editor ? this.editor.getValue() : this.currSource;
    };
    Editor.prototype.acceptsFile = function (file) {
        return true;
    };
    Editor.prototype.setValue = function (v) {
        this.editor.setValue(v);
    };
    Editor.prototype.overrideFile = function (content) {
        Util.assert(this.editor != undefined); // Guarded
        this.editor.setValue(content);
    };
    Editor.prototype.loadFileAsync = function (file, hc) {
        var _this = this;
        var mode = "text" /* Text */;
        this.currSource = file.content;
        var loading = document.createElement("div");
        loading.className = "ui inverted loading dimmer active";
        var editorArea = document.getElementById("monacoEditorArea");
        var editorDiv = document.getElementById("monacoEditorInner");
        editorArea.insertBefore(loading, editorDiv);
        return this.loadMonacoAsync()
            .then(function () {
            if (!_this.editor)
                return;
            _this.foldFieldEditorRanges = true;
            _this.updateFieldEditors();
            var ext = file.getExtension();
            var modeMap = {
                "cpp": "cpp" /* CPP */,
                "h": "cpp" /* CPP */,
                "json": "json" /* JSON */,
                "md": "markdown" /* Markdown */,
                "py": "python" /* Python */,
                "ts": "typescript" /* TypeScript */,
                "js": "javascript" /* JavaScript */,
                "svg": "xml" /* XML */,
                "blocks": "xml" /* XML */,
                "asm": "asm" /* Asm */,
            };
            if (modeMap.hasOwnProperty(ext))
                mode = modeMap[ext];
            _this.fileType = mode;
            var readOnly = file.isReadonly() || pxt.shell.isReadOnly() || _this.isDebugging();
            _this.editor.updateOptions({ readOnly: readOnly });
            var proto = "pkg:" + file.getName();
            var model = monaco.editor.getModels().filter(function (model) { return model.uri.toString() == proto; })[0];
            if (!model)
                model = monaco.editor.createModel(pkg.mainPkg.readFile(file.getName()), mode, monaco.Uri.parse(proto));
            if (model)
                _this.editor.setModel(model);
            _this.defineEditorTheme(hc);
            var shouldShowToolbox = pxt.appTarget.appTheme.monacoToolbox
                && !readOnly
                && ((mode == "typescript" && file.name == "main.ts")
                    || (mode == "python" && file.name == "main.py"));
            if (shouldShowToolbox) {
                _this.beginLoadToolbox(file, hc);
            }
            else {
                if (_this.toolbox)
                    _this.toolbox.hide();
            }
            // Set the current file
            _this.currFile = file;
            _this.setValue(file.content);
            _this.setDiagnostics(file, _this.snapshotState());
            if (_this.breakpoints) {
                _this.breakpoints.loadBreakpointsForFile(file, _this.editor);
                var loc = _this.breakpoints.getLocationOfBreakpoint(_this.highlightedBreakpoint);
                if (loc && loc.fileName === file.getTypeScriptName()) {
                    _this.highilightStatementCore(loc, true);
                }
            }
            if (_this.fileType == "markdown" /* Markdown */)
                _this.parent.setSideMarkdown(file.content);
            _this.currFile.setForceChangeCallback(function (from, to) {
                if (from != to) {
                    pxt.debug("File changed (from " + from + ", to " + to + "). Reloading editor");
                    _this.loadFileAsync(_this.currFile);
                }
            });
            if (!file.isReadonly()) {
                model.onDidChangeContent(function (e) {
                    // Remove any Highlighted lines
                    _this.clearHighlightedStatements();
                    // Remove any current error shown, as a change has been made.
                    var viewZones = _this.editorViewZones || [];
                    _this.editor.changeViewZones(function (changeAccessor) {
                        viewZones.forEach(function (id) {
                            changeAccessor.removeZone(id);
                        });
                    });
                    _this.editorViewZones = [];
                    if (!e.isRedoing && !e.isUndoing && !_this.editor.getValue()) {
                        _this.editor.setValue(" ");
                    }
                    _this.updateDiagnostics();
                    _this.changeCallback();
                    _this.updateFieldEditors();
                });
            }
            _this.resize();
            _this.hideFlyout();
            // Get extension packages
            _this.extensions = pkg.allEditorPkgs()
                .map(function (ep) { return ep.getKsPkg(); }).map(function (p) { return !!p && p.config; })
                .filter(function (config) { return !!config && !!config.extension && /^(file:|github:)/.test(config.installedVersion); });
            if (_this.giveFocusOnLoading) {
                _this.editor.focus();
            }
        }).finally(function () {
            editorArea.removeChild(loading);
        });
    };
    Editor.prototype.unloadFileAsync = function () {
        if (this.toolbox)
            this.toolbox.clearSearch();
        if (this.currFile && this.currFile.getName() == "this/" + pxt.CONFIG_NAME) {
            // Reload the header if a change was made to the config file: pxt.json
            return this.parent.reloadHeaderAsync();
        }
        return Promise.resolve();
    };
    Editor.prototype.beginLoadToolbox = function (file, hc) {
        var _this = this;
        if (this.toolbox)
            this.toolbox.showLoading();
        compiler.getBlocksAsync().then(function (bi) {
            _this.blockInfo = bi;
            _this.nsMap = _this.partitionBlocks();
            _this.updateToolbox();
            pxt.vs.syncModels(pkg.mainPkg, _this.extraLibs, file.getName(), file.isReadonly());
            _this.defineEditorTheme(hc, true);
        });
    };
    Editor.prototype.snapshotState = function () {
        return this.editor && this.editor.getModel() ? this.editor.getModel().getLinesContent() : null;
    };
    Editor.prototype.setViewState = function (pos) {
        if (!this.editor)
            return;
        if (!pos || Object.keys(pos).length === 0)
            return;
        this.editor.setPosition(pos);
        this.editor.setScrollPosition({
            scrollTop: this.editor.getTopForLineNumber(pos.lineNumber)
        });
    };
    Editor.prototype.setBreakpointsMap = function (breakpoints) {
        if (this.isDebugging()) {
            if (!this.breakpoints) {
                this.breakpoints = new monacoDebugger_1.BreakpointCollection(breakpoints);
                this.breakpoints.loadBreakpointsForFile(this.currFile, this.editor);
            }
            if (this.fieldEditors)
                this.fieldEditors.clearRanges(this.editor);
            if (this.feWidget)
                this.feWidget.close();
            if (this.editor)
                this.editor.updateOptions({ readOnly: true });
        }
        else {
            if (this.editor) {
                this.editor.updateOptions({
                    readOnly: pxt.shell.isReadOnly() || (this.currFile && this.currFile.isReadonly())
                });
            }
            if (this.breakpoints) {
                this.breakpoints.dispose();
                this.breakpoints = undefined;
            }
            this.updateFieldEditors();
        }
    };
    Editor.prototype.setDiagnostics = function (file, snapshot) {
        Util.assert(this.editor != undefined); // Guarded
        Util.assert(this.currFile == file);
        this.diagSnapshot = snapshot;
        this.forceDiagnosticsUpdate();
    };
    Editor.prototype.updateDiagnostics = function () {
        if (this.needsDiagUpdate())
            this.forceDiagnosticsUpdate();
    };
    Editor.prototype.getBreakpoints = function () {
        return this.breakpoints ? this.breakpoints.getActiveBreakpoints() : [];
    };
    Editor.prototype.sendBreakpoints = function () {
        if (this.breakpoints) {
            simulator.driver.setBreakpoints(this.getBreakpoints());
        }
    };
    Editor.prototype.needsDiagUpdate = function () {
        if (!this.annotationLines)
            return false;
        var lines = this.editor.getModel().getLinesContent();
        for (var _i = 0, _a = this.annotationLines; _i < _a.length; _i++) {
            var line = _a[_i];
            if (this.diagSnapshot[line] !== lines[line])
                return true;
        }
        return false;
    };
    Editor.prototype.forceDiagnosticsUpdate = function () {
        if (this.fileType != "typescript" /* TypeScript */
            && this.fileType != "python" /* Python */)
            return;
        var file = this.currFile;
        var monacoErrors = [];
        if (file && file.diagnostics) {
            var model = monaco.editor.getModel(monaco.Uri.parse("pkg:" + file.getName()));
            var _loop_1 = function (d) {
                var addErrorMessage = function (message) {
                    monacoErrors.push({
                        severity: monaco.Severity.Error,
                        message: message,
                        startLineNumber: d.line + 1,
                        startColumn: d.column + 1,
                        endLineNumber: d.endLine == undefined ? endPos.lineNumber : d.endLine + 1,
                        endColumn: d.endColumn == undefined ? endPos.column : d.endColumn
                    });
                };
                var endPos = model.getPositionAt(d.start + d.length);
                if (typeof d.messageText === 'string') {
                    addErrorMessage(d.messageText);
                }
                else {
                    var curr = d.messageText;
                    while (curr.next != undefined) {
                        addErrorMessage(curr.messageText);
                        curr = curr.next;
                    }
                }
            };
            for (var _i = 0, _a = file.diagnostics; _i < _a.length; _i++) {
                var d = _a[_i];
                _loop_1(d);
            }
            monaco.editor.setModelMarkers(model, 'typescript', monacoErrors);
        }
    };
    Editor.prototype.showFieldEditor = function (range, fe, viewZoneHeight) {
        var _this = this;
        if (this.feWidget) {
            this.feWidget.close();
        }
        this.feWidget = new monacoFieldEditorHost_1.ViewZoneEditorHost(fe, range, this.editor.getModel());
        this.feWidget.heightInPx = viewZoneHeight;
        this.feWidget.showAsync(this.fileType, this.editor)
            .then(function (edit) {
            _this.activeRangeID = null;
            if (edit) {
                _this.editModelAsync(edit.range, edit.replacement)
                    .then(function (newRange) { return _this.indentRangeAsync(newRange); });
            }
        });
    };
    Editor.prototype.foldFieldEditorRangesAsync = function () {
        var _this = this;
        if (this.foldFieldEditorRanges) {
            this.foldFieldEditorRanges = false;
            var selection_1 = this.editor.getSelection();
            var selections_1;
            return Promise.mapSeries(this.fieldEditors.allRanges(), function (range) { return _this.indentRangeAsync(range.range); })
                .then(function (ranges) {
                if (!ranges || !ranges.length)
                    return;
                selections_1 = ranges.map(rangeToSelection);
                // This is only safe because indentRangeAsync doesn't change the number of lines and
                // we only allow one field editor per line. If we ever change that we should revisit folding
                _this.editor.setSelections(selections_1);
                var folder = _this.getFoldingController();
                // The folding controller has a delay before it updates its model
                // so we need to force it
                folder.onModelChanged();
                folder.foldUnfoldRecursively(true);
            })
                .then(function () { return _this.editor.setSelection(selection_1); });
        }
        return Promise.resolve();
    };
    Editor.prototype.highlightStatement = function (stmt, brk) {
        if (!stmt) {
            this.clearHighlightedStatements();
            if (this.debuggerToolbox)
                this.debuggerToolbox.setBreakpoint(null);
            return false;
        }
        else if (!this.editor) {
            return false;
        }
        if (this.currFile.getTypeScriptName() !== stmt.fileName && this.isDebugging() && lookupFile(stmt.fileName)) {
            this.parent.setFile(lookupFile(stmt.fileName));
        }
        else if (!this.highilightStatementCore(stmt, !!brk)) {
            return false;
        }
        this.highlightedBreakpoint = brk.breakpointId;
        if (brk && this.isDebugging() && this.debuggerToolbox) {
            this.debuggerToolbox.setBreakpoint(brk);
            this.resize();
        }
        return true;
    };
    Editor.prototype.highilightStatementCore = function (stmt, centerOnLocation) {
        if (centerOnLocation === void 0) { centerOnLocation = false; }
        var position = this.editor.getModel().getPositionAt(stmt.start);
        var end = this.editor.getModel().getPositionAt(stmt.start + stmt.length);
        if (!position || !end)
            return false;
        this.highlightDecorations = this.editor.deltaDecorations(this.highlightDecorations, [
            {
                range: new monaco.Range(position.lineNumber, position.column, end.lineNumber, end.column),
                options: { inlineClassName: 'highlight-statement' }
            },
        ]);
        if (centerOnLocation)
            this.editor.revealPositionInCenter(position);
        return true;
    };
    Editor.prototype.clearHighlightedStatements = function () {
        if (this.editor && this.highlightDecorations)
            this.editor.deltaDecorations(this.highlightDecorations, []);
    };
    Editor.prototype.partitionBlocks = function () {
        var _this = this;
        var res = {};
        this.topBlocks = [];
        var builtInBlocks = snippets.allBuiltinBlocksByName();
        var that = this;
        function setSubcategory(ns, subcat) {
            if (!that.subcategoryMap[ns])
                that.subcategoryMap[ns] = {};
            that.subcategoryMap[ns][subcat] = true;
        }
        this.blockInfo.blocks.forEach(function (fn) {
            var ns = (fn.attributes.blockNamespace || fn.namespace).split('.')[0];
            // Don't add the block if there exists a block with the same definition
            if (builtInBlocks[fn.qName])
                return;
            if (!res[ns]) {
                res[ns] = [];
            }
            res[ns].push(fn);
            var subcat = fn.attributes.subcategory;
            var advanced = fn.attributes.advanced;
            if (advanced) {
                // More subcategory
                setSubcategory(ns, 'more');
            }
            else if (subcat) {
                setSubcategory(ns, subcat);
            }
            if (fn.attributes.topblock) {
                _this.topBlocks.push(fn);
            }
        });
        if (snippets.getPauseUntil()) {
            var cat = pxt.appTarget.runtime.pauseUntilBlock.category;
            if (res[cat]) {
                res[cat].push(snippets.getPauseUntil());
            }
        }
        return res;
    };
    ///////////////////////////////////////////////////////////
    ////////////         Toolbox methods          /////////////
    ///////////////////////////////////////////////////////////
    Editor.prototype.clearCaches = function () {
        _super.prototype.clearCaches.call(this);
        snippets.clearBuiltinBlockCache();
    };
    Editor.prototype.shouldShowSearch = function () {
        if (this.parent.state.editorState && this.parent.state.editorState.searchBar != undefined) {
            return this.parent.state.editorState.searchBar;
        }
        return true;
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
    Editor.prototype.moveFocusToToolbox = function () {
        // Set focus in toolbox
        if (this.toolbox)
            this.toolbox.focus();
    };
    Editor.prototype.moveFocusToFlyout = function () {
        // Set focus in the flyout
        var monacoFlyout = document.getElementById('monacoFlyoutWidget');
        var topBlock = monacoFlyout.getElementsByClassName("monacoDraggableBlock")[0];
        if (topBlock)
            topBlock.focus();
    };
    ///////////////////////////////////////////////////////////
    ////////////         Flyout methods           /////////////
    ///////////////////////////////////////////////////////////
    Editor.prototype.getBlocksForCategory = function (ns, subns) {
        if (!snippets.isBuiltin(ns)) {
            return this.filterBlocks(subns, this.nsMap[ns]);
        }
        else {
            return this.getBuiltinBlocks(ns, subns);
        }
    };
    Editor.prototype.filterBlocks = function (subns, blocks) {
        return blocks.filter((function (block) { return !(block.attributes.blockHidden || block.attributes.deprecated)
            && (block.name.indexOf('_') != 0)
            && ((!subns && !block.attributes.subcategory && !block.attributes.advanced)
                || (subns && ((block.attributes.advanced && subns == 'more')
                    || (block.attributes.subcategory && subns == block.attributes.subcategory)))); }));
    };
    Editor.prototype.getBuiltinBlocks = function (ns, subns) {
        var cat = snippets.getBuiltinCategory(ns);
        var blocks = cat.blocks || [];
        if (!cat.custom && this.nsMap[ns])
            blocks = blocks.concat(this.nsMap[ns].filter(function (block) { return !(block.attributes.blockHidden || block.attributes.deprecated); }));
        return this.filterBlocks(subns, blocks);
    };
    Editor.prototype.showFlyout = function (treeRow) {
        if (!this.editor)
            return;
        var ns = treeRow.nameid;
        // Create a new flyout
        var monacoFlyout = this.createMonacoFlyout();
        if (ns == 'search') {
            try {
                this.showSearchFlyout();
            }
            catch (e) {
                pxt.reportException(e);
                pxsim.U.clear(monacoFlyout);
                this.addNoSearchResultsLabel();
            }
            return;
        }
        if (ns == 'topblocks') {
            this.showTopBlocksFlyout();
            return;
        }
        if (this.abstractShowFlyout(treeRow) || (treeRow.subcategories && treeRow.subcategories.length > 0)) {
            // Hide editor floats
            this.parent.setState({ hideEditorFloats: true });
        }
        else {
            this.closeFlyout();
        }
    };
    Editor.prototype.showFlyoutHeadingLabel = function (ns, name, subns, icon, color) {
        var categoryName = name || Util.capitalize(subns || ns);
        var iconClass = ("blocklyTreeIcon" + (icon ? (ns || icon).toLowerCase() : 'Default')).replace(/\s/g, '');
        this.getMonacoLabel(categoryName, 'monacoFlyoutLabel monacoFlyoutHeading', true, icon, iconClass, color);
    };
    Editor.prototype.showFlyoutGroupLabel = function (group, groupicon, labelLineWidth, helpCallback) {
        this.getMonacoLabel(pxt.Util.rlf("{id:group}" + group), 'monacoFlyoutLabel blocklyFlyoutGroup', false, undefined, undefined, undefined, true, labelLineWidth, helpCallback);
    };
    Editor.prototype.showFlyoutBlocks = function (ns, color, blocks) {
        var monacoFlyout = this.getMonacoFlyout();
        var filters = this.parent.state.editorState ? this.parent.state.editorState.filters : undefined;
        var categoryState = filters ? (filters.namespaces && filters.namespaces[ns] != undefined ? filters.namespaces[ns] : filters.defaultState) : undefined;
        this.createMonacoBlocks(this, monacoFlyout, ns, blocks, color, filters, categoryState);
    };
    Editor.prototype.handleGutterClick = function (e) {
        var line = e.target.position.lineNumber;
        if (this.isDebugging()) {
            // Set/unset the nearest breakpoint;
            if (this.breakpoints) {
                this.breakpoints.toggleBreakpointAt(line);
                this.sendBreakpoints();
            }
        }
        else if (this.fieldEditors) {
            // Open/close any field editors in range
            var model = this.editor.getModel();
            var decorations = model.getDecorationsInRange(new monaco.Range(line, model.getLineMinColumn(line), line, model.getLineMaxColumn(line)));
            if (decorations.length) {
                var lineInfo = this.fieldEditors.getInfoForLine(line);
                if (lineInfo) {
                    if (this.feWidget && this.activeRangeID != null && lineInfo.id === this.activeRangeID) {
                        this.feWidget.close();
                        this.activeRangeID = null;
                        return;
                    }
                    else {
                        this.activeRangeID = lineInfo.id;
                    }
                    var fe = this.fieldEditors.getFieldEditorById(lineInfo.owner);
                    if (fe) {
                        this.showFieldEditor(lineInfo.range, new fe.proto(), fe.heightInPixels || 500);
                    }
                }
            }
        }
    };
    Editor.prototype.showSearchFlyout = function () {
        var _this = this;
        var monacoBlocks = [];
        var searchBlocks = this.toolbox.getSearchBlocks();
        var that = this;
        function getNamespaceColor(ns) {
            var nsinfo = that.blockInfo.apis.byQName[ns];
            var color = (nsinfo ? nsinfo.attributes.color : undefined)
                || pxt.toolbox.getNamespaceColor(ns)
                || "255";
            return color;
        }
        searchBlocks.forEach(function (block) {
            if (!block.name) {
                if (block.attributes.blockId == pxtc.PAUSE_UNTIL_TYPE) {
                    var pauseUntilBlock = snippets.getPauseUntil();
                    if (pauseUntilBlock) {
                        var ns = pauseUntilBlock.attributes.blockNamespace;
                        var color = getNamespaceColor(ns);
                        monacoBlocks.push(_this.getMonacoBlock(pauseUntilBlock, ns, color));
                    }
                }
                else {
                    // For built in blocks, let's search from monaco snippets
                    var builtin = snippets.allBuiltinBlocks()[block.attributes.blockId];
                    if (builtin) {
                        var builtinBlock = builtin[0];
                        var ns = builtin[1];
                        var attr = that.getNamespaceAttrs(ns);
                        monacoBlocks.push(_this.getMonacoBlock(builtinBlock, ns, attr.color));
                    }
                    else {
                        pxt.log("couldn't find buildin search qName for block: " + block.attributes.blockId);
                    }
                }
            }
            else {
                var fn = _this.blockInfo.apis.byQName[block.name];
                if (fn) {
                    if (fn.name.indexOf('_') == 0)
                        return;
                    var ns = (fn.attributes.blockNamespace || fn.namespace).split('.')[0];
                    var color = fn.attributes.color || getNamespaceColor(ns);
                    monacoBlocks.push(_this.getMonacoBlock(fn, ns, color));
                }
                else {
                    pxt.log("couldn't find non builtin search by qName: " + block.name);
                }
            }
        });
        this.attachMonacoBlockAccessibility(monacoBlocks);
        if (monacoBlocks.length == 0) {
            this.addNoSearchResultsLabel();
        }
    };
    Editor.prototype.showTopBlocksFlyout = function () {
        var _this = this;
        var monacoBlocks = [];
        var topBlocks = this.getTopBlocks();
        var monacoFlyout = this.getMonacoFlyout();
        var that = this;
        function getNamespaceColor(ns) {
            var nsinfo = that.blockInfo.apis.byQName[ns];
            var color = (nsinfo ? nsinfo.attributes.color : undefined)
                || pxt.toolbox.getNamespaceColor(ns)
                || "255";
            return color;
        }
        if (topBlocks.length == 0) {
            this.getMonacoLabel(lf("No basic results..."), 'monacoFlyoutLabel');
        }
        else {
            // Show a heading
            this.showFlyoutHeadingLabel('topblocks', lf("{id:category}Basic"), null, pxt.toolbox.getNamespaceIcon('topblocks'), pxt.toolbox.getNamespaceColor('topblocks'));
            topBlocks.forEach(function (block) {
                monacoBlocks.push(_this.getMonacoBlock(block, 'topblocks', getNamespaceColor(block.attributes.blockNamespace || block.namespace), false));
            });
        }
        this.attachMonacoBlockAccessibility(monacoBlocks);
    };
    Editor.prototype.addNoSearchResultsLabel = function () {
        this.getMonacoLabel(lf("No search results..."), 'monacoFlyoutLabel');
    };
    Editor.prototype.getMonacoFlyout = function () {
        return document.getElementById('monacoFlyoutWidget');
    };
    Editor.prototype.createMonacoFlyout = function () {
        var monacoFlyout = this.getMonacoFlyout();
        monacoFlyout.style.left = this.editor.getLayoutInfo().lineNumbersLeft + "px";
        monacoFlyout.style.height = this.editor.getLayoutInfo().contentHeight + "px";
        monacoFlyout.style.display = 'block';
        monacoFlyout.className = 'monacoFlyout';
        monacoFlyout.style.transform = 'none';
        monacoFlyout.addEventListener("wheel", this.handleFlyoutScroll, true);
        pxsim.U.clear(monacoFlyout);
        return monacoFlyout;
    };
    Editor.prototype.createMonacoBlocks = function (monacoEditor, monacoFlyout, ns, fns, color, filters, categoryState) {
        // Render the method blocks
        var monacoBlocks = fns.sort(function (f1, f2) {
            // sort by fn weight
            var w2 = (f2.attributes.weight || 50) + (f2.attributes.advanced ? 0 : 1000);
            var w1 = (f1.attributes.weight || 50) + (f1.attributes.advanced ? 0 : 1000);
            return w2 > w1 ? 1 : -1;
        }).map(function (fn) {
            var fnState = filters ? filters.defaultState : pxt.editor.FilterState.Visible;
            if (filters && filters.fns && filters.fns[fn.name] !== undefined) {
                fnState = filters.fns[fn.name];
            }
            else if (filters && filters.blocks && fn.attributes.blockId && filters.blocks[fn.attributes.blockId] !== undefined) {
                fnState = filters.blocks[fn.attributes.blockId];
            }
            else if (categoryState !== undefined) {
                fnState = categoryState;
            }
            if (fnState == pxt.editor.FilterState.Hidden)
                return undefined;
            var monacoBlockDisabled = fnState == pxt.editor.FilterState.Disabled;
            return monacoEditor.getMonacoBlock(fn, ns, color, monacoBlockDisabled);
        });
        monacoEditor.attachMonacoBlockAccessibility(monacoBlocks);
    };
    Editor.prototype.attachMonacoBlockAccessibility = function (monacoBlocks) {
        var _this = this;
        var monacoEditor = this;
        monacoBlocks.forEach(function (monacoBlock, index) {
            if (!monacoBlock)
                return;
            // Accessibility
            var isRtl = Util.isUserLanguageRtl();
            monacoBlock.onkeydown = function (e) {
                var charCode = core.keyCodeFromEvent(e);
                if (charCode == 40) {
                    // Next item
                    if (index < monacoBlocks.length - 1)
                        monacoBlocks[index + 1].focus();
                }
                else if (charCode == 38) {
                    // Previous item
                    if (index > 0)
                        monacoBlocks[index - 1].focus();
                }
                else if ((charCode == 37 && !isRtl) || (charCode == 38 && isRtl)) {
                    // Focus back to toolbox
                    monacoEditor.moveFocusToToolbox();
                }
                else if (charCode == 27) {
                    // Focus back to toolbox and close Flyout
                    monacoEditor.hideFlyout();
                    monacoEditor.moveFocusToToolbox();
                }
                else {
                    sui.fireClickOnEnter.call(_this, e);
                }
            };
        });
    };
    Editor.prototype.getMonacoLabel = function (label, className, hasIcon, icon, iconClass, iconColor, hasLine, labelLineWidth, helpCallback) {
        var _this = this;
        var monacoFlyout = this.getMonacoFlyout();
        var fontSize = this.parent.settings.editorFontSize;
        var labelDiv = document.createElement('div');
        labelDiv.className = className;
        var labelText = document.createElement('div');
        labelText.className = 'monacoFlyoutLabelText';
        labelText.style.display = 'inline-block';
        labelText.style.fontSize = fontSize + (hasIcon ? 5 : 0) + "px";
        labelText.style.lineHeight = fontSize + 5 + "px";
        labelText.textContent = label;
        if (hasIcon) {
            var labelIcon = document.createElement('span');
            labelIcon.className = "monacoFlyoutHeadingIcon blocklyTreeIcon " + iconClass;
            labelIcon.setAttribute('role', 'presentation');
            labelIcon.style.display = 'inline-block';
            labelIcon.style.color = "" + pxt.toolbox.convertColor(iconColor);
            if (icon && icon.length === 1) {
                labelIcon.textContent = icon;
            }
            labelDiv.appendChild(labelIcon);
        }
        labelDiv.appendChild(labelText);
        if (helpCallback && pxt.editor.HELP_IMAGE_URI) {
            var labelHelpIcon = document.createElement('span');
            labelHelpIcon.style.display = 'inline-block';
            labelHelpIcon.style.cursor = 'pointer';
            labelHelpIcon.draggable = false;
            var labelHelpIconImage = document.createElement('img');
            labelHelpIconImage.setAttribute('src', pxt.editor.HELP_IMAGE_URI);
            labelHelpIconImage.style.height = fontSize + 5 + "px";
            labelHelpIconImage.style.width = fontSize + 5 + "px";
            labelHelpIconImage.style.verticalAlign = 'middle';
            labelHelpIconImage.style.marginLeft = '10px';
            labelHelpIcon.appendChild(labelHelpIconImage);
            labelDiv.appendChild(labelHelpIcon);
            labelHelpIconImage.addEventListener('click', function () {
                _this.helpButtonCallback(label);
            });
        }
        monacoFlyout.appendChild(labelDiv);
        if (hasLine) {
            var labelLine = document.createElement('hr');
            labelLine.className = 'monacoFlyoutLabelLine';
            labelLine.align = 'left';
            labelLine.style.width = Math.min(labelLineWidth ? parseInt(labelLineWidth) : labelText.offsetWidth, 350) + "px";
            labelDiv.appendChild(labelLine);
        }
        return labelDiv;
    };
    Editor.prototype.helpButtonCallback = function (group) {
        pxt.debug(group + " help icon clicked.");
        workspace.fireEvent({ type: 'ui', editor: 'ts', action: 'groupHelpClicked', data: { group: group } });
    };
    Editor.prototype.getMonacoBlock = function (fn, ns, color, isDisabled) {
        var _this = this;
        // Check if the block is built in, ignore it as it's already defined in snippets
        if (fn.attributes.blockBuiltin) {
            pxt.log("ignoring built in block: " + fn.attributes.blockId);
            return undefined;
        }
        var monacoEditor = this;
        var monacoFlyout = this.getMonacoFlyout();
        var isPython = this.fileType == "python" /* Python */;
        if (fn.snippet === undefined)
            return undefined;
        var qName = fn.qName;
        var snippetName = (isPython ? (fn.pySnippetName || fn.pyName) : undefined) || fn.snippetName || fn.name;
        var snippet = isPython ? fn.pySnippet : fn.snippet;
        var monacoBlockArea = document.createElement('div');
        monacoBlockArea.className = "monacoBlock " + (isDisabled ? 'monacoDisabledBlock' : '');
        monacoFlyout.appendChild(monacoBlockArea);
        var monacoBlock = document.createElement('div');
        monacoBlock.className = 'monacoDraggableBlock';
        monacoBlock.tabIndex = 0;
        monacoBlockArea.appendChild(monacoBlock);
        var comment = fn.attributes.jsDoc;
        monacoBlock.title = comment;
        color = pxt.toolbox.convertColor(color);
        var methodToken = document.createElement('span');
        methodToken.textContent = fn.snippetOnly ? snippet : snippetName;
        monacoBlock.appendChild(methodToken);
        if (!isDisabled) {
            monacoBlock.draggable = true;
            monacoBlock.onclick = function (e) {
                pxt.tickEvent("monaco.toolbox.itemclick", undefined, { interactiveConsent: true });
                monacoEditor.hideFlyout();
                var p = snippet ? Promise.resolve(snippet) : compiler.snippetAsync(qName, isPython);
                p.done(function (snip) {
                    var currPos = monacoEditor.editor.getPosition();
                    _this.insertSnippet(currPos, snip);
                    // Fire a create event
                    workspace.fireEvent({ type: 'create', editor: 'ts', blockId: fn.attributes.blockId });
                });
            };
            monacoBlock.ondragstart = function (e) {
                pxt.tickEvent("monaco.toolbox.itemdrag", undefined, { interactiveConsent: true });
                setTimeout(function () {
                    monacoFlyout.style.transform = "translateX(-9999px)";
                });
                if (!snippet)
                    e.dataTransfer.setData('text', 'qName:' + qName); // IE11 only supports text
                else
                    e.dataTransfer.setData('text', snippet); // IE11 only supports text
                // Fire a create event
                workspace.fireEvent({ type: 'create', editor: 'ts', blockId: fn.attributes.blockId });
            };
            monacoBlock.ondragend = function (e) {
                monacoFlyout.style.transform = "none";
                monacoEditor.hideFlyout();
            };
            // Highlight on hover
            var highlightBlock_1 = function () {
                monacoBlock.style.backgroundColor = isDisabled ?
                    "" + pxt.toolbox.fadeColor(color || '#ddd', 0.8, false) :
                    "" + pxt.toolbox.fadeColor(color || '#ddd', 0.1, false);
            };
            var unhighlightBlock_1 = function () {
                monacoBlock.style.backgroundColor = isDisabled ?
                    "" + pxt.toolbox.fadeColor(color || '#ddd', 0.8, false) :
                    "" + color;
            };
            monacoBlock.onmouseenter = function (e) {
                highlightBlock_1();
            };
            monacoBlock.onmouseleave = function (e) {
                unhighlightBlock_1();
            };
            monacoBlock.onfocus = function (e) {
                highlightBlock_1();
            };
            monacoBlock.onblur = function (e) {
                unhighlightBlock_1();
            };
        }
        // Draw the shape of the block
        monacoBlock.style.fontSize = monacoEditor.parent.settings.editorFontSize + "px";
        monacoBlock.style.lineHeight = monacoEditor.parent.settings.editorFontSize + 1 + "px";
        monacoBlock.style.backgroundColor = isDisabled ?
            "" + pxt.toolbox.fadeColor(color || '#ddd', 0.8, false) :
            "" + color;
        monacoBlock.style.borderColor = "" + pxt.toolbox.fadeColor(color || '#ddd', 0.2, false);
        if (fn.retType && fn.retType == "boolean") {
            // Show a hexagonal shape
            monacoBlock.style.borderRadius = "0px";
            var monacoBlockHeight = monacoBlock.offsetHeight - 2; /* Take 2 off to account for the missing border */
            var monacoHexBlockId = monacoEditor.uniqueBlockId++;
            monacoBlock.id = "monacoHexBlock" + monacoHexBlockId;
            monacoBlock.className += ' monacoHexBlock';
            var styleBlock = document.createElement('style');
            styleBlock.appendChild(document.createTextNode("\n                    #monacoHexBlock" + monacoHexBlockId + ":before,\n                    #monacoHexBlock" + monacoHexBlockId + ":after {\n                        border-top: " + monacoBlockHeight / 2 + "px solid transparent;\n                        border-bottom: " + monacoBlockHeight / 2 + "px solid transparent;\n                    }\n                    #monacoHexBlock" + monacoHexBlockId + ":before {\n                        border-right: 17px solid " + color + ";\n                    }\n                    #monacoHexBlock" + monacoHexBlockId + ":after {\n                        border-left: 17px solid " + color + ";\n                    }\n                "));
            monacoBlockArea.insertBefore(styleBlock, monacoBlock);
        }
        else if (fn.retType && fn.retType != "void") {
            // Show a round shape
            monacoBlock.style.borderRadius = "40px";
        }
        else {
            // Show a normal shape
            monacoBlock.style.borderRadius = "3px";
        }
        return monacoBlock;
    };
    Editor.prototype.indentRangeAsync = function (range) {
        var model = this.editor.getModel();
        var minIndent = model.getLineFirstNonWhitespaceColumn(range.startLineNumber) - 1;
        var innerIndent = createIndent(model.getOneIndent().length + minIndent);
        var lines = model.getValueInRange(range).split(/\n/);
        var newText = lines.map(function (line, index) {
            if (index === 0) {
                return line.trim();
            }
            else if (index === lines.length - 1) {
                return createIndent(minIndent) + line.trim();
            }
            else {
                return innerIndent + line.trim();
            }
        }).join(model.getEOL());
        return this.editModelAsync(range, newText);
    };
    Editor.prototype.editModelAsync = function (range, newText) {
        var _this = this;
        return new Promise(function (resolve) {
            var model = _this.editor.getModel();
            var lines = newText.split("\n");
            var afterRange = new monaco.Range(range.startLineNumber, range.startColumn, range.startLineNumber + lines.length - 1, lines[lines.length - 1].length);
            var disposable = _this.editor.onDidChangeModelContent(function (e) {
                disposable.dispose();
                _this.editor.setSelection(afterRange);
                // Clear ranges because the model changed
                if (_this.fieldEditors)
                    _this.fieldEditors.clearRanges(_this.editor);
                resolve(afterRange);
            });
            model.pushEditOperations(_this.editor.getSelections(), [{
                    identifier: { major: 0, minor: 0 },
                    range: model.validateRange(range),
                    text: newText,
                    forceMoveMarkers: true,
                    isAutoWhitespaceEdit: true
                }], function (inverseOp) { return [rangeToSelection(inverseOp[0].range)]; });
        });
    };
    Editor.prototype.isDebugging = function () {
        return this.parent.state.debugging;
    };
    return Editor;
}(toolboxeditor.ToolboxEditor));
exports.Editor = Editor;
function rangeToSelection(range) {
    return new monaco.Selection(range.startLineNumber, range.startColumn, range.endLineNumber, range.endColumn);
}
function createIndent(length) {
    var res = '';
    for (var i = 0; i < length; i++)
        res += " ";
    return res;
}
function lookupFile(file) {
    var mPkg = pkg.mainEditorPkg();
    if (mPkg.files[file])
        return mPkg.files[file];
    var found = mPkg.lookupFile(file);
    if (found)
        return found;
    return undefined;
}
