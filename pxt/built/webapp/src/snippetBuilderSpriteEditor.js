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
/// <reference path="../../built/pxtlib.d.ts" />
var React = require("react");
var data = require("./data");
var compiler = require("./compiler");
var SPRITE_EDITOR_DEFAULT_HEIGHT = 1023;
var SPRITE_EDITOR_DEFAULT_WIDTH = 2100;
var SpriteEditor = /** @class */ (function (_super) {
    __extends(SpriteEditor, _super);
    function SpriteEditor(props) {
        var _this = _super.call(this, props) || this;
        _this.cleanupSpriteEditor = pxt.Util.debounce(function () {
            // Sprite editor container
            var contentDiv = _this.refs['spriteEditorContainer'];
            _this.updateSpriteState();
            _this.spriteEditor.removeKeyListeners();
            _this.setState({
                firstRender: false,
                spriteEditorActiveColor: _this.spriteEditor.color,
            });
            _this.removeChildrenInNode(contentDiv);
            _this.spriteEditor = undefined;
            _this.renderSpriteEditor();
        }, 500);
        _this.state = {
            firstRender: true,
            spriteEditorActiveColor: 3,
        };
        _this.setScale = _this.setScale.bind(_this);
        _this.cleanupSpriteEditor = _this.cleanupSpriteEditor.bind(_this);
        return _this;
    }
    SpriteEditor.prototype.componentWillUnmount = function () {
        window.removeEventListener('resize', this.setScale);
        this.updateSpriteState();
    };
    SpriteEditor.prototype.componentDidMount = function () {
        var _this = this;
        // Run once to set initial scale
        this.setScale();
        window.addEventListener('resize', this.setScale);
        // Fetches blocksInfo for sprite editor
        compiler
            .getBlocksAsync()
            .then(function (blocksInfo) {
            _this.blocksInfo = blocksInfo;
            _this.renderSpriteEditor();
        });
    };
    SpriteEditor.prototype.setScale = function () {
        var _this = this;
        // Sprite editor default height at scale 1 1023 - full size value
        var height = window.innerHeight;
        // Sprite editor default height at scale 1 2100 - full size value
        var width = window.innerWidth;
        var scale = height > width ? width / SPRITE_EDITOR_DEFAULT_WIDTH : height / SPRITE_EDITOR_DEFAULT_HEIGHT;
        // Minimum resize threshold .81
        if (scale < .61) {
            scale = .61;
        }
        else if (scale > 1) {
            scale = 1;
        }
        // Set new scale and reset sprite editor
        this.setState({ scale: scale }, function () {
            // Ensure that sprite editor has mounted
            if (_this.spriteEditor) {
                _this.cleanupSpriteEditor();
            }
        });
    };
    SpriteEditor.prototype.stripImageLiteralTags = function (imageLiteral) {
        var imgTag = "img`";
        var endQuote = "`";
        if (imageLiteral.includes(imgTag)) {
            return imageLiteral
                .replace(imgTag, '')
                .replace(endQuote, '');
        }
        return imageLiteral;
    };
    SpriteEditor.prototype.updateSpriteState = function () {
        var newSpriteState = pxtsprite
            .bitmapToImageLiteral(this.spriteEditor.bitmap().image, "text" /* Text */);
        this.props.onChange(newSpriteState);
    };
    SpriteEditor.prototype.renderSpriteEditor = function () {
        var _a = this.state, spriteEditorActiveColor = _a.spriteEditorActiveColor, scale = _a.scale;
        var _b = this, blocksInfo = _b.blocksInfo, props = _b.props;
        var value = props.value;
        var stateSprite = value && this.stripImageLiteralTags(value);
        var state = pxtsprite
            .imageLiteralToBitmap('', stateSprite || DEFAULT_SPRITE_STATE);
        // Sprite editor container
        var contentDiv = this.refs['spriteEditorContainer'];
        this.spriteEditor = new pxtsprite.SpriteEditor(state, blocksInfo, false, scale);
        this.spriteEditor.render(contentDiv);
        this.spriteEditor.rePaint();
        // this.spriteEditor.setActiveColor(spriteEditorActiveColor, true);
        this.spriteEditor.color = spriteEditorActiveColor;
        this.spriteEditor.setSidebarColor(spriteEditorActiveColor);
        this.spriteEditor.setSizePresets([
            [8, 8],
            [16, 16],
            [32, 32],
            [10, 8]
        ]);
        contentDiv.style.height = (this.spriteEditor.outerHeight() + 3) + "px";
        contentDiv.style.width = (this.spriteEditor.outerWidth() + 3) + "px";
        contentDiv.style.overflow = "hidden";
        contentDiv.className = 'sprite-editor-dropdown-bg sprite-editor-dropdown';
        this.spriteEditor.addKeyListeners();
        this.spriteEditor.onClose(this.cleanupSpriteEditor);
    };
    SpriteEditor.prototype.removeChildrenInNode = function (node) {
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
    };
    SpriteEditor.prototype.renderCore = function () {
        var scale = this.state.scale;
        return (React.createElement("div", { className: 'snippet-sprite-editor' },
            React.createElement("div", { className: 'sprite-editor-snippet-container', ref: 'spriteEditorContainer', id: 'snippetBuilderSpriteEditorContainer', style: {
                    transformOrigin: "0 0",
                    transform: "scale(" + scale + ")",
                } })));
    };
    return SpriteEditor;
}(data.Component));
exports.SpriteEditor = SpriteEditor;
var DEFAULT_SPRITE_STATE = "\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n. . . . . . . . . . . . . . . .\n";
