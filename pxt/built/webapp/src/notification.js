"use strict";
/// <reference path="../../built/pxtlib.d.ts" />
/// <reference path="../../localtypings/mscc.d.ts" />
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
var data = require("./data");
var sui = require("./sui");
var Cloud = pxt.Cloud;
var GenericBanner = /** @class */ (function (_super) {
    __extends(GenericBanner, _super);
    function GenericBanner(props) {
        var _this = _super.call(this, props) || this;
        _this.delayTime = _this.props.delayTime || 0;
        _this.doneSleeping = _this.sleepDone();
        _this.bannerType = _this.props.bannerType || "default";
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    GenericBanner.prototype.componentDidMount = function () {
        var _this = this;
        if (this.doneSleeping) {
            this.timer = setTimeout(function () { return _this.show(); }, this.delayTime);
        }
    };
    GenericBanner.prototype.componentWillUnmount = function () {
        clearTimeout(this.timer);
    };
    GenericBanner.prototype.sleepDone = function () {
        if (!this.props.sleepTime) {
            return true;
        }
        var lastBannerClosedTime = parseInt(pxt.storage.getLocal("lastBannerClosedTime") || "0");
        var now = pxt.Util.nowSeconds();
        return (now - lastBannerClosedTime) > this.props.sleepTime;
    };
    GenericBanner.prototype.show = function () {
        var _this = this;
        pxt.tickEvent("notificationBanner." + this.props.id + ".show");
        if (this.props.displayTime) {
            this.timer = setTimeout(function () { return _this.hide("automatic"); }, this.delayTime + this.props.displayTime);
        }
        this.props.parent.setBannerVisible(true);
        this.render();
    };
    GenericBanner.prototype.hide = function (mode) {
        pxt.tickEvent("notificationBanner." + this.props.id + "." + mode + "Close");
        pxt.storage.setLocal("lastBannerClosedTime", pxt.Util.nowSeconds().toString());
        this.props.parent.setBannerVisible(false);
        this.render();
    };
    GenericBanner.prototype.handleClick = function () {
        this.hide("manual");
        clearTimeout(this.timer);
    };
    GenericBanner.prototype.renderCore = function () {
        return ((this.props.parent.state.bannerVisible && this.doneSleeping) ?
            React.createElement("div", { id: "notificationBanner", className: "ui attached " + this.bannerType + " message" },
                React.createElement("div", { className: "bannerLeft" },
                    React.createElement("div", { className: "content" }, this.props.children)),
                React.createElement("div", { className: "bannerRight" },
                    React.createElement(sui.Icon, { icon: "close", tabIndex: 0, onClick: this.handleClick }))) :
            React.createElement("div", null));
    };
    return GenericBanner;
}(data.Component));
exports.GenericBanner = GenericBanner;
var NotificationBanner = /** @class */ (function (_super) {
    __extends(NotificationBanner, _super);
    function NotificationBanner(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        _this.handleBannerClick = _this.handleBannerClick.bind(_this);
        _this.clearExperiments = _this.clearExperiments.bind(_this);
        return _this;
    }
    NotificationBanner.prototype.handleBannerClick = function () {
        pxt.tickEvent("banner.linkClicked", undefined, { interactiveConsent: true });
    };
    NotificationBanner.prototype.clearExperiments = function () {
        pxt.tickEvent("banner.experiments", undefined, { interactiveConsent: true });
        pxt.editor.experiments.clear();
        this.props.parent.reloadEditor();
    };
    NotificationBanner.prototype.renderCore = function () {
        if (pxt.analytics.isCookieBannerVisible()) {
            // don't show any banner while cookie banner is up
            return React.createElement("div", null);
        }
        var targetTheme = pxt.appTarget.appTheme;
        var isApp = pxt.winrt.isWinRT() || pxt.BrowserUtils.isElectron();
        var isLocalServe = location.hostname === "localhost";
        var isExperimentalUrlPath = location.pathname !== "/"
            && (targetTheme.appPathNames || []).indexOf(location.pathname) === -1;
        var showExperimentalBanner = !isLocalServe && isApp && isExperimentalUrlPath;
        var isWindows10 = pxt.BrowserUtils.isWindows10();
        var targetConfig = this.getData("target-config:");
        var showExperiments = pxt.editor.experiments.someEnabled();
        var showWindowsStoreBanner = isWindows10 && Cloud.isOnline() && targetConfig && targetConfig.windowsStoreLink
            && !isApp
            && !pxt.shell.isSandboxMode();
        if (showExperiments) {
            var displayTime = 20 * 1000; // 20 seconds
            return React.createElement(GenericBanner, { id: "experimentsbanner", parent: this.props.parent, bannerType: "negative", displayTime: displayTime },
                React.createElement(sui.Icon, { icon: "information circle" }),
                React.createElement("div", { className: "header" }, lf("Experiments enabled.")),
                React.createElement(sui.Link, { className: "link", ariaLabel: lf("Clear"), onClick: this.clearExperiments }, lf("Clear")));
        }
        if (showExperimentalBanner) {
            var liveUrl = pxt.appTarget.appTheme.homeUrl + location.search + location.hash;
            return (React.createElement(GenericBanner, { id: "experimental", parent: this.props.parent, bannerType: "negative" },
                React.createElement(sui.Icon, { icon: "warning circle" }),
                React.createElement("div", { className: "header" }, lf("You are viewing an experimental version of the editor")),
                React.createElement(sui.Link, { className: "link", ariaLabel: lf("Go back to live editor"), href: liveUrl }, lf("Take me back"))));
        }
        if (showWindowsStoreBanner) {
            var delayTime = 300 * 1000; // 5 minutes
            var displayTime = 20 * 1000; // 20 seconds
            var sleepTime = 24 * 7 * 3600; // 1 week
            return (React.createElement(GenericBanner, { id: "uwp", parent: this.props.parent, delayTime: delayTime, displayTime: displayTime, sleepTime: sleepTime },
                React.createElement(sui.Link, { className: "link", target: "_blank", ariaLabel: lf("View app in the Windows store"), href: targetConfig.windowsStoreLink, onClick: this.handleBannerClick },
                    React.createElement("img", { className: "bannerIcon", src: pxt.Util.pathJoin(pxt.webConfig.commitCdnUrl, "images/windowsstorebag.png"), alt: lf("Windows store logo") })),
                React.createElement(sui.Link, { className: "link", target: "_blank", ariaLabel: lf("View app in the Windows store"), href: targetConfig.windowsStoreLink, onClick: this.handleBannerClick }, lf("Want a faster download? Get the app!"))));
        }
        return React.createElement("div", null);
    };
    return NotificationBanner;
}(data.Component));
exports.NotificationBanner = NotificationBanner;
