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
var sui = require("./sui");
var simulator = require("./simulator");
var screenshot = require("./screenshot");
var qr = require("./qr");
var ShareMode;
(function (ShareMode) {
    ShareMode[ShareMode["Code"] = 0] = "Code";
    ShareMode[ShareMode["Url"] = 1] = "Url";
    ShareMode[ShareMode["Editor"] = 2] = "Editor";
    ShareMode[ShareMode["Simulator"] = 3] = "Simulator";
})(ShareMode = exports.ShareMode || (exports.ShareMode = {}));
var ShareRecordingState;
(function (ShareRecordingState) {
    ShareRecordingState[ShareRecordingState["None"] = 0] = "None";
    ShareRecordingState[ShareRecordingState["ScreenshotSnap"] = 1] = "ScreenshotSnap";
    ShareRecordingState[ShareRecordingState["GifLoading"] = 2] = "GifLoading";
    ShareRecordingState[ShareRecordingState["GifRecording"] = 3] = "GifRecording";
    ShareRecordingState[ShareRecordingState["GifRendering"] = 4] = "GifRendering";
})(ShareRecordingState = exports.ShareRecordingState || (exports.ShareRecordingState = {}));
var ShareEditor = /** @class */ (function (_super) {
    __extends(ShareEditor, _super);
    function ShareEditor(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            pubId: undefined,
            visible: false,
            advancedMenu: false,
            screenshotUri: undefined,
            recordingState: ShareRecordingState.None,
            recordError: undefined,
            title: undefined
        };
        _this.hide = _this.hide.bind(_this);
        _this.toggleAdvancedMenu = _this.toggleAdvancedMenu.bind(_this);
        _this.setAdvancedMode = _this.setAdvancedMode.bind(_this);
        _this.handleProjectNameChange = _this.handleProjectNameChange.bind(_this);
        _this.restartSimulator = _this.restartSimulator.bind(_this);
        _this.handleRecordClick = _this.handleRecordClick.bind(_this);
        _this.handleScreenshotClick = _this.handleScreenshotClick.bind(_this);
        _this.handleScreenshotMessage = _this.handleScreenshotMessage.bind(_this);
        return _this;
    }
    ShareEditor.prototype.hide = function () {
        if (this._gifEncoder) {
            this._gifEncoder.cancel();
            this._gifEncoder = undefined;
        }
        if (this.loanedSimulator) {
            simulator.driver.unloanSimulator();
            this.loanedSimulator = undefined;
            this.props.parent.popScreenshotHandler();
            simulator.driver.stopRecording();
        }
        this.setState({
            visible: false,
            screenshotUri: undefined,
            projectName: undefined,
            projectNameChanged: false,
            recordingState: ShareRecordingState.None,
            recordError: undefined,
            qrCodeUri: undefined,
            title: undefined
        });
    };
    ShareEditor.prototype.show = function (header, title) {
        var _this = this;
        // TODO investigate why edge does not render well
        // upon hiding dialog, the screen does not redraw properly
        var thumbnails = pxt.appTarget.cloud && pxt.appTarget.cloud.thumbnails
            && (pxt.appTarget.appTheme.simScreenshot || pxt.appTarget.appTheme.simGif);
        if (thumbnails) {
            this.loanedSimulator = simulator.driver.loanSimulator();
            this.props.parent.pushScreenshotHandler(this.handleScreenshotMessage);
        }
        this.setState({
            thumbnails: thumbnails,
            visible: true,
            mode: ShareMode.Code,
            pubId: undefined,
            sharingError: false,
            screenshotUri: undefined,
            qrCodeUri: undefined,
            title: title
        }, thumbnails ? (function () { return _this.props.parent.startSimulator(); }) : undefined);
    };
    ShareEditor.prototype.handleScreenshotMessage = function (msg) {
        if (!msg)
            return;
        if (msg.event === "start") {
            switch (this.state.recordingState) {
                case ShareRecordingState.None:
                    this.gifRecord();
                    break;
                default:
                    // ignore
                    break;
            }
            return;
        }
        else if (msg.event == "stop") {
            switch (this.state.recordingState) {
                case ShareRecordingState.GifRecording:
                    this.gifRender();
                    break;
                default:
                    // ignore
                    break;
            }
            return;
        }
        if (this.state.recordingState == ShareRecordingState.GifRecording) {
            if (this._gifEncoder.addFrame(msg.data, msg.delay))
                this.gifRender();
        }
        else if (this.state.recordingState == ShareRecordingState.ScreenshotSnap) {
            // received a screenshot
            this.setState({ screenshotUri: pxt.BrowserUtils.imageDataToPNG(msg.data), recordingState: ShareRecordingState.None, recordError: undefined });
        }
        else {
            // ignore
            // make sure simulator is stopped
            simulator.driver.stopRecording();
        }
    };
    ShareEditor.prototype.componentWillReceiveProps = function (newProps) {
        var newState = {};
        if (!this.state.projectNameChanged &&
            newProps.parent.state.projectName != this.state.projectName) {
            newState.projectName = newProps.parent.state.projectName;
        }
        if (newProps.loading != this.state.loading) {
            newState.loading = newProps.loading;
        }
        if (Object.keys(newState).length > 0) {
            this.setState(newState);
        }
    };
    ShareEditor.prototype.shouldComponentUpdate = function (nextProps, nextState, nextContext) {
        return this.state.visible != nextState.visible
            || this.state.advancedMenu != nextState.advancedMenu
            || this.state.mode != nextState.mode
            || this.state.pubId != nextState.pubId
            || this.state.sharingError != nextState.sharingError
            || this.state.projectName != nextState.projectName
            || this.state.projectNameChanged != nextState.projectNameChanged
            || this.state.loading != nextState.loading
            || this.state.recordingState != nextState.recordingState
            || this.state.screenshotUri != nextState.screenshotUri
            || this.state.qrCodeUri != nextState.qrCodeUri
            || this.state.title != nextState.title;
    };
    ShareEditor.prototype.toggleAdvancedMenu = function () {
        var advancedMenu = !!this.state.advancedMenu;
        this.setState({ advancedMenu: !advancedMenu });
    };
    ShareEditor.prototype.setAdvancedMode = function (mode) {
        this.setState({ mode: mode });
    };
    ShareEditor.prototype.handleProjectNameChange = function (name) {
        this.setState({ projectName: name, projectNameChanged: true });
    };
    ShareEditor.prototype.restartSimulator = function () {
        pxt.tickEvent('share.restart', undefined, { interactiveConsent: true });
        this.props.parent.restartSimulator();
    };
    ShareEditor.prototype.handleScreenshotClick = function () {
        var _this = this;
        pxt.tickEvent("share.takescreenshot", { view: 'computer', collapsedTo: '' + !this.props.parent.state.collapseEditorTools }, { interactiveConsent: true });
        if (this.state.recordingState != ShareRecordingState.None)
            return;
        this.setState({ recordingState: ShareRecordingState.ScreenshotSnap, recordError: undefined }, function () {
            _this.props.parent.requestScreenshotAsync()
                .then(function (img) {
                var st = { recordingState: ShareRecordingState.None, recordError: undefined };
                if (img)
                    st.screenshotUri = img;
                else
                    st.recordError = lf("Oops, screenshot failed. Please try again.");
                _this.setState(st);
            });
        });
    };
    ShareEditor.prototype.handleRecordClick = function () {
        switch (this.state.recordingState) {
            case ShareRecordingState.None:
                this.gifRecord();
                break;
            case ShareRecordingState.GifRecording:
                this.gifRender();
                break;
            default:
                // ignore
                break;
        }
    };
    ShareEditor.prototype.loadEncoderAsync = function () {
        var _this = this;
        if (this._gifEncoder)
            return Promise.resolve(this._gifEncoder);
        return screenshot.loadGifEncoderAsync()
            .then(function (encoder) { return _this._gifEncoder = encoder; });
    };
    ShareEditor.prototype.gifRecord = function () {
        var _this = this;
        pxt.tickEvent("share.gifrecord", { view: 'computer', collapsedTo: '' + !this.props.parent.state.collapseEditorTools }, { interactiveConsent: true });
        if (this.state.recordingState != ShareRecordingState.None)
            return;
        this.setState({ recordingState: ShareRecordingState.GifLoading, screenshotUri: undefined }, function () { return _this.loadEncoderAsync()
            .then(function (encoder) {
            if (!encoder) {
                _this.setState({
                    recordingState: ShareRecordingState.None,
                    recordError: lf("Oops, gif encoder could not load. Please try again.")
                });
            }
            else {
                encoder.start();
                var gifwidth_1 = pxt.appTarget.appTheme.simGifWidth || 160;
                _this.setState({ recordingState: ShareRecordingState.GifRecording }, function () { return simulator.driver.startRecording(gifwidth_1); });
            }
        })
            .catch(function (e) {
            pxt.reportException(e);
            _this.setState({
                recordingState: ShareRecordingState.None,
                recordError: lf("Oops, gif recording failed. Please try again.")
            });
            if (_this._gifEncoder) {
                _this._gifEncoder.cancel();
            }
        }); });
    };
    ShareEditor.prototype.gifRender = function () {
        var _this = this;
        pxt.debug("render gif");
        simulator.driver.stopRecording();
        if (!this._gifEncoder)
            return;
        this.setState({ recordingState: ShareRecordingState.GifRendering, recordError: undefined }, function () {
            _this.props.parent.stopSimulator();
            _this._gifEncoder.renderAsync()
                .then(function (uri) {
                pxt.log("gif: " + (uri ? uri.length : 0) + " chars");
                var maxSize = pxt.appTarget.appTheme.simScreenshotMaxUriLength;
                var recordError = undefined;
                if (uri) {
                    if (maxSize && uri.length > maxSize) {
                        pxt.tickEvent("gif.toobig", { size: uri.length });
                        uri = undefined;
                        recordError = lf("Gif is too big, try recording a shorter time.");
                    }
                    else
                        pxt.tickEvent("gif.ok", { size: uri.length });
                }
                _this.setState({ recordingState: ShareRecordingState.None, screenshotUri: uri, recordError: recordError });
                // give a breather to the browser to render the gif
                Promise.delay(1000).then(function () { return _this.props.parent.startSimulator(); });
            });
        });
    };
    ShareEditor.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, visible = _a.visible, newProjectName = _a.projectName, loading = _a.loading, recordingState = _a.recordingState, screenshotUri = _a.screenshotUri, thumbnails = _a.thumbnails, recordError = _a.recordError, pubId = _a.pubId, qrCodeUri = _a.qrCodeUri, title = _a.title;
        var targetTheme = pxt.appTarget.appTheme;
        var header = this.props.parent.state.header;
        var advancedMenu = !!this.state.advancedMenu;
        var hideEmbed = !!targetTheme.hideShareEmbed;
        var socialOptions = targetTheme.socialOptions;
        var showSocialIcons = !!socialOptions && !pxt.BrowserUtils.isUwpEdge();
        var ready = !!pubId;
        var mode = this.state.mode;
        var url = '';
        var embed = '';
        var shareUrl = pxt.appTarget.appTheme.shareUrl || "https://makecode.com/";
        if (!/\/$/.test(shareUrl))
            shareUrl += '/';
        var rootUrl = pxt.appTarget.appTheme.embedUrl;
        if (!/\/$/.test(rootUrl))
            rootUrl += '/';
        var verPrefix = pxt.webConfig.verprefix || '';
        if (header) {
            if (ready) {
                url = "" + shareUrl + pubId;
                var editUrl = "" + rootUrl + verPrefix + "#pub:" + pubId;
                switch (mode) {
                    case ShareMode.Code:
                        embed = pxt.docs.codeEmbedUrl("" + rootUrl + verPrefix, pubId);
                        break;
                    case ShareMode.Editor:
                        embed = pxt.docs.embedUrl("" + rootUrl + verPrefix, "pub", pubId);
                        break;
                    case ShareMode.Simulator:
                        var padding = '81.97%';
                        // TODO: parts aspect ratio
                        if (pxt.appTarget.simulator)
                            padding = (100 / pxt.appTarget.simulator.aspectRatio).toPrecision(4) + '%';
                        var runUrl = rootUrl + (pxt.webConfig.runUrl || verPrefix + "--run").replace(/^\//, '');
                        embed = pxt.docs.runUrl(runUrl, padding, pubId);
                        break;
                    case ShareMode.Url:
                        embed = editUrl;
                        break;
                }
            }
        }
        var publish = function () {
            pxt.tickEvent("menu.embed.publish", undefined, { interactiveConsent: true });
            _this.setState({ sharingError: false, loading: true });
            var p = Promise.resolve();
            if (newProjectName && _this.props.parent.state.projectName != newProjectName) {
                // save project name if we've made a change change
                p = _this.props.parent.updateHeaderNameAsync(newProjectName);
            }
            p.then(function () { return _this.props.parent.anonymousPublishAsync(screenshotUri); })
                .then(function (id) {
                _this.setState({ pubId: id, qrCodeUri: undefined });
                if (pxt.appTarget.appTheme.qrCode)
                    qr.renderAsync("" + shareUrl + id)
                        .then(function (qruri) {
                        if (_this.state.pubId == id)
                            _this.setState({ qrCodeUri: qruri });
                    });
                _this.forceUpdate();
            })
                .catch(function (e) {
                _this.setState({
                    pubId: undefined,
                    sharingError: true,
                    qrCodeUri: undefined
                });
            });
            _this.forceUpdate();
        };
        var formats = [
            { mode: ShareMode.Code, label: lf("Code") },
            { mode: ShareMode.Editor, label: lf("Editor") },
            { mode: ShareMode.Simulator, label: lf("Simulator") },
        ];
        var action = !ready ? lf("Publish project") : undefined;
        var actionLoading = loading && !this.state.sharingError;
        var actions = [];
        if (action) {
            actions.push({
                label: action,
                onclick: publish,
                icon: 'share alternate',
                loading: actionLoading,
                className: 'primary',
                disabled: recordingState != ShareRecordingState.None
            });
        }
        var light = !!pxt.options.light;
        var disclaimer = lf("You need to publish your project to share it or embed it in other web pages.") + " " +
            lf("You acknowledge having consent to publish this project.");
        var screenshotDisabled = actionLoading || recordingState != ShareRecordingState.None;
        var screenshotText = this.loanedSimulator && targetTheme.simScreenshotKey
            ? lf("Take Screenshot (shortcut: {0})", targetTheme.simScreenshotKey) : lf("Take Screenshot");
        var screenshot = !light && targetTheme.simScreenshot;
        var gif = !light && !!targetTheme.simGif;
        var isGifRecording = recordingState == ShareRecordingState.GifRecording;
        var isGifRendering = recordingState == ShareRecordingState.GifRendering;
        var gifIcon = isGifRecording ? "stop" : "circle";
        var gifTitle = isGifRecording
            ? (targetTheme.simGifKey ? lf("Stop recording (shortcut: {0})", targetTheme.simGifKey) : lf("Stop recording"))
            : isGifRendering ? lf("Cancel rendering")
                : (targetTheme.simGifKey ? lf("Start recording (shortcut: {0})", targetTheme.simGifKey)
                    : lf("Start recording"));
        var gifRecordingClass = isGifRecording ? "glow" : "";
        var gifDisabled = actionLoading;
        var gifLoading = recordingState == ShareRecordingState.GifLoading
            || isGifRendering;
        var screenshotMessage = recordError ? recordError
            : isGifRecording ? lf("Recording in progress...")
                : isGifRendering ? lf("Rendering gif...")
                    : undefined;
        var screenshotMessageClass = recordError ? "warning" : "";
        return (React.createElement(sui.Modal, { isOpen: visible, className: "sharedialog", size: thumbnails ? "" : "small", onClose: this.hide, dimmer: true, header: title || lf("Share Project"), closeIcon: true, buttons: actions, closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
            React.createElement("div", { className: "ui form" },
                action && !this.loanedSimulator ? React.createElement("div", { className: "ui field" },
                    React.createElement("div", null,
                        React.createElement(sui.Input, { ref: "filenameinput", placeholder: lf("Name"), autoFocus: !pxt.BrowserUtils.isMobile(), id: "projectNameInput", ariaLabel: lf("Type a name for your project"), autoComplete: false, value: newProjectName || '', onChange: this.handleProjectNameChange }))) : undefined,
                action && this.loanedSimulator ? React.createElement("div", { className: "ui fields" },
                    React.createElement("div", { id: "shareLoanedSimulator", className: "simulator ui six wide field landscape only " + gifRecordingClass }),
                    React.createElement("div", { className: "ui ten wide field" },
                        React.createElement(sui.Input, { ref: "filenameinput", placeholder: lf("Name"), autoFocus: !pxt.BrowserUtils.isMobile(), id: "projectNameInput", ariaLabel: lf("Type a name for your project"), autoComplete: false, value: newProjectName || '', onChange: this.handleProjectNameChange }),
                        React.createElement("label", null),
                        React.createElement("div", { className: "ui buttons landscape only" },
                            React.createElement(sui.Button, { icon: "refresh", title: lf("Restart"), ariaLabel: lf("Restart"), onClick: this.restartSimulator, disabled: screenshotDisabled }),
                            screenshot ? React.createElement(sui.Button, { icon: "camera", title: screenshotText, ariaLabel: screenshotText, onClick: this.handleScreenshotClick, disabled: screenshotDisabled }) : undefined,
                            gif ? React.createElement(sui.Button, { icon: gifIcon, title: gifTitle, loading: gifLoading, onClick: this.handleRecordClick, disabled: gifDisabled }) : undefined),
                        screenshotUri || screenshotMessage ?
                            React.createElement("div", { className: "ui " + screenshotMessageClass + " segment landscape only" }, (screenshotUri && !screenshotMessage)
                                ? React.createElement("img", { className: "ui small centered image", src: screenshotUri, alt: lf("Recorded gif") })
                                : React.createElement("p", { className: "no-select" }, screenshotMessage)) : undefined,
                        React.createElement("p", { className: "ui tiny message info" }, disclaimer))) : undefined,
                action && !this.loanedSimulator ? React.createElement("p", { className: "ui tiny message info" }, disclaimer) : undefined,
                this.state.sharingError ?
                    React.createElement("p", { className: "ui red inverted segment" }, lf("Oops! There was an error. Please ensure you are connected to the Internet and try again."))
                    : undefined,
                url && ready ? React.createElement("div", null,
                    React.createElement("p", null, lf("Your project is ready! Use the address below to share your projects.")),
                    React.createElement(sui.Input, { id: "projectUri", class: "mini", readOnly: true, lines: 1, value: url, copy: true, autoFocus: !pxt.BrowserUtils.isMobile(), selectOnClick: true, "aria-describedby": "projectUriLabel", autoComplete: false }),
                    React.createElement("label", { htmlFor: "projectUri", id: "projectUriLabel", className: "accessible-hidden" }, lf("This is the read-only internet address of your project.")),
                    qrCodeUri ?
                        React.createElement("img", { className: "ui tiny image floated right", alt: lf("QR Code of the saved program"), src: qrCodeUri })
                        : undefined,
                    showSocialIcons ? React.createElement("div", { className: "social-icons" },
                        React.createElement(SocialButton, { url: url, ariaLabel: "Facebook", type: 'facebook', heading: lf("Share on Facebook") }),
                        React.createElement(SocialButton, { url: url, ariaLabel: "Twitter", type: 'twitter', heading: lf("Share on Twitter") }),
                        socialOptions.discourse ? React.createElement(SocialButton, { url: url, icon: "comments", ariaLabel: lf("Post to Forum"), type: 'discourse', heading: lf("Share on Forum") }) : undefined) : undefined) : undefined,
                ready && !hideEmbed ? React.createElement("div", null,
                    React.createElement("div", { className: "ui divider" }),
                    React.createElement(sui.Link, { icon: "no-select chevron " + (advancedMenu ? "down" : "right"), text: lf("Embed"), ariaExpanded: advancedMenu, onClick: this.toggleAdvancedMenu }),
                    advancedMenu ?
                        React.createElement(sui.Menu, { pointing: true, secondary: true }, formats.map(function (f) {
                            return React.createElement(EmbedMenuItem, __assign({ key: "tab" + f.label, onClick: _this.setAdvancedMode, currentMode: mode }, f));
                        })) : undefined,
                    advancedMenu ?
                        React.createElement(sui.Field, null,
                            React.createElement(sui.Input, { id: "embedCode", class: "mini", readOnly: true, lines: 4, value: embed, copy: ready, disabled: !ready, selectOnClick: true, autoComplete: false }),
                            React.createElement("label", { htmlFor: "embedCode", id: "embedCodeLabel", className: "accessible-hidden" }, lf("This is the read-only code for the selected tab."))) : null) : undefined)));
    };
    ShareEditor.prototype.componentDidUpdate = function () {
        var container = document.getElementById("shareLoanedSimulator");
        if (container && this.loanedSimulator && !this.loanedSimulator.parentNode)
            container.appendChild(this.loanedSimulator);
    };
    return ShareEditor;
}(data.Component));
exports.ShareEditor = ShareEditor;
var SocialButton = /** @class */ (function (_super) {
    __extends(SocialButton, _super);
    function SocialButton(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    SocialButton.prototype.handleClick = function (e) {
        var _a = this.props, type = _a.type, shareUrl = _a.url, heading = _a.heading;
        var socialOptions = pxt.appTarget.appTheme.socialOptions;
        pxt.tickEvent("share." + type, undefined, { interactiveConsent: true });
        var url = '';
        switch (type) {
            case "facebook": {
                url = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl);
                break;
            }
            case "twitter": {
                var twitterText = lf("Check out what I made!");
                if (socialOptions.twitterHandle && socialOptions.orgTwitterHandle) {
                    twitterText = lf("Check out what I made with @{0} and @{1}!", socialOptions.twitterHandle, socialOptions.orgTwitterHandle);
                }
                else if (socialOptions.twitterHandle) {
                    twitterText = lf("Check out what I made with @{0}!", socialOptions.twitterHandle);
                }
                else if (socialOptions.orgTwitterHandle) {
                    twitterText = lf("Check out what I made with @{0}!", socialOptions.orgTwitterHandle);
                }
                url = "https://twitter.com/intent/tweet?url=" + encodeURIComponent(shareUrl) +
                    ("&text=" + encodeURIComponent(twitterText)) +
                    (socialOptions.hashtags ? "&hashtags=" + encodeURIComponent(socialOptions.hashtags) : '') +
                    (socialOptions.related ? "&related=" + encodeURIComponent(socialOptions.related) : '');
                break;
            }
            case "discourse": {
                // https://meta.discourse.org/t/compose-a-new-pre-filled-topic-via-url/28074
                url = (socialOptions.discourse || "https://forum.makecode.com/") + "new-topic?title=" + encodeURIComponent(shareUrl);
                if (socialOptions.discourseCategory)
                    url += "&category=" + encodeURIComponent(socialOptions.discourseCategory);
                break;
            }
        }
        pxt.BrowserUtils.popupWindow(url, heading, 600, 600);
        e.preventDefault();
    };
    SocialButton.prototype.renderCore = function () {
        var _a = this.props, type = _a.type, label = _a.label, ariaLabel = _a.ariaLabel, icon = _a.icon;
        return React.createElement("a", { role: "button", className: "ui button large " + (label ? "labeled" : "") + " icon " + type, tabIndex: 0, "aria-label": ariaLabel, onClick: this.handleClick },
            React.createElement(sui.Icon, { icon: icon || type }),
            label);
    };
    return SocialButton;
}(data.Component));
var EmbedMenuItem = /** @class */ (function (_super) {
    __extends(EmbedMenuItem, _super);
    function EmbedMenuItem(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    EmbedMenuItem.prototype.handleClick = function () {
        this.props.onClick(this.props.mode);
    };
    EmbedMenuItem.prototype.renderCore = function () {
        var _a = this.props, label = _a.label, mode = _a.mode, currentMode = _a.currentMode;
        return React.createElement(sui.MenuItem, { id: "tab" + mode, active: currentMode == mode, name: label, onClick: this.handleClick });
    };
    return EmbedMenuItem;
}(sui.StatelessUIElement));
