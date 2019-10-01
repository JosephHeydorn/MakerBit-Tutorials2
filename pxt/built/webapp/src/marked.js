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
var data = require("./data");
var marked = require("marked");
var MarkedContent = /** @class */ (function (_super) {
    __extends(MarkedContent, _super);
    function MarkedContent() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MarkedContent.clearBlockSnippetCache = function () {
        this.blockSnippetCache = {};
    };
    MarkedContent.prototype.getBuiltinMacros = function () {
        var params = {};
        var theme = pxt.appTarget.appTheme;
        if (theme.boardName)
            params["boardname"] = pxt.Util.htmlEscape(theme.boardName);
        if (theme.boardNickname)
            params["boardnickname"] = pxt.Util.htmlEscape(theme.boardNickname);
        if (theme.driveDisplayName)
            params["drivename"] = pxt.Util.htmlEscape(theme.driveDisplayName);
        if (theme.homeUrl)
            params["homeurl"] = pxt.Util.htmlEscape(theme.homeUrl);
        params["targetid"] = theme.id || "???";
        params["targetname"] = theme.name || "Microsoft MakeCode";
        params["targetlogo"] = theme.docsLogo ? "<img aria-hidden=\"true\" role=\"presentation\" class=\"ui mini image\" src=\"" + theme.docsLogo + "\" />" : "";
        return params;
    };
    MarkedContent.prototype.startRenderLangSnippet = function (langBlock) {
        var preBlock = langBlock.parentElement; // pre parent of the code
        var parentBlock = preBlock.parentElement; // parent containing all text
        var wrapperDiv = document.createElement('div');
        wrapperDiv.className = 'ui segment raised loading';
        parentBlock.insertBefore(wrapperDiv, preBlock);
        parentBlock.removeChild(preBlock);
        return wrapperDiv;
    };
    MarkedContent.prototype.finishRenderLangSnippet = function (wrapperDiv, code) {
        var preDiv = document.createElement('pre');
        preDiv.textContent = code;
        pxt.tutorial.highlight(preDiv);
        wrapperDiv.appendChild(preDiv);
        pxsim.U.removeClass(wrapperDiv, 'loading');
    };
    MarkedContent.prototype.renderSnippets = function (content) {
        var _this = this;
        var parent = this.props.parent;
        pxt.Util.toArray(content.querySelectorAll("code.lang-typescript"))
            .forEach(function (langBlock) {
            var code = langBlock.textContent;
            var wrapperDiv = _this.startRenderLangSnippet(langBlock);
            _this.finishRenderLangSnippet(wrapperDiv, code);
        });
        pxt.Util.toArray(content.querySelectorAll("code.lang-spy"))
            .forEach(function (langBlock) {
            var code = langBlock.textContent;
            var wrapperDiv = _this.startRenderLangSnippet(langBlock);
            if (MarkedContent.blockSnippetCache[code]) {
                _this.finishRenderLangSnippet(wrapperDiv, MarkedContent.blockSnippetCache[code]);
            }
            else {
                parent.renderPythonAsync({
                    type: "pxteditor",
                    action: "renderpython", ts: code
                }).done(function (resp) {
                    MarkedContent.blockSnippetCache[code] = resp.python;
                    _this.finishRenderLangSnippet(wrapperDiv, MarkedContent.blockSnippetCache[code]);
                });
            }
        });
        pxt.Util.toArray(content.querySelectorAll("code.lang-blocks"))
            .forEach(function (langBlock) {
            // Can't use innerHTML here because it escapes certain characters (e.g. < and >)
            // Also can't use innerText because IE strips out the newlines from the code
            // textContent seems to work in all browsers and return the "pure" text
            var code = langBlock.textContent;
            var wrapperDiv = document.createElement('div');
            pxsim.U.clear(langBlock);
            langBlock.appendChild(wrapperDiv);
            wrapperDiv.className = 'ui segment raised loading';
            if (MarkedContent.blockSnippetCache[code]) {
                // Use cache
                var svg = Blockly.Xml.textToDom(pxt.blocks.layout.serializeSvgString(MarkedContent.blockSnippetCache[code]));
                wrapperDiv.appendChild(svg);
                pxsim.U.removeClass(wrapperDiv, 'loading');
            }
            else {
                parent.renderBlocksAsync({
                    type: "pxteditor",
                    action: "renderblocks", ts: code
                })
                    .done(function (resp) {
                    var svg = resp.svg;
                    if (svg) {
                        var viewBox = svg.getAttribute('viewBox').split(' ').map(parseFloat);
                        var width = viewBox[2];
                        var height = viewBox[3];
                        if (width > 480 || height > 128)
                            height = (height * 0.8) | 0;
                        svg.setAttribute('height', height + "px");
                        // SVG serialization is broken on IE (SVG namespace issue), don't cache on IE
                        if (!pxt.BrowserUtils.isIE())
                            MarkedContent.blockSnippetCache[code] = Blockly.Xml.domToText(svg);
                        wrapperDiv.appendChild(svg);
                        pxsim.U.removeClass(wrapperDiv, 'loading');
                    }
                    else {
                        // An error occured, show alternate message
                        var textDiv = document.createElement('span');
                        textDiv.textContent = lf("Oops, something went wrong trying to render this block snippet.");
                        wrapperDiv.appendChild(textDiv);
                        pxsim.U.removeClass(wrapperDiv, 'loading');
                    }
                });
            }
        });
        pxt.Util.toArray(content.querySelectorAll("code.lang-diffblocksxml"))
            .forEach(function (langBlock) {
            // Can't use innerHTML here because it escapes certain characters (e.g. < and >)
            // Also can't use innerText because IE strips out the newlines from the code
            // textContent seems to work in all browsers and return the "pure" text
            var code = langBlock.textContent;
            var xml = langBlock.textContent.split(/-{10,}/);
            var oldXml = xml[0];
            var newXml = xml[1];
            var wrapperDiv = document.createElement('div');
            pxsim.U.clear(langBlock);
            langBlock.appendChild(wrapperDiv);
            pxt.BrowserUtils.loadBlocklyAsync()
                .then(function () {
                var diff = pxt.blocks.diffXml(oldXml, newXml);
                var svg = diff.svg;
                if (svg) {
                    if (svg.tagName == "SVG") {
                        var viewBox = svg.getAttribute('viewBox').split(' ').map(parseFloat);
                        var width = viewBox[2];
                        var height = viewBox[3];
                        if (width > 480 || height > 128)
                            height = (height * 0.8) | 0;
                        svg.setAttribute('height', height + "px");
                    }
                    // SVG serialization is broken on IE (SVG namespace issue), don't cache on IE
                    if (!pxt.BrowserUtils.isIE())
                        MarkedContent.blockSnippetCache[code] = Blockly.Xml.domToText(svg);
                    wrapperDiv.appendChild(svg);
                    pxsim.U.removeClass(wrapperDiv, 'loading');
                }
                else {
                    // An error occured, show alternate message
                    var textDiv = document.createElement('div');
                    textDiv.className = "ui basic segment";
                    textDiv.textContent = diff.message || lf("No changes.");
                    wrapperDiv.appendChild(textDiv);
                    pxsim.U.removeClass(wrapperDiv, 'loading');
                }
            });
        });
    };
    MarkedContent.prototype.renderInlineBlocks = function (content) {
        pxt.Util.toArray(content.querySelectorAll(":not(pre) > code"))
            .forEach(function (inlineBlock) {
            var text = inlineBlock.innerText;
            var mbtn = /^(\|+)([^\|]+)\|+$/.exec(text);
            if (mbtn) {
                var mtxt = /^(([^\:\.]*?)[\:\.])?(.*)$/.exec(mbtn[2]);
                var ns = mtxt[2] ? mtxt[2].trim().toLowerCase() : '';
                var txt = mtxt[3].trim();
                var lev = mbtn[1].length == 1 ?
                    "docs inlinebutton ui button " + pxt.Util.htmlEscape(txt.toLowerCase()) + "-button"
                    : "docs inlineblock " + pxt.Util.htmlEscape(ns);
                var inlineBlockDiv = document.createElement('span');
                pxsim.U.clear(inlineBlock);
                inlineBlock.appendChild(inlineBlockDiv);
                inlineBlockDiv.className = lev;
                inlineBlockDiv.textContent = pxt.U.rlf(txt);
            }
        });
    };
    MarkedContent.prototype.renderOthers = function (content) {
        // remove package blocks
        pxt.Util.toArray(content.querySelectorAll(".lang-package,.lang-config"))
            .forEach(function (langBlock) {
            langBlock.parentNode.removeChild(langBlock);
        });
    };
    MarkedContent.prototype.renderMarkdown = function (markdown) {
        var content = this.refs["marked-content"];
        var pubinfo = this.getBuiltinMacros();
        // replace pre-template in markdown
        markdown = markdown.replace(/@([a-z]+)@/ig, function (m, param) { return pubinfo[param] || 'unknown macro'; });
        // create a custom renderer
        var renderer = new marked.Renderer();
        pxt.docs.setupRenderer(renderer);
        // Set markdown options
        marked.setOptions({
            renderer: renderer,
            sanitize: true
        });
        // Render the markdown and add it to the content div
        /* tslint:disable:no-inner-html (marked content is already sanitized) */
        content.innerHTML = marked(markdown);
        /* tslint:enable:no-inner-html */
        // We'll go through a series of adjustments here, rendering inline blocks, blocks and snippets as needed
        this.renderInlineBlocks(content);
        this.renderSnippets(content);
        this.renderOthers(content);
    };
    MarkedContent.prototype.componentDidMount = function () {
        var markdown = this.props.markdown;
        this.renderMarkdown(markdown);
    };
    MarkedContent.prototype.componentWillReceiveProps = function (newProps) {
        var markdown = newProps.markdown;
        if (this.props.markdown != newProps.markdown) {
            this.renderMarkdown(markdown);
        }
    };
    MarkedContent.prototype.renderCore = function () {
        var className = this.props.className;
        return React.createElement("div", { ref: "marked-content", className: className || "" });
    };
    // Local cache for images, cleared when we create a new project.
    // Stores code => data-uri image of decompiled result
    MarkedContent.blockSnippetCache = {};
    return MarkedContent;
}(data.Component));
exports.MarkedContent = MarkedContent;
