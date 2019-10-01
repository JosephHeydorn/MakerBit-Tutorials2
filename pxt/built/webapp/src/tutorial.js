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
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var ReactDOM = require("react-dom");
var data = require("./data");
var sui = require("./sui");
var sounds = require("./sounds");
var core = require("./core");
var md = require("./marked");
var compiler = require("./compiler");
var codecard = require("./codecard");
var hinttooltip_1 = require("./hinttooltip");
/**
 * We'll run this step when we first start the tutorial to figure out what blocks are used so we can
 * filter the toolbox.
 */
function getUsedBlocksAsync(code) {
    if (!code)
        return Promise.resolve({});
    var usedBlocks = {};
    return compiler.getBlocksAsync()
        .then(function (blocksInfo) {
        pxt.blocks.initializeAndInject(blocksInfo);
        return compiler.decompileBlocksSnippetAsync(code, blocksInfo);
    }).then(function (blocksXml) {
        if (blocksXml) {
            var headless = pxt.blocks.loadWorkspaceXml(blocksXml);
            if (!headless) {
                pxt.debug("used blocks xml failed to load\n" + blocksXml);
                throw new Error("blocksXml failed to load");
            }
            var allblocks = headless.getAllBlocks();
            for (var bi = 0; bi < allblocks.length; ++bi) {
                var blk = allblocks[bi];
                if (!blk.isShadow_)
                    usedBlocks[blk.type] = 1;
            }
            return usedBlocks;
        }
        else {
            throw new Error("Empty blocksXml, failed to decompile");
        }
    }).catch(function (e) {
        pxt.reportException(e);
        throw new Error("Failed to decompile tutorial");
    });
}
exports.getUsedBlocksAsync = getUsedBlocksAsync;
var TutorialMenu = /** @class */ (function (_super) {
    __extends(TutorialMenu, _super);
    function TutorialMenu(props) {
        var _this = _super.call(this, props) || this;
        var tutorialOptions = _this.props.parent.state.tutorialOptions;
        _this.hasActivities = tutorialOptions && tutorialOptions.tutorialActivityInfo && tutorialOptions.tutorialActivityInfo.length > 1;
        return _this;
    }
    TutorialMenu.prototype.renderCore = function () {
        var tutorialOptions = this.props.parent.state.tutorialOptions;
        if (this.hasActivities) {
            return React.createElement(TutorialStepCircle, { parent: this.props.parent });
        }
        else if (tutorialOptions.tutorialStepInfo.length < 8) {
            return React.createElement(TutorialMenuItem, { parent: this.props.parent });
        }
        else {
            return React.createElement("div", { className: "menu" },
                React.createElement(TutorialMenuItem, { parent: this.props.parent, className: "mobile hide" }),
                React.createElement(TutorialStepCircle, { parent: this.props.parent, className: "mobile only" }));
        }
    };
    return TutorialMenu;
}(data.Component));
exports.TutorialMenu = TutorialMenu;
var TutorialMenuItem = /** @class */ (function (_super) {
    __extends(TutorialMenuItem, _super);
    function TutorialMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.openTutorialStep = _this.openTutorialStep.bind(_this);
        return _this;
    }
    TutorialMenuItem.prototype.openTutorialStep = function (step) {
        var options = this.props.parent.state.tutorialOptions;
        pxt.tickEvent("tutorial.step", { tutorial: options.tutorial, step: step }, { interactiveConsent: true });
        this.props.parent.setTutorialStep(step);
    };
    TutorialMenuItem.prototype.renderCore = function () {
        var _this = this;
        var _a = this.props.parent.state.tutorialOptions, tutorialReady = _a.tutorialReady, tutorialStepInfo = _a.tutorialStepInfo, tutorialStep = _a.tutorialStep;
        var currentStep = tutorialStep;
        if (!tutorialReady)
            return React.createElement("div", null);
        function intermediateClassName(index) {
            if (tutorialStepInfo.length < 8 // always show first 8
                || index == 0 // always show first
                || index == tutorialStepInfo.length - 1 // always show last
                || Math.abs(index - currentStep) < 2 // 1 around current step
            )
                return "";
            return "mobile hide";
        }
        return React.createElement("div", { className: "ui item " + this.props.className },
            React.createElement("div", { className: "ui item tutorial-menuitem", role: "menubar" }, tutorialStepInfo.map(function (step, index) {
                return (index == currentStep) ?
                    React.createElement("span", { className: "step-label", key: 'tutorialStep' + index },
                        React.createElement(TutorialMenuItemLink, { index: index, className: "ui circular label " + (currentStep == index ? 'blue selected' : 'inverted') + " " + (!tutorialReady ? 'disabled' : ''), ariaLabel: lf("Tutorial step {0}. This is the current step", index + 1), onClick: _this.openTutorialStep }, index + 1)) :
                    React.createElement("span", { className: "ui step-label " + intermediateClassName(index), key: 'tutorialStep' + index, "data-tooltip": "" + (index + 1), "data-inverted": "", "data-position": "bottom center" },
                        React.createElement(TutorialMenuItemLink, { index: index, className: "ui empty circular label " + (!tutorialReady ? 'disabled' : '') + " clear", ariaLabel: lf("Tutorial step {0}", index + 1), onClick: _this.openTutorialStep }));
            })));
    };
    return TutorialMenuItem;
}(data.Component));
exports.TutorialMenuItem = TutorialMenuItem;
var TutorialMenuItemLink = /** @class */ (function (_super) {
    __extends(TutorialMenuItemLink, _super);
    function TutorialMenuItemLink() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.handleClick = function () {
            _this.props.onClick(_this.props.index);
        };
        return _this;
    }
    TutorialMenuItemLink.prototype.renderCore = function () {
        var _a = this.props, className = _a.className, ariaLabel = _a.ariaLabel, index = _a.index;
        return React.createElement("a", { className: className, role: "menuitem", "aria-label": ariaLabel, tabIndex: 0, onClick: this.handleClick, onKeyDown: sui.fireClickOnEnter }, this.props.children);
    };
    return TutorialMenuItemLink;
}(data.Component));
exports.TutorialMenuItemLink = TutorialMenuItemLink;
var TutorialStepCircle = /** @class */ (function (_super) {
    __extends(TutorialStepCircle, _super);
    function TutorialStepCircle(props) {
        var _this = _super.call(this, props) || this;
        _this.handleNextClick = function () {
            var options = _this.props.parent.state.tutorialOptions;
            _this.openTutorialStep(options.tutorialStep + 1);
        };
        _this.handlePrevClick = function () {
            var options = _this.props.parent.state.tutorialOptions;
            _this.openTutorialStep(options.tutorialStep - 1);
        };
        _this.openTutorialStep = _this.openTutorialStep.bind(_this);
        return _this;
    }
    TutorialStepCircle.prototype.openTutorialStep = function (step) {
        var options = this.props.parent.state.tutorialOptions;
        pxt.tickEvent("tutorial.step", { tutorial: options.tutorial, step: step }, { interactiveConsent: true });
        this.props.parent.setTutorialStep(step);
    };
    TutorialStepCircle.prototype.renderCore = function () {
        var _a = this.props.parent.state.tutorialOptions, tutorialReady = _a.tutorialReady, tutorialStepInfo = _a.tutorialStepInfo, tutorialStep = _a.tutorialStep;
        var currentStep = tutorialStep;
        var hasPrev = tutorialReady && currentStep != 0;
        var hasNext = tutorialReady && currentStep != tutorialStepInfo.length - 1;
        var isRtl = false;
        if (!tutorialReady)
            return React.createElement("div", null);
        return React.createElement("div", { id: "tutorialsteps", className: "ui item " + this.props.className },
            React.createElement("div", { className: "ui item", role: "menubar" },
                React.createElement(sui.Button, { role: "button", icon: (isRtl ? 'right' : 'left') + " chevron", disabled: !hasPrev, className: "prevbutton left " + (!hasPrev ? 'disabled' : ''), text: lf("Back"), textClass: "widedesktop only", ariaLabel: lf("Go to the previous step of the tutorial."), onClick: this.handlePrevClick, onKeyDown: sui.fireClickOnEnter }),
                React.createElement("span", { className: "step-label", key: 'tutorialStep' + currentStep },
                    React.createElement(sui.ProgressCircle, { progress: currentStep + 1, steps: tutorialStepInfo.length, stroke: 4.5 }),
                    React.createElement("span", { className: "ui circular label blue selected " + (!tutorialReady ? 'disabled' : ''), "aria-label": lf("You are currently at tutorial step {0}.") }, tutorialStep + 1)),
                React.createElement(sui.Button, { role: "button", icon: (isRtl ? 'left' : 'right') + " chevron", disabled: !hasNext, rightIcon: true, className: "nextbutton right " + (!hasNext ? 'disabled' : ''), text: lf("Next"), textClass: "widedesktop only", ariaLabel: lf("Go to the next step of the tutorial."), onClick: this.handleNextClick, onKeyDown: sui.fireClickOnEnter })));
    };
    return TutorialStepCircle;
}(data.Component));
exports.TutorialStepCircle = TutorialStepCircle;
var TutorialHint = /** @class */ (function (_super) {
    __extends(TutorialHint, _super);
    function TutorialHint(props) {
        var _this = _super.call(this, props) || this;
        _this.setRef = function (el) { _this.elementRef = el; };
        _this.next = _this.next.bind(_this);
        _this.toggleHint = _this.toggleHint.bind(_this);
        _this.showHint = _this.showHint.bind(_this);
        return _this;
    }
    TutorialHint.prototype.next = function () {
        var options = this.props.parent.state.tutorialOptions;
        var tutorialStep = options.tutorialStep, tutorial = options.tutorial;
        this.setState({ visible: false });
        var nextStep = tutorialStep + 1;
        pxt.tickEvent("tutorial.hint.next", { tutorial: tutorial, step: nextStep });
        this.props.parent.setTutorialStep(nextStep);
    };
    TutorialHint.prototype.toggleHint = function (showFullText) {
        this.showHint(!this.state.visible, showFullText);
    };
    TutorialHint.prototype.showHint = function (visible, showFullText) {
        this.setState({ visible: visible, showFullText: showFullText });
    };
    TutorialHint.prototype.renderCore = function () {
        var visible = this.state.visible;
        var options = this.props.parent.state.tutorialOptions;
        var tutorialReady = options.tutorialReady, tutorialStepInfo = options.tutorialStepInfo, tutorialStep = options.tutorialStep, tutorialName = options.tutorialName;
        if (!tutorialReady)
            return React.createElement("div", null);
        var step = tutorialStepInfo[tutorialStep];
        var tutorialHint = step.hintContentMd;
        var fullText = step.contentMd;
        if (!step.unplugged) {
            if (!tutorialHint)
                return React.createElement("div", null);
            return React.createElement("div", { className: "tutorialhint " + (!visible ? 'hidden' : ''), ref: this.setRef },
                React.createElement(md.MarkedContent, { markdown: this.state.showFullText ? fullText : tutorialHint, parent: this.props.parent }));
        }
        else {
            var onClick = tutorialStep < tutorialStepInfo.length - 1 ? this.next : this.toggleHint;
            var actions = [{
                    label: lf("Ok"),
                    onclick: onClick,
                    icon: 'check',
                    className: 'green'
                }];
            return React.createElement(sui.Modal, { isOpen: visible, className: "hintdialog", closeIcon: false, header: tutorialName, buttons: actions, onClose: onClick, dimmer: true, longer: true, closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
                React.createElement(md.MarkedContent, { markdown: fullText, parent: this.props.parent }));
        }
    };
    return TutorialHint;
}(data.Component));
exports.TutorialHint = TutorialHint;
var TutorialCard = /** @class */ (function (_super) {
    __extends(TutorialCard, _super);
    function TutorialCard(props) {
        var _this = _super.call(this, props) || this;
        _this.closeLightboxOnEscape = function (e) {
            var charCode = core.keyCodeFromEvent(e);
            if (charCode === 27) {
                _this.closeLightbox();
            }
        };
        _this.lastStep = -1;
        var options = _this.props.parent.state.tutorialOptions;
        _this.prevStep = options.tutorialStep;
        _this.state = {
            showSeeMore: false,
            showHintTooltip: !options.tutorialStepInfo[_this.prevStep].fullscreen
        };
        _this.toggleHint = _this.toggleHint.bind(_this);
        _this.hintOnClick = _this.hintOnClick.bind(_this);
        _this.closeLightbox = _this.closeLightbox.bind(_this);
        _this.tutorialCardKeyDown = _this.tutorialCardKeyDown.bind(_this);
        _this.okButtonKeyDown = _this.okButtonKeyDown.bind(_this);
        _this.previousTutorialStep = _this.previousTutorialStep.bind(_this);
        _this.nextTutorialStep = _this.nextTutorialStep.bind(_this);
        _this.finishTutorial = _this.finishTutorial.bind(_this);
        _this.toggleExpanded = _this.toggleExpanded.bind(_this);
        return _this;
    }
    TutorialCard.prototype.previousTutorialStep = function () {
        this.showHint(false); // close hint on new tutorial step
        var options = this.props.parent.state.tutorialOptions;
        var currentStep = options.tutorialStep;
        var previousStep = currentStep - 1;
        options.tutorialStep = previousStep;
        pxt.tickEvent("tutorial.previous", { tutorial: options.tutorial, step: previousStep }, { interactiveConsent: true });
        this.props.parent.setTutorialStep(previousStep);
    };
    TutorialCard.prototype.nextTutorialStep = function () {
        this.showHint(false); // close hint on new tutorial step
        var options = this.props.parent.state.tutorialOptions;
        var currentStep = options.tutorialStep;
        var nextStep = currentStep + 1;
        options.tutorialStep = nextStep;
        pxt.tickEvent("tutorial.next", { tutorial: options.tutorial, step: nextStep }, { interactiveConsent: true });
        this.props.parent.setTutorialStep(nextStep);
    };
    TutorialCard.prototype.finishTutorial = function () {
        this.closeLightbox();
        this.removeHintOnClick();
        this.props.parent.completeTutorialAsync().done();
    };
    TutorialCard.prototype.setPopout = function () {
        this.setState({ popout: true });
    };
    TutorialCard.prototype.closeLightbox = function () {
        sounds.tutorialNext();
        document.documentElement.removeEventListener("keydown", this.closeLightboxOnEscape);
        // Hide lightbox
        this.props.parent.hideLightbox();
        this.setState({ popout: false });
    };
    TutorialCard.prototype.componentWillUpdate = function () {
        document.documentElement.addEventListener("keydown", this.closeLightboxOnEscape);
    };
    TutorialCard.prototype.tutorialCardKeyDown = function (e) {
        var charCode = core.keyCodeFromEvent(e);
        if (charCode == core.TAB_KEY) {
            e.preventDefault();
            var tutorialOkRef = this.refs["tutorialok"];
            var okButton = ReactDOM.findDOMNode(tutorialOkRef);
            okButton.focus();
        }
    };
    TutorialCard.prototype.okButtonKeyDown = function (e) {
        var charCode = core.keyCodeFromEvent(e);
        if (charCode == core.TAB_KEY) {
            e.preventDefault();
            var tutorialCard = this.refs['tutorialmessage'];
            tutorialCard.focus();
        }
    };
    TutorialCard.prototype.componentDidUpdate = function (prevProps, prevState) {
        var options = this.props.parent.state.tutorialOptions;
        var tutorialCard = this.refs['tutorialmessage'];
        var tutorialOkRef = this.refs["tutorialok"];
        var okButton = ReactDOM.findDOMNode(tutorialOkRef);
        if (prevState.popout != this.state.popout && this.state.popout) {
            // Setup focus trap around the tutorial card and the ok button
            tutorialCard.addEventListener('keydown', this.tutorialCardKeyDown);
            okButton.addEventListener('keydown', this.okButtonKeyDown);
            tutorialCard.focus();
        }
        else if (prevState.popout != this.state.popout && !this.state.popout) {
            // Unregister event handlers
            tutorialCard.removeEventListener('keydown', this.tutorialCardKeyDown);
            okButton.removeEventListener('keydown', this.okButtonKeyDown);
            tutorialCard.focus();
        }
        var step = this.props.parent.state.tutorialOptions.tutorialStep;
        if (step != this.lastStep) {
            var animationClasses_1 = "fade " + (step < this.lastStep ? "right" : "left") + " in visible transition animating";
            tutorialCard.style.animationDuration = '500ms';
            this.lastStep = step;
            pxsim.U.addClass(tutorialCard, animationClasses_1);
            Promise.resolve().delay(500)
                .then(function () { return pxsim.U.removeClass(tutorialCard, animationClasses_1); });
        }
        if (this.prevStep != step) {
            this.setShowSeeMore(options.autoexpandStep);
            this.prevStep = step;
            if (!!options.tutorialStepInfo[step].unplugged) {
                this.removeHintOnClick();
            }
            if (!this.state.showHintTooltip) {
                this.showHint(true); // re-bind events after tutorial DOM loaded
            }
        }
    };
    TutorialCard.prototype.componentDidMount = function () {
        this.setShowSeeMore(this.props.parent.state.tutorialOptions.autoexpandStep);
    };
    TutorialCard.prototype.componentWillUnmount = function () {
        // Clear the markdown cache when we unmount
        md.MarkedContent.clearBlockSnippetCache();
        this.lastStep = -1;
        // Clear any existing timers
        this.props.parent.stopPokeUserActivity();
        this.removeHintOnClick();
    };
    TutorialCard.prototype.removeHintOnClick = function () {
        // cleanup hintOnClick
        document.removeEventListener('click', this.hintOnClick);
    };
    TutorialCard.prototype.toggleExpanded = function (ev) {
        ev.stopPropagation();
        ev.preventDefault();
        var options = this.props.parent.state.tutorialOptions;
        var tutorialStepExpanded = options.tutorialStepExpanded;
        this.props.parent.setTutorialInstructionsExpanded(!tutorialStepExpanded);
        return false;
    };
    TutorialCard.prototype.hasHint = function () {
        var options = this.props.parent.state.tutorialOptions;
        var tutorialReady = options.tutorialReady, tutorialStepInfo = options.tutorialStepInfo, tutorialStep = options.tutorialStep;
        if (!tutorialReady)
            return false;
        return tutorialStepInfo[tutorialStep].hasHint || tutorialStepInfo[tutorialStep].unplugged;
    };
    TutorialCard.prototype.hintOnClick = function (evt) {
        var options = this.props.parent.state.tutorialOptions;
        if (!options) {
            pxt.reportError("tutorial", "leaking hintonclick");
            return;
        }
        if (evt)
            evt.stopPropagation();
        var tutorialStepInfo = options.tutorialStepInfo, tutorialStep = options.tutorialStep;
        var step = tutorialStepInfo[tutorialStep];
        var unplugged = tutorialStep < tutorialStepInfo.length - 1 && step && !!step.unplugged;
        if (!unplugged) {
            this.toggleHint();
        }
    };
    TutorialCard.prototype.expandedHintOnClick = function (evt) {
        evt.stopPropagation();
    };
    TutorialCard.prototype.setShowSeeMore = function (autoexpand) {
        // compare scrollHeight of inner text with height of card to determine showSeeMore
        var tutorialCard = this.refs['tutorialmessage'];
        var show = false;
        if (tutorialCard && tutorialCard.firstElementChild && tutorialCard.firstElementChild.firstElementChild) {
            show = tutorialCard.clientHeight < tutorialCard.firstElementChild.firstElementChild.scrollHeight;
            if (show) {
                this.cardHeight = tutorialCard.firstElementChild.firstElementChild.scrollHeight;
                if (autoexpand)
                    this.props.parent.setTutorialInstructionsExpanded(true);
            }
        }
        this.setState({ showSeeMore: show });
    };
    TutorialCard.prototype.getExpandedCardStyle = function (prop) {
        return _a = {}, _a[prop] = "calc(" + this.cardHeight + "px + 5rem)", _a;
        var _a;
    };
    TutorialCard.prototype.toggleHint = function (showFullText) {
        var th = this.refs["tutorialhint"];
        this.showHint(!(th && th.state && th.state.visible), showFullText);
    };
    TutorialCard.prototype.showHint = function (visible, showFullText) {
        if (!this.hasHint()) {
            this.removeHintOnClick();
            return;
        }
        this.closeLightbox();
        var th = this.refs["tutorialhint"];
        if (!th)
            return;
        if (!visible) {
            if (th.elementRef) {
                this.removeHintOnClick();
                th.elementRef.removeEventListener('click', this.expandedHintOnClick);
            }
            this.setState({ showHintTooltip: true });
            this.props.parent.pokeUserActivity();
        }
        else {
            if (th.elementRef) {
                document.addEventListener('click', this.hintOnClick);
                th.elementRef.addEventListener('click', this.expandedHintOnClick);
            }
            this.setState({ showHintTooltip: false });
            this.props.parent.stopPokeUserActivity();
            var options = this.props.parent.state.tutorialOptions;
            pxt.tickEvent("tutorial.showhint", { tutorial: options.tutorial, step: options.tutorialStep });
        }
        th.showHint(visible, showFullText);
    };
    TutorialCard.prototype.renderCore = function () {
        var options = this.props.parent.state.tutorialOptions;
        var tutorialReady = options.tutorialReady, tutorialStepInfo = options.tutorialStepInfo, tutorialStep = options.tutorialStep, tutorialStepExpanded = options.tutorialStepExpanded;
        if (!tutorialReady)
            return React.createElement("div", null);
        var tutorialCardContent = tutorialStepInfo[tutorialStep].headerContentMd;
        var lockedEditor = !!pxt.appTarget.appTheme.lockedEditor;
        var currentStep = tutorialStep;
        var maxSteps = tutorialStepInfo.length;
        var hasPrevious = tutorialReady && currentStep != 0;
        var hasNext = tutorialReady && currentStep != maxSteps - 1;
        var hasFinish = !lockedEditor && currentStep == maxSteps - 1;
        var hasHint = this.hasHint();
        var tutorialAriaLabel = '', tutorialHintTooltip = '';
        if (hasHint) {
            tutorialAriaLabel += lf("Press Space or Enter to show a hint.");
            tutorialHintTooltip += lf("Click to show a hint!");
        }
        var hintOnClick = this.hintOnClick;
        // double-click issue on edge when closing hint from tutorial card click
        if ((pxt.BrowserUtils.isEdge() || pxt.BrowserUtils.isIE()) && !this.state.showHintTooltip && !tutorialStepInfo[tutorialStep].unplugged) {
            hintOnClick = null;
        }
        var isRtl = pxt.Util.isUserLanguageRtl();
        return React.createElement("div", { id: "tutorialcard", className: "ui " + (tutorialStepExpanded ? 'tutorialExpanded' : '') + " " + (tutorialReady ? 'tutorialReady' : '') + " " + (this.state.showSeeMore ? 'seemore' : '') + "  " + (this.state.showHintTooltip ? 'showTooltip' : '') + " " + (hasHint ? 'hasHint' : ''), style: tutorialStepExpanded ? this.getExpandedCardStyle('height') : null },
            React.createElement("div", { className: 'ui buttons' },
                hasPrevious ? React.createElement(sui.Button, { icon: (isRtl ? 'right' : 'left') + " chevron orange large", className: "prevbutton left attached " + (!hasPrevious ? 'disabled' : ''), text: lf("Back"), textClass: "widedesktop only", ariaLabel: lf("Go to the previous step of the tutorial."), onClick: this.previousTutorialStep, onKeyDown: sui.fireClickOnEnter }) : undefined,
                React.createElement("div", { className: "ui segment attached tutorialsegment" },
                    React.createElement("div", { className: "avatar-container" },
                        React.createElement("div", { role: "button", className: "avatar-image " + (hasHint && this.props.pokeUser ? 'shake' : ''), onClick: hintOnClick, onKeyDown: sui.fireClickOnEnter }),
                        hasHint && React.createElement(sui.Button, { className: "ui circular small label blue hintbutton hidelightbox", icon: "lightbulb outline", tabIndex: -1, onClick: hintOnClick, onKeyDown: sui.fireClickOnEnter }),
                        hasHint && React.createElement(hinttooltip_1.HintTooltip, { ref: "hinttooltip", pokeUser: this.props.pokeUser, text: tutorialHintTooltip, onClick: hintOnClick }),
                        hasHint && React.createElement(TutorialHint, { ref: "tutorialhint", parent: this.props.parent })),
                    React.createElement("div", { ref: "tutorialmessage", className: "tutorialmessage", role: "alert", "aria-label": tutorialAriaLabel, tabIndex: hasHint ? 0 : -1, onClick: hintOnClick, onKeyDown: sui.fireClickOnEnter },
                        React.createElement("div", { className: "content" },
                            React.createElement(md.MarkedContent, { className: "no-select", markdown: tutorialCardContent, parent: this.props.parent })),
                        this.state.showSeeMore && !tutorialStepExpanded ? React.createElement(sui.Button, { className: "fluid compact attached bottom lightgrey", icon: "chevron down", tabIndex: 0, text: lf("More..."), onClick: this.toggleExpanded, onKeyDown: sui.fireClickOnEnter }) : undefined,
                        this.state.showSeeMore && tutorialStepExpanded ? React.createElement(sui.Button, { className: "fluid compact attached bottom lightgrey", icon: "chevron up", tabIndex: 0, text: lf("Less..."), onClick: this.toggleExpanded, onKeyDown: sui.fireClickOnEnter }) : undefined),
                    React.createElement(sui.Button, { ref: "tutorialok", id: "tutorialOkButton", className: "large green okbutton showlightbox", text: lf("Ok"), onClick: this.closeLightbox, onKeyDown: sui.fireClickOnEnter })),
                hasNext ? React.createElement(sui.Button, { icon: (isRtl ? 'left' : 'right') + " chevron orange large", className: "nextbutton right attached " + (!hasNext ? 'disabled' : ''), text: lf("Next"), textClass: "widedesktop only", ariaLabel: lf("Go to the next step of the tutorial."), onClick: this.nextTutorialStep, onKeyDown: sui.fireClickOnEnter }) : undefined,
                hasFinish ? React.createElement(sui.Button, { icon: "left checkmark", className: "orange right attached " + (!tutorialReady ? 'disabled' : ''), text: lf("Finish"), ariaLabel: lf("Finish the tutorial."), onClick: this.finishTutorial, onKeyDown: sui.fireClickOnEnter }) : undefined));
    };
    return TutorialCard;
}(data.Component));
exports.TutorialCard = TutorialCard;
var ChooseRecipeDialog = /** @class */ (function (_super) {
    __extends(ChooseRecipeDialog, _super);
    function ChooseRecipeDialog(props) {
        var _this = _super.call(this, props) || this;
        _this.prevGalleries = [];
        _this.state = {
            visible: false
        };
        _this.close = _this.close.bind(_this);
        return _this;
    }
    ChooseRecipeDialog.prototype.hide = function () {
        this.setState({ visible: false });
    };
    ChooseRecipeDialog.prototype.close = function () {
        this.setState({ visible: false });
    };
    ChooseRecipeDialog.prototype.show = function () {
        this.setState({ visible: true });
    };
    ChooseRecipeDialog.prototype.start = function (card) {
        pxt.tickEvent("recipe." + card.url);
        this.hide();
        this.props.parent.startTutorial(card.url, undefined, true);
    };
    ChooseRecipeDialog.prototype.fetchGallery = function () {
        var path = "/recipes";
        var res = this.getData("gallery:" + encodeURIComponent(path));
        if (res) {
            if (res instanceof Error) {
                // ignore
            }
            else {
                var editor_1 = this.props.parent.isJavaScriptActive()
                    ? "js" : this.props.parent.isPythonActive() ? "py"
                    : "blocks";
                this.prevGalleries = pxt.Util.concat(res.map(function (g) {
                    return g.cards.filter(function (c) { return c.cardType == "tutorial"; })
                        .filter(function (c) { return (c.editor == editor_1) || (editor_1 == "blocks" && !c.editor); });
                }));
            }
        }
        return this.prevGalleries || [];
    };
    ChooseRecipeDialog.prototype.renderCore = function () {
        var _this = this;
        var visible = this.state.visible;
        if (!visible)
            return React.createElement("div", null);
        var cards = this.fetchGallery();
        return (React.createElement(sui.Modal, { isOpen: visible, className: "recipedialog", size: "large", onClose: this.close, dimmer: true, closeIcon: true, header: lf("Try a Tutorial"), closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
            React.createElement("div", { className: "group" },
                React.createElement("div", { className: "ui cards centered", role: "listbox" },
                    !cards.length && React.createElement("div", { className: "ui items" },
                        React.createElement("div", { className: "ui item" }, lf("Oops, we couldn't find any tutorials for this editor."))),
                    cards.length > 0 ? cards.map(function (card) {
                        return React.createElement(codecard.CodeCardView, { key: 'card' + card.name, name: card.name, ariaLabel: card.name, description: card.description, imageUrl: card.imageUrl, largeImageUrl: card.largeImageUrl, 
                            // tslint:disable-next-line:react-this-binding-issue
                            onClick: function () { return _this.start(card); } });
                    }) : undefined))));
    };
    return ChooseRecipeDialog;
}(data.Component));
exports.ChooseRecipeDialog = ChooseRecipeDialog;
