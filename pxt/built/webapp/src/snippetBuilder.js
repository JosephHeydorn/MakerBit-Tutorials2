"use strict";
/// <reference path="../../built/pxtlib.d.ts" />
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
var sui = require("./sui");
var md = require("./marked");
var compiler = require("./compiler");
var ReactDOM = require("react-dom");
var pkg = require("./package");
var core = require("./core");
var snippetBuilderInputHandler_1 = require("./snippetBuilderInputHandler");
/**
 * Snippet builder takes a static config file and builds a modal with inputs and outputs based on config settings.
 * An output type is attached to the start of your markdown allowing you to define a number of markdown output. (blocks, lang)
 * An initial output is set and outputs defined at each questions are appended to the initial output.
 * answerTokens can be defined and are replaced before being outputted. This allows you to output answers and default values.
 * TODO:
 * 1. Richer questions for different sprite paths
 *  - This includes fleshing out a different path experience for projectile, food, and enemy.
 *  - Stay in wall question for player.
 *  - On collision for projectile
 */
var SnippetBuilder = /** @class */ (function (_super) {
    __extends(SnippetBuilder, _super);
    function SnippetBuilder(props) {
        var _this = _super.call(this, props) || this;
        /**
         *
         * This attaches three backticks to the front followed by an output type (blocks, lang)
         * The current output is then tokenized and three backticks are appended to the end of the string.
         */
        _this.generateOutputMarkdown = pxt.Util.debounce(function () {
            var _a = _this.state, config = _a.config, tsOutput = _a.tsOutput;
            // Attaches starting and ending line based on output type
            var md = "```" + config.outputType + "\n";
            md += _this.replaceTokens(_this.highlightEditedBlocks(tsOutput));
            md += "\n```";
            // Removes whitespace
            // TODO(jb) md.replace(/\s/g, '_'); - This would ensure that no breaking values are introduced to the typescript. Ideally we would ensure typescript is valid before attempting to compile it.
            _this.setState({ mdOutput: md });
        }, 300, false);
        _this.onChange = function (answerToken) { return function (v) {
            _this.setState(function (prevState) {
                return ({
                    answers: __assign({}, prevState.answers, (_a = {}, _a[answerToken] = v, _a))
                });
                var _a;
            }, _this.generateOutputMarkdown);
        }; };
        _this.state = {
            visible: false,
            answers: {},
            history: [0],
            defaults: {},
            config: props.config,
            tsOutput: [props.config.initialOutput]
        };
        _this.cleanup = _this.cleanup.bind(_this);
        _this.hide = _this.hide.bind(_this);
        _this.cancel = _this.cancel.bind(_this);
        _this.confirm = _this.confirm.bind(_this);
        _this.backPage = _this.backPage.bind(_this);
        _this.nextPage = _this.nextPage.bind(_this);
        _this.handleModalKeyDown = _this.handleModalKeyDown.bind(_this);
        return _this;
    }
    /**
     * Creates a hashmap with answerToken keys and the default value pair as
     * provided by our config file.
     */
    SnippetBuilder.prototype.buildDefaults = function () {
        var config = this.state.config;
        var defaults = {};
        for (var _i = 0, _a = config.questions; _i < _a.length; _i++) {
            var question = _a[_i];
            var inputs = question.inputs;
            for (var _b = 0, inputs_1 = inputs; _b < inputs_1.length; _b++) {
                var input = inputs_1[_b];
                if (isSnippetInputAnswerSingular(input)) {
                    var defaultAnswer = input.defaultAnswer, answerToken = input.answerToken;
                    defaults[answerToken] = defaultAnswer;
                }
                else {
                    var defaultAnswers = input.defaultAnswers, answerTokens = input.answerTokens;
                    for (var i = 0; i < answerTokens.length; i++) {
                        var token = answerTokens[i];
                        var defaultAnswer = defaultAnswers[i];
                        defaults[token] = defaultAnswer;
                    }
                }
            }
        }
        this.setState({ answers: defaults, defaults: defaults }, this.generateOutputMarkdown);
    };
    SnippetBuilder.prototype.toggleActionButton = function () {
        var newActionButton;
        if (this.isLastQuestion()) {
            newActionButton = {
                label: lf("Done"),
                onclick: this.confirm,
                icon: "check",
                className: "approve positive"
            };
        }
        else {
            newActionButton = {
                label: lf("Next"),
                onclick: this.nextPage,
                icon: 'arrow right',
                className: 'arrow right',
            };
        }
        if (this.state.actions[1] !== newActionButton) {
            this.setState({
                actions: [
                    this.state.actions[0],
                    newActionButton
                ]
            });
        }
    };
    SnippetBuilder.prototype.initializeActionButtons = function () {
        var actions = [
            {
                label: lf("Back"),
                onclick: this.backPage,
                icon: 'arrow left',
                className: 'arrow left',
                labelPosition: 'left',
            },
            {
                label: lf("Next"),
                onclick: this.nextPage,
                icon: 'arrow right',
                className: 'arrow right',
            },
        ];
        this.setState({ actions: actions });
    };
    SnippetBuilder.prototype.componentDidMount = function () {
        // Sets default values
        this.buildDefaults();
    };
    /**
     * @param output - Takes in a string and returns the tokenized output
     * Loops over each token previously added to defaults and replaces with the answer value if one
     * exists. Otherwise it replaces the token with the provided default value.
     */
    SnippetBuilder.prototype.replaceTokens = function (tsOutput) {
        var _a = this.state, answers = _a.answers, defaults = _a.defaults;
        var tokenizedOutput = tsOutput.join('\n');
        var tokens = Object.keys(defaults);
        // Replaces output tokens with answer if available or default value
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            var value = answers[token] || defaults[token];
            tokenizedOutput = tokenizedOutput.split("$" + token).join(value);
        }
        return tokenizedOutput;
    };
    /**
     * Takes in ts output and highlights the currently edited block
     */
    SnippetBuilder.prototype.highlightEditedBlocks = function (tsOutput) {
        var highlightString = '// @highlight';
        var inputs = this.getCurrentQuestion().inputs;
        // Get answer tokens being edited by inputs in this question
        var editedAnswerTokens = inputs
            .reduce(function (tokens, input) {
            if (isSnippetInputAnswerSingular(input)) {
                // Return singular answerToken
                return pxt.Util.concat([tokens, [input.answerToken]]);
            }
            else {
                // Return multiple answer tokens
                return pxt.Util.concat([tokens, input.answerTokens]);
            }
        }, []);
        // Finds all blocks containing a currently editable answer token and adds a highlight line
        var highlightedOutput = tsOutput
            .reduce(function (newOutput, currentLine) {
            for (var _i = 0, editedAnswerTokens_1 = editedAnswerTokens; _i < editedAnswerTokens_1.length; _i++) {
                var answerToken = editedAnswerTokens_1[_i];
                if (currentLine.indexOf(answerToken) !== -1) {
                    return pxt.Util.concat([newOutput, [highlightString, currentLine]]);
                }
            }
            return pxt.Util.concat([newOutput, [currentLine]]);
        }, []);
        return highlightedOutput;
    };
    SnippetBuilder.prototype.hide = function () {
        this.setState({
            visible: false
        });
    };
    SnippetBuilder.prototype.show = function () {
        pxt.tickEvent('snippet.builder.show', null, { interactiveConsent: true });
        this.initializeActionButtons();
        this.setState({
            visible: true,
        });
    };
    SnippetBuilder.prototype.cleanup = function () {
        // Reset state to initial values
        this.setState({
            answers: {},
            history: [0],
            tsOutput: [this.props.config.initialOutput],
        });
        Blockly.hideChaff();
    };
    SnippetBuilder.prototype.cancel = function () {
        var name = this.state.config.name;
        pxt.tickEvent("snippet.builder.cancel", { snippet: name, page: this.getCurrentPage() }, { interactiveConsent: true });
        this.hide();
        this.cleanup();
    };
    /**
     * Takes the output from state, runs replace tokens, decompiles the resulting typescript
     * and outputs the result as a Blockly xmlDOM. This then uses appendDomToWorkspace to attach
     * our xmlDOM to the mainWorkspaces passed to the component.
     */
    SnippetBuilder.prototype.injectBlocksToWorkspace = function () {
        var _this = this;
        var tsOutput = this.state.tsOutput;
        var mainWorkspace = this.props.mainWorkspace;
        var outputBehavior = this.state.config.outputBehavior;
        compiler.getBlocksAsync()
            .then(function (blocksInfo) { return compiler.decompileBlocksSnippetAsync(_this.replaceTokens(tsOutput), blocksInfo); })
            .then(function (resp) {
            // get the root blocks (e.g. on_start) from the new code
            var newXml = Blockly.Xml.textToDom(resp);
            var newBlocksDom = pxt.blocks.findRootBlocks(newXml);
            // get the existing root blocks
            var existingBlocks = mainWorkspace.getTopBlocks(true);
            // if we're replacing all existing blocks, do that first
            if (outputBehavior === "replace") {
                existingBlocks.forEach(function (b) {
                    b.dispose(false);
                });
                existingBlocks = [];
            }
            // determine which blocks should merge together
            // TODO: handle parameter mismatch like on_collision's "kind" field.
            //      At the time of this writting this isn't a blocking issue since
            //      the snippet builder is only used for the Sprite Wizard (which
            //      only uses on_start and game modding (which outputs an entirely
            //      new game)
            var toMergeOrAttach = newBlocksDom.map(function (newB) {
                var coincides = existingBlocks.filter(function (exB) {
                    var newType = newB.getAttribute('type');
                    return newType === exB.type;
                });
                if (coincides.length)
                    return { newB: newB, exB: coincides[0] };
                return { newB: newB, exB: null };
            });
            var toMerge = toMergeOrAttach.filter(function (p) { return !!p.exB; });
            var toAttach = toMergeOrAttach.filter(function (p) { return !p.exB; });
            // merge them
            function merge(pair) {
                var newB = pair.newB, exB = pair.exB;
                var firstChild = pxt.blocks.findRootBlock(newB);
                var toAttach = Blockly.Xml.domToBlock(firstChild, mainWorkspace);
                exB.getInput("HANDLER").connection.connect(toAttach.previousConnection);
            }
            toMerge.forEach(merge);
            // attach the rest
            function attach(pair) {
                var newB = pair.newB;
                Blockly.Xml.domToBlock(newB, mainWorkspace);
            }
            toAttach.forEach(attach);
            // if there wasn't more than one existing block, reformat the code
            if (existingBlocks.length <= 1) {
                pxt.blocks.layout.flow(mainWorkspace, { useViewWidth: true });
            }
        }).catch(function (e) {
            core.errorNotification(e);
            throw new Error("Failed to decompile snippet output");
        });
    };
    SnippetBuilder.prototype.confirm = function () {
        var name = this.state.config.name;
        pxt.tickEvent('snippet.builder.back.page', { snippet: name, page: this.getCurrentPage() }, { interactiveConsent: true });
        this.injectBlocksToWorkspace();
        Blockly.hideChaff();
        this.hide();
    };
    SnippetBuilder.prototype.getCurrentPage = function () {
        var history = this.state.history;
        return history[history.length - 1];
    };
    SnippetBuilder.prototype.getCurrentQuestion = function () {
        var config = this.state.config;
        return config.questions[this.getCurrentPage()];
    };
    SnippetBuilder.prototype.getNextQuestionNumber = function () {
        var _a = this.state, answers = _a.answers, defaults = _a.defaults;
        var currentQuestion = this.getCurrentQuestion();
        if (currentQuestion.goto) {
            var parameters = currentQuestion.goto.parameters;
            if (parameters) {
                for (var _i = 0, parameters_1 = parameters; _i < parameters_1.length; _i++) {
                    var parameter = parameters_1[_i];
                    var answer = parameter.answer, token = parameter.token;
                    if (answer === answers[token] || (!answers[token] && answer === defaults[token])) {
                        return parameter.question;
                    }
                }
            }
            return currentQuestion.goto.question;
        }
        return null;
    };
    SnippetBuilder.prototype.getNextQuestion = function () {
        var config = this.state.config;
        var nextQuestionNumber = this.getNextQuestionNumber();
        if (nextQuestionNumber) {
            return config.questions[nextQuestionNumber];
        }
        return null;
    };
    SnippetBuilder.prototype.isLastQuestion = function () {
        if (this.getCurrentQuestion().goto) {
            return false;
        }
        return true;
    };
    SnippetBuilder.prototype.updateOutput = function (question) {
        var tsOutput = this.state.tsOutput;
        if (question.output && tsOutput.indexOf(question.output) === -1) {
            var newOutput = pxt.Util.concat([tsOutput, [question.output]]);
            this.setState({ tsOutput: newOutput }, this.generateOutputMarkdown);
        }
    };
    /**
     * Changes page by 1 if next question exists.
     * Looks for output and appends the next questions output if it exists and
     * is not already attached to the current output.
     */
    SnippetBuilder.prototype.nextPage = function () {
        var _a = this.state, config = _a.config, history = _a.history;
        var currentQuestion = this.getCurrentQuestion();
        var goto = currentQuestion.goto;
        if (this.isLastQuestion()) {
            this.confirm();
        }
        else if (goto) {
            // Look ahead and update markdown
            var nextQuestion = this.getNextQuestion();
            this.updateOutput(nextQuestion);
            var nextQuestionNumber = this.getNextQuestionNumber();
            this.setState({ history: history.concat([nextQuestionNumber]) }, this.toggleActionButton);
            pxt.tickEvent('snippet.builder.next.page', { snippet: config.name, page: nextQuestionNumber }, { interactiveConsent: true });
            // Force generates output markdown for updated highlighting
            this.generateOutputMarkdown();
        }
    };
    SnippetBuilder.prototype.backPage = function () {
        var _this = this;
        var _a = this.state, history = _a.history, config = _a.config;
        if (history.length > 1) {
            this.setState({ history: history.slice(0, history.length - 1) }, function () {
                _this.toggleActionButton();
                pxt.tickEvent('snippet.builder.back.page', { snippet: config.name, page: _this.getCurrentPage() }, { interactiveConsent: true });
                // Force generates output markdown for updated highlighting
                _this.generateOutputMarkdown();
            });
        }
    };
    SnippetBuilder.prototype.handleModalKeyDown = function (e) {
        // Move to next page if enter or right arrow key pressed
        if (e.keyCode === 13 || e.keyCode === 39) {
            this.nextPage();
        }
        // Move to the previous page if left arrow key is pressed
        if (e.keyCode === 37) {
            this.backPage();
        }
    };
    SnippetBuilder.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, visible = _a.visible, answers = _a.answers, config = _a.config, mdOutput = _a.mdOutput, actions = _a.actions, defaults = _a.defaults;
        var parent = this.props.parent;
        var currentQuestion = this.getCurrentQuestion();
        return (React.createElement(sui.Modal, { isOpen: visible, className: 'snippet-builder full-screen-no-bg', overlayClassName: 'snippet-builder-modal-overlay', closeOnEscape: true, closeIcon: true, closeOnDimmerClick: false, closeOnDocumentClick: false, dimmer: true, buttons: actions, header: config.name, onClose: this.cancel, onKeyDown: this.handleModalKeyDown },
            React.createElement("div", { className: "ui equal width grid" },
                currentQuestion &&
                    React.createElement("div", { className: 'column snippet-question' },
                        React.createElement("div", { className: 'ui segment raised' },
                            React.createElement("h3", null, pxt.Util.rlf(currentQuestion.title)),
                            React.createElement("div", { className: 'ui equal width grid' }, currentQuestion.inputs.map(function (input, i) {
                                return React.createElement("span", { className: 'column', key: "span-" + i },
                                    React.createElement(snippetBuilderInputHandler_1.InputHandler, { onChange: isSnippetInputAnswerSingular(input) ? _this.onChange(input.answerToken) : _this.onChange, input: input, value: isSnippetInputAnswerSingular(input) ? answers[input.answerToken] : answers[input.answerTokens[0]], onEnter: _this.nextPage, key: isSnippetInputAnswerSingular(input) ? input.answerToken : input.answerTokens[0] }));
                            })),
                            currentQuestion.errorMessage && React.createElement("p", { className: 'snippet-error' }, currentQuestion.errorMessage)),
                        currentQuestion.hint &&
                            React.createElement("div", { className: 'snippet hint ui segment' }, pxt.Util.rlf(currentQuestion.hint))),
                React.createElement("div", { className: 'snippet output-section column' }, mdOutput && React.createElement(md.MarkedContent, { className: 'snippet-markdown-content', markdown: mdOutput, parent: parent })))));
    };
    return SnippetBuilder;
}(data.Component));
exports.SnippetBuilder = SnippetBuilder;
function getSnippetExtensions() {
    var allFiles = pxt.Util.concat(pkg.allEditorPkgs().map(function (p) { return p.sortedFiles(); }));
    var snippetConfigs = allFiles
        .filter(function (file) { return file.name === 'pxtsnippets.json'; })
        .map(function (file) { return pxt.Util.jsonTryParse(file.content); });
    // patch in external typescript files (makes it much easier to edit large snippets)
    // TODO: support more .ts fields than just "initialOutput"
    var snippetExternalTs = allFiles
        .filter(function (file) { return file.name.endsWith('.snippetts'); });
    snippetConfigs = snippetConfigs.map(function (cs) { return cs.map(function (c) {
        if (c.initialOutput.startsWith("file:")) {
            var externalFileName_1 = c.initialOutput.slice("file:".length, c.initialOutput.length);
            var externalTs = snippetExternalTs
                .filter(function (f) { return f.name === externalFileName_1; });
            if (externalTs.length != 1) {
                pxt.reportError("snippetbuilder", "invalid external .ts file path: " + externalFileName_1);
                return null;
            }
            c.initialOutput = externalTs[0].content;
        }
        return c;
    }).filter(function (c) { return !!c; }); });
    return pxt.Util.concat(snippetConfigs);
}
function openSnippetDialog(config, editor, parent) {
    var overlay = document.createElement('div');
    var wrapper = document.body.appendChild(overlay);
    var props = { parent: parent, mainWorkspace: editor, config: config };
    var snippetBuilder = ReactDOM.render(React.createElement(SnippetBuilder, props), wrapper);
    snippetBuilder.show();
}
function initializeSnippetExtensions(ns, extraBlocks, editor, parent) {
    var snippetExtensions = getSnippetExtensions();
    snippetExtensions
        .filter(function (snippet) { return snippet.namespace == ns; })
        .forEach(function (snippet) {
        extraBlocks.push({
            name: "SNIPPET" + name + "_BUTTON",
            type: "button",
            attributes: {
                blockId: "SNIPPET" + name + "_BUTTON",
                label: snippet.label ? pxt.Util.rlf(snippet.label) : pxt.Util.lf("Editor"),
                weight: 101,
                group: snippet.group && snippet.group,
            },
            callback: function () {
                openSnippetDialog(snippet, editor, parent);
            }
        });
    });
}
exports.initializeSnippetExtensions = initializeSnippetExtensions;
// Type guard functions
function isSnippetInputAnswerSingular(input) {
    return input.answerToken !== undefined;
}
exports.isSnippetInputAnswerSingular = isSnippetInputAnswerSingular;
function isSnippetInputAnswerTypeOther(input) {
    return input.type !== ('number' || 'dropdown');
}
exports.isSnippetInputAnswerTypeOther = isSnippetInputAnswerTypeOther;
function isSnippetInputAnswerTypeNumber(input) {
    return input.max !== undefined;
}
exports.isSnippetInputAnswerTypeNumber = isSnippetInputAnswerTypeNumber;
function isSnippetInputAnswerTypeDropdown(input) {
    return input.options !== undefined;
}
exports.isSnippetInputAnswerTypeDropdown = isSnippetInputAnswerTypeDropdown;
