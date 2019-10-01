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
var sui = require("./sui");
var data = require("./data");
var repeat = pxt.Util.repeatMap;
var CodeCardView = /** @class */ (function (_super) {
    __extends(CodeCardView, _super);
    function CodeCardView(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {};
        return _this;
    }
    CodeCardView.setupIntersectionObserver = function () {
        var _this = this;
        if (this.observer)
            return;
        // setup intersection observer for the image
        var preloadImage = function (el) {
            var lazyImageUrl = el.getAttribute('data-src');
            el.style.backgroundImage = "url(" + lazyImageUrl + ")";
        };
        var config = {
            // If the image gets within 50px in the Y axis, start the download.
            rootMargin: '50px 0px',
            threshold: 0.01
        };
        var onIntersection = function (entries) {
            entries.forEach(function (entry) {
                // Are we in viewport?
                if (entry.intersectionRatio > 0) {
                    // Stop watching and load the image
                    _this.observer.unobserve(entry.target);
                    preloadImage(entry.target);
                }
            });
        };
        this.observer = new IntersectionObserver(onIntersection, config);
    };
    CodeCardView.prototype.componentDidMount = function () {
        var lazyImage = this.refs.lazyimage;
        if (!lazyImage)
            return;
        if (!('IntersectionObserver' in window)) {
            // No intersection observer support, set the image url immediately
            var lazyImageUrl = lazyImage.getAttribute('data-src');
            lazyImage.style.backgroundImage = "url(" + lazyImageUrl + ")";
        }
        else {
            CodeCardView.setupIntersectionObserver();
            CodeCardView.observer.observe(lazyImage);
        }
    };
    CodeCardView.prototype.renderCore = function () {
        var card = this.props;
        var color = card.color || "";
        if (!color) {
            if (card.hardware && !card.software)
                color = 'black';
            else if (card.software && !card.hardware)
                color = 'teal';
        }
        var renderMd = function (md) { return md.replace(/`/g, ''); };
        var url = card.url ? /^[^:]+:\/\//.test(card.url) ? card.url : ('/' + card.url.replace(/^\.?\/?/, ''))
            : undefined;
        var sideUrl = url && /^\//.test(url) ? "#doc:" + url : url;
        var className = card.className;
        var cardType = card.cardType;
        var tutorialDone = card.tutorialLength == card.tutorialStep + 1;
        var ariaLabel = card.ariaLabel || card.title || card.shortName || card.name;
        var descriptions = card && card.description && card.description.split("\n");
        var clickHandler = card.onClick ? function (e) {
            if (e.target && e.target.tagName == "A")
                return;
            pxt.analytics.enableCookies();
            card.onClick(e);
        } : undefined;
        var imageUrl = card.imageUrl || (card.youTubeId ? "https://img.youtube.com/vi/" + card.youTubeId + "/0.jpg" : undefined);
        var cardDiv = React.createElement("div", { className: "ui card " + color + " " + (card.onClick ? "link" : '') + " " + (className ? className : ''), role: card.role, "aria-selected": card.role === "option" ? "true" : undefined, "aria-label": ariaLabel, title: card.title, onClick: clickHandler, tabIndex: card.onClick ? card.tabIndex || 0 : null, onKeyDown: card.onClick ? sui.fireClickOnEnter : null },
            card.header || card.blocks || card.javascript || card.hardware || card.software || card.any ?
                React.createElement("div", { key: "header", className: "ui content " + (card.responsive ? " tall desktop only" : "") },
                    React.createElement("div", { className: "right floated meta" },
                        card.any ? (React.createElement(sui.Icon, { key: "costany", icon: "ui grey circular label tiny" },
                            card.any > 0 ? card.any : null,
                            " ")) : null,
                        repeat(card.blocks, function (k) { return React.createElement(sui.Icon, { key: "costblocks" + k, icon: "puzzle orange" }); }),
                        repeat(card.javascript, function (k) { return React.createElement(sui.Icon, { key: "costjs" + k, icon: "align left blue" }); }),
                        repeat(card.hardware, function (k) { return React.createElement(sui.Icon, { key: "costhardware" + k, icon: "certificate black" }); }),
                        repeat(card.software, function (k) { return React.createElement(sui.Icon, { key: "costsoftware" + k, icon: "square teal" }); })),
                    card.header) : null,
            card.label || card.labelIcon || card.blocksXml || card.typeScript || imageUrl || cardType == "file" ? React.createElement("div", { className: "ui image" },
                card.label || card.labelIcon ?
                    React.createElement("label", { role: card.onLabelClicked ? 'button' : undefined, onClick: card.onLabelClicked, className: "ui " + (card.labelClass ? card.labelClass : "orange right ribbon") + " label", "aria-label": ariaLabel + " " + (card.onLabelClicked ? "button" : "label") }, card.labelIcon ? React.createElement(sui.Icon, { icon: card.labelIcon }) : card.label) : undefined,
                card.typeScript ? React.createElement("pre", { key: "promots" }, card.typeScript) : undefined,
                card.cardType != "file" && imageUrl ? React.createElement("div", { className: "ui imagewrapper", "aria-hidden": true, role: "presentation" },
                    React.createElement("div", { className: "ui cardimage", "data-src": imageUrl, ref: "lazyimage" })) : undefined,
                card.cardType == "file" && !imageUrl ? React.createElement("div", { className: "ui fileimage" }) : undefined,
                card.cardType == "file" && imageUrl ? React.createElement("div", { className: "ui fileimage", "data-src": imageUrl, ref: "lazyimage" }) : undefined) : undefined,
            card.icon || card.iconContent ?
                React.createElement("div", { className: "ui imagewrapper", "aria-hidden": true, role: "presentation" },
                    React.createElement("div", { className: "ui button massive fluid " + card.iconColor + " " + (card.iconContent ? "iconcontent" : "") },
                        card.icon ? React.createElement(sui.Icon, { icon: "" + ('icon ' + card.icon) }) : undefined,
                        card.iconContent || undefined)) : undefined,
            (card.shortName || card.name || descriptions) ?
                React.createElement("div", { className: "content" },
                    card.shortName || card.name ? React.createElement("div", { className: "header" }, card.shortName || card.name) : null,
                    descriptions && descriptions.map(function (element, index) {
                        return React.createElement("div", { key: "line" + index, className: "description tall " + (card.icon || card.iconContent || card.imageUrl ? "" : "long") }, renderMd(element));
                    })) : undefined,
            card.time ? React.createElement("div", { className: "meta" },
                card.tutorialLength ? React.createElement("span", { className: "ui tutorial-progress " + (tutorialDone ? "green" : "orange") + " left floated label" },
                    React.createElement("i", { className: (tutorialDone ? "trophy" : "circle") + " icon" }),
                    "\u00A0",
                    lf("{0}/{1}", (card.tutorialStep || 0) + 1, card.tutorialLength)) : undefined,
                card.time ? React.createElement("span", { key: "date", className: "date" }, pxt.Util.timeSince(card.time)) : null) : undefined,
            card.extracontent || card.learnMoreUrl || card.buyUrl || card.feedbackUrl ?
                React.createElement("div", { className: "ui extra content mobile hide" },
                    card.extracontent,
                    card.buyUrl ?
                        React.createElement("a", { className: "learnmore left floated", href: card.buyUrl, "aria-label": lf("Buy"), target: "_blank", rel: "noopener noreferrer" }, lf("Buy")) : undefined,
                    card.learnMoreUrl ?
                        React.createElement("a", { className: "learnmore right floated", href: card.learnMoreUrl, "aria-label": lf("Learn more"), target: "_blank", rel: "noopener noreferrer" }, lf("Learn more")) : undefined,
                    card.feedbackUrl ?
                        React.createElement("a", { className: "learnmore right floated", href: card.feedbackUrl, "aria-label": lf("Feedback"), target: "_blank", rel: "noopener noreferrer" }, lf("Feedback")) : undefined) : undefined);
        if (!card.onClick && url) {
            return (React.createElement("div", null,
                React.createElement("a", { href: url, target: "docs", className: "ui widedesktop hide" }, cardDiv),
                React.createElement("a", { href: sideUrl, className: "ui widedesktop only" }, cardDiv)));
        }
        else {
            return (cardDiv);
        }
    };
    return CodeCardView;
}(data.Component));
exports.CodeCardView = CodeCardView;
