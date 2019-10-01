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
var codecard = require("./codecard");
var sui = require("./sui");
var data = require("./data");
var defaultLanguages = ["en"];
function setInitialLang(lang) {
    exports.initialLang = pxt.Util.normalizeLanguageCode(lang)[0];
}
exports.setInitialLang = setInitialLang;
function getCookieLang() {
    var cookiePropRegex = new RegExp(pxt.Util.escapeForRegex(pxt.Util.pxtLangCookieId) + "=(.*?)(?:;|$)");
    var cookieValue = cookiePropRegex.exec(document.cookie);
    return cookieValue && cookieValue[1] || null;
}
exports.getCookieLang = getCookieLang;
function setCookieLang(langId) {
    if (!pxt.Util.allLanguages[langId]) {
        return;
    }
    if (langId !== getCookieLang()) {
        pxt.tickEvent("menu.lang.setcookielang", { lang: langId });
        var expiration = new Date();
        expiration.setTime(expiration.getTime() + (pxt.Util.langCookieExpirationDays * 24 * 60 * 60 * 1000));
        document.cookie = pxt.Util.pxtLangCookieId + "=" + langId + "; expires=" + expiration.toUTCString();
    }
}
exports.setCookieLang = setCookieLang;
var LanguagePicker = /** @class */ (function (_super) {
    __extends(LanguagePicker, _super);
    function LanguagePicker(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            visible: false
        };
        _this.hide = _this.hide.bind(_this);
        _this.changeLanguage = _this.changeLanguage.bind(_this);
        return _this;
    }
    LanguagePicker.prototype.languageList = function () {
        if (pxt.appTarget.appTheme.selectLanguage && pxt.appTarget.appTheme.availableLocales && pxt.appTarget.appTheme.availableLocales.length) {
            return pxt.appTarget.appTheme.availableLocales;
        }
        return defaultLanguages;
    };
    LanguagePicker.prototype.changeLanguage = function (langId) {
        var _this = this;
        if (!pxt.Util.allLanguages[langId]) {
            return;
        }
        setCookieLang(langId);
        if (langId !== exports.initialLang) {
            pxt.tickEvent("menu.lang.changelang", { lang: langId });
            pxt.winrt.releaseAllDevicesAsync()
                .then(function () {
                _this.props.parent.reloadEditor();
            })
                .done();
        }
        else {
            pxt.tickEvent("menu.lang.samelang", { lang: langId });
            this.hide();
        }
    };
    LanguagePicker.prototype.hide = function () {
        this.setState({ visible: false });
    };
    LanguagePicker.prototype.show = function () {
        this.setState({ visible: true });
    };
    LanguagePicker.prototype.renderCore = function () {
        var _this = this;
        if (!this.state.visible)
            return React.createElement("div", null);
        var targetTheme = pxt.appTarget.appTheme;
        var languageList = this.languageList();
        var modalSize = languageList.length > 4 ? "large" : "small";
        return (React.createElement(sui.Modal, { isOpen: this.state.visible, size: modalSize, onClose: this.hide, dimmer: true, header: lf("Select Language"), closeIcon: true, allowResetFocus: true, closeOnDimmerClick: true, closeOnDocumentClick: true, closeOnEscape: true },
            React.createElement("div", { className: "group" },
                React.createElement("div", { className: "ui cards centered", role: "listbox" }, languageList.map(function (langId) {
                    return React.createElement(LanguageCard, { key: langId, langId: langId, name: pxt.Util.allLanguages[langId].localizedName, ariaLabel: pxt.Util.allLanguages[langId].englishName, description: pxt.Util.allLanguages[langId].englishName, onClick: _this.changeLanguage });
                }))),
            targetTheme.crowdinProject ?
                React.createElement("p", null,
                    React.createElement("br", null),
                    React.createElement("br", null),
                    React.createElement("a", { href: "/translate", target: "_blank", rel: "noopener noreferrer", "aria-label": lf("Help us translate") }, lf("Help us translate"))) : undefined));
    };
    return LanguagePicker;
}(data.Component));
exports.LanguagePicker = LanguagePicker;
var LanguageCard = /** @class */ (function (_super) {
    __extends(LanguageCard, _super);
    function LanguageCard(props) {
        var _this = _super.call(this, props) || this;
        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }
    LanguageCard.prototype.handleClick = function () {
        this.props.onClick(this.props.langId);
    };
    LanguageCard.prototype.renderCore = function () {
        var _a = this.props, name = _a.name, ariaLabel = _a.ariaLabel, description = _a.description;
        return React.createElement(codecard.CodeCardView, { className: "card-selected", name: name, ariaLabel: ariaLabel, role: "link", description: description, onClick: this.handleClick });
    };
    return LanguageCard;
}(sui.StatelessUIElement));
